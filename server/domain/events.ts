import { and, asc, count, desc, eq, gt, inArray } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { auditLogs, events, orders } from '../../db/schema.js';
import type { UserDto } from '../../shared/auth.js';
import { EventBody, type AdminEventDto, type PublicEventDto } from '../../shared/events.js';
import { hashIp } from '../auth/crypto.js';
import { ProblemError } from '../problem.js';

type EventRow = typeof events.$inferSelect;

export const toPublicEvent = (e: EventRow): PublicEventDto => ({
  id: e.id,
  kind: e.kind,
  name: e.name,
  city: e.city,
  countryCode: e.countryCode,
  venue: e.venue,
  address: e.address,
  details: e.details,
  startsAt: e.startsAt.toISOString(),
  endsAt: e.endsAt.toISOString(),
});

const eventNotFound = () => new ProblemError(404, 'Not Found', 'No existe ese evento.', { code: 'event_not_found' });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Eventos en los que hoy se pueden entregar cartas: publicados, que aceptan entregas y no han terminado. */
export async function listUpcomingEvents(db: Db, now = new Date()): Promise<PublicEventDto[]> {
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.published, true), eq(events.acceptsSubmissions, true), gt(events.endsAt, now)))
    .orderBy(asc(events.startsAt));
  return rows.map(toPublicEvent);
}

/** El evento elegido en un pedido, solo si todavía se puede elegir. */
export async function findBookableEvent(db: Pick<Db, 'select'>, id: string, now = new Date()) {
  const [row] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.published, true), eq(events.acceptsSubmissions, true), gt(events.endsAt, now)))
    .limit(1);
  return row;
}

/** Todos los eventos para el calendario de la dirección: primero los próximos, luego los pasados. */
export async function listAdminEvents(db: Db): Promise<AdminEventDto[]> {
  const rows = await db.select().from(events).orderBy(desc(events.startsAt));
  const ids = rows.map((r) => r.id);
  const counts = ids.length
    ? await db.select({ eventId: orders.eventId, n: count() }).from(orders).where(inArray(orders.eventId, ids)).groupBy(orders.eventId)
    : [];
  return rows.map((e) => ({
    ...toPublicEvent(e),
    acceptsSubmissions: e.acceptsSubmissions,
    published: e.published,
    orderCount: counts.find((c) => c.eventId === e.id)?.n ?? 0,
  }));
}

const values = (input: ReturnType<typeof EventBody.parse>) => ({
  kind: input.kind,
  name: input.name,
  city: input.city,
  countryCode: input.countryCode,
  venue: input.venue || null,
  address: input.address || null,
  details: input.details || null,
  startsAt: new Date(input.startsAt),
  endsAt: new Date(input.endsAt),
  acceptsSubmissions: input.acceptsSubmissions,
  published: input.published,
});

const audit = (actor: UserDto, action: string, id: string, ip: string | null, after: object | null, before: object | null = null) => ({
  actorId: actor.id,
  action,
  entityType: 'event',
  entityId: id,
  before,
  after,
  ipHash: ip ? hashIp(ip) : null,
});

export async function createEvent(db: Db, actor: UserDto, input: ReturnType<typeof EventBody.parse>, ip: string | null) {
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(events).values(values(input)).returning();
    await tx.insert(auditLogs).values(audit(actor, 'event.created', row.id, ip, values(input)));
    return row.id;
  });
}

export async function updateEvent(db: Db, actor: UserDto, id: string, input: ReturnType<typeof EventBody.parse>, ip: string | null) {
  if (!UUID.test(id)) throw eventNotFound();
  await db.transaction(async (tx) => {
    const [before] = await tx.select().from(events).where(eq(events.id, id)).limit(1);
    if (!before) throw eventNotFound();
    await tx.update(events).set({ ...values(input), updatedAt: new Date() }).where(eq(events.id, id));
    await tx.insert(auditLogs).values(audit(actor, 'event.updated', id, ip, values(input), before));
  });
}

/** Un evento que ya eligió algún pedido no se borra (esos clientes cuentan con él): se despublica. */
export async function deleteEvent(db: Db, actor: UserDto, id: string, ip: string | null) {
  if (!UUID.test(id)) throw eventNotFound();
  await db.transaction(async (tx) => {
    const [before] = await tx.select().from(events).where(eq(events.id, id)).limit(1);
    if (!before) throw eventNotFound();
    const [{ n }] = await tx.select({ n: count() }).from(orders).where(eq(orders.eventId, id));
    if (n > 0) {
      throw new ProblemError(409, 'Conflict', 'Hay pedidos que eligieron este evento: despublícalo en lugar de borrarlo.', {
        code: 'event_has_orders',
      });
    }
    await tx.delete(events).where(eq(events.id, id));
    await tx.insert(auditLogs).values(audit(actor, 'event.deleted', id, ip, null, before));
  });
}
