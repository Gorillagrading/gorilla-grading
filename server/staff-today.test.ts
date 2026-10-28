import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { orders } from '../db/schema.js';
import { createTestApp, createTestDb, insertAllTiers, insertUser, type TestDb } from './testing.js';

const read = (res: Response) => res.json() as Promise<any>;

let db: TestDb;
let t: ReturnType<typeof createTestApp>;
const cookies = new Map<string, string>();

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(
    sql`truncate users, orders, service_tiers, otp_challenges, sessions, rate_limit_events, consents, email_outbox, audit_logs restart identity cascade`,
  );
  await insertAllTiers(db);
  cookies.clear();
  t = createTestApp(db);
  for (const [email, role] of [
    ['staff@lab.test', 'staff'], ['grader@lab.test', 'grader'], ['grader2@lab.test', 'grader'],
    ['qa@lab.test', 'qa'], ['admin@lab.test', 'admin'],
  ] as const) {
    await insertUser(db, email, role);
    await loginAs(email);
  }
});

async function loginAs(email: string) {
  await t.json('/api/v1/auth/otp', { email });
  const res = await t.json('/api/v1/auth/otp/verify', { email, code: t.sent.at(-1)!.code });
  cookies.set(email, res.headers.get('set-cookie')!.split(';')[0]);
}

const api = (path: string, email: string, init: { method?: string; body?: unknown } = {}) =>
  t.app.request(`/api/v1${path}`, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers: { cookie: cookies.get(email)!, ...(init.body ? { 'content-type': 'application/json' } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

async function placeOrder() {
  await loginAs('cliente@example.com');
  const res = await api('/orders', 'cliente@example.com', {
    body: {
      items: [
        { tier: 'standard', cardName: 'Charizard Holo', game: 'Pokemon', setName: 'Base Set', declaredValueCents: 45_000 },
        { tier: 'standard', cardName: 'Blastoise Holo', game: 'Pokemon', setName: 'Base Set', declaredValueCents: 20_000 },
      ],
      shippingMethod: 'COURIER_INSURED',
      fullName: 'Carla Cliente',
      shippingAddress: { line1: 'Calle Secreta 7', city: 'Madrid', postalCode: '28001', countryCode: 'ES' },
      locale: 'es',
      clientToken: `token-${Math.random().toString(36).slice(2)}-0000`,
      acceptedTerms: true,
      confirmedDeclaredValues: true,
    },
  });
  expect(res.status).toBe(201);
  return (await read(res)).order.code as string;
}

const received = async () => {
  const code = await placeOrder();
  const res = await api(`/admin/orders/${code}/transitions`, 'staff@lab.test', { body: { to: 'PACKAGE_RECEIVED', expectedStatus: 'SUBMITTED' } });
  expect(res.status).toBe(200);
  return code;
};

const result = (submit: boolean) => ({
  isAuthentic: true,
  centering: { score: 9 },
  corners: { score: 9 },
  edges: { score: 9 },
  surface: { score: 9 },
  submit,
});
const grade = (code: string, email: string, position: number, submit = false) =>
  api(`/admin/orders/${code}/items/${position}/grading`, email, { method: 'PUT', body: result(submit) });

const today = async (email: string) => {
  const res = await api('/admin/today', email);
  expect(res.status).toBe(200);
  const { sections } = await read(res);
  return Object.fromEntries(sections.map((s: any) => [s.key, s])) as Record<string, any>;
};

describe('pantalla "Hoy" del laboratorio', () => {
  it('cada rol ve sus propias secciones', async () => {
    expect(Object.keys(await today('staff@lab.test'))).toEqual(['toReceive', 'photosMissing', 'toDeliver', 'onHold']);
    expect(Object.keys(await today('grader@lab.test'))).toEqual(['returnedByQa', 'toGrade', 'myDrafts', 'photosMissing']);
    expect(Object.keys(await today('qa@lab.test'))).toEqual(['toReview', 'readyToShip']);
    expect(Object.keys(await today('admin@lab.test'))).toHaveLength(10);
  });

  it('recepción ve los paquetes por recibir y, al recibirlos, las fotos que faltan', async () => {
    const code = await placeOrder();
    let s = await today('staff@lab.test');
    expect(s.toReceive).toMatchObject({ count: 1, tasks: [{ orderCode: code, customerEmail: 'cliente@example.com' }] });
    expect(s.photosMissing.count).toBe(0);

    await api(`/admin/orders/${code}/transitions`, 'staff@lab.test', { body: { to: 'PACKAGE_RECEIVED', expectedStatus: 'SUBMITTED' } });
    s = await today('staff@lab.test');
    expect(s.toReceive.count).toBe(0);
    expect(s.photosMissing).toMatchObject({
      count: 2,
      tasks: [{ orderCode: code, position: 1, cardName: 'Charizard Holo', note: 'Falta la foto del anverso y reverso' }, { position: 2 }],
    });
  });

  it('el calificador ve lo que falta por calificar, sus borradores y lo que le devuelve calidad', async () => {
    const code = await received();
    expect((await today('grader@lab.test')).toGrade.count).toBe(2);

    await grade(code, 'grader@lab.test', 1);
    await grade(code, 'grader@lab.test', 2, true);
    let mine = await today('grader@lab.test');
    expect(mine.toGrade.count).toBe(0);
    expect(mine.myDrafts).toMatchObject({ count: 1, tasks: [{ position: 1 }] });
    // Los borradores de otro calificador no le aparecen.
    expect((await today('grader2@lab.test')).myDrafts.count).toBe(0);

    // Calidad ve la carta enviada con su nota y quién la calificó.
    expect((await today('qa@lab.test')).toReview).toMatchObject({ count: 1, tasks: [{ position: 2, note: 'Nota 9 · grader@lab.test' }] });

    const rejected = await api(`/admin/orders/${code}/items/2/grading/reject`, 'qa@lab.test', { body: { reason: 'Revisa el centrado' } });
    expect(rejected.status).toBe(200);
    mine = await today('grader@lab.test');
    expect(mine.returnedByQa).toMatchObject({ count: 1, tasks: [{ position: 2, note: 'Motivo: Revisa el centrado' }] });
    expect(mine.myDrafts.count).toBe(1);
    expect((await today('qa@lab.test')).toReview.count).toBe(0);

    // Al volver a enviarla deja de estar devuelta.
    await grade(code, 'grader@lab.test', 2, true);
    expect((await today('grader@lab.test')).returnedByQa.count).toBe(0);
  });

  it('calidad ve los pedidos con todas las cartas aprobadas, listos para aprobar la salida', async () => {
    const code = await received();
    await grade(code, 'grader@lab.test', 1, true);
    await grade(code, 'grader@lab.test', 2, true);
    await api(`/admin/orders/${code}/items/1/grading/approve`, 'qa@lab.test', { method: 'POST', body: {} });
    await db.update(orders).set({ status: 'QUALITY_ASSURANCE' }).where(eq(orders.code, code));
    expect((await today('qa@lab.test')).readyToShip.count).toBe(0);

    await api(`/admin/orders/${code}/items/2/grading/approve`, 'qa@lab.test', { method: 'POST', body: {} });
    expect((await today('qa@lab.test')).readyToShip).toMatchObject({ count: 1, tasks: [{ orderCode: code, note: '2 cartas aprobadas' }] });
  });

  it('la dirección ve los pedidos que pasan de la fecha prevista', async () => {
    const code = await received();
    expect((await today('admin@lab.test')).late.count).toBe(0);
    await db.update(orders).set({ estimatedCompletionAt: '2026-01-15' }).where(eq(orders.code, code));
    expect((await today('admin@lab.test')).late).toMatchObject({ count: 1, tasks: [{ orderCode: code, note: 'Fecha prevista: 15/01/2026' }] });
  });

  it('solo el personal puede consultarla', async () => {
    await loginAs('cliente@example.com');
    expect((await api('/admin/today', 'cliente@example.com')).status).toBe(403);
    expect((await t.app.request('/api/v1/admin/today')).status).toBe(401);
  });
});
