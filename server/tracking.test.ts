import { sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { custodyEvents, orderItems, orders, rateLimitEvents, serviceTiers, shipments } from '../db/schema.js';
import { createTestApp, createTestDb, insertTier, insertUser, type TestDb } from './testing.js';

const read = (res: Response) => res.json() as Promise<any>;

let db: TestDb;
let t: ReturnType<typeof createTestApp>;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(
    sql`truncate users, orders, service_tiers, otp_challenges, sessions, rate_limit_events restart identity cascade`,
  );
  t = createTestApp(db);
});

const track = (query: string, cookie?: string, ip?: string) =>
  t.app.request(`/api/v1/tracking/${encodeURIComponent(query)}`, {
    headers: { ...(cookie && { cookie }), ...(ip && { 'x-forwarded-for': ip }) },
  });

async function loginAs(email: string) {
  await t.json('/api/v1/auth/otp', { email });
  const res = await t.json('/api/v1/auth/otp/verify', { email, code: t.sent.at(-1)!.code });
  return res.headers.get('set-cookie')!.split(';')[0];
}

type Event = { status: (typeof custodyEvents.$inferInsert)['toStatus']; at: string; label?: string; note?: string };

async function createOrder(o: {
  ownerEmail: string;
  code: string;
  status: (typeof orders.$inferInsert)['status'];
  events?: Event[];
  trackingNumber?: string;
  statusBeforeHold?: (typeof orders.$inferInsert)['status'];
}) {
  const owner = await insertUser(db, o.ownerEmail);
  const [existingTier] = await db.select().from(serviceTiers).limit(1);
  const tier = existingTier ?? (await insertTier(db));
  const [order] = await db
    .insert(orders)
    .values({
      code: o.code,
      userId: owner.id,
      status: o.status,
      statusBeforeHold: o.statusBeforeHold,
      submittedAt: new Date('2026-09-18T08:00:00Z'),
      estimatedCompletionAt: '2026-09-25',
      shippingAddress: { fullName: 'Persona Privada', line1: 'Calle Secreta 7', city: 'Madrid', postalCode: '28001', countryCode: 'ES' },
    })
    .returning();
  await db.insert(orderItems).values([
    { orderId: order.id, position: 1, cardName: 'Charizard Holo', game: 'Pokemon', setName: 'Base Set', declaredValueCents: 850000, serviceTierId: tier.id, unitPriceCents: 5000, maxDeclaredValueCents: 300000 },
    { orderId: order.id, position: 2, cardName: 'Gengar VMAX', game: 'Pokemon', setName: 'Fusion Strike', declaredValueCents: 38000, serviceTierId: tier.id, unitPriceCents: 5000, maxDeclaredValueCents: 300000 },
  ]);
  await db.insert(shipments).values({ orderId: order.id, direction: 'inbound', carrier: 'GLS', trackingNumber: o.trackingNumber ?? 'ES-GLS-1' });
  for (const e of o.events ?? []) {
    await db.insert(custodyEvents).values({
      orderId: order.id,
      toStatus: e.status,
      publicLabel: e.label ?? e.status,
      publicDescription: `Descripción de ${e.status}`,
      internalNote: e.note ?? 'NOTA INTERNA CONFIDENCIAL',
      occurredAt: new Date(e.at),
    });
  }
  return { order, owner };
}

const IN_GRADING: Event[] = [
  { status: 'SUBMITTED', at: '2026-09-18T08:00:00Z' },
  { status: 'PACKAGE_RECEIVED', at: '2026-09-19T12:00:00Z' },
  { status: 'PRE_INSPECTION', at: '2026-09-20T09:00:00Z' },
  { status: 'OPTICAL_GRADING', at: '2026-09-22T10:00:00Z' },
];

describe('GET /tracking/:query', () => {
  it('devuelve 404 para un código que no existe, sin exigir sesión', async () => {
    const res = await track('GGI-ORD-NOEXISTE');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    expect(await read(res)).toMatchObject({ code: 'order_not_found' });
  });

  it('encuentra el pedido por su código, sin importar mayúsculas', async () => {
    await createOrder({ ownerEmail: 'ana@example.com', code: 'GGI-ORD-7K4M9Q', status: 'OPTICAL_GRADING', events: IN_GRADING });
    const res = await track('ggi-ord-7k4m9q');
    expect(res.status).toBe(200);
    expect((await read(res)).tracking).toMatchObject({ code: 'GGI-ORD-7K4M9Q', status: 'OPTICAL_GRADING', itemCount: 2 });
  });

  it('encuentra el pedido por el número de seguimiento del transportista', async () => {
    await createOrder({ ownerEmail: 'ana@example.com', code: 'GGI-ORD-7K4M9Q', status: 'OPTICAL_GRADING', trackingNumber: 'ES-GLS-9928174620', events: IN_GRADING });
    const res = await track('es-gls-9928174620');
    expect(res.status).toBe(200);
    expect((await read(res)).tracking).toMatchObject({ code: 'GGI-ORD-7K4M9Q', carrier: 'GLS', trackingNumber: 'ES-GLS-9928174620' });
  });

  it('los borradores no se pueden consultar', async () => {
    await createOrder({ ownerEmail: 'ana@example.com', code: 'GGI-ORD-DRAFT9', status: 'DRAFT' });
    expect((await track('GGI-ORD-DRAFT9')).status).toBe(404);
  });

  it('una consulta con caracteres raros no llega a la base de datos y da 404', async () => {
    expect((await track("x'; drop table orders; --")).status).toBe(404);
    expect((await track('%')).status).toBe(404);
    expect((await db.select().from(orders)).length).toBe(0);
  });
});

describe('privacidad', () => {
  it('nunca expone dirección, notas internas, valores declarados ni datos del dueño', async () => {
    const { owner } = await createOrder({ ownerEmail: 'ana@example.com', code: 'GGI-ORD-7K4M9Q', status: 'OPTICAL_GRADING', events: IN_GRADING });
    // Incluso el dueño con sesión recibe solo lo público.
    const cookie = await loginAs('ana@example.com');
    for (const text of [await (await track('GGI-ORD-7K4M9Q')).text(), await (await track('GGI-ORD-7K4M9Q', cookie)).text()]) {
      expect(text).not.toContain('Calle Secreta');
      expect(text).not.toContain('Persona Privada');
      expect(text).not.toContain('28001');
      expect(text).not.toContain('NOTA INTERNA');
      expect(text).not.toContain('ana@example.com');
      expect(text).not.toContain(owner.id);
      expect(text).not.toContain('850000');
      expect(text).not.toContain('8500');
    }
  });

  it('sin sesión solo se ve cuántas cartas hay, no cuáles', async () => {
    await createOrder({ ownerEmail: 'ana@example.com', code: 'GGI-ORD-7K4M9Q', status: 'OPTICAL_GRADING', events: IN_GRADING });
    const text = await (await track('GGI-ORD-7K4M9Q')).text();
    const { tracking } = JSON.parse(text);
    expect(tracking.items).toBeNull();
    expect(tracking.itemCount).toBe(2);
    expect(text).not.toContain('Charizard');
    expect(text).not.toContain('Gengar');
  });

  it('otra persona con sesión tampoco ve las cartas', async () => {
    await createOrder({ ownerEmail: 'ana@example.com', code: 'GGI-ORD-7K4M9Q', status: 'OPTICAL_GRADING', events: IN_GRADING });
    const cookie = await loginAs('bea@example.com');
    const text = await (await track('GGI-ORD-7K4M9Q', cookie)).text();
    expect(JSON.parse(text).tracking.items).toBeNull();
    expect(text).not.toContain('Charizard');
  });

  it('el dueño con sesión ve sus cartas', async () => {
    await createOrder({ ownerEmail: 'ana@example.com', code: 'GGI-ORD-7K4M9Q', status: 'OPTICAL_GRADING', events: IN_GRADING });
    const cookie = await loginAs('ana@example.com');
    const { tracking } = await read(await track('GGI-ORD-7K4M9Q', cookie));
    expect(tracking.items).toEqual([
      { position: 1, cardName: 'Charizard Holo', game: 'Pokemon', set: 'Base Set' },
      { position: 2, cardName: 'Gengar VMAX', game: 'Pokemon', set: 'Fusion Strike' },
    ]);
  });

  it('no se guarda en cachés compartidas', async () => {
    await createOrder({ ownerEmail: 'ana@example.com', code: 'GGI-ORD-7K4M9Q', status: 'OPTICAL_GRADING', events: IN_GRADING });
    expect((await track('GGI-ORD-7K4M9Q')).headers.get('cache-control')).toBe('private, no-store');
  });
});

describe('línea de tiempo', () => {
  it('marca el último evento como en curso y añade las fases que faltan', async () => {
    await createOrder({ ownerEmail: 'ana@example.com', code: 'GGI-ORD-7K4M9Q', status: 'OPTICAL_GRADING', events: IN_GRADING });
    const { tracking } = await read(await track('GGI-ORD-7K4M9Q'));
    expect(tracking.steps.map((s: any) => [s.status, s.state])).toEqual([
      ['SUBMITTED', 'completed'],
      ['PACKAGE_RECEIVED', 'completed'],
      ['PRE_INSPECTION', 'completed'],
      ['OPTICAL_GRADING', 'current'],
    ]);
    expect(tracking.pending).toEqual(['ENCAPSULATION', 'QUALITY_ASSURANCE', 'SHIPPED', 'DELIVERED']);
  });

  it('ordena los eventos por fecha aunque se hayan registrado en otro orden', async () => {
    await createOrder({
      ownerEmail: 'ana@example.com', code: 'GGI-ORD-7K4M9Q', status: 'PACKAGE_RECEIVED',
      events: [
        { status: 'PACKAGE_RECEIVED', at: '2026-09-19T12:00:00Z' },
        { status: 'SUBMITTED', at: '2026-09-18T08:00:00Z' },
      ],
    });
    const { tracking } = await read(await track('GGI-ORD-7K4M9Q'));
    expect(tracking.steps.map((s: any) => s.status)).toEqual(['SUBMITTED', 'PACKAGE_RECEIVED']);
  });

  it('un pedido entregado lo tiene todo completado y nada pendiente', async () => {
    await createOrder({
      ownerEmail: 'ana@example.com', code: 'GGI-ORD-3FX8RB', status: 'DELIVERED',
      events: [
        { status: 'SUBMITTED', at: '2026-09-08T08:00:00Z' },
        { status: 'QUALITY_ASSURANCE', at: '2026-09-14T08:00:00Z' },
        { status: 'DELIVERED', at: '2026-09-16T08:00:00Z' },
      ],
    });
    const { tracking } = await read(await track('GGI-ORD-3FX8RB'));
    expect(tracking.steps.every((s: any) => s.state === 'completed')).toBe(true);
    expect(tracking.pending).toEqual([]);
  });

  it('un pedido en pausa sigue mostrando lo que falta desde donde estaba', async () => {
    await createOrder({
      ownerEmail: 'ana@example.com', code: 'GGI-ORD-HOLD55', status: 'ON_HOLD', statusBeforeHold: 'PRE_INSPECTION',
      events: [
        { status: 'SUBMITTED', at: '2026-09-18T08:00:00Z' },
        { status: 'PRE_INSPECTION', at: '2026-09-20T08:00:00Z' },
        { status: 'ON_HOLD', at: '2026-09-21T08:00:00Z' },
      ],
    });
    const { tracking } = await read(await track('GGI-ORD-HOLD55'));
    expect(tracking.status).toBe('ON_HOLD');
    expect(tracking.pending[0]).toBe('OPTICAL_GRADING');
  });

  it('un pedido cancelado no tiene fases pendientes', async () => {
    await createOrder({
      ownerEmail: 'ana@example.com', code: 'GGI-ORD-CANC66', status: 'CANCELLED',
      events: [{ status: 'SUBMITTED', at: '2026-09-18T08:00:00Z' }, { status: 'CANCELLED', at: '2026-09-19T08:00:00Z' }],
    });
    const { tracking } = await read(await track('GGI-ORD-CANC66'));
    expect(tracking.pending).toEqual([]);
    expect(tracking.steps.every((s: any) => s.state === 'completed')).toBe(true);
  });

  it('un pedido recién enviado sin eventos muestra todo el recorrido pendiente', async () => {
    await createOrder({ ownerEmail: 'ana@example.com', code: 'GGI-ORD-NEW111', status: 'SUBMITTED' });
    const { tracking } = await read(await track('GGI-ORD-NEW111'));
    expect(tracking.steps).toEqual([]);
    expect(tracking.pending[0]).toBe('PACKAGE_RECEIVED');
  });
});

describe('límite de consultas', () => {
  it('permite 60 consultas por IP y bloquea la siguiente', async () => {
    for (let i = 0; i < 60; i++) {
      expect((await track(`GGI-ORD-${i}`, undefined, '203.0.113.7')).status).toBe(404);
    }
    const blocked = await track('GGI-ORD-1', undefined, '203.0.113.7');
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(await read(blocked)).toMatchObject({ code: 'too_many_requests' });
  });

  it('el límite es por IP: otra IP sigue pudiendo consultar', async () => {
    for (let i = 0; i < 60; i++) await track(`GGI-ORD-${i}`, undefined, '203.0.113.7');
    expect((await track('GGI-ORD-1', undefined, '203.0.113.8')).status).toBe(404);
  });

  it('las consultas antiguas dejan de contar', async () => {
    for (let i = 0; i < 60; i++) await track(`GGI-ORD-${i}`, undefined, '203.0.113.7');
    await db.update(rateLimitEvents).set({ createdAt: new Date(Date.now() - 11 * 60_000) });
    expect((await track('GGI-ORD-1', undefined, '203.0.113.7')).status).toBe(404);
  });

  it('no guarda la IP en claro', async () => {
    await track('GGI-ORD-1', undefined, '203.0.113.7');
    const [row] = await db.select().from(rateLimitEvents);
    expect(row.keyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain('203.0.113.7');
  });
});
