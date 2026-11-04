import { beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, createTestDb, insertUser, type TestDb } from './testing.js';

describe('nombre de la propia cuenta', () => {
  let db: TestDb;
  beforeAll(async () => {
    db = await createTestDb();
  });

  it('cada persona puede poner su nombre; sin sesión no se puede', async () => {
    const t = createTestApp(db);
    await insertUser(db, 'ana@lab.test', 'grader');
    await t.json('/api/v1/auth/otp', { email: 'ana@lab.test' });
    const login = await t.json('/api/v1/auth/otp/verify', { email: 'ana@lab.test', code: t.sent.at(-1)!.code });
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    const put = (body: unknown, withCookie = true) =>
      t.app.request('/api/v1/me', { method: 'PUT', headers: { 'content-type': 'application/json', ...(withCookie ? { cookie } : {}) }, body: JSON.stringify(body) });

    expect((await put({ fullName: 'Ana Ruiz' }, false)).status).toBe(401);
    expect((await put({ fullName: '   ' })).status).toBe(422);

    const res = await put({ fullName: '  Ana Ruiz ' });
    expect(res.status).toBe(200);
    expect((await res.json() as any).user).toMatchObject({ email: 'ana@lab.test', fullName: 'Ana Ruiz', role: 'grader' });
    const me = await t.app.request('/api/v1/me', { headers: { cookie } });
    expect((await me.json() as any).user.fullName).toBe('Ana Ruiz');
  });
});
