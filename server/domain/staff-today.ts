import { and, asc, desc, eq, inArray, isNotNull, max, ne } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { auditLogs, custodyEvents, gradingResults, itemImages, orderItems, orders, users } from '../../db/schema.js';
import type { StaffRole } from '../../shared/admin.js';
import type { UserDto } from '../../shared/auth.js';
import type { OrderStatus } from '../../shared/domain.js';
import {
  SECTIONS_BY_ROLE, TODAY_ITEMS_LIMIT, type StaffToday, type TodaySectionKey, type TodayTask,
} from '../../shared/staff-today.js';

/** Estados en los que las cartas están en el laboratorio (igual que en el panel de graduación). */
const LAB: OrderStatus[] = ['PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE'];
const RELEVANT: OrderStatus[] = ['SUBMITTED', ...LAB, 'SHIPPED', 'ON_HOLD'];

/** Fecha de hoy en Madrid, como AAAA-MM-DD. */
const madridToday = (now: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(now);
const shortDate = (isoDate: string) => {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};
const fmtGrade = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 1 });

/** Lo que tiene pendiente quien consulta, agrupado en las secciones de su rol. */
export async function getStaffToday(db: Db, viewer: UserDto, now = new Date()): Promise<StaffToday> {
  const role = viewer.role as StaffRole;
  const wanted = new Set(SECTIONS_BY_ROLE[role] ?? []);
  const lists = new Map<TodaySectionKey, TodayTask[]>([...wanted].map((k) => [k, []]));
  const push = (key: TodaySectionKey, task: TodayTask) => lists.get(key)?.push(task);

  const orderRows = await db
    .select({ order: orders, customer: users })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .where(inArray(orders.status, RELEVANT));
  const orderIds = orderRows.map((r) => r.order.id);

  // Cuándo cambió de estado cada pedido por última vez, y el motivo de las pausas.
  const [lastEvents, holdEvents] = orderIds.length
    ? await Promise.all([
        db
          .select({ orderId: custodyEvents.orderId, at: max(custodyEvents.occurredAt) })
          .from(custodyEvents)
          .where(inArray(custodyEvents.orderId, orderIds))
          .groupBy(custodyEvents.orderId),
        db
          .select({ orderId: custodyEvents.orderId, note: custodyEvents.internalNote })
          .from(custodyEvents)
          .where(and(inArray(custodyEvents.orderId, orderIds), eq(custodyEvents.toStatus, 'ON_HOLD')))
          .orderBy(desc(custodyEvents.occurredAt)),
      ])
    : [[], []];
  const changedAt = new Map(lastEvents.map((e) => [e.orderId, e.at]));

  const base = (o: (typeof orderRows)[number]): Omit<TodayTask, 'since'> => ({
    orderCode: o.order.code,
    customerName: o.customer.fullName,
    customerEmail: o.customer.email,
  });
  const sinceChange = (o: (typeof orderRows)[number]) =>
    (changedAt.get(o.order.id) ?? o.order.submittedAt ?? o.order.createdAt).toISOString();

  // Pedidos enteros.
  const today = madridToday(now);
  for (const o of orderRows) {
    const { status, estimatedCompletionAt } = o.order;
    if (status === 'SUBMITTED') push('toReceive', { ...base(o), since: (o.order.submittedAt ?? o.order.createdAt).toISOString() });
    if (status === 'SHIPPED') push('toDeliver', { ...base(o), since: sinceChange(o) });
    if (status === 'ON_HOLD') {
      const note = holdEvents.find((e) => e.orderId === o.order.id)?.note ?? undefined;
      push('onHold', { ...base(o), since: sinceChange(o), note });
    }
    if ((LAB.includes(status) || status === 'ON_HOLD') && estimatedCompletionAt && estimatedCompletionAt < today) {
      push('late', { ...base(o), since: sinceChange(o), note: `Fecha prevista: ${shortDate(estimatedCompletionAt)}` });
    }
  }

  // Cartas de los pedidos que están en el laboratorio.
  const labOrders = orderRows.filter((o) => LAB.includes(o.order.status));
  const items = labOrders.length
    ? await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, labOrders.map((o) => o.order.id)))
        .orderBy(asc(orderItems.position))
    : [];
  const itemIds = items.map((i) => i.id);
  const [results, photos] = itemIds.length
    ? await Promise.all([
        db
          .select({ result: gradingResults, graderEmail: users.email, graderName: users.fullName })
          .from(gradingResults)
          .innerJoin(users, eq(users.id, gradingResults.gradedBy))
          .where(and(inArray(gradingResults.orderItemId, itemIds), ne(gradingResults.status, 'superseded'))),
        db
          .select({ itemId: itemImages.orderItemId, kind: itemImages.kind })
          .from(itemImages)
          .where(and(inArray(itemImages.orderItemId, itemIds), isNotNull(itemImages.uploadedAt))),
      ])
    : [[], []];
  const resultOf = new Map(results.map((r) => [r.result.orderItemId, r]));
  const orderOf = new Map(labOrders.map((o) => [o.order.id, o]));
  const entityId = (code: string, position: number) => `${code}#${position}`;

  // Un borrador vuelve de control de calidad si lo último que pasó fue un rechazo, no un envío.
  const draftEntities = items
    .filter((i) => resultOf.get(i.id)?.result.status === 'draft')
    .map((i) => entityId(orderOf.get(i.orderId)!.order.code, i.position));
  const reviews = draftEntities.length
    ? await db
        .select({ entityId: auditLogs.entityId, action: auditLogs.action, after: auditLogs.after, at: auditLogs.createdAt })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, 'order_item'),
            inArray(auditLogs.entityId, draftEntities),
            inArray(auditLogs.action, ['grading.submitted', 'grading.rejected']),
          ),
        )
        .orderBy(desc(auditLogs.createdAt))
    : [];

  for (const item of items) {
    const o = orderOf.get(item.orderId)!;
    const card = { ...base(o), position: item.position, cardName: item.cardName ?? undefined };
    const received = (o.order.autoAnchorAt ?? o.order.submittedAt ?? o.order.createdAt).toISOString();
    if (!item.cardName) push('toIdentify', { ...card, since: received });

    const kinds = new Set(photos.filter((p) => p.itemId === item.id).map((p) => p.kind));
    if (!kinds.has('front') || !kinds.has('back')) {
      const missing = [!kinds.has('front') && 'anverso', !kinds.has('back') && 'reverso'].filter(Boolean).join(' y ');
      push('photosMissing', { ...card, since: received, note: `Falta la foto del ${missing}` });
    }

    const current = resultOf.get(item.id);
    if (!current) {
      push('toGrade', { ...card, since: received });
      continue;
    }
    const { result } = current;
    const grade = result.isAuthentic ? (result.finalGrade !== null ? `Nota ${fmtGrade(Number(result.finalGrade))}` : 'Sin nota') : 'No auténtica';
    if (result.status === 'pending_qa') {
      push('toReview', { ...card, since: result.gradedAt.toISOString(), note: `${grade} · ${current.graderName ?? current.graderEmail}` });
    }
    if (result.status === 'draft' && (role === 'admin' || result.gradedBy === viewer.id)) {
      const last = reviews.find((r) => r.entityId === entityId(o.order.code, item.position));
      if (last?.action === 'grading.rejected') {
        const reason = (last.after as { reason?: string } | null)?.reason;
        push('returnedByQa', { ...card, since: last.at.toISOString(), note: reason ? `Motivo: ${reason}` : undefined });
      } else {
        push('myDrafts', { ...card, since: result.gradedAt.toISOString(), note: role === 'admin' ? current.graderName ?? current.graderEmail : undefined });
      }
    }
  }

  // Pedidos en control de calidad con todas sus cartas aprobadas: falta aprobar la salida.
  for (const o of labOrders) {
    if (o.order.status !== 'QUALITY_ASSURANCE') continue;
    const own = items.filter((i) => i.orderId === o.order.id);
    if (own.length > 0 && own.every((i) => resultOf.get(i.id)?.result.status === 'approved')) {
      push('readyToShip', { ...base(o), since: sinceChange(o), note: `${own.length} ${own.length === 1 ? 'carta aprobada' : 'cartas aprobadas'}` });
    }
  }

  return {
    sections: (SECTIONS_BY_ROLE[role] ?? []).map((key) => {
      const tasks = lists.get(key)!;
      // Lo que más tiempo lleva esperando, primero.
      tasks.sort((a, b) => a.since.localeCompare(b.since));
      return { key, count: tasks.length, tasks: tasks.slice(0, TODAY_ITEMS_LIMIT) };
    }),
  };
}
