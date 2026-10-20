import { and, asc, count, desc, eq, ilike, inArray, ne, or, type SQL } from 'drizzle-orm';
import type { Db } from '../../db/client';
import {
  auditLogs, custodyEvents, emailOutbox, orderItems, orders, serviceTiers, shipments, users,
} from '../../db/schema';
import type {
  AdminOrderDetail, AdminOrderList, AdminOrdersQuery, AdminTransitionOption, ShipmentBody, TransitionBody,
} from '../../shared/admin';
import type { UserDto } from '../../shared/auth';
import { ACTIVE_STATUSES, FINISHED_STATUSES } from '../../shared/domain';
import { hashIp } from '../auth/crypto';
import { ProblemError, forbidden, notFound } from '../problem';
import { AUTO_FROM, remainingSteps } from './automation';
import { NOTIFY_ON, addBusinessDays, publicCopy, rulesFrom, type TransitionRule } from './order-flow';

export const ADMIN_PAGE_SIZE = 25;

const orderNotFound = () =>
  new ProblemError(404, 'Not Found', 'No existe ningún pedido con ese código.', { code: 'order_not_found' });

/** Escapa % y _ para que lo escrito en el buscador se busque tal cual. */
const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

// ---------------------------------------------------------------------------
// Listado
// ---------------------------------------------------------------------------

export async function listAdminOrders(db: Db, query: AdminOrdersQuery): Promise<AdminOrderList> {
  const conditions: SQL[] = [ne(orders.status, 'DRAFT')];
  if (query.status === 'active') conditions.push(inArray(orders.status, ACTIVE_STATUSES));
  else if (query.status) conditions.push(eq(orders.status, query.status));
  if (query.q) {
    const pattern = likePattern(query.q);
    conditions.push(or(ilike(orders.code, pattern), ilike(users.email, pattern), ilike(users.fullName, pattern))!);
  }
  const where = and(...conditions);
  const order = query.sort === 'newest' ? desc(orders.submittedAt) : asc(orders.submittedAt);

  const [rows, [{ total }], statusCounts] = await Promise.all([
    db
      .select({ order: orders, customer: users })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.userId))
      .where(where)
      .orderBy(order, asc(orders.code))
      .limit(ADMIN_PAGE_SIZE)
      .offset((query.page - 1) * ADMIN_PAGE_SIZE),
    db.select({ total: count() }).from(orders).innerJoin(users, eq(users.id, orders.userId)).where(where),
    db.select({ status: orders.status, n: count() }).from(orders).where(ne(orders.status, 'DRAFT')).groupBy(orders.status),
  ]);

  const ids = rows.map((r) => r.order.id);
  const itemCounts = ids.length
    ? await db
        .select({ orderId: orderItems.orderId, n: count() })
        .from(orderItems)
        .where(inArray(orderItems.orderId, ids))
        .groupBy(orderItems.orderId)
    : [];

  return {
    orders: rows.map(({ order: o, customer }) => ({
      code: o.code,
      status: o.status,
      paymentStatus: o.paymentStatus,
      submittedAt: (o.submittedAt ?? o.createdAt).toISOString(),
      itemCount: itemCounts.find((c) => c.orderId === o.id)?.n ?? 0,
      totalCents: o.totalCents,
      shippingMethod: o.shippingMethod,
      customerEmail: customer.email,
      customerName: customer.fullName,
    })),
    counts: Object.fromEntries(statusCounts.map((c) => [c.status, c.n])),
    total,
    page: query.page,
    pageSize: ADMIN_PAGE_SIZE,
  };
}

// ---------------------------------------------------------------------------
// Detalle
// ---------------------------------------------------------------------------

async function loadContext(db: Db, code: string) {
  const [row] = await db
    .select({ order: orders, customer: users })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .where(and(eq(orders.code, code.trim().toUpperCase()), ne(orders.status, 'DRAFT')))
    .limit(1);
  if (!row) return null;

  const [items, shipmentRows, events] = await Promise.all([
    db
      .select({ item: orderItems, tierCode: serviceTiers.code, turnaround: serviceTiers.turnaroundBusinessDays })
      .from(orderItems)
      .innerJoin(serviceTiers, eq(serviceTiers.id, orderItems.serviceTierId))
      .where(eq(orderItems.orderId, row.order.id))
      .orderBy(asc(orderItems.position)),
    db.select().from(shipments).where(eq(shipments.orderId, row.order.id)).orderBy(desc(shipments.createdAt)),
    db
      .select({ event: custodyEvents, actorEmail: users.email, actorName: users.fullName })
      .from(custodyEvents)
      .leftJoin(users, eq(users.id, custodyEvents.actorId))
      .where(eq(custodyEvents.orderId, row.order.id))
      .orderBy(asc(custodyEvents.occurredAt), asc(custodyEvents.createdAt)),
  ]);
  return { ...row, items, shipments: shipmentRows, events };
}
type Context = NonNullable<Awaited<ReturnType<typeof loadContext>>>;

/** Motivo por el que una acción permitida por rol no se puede hacer ahora, si lo hay. */
function businessBlock(ctx: Context, rule: TransitionRule, actorId: string): AdminTransitionOption['blockedReason'] {
  if (rule.to === 'SHIPPED' && ctx.order.shippingMethod === 'COURIER_INSURED') {
    const hasTracking = ctx.shipments.some((s) => s.direction === 'outbound' && !!s.trackingNumber);
    if (!hasTracking) return 'tracking_required';
  }
  if (rule.from === 'QUALITY_ASSURANCE' && rule.to === 'SHIPPED') {
    const encapsulatedBy = [...ctx.events].reverse().find((e) => e.event.toStatus === 'ENCAPSULATION')?.event.actorId;
    if (encapsulatedBy && encapsulatedBy === actorId) return 'two_person_rule';
  }
  return undefined;
}

function buildDetail(ctx: Context, viewer: UserDto): AdminOrderDetail {
  const { order, customer } = ctx;
  const transitions = rulesFrom(order.status, order.statusBeforeHold)
    .filter((rule) => rule.roles.includes(viewer.role))
    .map<AdminTransitionOption>((rule) => {
      const blockedReason = businessBlock(ctx, rule, viewer.id);
      return { to: rule.to, requiresNote: !!rule.requiresNote, allowed: !blockedReason, blockedReason };
    });

  return {
    order: {
      code: order.code,
      status: order.status,
      statusBeforeHold: order.statusBeforeHold,
      paymentStatus: order.paymentStatus,
      shippingMethod: order.shippingMethod,
      submittedAt: order.submittedAt?.toISOString() ?? null,
      estimatedCompletionAt: order.estimatedCompletionAt,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      taxCents: order.taxCents,
      totalCents: order.totalCents,
    },
    customer: { email: customer.email, fullName: customer.fullName, locale: customer.locale },
    shippingAddress: order.shippingAddress,
    items: ctx.items.map(({ item, tierCode }) => ({
      position: item.position,
      cardName: item.cardName,
      game: item.game,
      setName: item.setName,
      year: item.year,
      language: item.language,
      declaredValueCents: item.declaredValueCents,
      tier: tierCode,
      unitPriceCents: item.unitPriceCents,
      notes: item.notes,
    })),
    shipments: ctx.shipments.map((s) => ({
      id: s.id,
      direction: s.direction,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      insuredValueCents: s.insuredValueCents,
      createdAt: s.createdAt.toISOString(),
    })),
    timeline: ctx.events.map(({ event: e, actorEmail, actorName }) => ({
      id: e.id,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      publicLabel: e.publicLabel,
      publicDescription: e.publicDescription,
      internalNote: e.internalNote,
      actor: actorEmail ? { email: actorEmail, fullName: actorName } : null,
      // Sin autor y con estado de origen: lo movió el sistema. Sin origen: es el envío del cliente.
      automatic: !e.actorId && e.fromStatus !== null,
      occurredAt: e.occurredAt.toISOString(),
    })),
    automation:
      order.autoAnchorAt && order.autoTurnaroundDays
        ? {
            // Solo mientras el sistema lo está moviendo. En pausa el reloj está parado.
            nextSteps: AUTO_FROM.includes(order.status)
              ? remainingSteps(order.status, order.autoAnchorAt, order.autoTurnaroundDays).map((s) => ({
                  to: s.to,
                  at: s.at.toISOString(),
                }))
              : [],
            awaitingFinalApproval: order.status === 'QUALITY_ASSURANCE',
          }
        : null,
    transitions,
    canAddShipment: !FINISHED_STATUSES.includes(order.status) && viewer.role !== 'grader',
  };
}

export async function getAdminOrder(db: Db, viewer: UserDto, code: string): Promise<AdminOrderDetail> {
  const ctx = await loadContext(db, code);
  if (!ctx) throw orderNotFound();
  return buildDetail(ctx, viewer);
}

// ---------------------------------------------------------------------------
// Cambios de estado
// ---------------------------------------------------------------------------

export async function transitionOrder(
  db: Db,
  actor: UserDto,
  code: string,
  body: TransitionBody,
  context: { ip: string | null },
  now = new Date(),
): Promise<AdminOrderDetail> {
  const ctx = await loadContext(db, code);
  if (!ctx) throw orderNotFound();
  const { order, customer } = ctx;

  // La persona decidió viendo un estado; si otro ya lo cambió, no se pisa su trabajo.
  if (order.status !== body.expectedStatus) {
    throw new ProblemError(409, 'Conflict', 'El pedido ha cambiado mientras lo mirabas. Recarga la página.', {
      code: 'order_changed',
      extensions: { currentStatus: order.status },
    });
  }

  const rule = rulesFrom(order.status, order.statusBeforeHold).find((r) => r.to === body.to);
  if (!rule) {
    throw new ProblemError(409, 'Conflict', 'Ese cambio de estado no está permitido desde el estado actual.', {
      code: 'invalid_transition',
    });
  }
  if (!rule.roles.includes(actor.role)) throw forbidden();
  if (rule.requiresNote && !body.internalNote) {
    throw new ProblemError(422, 'Validation Error', 'Este cambio necesita una nota con el motivo.', { code: 'note_required' });
  }

  const blocked = businessBlock(ctx, rule, actor.id);
  if (blocked === 'tracking_required') {
    throw new ProblemError(409, 'Conflict', 'Registra el transportista y el número de seguimiento de la devolución antes de enviarla.', {
      code: 'tracking_required',
    });
  }
  if (blocked === 'two_person_rule') {
    throw new ProblemError(409, 'Conflict', 'Quien encapsuló el pedido no puede aprobar su salida de control de calidad. Debe hacerlo otra persona.', {
      code: 'two_person_rule',
    });
  }

  const copy = publicCopy(order.status, body.to, customer.locale, order.shippingMethod);
  const publicDescription = body.publicDescription || copy.description;
  // El plazo empieza a contar cuando llega el paquete, con el servicio más lento del pedido.
  const turnaroundDays = Math.max(0, ...ctx.items.map((i) => i.turnaround));
  const receiving = order.status === 'SUBMITTED' && body.to === 'PACKAGE_RECEIVED';
  const estimatedCompletionAt = receiving ? addBusinessDays(now, turnaroundDays).toISOString().slice(0, 10) : undefined;

  // Al reanudar tras una pausa, el reloj automático se retrasa lo que duró la pausa.
  let resumedAnchor: Date | undefined;
  if (order.status === 'ON_HOLD' && body.to !== 'CANCELLED' && order.autoAnchorAt) {
    const heldAt = [...ctx.events].reverse().find((e) => e.event.toStatus === 'ON_HOLD')?.event.occurredAt;
    if (heldAt) resumedAnchor = new Date(order.autoAnchorAt.getTime() + Math.max(0, now.getTime() - heldAt.getTime()));
  }

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(orders)
      .set({
        status: body.to,
        statusBeforeHold: body.to === 'ON_HOLD' ? order.status : null,
        ...(estimatedCompletionAt && { estimatedCompletionAt }),
        // Confirmar la recepción arranca el avance automático.
        ...(receiving && { autoAnchorAt: now, autoTurnaroundDays: turnaroundDays }),
        ...(resumedAnchor && { autoAnchorAt: resumedAnchor }),
      })
      .where(and(eq(orders.id, order.id), eq(orders.status, order.status)))
      .returning({ id: orders.id });
    if (!updated) {
      throw new ProblemError(409, 'Conflict', 'El pedido ha cambiado mientras lo mirabas. Recarga la página.', { code: 'order_changed' });
    }

    const [event] = await tx
      .insert(custodyEvents)
      .values({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: body.to,
        publicLabel: copy.label,
        publicDescription,
        internalNote: body.internalNote || null,
        actorId: actor.id,
        occurredAt: now,
      })
      .returning({ id: custodyEvents.id });

    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: 'order.transition',
      entityType: 'order',
      entityId: order.code,
      before: { status: order.status },
      after: { status: body.to, internalNote: body.internalNote ?? null },
      ipHash: context.ip ? hashIp(context.ip) : null,
    });

    if (NOTIFY_ON.includes(body.to)) {
      await tx
        .insert(emailOutbox)
        .values({
          dedupeKey: `order:${order.code}:event:${event.id}`,
          toEmail: customer.email,
          template: `order_${body.to.toLowerCase()}`,
          locale: customer.locale,
          data: { orderCode: order.code, status: body.to, label: copy.label, description: publicDescription },
        })
        .onConflictDoNothing();
    }
  });

  const fresh = await loadContext(db, code);
  return buildDetail(fresh!, actor);
}

// ---------------------------------------------------------------------------
// Envíos (transportista y número de seguimiento)
// ---------------------------------------------------------------------------

export async function addShipment(
  db: Db,
  actor: UserDto,
  code: string,
  body: ShipmentBody,
  context: { ip: string | null },
): Promise<AdminOrderDetail> {
  const ctx = await loadContext(db, code);
  if (!ctx) throw notFound('No existe ningún pedido con ese código.');
  if (actor.role === 'grader') throw forbidden();
  if (FINISHED_STATUSES.includes(ctx.order.status)) {
    throw new ProblemError(409, 'Conflict', 'El pedido ya está cerrado.', { code: 'order_finished' });
  }

  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(shipments)
      .values({
        orderId: ctx.order.id,
        direction: body.direction,
        carrier: body.carrier,
        trackingNumber: body.trackingNumber,
        insuredValueCents: body.insuredValueCents ?? null,
        shippedAt: body.direction === 'outbound' ? new Date() : null,
      })
      .returning({ id: shipments.id });
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: 'order.shipment_added',
      entityType: 'order',
      entityId: ctx.order.code,
      after: { shipmentId: created.id, direction: body.direction, carrier: body.carrier, trackingNumber: body.trackingNumber },
      ipHash: context.ip ? hashIp(context.ip) : null,
    });
  });

  return buildDetail((await loadContext(db, code))!, actor);
}

