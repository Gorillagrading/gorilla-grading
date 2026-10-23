import { sql } from 'drizzle-orm';
import Stripe from 'stripe';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { custodyEvents, orders, payments, webhookEvents } from '../db/schema.js';
import { createStripeGateway } from './payments/gateway.js';
import { createFakePayments, createTestApp, createTestDb, insertAllTiers, insertUser, type TestDb } from './testing.js';

const read = (res: Response) => res.json() as Promise<any>;

let db: TestDb;
let t: ReturnType<typeof createTestApp>;
let fake: ReturnType<typeof createFakePayments>;
const cookies = new Map<string, string>();

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(
    sql`truncate users, orders, service_tiers, otp_challenges, sessions, rate_limit_events, consents, email_outbox, audit_logs, webhook_events restart identity cascade`,
  );
  await insertAllTiers(db);
  cookies.clear();
  fake = createFakePayments();
  t = createTestApp(db, { payments: fake.gateway });
  for (const [email, role] of [['staff@lab.test', 'staff'], ['admin@lab.test', 'admin']] as const) {
    await insertUser(db, email, role);
    await loginAs(email);
  }
});

async function loginAs(email: string) {
  await t.json('/api/v1/auth/otp', { email });
  const res = await t.json('/api/v1/auth/otp/verify', { email, code: t.sent.at(-1)!.code });
  cookies.set(email, res.headers.get('set-cookie')!.split(';')[0]);
}

const api = (path: string, email?: string, init: { method?: string; body?: unknown; headers?: Record<string, string>; raw?: string } = {}) =>
  t.app.request(`/api/v1${path}`, {
    method: init.method ?? (init.body !== undefined || init.raw !== undefined ? 'POST' : 'GET'),
    headers: {
      ...(email && { cookie: cookies.get(email)! }),
      ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
    body: init.raw ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
  });

/** 12 cartas Standard (descuento del 5 %) con devolución por mensajería. */
async function placeOrder(email = 'cliente@example.com') {
  if (!cookies.has(email)) await loginAs(email);
  const res = await api('/orders', email, {
    body: {
      items: Array.from({ length: 12 }, (_, i) => ({ tier: 'standard', cardName: `Carta ${i + 1}`, game: 'Pokemon', declaredValueCents: 10_000 })),
      shippingMethod: 'COURIER_INSURED',
      fullName: 'Carla Cliente',
      shippingAddress: { line1: 'Calle Secreta 7', city: 'Madrid', postalCode: '28001', countryCode: 'ES' },
      locale: 'es',
      clientToken: `token-${Math.random().toString(36).slice(2)}-0000`,
      acceptedTerms: true,
      confirmedDeclaredValues: true,
    },
  });
  return { res, body: await read(res) };
}

const webhook = (event: object, signature = 'firma-valida') =>
  api('/payments/stripe/webhook', undefined, { raw: JSON.stringify(event), headers: { 'stripe-signature': signature, 'content-type': 'application/json' } });

const completed = (sessionId: string, orderCode: string, id = `evt_${Math.random().toString(36).slice(2)}`) => ({
  id,
  type: 'checkout.session.completed',
  object: { id: sessionId, payment_status: 'paid', payment_intent: 'pi_test_1', amount_total: 0, metadata: { orderCode }, client_reference_id: orderCode },
});

describe('enviar un pedido con el cobro activado', () => {
  it('el pedido queda pendiente de pago y se abre la página de pago con su desglose', async () => {
    const { res, body } = await placeOrder();
    expect(res.status).toBe(201);
    const { order } = body;
    expect(order).toMatchObject({ status: 'PAYMENT_PENDING', paymentStatus: 'pending', checkoutUrl: 'https://checkout.stripe.test/cs_test_1' });

    const [session] = fake.sessions;
    expect(session).toMatchObject({ orderCode: order.code, email: 'cliente@example.com', locale: 'es' });
    expect(session.successUrl).toBe(`https://gorilla-grading.vercel.app/track?code=${order.code}&payment=success`);
    expect(session.cancelUrl).toBe(`https://gorilla-grading.vercel.app/track?code=${order.code}&payment=cancelled`);
    // 12 × 18,05 € (19 € con un 5 %) + 14,50 € de devolución = lo mismo que se cobra.
    expect(session.lines).toEqual([
      { name: 'Servicio Standard', unitCents: 1805, quantity: 12 },
      { name: 'Devolución por mensajería asegurada', unitCents: 1450, quantity: 1 },
    ]);
    expect(session.lines.reduce((s, l) => s + l.unitCents * l.quantity, 0)).toBe(order.totalCents);

    const [payment] = await db.select().from(payments);
    expect(payment).toMatchObject({ checkoutSessionId: 'cs_test_1', amountCents: order.totalCents, status: 'pending' });
  });

  it('todavía no se manda el correo de "pedido registrado" ni se puede recibir en el laboratorio', async () => {
    const { body } = await placeOrder();
    expect(t.mails).toHaveLength(0);
    const [event] = await db.select().from(custodyEvents);
    expect(event).toMatchObject({ toStatus: 'PAYMENT_PENDING', publicLabel: 'Pendiente de pago' });

    const move = await api(`/admin/orders/${body.order.code}/transitions`, 'staff@lab.test', { body: { to: 'PACKAGE_RECEIVED', expectedStatus: 'PAYMENT_PENDING' } });
    expect(move.status).toBe(409);
    expect(await read(move)).toMatchObject({ code: 'invalid_transition' });
  });

  it('si Stripe falla, el pedido se crea igualmente y se puede pagar después', async () => {
    fake.state.fail = true;
    const { res, body } = await placeOrder();
    expect(res.status).toBe(201);
    expect(body.order).toMatchObject({ status: 'PAYMENT_PENDING', checkoutUrl: null });

    fake.state.fail = false;
    const retry = await api(`/orders/${body.order.code}/checkout`, 'cliente@example.com', { body: {} });
    expect(retry.status).toBe(200);
    expect((await read(retry)).checkoutUrl).toBe('https://checkout.stripe.test/cs_test_1');
  });

  it('enviar dos veces el mismo pedido no crea dos pedidos', async () => {
    await loginAs('cliente@example.com');
    const body = {
      items: [{ tier: 'standard', cardName: 'Charizard', game: 'Pokemon', declaredValueCents: 10_000 }],
      shippingMethod: 'CARD_SHOW_DROPOFF', fullName: 'Carla', locale: 'es', clientToken: 'token-repetido-0000',
      acceptedTerms: true, confirmedDeclaredValues: true,
    };
    const first = await read(await api('/orders', 'cliente@example.com', { body }));
    const second = await api('/orders', 'cliente@example.com', { body });
    expect(second.status).toBe(200);
    expect((await read(second)).order).toMatchObject({ code: first.order.code, status: 'PAYMENT_PENDING', alreadyExisted: true });
    expect(await db.select().from(orders)).toHaveLength(1);
  });
});

describe('avisos de Stripe', () => {
  it('al confirmarse el pago, el pedido queda registrado, pagado y se avisa al cliente', async () => {
    const { body } = await placeOrder();
    const code = body.order.code;
    const res = await webhook(completed('cs_test_1', code));
    expect(res.status).toBe(200);
    expect(await read(res)).toMatchObject({ received: true, result: 'processed' });

    const [order] = await db.select().from(orders);
    expect(order).toMatchObject({ status: 'SUBMITTED', paymentStatus: 'paid' });
    const [payment] = await db.select().from(payments);
    expect(payment).toMatchObject({ status: 'paid', paymentIntentId: 'pi_test_1' });
    const events = await db.select().from(custodyEvents).orderBy(custodyEvents.createdAt);
    expect(events.map((e) => e.toStatus)).toEqual(['PAYMENT_PENDING', 'SUBMITTED']);
    expect(events[1].publicLabel).toBe('Pedido registrado');
    expect(t.mails.map((m) => m.subject)).toEqual([`Hemos registrado tu pedido ${code}`]);

    // Ya pagado: el laboratorio puede recibirlo y no se puede volver a pagar.
    expect((await api(`/admin/orders/${code}/transitions`, 'staff@lab.test', { body: { to: 'PACKAGE_RECEIVED', expectedStatus: 'SUBMITTED' } })).status).toBe(200);
    expect(await read(await api(`/orders/${code}/checkout`, 'cliente@example.com', { body: {} }))).toMatchObject({ code: 'nothing_to_pay' });
  });

  it('un aviso repetido se procesa una sola vez', async () => {
    const { body } = await placeOrder();
    const event = completed('cs_test_1', body.order.code, 'evt_repetido');
    await webhook(event);
    const again = await webhook(event);
    expect(await read(again)).toMatchObject({ result: 'duplicate' });
    expect(await db.select().from(custodyEvents)).toHaveLength(2);
    expect(t.mails).toHaveLength(1);
    expect(await db.select().from(webhookEvents)).toHaveLength(1);
  });

  it('un aviso con la firma mal no cambia nada', async () => {
    const { body } = await placeOrder();
    const res = await webhook(completed('cs_test_1', body.order.code), 'firma-falsa');
    expect(res.status).toBe(400);
    expect(await read(res)).toMatchObject({ code: 'invalid_signature' });
    expect((await db.select().from(orders))[0].status).toBe('PAYMENT_PENDING');
    expect(await db.select().from(webhookEvents)).toHaveLength(0);
  });

  it('una página de pago caducada deja el pedido pendiente; el cliente puede volver a pagar', async () => {
    const { body } = await placeOrder();
    const code = body.order.code;
    await webhook({ id: 'evt_exp', type: 'checkout.session.expired', object: { id: 'cs_test_1' } });
    expect((await db.select().from(payments))[0].status).toBe('failed');
    expect((await db.select().from(orders))[0]).toMatchObject({ status: 'PAYMENT_PENDING', paymentStatus: 'pending' });

    const retry = await read(await api(`/orders/${code}/checkout`, 'cliente@example.com', { body: {} }));
    expect(retry.checkoutUrl).toBe('https://checkout.stripe.test/cs_test_2');
    await webhook(completed('cs_test_2', code));
    expect((await db.select().from(orders))[0]).toMatchObject({ status: 'SUBMITTED', paymentStatus: 'paid' });
  });

  it('solo el dueño puede pagar su pedido', async () => {
    const { body } = await placeOrder();
    await loginAs('otro@example.com');
    expect((await api(`/orders/${body.order.code}/checkout`, 'otro@example.com', { body: {} })).status).toBe(404);
    expect((await api(`/orders/${body.order.code}/checkout`, undefined, { body: {} })).status).toBe(401);
  });

  it('una devolución hecha en Stripe se refleja en el pedido', async () => {
    const { body } = await placeOrder();
    await webhook(completed('cs_test_1', body.order.code));
    await webhook({ id: 'evt_ref', type: 'charge.refunded', object: { payment_intent: 'pi_test_1', amount: body.order.totalCents, amount_refunded: 1450 } });
    expect((await db.select().from(orders))[0].paymentStatus).toBe('partially_refunded');
    await webhook({ id: 'evt_ref2', type: 'charge.refunded', object: { payment_intent: 'pi_test_1', amount: body.order.totalCents, amount_refunded: body.order.totalCents } });
    expect((await db.select().from(orders))[0].paymentStatus).toBe('refunded');
  });

  it('un admin puede cancelar un pedido que nunca se pagó', async () => {
    const { body } = await placeOrder();
    const res = await api(`/admin/orders/${body.order.code}/transitions`, 'admin@lab.test', {
      body: { to: 'CANCELLED', expectedStatus: 'PAYMENT_PENDING', internalNote: 'Pago abandonado' },
    });
    expect(res.status).toBe(200);
    // Si llegara a pagarse después, el pedido sigue cancelado y queda anotado para devolver el dinero.
    await webhook(completed('cs_test_1', body.order.code));
    expect((await db.select().from(orders))[0]).toMatchObject({ status: 'CANCELLED', paymentStatus: 'paid' });
  });

  it('los avisos que no nos interesan se aceptan y se ignoran', async () => {
    const res = await webhook({ id: 'evt_x', type: 'customer.created', object: {} });
    expect(await read(res)).toMatchObject({ result: 'ignored' });
  });
});

describe('sin cobro configurado', () => {
  it('el pedido se registra directamente, como en desarrollo', async () => {
    t = createTestApp(db);
    await loginAs('cliente@example.com');
    const { body } = await placeOrder();
    expect(body.order).toMatchObject({ status: 'SUBMITTED', paymentStatus: 'unpaid', checkoutUrl: null });
    expect((await api('/payments/stripe/webhook', undefined, { raw: '{}' })).status).toBe(503);
  });
});

describe('firma real de Stripe', () => {
  const secret = 'whsec_prueba_local';
  const gateway = createStripeGateway('sk_test_ficticia', secret);
  const helper = new Stripe('sk_test_ficticia');

  it('acepta un aviso firmado con el secreto y rechaza uno manipulado', () => {
    const payload = JSON.stringify({ id: 'evt_1', object: 'event', type: 'checkout.session.completed', data: { object: { id: 'cs_1', payment_status: 'paid' } } });
    const header = helper.webhooks.generateTestHeaderString({ payload, secret });
    const event = gateway.parseWebhook(payload, header);
    expect(event).toMatchObject({ id: 'evt_1', type: 'checkout.session.completed', object: { id: 'cs_1' } });

    expect(() => gateway.parseWebhook(payload.replace('paid', 'unpaid'), header)).toThrowError(expect.objectContaining({ code: 'invalid_signature' }));
    expect(() => gateway.parseWebhook(payload, undefined)).toThrowError(expect.objectContaining({ code: 'invalid_signature' }));
    const other = helper.webhooks.generateTestHeaderString({ payload, secret: 'whsec_otro' });
    expect(() => gateway.parseWebhook(payload, other)).toThrowError(expect.objectContaining({ code: 'invalid_signature' }));
  });

  it('sin secreto configurado no acepta avisos', () => {
    expect(() => createStripeGateway('sk_test_ficticia', undefined).parseWebhook('{}', 't=1,v1=x')).toThrowError(
      expect.objectContaining({ code: 'webhook_unavailable' }),
    );
  });
});


describe('pagos y recibos del cliente', () => {
  it('lista los pagos cobrados con su recibo de Stripe, sin los pendientes', async () => {
    const first = (await placeOrder()).body.order;
    await placeOrder(); // pendiente de pago: no aparece
    await webhook(completed('cs_test_1', first.code));

    const res = await api('/me/payments', 'cliente@example.com');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    const { payments: list } = await read(res);
    expect(list).toEqual([
      {
        orderCode: first.code,
        amountCents: first.totalCents,
        currency: 'EUR',
        status: 'paid',
        paidAt: expect.any(String),
        receiptUrl: 'https://pay.stripe.test/receipts/pi_test_1',
        // 12 cartas Standard con el 5 % de descuento (18,05 € cada una) y la devolución: 231,10 €.
        lines: [{ tierName: 'Standard', quantity: 12, unitCents: 1805 }],
        breakdown: { insuranceCents: 0, shippingCents: 1450, baseCents: first.totalCents - 4011, vatCents: 4011, totalCents: first.totalCents },
        customer: { name: 'Carla Cliente', email: 'cliente@example.com' },
      },
    ]);
  });

  it('si el recibo no llegó al cobrar, se pide al listar', async () => {
    const order = (await placeOrder()).body.order;
    fake.state.fail = true;
    await webhook(completed('cs_test_1', order.code));
    expect((await db.select().from(payments))[0].receiptUrl).toBeNull();

    fake.state.fail = false;
    const { payments: list } = await read(await api('/me/payments', 'cliente@example.com'));
    expect(list[0].receiptUrl).toBe('https://pay.stripe.test/receipts/pi_test_1');
    expect((await db.select().from(payments))[0].receiptUrl).toBe('https://pay.stripe.test/receipts/pi_test_1');
  });

  it('una devolución sigue apareciendo, con su estado', async () => {
    const order = (await placeOrder()).body.order;
    await webhook(completed('cs_test_1', order.code));
    await webhook({ id: 'evt_r', type: 'charge.refunded', object: { payment_intent: 'pi_test_1', amount: order.totalCents, amount_refunded: order.totalCents } });
    const { payments: list } = await read(await api('/me/payments', 'cliente@example.com'));
    expect(list[0]).toMatchObject({ status: 'refunded' });
  });

  it('cada cliente ve solo sus pagos, y hace falta sesión', async () => {
    const order = (await placeOrder()).body.order;
    await webhook(completed('cs_test_1', order.code));
    await loginAs('otro@example.com');
    expect((await read(await api('/me/payments', 'otro@example.com'))).payments).toEqual([]);
    expect((await api('/me/payments')).status).toBe(401);
  });
});
