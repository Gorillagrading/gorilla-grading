import { and, eq, ne } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { auditLogs, orderItems, orders, slabs } from '../../db/schema.js';
import type { IdentifyCardBody } from '../../shared/admin.js';
import type { UserDto } from '../../shared/auth.js';
import type { OrderStatus } from '../../shared/domain.js';
import { hashIp } from '../auth/crypto.js';
import { ProblemError } from '../problem.js';

/** Mientras las cartas están en el laboratorio se pueden identificar (y corregir). */
const IN_LAB: OrderStatus[] = ['PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE', 'ON_HOLD'];

/**
 * El cliente solo dice cuántas cartas envía; al abrir el paquete, el laboratorio apunta qué carta es
 * cada una. Es lo que sale en el certificado, así que deja de poder cambiarse una vez emitido.
 */
export async function identifyCard(
  db: Db,
  actor: UserDto,
  code: string,
  position: number,
  input: IdentifyCardBody,
  context: { ip: string | null },
): Promise<void> {
  const [row] = await db
    .select({ order: orders, item: orderItems })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.code, code.trim()), eq(orderItems.position, position), ne(orders.status, 'DRAFT')))
    .limit(1);
  if (!row) throw new ProblemError(404, 'Not Found', 'No existe esa carta en el pedido.', { code: 'item_not_found' });
  if (!IN_LAB.includes(row.order.status)) {
    throw new ProblemError(409, 'Conflict', 'Las cartas se identifican mientras están en el laboratorio.', { code: 'identify_not_allowed' });
  }
  const [slab] = await db.select({ id: slabs.id }).from(slabs).where(eq(slabs.orderItemId, row.item.id)).limit(1);
  if (slab) {
    throw new ProblemError(409, 'Conflict', 'Esta carta ya tiene certificado y no se puede cambiar.', { code: 'card_certified' });
  }

  const values = {
    cardName: input.cardName,
    game: input.game,
    setName: input.setName || null,
    cardNumber: input.cardNumber || null,
    year: input.year ?? null,
    language: input.language || null,
  };
  await db.transaction(async (tx) => {
    await tx.update(orderItems).set(values).where(eq(orderItems.id, row.item.id));
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: 'card.identified',
      entityType: 'order_item',
      entityId: `${row.order.code}#${position}`,
      before: { cardName: row.item.cardName, game: row.item.game, setName: row.item.setName, cardNumber: row.item.cardNumber, year: row.item.year, language: row.item.language },
      after: values,
      ipHash: context.ip ? hashIp(context.ip) : null,
    });
  });
}
