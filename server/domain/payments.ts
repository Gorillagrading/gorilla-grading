import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import {
  auditLogs, custodyEvents, emailOutbox, events, orderItems, orders, payments, serviceTiers, users, webhookEvents,
} from '../../db/schema.js';
import type { PaymentReceiptDto } from '../../shared/account.js';
import { publicBaseUrl } from '../env.js';
import type { CheckoutLine, PaymentEvent, PaymentGateway } from '../payments/gateway.js';
import { toPublicEvent } from './events.js';
import { ProblemError } from '../problem.js';

type Tx = Pick<Db, 'select' | 'insert' | 'update'>;
type Order = typeof orders.$inferSelect;

/** Texto del seguimiento cuando el pago se confirma: el pedido queda registrado de verdad. */
const PAID_TEXT = {
  es: { label: 'Pedido registrado', description: 'Hemos recibido el pago y esperamos tu paquete en el laboratorio.' },
  en: { label: 'Order registered', description: 'We received your payment and are waiting for your package at the lab.' },
} as const;

const LINE_TEXT = {
  es: { service: (name: string) => `Servicio ${name}`, shipping: 'Devolución por mensajería asegurada' },
  en: { service: (name: string) => `${name} service`, shipping: 'Insured courier return' },
} as const;

const orderNotFound = () => new ProblemError(404, 'Not Found', 'No existe ningún pedido con ese código.', { code: 'order_not_found' });

/**
 * Las líneas que verá el cliente en la página de pago, con los precios congelados del pedido.
 * Si por cualquier motivo no suman el total cobrado, se cobra el total en una sola línea:
 * el importe es siempre el del pedido.
 */
async function checkoutLines(db: Db, order: Order, lang: 'es' | 'en'): Promise<CheckoutLine[]> {
  const rows = await db
    .select({ tierName: serviceTiers.name, unitCents: orderItems.unitPriceCents })
    .from(orderItems)
    .innerJoin(serviceTiers, eq(serviceTiers.id, orderItems.serviceTierId))
    .where(eq(orderItems.orderId, order.id))
    .orderBy(asc(orderItems.position));

  const grouped = new Map<string, CheckoutLine>();
  for (const r of rows) {
    const key = `${r.tierName}:${r.unitCents}`;
    const line = grouped.get(key);
    if (line) line.quantity += 1;
    else grouped.set(key, { name: LINE_TEXT[lang].service(r.tierName), unitCents: r.unitCents, quantity: 1 });
  }
  const lines = [...grouped.values()];
  if ((order.insuranceCents ?? 0) > 0) lines.push({ name: lang === 'es' ? 'Seguro' : 'Insurance', unitCents: order.insuranceCents!, quantity: 1 });
  if ((order.shippingCents ?? 0) > 0) lines.push({ name: LINE_TEXT[lang].shipping, unitCents: order.shippingCents!, quantity: 1 });

  const sum = lines.reduce((acc, l) => acc + l.unitCents * l.quantity, 0);
  if (sum === order.totalCents) return lines;
  return [{ name: `Gorilla Grading ${order.code}`, unitCents: order.totalCents ?? 0, quantity: 1 }];
}

/** Abre una página de pago para un pedido pendiente de pago y la registra. */
export async function openCheckout(db: Db, gateway: PaymentGateway, order: Order, email: string, lang: 'es' | 'en'): Promise<string> {
  if (!order.totalCents || order.totalCents <= 0) throw new Error(`El pedido ${order.code} no tiene importe`);
  const base = publicBaseUrl();
  const code = encodeURIComponent(order.code);
  const session = await gateway.createCheckout({
    orderCode: order.code,
    email,
    locale: lang,
    lines: await checkoutLines(db, order, lang),
    successUrl: `${base}/track?code=${code}&payment=success`,
    cancelUrl: `${base}/track?code=${code}&payment=cancelled`,
  });
  await db.insert(payments).values({
    orderId: order.id,
    checkoutSessionId: session.id,
    amountCents: order.totalCents,
    currency: 'EUR',
    status: 'pending',
  });
  return session.url;
}

/** El cliente pide pagar (o volver a intentarlo) un pedido suyo que sigue sin pagar. */
export async function checkoutForOwner(db: Db, gateway: PaymentGateway, userId: string, rawCode: string): Promise<string> {
  const [row] = await db
    .select({ order: orders, email: users.email, locale: users.locale })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .where(and(eq(orders.code, rawCode.trim().toUpperCase()), eq(orders.userId, userId)))
    .limit(1);
  if (!row) throw orderNotFound();
  if (row.order.status !== 'PAYMENT_PENDING' || row.order.paymentStatus === 'paid') {
    throw new ProblemError(409, 'Conflict', 'Este pedido no tiene ningún pago pendiente.', { code: 'nothing_to_pay' });
  }
  return openCheckout(db, gateway, row.order, row.email, row.locale === 'en' ? 'en' : 'es');
}

const str = (v: unknown) => (typeof v === 'string' ? v : null);

/** Marca el pago como cobrado y, si el pedido esperaba el pago, lo registra y avisa al cliente. */
async function markPaid(tx: Tx, session: Record<string, unknown>, now: Date) {
  const sessionId = str(session.id);
  const orderCode = str((session.metadata as Record<string, unknown> | undefined)?.orderCode) ?? str(session.client_reference_id);
  const paymentIntentId = str(session.payment_intent);

  const [payment] = sessionId ? await tx.select().from(payments).where(eq(payments.checkoutSessionId, sessionId)).limit(1) : [];
  const [order] = payment
    ? await tx.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1)
    : orderCode
      ? await tx.select().from(orders).where(eq(orders.code, orderCode)).limit(1)
      : [];
  if (!order) return 'ignored' as const;

  if (payment) {
    await tx.update(payments).set({ status: 'paid', paymentIntentId, paidAt: now }).where(eq(payments.id, payment.id));
  } else {
    await tx.insert(payments).values({
      orderId: order.id,
      checkoutSessionId: sessionId,
      paymentIntentId,
      amountCents: typeof session.amount_total === 'number' ? session.amount_total : (order.totalCents ?? 0),
      status: 'paid',
      paidAt: now,
    });
  }

  const [customer] = await tx.select().from(users).where(eq(users.id, order.userId)).limit(1);
  const lang = customer?.locale === 'en' ? 'en' : 'es';

  if (order.status === 'PAYMENT_PENDING') {
    await tx.update(orders).set({ paymentStatus: 'paid', status: 'SUBMITTED' }).where(eq(orders.id, order.id));
    await tx.insert(custodyEvents).values({
      orderId: order.id,
      fromStatus: 'PAYMENT_PENDING',
      toStatus: 'SUBMITTED',
      publicLabel: PAID_TEXT[lang].label,
      publicDescription: PAID_TEXT[lang].description,
      actorId: order.userId,
      occurredAt: now,
    });
    const [{ n }] = await tx.select({ n: count() }).from(orderItems).where(eq(orderItems.orderId, order.id));
    // El correo lleva adónde enviar las cartas o el evento en el que entregarlas.
    const [eventRow] = order.eventId ? await tx.select().from(events).where(eq(events.id, order.eventId)).limit(1) : [];
    const event = eventRow ? toPublicEvent(eventRow) : null;
    if (customer) {
      await tx
        .insert(emailOutbox)
        .values({
          dedupeKey: `order:${order.code}:submitted`,
          toEmail: customer.email,
          template: 'order_submitted',
          locale: lang,
          data: { orderCode: order.code, itemCount: n, totalCents: order.totalCents, shippingMethod: order.shippingMethod, event },
        })
        .onConflictDoNothing();
    }
  } else {
    // Pagado cuando el pedido ya no esperaba el pago (por ejemplo, se canceló antes): queda anotado para revisarlo.
    await tx.update(orders).set({ paymentStatus: 'paid' }).where(eq(orders.id, order.id));
  }

  await tx.insert(auditLogs).values({
    action: order.status === 'PAYMENT_PENDING' ? 'payment.paid' : 'payment.paid_unexpected',
    entityType: 'order',
    entityId: order.code,
    after: { checkoutSessionId: sessionId, paymentIntentId, orderStatus: order.status },
  });
  return 'processed' as const;
}

/** Un pago que no llegó a completarse: el pedido sigue pendiente y el cliente puede volver a intentarlo. */
async function markUnpaid(tx: Tx, session: Record<string, unknown>, failed: boolean) {
  const sessionId = str(session.id);
  if (!sessionId) return 'ignored' as const;
  const [payment] = await tx.select().from(payments).where(eq(payments.checkoutSessionId, sessionId)).limit(1);
  if (!payment || payment.status !== 'pending') return 'ignored' as const;
  await tx.update(payments).set({ status: 'failed' }).where(eq(payments.id, payment.id));
  if (failed) {
    await tx
      .update(orders)
      .set({ paymentStatus: 'failed' })
      .where(and(eq(orders.id, payment.orderId), eq(orders.status, 'PAYMENT_PENDING')));
  }
  return 'processed' as const;
}

/** Una devolución hecha desde el panel de Stripe: se refleja en el pedido. */
async function markRefunded(tx: Tx, charge: Record<string, unknown>) {
  const paymentIntentId = str(charge.payment_intent);
  if (!paymentIntentId) return 'ignored' as const;
  const [payment] = await tx.select().from(payments).where(eq(payments.paymentIntentId, paymentIntentId)).limit(1);
  if (!payment) return 'ignored' as const;
  const refunded = typeof charge.amount_refunded === 'number' ? charge.amount_refunded : 0;
  const amount = typeof charge.amount === 'number' ? charge.amount : payment.amountCents;
  const status = refunded >= amount ? 'refunded' : 'partially_refunded';
  await tx.update(payments).set({ status }).where(eq(payments.id, payment.id));
  await tx.update(orders).set({ paymentStatus: status }).where(eq(orders.id, payment.orderId));
  await tx.insert(auditLogs).values({
    action: 'payment.refunded',
    entityType: 'payment',
    entityId: paymentIntentId,
    after: { refundedCents: refunded, amountCents: amount },
  });
  return 'processed' as const;
}

/**
 * Procesa un aviso de Stripe una sola vez: el id del aviso queda guardado y una repetición no
 * hace nada. Si algo falla, el aviso queda sin procesar y Stripe lo reenvía más tarde.
 */
export async function handlePaymentEvent(
  db: Db,
  event: PaymentEvent,
  now = new Date(),
  gateway?: PaymentGateway,
): Promise<'processed' | 'duplicate' | 'ignored'> {
  const [known] = await db.select().from(webhookEvents).where(eq(webhookEvents.eventId, event.id)).limit(1);
  if (known?.processedAt) return 'duplicate';
  if (!known) {
    await db
      .insert(webhookEvents)
      .values({ eventId: event.id, type: event.type, payload: event.object })
      .onConflictDoNothing();
  }

  try {
    const result = await db.transaction(async (tx) => {
      let outcome: 'processed' | 'ignored';
      switch (event.type) {
        case 'checkout.session.completed':
          // Con métodos de pago diferidos el cobro llega después, en async_payment_succeeded.
          outcome = event.object.payment_status === 'paid' ? await markPaid(tx, event.object, now) : 'ignored';
          break;
        case 'checkout.session.async_payment_succeeded':
          outcome = await markPaid(tx, event.object, now);
          break;
        case 'checkout.session.async_payment_failed':
          outcome = await markUnpaid(tx, event.object, true);
          break;
        case 'checkout.session.expired':
          outcome = await markUnpaid(tx, event.object, false);
          break;
        case 'charge.refunded':
          outcome = await markRefunded(tx, event.object);
          break;
        default:
          outcome = 'ignored';
      }
      await tx.update(webhookEvents).set({ processedAt: now, error: null }).where(eq(webhookEvents.eventId, event.id));
      return outcome;
    });
    // El recibo se pide fuera de la transacción y sin bloquear: si falla, se vuelve a pedir al listar los pagos.
    const intentId = str(event.object.payment_intent);
    if (gateway && result === 'processed' && intentId && event.type.startsWith('checkout.session.')) {
      await storeReceipt(db, gateway, intentId);
    }
    return result;
  } catch (error) {
    await db
      .update(webhookEvents)
      .set({ error: (error instanceof Error ? error.message : String(error)).slice(0, 500) })
      .where(eq(webhookEvents.eventId, event.id));
    throw error;
  }
}

/** Pide a Stripe el recibo de un cobro y lo guarda. Nunca falla: un recibo que no llega se vuelve a pedir más tarde. */
async function storeReceipt(db: Db, gateway: PaymentGateway, paymentIntentId: string): Promise<string | null> {
  try {
    const url = await gateway.getReceiptUrl(paymentIntentId);
    if (url) await db.update(payments).set({ receiptUrl: url }).where(eq(payments.paymentIntentId, paymentIntentId));
    return url;
  } catch (error) {
    console.error('[pagos] no se pudo obtener el recibo', paymentIntentId, error instanceof Error ? error.message : error);
    return null;
  }
}

/** Pagos cobrados de un cliente, del más reciente al más antiguo, con su recibo de Stripe. */
export async function listUserPayments(db: Db, gateway: PaymentGateway | null, userId: string): Promise<PaymentReceiptDto[]> {
  const rows = await db
    .select({ payment: payments, order: orders, customerName: users.fullName, customerEmail: users.email })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .innerJoin(users, eq(users.id, orders.userId))
    .where(and(eq(orders.userId, userId), inArray(payments.status, ['paid', 'refunded', 'partially_refunded'])))
    .orderBy(desc(payments.paidAt), desc(payments.createdAt));
  if (rows.length === 0) return [];

  const items = await db
    .select({ orderId: orderItems.orderId, tierName: serviceTiers.name, unitCents: orderItems.unitPriceCents })
    .from(orderItems)
    .innerJoin(serviceTiers, eq(serviceTiers.id, orderItems.serviceTierId))
    .where(inArray(orderItems.orderId, [...new Set(rows.map((r) => r.order.id))]))
    .orderBy(asc(orderItems.position));

  const linesOf = (orderId: string) => {
    const grouped = new Map<string, PaymentReceiptDto['lines'][number]>();
    for (const i of items.filter((x) => x.orderId === orderId)) {
      const key = `${i.tierName}:${i.unitCents}`;
      const line = grouped.get(key);
      if (line) line.quantity += 1;
      else grouped.set(key, { tierName: i.tierName, quantity: 1, unitCents: i.unitCents });
    }
    return [...grouped.values()];
  };

  return Promise.all(
    rows.map(async ({ payment: p, order, customerName, customerEmail }) => ({
      orderCode: order.code,
      amountCents: p.amountCents,
      currency: p.currency,
      status: p.status as PaymentReceiptDto['status'],
      paidAt: (p.paidAt ?? p.updatedAt).toISOString(),
      lines: linesOf(order.id),
      breakdown: {
        insuranceCents: order.insuranceCents ?? 0,
        shippingCents: order.shippingCents ?? 0,
        // El IVA va incluido en el precio: la base es el total menos el IVA.
        baseCents: (order.totalCents ?? p.amountCents) - (order.taxCents ?? 0),
        vatCents: order.taxCents ?? 0,
        totalCents: order.totalCents ?? p.amountCents,
      },
      customer: { name: customerName, email: customerEmail },
      // Un recibo que no se pudo guardar al cobrar se pide ahora.
      receiptUrl: p.receiptUrl ?? (gateway && p.paymentIntentId ? await storeReceipt(db, gateway, p.paymentIntentId) : null),
    })),
  );
}
