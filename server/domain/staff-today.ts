import { and, asc, desc, eq, inArray, isNotNull, max, ne } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { custodyEvents, gradingResults, itemImages, orderItems, orders, users } from '../../db/schema.js';
import type { StaffRole } from '../../shared/admin.js';
import type { UserDto } from '../../shared/auth.js';
import type { OrderStatus } from '../../shared/domain.js';
import {
  PIPELINE_STAGES, SECTIONS_BY_ROLE, TODAY_ITEMS_LIMIT, type StaffToday, type TodaySectionKey, type TodayTask,
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
    status: o.order.status,
    startedAt: o.order.autoAnchorAt?.toISOString() ?? null,
    dueDate: o.order.estimatedCompletionAt ?? null,
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
          .select()
          .from(gradingResults)
          .where(and(inArray(gradingResults.orderItemId, itemIds), ne(gradingResults.status, 'superseded'))),
        db
          .select({ itemId: itemImages.orderItemId, kind: itemImages.kind })
          .from(itemImages)
          .where(and(inArray(itemImages.orderItemId, itemIds), isNotNull(itemImages.uploadedAt))),
      ])
    : [[], []];
  const resultOf = new Map(results.map((r) => [r.orderItemId, r]));
  const orderOf = new Map(labOrders.map((o) => [o.order.id, o]));

  // Cada carta tiene tres cosas: el PDF del escáner, las dos fotos del slab y la confirmación.
  for (const item of items) {
    const o = orderOf.get(item.orderId)!;
    const card = { ...base(o), position: item.position, cardName: item.cardName ?? undefined };
    const received = (o.order.autoAnchorAt ?? o.order.submittedAt ?? o.order.createdAt).toISOString();
    const kinds = new Set(photos.filter((p) => p.itemId === item.id).map((p) => p.kind));
    const missingPhotos = [!kinds.has('front') && 'anverso', !kinds.has('back') && 'reverso'].filter(Boolean).join(' y ');
    const result = resultOf.get(item.id);

    if (!result || result.status === 'draft') {
      const missing = ['el PDF del escáner', missingPhotos && `la foto del slab (${missingPhotos})`].filter(Boolean).join(' y ');
      push('toScan', { ...card, since: received, note: `Falta ${missing}` });
      continue;
    }
    if (result.status === 'pending_qa') {
      const grade = result.isAuthentic ? (result.finalGrade !== null ? `Nota ${fmtGrade(Number(result.finalGrade))}` : 'Sin nota') : 'No auténtica';
      const note = missingPhotos && result.isAuthentic ? `${grade} · falta la foto del slab (${missingPhotos})` : !item.cardName ? `${grade} · sin nombre de carta` : grade;
      push('toConfirm', { ...card, since: result.gradedAt.toISOString(), note });
    }
  }

  // Pedidos en control de calidad con todas sus cartas confirmadas: falta aprobar la salida.
  for (const o of labOrders) {
    if (o.order.status !== 'QUALITY_ASSURANCE') continue;
    const own = items.filter((i) => i.orderId === o.order.id);
    if (own.length > 0 && own.every((i) => resultOf.get(i.id)?.status === 'approved')) {
      push('readyToShip', { ...base(o), since: sinceChange(o), note: `${own.length} ${own.length === 1 ? 'carta confirmada' : 'cartas confirmadas'}` });
    }
  }

  const isLate = (o: (typeof orderRows)[number]) =>
    (LAB.includes(o.order.status) || o.order.status === 'ON_HOLD') && !!o.order.estimatedCompletionAt && o.order.estimatedCompletionAt < today;
  const pipeline = PIPELINE_STAGES.map((status) => {
    const inStage = orderRows.filter((o) => o.order.status === status);
    return { status, count: inStage.length, late: inStage.filter(isLate).length };
  });

  return {
    pipeline,
    sections: (SECTIONS_BY_ROLE[role] ?? []).map((key) => {
      const tasks = lists.get(key)!;
      // Lo que más tiempo lleva esperando, primero.
      tasks.sort((a, b) => a.since.localeCompare(b.since));
      return { key, count: tasks.length, tasks: tasks.slice(0, TODAY_ITEMS_LIMIT) };
    }),
  };
}
