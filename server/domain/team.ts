import { and, eq, inArray, isNull, max, ne, sql } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { auditLogs, emailOutbox, sessions, users } from '../../db/schema.js';
import { STAFF_ROLES, type StaffRole } from '../../shared/admin.js';
import type { UserDto } from '../../shared/auth.js';
import type { AddMemberBody, TeamMemberDto } from '../../shared/team.js';
import { hashIp } from '../auth/crypto.js';
import { ProblemError } from '../problem.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const conflict = (detail: string, code: string) => new ProblemError(409, 'Conflict', detail, { code });
const memberNotFound = () => new ProblemError(404, 'Not Found', 'No existe esa persona en el equipo.', { code: 'member_not_found' });

/** Todas las cuentas del laboratorio, con la última vez que entraron. */
export async function listTeam(db: Db): Promise<TeamMemberDto[]> {
  const rows = await db
    .select({ user: users, lastSeenAt: max(sessions.lastSeenAt), lastLogin: max(sessions.createdAt) })
    .from(users)
    .leftJoin(sessions, eq(sessions.userId, users.id))
    .where(and(inArray(users.role, [...STAFF_ROLES]), isNull(users.deletedAt)))
    .groupBy(users.id)
    .orderBy(users.createdAt);
  return rows.map(({ user, lastSeenAt, lastLogin }) => {
    const seen = lastSeenAt ?? lastLogin;
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as StaffRole,
      activated: !!user.emailVerifiedAt,
      lastSeenAt: seen ? new Date(seen).toISOString() : null,
      addedAt: user.createdAt.toISOString(),
    };
  });
}

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** Un cambio de permisos se nota al momento: se cierran sus sesiones abiertas. */
const revokeSessions = (tx: Tx, userId: string) =>
  tx.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));

const audit = (tx: Tx, actor: UserDto, email: string, before: string | null, after: string, ip: string | null) =>
  tx.insert(auditLogs).values({
    actorId: actor.id,
    action: 'user.role_changed',
    entityType: 'user',
    entityId: email,
    before: { role: before },
    after: { role: after },
    ipHash: ip ? hashIp(ip) : null,
  });

/** Siempre tiene que quedar al menos una persona de dirección. */
async function assertAnotherAdmin(tx: Tx, userId: string) {
  const [{ n }] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.role, 'admin'), isNull(users.deletedAt), ne(users.id, userId)));
  if (n === 0) throw conflict('Tiene que quedar al menos una persona de dirección.', 'last_admin');
}

/**
 * Da de alta a una persona del equipo. Si ya tenía cuenta de cliente, la conserva y le da el rol.
 * Le llega un correo explicando cómo entrar: con su correo y el código que recibe al iniciar sesión.
 */
export async function addMember(db: Db, actor: UserDto, input: AddMemberBody, ip: string | null): Promise<TeamMemberDto['id']> {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(users).where(sql`lower(${users.email}) = ${input.email}`).limit(1);
    if (existing && (STAFF_ROLES as readonly string[]).includes(existing.role) && !existing.deletedAt) {
      throw conflict('Esta persona ya está en el equipo. Cambia su rol desde la lista.', 'already_member');
    }

    let id: string;
    if (existing) {
      if (existing.deletedAt) throw conflict('Esa cuenta está dada de baja.', 'account_deleted');
      await tx
        .update(users)
        .set({ role: input.role, ...(input.fullName && !existing.fullName ? { fullName: input.fullName } : {}) })
        .where(eq(users.id, existing.id));
      await revokeSessions(tx, existing.id);
      id = existing.id;
    } else {
      const [created] = await tx
        .insert(users)
        .values({ email: input.email, fullName: input.fullName || null, role: input.role })
        .returning({ id: users.id });
      id = created.id;
    }
    await audit(tx, actor, input.email, existing?.role ?? null, input.role, ip);
    await tx
      .insert(emailOutbox)
      .values({
        dedupeKey: `team:${id}:${input.role}:${Date.now()}`,
        toEmail: input.email,
        template: 'team_invite',
        locale: existing?.locale ?? 'es',
        data: { role: input.role, fullName: input.fullName || existing?.fullName || null, invitedBy: actor.fullName ?? actor.email },
      });
    return id;
  });
}

export async function changeRole(db: Db, actor: UserDto, id: string, role: StaffRole, ip: string | null) {
  if (!UUID.test(id)) throw memberNotFound();
  if (id === actor.id) throw conflict('No puedes cambiar tu propio rol. Pídeselo a otra persona de dirección.', 'own_role');
  await db.transaction(async (tx) => {
    const [member] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
    if (!member || member.deletedAt || !(STAFF_ROLES as readonly string[]).includes(member.role)) throw memberNotFound();
    if (member.role === role) return;
    if (member.role === 'admin') await assertAnotherAdmin(tx, id);
    await tx.update(users).set({ role }).where(eq(users.id, id));
    await revokeSessions(tx, id);
    await audit(tx, actor, member.email, member.role, role, ip);
  });
}

/** Quita a alguien del equipo: su cuenta queda como la de un cliente y su historial se conserva. */
export async function removeMember(db: Db, actor: UserDto, id: string, ip: string | null) {
  if (!UUID.test(id)) throw memberNotFound();
  if (id === actor.id) throw conflict('No puedes quitarte a ti mismo del equipo.', 'own_role');
  await db.transaction(async (tx) => {
    const [member] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
    if (!member || member.deletedAt || !(STAFF_ROLES as readonly string[]).includes(member.role)) throw memberNotFound();
    if (member.role === 'admin') await assertAnotherAdmin(tx, id);
    await tx.update(users).set({ role: 'customer' }).where(eq(users.id, id));
    await revokeSessions(tx, id);
    await audit(tx, actor, member.email, member.role, 'customer', ip);
  });
}
