/**
 * Da un rol del laboratorio a una cuenta.
 * Uso: npm run staff:role -- persona@ejemplo.com admin
 *
 * Roles: customer, staff, grader, qa, admin. Si la cuenta no existe se crea; la persona
 * confirma su correo al iniciar sesión por primera vez, como cualquier cliente.
 * Cada cambio queda en el registro de auditoría.
 */
import { existsSync } from 'node:fs';
import { eq, sql } from 'drizzle-orm';
import { UserRole } from '../shared/domain.js';
import { createDb } from './client.js';
import { auditLogs, sessions, users } from './schema.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const [emailArg, roleArg] = process.argv.slice(2);
const role = UserRole.safeParse(roleArg);
if (!emailArg || !emailArg.includes('@') || !role.success) {
  console.error(`Uso: npm run staff:role -- <correo> <${UserRole.options.join('|')}>`);
  process.exit(1);
}

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error('Define DATABASE_URL (o MIGRATION_DATABASE_URL) en .env');

const email = emailArg.trim().toLowerCase();
const db = createDb(url);

try {
  const [existing] = await db.select().from(users).where(sql`lower(${users.email}) = ${email}`);
  if (existing) {
    await db.update(users).set({ role: role.data }).where(eq(users.id, existing.id));
    // Las sesiones abiertas se cierran para que el cambio de permisos se note al momento.
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, existing.id));
  } else {
    await db.insert(users).values({ email, role: role.data });
  }
  await db.insert(auditLogs).values({
    action: 'user.role_changed',
    entityType: 'user',
    entityId: email,
    before: { role: existing?.role ?? null },
    after: { role: role.data },
  });
  console.log(`${email}: ${existing ? `${existing.role} -> ` : 'cuenta nueva, rol '}${role.data}`);
  if (existing) console.log('Sus sesiones abiertas se han cerrado: tendrá que volver a entrar.');
} finally {
  await db.$client.end();
}
