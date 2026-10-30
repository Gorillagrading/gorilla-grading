import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { consents, newsletterSubscriptions } from '../db/schema.js';
import { createTestApp, createTestDb, insertUser, type TestDb } from './testing.js';

const read = (res: Response) => res.json() as Promise<any>;

let db: TestDb;
let t: ReturnType<typeof createTestApp>;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(sql`truncate users, otp_challenges, sessions, rate_limit_events, email_outbox, newsletter_subscriptions, consents restart identity cascade`);
  t = createTestApp(db);
});

const post = (path: string, body: unknown, ip = '203.0.113.30') =>
  t.app.request(`/api/v1${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

/** El enlace que llega en el correo de confirmación. */
const linkToken = () => {
  const mail = t.mails.at(-1)!;
  return new URL(mail.text.match(/https?:\/\/\S*action=confirm\S*/)![0]).searchParams.get('token')!;
};

describe('newsletter', () => {
  it('pide confirmar por correo; solo con el enlace queda suscrito y consta el consentimiento', async () => {
    expect((await post('/newsletter', { email: 'Ana@Example.com', locale: 'es' })).status).toBe(202);
    const [pending] = await db.select().from(newsletterSubscriptions);
    expect(pending).toMatchObject({ email: 'ana@example.com', status: 'pending', confirmedAt: null });

    const mail = t.mails.at(-1)!;
    expect(mail.to).toBe('ana@example.com');
    expect(mail.subject).toBe('Confirma tu suscripción al Inner Circle');
    expect(mail.text).toContain('action=unsubscribe');

    expect((await post('/newsletter/confirm', { token: linkToken() })).status).toBe(200);
    const [row] = await db.select().from(newsletterSubscriptions);
    expect(row.status).toBe('confirmed');
    expect(row.confirmedAt).not.toBeNull();
    expect(await db.select().from(consents)).toMatchObject([{ email: 'ana@example.com', kind: 'marketing', granted: true }]);
  });

  it('la baja con el mismo enlace queda registrada', async () => {
    await post('/newsletter', { email: 'ana@example.com', locale: 'en' });
    const token = linkToken();
    expect(t.mails.at(-1)!.subject).toBe('Confirm your subscription to the Inner Circle');
    await post('/newsletter/confirm', { token });
    expect((await post('/newsletter/unsubscribe', { token })).status).toBe(200);
    const [row] = await db.select().from(newsletterSubscriptions);
    expect(row.status).toBe('unsubscribed');
    expect((await db.select().from(consents)).map((c) => c.granted)).toEqual([true, false]);
    // Con la baja hecha, el enlace ya no confirma.
    expect((await post('/newsletter/confirm', { token })).status).toBe(404);
  });

  it('no revela si un correo ya está suscrito ni le vuelve a escribir', async () => {
    await post('/newsletter', { email: 'ana@example.com' });
    await post('/newsletter/confirm', { token: linkToken() });
    const sent = t.mails.length;
    const again = await post('/newsletter', { email: 'ana@example.com' });
    expect(again.status).toBe(202);
    expect(t.mails.length).toBe(sent);
  });

  it('rechaza enlaces falsos, correos no válidos y robots; limita los intentos', async () => {
    expect((await post('/newsletter/confirm', { token: 'x'.repeat(32) })).status).toBe(404);
    expect((await post('/newsletter', { email: 'no-es-correo' })).status).toBe(422);
    expect((await post('/newsletter', { email: 'robot@example.com', website: 'http://spam' }, '203.0.113.31')).status).toBe(202);
    expect(await db.select().from(newsletterSubscriptions).where(eq(newsletterSubscriptions.email, 'robot@example.com'))).toHaveLength(0);
    for (let i = 0; i < 5; i++) await post('/newsletter', { email: `p${i}@example.com` }, '203.0.113.40');
    expect((await post('/newsletter', { email: 'p6@example.com' }, '203.0.113.40')).status).toBe(429);
  });

  it('la dirección ve los suscriptores confirmados para exportarlos', async () => {
    await insertUser(db, 'ceo@lab.test', 'admin');
    await t.json('/api/v1/auth/otp', { email: 'ceo@lab.test' });
    const res = await t.json('/api/v1/auth/otp/verify', { email: 'ceo@lab.test', code: t.sent.at(-1)!.code });
    const cookie = res.headers.get('set-cookie')!.split(';')[0];

    await post('/newsletter', { email: 'ana@example.com' });
    await post('/newsletter/confirm', { token: linkToken() });
    await post('/newsletter', { email: 'luis@example.com' });

    const stats = await read(await t.app.request('/api/v1/admin/newsletter', { headers: { cookie } }));
    expect(stats).toMatchObject({ confirmed: 1, pending: 1, unsubscribed: 0, subscribers: [{ email: 'ana@example.com', locale: 'es' }] });
    expect((await t.app.request('/api/v1/admin/newsletter')).status).toBe(401);
  });
});
