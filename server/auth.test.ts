import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { otpChallenges, sessions, users } from '../db/schema';
import { createTestApp, createTestDb, type TestDb } from './testing';

let db: TestDb;
let t: ReturnType<typeof createTestApp>;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(sql`truncate otp_challenges, sessions, users cascade`);
  t = createTestApp(db);
});

const EMAIL = 'ana@example.com';

/** Cookie de sesión de una respuesta, lista para reenviar. */
const sessionCookie = (res: Response) => res.headers.get('set-cookie')?.split(';')[0] ?? '';

async function login(email = EMAIL) {
  await t.json('/api/v1/auth/otp', { email });
  const { code } = t.sent.at(-1)!;
  const res = await t.json('/api/v1/auth/otp/verify', { email, code });
  return { res, cookie: sessionCookie(res), code };
}

/** Evita el enfriamiento de 30 s entre dos códigos del mismo email. */
const skipCooldown = () => db.execute(sql`update otp_challenges set created_at = created_at - interval '1 minute'`);

describe('pedir un código', () => {
  it('responde 202 y envía un código de 6 dígitos', async () => {
    const res = await t.json('/api/v1/auth/otp', { email: EMAIL });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ status: 'sent', expiresInSeconds: 600 });
    expect(t.sent).toHaveLength(1);
    expect(t.sent[0].code).toMatch(/^\d{6}$/);
  });

  it('normaliza el email a minúsculas', async () => {
    await t.json('/api/v1/auth/otp', { email: '  Ana@Example.COM ' });
    expect(t.sent[0].to).toBe('ana@example.com');
  });

  it('no guarda el código en claro', async () => {
    await t.json('/api/v1/auth/otp', { email: EMAIL });
    const [row] = await db.select().from(otpChallenges);
    expect(row.codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.codeHash).not.toContain(t.sent[0].code);
  });

  it('rechaza un email inválido con 422', async () => {
    const res = await t.json('/api/v1/auth/otp', { email: 'no-es-un-email' });
    expect(res.status).toBe(422);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    expect(await res.json()).toMatchObject({ code: 'validation_error' });
  });

  it('responde igual para una cuenta nueva y una existente', async () => {
    await login();
    await skipCooldown();
    const nueva = await t.json('/api/v1/auth/otp', { email: 'nueva@example.com' });
    const existente = await t.json('/api/v1/auth/otp', { email: EMAIL });
    expect(existente.status).toBe(nueva.status);
    expect(await existente.json()).toEqual(await nueva.json());
  });

  it('no permite pedir otro código antes de 30 segundos', async () => {
    await t.json('/api/v1/auth/otp', { email: EMAIL });
    const res = await t.json('/api/v1/auth/otp', { email: EMAIL });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(await res.json()).toMatchObject({ code: 'too_many_requests' });
  });

  it('limita a 5 códigos por hora y email', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await t.json('/api/v1/auth/otp', { email: EMAIL })).status).toBe(202);
      await skipCooldown();
    }
    expect((await t.json('/api/v1/auth/otp', { email: EMAIL })).status).toBe(429);
  });

  it('limita a 20 códigos por hora y dirección IP', async () => {
    const headers = { 'x-forwarded-for': '203.0.113.9' };
    for (let i = 0; i < 20; i++) {
      expect((await t.json('/api/v1/auth/otp', { email: `u${i}@example.com` }, headers)).status).toBe(202);
    }
    expect((await t.json('/api/v1/auth/otp', { email: 'otro@example.com' }, headers)).status).toBe(429);
  });

  it('un código nuevo anula el anterior', async () => {
    await t.json('/api/v1/auth/otp', { email: EMAIL });
    const first = t.sent[0].code;
    await skipCooldown();
    await t.json('/api/v1/auth/otp', { email: EMAIL });
    const second = t.sent[1].code;

    const old = await t.json('/api/v1/auth/otp/verify', { email: EMAIL, code: first });
    if (first !== second) expect(old.status).toBe(400);
    const current = await t.json('/api/v1/auth/otp/verify', { email: EMAIL, code: second });
    expect(current.status).toBe(200);
  });
});

describe('verificar el código', () => {
  it('con el código correcto crea la cuenta y una cookie httpOnly', async () => {
    const { res } = await login();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ user: { email: EMAIL, role: 'customer' } });

    const cookie = res.headers.get('set-cookie')!;
    expect(cookie).toMatch(/^gg_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(await db.select().from(users)).toHaveLength(1);
  });

  it('no guarda el token de sesión en claro', async () => {
    const { cookie } = await login();
    const token = cookie.split('=')[1];
    const [row] = await db.select().from(sessions);
    expect(row.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.tokenHash).not.toBe(token);
  });

  it('la segunda vez inicia sesión en la misma cuenta', async () => {
    await login();
    await skipCooldown();
    const { res } = await login();
    expect(res.status).toBe(200);
    expect(await db.select().from(users)).toHaveLength(1);
    expect(await db.select().from(sessions)).toHaveLength(2);
  });

  it('un código solo sirve una vez', async () => {
    const { code } = await login();
    const again = await t.json('/api/v1/auth/otp/verify', { email: EMAIL, code });
    expect(again.status).toBe(400);
  });

  it('un código incorrecto indica los intentos que quedan', async () => {
    await t.json('/api/v1/auth/otp', { email: EMAIL });
    const wrong = t.sent[0].code === '000000' ? '111111' : '000000';
    const res = await t.json('/api/v1/auth/otp/verify', { email: EMAIL, code: wrong });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'invalid_code', attemptsLeft: 4 });
  });

  it('se bloquea tras 5 intentos, aunque después se envíe el código correcto', async () => {
    await t.json('/api/v1/auth/otp', { email: EMAIL });
    const { code } = t.sent[0];
    const wrong = code === '000000' ? '111111' : '000000';

    for (let i = 0; i < 4; i++) {
      expect((await t.json('/api/v1/auth/otp/verify', { email: EMAIL, code: wrong })).status).toBe(400);
    }
    const fifth = await t.json('/api/v1/auth/otp/verify', { email: EMAIL, code: wrong });
    expect(fifth.status).toBe(429);
    expect(await fifth.json()).toMatchObject({ code: 'too_many_attempts' });

    const correct = await t.json('/api/v1/auth/otp/verify', { email: EMAIL, code });
    expect(correct.status).toBe(429);
    expect(await db.select().from(sessions)).toHaveLength(0);
  });

  it('un código caducado no sirve', async () => {
    await t.json('/api/v1/auth/otp', { email: EMAIL });
    await db.update(otpChallenges).set({ expiresAt: new Date(Date.now() - 1000) });
    const res = await t.json('/api/v1/auth/otp/verify', { email: EMAIL, code: t.sent[0].code });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'invalid_code' });
  });

  it('un email sin código pedido recibe el mismo error genérico', async () => {
    const res = await t.json('/api/v1/auth/otp/verify', { email: 'nadie@example.com', code: '123456' });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'invalid_code' });
  });

  it('rechaza un código que no tiene 6 dígitos', async () => {
    const res = await t.json('/api/v1/auth/otp/verify', { email: EMAIL, code: '12345' });
    expect(res.status).toBe(422);
  });

  it('el código de un email no sirve para otro', async () => {
    await t.json('/api/v1/auth/otp', { email: EMAIL });
    await t.json('/api/v1/auth/otp', { email: 'bea@example.com' });
    const res = await t.json('/api/v1/auth/otp/verify', { email: 'bea@example.com', code: t.sent[0].code });
    if (t.sent[0].code !== t.sent[1].code) expect(res.status).toBe(400);
  });
});

describe('sesión', () => {
  it('GET /me devuelve el usuario con la cookie', async () => {
    const { cookie } = await login();
    const res = await t.app.request('/api/v1/me', { headers: { cookie } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ user: { email: EMAIL } });
  });

  it('GET /me sin cookie devuelve 401', async () => {
    const res = await t.app.request('/api/v1/me');
    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    expect(await res.json()).toMatchObject({ code: 'unauthenticated' });
  });

  it('GET /me con una cookie inventada devuelve 401', async () => {
    const res = await t.app.request('/api/v1/me', { headers: { cookie: 'gg_session=inventada' } });
    expect(res.status).toBe(401);
  });

  it('una sesión caducada devuelve 401', async () => {
    const { cookie } = await login();
    await db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) });
    expect((await t.app.request('/api/v1/me', { headers: { cookie } })).status).toBe(401);
  });

  it('cerrar sesión revoca la sesión y borra la cookie', async () => {
    const { cookie } = await login();
    const out = await t.app.request('/api/v1/auth/logout', { method: 'POST', headers: { cookie } });
    expect(out.status).toBe(204);
    expect(out.headers.get('set-cookie')).toMatch(/gg_session=;/);

    // El token antiguo ya no sirve aunque el navegador lo conserve.
    expect((await t.app.request('/api/v1/me', { headers: { cookie } })).status).toBe(401);
    const [row] = await db.select().from(sessions);
    expect(row.revokedAt).not.toBeNull();
  });

  it('cerrar sesión sin estar dentro no da error', async () => {
    const res = await t.app.request('/api/v1/auth/logout', { method: 'POST' });
    expect(res.status).toBe(204);
  });

  it('una cuenta eliminada no puede usar su sesión', async () => {
    const { cookie } = await login();
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.email, EMAIL));
    expect((await t.app.request('/api/v1/me', { headers: { cookie } })).status).toBe(401);
  });
});

describe('protección contra peticiones de otros sitios', () => {
  it('rechaza un POST que viene de otro origen', async () => {
    const res = await t.json('/api/v1/auth/otp', { email: EMAIL }, { origin: 'https://sitio-malicioso.example' });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'cross_origin' });
    expect(t.sent).toHaveLength(0);
  });

  it('acepta el origen de desarrollo', async () => {
    const res = await t.json('/api/v1/auth/otp', { email: EMAIL }, { origin: 'http://localhost:5173' });
    expect(res.status).toBe(202);
  });
});
