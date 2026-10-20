import { eq, sql } from 'drizzle-orm';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { auditLogs, custodyEvents, emailOutbox, orders, users } from '../db/schema';
import { AUTO_NOTE, addBusinessTime, advanceDueOrders, scheduleFor } from './domain/automation';
import { createTestApp, createTestDb, insertAllTiers, insertUser, type TestDb } from './testing';

const read = (res: Response) => res.json() as Promise<any>;
const DAY = 86_400_000;
const at = (iso: string) => new Date(iso);

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
  for (const [email, role] of [['staff@lab.test', 'staff'], ['qa@lab.test', 'qa'], ['admin@lab.test', 'admin']] as const) {
    await insertUser(db, email, role);
    await loginAs(email);
  }
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

async function loginAs(email: string) {
  await t.json('/api/v1/auth/otp', { email });
  const res = await t.json('/api/v1/auth/otp/verify', { email, code: t.sent.at(-1)!.code });
  cookies.set(email, res.headers.get('set-cookie')!.split(';')[0]);
}

const api = (path: string, email?: string, body?: unknown) =>
  t.app.request(`/api/v1${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { ...(email && { cookie: cookies.get(email)! }), ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

async function placeOrder(email = 'cliente@example.com', tier = 'standard', locale: 'es' | 'en' = 'es') {
  if (!cookies.has(email)) {
    await loginAs(email);
    await db.update(users).set({ locale }).where(eq(users.email, email));
  }
  const res = await api('/orders', email, {
    items: [{ tier, cardName: 'Charizard Holo', game: 'Pokemon', declaredValueCents: 45_000 }],
    shippingMethod: 'COURIER_INSURED', fullName: 'Carla Cliente', locale,
    shippingAddress: { line1: 'Calle 1', city: 'Madrid', postalCode: '28001', countryCode: 'ES' },
    clientToken: `token-${Math.random().toString(36).slice(2)}-0000`, acceptedTerms: true, confirmedDeclaredValues: true,
  });
  return (await read(res)).order.code as string;
}

const move = (code: string, email: string, to: string, expectedStatus: string, extra: Record<string, unknown> = {}) =>
  api(`/admin/orders/${code}/transitions`, email, { to, expectedStatus, ...extra });

const row = async (code: string) => (await db.select().from(orders).where(eq(orders.code, code)))[0];
const statuses = async () => (await db.select().from(custodyEvents).orderBy(custodyEvents.occurredAt, custodyEvents.createdAt)).map((e) => e.toStatus);

describe('el reloj', () => {
  it('suma días hábiles con fracción y no cae en fin de semana', () => {
    expect(addBusinessTime(at('2026-10-19T09:00:00Z'), 1).toISOString()).toBe('2026-10-20T09:00:00.000Z'); // lunes -> martes
    expect(addBusinessTime(at('2026-10-19T09:00:00Z'), 2.5).toISOString()).toBe('2026-10-21T21:00:00.000Z'); // lunes 09:00 + 2,5 -> miércoles 21:00
    expect(addBusinessTime(at('2026-10-23T12:00:00Z'), 0.5).toISOString()).toBe('2026-10-26T00:00:00.000Z'); // viernes 12:00 + medio día -> lunes
    expect(addBusinessTime(at('2026-10-23T09:00:00Z'), 1).toISOString()).toBe('2026-10-26T09:00:00.000Z'); // viernes -> lunes
    for (let d = 0; d < 40; d++) {
      const day = addBusinessTime(new Date(at('2026-10-19T09:00:00Z').getTime() + d * DAY), 2.5).getUTCDay();
      expect([0, 6]).not.toContain(day);
    }
  });

  it('reparte las cuatro fases dentro del plazo, en orden', () => {
    const anchor = at('2026-10-19T09:00:00Z');
    const plan = scheduleFor(anchor, 10);
    expect(plan.map((p) => p.to)).toEqual(['PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE']);
    expect(plan.map((p) => p.at.getTime())).toEqual([...plan.map((p) => p.at.getTime())].sort((a, b) => a - b));
    expect(plan.every((p) => p.at > anchor)).toBe(true);
    // Control de calidad llega antes del plazo completo, para dejar margen a la aprobación.
    expect(plan.at(-1)!.at < addBusinessTime(anchor, 10)).toBe(true);
  });
});

describe('arranque', () => {
  it('confirmar la recepción arranca el reloj con el plazo del servicio', async () => {
    const standard = await placeOrder('a@example.com', 'standard');
    const express = await placeOrder('b@example.com', 'express');
    expect((await row(standard)).autoAnchorAt).toBeNull();
    await move(standard, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    await move(express, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    const s = await row(standard);
    const e = await row(express);
    expect(s.autoTurnaroundDays).toBe(10);
    expect(e.autoTurnaroundDays).toBe(2);
    expect(Math.abs(s.autoAnchorAt!.getTime() - Date.now())).toBeLessThan(10_000);
  });

  it('un pedido sin reloj (anterior a esta función o sin recibir) no se mueve nunca', async () => {
    const code = await placeOrder();
    await db.update(orders).set({ status: 'PACKAGE_RECEIVED' }).where(eq(orders.code, code));
    expect(await advanceDueOrders(db, new Date(Date.now() + 100 * DAY))).toEqual([]);
    expect((await row(code)).status).toBe('PACKAGE_RECEIVED');
    expect(await advanceDueOrders(db, new Date(Date.now() + 100 * DAY))).toEqual([]);
  });

  it('el detalle muestra los próximos avances solo cuando el reloj está en marcha', async () => {
    const code = await placeOrder();
    let detail = (await read(await api(`/admin/orders/${code}`, 'staff@lab.test'))).order;
    expect(detail.automation).toBeNull();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    detail = (await read(await api(`/admin/orders/${code}`, 'staff@lab.test'))).order;
    expect(detail.automation.awaitingFinalApproval).toBe(false);
    expect(detail.automation.nextSteps.map((s: any) => s.to)).toEqual(['PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE']);
  });
});

describe('avance', () => {
  it('no adelanta nada antes de tiempo', async () => {
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    expect(await advanceDueOrders(db)).toEqual([]);
    expect((await row(code)).status).toBe('PACKAGE_RECEIVED');
  });

  it('pasa cada fase cuando le toca, con la hora que le correspondía', async () => {
    const code = await placeOrder(); // Standard: 10 días hábiles
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    const { autoAnchorAt } = await row(code);
    const plan = scheduleFor(autoAnchorAt!, 10);

    // Justo antes de la primera: nada. Justo después: pre-inspección.
    expect(await advanceDueOrders(db, new Date(plan[0].at.getTime() - 1000))).toEqual([]);
    expect(await advanceDueOrders(db, new Date(plan[0].at.getTime() + 1000))).toEqual([
      { code, from: 'PACKAGE_RECEIVED', to: 'PRE_INSPECTION' },
    ]);
    expect((await row(code)).status).toBe('PRE_INSPECTION');

    const events = await db.select().from(custodyEvents).where(eq(custodyEvents.toStatus, 'PRE_INSPECTION'));
    expect(events[0].occurredAt.getTime()).toBe(plan[0].at.getTime());
  });

  it('si estuvo parado, se pone al día con todas las fases pendientes', async () => {
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    const { autoAnchorAt } = await row(code);
    const plan = scheduleFor(autoAnchorAt!, 10);

    const done = await advanceDueOrders(db, new Date(plan[1].at.getTime() + 1000));
    expect(done.map((d) => d.to)).toEqual(['PRE_INSPECTION', 'OPTICAL_GRADING']);
    expect((await row(code)).status).toBe('OPTICAL_GRADING');
    // Cada fase conserva su hora prevista, no la del momento en que se ejecutó el proceso.
    const events = await db.select().from(custodyEvents).orderBy(custodyEvents.occurredAt);
    expect(events.slice(-2).map((e) => e.occurredAt.getTime())).toEqual([plan[0].at.getTime(), plan[1].at.getTime()]);
  });

  it('se detiene en control de calidad: nunca envía ni entrega por su cuenta', async () => {
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    const far = new Date(Date.now() + 1000 * DAY);
    const done = await advanceDueOrders(db, far);
    expect(done.map((d) => d.to)).toEqual(['PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE']);
    expect(await advanceDueOrders(db, far)).toEqual([]);
    expect((await row(code)).status).toBe('QUALITY_ASSURANCE');
    expect(await statuses()).not.toContain('SHIPPED');
    expect(await statuses()).not.toContain('DELIVERED');

    const detail = (await read(await api(`/admin/orders/${code}`, 'qa@lab.test'))).order;
    expect(detail.automation).toMatchObject({ awaitingFinalApproval: true, nextSteps: [] });
  });

  it('ejecutarlo varias veces o a la vez no duplica nada', async () => {
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    const far = new Date(Date.now() + 1000 * DAY);
    await Promise.all([advanceDueOrders(db, far), advanceDueOrders(db, far), advanceDueOrders(db, far)]);
    await advanceDueOrders(db, far);
    expect(await statuses()).toEqual(['SUBMITTED', 'PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE']);
    expect(await db.select().from(auditLogs).where(eq(auditLogs.action, 'order.auto_advance'))).toHaveLength(4);
  });

  it('los avances los hace el sistema, no una persona, y quedan marcados así', async () => {
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    await advanceDueOrders(db, new Date(Date.now() + 1000 * DAY));

    const auto = (await db.select().from(custodyEvents)).filter((e) => e.fromStatus && !e.actorId);
    expect(auto).toHaveLength(4);
    expect(auto.every((e) => e.internalNote === AUTO_NOTE)).toBe(true);
    const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, 'order.auto_advance'));
    expect(logs.every((l) => l.actorId === null && l.entityId === code)).toBe(true);

    const detail = (await read(await api(`/admin/orders/${code}`, 'staff@lab.test'))).order;
    const flags = detail.timeline.map((e: any) => [e.toStatus, e.automatic]);
    expect(flags).toEqual([
      ['SUBMITTED', false], ['PACKAGE_RECEIVED', false],
      ['PRE_INSPECTION', true], ['OPTICAL_GRADING', true], ['ENCAPSULATION', true], ['QUALITY_ASSURANCE', true],
    ]);
  });

  it('el cliente lo ve en su seguimiento, en su idioma, sin la nota interna', async () => {
    const es = await placeOrder('es@example.com', 'standard', 'es');
    const en = await placeOrder('en@example.com', 'standard', 'en');
    await move(es, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    await move(en, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    await advanceDueOrders(db, new Date(Date.now() + 1000 * DAY));

    const view = async (code: string) => (await read(await t.app.request(`/api/v1/tracking/${code}`))).tracking;
    const esView = await view(es);
    const enView = await view(en);
    expect(esView.status).toBe('QUALITY_ASSURANCE');
    expect(esView.steps.map((s: any) => s.label)).toContain('Graduación óptica en curso');
    expect(enView.steps.map((s: any) => s.label)).toContain('Optical grading in progress');
    expect(esView.steps.at(-1).state).toBe('current');
    expect(JSON.stringify(esView)).not.toContain('automático');
  });

  it('los avances automáticos no mandan emails al cliente', async () => {
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    await advanceDueOrders(db, new Date(Date.now() + 1000 * DAY));
    expect((await db.select().from(emailOutbox)).map((m) => m.template).sort()).toEqual(['order_package_received', 'order_submitted']);
  });

  it('sigue desde donde esté si un admin ya adelantó una fase a mano', async () => {
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    await move(code, 'admin@lab.test', 'PRE_INSPECTION', 'PACKAGE_RECEIVED');
    const done = await advanceDueOrders(db, new Date(Date.now() + 1000 * DAY));
    expect(done.map((d) => d.to)).toEqual(['OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE']);
    expect((await statuses()).filter((s) => s === 'PRE_INSPECTION')).toHaveLength(1);
  });
});

describe('pausas y cancelaciones', () => {
  it('un pedido en pausa no avanza', async () => {
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    await move(code, 'qa@lab.test', 'ON_HOLD', 'PACKAGE_RECEIVED', { internalNote: 'Revisar carta' });
    expect(await advanceDueOrders(db, new Date(Date.now() + 1000 * DAY))).toEqual([]);
    expect((await row(code)).status).toBe('ON_HOLD');
    expect((await read(await api(`/admin/orders/${code}`, 'staff@lab.test'))).order.automation.nextSteps).toEqual([]);
  });

  it('al reanudar, el reloj se retrasa lo que duró la pausa', async () => {
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    const before = (await row(code)).autoAnchorAt!;
    await move(code, 'qa@lab.test', 'ON_HOLD', 'PACKAGE_RECEIVED', { internalNote: 'Revisar carta' });
    // La pausa duró 3 días.
    await db.update(custodyEvents).set({ occurredAt: new Date(Date.now() - 3 * DAY) }).where(eq(custodyEvents.toStatus, 'ON_HOLD'));
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'ON_HOLD', { internalNote: 'Todo correcto' });

    const after = (await row(code)).autoAnchorAt!;
    expect(Math.abs(after.getTime() - before.getTime() - 3 * DAY)).toBeLessThan(60_000);
    expect((await row(code)).status).toBe('PACKAGE_RECEIVED');

    // Con el calendario antiguo ya tocaría la primera fase; con el desplazado, todavía no.
    const oldFirst = scheduleFor(before, 10)[0].at;
    expect(await advanceDueOrders(db, new Date(oldFirst.getTime() + 1000))).toEqual([]);
    const newFirst = scheduleFor(after, 10)[0].at;
    expect((await advanceDueOrders(db, new Date(newFirst.getTime() + 1000))).map((d) => d.to)).toEqual(['PRE_INSPECTION']);
  });

  it('un pedido cancelado no avanza', async () => {
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    await move(code, 'admin@lab.test', 'CANCELLED', 'PACKAGE_RECEIVED', { internalNote: 'El cliente lo pidió' });
    expect(await advanceDueOrders(db, new Date(Date.now() + 1000 * DAY))).toEqual([]);
    expect((await row(code)).status).toBe('CANCELLED');
  });

  it('un pedido que ya salió del laboratorio no se toca', async () => {
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    await advanceDueOrders(db, new Date(Date.now() + 1000 * DAY));
    await api(`/admin/orders/${code}/shipments`, 'staff@lab.test', { direction: 'outbound', carrier: 'GLS', trackingNumber: 'ES-1' });
    await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE');
    expect(await advanceDueOrders(db, new Date(Date.now() + 2000 * DAY))).toEqual([]);
    expect((await row(code)).status).toBe('SHIPPED');
  });
});

describe('GET /jobs/advance-orders (cron)', () => {
  const call = (auth?: string) => t.app.request('/api/v1/jobs/advance-orders', { headers: auth ? { authorization: auth } : {} });

  it('sin CRON_SECRET configurado no funciona', async () => {
    const res = await call('Bearer lo-que-sea');
    expect(res.status).toBe(503);
    expect(await read(res)).toMatchObject({ code: 'cron_not_configured' });
  });

  it('exige la clave correcta', async () => {
    process.env.CRON_SECRET = 'clave-de-prueba-del-cron';
    expect((await call()).status).toBe(401);
    expect((await call('Bearer otra-clave')).status).toBe(401);
    expect((await call('clave-de-prueba-del-cron')).status).toBe(401);
    expect((await call('Bearer clave-de-prueba-del-cron')).status).toBe(200);
  });

  it('con la clave correcta avanza los pedidos que ya les toca', async () => {
    process.env.CRON_SECRET = 'clave-de-prueba-del-cron';
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    // Se retrasa el pasado del pedido para que ya le toque.
    await db.execute(sql`update orders set auto_anchor_at = auto_anchor_at - interval '40 days'`);
    const res = await call('Bearer clave-de-prueba-del-cron');
    expect(await read(res)).toMatchObject({ advanced: 4, orders: expect.arrayContaining([{ code, from: 'PACKAGE_RECEIVED', to: 'PRE_INSPECTION' }]) });
    expect((await row(code)).status).toBe('QUALITY_ASSURANCE');
  });
});
