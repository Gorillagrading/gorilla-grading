import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  addresses, consents, custodyEvents, emailOutbox, orderItems, orders, serviceTiers, users,
} from '../db/schema.js';
import { ORDER_CODE } from '../shared/codes.js';
import { createTestApp, createTestDb, insertAllTiers, type TestDb } from './testing.js';

const read = (res: Response) => res.json() as Promise<any>;

let db: TestDb;
let t: ReturnType<typeof createTestApp>;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(
    sql`truncate users, orders, service_tiers, otp_challenges, sessions, rate_limit_events, consents, email_outbox restart identity cascade`,
  );
  await insertAllTiers(db);
  t = createTestApp(db);
});

async function loginAs(email: string) {
  await t.json('/api/v1/auth/otp', { email });
  const res = await t.json('/api/v1/auth/otp/verify', { email, code: t.sent.at(-1)!.code });
  return res.headers.get('set-cookie')!.split(';')[0];
}

const submit = (body: unknown, cookie?: string) =>
  t.json('/api/v1/orders', body, cookie ? { cookie } : {});

const card = (over: Record<string, unknown> = {}) => ({
  tier: 'standard', cardName: 'Charizard Holo', game: 'Pokemon', setName: 'Base Set', declaredValueCents: 45_000, ...over,
});

const orderBody = (over: Record<string, unknown> = {}) => ({
  items: [card()],
  shippingMethod: 'COURIER_INSURED',
  fullName: 'Ana Pérez',
  shippingAddress: { line1: 'Calle Gran Vía 42', city: 'Madrid', postalCode: '28001', countryCode: 'ES', phone: '+34600000000' },
  locale: 'es',
  clientToken: 'token-de-prueba-0001',
  acceptedTerms: true,
  confirmedDeclaredValues: true,
  ...over,
});

describe('POST /quotes', () => {
  it('es público y calcula el total', async () => {
    const res = await t.json('/api/v1/quotes', { items: [{ tier: 'standard', declaredValueCents: 45_000 }], shippingMethod: 'COURIER_INSURED' });
    expect(res.status).toBe(200);
    const { quote, issues } = await read(res);
    expect(issues).toEqual([]);
    expect(quote).toMatchObject({ subtotalCents: 1900, shippingCents: 1450, totalCents: 3350, insuranceCents: 0, vatBaseCents: 2769, vatCents: 581 });
  });

  it('devuelve el precio y además los avisos cuando el valor supera el límite', async () => {
    const res = await t.json('/api/v1/quotes', { items: [{ tier: 'standard', declaredValueCents: 850_000 }], shippingMethod: 'COURIER_INSURED' });
    expect(res.status).toBe(200);
    const { quote, issues } = await read(res);
    expect(quote.totalCents).toBe(3350);
    expect(issues).toEqual([
      { code: 'declared_value_exceeds_limit', index: 0, tier: 'standard', maxCents: 50_000, declaredValueCents: 850_000 },
    ]);
  });

  it('usa el precio vigente de la base de datos', async () => {
    await db.update(serviceTiers).set({ priceCents: 2100 }).where(eq(serviceTiers.code, 'standard'));
    const { quote } = await read(await t.json('/api/v1/quotes', { items: [{ tier: 'standard', declaredValueCents: 1000 }], shippingMethod: 'CARD_SHOW_DROPOFF' }));
    expect(quote.totalCents).toBe(2100);
  });

  it('rechaza datos mal formados con 422', async () => {
    for (const body of [
      { items: [], shippingMethod: 'COURIER_INSURED' },
      { items: [{ tier: 'standard', declaredValueCents: 1000 }], shippingMethod: 'VAULT_STORE' },
      { items: [{ tier: 'standard', declaredValueCents: 10.5 }], shippingMethod: 'COURIER_INSURED' },
      { items: [{ tier: 'standard', declaredValueCents: -1 }], shippingMethod: 'COURIER_INSURED' },
      { items: Array.from({ length: 501 }, () => ({ tier: 'standard', declaredValueCents: 1000 })), shippingMethod: 'COURIER_INSURED' },
    ]) {
      expect((await t.json('/api/v1/quotes', body)).status).toBe(422);
    }
  });
});

describe('POST /orders: quién puede enviar', () => {
  it('exige sesión', async () => {
    expect((await submit(orderBody())).status).toBe(401);
    expect(await db.select().from(orders)).toHaveLength(0);
  });

  it('rechaza un envío de otro origen', async () => {
    const cookie = await loginAs('ana@example.com');
    const res = await t.json('/api/v1/orders', orderBody(), { cookie, origin: 'https://sitio-malicioso.example' });
    expect(res.status).toBe(403);
  });
});

describe('POST /orders: crear el pedido', () => {
  it('crea un pedido enviado y sin pagar, con código GGI-ORD', async () => {
    const cookie = await loginAs('ana@example.com');
    const res = await submit(orderBody(), cookie);
    expect(res.status).toBe(201);
    const { order } = await read(res);
    expect(order.code).toMatch(ORDER_CODE);
    expect(order).toMatchObject({ status: 'SUBMITTED', paymentStatus: 'unpaid', itemCount: 1, totalCents: 3350, shippingMethod: 'COURIER_INSURED', alreadyExisted: false });

    const [row] = await db.select().from(orders);
    expect(row).toMatchObject({
      code: order.code, status: 'SUBMITTED', paymentStatus: 'unpaid', shippingMethod: 'COURIER_INSURED',
      subtotalCents: 1900, insuranceCents: 0, shippingCents: 1450, taxCents: 581, totalCents: 3350, currency: 'EUR',
    });
    expect(row.submittedAt).not.toBeNull();
    expect(row.shippingAddress).toMatchObject({ fullName: 'Ana Pérez', line1: 'Calle Gran Vía 42', city: 'Madrid', countryCode: 'ES' });
  });

  it('guarda las cartas con el precio y el límite fijados', async () => {
    const cookie = await loginAs('ana@example.com');
    await submit(orderBody({ items: [card(), card({ cardName: 'Gengar VMAX', declaredValueCents: 38_000, year: 2021, language: 'English', notes: 'Esquina marcada' })] }), cookie);
    const items = await db.select().from(orderItems).orderBy(orderItems.position);
    expect(items.map((i) => [i.position, i.cardName, i.unitPriceCents, i.maxDeclaredValueCents, i.declaredValueCents])).toEqual([
      [1, 'Charizard Holo', 1900, 50_000, 45_000],
      [2, 'Gengar VMAX', 1900, 50_000, 38_000],
    ]);
    expect(items[1]).toMatchObject({ year: 2021, language: 'English', notes: 'Esquina marcada', setName: 'Base Set' });
  });

  it('el precio lo pone el servidor: lo que envíe el navegador se ignora', async () => {
    const cookie = await loginAs('ana@example.com');
    const body = { ...orderBody(), totalCents: 1, subtotalCents: 1, shippingCents: 0, items: [{ ...card(), unitPriceCents: 1, priceCents: 1 }] };
    const { order } = await read(await submit(body, cookie));
    expect(order.totalCents).toBe(3350);
    const [item] = await db.select().from(orderItems);
    expect(item.unitPriceCents).toBe(1900);
  });

  it('un cambio de tarifas posterior no altera un pedido ya enviado', async () => {
    const cookie = await loginAs('ana@example.com');
    const { order } = await read(await submit(orderBody(), cookie));
    await db.update(serviceTiers).set({ priceCents: 9900, maxDeclaredValueCents: 1000 }).where(eq(serviceTiers.code, 'standard'));
    const [row] = await db.select().from(orders).where(eq(orders.code, order.code));
    const [item] = await db.select().from(orderItems);
    expect(row.totalCents).toBe(3350);
    expect(item).toMatchObject({ unitPriceCents: 1900, maxDeclaredValueCents: 50_000 });
  });

  it('aplica el descuento por volumen a cada carta', async () => {
    const cookie = await loginAs('ana@example.com');
    const items = Array.from({ length: 10 }, (_, i) => card({ cardName: `Carta ${i + 1}` }));
    const { order } = await read(await submit(orderBody({ items }), cookie));
    expect(order.totalCents).toBe(10 * 1805 + 1450);
    const rows = await db.select().from(orderItems);
    expect(rows.every((r) => r.unitPriceCents === 1805)).toBe(true);
  });

  it('registra el pedido en la custodia, deja el email en cola y guarda los consentimientos', async () => {
    const cookie = await loginAs('ana@example.com');
    const { order } = await read(await submit(orderBody(), cookie));

    const [event] = await db.select().from(custodyEvents);
    expect(event).toMatchObject({ toStatus: 'SUBMITTED', publicLabel: 'Pedido registrado' });
    expect(event.internalNote).toBeNull();

    const [mail] = await db.select().from(emailOutbox);
    expect(mail).toMatchObject({ toEmail: 'ana@example.com', template: 'order_submitted', status: 'sent', dedupeKey: `order:${order.code}:submitted` });
    expect(mail.data).toMatchObject({ orderCode: order.code, totalCents: 3350 });

    const accepted = await db.select().from(consents);
    expect(accepted.map((c) => c.kind).sort()).toEqual(['privacy', 'terms']);
    expect(accepted.every((c) => c.granted && c.version === '2026-10-20')).toBe(true);
  });

  it('el texto de la custodia sigue el idioma de la persona', async () => {
    const cookie = await loginAs('ana@example.com');
    await submit(orderBody({ locale: 'en' }), cookie);
    expect((await db.select().from(custodyEvents))[0].publicLabel).toBe('Order registered');
  });

  it('guarda el nombre y la dirección en la cuenta, sin pisar un nombre que ya existía', async () => {
    const cookie = await loginAs('ana@example.com');
    await submit(orderBody(), cookie);
    expect((await db.select().from(users))[0].fullName).toBe('Ana Pérez');
    const [address] = await db.select().from(addresses);
    expect(address).toMatchObject({ line1: 'Calle Gran Vía 42', postalCode: '28001', isDefault: true });

    await submit(orderBody({ fullName: 'Otro Nombre', clientToken: 'token-de-prueba-0002' }), cookie);
    expect((await db.select().from(users))[0].fullName).toBe('Ana Pérez');
    expect(await db.select().from(addresses)).toHaveLength(1);
  });

  it('el dueño del pedido es siempre quien tiene la sesión', async () => {
    const cookie = await loginAs('ana@example.com');
    await submit({ ...orderBody(), userId: 'otra-persona', email: 'victima@example.com' }, cookie);
    const [row] = await db.select().from(orders);
    const [owner] = await db.select().from(users).where(eq(users.id, row.userId));
    expect(owner.email).toBe('ana@example.com');
  });
});

describe('POST /orders: reintentos y duplicados', () => {
  it('enviar dos veces el mismo pedido no crea otro', async () => {
    const cookie = await loginAs('ana@example.com');
    const first = await read(await submit(orderBody(), cookie));
    const secondRes = await submit(orderBody(), cookie);
    expect(secondRes.status).toBe(200);
    const second = await read(secondRes);
    expect(second.order).toMatchObject({ code: first.order.code, alreadyExisted: true, itemCount: 1, totalCents: 3350 });
    expect(await db.select().from(orders)).toHaveLength(1);
    expect(await db.select().from(custodyEvents)).toHaveLength(1);
    expect(await db.select().from(emailOutbox)).toHaveLength(1);
  });

  it('un pedido distinto tiene su propio código', async () => {
    const cookie = await loginAs('ana@example.com');
    const a = await read(await submit(orderBody(), cookie));
    const b = await read(await submit(orderBody({ clientToken: 'token-de-prueba-0002' }), cookie));
    expect(a.order.code).not.toBe(b.order.code);
    expect(await db.select().from(orders)).toHaveLength(2);
  });

  it('el mismo identificador en dos cuentas distintas crea dos pedidos', async () => {
    const ana = await loginAs('ana@example.com');
    const bea = await loginAs('bea@example.com');
    const a = await read(await submit(orderBody(), ana));
    const b = await read(await submit(orderBody(), bea));
    expect(a.order.code).not.toBe(b.order.code);
    expect(b.order.alreadyExisted).toBe(false);
  });

  it('limita a 20 pedidos cada 10 minutos por cuenta', async () => {
    const cookie = await loginAs('ana@example.com');
    for (let i = 0; i < 20; i++) {
      expect((await submit(orderBody({ clientToken: `token-limite-${String(i).padStart(4, '0')}` }), cookie)).status).toBe(201);
    }
    const blocked = await submit(orderBody({ clientToken: 'token-limite-9999' }), cookie);
    expect(blocked.status).toBe(429);
    expect(await read(blocked)).toMatchObject({ code: 'too_many_requests' });
  });
});

describe('POST /orders: lo que no se puede enviar', () => {
  const nothingCreated = async () => {
    expect(await db.select().from(orders)).toHaveLength(0);
    expect(await db.select().from(orderItems)).toHaveLength(0);
    expect(await db.select().from(emailOutbox)).toHaveLength(0);
    expect(await db.select().from(consents)).toHaveLength(0);
    expect(await db.select().from(addresses)).toHaveLength(0);
  };

  it('un valor declarado sobre el límite del servicio se bloquea y no crea nada', async () => {
    const cookie = await loginAs('ana@example.com');
    const res = await submit(orderBody({ items: [card(), card({ cardName: 'Charizard 1st', declaredValueCents: 850_000 })] }), cookie);
    expect(res.status).toBe(422);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    const body = await read(res);
    expect(body.code).toBe('invalid_order');
    expect(body.issues).toEqual([
      { code: 'declared_value_exceeds_limit', index: 1, tier: 'standard', maxCents: 50_000, declaredValueCents: 850_000 },
    ]);
    await nothingCreated();
  });

  it('el límite se cumple con el mismo servicio: sube a Express y el pedido pasa', async () => {
    const cookie = await loginAs('ana@example.com');
    const res = await submit(orderBody({ items: [card({ tier: 'express', declaredValueCents: 850_000 })] }), cookie);
    expect(res.status).toBe(422);
    const ok = await submit(orderBody({ items: [card({ tier: 'express', declaredValueCents: 300_000 })] }), cookie);
    expect(ok.status).toBe(201);
    expect((await read(ok)).order.totalCents).toBe(5000 + 1450);
  });

  it('sin valor declarado no hay pedido', async () => {
    const cookie = await loginAs('ana@example.com');
    const res = await submit(orderBody({ items: [card({ declaredValueCents: 0 })] }), cookie);
    expect(res.status).toBe(422);
    expect((await read(res)).issues).toEqual([{ code: 'declared_value_required', index: 0 }]);
    await nothingCreated();
  });

  it('un servicio que no existe se rechaza', async () => {
    const cookie = await loginAs('ana@example.com');
    const res = await submit(orderBody({ items: [card({ tier: 'platinum' })] }), cookie);
    expect(res.status).toBe(422);
    expect((await read(res)).issues[0]).toMatchObject({ code: 'unknown_tier', tier: 'platinum' });
    await nothingCreated();
  });

  it('el servicio Event solo con entrega en evento', async () => {
    const cookie = await loginAs('ana@example.com');
    const bad = await submit(orderBody({ items: [card({ tier: 'event' })] }), cookie);
    expect(bad.status).toBe(422);
    expect((await read(bad)).issues[0].code).toBe('event_tier_requires_dropoff');
    const ok = await submit(orderBody({ items: [card({ tier: 'event' })], shippingMethod: 'CARD_SHOW_DROPOFF', shippingAddress: undefined }), cookie);
    expect(ok.status).toBe(201);
    expect((await read(ok)).order.totalCents).toBe(1500);
  });

  it.each([
    ['sin dirección con mensajería', { shippingAddress: undefined }],
    ['sin aceptar los términos', { acceptedTerms: false }],
    ['sin confirmar los valores declarados', { confirmedDeclaredValues: false }],
    ['sin cartas', { items: [] }],
    ['carta sin nombre', { items: [card({ cardName: '   ' })] }],
    ['sin nombre de quien envía', { fullName: ' ' }],
    ['identificador demasiado corto', { clientToken: 'abc' }],
    ['país inválido', { shippingAddress: { line1: 'x', city: 'y', postalCode: '1', countryCode: 'ESP' } }],
    ['método de devolución no disponible', { shippingMethod: 'VAULT_STORE' }],
    ['valor con decimales', { items: [card({ declaredValueCents: 100.5 })] }],
  ])('rechaza con 422: %s', async (_name, override) => {
    const cookie = await loginAs('ana@example.com');
    const res = await submit(orderBody(override), cookie);
    expect(res.status).toBe(422);
    await nothingCreated();
  });

  it('la devolución en evento no pide dirección y no cobra envío', async () => {
    const cookie = await loginAs('ana@example.com');
    const res = await submit(orderBody({ shippingMethod: 'CARD_SHOW_DROPOFF', shippingAddress: undefined }), cookie);
    expect(res.status).toBe(201);
    const [row] = await db.select().from(orders);
    expect(row).toMatchObject({ shippingMethod: 'CARD_SHOW_DROPOFF', shippingCents: 0, totalCents: 1900, shippingAddress: null });
    expect(await db.select().from(addresses)).toHaveLength(0);
  });
});

describe('el pedido nuevo aparece en el resto de la aplicación', () => {
  it('en el dashboard del dueño y en el seguimiento público sin revelar sus cartas', async () => {
    const cookie = await loginAs('ana@example.com');
    const { order } = await read(await submit(orderBody(), cookie));

    const mine = await read(await t.app.request('/api/v1/orders', { headers: { cookie } }));
    expect(mine.orders[0]).toMatchObject({ code: order.code, status: 'SUBMITTED', itemCount: 1, firstCardName: 'Charizard Holo' });

    const bea = await loginAs('bea@example.com');
    expect((await read(await t.app.request('/api/v1/orders', { headers: { cookie: bea } }))).orders).toEqual([]);

    const publicView = await read(await t.app.request(`/api/v1/tracking/${order.code}`));
    expect(publicView.tracking).toMatchObject({ code: order.code, status: 'SUBMITTED', itemCount: 1, items: null });
    expect(publicView.tracking.steps).toHaveLength(1);
    expect(publicView.tracking.pending[0]).toBe('PACKAGE_RECEIVED');
    expect(JSON.stringify(publicView)).not.toContain('Charizard');
    expect(JSON.stringify(publicView)).not.toContain('Gran Vía');

    const ownerView = await read(await t.app.request(`/api/v1/tracking/${order.code}`, { headers: { cookie } }));
    expect(ownerView.tracking.items).toEqual([{ position: 1, cardName: 'Charizard Holo', game: 'Pokemon', set: 'Base Set' }]);
  });
});
