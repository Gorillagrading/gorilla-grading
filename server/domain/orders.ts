import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { orderItems, orders, shipments } from '../../db/schema';
import type { OrderSummaryDto } from '../../shared/account';

/** Pedidos enviados de un usuario, del más reciente al más antiguo. Los borradores no se incluyen. */
export async function listUserOrders(db: Db, userId: string): Promise<OrderSummaryDto[]> {
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), ne(orders.status, 'DRAFT')))
    .orderBy(desc(orders.submittedAt), desc(orders.createdAt));
  if (rows.length === 0) return [];

  const ids = rows.map((o) => o.id);
  const [items, shipmentRows] = await Promise.all([
    db
      .select({ orderId: orderItems.orderId, cardName: orderItems.cardName })
      .from(orderItems)
      .where(inArray(orderItems.orderId, ids))
      .orderBy(asc(orderItems.position)),
    db.select().from(shipments).where(inArray(shipments.orderId, ids)).orderBy(desc(shipments.createdAt)),
  ]);

  return rows.map((o) => {
    const own = items.filter((i) => i.orderId === o.id);
    // El envío más reciente es el que interesa: el de ida mientras se procesa y el de vuelta al final.
    const shipment = shipmentRows.find((s) => s.orderId === o.id);
    return {
      code: o.code,
      status: o.status,
      submittedAt: (o.submittedAt ?? o.createdAt).toISOString(),
      itemCount: own.length,
      firstCardName: own[0]?.cardName ?? null,
      carrier: shipment?.carrier ?? null,
      trackingNumber: shipment?.trackingNumber ?? null,
      estimatedCompletionAt: o.estimatedCompletionAt,
    };
  });
}
