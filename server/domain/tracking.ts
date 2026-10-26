import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';
import { normalizeCode } from '../../shared/codes.js';
import type { Db } from '../../db/client.js';
import { custodyEvents, orderItems, orders, shipments } from '../../db/schema.js';
import type { OrderStatus } from '../../shared/domain.js';
import type { TrackingDto } from '../../shared/tracking.js';

/** Recorrido normal de un pedido. PAYMENT_PENDING cuenta como SUBMITTED a efectos de lo que falta. */
const PIPELINE: OrderStatus[] = [
  'SUBMITTED',
  'PACKAGE_RECEIVED',
  'PRE_INSPECTION',
  'OPTICAL_GRADING',
  'ENCAPSULATION',
  'QUALITY_ASSURANCE',
  'SHIPPED',
  'DELIVERED',
];
const FINISHED: OrderStatus[] = ['DELIVERED', 'CANCELLED', 'RETURNED'];

/** Códigos válidos: letras, números, guiones y espacios. Cualquier otra cosa no puede ser un pedido. */
const QUERY_SHAPE = /^[A-Z0-9][A-Z0-9 _-]{2,63}$/;

/**
 * Busca un pedido por su código (284719365, también escrito con espacios) o por el número de seguimiento del transportista.
 * Los borradores no se pueden consultar. `viewerId` es el usuario con sesión, si lo hay:
 * solo su dueño recibe el detalle de las cartas.
 */
export async function findTracking(db: Db, rawQuery: string, viewerId: string | null): Promise<TrackingDto | null> {
  const query = rawQuery.trim().toUpperCase();
  if (!QUERY_SHAPE.test(query)) return null;

  let [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.code, normalizeCode(query)), ne(orders.status, 'DRAFT')))
    .limit(1);

  if (!order) {
    const [byShipment] = await db
      .select({ order: orders })
      .from(shipments)
      .innerJoin(orders, eq(orders.id, shipments.orderId))
      .where(and(sql`upper(${shipments.trackingNumber}) = ${query}`, ne(orders.status, 'DRAFT')))
      .limit(1);
    order = byShipment?.order;
  }
  if (!order) return null;

  const [events, items, shipmentRows] = await Promise.all([
    db
      .select()
      .from(custodyEvents)
      .where(eq(custodyEvents.orderId, order.id))
      .orderBy(asc(custodyEvents.occurredAt), asc(custodyEvents.createdAt)),
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.position)),
    db.select().from(shipments).where(eq(shipments.orderId, order.id)).orderBy(desc(shipments.createdAt)).limit(1),
  ]);

  const finished = FINISHED.includes(order.status);
  const effective: OrderStatus =
    order.status === 'ON_HOLD'
      ? (order.statusBeforeHold ?? 'SUBMITTED')
      : order.status === 'PAYMENT_PENDING'
        ? 'SUBMITTED'
        : order.status;
  const at = PIPELINE.indexOf(effective);

  return {
    code: order.code,
    status: order.status,
    submittedAt: (order.submittedAt ?? order.createdAt).toISOString(),
    estimatedCompletionAt: order.estimatedCompletionAt,
    carrier: shipmentRows[0]?.carrier ?? null,
    trackingNumber: shipmentRows[0]?.trackingNumber ?? null,
    itemCount: items.length,
    items:
      viewerId && viewerId === order.userId
        ? items.map((i) => ({ position: i.position, cardName: i.cardName, game: i.game, set: i.setName }))
        : null,
    steps: events.map((e, i) => ({
      status: e.toStatus,
      label: e.publicLabel,
      description: e.publicDescription ?? '',
      occurredAt: e.occurredAt.toISOString(),
      // El último evento es la fase en curso, salvo que el pedido ya haya terminado.
      state: !finished && i === events.length - 1 ? 'current' : 'completed',
    })),
    pending: finished || at < 0 ? [] : PIPELINE.slice(at + 1),
  };
}
