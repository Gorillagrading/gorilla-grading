import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { auditLogs, users } from '../db/schema.js';
import { createTestApp, createTestDb, insertUser, type TestDb } from './testing.js';

const read = (res: Response) => res.json() as Promise<any>;

let db: TestDb;
let t: ReturnType<typeof createTestApp>;
const cookies = new Map<string, string>();

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(sql`truncate users, otp_challenges, sessions, rate_limit_events, email_outbox, audit_logs restart identity cascade`);
  cookies.clear();
  t = createTestApp(db);
  await insertUser(db, 'ceo@lab.test', 'admin');
  await insertUser(db, 'staff@lab.test', 'staff');
  for (const email of ['ceo@lab.test', 'staff@lab.test']) await loginAs(email);
});

async function loginAs(email: string) {
  await t.json('/api/v1/auth/otp', { email });
  const res = await t.json('/api/v1/auth/otp/verify', { email, code: t.sent.at(-1)!.code });
  cookies.set(email, res.headers.get('set-cookie')!.split(';')[0]);
  return res;
}

const api = (path: string, email: string | null, init: { method?: string; body?: unknown } = {}) =>
  t.app.request(`/api/v1${path}`, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers: { ...(email ? { cookie: cookies.get(email)! } : {}), ...(init.body ? { 'content-type': 'application/json' } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

const members = async () => (await read(await api('/admin/team', 'ceo@lab.test'))).members as any[];
const idOf = async (email: string) => (await members()).find((m) => m.email === email).id as string;

describe('equipo', () => {
  it('la dirección da de alta a una persona nueva, que recibe un correo y entra con su código', async () => {
    const res = await api('/admin/team', 'ceo@lab.test', { body: { email: 'Lucia@Lab.test', fullName: 'Lucía Gómez', role: 'grader' } });
    expect(res.status).toBe(201);

    const lucia = (await members()).find((m) => m.email === 'lucia@lab.test');
    expect(lucia).toMatchObject({ fullName: 'Lucía Gómez', role: 'grader', activated: false, lastSeenAt: null });

    const mail = t.mails.find((m) => m.to === 'lucia@lab.test')!;
    expect(mail.subject).toBe('Ya tienes acceso al panel del laboratorio de Gorilla Grading');
    expect(mail.text).toContain('«Calificación»');
    expect(mail.text).toContain('/login');

    // Entra como todos: con el código que le llega al correo, y ya tiene su rol.
    const login = await loginAs('lucia@lab.test');
    expect((await read(login)).user).toMatchObject({ email: 'lucia@lab.test', role: 'grader' });
    expect((await members()).find((m) => m.email === 'lucia@lab.test').activated).toBe(true);
  });

  it('a un cliente que ya tenía cuenta le da el rol sin crear otra', async () => {
    await insertUser(db, 'ana@example.com');
    expect((await api('/admin/team', 'ceo@lab.test', { body: { email: 'ana@example.com', role: 'qa' } })).status).toBe(201);
    const rows = await db.select().from(users).where(eq(users.email, 'ana@example.com'));
    expect(rows).toHaveLength(1);
    expect(rows[0].role).toBe('qa');
    // Ya estando en el equipo, no se vuelve a dar de alta.
    const again = await api('/admin/team', 'ceo@lab.test', { body: { email: 'ana@example.com', role: 'staff' } });
    expect(again.status).toBe(409);
    expect(await read(again)).toMatchObject({ code: 'already_member' });
  });

  it('cambiar el rol o quitar a alguien cierra sus sesiones y queda registrado', async () => {
    const staffId = await idOf('staff@lab.test');
    expect((await api(`/admin/team/${staffId}`, 'ceo@lab.test', { method: 'PUT', body: { role: 'qa' } })).status).toBe(204);
    // Su sesión anterior ya no vale: tiene que volver a entrar.
    expect((await api('/admin/today', 'staff@lab.test')).status).toBe(401);
    expect((await db.select().from(users).where(eq(users.id, staffId)))[0].role).toBe('qa');

    expect((await api(`/admin/team/${staffId}`, 'ceo@lab.test', { method: 'DELETE' })).status).toBe(204);
    expect((await members()).map((m) => m.email)).toEqual(['ceo@lab.test']);
    const [row] = await db.select().from(users).where(eq(users.id, staffId));
    expect(row.role).toBe('customer');

    const log = await db.select().from(auditLogs).where(eq(auditLogs.action, 'user.role_changed'));
    expect(log.map((l) => [l.before, l.after])).toEqual([
      [{ role: 'staff' }, { role: 'qa' }],
      [{ role: 'qa' }, { role: 'customer' }],
    ]);
  });

  it('nadie se cambia su propio rol y siempre queda alguien de dirección', async () => {
    const ceoId = await idOf('ceo@lab.test');
    expect((await read(await api(`/admin/team/${ceoId}`, 'ceo@lab.test', { method: 'PUT', body: { role: 'staff' } }))).code).toBe('own_role');
    expect((await read(await api(`/admin/team/${ceoId}`, 'ceo@lab.test', { method: 'DELETE' }))).code).toBe('own_role');

    // Con dos personas de dirección, una puede quitar a la otra; la última no se queda sola sin dirección.
    await api('/admin/team', 'ceo@lab.test', { body: { email: 'socio@lab.test', role: 'admin' } });
    const socioId = await idOf('socio@lab.test');
    expect((await api(`/admin/team/${socioId}`, 'ceo@lab.test', { method: 'PUT', body: { role: 'staff' } })).status).toBe(204);
  });

  it('solo la dirección gestiona el equipo y los datos se validan', async () => {
    expect((await api('/admin/team', 'staff@lab.test')).status).toBe(403);
    expect((await api('/admin/team', 'staff@lab.test', { body: { email: 'x@lab.test', role: 'admin' } })).status).toBe(403);
    expect((await api('/admin/team', null)).status).toBe(401);
    for (const body of [{ email: 'no-es-correo', role: 'qa' }, { email: 'x@lab.test', role: 'customer' }, { email: 'x@lab.test', role: 'jefe' }]) {
      expect((await api('/admin/team', 'ceo@lab.test', { body })).status).toBe(422);
    }
    expect((await api('/admin/team/no-existe', 'ceo@lab.test', { method: 'PUT', body: { role: 'qa' } })).status).toBe(404);
  });
});
