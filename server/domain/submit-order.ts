import { and, count, eq } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { addresses, consents, custodyEvents, emailOutbox, orderItems, orders, users } from '../../db/schema.js';
import type { UserDto } from '../../shared/auth.js';
import type { CreateOrderBody, CreatedOrderDto } from '../../shared/orders.js';
import { hashIp } from '../auth/crypto.js';
import { newOrderCode } from '../codes.js';
import { ProblemError } from '../problem.js';
import { loadActiveTiers } from './catalog.js';
import { computeQuote } from './pricing.js';
import { findBookableEvent, toPublicEvent } from './events.js';

/** Versión de los términos y la política de privacidad que se aceptan al enviar un pedido. */
export const CONSENT_VERSION = '2026-10-20';

/** Con el cobro activado, el pedido espera el pago antes de quedar registrado. */
const AWAITING_PAYMENT_TEXT = {
  es: {
    label: 'Pendiente de pago',
    description: 'Tu pedido está creado. Quedará registrado en cuanto se complete el pago.',
  },
  en: {
    label: 'Awaiting payment',
    description: 'Your order is created. It will be registered as soon as the payment is completed.',
  },
} as const;

const REGISTERED_TEXT = {
  es: {
    label: 'Pedido registrado',
    description: 'Hemos registrado tu pedido y esperamos recibir tu paquete en el laboratorio.',
  },
  en: {
    label: 'Order registered',
    description: 'We have registered your order and are waiting to receive your package at the lab.',
  },
} as const;

/**
 * Crea un pedido para el usuario de la sesión. Con el cobro activado (`requirePayment`) nace
 * PAYMENT_PENDING y se registra al confirmarse el pago (server/domain/payments.ts); sin cobro, nace SUBMITTED.
 * El precio sale siempre del servidor: del cliente solo se leen el servicio y el número de cartas.
 * Si el mismo `clientToken` llega dos veces, devuelve el pedido ya creado.
 */
export async function createOrder(
  db: Db,
  user: UserDto,
  input: CreateOrderBody,
  context: { ip: string | null; requirePayment?: boolean },
  now = new Date(),
): Promise<CreatedOrderDto> {
  const existing = await findByClientToken(db, user.id, input.clientToken);
  if (existing) return existing;

  const tiers = await loadActiveTiers(db, now);
  const { quote, issues } = computeQuote(
    {
      items: input.items.map((i) => ({ tier: i.tier })),
      shippingMethod: input.shippingMethod,
    },
    tiers,
  );
  if (issues.length > 0) {
    throw new ProblemError(422, 'Invalid Order', 'El pedido no se puede enviar tal como está.', {
      code: 'invalid_order',
      extensions: { issues },
    });
  }

  // La entrega en mano es en un evento concreto, que tiene que seguir abierto a entregas.
  const event = input.shippingMethod === 'CARD_SHOW_DROPOFF' && input.eventId ? await findBookableEvent(db, input.eventId, now) : undefined;
  if (input.shippingMethod === 'CARD_SHOW_DROPOFF' && !event) {
    throw new ProblemError(422, 'Invalid Order', 'El evento elegido ya no admite entregas. Elige otro.', { code: 'event_unavailable' });
  }

  const unitCentsByTier = new Map(quote.lines.map((l) => [l.tier, l.unitCents]));
  const ipHash = context.ip ? hashIp(context.ip) : null;
  const requirePayment = !!context.requirePayment;
  const status = requirePayment ? ('PAYMENT_PENDING' as const) : ('SUBMITTED' as const);
  const paymentStatus = requirePayment ? ('pending' as const) : ('unpaid' as const);
  const text = (requirePayment ? AWAITING_PAYMENT_TEXT : REGISTERED_TEXT)[input.locale];
  const courier = input.shippingMethod === 'COURIER_INSURED';

  return db.transaction(async (tx) => {
    // El código es aleatorio: si choca con uno existente (muy raro), se genera otro.
    let order: typeof orders.$inferSelect | undefined;
    for (let attempt = 0; attempt < 8 && !order; attempt++) {
      [order] = await tx
        .insert(orders)
        .values({
          code: newOrderCode(),
          userId: user.id,
          status,
          shippingMethod: input.shippingMethod,
          eventId: event?.id ?? null,
          shippingAddress:
            courier && input.shippingAddress ? { fullName: input.fullName, ...input.shippingAddress } : null,
          currency: 'EUR',
          subtotalCents: quote.subtotalCents,
          insuranceCents: quote.insuranceCents,
          shippingCents: quote.shippingCents,
          taxCents: quote.vatCents,
          totalCents: quote.totalCents,
          paymentStatus,
          submittedAt: now,
          clientToken: input.clientToken,
        })
        .onConflictDoNothing()
        .returning();

      if (!order) {
        // Un envío simultáneo del mismo navegador ya lo creó.
        const raced = await findByClientToken(tx, user.id, input.clientToken);
        if (raced) return raced;
      }
    }
    if (!order) throw new Error('No se pudo generar un código de pedido único');

    await tx.insert(orderItems).values(
      input.items.map((item, i) => {
        const tier = tiers.get(item.tier)!;
        return {
          orderId: order!.id,
          position: i + 1,
          // La carta se identifica en el laboratorio al recibirla (server/domain/card-identification.ts).
          cardName: null,
          game: null,
          // Asegurada hasta el máximo de su servicio.
          declaredValueCents: tier.maxDeclaredValueCents,
          serviceTierId: tier.id,
          // Precio y límite quedan fijados: un cambio de tarifas posterior no altera este pedido.
          unitPriceCents: unitCentsByTier.get(tier.code)!,
          maxDeclaredValueCents: tier.maxDeclaredValueCents,
          notes: item.notes || null,
        };
      }),
    );

    await tx.insert(custodyEvents).values({
      orderId: order.id,
      toStatus: status,
      publicLabel: text.label,
      publicDescription: text.description,
      actorId: user.id,
      occurredAt: now,
    });

    // Sin cobro, el pedido ya está registrado y se avisa ahora; con cobro, se avisa al confirmarse el pago.
    if (!requirePayment) await tx
      .insert(emailOutbox)
      .values({
        dedupeKey: `order:${order.code}:submitted`,
        toEmail: user.email,
        template: 'order_submitted',
        locale: input.locale,
        data: {
          orderCode: order.code,
          itemCount: quote.itemCount,
          totalCents: quote.totalCents,
          shippingMethod: input.shippingMethod,
          event: event ? toPublicEvent(event) : null,
        },
      })
      .onConflictDoNothing();

    await tx.insert(consents).values(
      (['terms', 'privacy'] as const).map((kind) => ({
        userId: user.id,
        kind,
        version: CONSENT_VERSION,
        granted: true,
        ipHash,
      })),
    );

    if (!user.fullName) {
      await tx.update(users).set({ fullName: input.fullName }).where(eq(users.id, user.id));
    }

    if (courier && input.shippingAddress) {
      const a = input.shippingAddress;
      const known = await tx
        .select({ id: addresses.id })
        .from(addresses)
        .where(and(eq(addresses.userId, user.id), eq(addresses.line1, a.line1), eq(addresses.postalCode, a.postalCode)))
        .limit(1);
      if (known.length === 0) {
        const [{ n }] = await tx.select({ n: count() }).from(addresses).where(eq(addresses.userId, user.id));
        await tx.insert(addresses).values({
          userId: user.id,
          fullName: input.fullName,
          line1: a.line1,
          line2: a.line2 || null,
          city: a.city,
          postalCode: a.postalCode,
          region: a.region || null,
          countryCode: a.countryCode,
          phone: a.phone || null,
          isDefault: n === 0,
        });
      }
    }

    return {
      code: order.code,
      status,
      paymentStatus,
      itemCount: quote.itemCount,
      totalCents: quote.totalCents,
      shippingMethod: input.shippingMethod,
      alreadyExisted: false,
    };
  });
}

async function findByClientToken(db: Db, userId: string, clientToken: string): Promise<CreatedOrderDto | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.clientToken, clientToken)))
    .limit(1);
  if (!order) return null;
  const [{ n }] = await db.select({ n: count() }).from(orderItems).where(eq(orderItems.orderId, order.id));
  return {
    code: order.code,
    status: order.status === 'PAYMENT_PENDING' ? 'PAYMENT_PENDING' : 'SUBMITTED',
    paymentStatus: order.paymentStatus,
    itemCount: n,
    totalCents: order.totalCents ?? 0,
    shippingMethod: order.shippingMethod as CreatedOrderDto['shippingMethod'],
    alreadyExisted: true,
  };
}
