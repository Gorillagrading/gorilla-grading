import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { auditLogs, custodyEvents, emailOutbox, orders, shipments, users } from '../db/schema';
import { advanceDueOrders } from './domain/automation';
import { createTestApp, createTestDb, insertAllTiers, insertUser, type TestDb } from './testing';

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
});

async function loginAs(email: string) {
  await t.json('/api/v1/auth/otp', { email });
  const res = await t.json('/api/v1/auth/otp/verify', { email, code: t.sent.at(-1)!.code });
  const cookie = res.headers.get('set-cookie')!.split(';')[0];
  cookies.set(email, cookie);
  return cookie;
}

/** Crea el personal del laboratorio e inicia sesión con cada persona. */
async function staffSetup() {
  for (const [email, role] of [
    ['staff@lab.test', 'staff'], ['grader@lab.test', 'grader'], ['grader2@lab.test', 'grader'],
    ['qa@lab.test', 'qa'], ['admin@lab.test', 'admin'],
  ] as const) {
    await insertUser(db, email, role);
    await loginAs(email);
  }
}

const api = (path: string, email?: string, init: { method?: string; body?: unknown; ip?: string } = {}) =>
  t.app.request(`/api/v1${path}`, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers: {
      ...(email && { cookie: cookies.get(email)! }),
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(init.ip && { 'x-forwarded-for': init.ip }),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

/** Un cliente envía un pedido por la API real y devuelve su código. */
async function placeOrder(email = 'cliente@example.com', over: Record<string, unknown> = {}) {
  if (!cookies.has(email)) await loginAs(email);
  const res = await api('/orders', email, {
    body: {
      items: [{ tier: 'standard', cardName: 'Charizard Holo', game: 'Pokemon', setName: 'Base Set', declaredValueCents: 45_000 }],
      shippingMethod: 'COURIER_INSURED',
      fullName: 'Carla Cliente',
      shippingAddress: { line1: 'Calle Secreta 7', city: 'Madrid', postalCode: '28001', countryCode: 'ES' },
      locale: 'es',
      clientToken: `token-${Math.random().toString(36).slice(2)}-0000`,
      acceptedTerms: true,
      confirmedDeclaredValues: true,
      ...over,
    },
  });
  expect(res.status).toBe(201);
  return (await read(res)).order.code as string;
}

const move = (code: string, email: string, to: string, expectedStatus: string, extra: Record<string, unknown> = {}) =>
  api(`/admin/orders/${code}/transitions`, email, { body: { to, expectedStatus, ...extra } });

/**
 * Simula que pasan 40 días: el pasado de los pedidos se desplaza hacia atrás (así el historial queda
 * en orden) y el sistema pone al día todas las fases automáticas.
 */
const runAutomation = async () => {
  await db.execute(sql`update custody_events set occurred_at = occurred_at - interval '40 days'`);
  await db.execute(sql`update orders set auto_anchor_at = auto_anchor_at - interval '40 days' where auto_anchor_at is not null`);
  return advanceDueOrders(db);
};

const track = async (code: string) => (await read(await t.app.request(`/api/v1/tracking/${code}`))).tracking;

describe('acceso al panel', () => {
  const calls: [string, string, unknown?][] = [
    ['GET', '/admin/orders'],
    ['GET', '/admin/orders/GGI-ORD-AAAAAA'],
    ['POST', '/admin/orders/GGI-ORD-AAAAAA/transitions', { to: 'PACKAGE_RECEIVED', expectedStatus: 'SUBMITTED' }],
    ['POST', '/admin/orders/GGI-ORD-AAAAAA/shipments', { direction: 'outbound', carrier: 'GLS', trackingNumber: 'X1' }],
  ];

  it.each(calls)('%s %s sin sesión devuelve 401', async (method, path, body) => {
    const res = await api(path, undefined, { method, body });
    expect(res.status).toBe(401);
  });

  it.each(calls)('%s %s con una cuenta de cliente devuelve 403', async (method, path, body) => {
    await loginAs('cliente@example.com');
    const res = await api(path, 'cliente@example.com', { method, body });
    expect(res.status).toBe(403);
    expect(await read(res)).toMatchObject({ code: 'forbidden' });
  });

  it('un cliente no puede ver el pedido de otro por el panel', async () => {
    const code = await placeOrder();
    await loginAs('otro@example.com');
    expect((await api(`/admin/orders/${code}`, 'otro@example.com')).status).toBe(403);
  });

  it('todos los roles del laboratorio pueden ver el listado', async () => {
    await staffSetup();
    for (const email of ['staff@lab.test', 'grader@lab.test', 'qa@lab.test', 'admin@lab.test']) {
      expect((await api('/admin/orders', email)).status, email).toBe(200);
    }
  });

  it('las respuestas no se guardan en cachés', async () => {
    await staffSetup();
    expect((await api('/admin/orders', 'staff@lab.test')).headers.get('cache-control')).toBe('private, no-store');
  });
});

describe('listado', () => {
  it('no incluye borradores y cuenta los pedidos por estado', async () => {
    await staffSetup();
    const a = await placeOrder('a@example.com');
    await placeOrder('b@example.com');
    await move(a, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    const [owner] = await db.select().from(users).where(eq(users.email, 'a@example.com'));
    await db.insert(orders).values({ code: 'GGI-ORD-DRAFT1', userId: owner.id, status: 'DRAFT' });

    const body = await read(await api('/admin/orders', 'staff@lab.test'));
    expect(body.total).toBe(2);
    expect(body.counts).toEqual({ SUBMITTED: 1, PACKAGE_RECEIVED: 1 });
    expect(JSON.stringify(body)).not.toContain('DRAFT1');
  });

  it('filtra por estado y por "activos"', async () => {
    await staffSetup();
    const a = await placeOrder('a@example.com');
    await placeOrder('b@example.com');
    await move(a, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    expect((await read(await api('/admin/orders?status=SUBMITTED', 'staff@lab.test'))).orders).toHaveLength(1);
    expect((await read(await api('/admin/orders?status=active', 'staff@lab.test'))).orders).toHaveLength(2);
    await move(a, 'admin@lab.test', 'CANCELLED', 'PACKAGE_RECEIVED', { internalNote: 'prueba' });
    expect((await read(await api('/admin/orders?status=active', 'staff@lab.test'))).orders).toHaveLength(1);
  });

  it('busca por código, correo y nombre, sin interpretar % ni _', async () => {
    await staffSetup();
    const code = await placeOrder('ana.lopez@example.com', { fullName: 'Ana López' });
    await placeOrder('otro@example.com', { fullName: 'Pedro Gómez' });
    const find = async (q: string) => (await read(await api(`/admin/orders?q=${encodeURIComponent(q)}`, 'staff@lab.test'))).orders.map((o: any) => o.code);
    expect(await find(code.toLowerCase())).toEqual([code]);
    expect(await find('ana.lopez')).toEqual([code]);
    expect(await find('López')).toEqual([code]);
    expect(await find('%')).toEqual([]);
    expect(await find('_')).toEqual([]);
    expect(await find('nadie')).toEqual([]);
  });

  it('ordena por antigüedad y pagina de 25 en 25', async () => {
    await staffSetup();
    const [owner] = await Promise.all([insertUser(db, 'masivo@example.com')]);
    await db.insert(orders).values(
      Array.from({ length: 30 }, (_, i) => ({
        code: `GGI-ORD-P${String(i).padStart(5, '0')}`,
        userId: owner.id,
        status: 'SUBMITTED' as const,
        submittedAt: new Date(Date.UTC(2026, 8, 1 + i)),
      })),
    );
    const first = await read(await api('/admin/orders', 'staff@lab.test'));
    expect(first).toMatchObject({ total: 30, page: 1, pageSize: 25 });
    expect(first.orders).toHaveLength(25);
    expect(first.orders[0].code).toBe('GGI-ORD-P00000');
    const second = await read(await api('/admin/orders?page=2', 'staff@lab.test'));
    expect(second.orders).toHaveLength(5);
    const newest = await read(await api('/admin/orders?sort=newest', 'staff@lab.test'));
    expect(newest.orders[0].code).toBe('GGI-ORD-P00029');
  });

  it('rechaza filtros inválidos con 422', async () => {
    await staffSetup();
    expect((await api('/admin/orders?status=INVENTADO', 'staff@lab.test')).status).toBe(422);
    expect((await api('/admin/orders?page=0', 'staff@lab.test')).status).toBe(422);
  });

  it('el personal ve el correo y el nombre del cliente', async () => {
    await staffSetup();
    await placeOrder('ana@example.com', { fullName: 'Ana López' });
    const [row] = (await read(await api('/admin/orders', 'staff@lab.test'))).orders;
    expect(row).toMatchObject({ customerEmail: 'ana@example.com', customerName: 'Ana López', itemCount: 1, status: 'SUBMITTED', paymentStatus: 'unpaid' });
  });
});

describe('detalle', () => {
  it('incluye contacto, dirección, cartas y línea de tiempo', async () => {
    await staffSetup();
    const code = await placeOrder();
    const { order } = await read(await api(`/admin/orders/${code}`, 'staff@lab.test'));
    expect(order.customer).toMatchObject({ email: 'cliente@example.com', fullName: 'Carla Cliente', locale: 'es' });
    expect(order.shippingAddress).toMatchObject({ line1: 'Calle Secreta 7', city: 'Madrid' });
    expect(order.items[0]).toMatchObject({ position: 1, cardName: 'Charizard Holo', tier: 'standard', declaredValueCents: 45_000 });
    expect(order.order).toMatchObject({ status: 'SUBMITTED', totalCents: 3350, shippingCents: 1450 });
    expect(order.timeline).toHaveLength(1);
  });

  it('devuelve 404 para un pedido que no existe', async () => {
    await staffSetup();
    const res = await api('/admin/orders/GGI-ORD-ZZZZZZ', 'staff@lab.test');
    expect(res.status).toBe(404);
    expect(await read(res)).toMatchObject({ code: 'order_not_found' });
  });

  it('cada rol ve solo las acciones que le corresponden', async () => {
    await staffSetup();
    const code = await placeOrder();
    const tos = async (email: string) => (await read(await api(`/admin/orders/${code}`, email))).order.transitions.map((x: any) => x.to);
    expect(await tos('staff@lab.test')).toEqual(['PACKAGE_RECEIVED', 'ON_HOLD']);
    expect(await tos('grader@lab.test')).toEqual(['ON_HOLD']);
    expect(await tos('qa@lab.test')).toEqual(['ON_HOLD']);
    expect(await tos('admin@lab.test')).toEqual(['PACKAGE_RECEIVED', 'ON_HOLD', 'CANCELLED']);
  });
});

describe('cambios de estado', () => {
  it('recorrido completo: dos pasos a mano (recibir y aprobar la salida) y el resto lo hace el sistema', async () => {
    await staffSetup();
    const code = await placeOrder();

    expect((await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED')).status).toBe(200);
    // Pasan los días del servicio: el sistema lleva el pedido solo hasta control de calidad.
    await runAutomation();
    expect((await db.select().from(orders))[0].status).toBe('QUALITY_ASSURANCE');

    await api(`/admin/orders/${code}/shipments`, 'staff@lab.test', { body: { direction: 'outbound', carrier: 'GLS', trackingNumber: 'ES-GLS-123' } });
    expect((await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(200);
    expect((await move(code, 'staff@lab.test', 'DELIVERED', 'SHIPPED')).status).toBe(200);

    const events = await db.select().from(custodyEvents).orderBy(custodyEvents.occurredAt, custodyEvents.createdAt);
    expect(events.map((e) => e.toStatus)).toEqual([
      'SUBMITTED', 'PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE', 'SHIPPED', 'DELIVERED',
    ]);
    // Los cuatro pasos intermedios no tienen autor: los hizo el sistema.
    expect(events.filter((e) => !e.actorId).map((e) => e.toStatus)).toEqual(['PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE']);
    expect(events.filter((e) => e.actorId).map((e) => e.toStatus)).toEqual(['SUBMITTED', 'PACKAGE_RECEIVED', 'SHIPPED', 'DELIVERED']);

    const view = await track(code);
    expect(view.status).toBe('DELIVERED');
    expect(view.steps).toHaveLength(8);
    expect(view.pending).toEqual([]);
    expect(view.carrier).toBe('GLS');
    expect(view.trackingNumber).toBe('ES-GLS-123');
  });

  it('el cliente ve el texto en su idioma', async () => {
    await staffSetup();
    const es = await placeOrder('es@example.com', { locale: 'es' });
    await insertUser(db, 'en@example.com').then(async (u) => db.update(users).set({ locale: 'en' }).where(eq(users.id, u.id)));
    const en = await placeOrder('en@example.com', { locale: 'en' });
    await move(es, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    await move(en, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    expect((await track(es)).steps.at(-1).label).toBe('Paquete recibido en la bóveda');
    expect((await track(en)).steps.at(-1).label).toBe('Package received in the vault');
  });

  it('el personal puede escribir el texto que ve el cliente, y la nota interna nunca sale', async () => {
    await staffSetup();
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED', {
      publicDescription: 'Llegó con el precinto intacto.',
      internalNote: 'SECRETO: la caja venía abollada',
    });
    const text = JSON.stringify(await track(code));
    expect(text).toContain('Llegó con el precinto intacto.');
    expect(text).not.toContain('SECRETO');
    const detail = (await read(await api(`/admin/orders/${code}`, 'staff@lab.test'))).order;
    expect(detail.timeline.at(-1)).toMatchObject({ internalNote: 'SECRETO: la caja venía abollada', actor: { email: 'staff@lab.test' } });
  });

  it('al recibir el paquete calcula la fecha estimada en días hábiles', async () => {
    await staffSetup();
    const code = await placeOrder(); // Standard: 10 días hábiles
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    const [row] = await db.select().from(orders);
    expect(row.estimatedCompletionAt).not.toBeNull();
    const days = (new Date(`${row.estimatedCompletionAt}T00:00:00Z`).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(12);
    expect(days).toBeLessThan(16);
    expect(new Date(`${row.estimatedCompletionAt}T12:00:00Z`).getUTCDay()).not.toBe(0);
    expect(new Date(`${row.estimatedCompletionAt}T12:00:00Z`).getUTCDay()).not.toBe(6);
  });

  it('deja un registro de auditoría de cada cambio', async () => {
    await staffSetup();
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED', { internalNote: 'ok' });
    const [log] = await db.select().from(auditLogs);
    expect(log).toMatchObject({ action: 'order.transition', entityType: 'order', entityId: code, before: { status: 'SUBMITTED' }, after: { status: 'PACKAGE_RECEIVED', internalNote: 'ok' } });
    expect(log.actorId).not.toBeNull();
  });

  it('deja en cola el aviso al cliente solo en los estados que lo merecen', async () => {
    await staffSetup();
    const code = await placeOrder();
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    await move(code, 'staff@lab.test', 'PRE_INSPECTION', 'PACKAGE_RECEIVED');
    const templates = (await db.select().from(emailOutbox)).map((m) => m.template).sort();
    expect(templates).toEqual(['order_package_received', 'order_submitted']);
  });

  describe('lo que no se puede hacer', () => {
    it('un rol sin permiso no cambia nada', async () => {
      await staffSetup();
      const code = await placeOrder();
      for (const email of ['grader@lab.test', 'qa@lab.test']) {
        const res = await move(code, email, 'PACKAGE_RECEIVED', 'SUBMITTED');
        expect(res.status, email).toBe(403);
      }
      expect((await db.select().from(orders))[0].status).toBe('SUBMITTED');
      expect(await db.select().from(custodyEvents)).toHaveLength(1);
    });

    it('las fases automáticas solo las puede adelantar a mano un admin', async () => {
      await staffSetup();
      const code = await placeOrder();
      await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
      for (const email of ['staff@lab.test', 'grader@lab.test', 'qa@lab.test']) {
        expect((await move(code, email, 'PRE_INSPECTION', 'PACKAGE_RECEIVED')).status, email).toBe(403);
      }
      expect((await move(code, 'admin@lab.test', 'PRE_INSPECTION', 'PACKAGE_RECEIVED')).status).toBe(200);
      const [event] = (await db.select().from(custodyEvents).where(eq(custodyEvents.toStatus, 'PRE_INSPECTION')));
      expect(event.actorId).not.toBeNull();
    });

    it('un grader o qa no pueden recibir paquetes', async () => {
      await staffSetup();
      const code = await placeOrder();
      for (const email of ['grader@lab.test', 'qa@lab.test']) {
        expect((await move(code, email, 'PACKAGE_RECEIVED', 'SUBMITTED')).status, email).toBe(403);
      }
      expect((await db.select().from(orders))[0].status).toBe('SUBMITTED');
    });

    it('no se puede saltar fases ni ir hacia atrás', async () => {
      await staffSetup();
      const code = await placeOrder();
      for (const to of ['SHIPPED', 'DELIVERED', 'ENCAPSULATION', 'SUBMITTED', 'DRAFT']) {
        const res = await move(code, 'admin@lab.test', to, 'SUBMITTED');
        expect(res.status, to).toBe(409);
        expect(await read(res)).toMatchObject({ code: 'invalid_transition' });
      }
    });

    it('pausar y cancelar exigen un motivo', async () => {
      await staffSetup();
      const code = await placeOrder();
      for (const [email, to] of [['qa@lab.test', 'ON_HOLD'], ['admin@lab.test', 'CANCELLED']] as const) {
        const res = await move(code, email, to, 'SUBMITTED');
        expect(res.status).toBe(422);
        expect(await read(res)).toMatchObject({ code: 'note_required' });
      }
      expect((await move(code, 'qa@lab.test', 'ON_HOLD', 'SUBMITTED', { internalNote: '   ' })).status).toBe(422);
    });

    it('solo admin cancela', async () => {
      await staffSetup();
      const code = await placeOrder();
      expect((await move(code, 'staff@lab.test', 'CANCELLED', 'SUBMITTED', { internalNote: 'x' })).status).toBe(403);
      expect((await move(code, 'admin@lab.test', 'CANCELLED', 'SUBMITTED', { internalNote: 'El cliente lo pidió' })).status).toBe(200);
      const view = await track(code);
      expect(view.status).toBe('CANCELLED');
      expect(view.pending).toEqual([]);
      expect(JSON.stringify(view)).not.toContain('El cliente lo pidió');
    });

    it('un pedido cerrado no admite más cambios', async () => {
      await staffSetup();
      const code = await placeOrder();
      await move(code, 'admin@lab.test', 'CANCELLED', 'SUBMITTED', { internalNote: 'x' });
      for (const to of ['PACKAGE_RECEIVED', 'ON_HOLD', 'SUBMITTED']) {
        expect((await move(code, 'admin@lab.test', to, 'CANCELLED', { internalNote: 'x' })).status).toBe(409);
      }
    });

    it('si el pedido cambió mientras tanto avisa y no pisa el trabajo del otro', async () => {
      await staffSetup();
      const code = await placeOrder();
      await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
      const stale = await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
      expect(stale.status).toBe(409);
      expect(await read(stale)).toMatchObject({ code: 'order_changed', currentStatus: 'PACKAGE_RECEIVED' });
      expect(await db.select().from(custodyEvents)).toHaveLength(2);
    });

    it('dos personas que hacen lo mismo a la vez: una gana y la otra recibe el aviso', async () => {
      await staffSetup();
      const code = await placeOrder();
      const results = await Promise.all([
        move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED'),
        move(code, 'admin@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED'),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      expect(await db.select().from(custodyEvents)).toHaveLength(2);
      expect(await db.select().from(emailOutbox).where(eq(emailOutbox.template, 'order_package_received'))).toHaveLength(1);
    });
  });

  describe('pausa', () => {
    it('al pausar y reanudar el pedido vuelve exactamente a donde estaba', async () => {
      await staffSetup();
      const code = await placeOrder();
      await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
      expect((await move(code, 'qa@lab.test', 'ON_HOLD', 'PACKAGE_RECEIVED', { internalNote: 'Carta con posible alteración' })).status).toBe(200);

      let [row] = await db.select().from(orders);
      expect(row).toMatchObject({ status: 'ON_HOLD', statusBeforeHold: 'PACKAGE_RECEIVED' });
      const paused = await track(code);
      expect(paused.steps.at(-1).label).toBe('Incidencia en revisión');
      expect(JSON.stringify(paused)).not.toContain('alteración');
      expect(paused.pending[0]).toBe('PRE_INSPECTION');

      // Desde la pausa solo se puede volver al estado anterior (o cancelar).
      expect((await move(code, 'staff@lab.test', 'PRE_INSPECTION', 'ON_HOLD', { internalNote: 'x' })).status).toBe(409);
      expect((await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'ON_HOLD', { internalNote: 'Revisada, todo correcto' })).status).toBe(200);

      [row] = await db.select().from(orders);
      expect(row).toMatchObject({ status: 'PACKAGE_RECEIVED', statusBeforeHold: null });
      expect((await track(code)).steps.at(-1).label).toBe('Pedido reanudado');
    });

    it('un grader no puede reanudar un pedido en pausa', async () => {
      await staffSetup();
      const code = await placeOrder();
      await move(code, 'grader@lab.test', 'ON_HOLD', 'SUBMITTED', { internalNote: 'x' });
      expect((await move(code, 'grader@lab.test', 'SUBMITTED', 'ON_HOLD', { internalNote: 'x' })).status).toBe(403);
    });
  });

  describe('aprobación final y seguimiento de la devolución', () => {
    /** Recibe el paquete y deja que el sistema lleve el pedido hasta control de calidad. */
    async function untilQuality(code: string, order: { tracking: boolean } = { tracking: true }) {
      await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
      await runAutomation();
      if (order.tracking) {
        await api(`/admin/orders/${code}/shipments`, 'staff@lab.test', { body: { direction: 'outbound', carrier: 'GLS', trackingNumber: 'ES-1' } });
      }
    }

    it('si el sistema encapsuló, la aprueba cualquiera de calidad o un admin', async () => {
      await staffSetup();
      const code = await placeOrder();
      await untilQuality(code);
      for (const email of ['qa@lab.test', 'admin@lab.test']) {
        const detail = (await read(await api(`/admin/orders/${code}`, email))).order;
        expect(detail.transitions.find((x: any) => x.to === 'SHIPPED'), email).toMatchObject({ allowed: true });
      }
      expect((await move(code, 'admin@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(200);
    });

    it('si un admin adelantó el encapsulado a mano, no puede aprobar él mismo la salida', async () => {
      await staffSetup();
      const code = await placeOrder();
      await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
      await move(code, 'admin@lab.test', 'PRE_INSPECTION', 'PACKAGE_RECEIVED');
      await move(code, 'admin@lab.test', 'OPTICAL_GRADING', 'PRE_INSPECTION');
      await move(code, 'admin@lab.test', 'ENCAPSULATION', 'OPTICAL_GRADING');
      await move(code, 'admin@lab.test', 'QUALITY_ASSURANCE', 'ENCAPSULATION');
      await api(`/admin/orders/${code}/shipments`, 'staff@lab.test', { body: { direction: 'outbound', carrier: 'GLS', trackingNumber: 'ES-1' } });

      const detail = (await read(await api(`/admin/orders/${code}`, 'admin@lab.test'))).order;
      expect(detail.transitions.find((x: any) => x.to === 'SHIPPED')).toMatchObject({ allowed: false, blockedReason: 'two_person_rule' });
      const res = await move(code, 'admin@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE');
      expect(res.status).toBe(409);
      expect(await read(res)).toMatchObject({ code: 'two_person_rule' });
      expect((await db.select().from(orders))[0].status).toBe('QUALITY_ASSURANCE');

      // Otra persona sí puede.
      expect((await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(200);
    });

    it('la devolución por mensajería no sale sin número de seguimiento', async () => {
      await staffSetup();
      const code = await placeOrder();
      await untilQuality(code, { tracking: false });

      const blocked = await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE');
      expect(blocked.status).toBe(409);
      expect(await read(blocked)).toMatchObject({ code: 'tracking_required' });
      const detail = (await read(await api(`/admin/orders/${code}`, 'qa@lab.test'))).order;
      expect(detail.transitions.find((x: any) => x.to === 'SHIPPED')).toMatchObject({ allowed: false, blockedReason: 'tracking_required' });

      // Un envío de entrada (el del cliente) no sirve como seguimiento de la devolución.
      await api(`/admin/orders/${code}/shipments`, 'staff@lab.test', { body: { direction: 'inbound', carrier: 'Correos', trackingNumber: 'IN-1' } });
      expect((await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(409);

      await api(`/admin/orders/${code}/shipments`, 'staff@lab.test', { body: { direction: 'outbound', carrier: 'GLS', trackingNumber: 'ES-1' } });
      expect((await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(200);
    });

    it('la entrega en mano no necesita seguimiento y usa su propio texto', async () => {
      await staffSetup();
      const code = await placeOrder('evento@example.com', { shippingMethod: 'CARD_SHOW_DROPOFF', shippingAddress: undefined });
      await untilQuality(code, { tracking: false });
      expect((await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(200);
      expect((await track(code)).steps.at(-1).label).toBe('Listo para entrega en mano');
    });
  });
});

describe('envíos', () => {
  const ship = (code: string, email: string, body: Record<string, unknown>) => api(`/admin/orders/${code}/shipments`, email, { body });

  it('el personal registra el transportista y el seguimiento, y el cliente lo ve', async () => {
    await staffSetup();
    const code = await placeOrder();
    const res = await ship(code, 'staff@lab.test', { direction: 'inbound', carrier: 'Correos', trackingNumber: 'PQ123', insuredValueCents: 45_000 });
    expect(res.status).toBe(201);
    expect((await read(res)).order.shipments[0]).toMatchObject({ direction: 'inbound', carrier: 'Correos', trackingNumber: 'PQ123', insuredValueCents: 45_000 });
    expect(await track(code)).toMatchObject({ carrier: 'Correos', trackingNumber: 'PQ123' });
    const [log] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'order.shipment_added'));
    expect(log.entityId).toBe(code);
  });

  it('un número corregido sustituye al anterior en el seguimiento público', async () => {
    await staffSetup();
    const code = await placeOrder();
    await ship(code, 'staff@lab.test', { direction: 'outbound', carrier: 'GLS', trackingNumber: 'MAL-ESCRITO' });
    await new Promise((r) => setTimeout(r, 5));
    await ship(code, 'staff@lab.test', { direction: 'outbound', carrier: 'GLS', trackingNumber: 'CORRECTO-1' });
    expect((await track(code)).trackingNumber).toBe('CORRECTO-1');
    expect(await db.select().from(shipments)).toHaveLength(2);
  });

  it('un grader no registra envíos', async () => {
    await staffSetup();
    const code = await placeOrder();
    expect((await ship(code, 'grader@lab.test', { direction: 'outbound', carrier: 'GLS', trackingNumber: 'X' })).status).toBe(403);
    expect((await read(await api(`/admin/orders/${code}`, 'grader@lab.test'))).order.canAddShipment).toBe(false);
  });

  it('un pedido cerrado no admite envíos nuevos', async () => {
    await staffSetup();
    const code = await placeOrder();
    await move(code, 'admin@lab.test', 'CANCELLED', 'SUBMITTED', { internalNote: 'x' });
    const res = await ship(code, 'staff@lab.test', { direction: 'outbound', carrier: 'GLS', trackingNumber: 'X' });
    expect(res.status).toBe(409);
    expect(await read(res)).toMatchObject({ code: 'order_finished' });
  });

  it.each([
    [{ direction: 'sideways', carrier: 'GLS', trackingNumber: 'X' }],
    [{ direction: 'outbound', carrier: '', trackingNumber: 'X' }],
    [{ direction: 'outbound', carrier: 'GLS', trackingNumber: '  ' }],
    [{ direction: 'outbound', carrier: 'GLS', trackingNumber: 'X', insuredValueCents: -5 }],
  ])('rechaza datos inválidos con 422: %j', async (body) => {
    await staffSetup();
    const code = await placeOrder();
    expect((await ship(code, 'staff@lab.test', body)).status).toBe(422);
  });

  it('devuelve 404 si el pedido no existe', async () => {
    await staffSetup();
    expect((await ship('GGI-ORD-ZZZZZZ', 'staff@lab.test', { direction: 'outbound', carrier: 'GLS', trackingNumber: 'X' })).status).toBe(404);
  });
});
