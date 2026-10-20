import { and, count, eq } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { addresses, consents, custodyEvents, emailOutbox, orderItems, orders, users } from '../../db/schema';
import type { UserDto } from '../../shared/auth';
import type { CreateOrderBody, CreatedOrderDto } from '../../shared/orders';
import { hashIp } from '../auth/crypto';
import { newOrderCode } from '../codes';
import { ProblemError } from '../problem';
import { loadActiveTiers } from './catalog';
import { computeQuote } from './pricing';

/** Versión de los términos y la política de privacidad que se aceptan al enviar un pedido. */
export const CONSENT_VERSION = '2026-10-20';

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
 * Crea un pedido enviado (SUBMITTED, sin pagar) para el usuario de la sesión.
 * El precio sale siempre del servidor: del cliente solo se leen el servicio y el valor declarado.
 * Si el mismo `clientToken` llega dos veces, devuelve el pedido ya creado.
 */
export async function createOrder(
  db: Db,
  user: UserDto,
  input: CreateOrderBody,
  context: { ip: string | null },
  now = new Date(),
): Promise<CreatedOrderDto> {
  const existing = await findByClientToken(db, user.id, input.clientToken);
  if (existing) return existing;

  const tiers = await loadActiveTiers(db, now);
  const { quote, issues } = computeQuote(
    {
      items: input.items.map((i) => ({ tier: i.tier, declaredValueCents: i.declaredValueCents })),
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

  const unitCentsByTier = new Map(quote.lines.map((l) => [l.tier, l.unitCents]));
  const ipHash = context.ip ? hashIp(context.ip) : null;
  const text = REGISTERED_TEXT[input.locale];
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
          status: 'SUBMITTED',
          shippingMethod: input.shippingMethod,
          shippingAddress:
            courier && input.shippingAddress ? { fullName: input.fullName, ...input.shippingAddress } : null,
          currency: 'EUR',
          subtotalCents: quote.subtotalCents,
          insuranceCents: quote.insuranceCents,
          shippingCents: quote.shippingCents,
          taxCents: quote.vatCents,
          totalCents: quote.totalCents,
          paymentStatus: 'unpaid',
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
          cardName: item.cardName,
          game: item.game,
          setName: item.setName || null,
          year: item.year ?? null,
          language: item.language || null,
          declaredValueCents: item.declaredValueCents,
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
      toStatus: 'SUBMITTED',
      publicLabel: text.label,
      publicDescription: text.description,
      actorId: user.id,
      occurredAt: now,
    });

    await tx
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
      status: 'SUBMITTED' as const,
      paymentStatus: 'unpaid' as const,
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
    status: 'SUBMITTED',
    paymentStatus: 'unpaid',
    itemCount: n,
    totalCents: order.totalCents ?? 0,
    shippingMethod: order.shippingMethod as CreatedOrderDto['shippingMethod'],
    alreadyExisted: true,
  };
}
