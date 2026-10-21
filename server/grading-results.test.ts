import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { auditLogs, gradingDefects, gradingResults, orders } from '../db/schema.js';
import { advanceDueOrders } from './domain/automation.js';
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

const move = (code: string, email: string, to: string, expectedStatus: string) =>
  api(`/admin/orders/${code}/transitions`, email, { body: { to, expectedStatus } });

/** Recibe el paquete: desde ahí ya se puede graduar. */
async function received() {
  const code = await placeOrder();
  expect((await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED')).status).toBe(200);
  return code;
}

const sub = (score: number) => ({ score });
const scores = (c: number, co: number, e: number, s: number) => ({
  isAuthentic: true,
  centering: { score: c, frontRatio: '52/48 L/R', backRatio: '50/50 L/R' },
  corners: { score: co, frontScore: co, backScore: co },
  edges: sub(e),
  surface: sub(s),
});

const grade = (code: string, email: string, body: unknown, position = 1) =>
  api(`/admin/orders/${code}/items/${position}/grading`, email, { method: 'PUT', body });
const action = (code: string, email: string, name: 'approve' | 'reject', body?: unknown, position = 1) =>
  api(`/admin/orders/${code}/items/${position}/grading/${name}`, email, { method: 'POST', body: body ?? {} });

describe('introducir el resultado', () => {
  it('calcula la nota final y la etiqueta a partir de las subnotas', async () => {
    const code = await received();
    const res = await grade(code, 'grader@lab.test', scores(9.5, 9, 9, 9.5));
    expect(res.status).toBe(200);
    // Media 9,25 -> 9; la peor es 9, así que no sube.
    expect((await read(res)).grading).toMatchObject({
      version: 1, status: 'draft', isAuthentic: true, finalGrade: 9, gradeLabel: 'Mint 9', gradedBy: 'grader@lab.test',
      centering: { score: 9.5, frontRatio: '52/48 L/R' },
    });
  });

  it('aplica la regla de la nota: tres 10 y un 9,5 dan Gem Mint 10; cuatro 10, Pristine 10', async () => {
    const code = await received();
    expect((await read(await grade(code, 'grader@lab.test', scores(10, 10, 10, 9.5)))).grading).toMatchObject({ finalGrade: 10, gradeLabel: 'Gem Mint 10' });
    expect((await read(await grade(code, 'grader@lab.test', scores(10, 10, 10, 10)))).grading).toMatchObject({ finalGrade: 10, gradeLabel: 'Pristine 10' });
  });

  it('una nota inferior a la de las subnotas se acepta; una superior, no', async () => {
    const code = await received();
    const lower = await grade(code, 'grader@lab.test', { ...scores(9.5, 9.5, 9.5, 9.5), finalGrade: 9 });
    expect((await read(lower)).grading).toMatchObject({ finalGrade: 9, gradeLabel: 'Mint 9' });

    const higher = await grade(code, 'grader@lab.test', { ...scores(8, 8, 8, 8), finalGrade: 9 });
    expect(higher.status).toBe(422);
    expect(await read(higher)).toMatchObject({ code: 'grade_above_subgrades', maxAllowed: 8 });
  });

  it('valores fuera de escala o subnotas que faltan se rechazan', async () => {
    const code = await received();
    expect((await grade(code, 'grader@lab.test', scores(9.3, 9, 9, 9))).status).toBe(422);
    expect((await grade(code, 'grader@lab.test', scores(11, 9, 9, 9))).status).toBe(422);
    const { surface: _omitted, ...incomplete } = scores(9, 9, 9, 9);
    expect((await grade(code, 'grader@lab.test', incomplete)).status).toBe(422);
  });

  it('una carta no auténtica se guarda sin notas', async () => {
    const code = await received();
    const res = await grade(code, 'grader@lab.test', { isAuthentic: false });
    expect((await read(res)).grading).toMatchObject({ isAuthentic: false, finalGrade: null, gradeLabel: null, centering: null });
  });

  it('guarda los defectos y los devuelve en el detalle del pedido', async () => {
    const code = await received();
    const defects = [
      { side: 'front', category: 'corners', severity: 'minor', title: 'Esquina superior derecha', x: 96.5, y: 3.2, deduction: 0.5 },
      { side: 'back', category: 'surface', severity: 'moderate', title: 'Arañazo', description: 'Visible con luz rasante', x: 40, y: 60 },
    ];
    await grade(code, 'grader@lab.test', { ...scores(9, 9, 9, 9), defects });
    const detail = (await read(await api(`/admin/orders/${code}`, 'staff@lab.test'))).order;
    expect(detail.items[0].grading.defects).toHaveLength(2);
    expect(detail.items[0].grading.defects[1]).toMatchObject({ title: 'Arañazo', deduction: 0, description: 'Visible con luz rasante' });
    expect(detail.items[1].grading).toBeNull();
  });

  it('volver a guardar un borrador lo reemplaza, no crea otra versión', async () => {
    const code = await received();
    await grade(code, 'grader@lab.test', { ...scores(9, 9, 9, 9), defects: [{ side: 'front', category: 'edges', severity: 'minor', title: 'A', x: 1, y: 1 }] });
    await grade(code, 'grader@lab.test', scores(8, 8, 8, 8));
    expect(await db.select().from(gradingResults)).toHaveLength(1);
    expect(await db.select().from(gradingDefects)).toHaveLength(0);
    expect((await db.select().from(gradingResults))[0].finalGrade).toBe(8);
  });

  it('solo graduadores y administradores; y no antes de recibir el paquete', async () => {
    const code = await placeOrder();
    expect((await grade(code, 'grader@lab.test', scores(9, 9, 9, 9))).status).toBe(409);
    expect(await read(await grade(code, 'grader@lab.test', scores(9, 9, 9, 9)))).toMatchObject({ code: 'grading_not_allowed' });

    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    for (const email of ['staff@lab.test', 'qa@lab.test', 'cliente@example.com']) {
      expect((await grade(code, email, scores(9, 9, 9, 9))).status, email).toBe(403);
    }
    expect((await grade(code, 'admin@lab.test', scores(9, 9, 9, 9))).status).toBe(200);
  });

  it('una carta que no existe en el pedido da 404', async () => {
    const code = await received();
    expect((await grade(code, 'grader@lab.test', scores(9, 9, 9, 9), 3)).status).toBe(404);
    expect((await grade(code, 'grader@lab.test', scores(9, 9, 9, 9), 0)).status).toBe(404);
    expect((await grade('GGI-ORD-ZZZZZZ', 'grader@lab.test', scores(9, 9, 9, 9))).status).toBe(404);
  });

  it('queda registrado quién hizo cada cosa', async () => {
    const code = await received();
    await grade(code, 'grader@lab.test', { ...scores(9, 9, 9, 9), submit: true });
    const actions = (await db.select().from(auditLogs)).map((a) => a.action);
    expect(actions).toContain('grading.submitted');
  });
});

describe('control de calidad', () => {
  it('lo aprueba otra persona; pasa a aprobado con su firma', async () => {
    const code = await received();
    await grade(code, 'grader@lab.test', { ...scores(9, 9, 9, 9), submit: true });
    const res = await action(code, 'qa@lab.test', 'approve');
    expect(res.status).toBe(200);
    expect((await read(res)).grading).toMatchObject({ status: 'approved', qaApprovedBy: 'qa@lab.test', gradedBy: 'grader@lab.test' });
  });

  it('no se puede aprobar un borrador ni aprobar dos veces', async () => {
    const code = await received();
    await grade(code, 'grader@lab.test', scores(9, 9, 9, 9));
    expect(await read(await action(code, 'qa@lab.test', 'approve'))).toMatchObject({ code: 'grading_not_pending' });
    await grade(code, 'grader@lab.test', { ...scores(9, 9, 9, 9), submit: true });
    expect((await action(code, 'qa@lab.test', 'approve')).status).toBe(200);
    expect((await action(code, 'qa@lab.test', 'approve')).status).toBe(409);
  });

  it('quien graduó no puede aprobar su propio trabajo, ni siendo administrador', async () => {
    const code = await received();
    await grade(code, 'admin@lab.test', { ...scores(9, 9, 9, 9), submit: true });
    const res = await action(code, 'admin@lab.test', 'approve');
    expect(res.status).toBe(409);
    expect(await read(res)).toMatchObject({ code: 'two_person_rule' });
    expect((await action(code, 'qa@lab.test', 'approve')).status).toBe(200);
  });

  it('un graduador o el personal no pueden aprobar', async () => {
    const code = await received();
    await grade(code, 'grader@lab.test', { ...scores(9, 9, 9, 9), submit: true });
    for (const email of ['grader2@lab.test', 'staff@lab.test', 'cliente@example.com']) {
      expect((await action(code, email, 'approve')).status, email).toBe(403);
    }
  });

  it('puede devolver el resultado a borrador con un motivo, que queda registrado', async () => {
    const code = await received();
    await grade(code, 'grader@lab.test', { ...scores(9, 9, 9, 9), submit: true });
    expect((await action(code, 'qa@lab.test', 'reject', {})).status).toBe(422);
    const res = await action(code, 'qa@lab.test', 'reject', { reason: 'Revisa el centrado del reverso' });
    expect((await read(res)).grading.status).toBe('draft');
    const [log] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'grading.rejected'));
    expect(log.after).toMatchObject({ reason: 'Revisa el centrado del reverso' });
  });

  it('un resultado aprobado solo lo corrige un administrador, y deja la versión anterior como histórico', async () => {
    const code = await received();
    await grade(code, 'grader@lab.test', { ...scores(9, 9, 9, 9), submit: true });
    await action(code, 'qa@lab.test', 'approve');

    const blocked = await grade(code, 'grader@lab.test', scores(8, 8, 8, 8));
    expect(blocked.status).toBe(409);
    expect(await read(blocked)).toMatchObject({ code: 'grading_approved' });

    const fixed = await grade(code, 'admin@lab.test', { ...scores(8, 8, 8, 8), submit: true });
    expect((await read(fixed)).grading).toMatchObject({ version: 2, status: 'pending_qa', finalGrade: 8, qaApprovedBy: null });
    const rows = await db.select().from(gradingResults).orderBy(gradingResults.version);
    expect(rows.map((r) => [r.version, r.status])).toEqual([[1, 'superseded'], [2, 'pending_qa']]);
    expect(rows[0].supersededById).toBe(rows[1].id);
  });
});

describe('salida del laboratorio', () => {
  async function untilQuality() {
    const code = await received();
    await db.execute(sql`update custody_events set occurred_at = occurred_at - interval '40 days'`);
    await db.execute(sql`update orders set auto_anchor_at = auto_anchor_at - interval '40 days' where auto_anchor_at is not null`);
    await advanceDueOrders(db);
    expect((await db.select().from(orders))[0].status).toBe('QUALITY_ASSURANCE');
    await api(`/admin/orders/${code}/shipments`, 'staff@lab.test', { body: { direction: 'outbound', carrier: 'GLS', trackingNumber: 'ES-1' } });
    return code;
  }

  it('el pedido no sale hasta que todas las cartas tienen el resultado aprobado', async () => {
    const code = await untilQuality();
    const shipOption = async () =>
      (await read(await api(`/admin/orders/${code}`, 'qa@lab.test'))).order.transitions.find((x: any) => x.to === 'SHIPPED');

    expect(await shipOption()).toMatchObject({ allowed: false, blockedReason: 'grading_incomplete' });
    const blocked = await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE');
    expect(blocked.status).toBe(409);
    expect(await read(blocked)).toMatchObject({ code: 'grading_incomplete' });

    // Se aprueba solo la primera carta: sigue bloqueado.
    await grade(code, 'grader@lab.test', { ...scores(9, 9, 9, 9), submit: true }, 1);
    await action(code, 'qa@lab.test', 'approve', undefined, 1);
    expect((await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(409);

    // La segunda estaba pendiente de calidad, no aprobada: tampoco vale.
    await grade(code, 'grader@lab.test', { ...scores(8.5, 8.5, 8.5, 8.5), submit: true }, 2);
    expect((await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(409);

    await action(code, 'qa@lab.test', 'approve', undefined, 2);
    expect(await shipOption()).toMatchObject({ allowed: true });
    expect((await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(200);
  });
});
