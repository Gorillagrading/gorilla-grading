import { sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { certificateChecks, certificates, orders, payments, serviceTiers, users } from '../db/schema.js';
import { getDashboard, listCertificateHistory } from './domain/dashboard.js';
import { createTestApp, createTestDb, insertGradedOrder, insertTier, insertUser, type TestDb } from './testing.js';

const read = (res: Response) => res.json() as Promise<any>;
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

let db: TestDb;
let t: ReturnType<typeof createTestApp>;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(
    sql`truncate users, orders, card_identities, service_tiers, otp_challenges, sessions, rate_limit_events, certificate_checks restart identity cascade`,
  );
  t = createTestApp(db);
});

async function loginAs(email: string) {
  await t.json('/api/v1/auth/otp', { email });
  const res = await t.json('/api/v1/auth/otp/verify', { email, code: t.sent.at(-1)!.code });
  return res.headers.get('set-cookie')!.split(';')[0];
}

/** Dos clientes, una carta certificada con nota 9.5 y tres pagos: dos este mes y uno de hace 45 días. */
async function business() {
  const ana = await insertUser(db, 'ana@example.com');
  const luis = await insertUser(db, 'luis@example.com');
  await db.update(users).set({ createdAt: daysAgo(45) }).where(sql`${users.id} = ${luis.id}`);
  const grader = await insertUser(db, 'grader@lab.test', 'grader');
  const qa = await insertUser(db, 'qa@lab.test', 'qa');
  const tier = await insertTier(db);
  const { orderId } = await insertGradedOrder(db, {
    ownerId: ana.id, tierId: tier.id, graderId: grader.id, qaId: qa.id, grade: 9.5,
    orderCode: '284728482', certNumber: '89240100', cardName: 'Charizard',
  });
  await db.update(orders).set({ submittedAt: daysAgo(3), totalCents: 6450 }).where(sql`${orders.id} = ${orderId}`);
  await db.insert(payments).values([
    { orderId, amountCents: 6450, status: 'paid', paidAt: daysAgo(2) },
    { orderId, amountCents: 1000, status: 'paid', paidAt: daysAgo(1) },
    { orderId, amountCents: 3000, status: 'paid', paidAt: daysAgo(45) },
    { orderId, amountCents: 9999, status: 'pending' },
  ]);
  await db.insert(orders).values({ code: '284729495', userId: luis.id, status: 'PAYMENT_PENDING', submittedAt: daysAgo(1), totalCents: 2500 });
  const [cert] = await db.select().from(certificates);
  await db.insert(certificateChecks).values([
    { certificateNumber: cert.number, certificateId: cert.id, channel: 'qr' },
    { certificateNumber: '00000000', channel: 'web' },
  ]);
}

describe('panel de negocio', () => {
  it('cuenta los ingresos cobrados, los clientes y las cartas del periodo y del anterior', async () => {
    await business();
    const d = await getDashboard(db, '30d');

    expect(d.unit).toBe('day');
    expect(d.metrics.revenueCents).toEqual({ current: 7450, previous: 3000 });
    expect(d.metrics.payments).toEqual({ current: 2, previous: 1 });
    // El personal del laboratorio no cuenta como cliente.
    expect(d.metrics.newCustomers).toEqual({ current: 1, previous: 1 });
    expect(d.metrics.cardsGraded).toEqual({ current: 1, previous: 0 });
    expect(d.metrics.orders).toEqual({ current: 2, previous: 0 });
    expect(d.metrics.certificates.current).toBe(1);
    // Solo cuentan las consultas de certificados que existen.
    expect(d.metrics.verifications.current).toBe(1);

    expect(d.totals).toEqual({ revenueCents: 10450, customers: 2, cardsGraded: 1, certificates: 1 });
    expect(d.awaitingPayment).toEqual({ orders: 1, totalCents: 2500 });
    expect(d.ordersByStatus).toEqual({ DELIVERED: 1, PAYMENT_PENDING: 1 });
    expect(d.grades).toEqual([{ grade: 9.5, count: 1 }]);
    expect(d.notAuthentic).toBe(0);
    expect(d.services).toEqual([{ code: 'premium', name: 'Premium', cards: 1, revenueCents: 2500 }]);
    expect(d.recentPayments.map((p) => p.amountCents)).toEqual([1000, 6450, 3000]);
    expect(d.recentPayments[0]).toMatchObject({ orderCode: '284728482', customerEmail: 'ana@example.com', customerName: null });
  });

  it('reparte el periodo en tramos sin huecos y suma lo mismo que el total', async () => {
    await business();
    for (const [range, unit, n] of [['30d', 'day', 30], ['90d', 'week', 13], ['12m', 'month', 12]] as const) {
      const d = await getDashboard(db, range);
      expect(d.unit).toBe(unit);
      expect(d.buckets).toHaveLength(n);
      expect(d.buckets.reduce((s, b) => s + b.revenueCents, 0)).toBe(d.metrics.revenueCents.current);
      expect(d.buckets.reduce((s, b) => s + b.newCustomers, 0)).toBe(d.metrics.newCustomers.current);
    }
    const all = await getDashboard(db, 'all');
    expect(all.metrics.revenueCents).toEqual({ current: 10450, previous: null });
    expect(all.buckets.at(-1)!.start.endsWith('-01')).toBe(true);
  });

  it('sin datos devuelve ceros, no inventa nada', async () => {
    const d = await getDashboard(db, '30d');
    expect(d.metrics.revenueCents).toEqual({ current: 0, previous: 0 });
    expect(d.totals).toEqual({ revenueCents: 0, customers: 0, cardsGraded: 0, certificates: 0 });
    expect(d.buckets.every((b) => b.revenueCents === 0 && b.orders === 0)).toBe(true);
    expect(d.recentPayments).toEqual([]);
  });

  it('el historial lista cada carta certificada con el correo del cliente y su número de certificado', async () => {
    await business();
    const luis = (await db.select().from(users).where(sql`${users.email} = 'luis@example.com'`))[0];
    const grader = (await db.select().from(users).where(sql`${users.email} = 'grader@lab.test'`))[0];
    const qa = (await db.select().from(users).where(sql`${users.email} = 'qa@lab.test'`))[0];
    const [tier] = await db.select().from(serviceTiers);
    await insertGradedOrder(db, {
      ownerId: luis.id, tierId: tier.id, graderId: grader.id, qaId: qa.id, grade: 10,
      orderCode: '284730508', certNumber: '00012345', cardName: 'Pikachu Illustrator',
    });

    const all = await listCertificateHistory(db, { page: 1 });
    expect(all.total).toBe(2);
    expect(all.rows[0]).toMatchObject({
      certNumber: '00012345', cardName: 'Pikachu Illustrator', grade: 10, orderCode: '284730508',
      customerEmail: 'luis@example.com', status: 'active',
    });
    expect(all.rows[1]).toMatchObject({ certNumber: '89240100', customerEmail: 'ana@example.com', grade: 9.5 });

    for (const q of ['ana@', '8924', 'charizard', '284728482']) {
      const found = await listCertificateHistory(db, { q, page: 1 });
      expect(found.rows.map((r) => r.certNumber), q).toEqual(['89240100']);
    }
    // Lo escrito se busca tal cual: un % no es un comodín.
    expect((await listCertificateHistory(db, { q: '%', page: 1 })).total).toBe(0);
  });

  it('solo lo ve el rol admin', async () => {
    await insertUser(db, 'admin@lab.test', 'admin');
    await insertUser(db, 'qa@lab.test', 'qa');
    await insertUser(db, 'ana@example.com');
    const get = (cookie?: string, range = '30d') =>
      t.app.request(`/api/v1/admin/dashboard?range=${range}`, { headers: cookie ? { cookie } : {} });

    expect((await get()).status).toBe(401);
    expect((await get(await loginAs('ana@example.com'))).status).toBe(403);
    const qa = await loginAs('qa@lab.test');
    expect((await get(qa)).status).toBe(403);

    const admin = await loginAs('admin@lab.test');
    const res = await get(admin);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect((await read(res)).range).toBe('30d');
    expect((await get(admin, 'siempre')).status).toBe(422);

    const history = (cookie: string) => t.app.request('/api/v1/admin/dashboard/certificates?q=GGI', { headers: { cookie } });
    expect((await history(qa)).status).toBe(403);
    const ok = await history(admin);
    expect(ok.status).toBe(200);
    expect(await read(ok)).toMatchObject({ rows: [], total: 0, page: 1 });
  });
});
