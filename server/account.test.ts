import { sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { custodyEvents, orderItems, orders, shipments } from '../db/schema.js';
import {
  createTestApp,
  createTestDb,
  insertGradedOrder,
  insertTier,
  insertUser,
  type TestDb,
} from './testing.js';

/** El JSON de una respuesta, sin tipar: en las pruebas se comprueba con expect. */
const read = (res: Response) => res.json() as Promise<any>;

let db: TestDb;
let t: ReturnType<typeof createTestApp>;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(
    sql`truncate users, orders, card_identities, service_tiers, otp_challenges, sessions restart identity cascade`,
  );
  t = createTestApp(db);
});

async function loginAs(email: string) {
  await t.json('/api/v1/auth/otp', { email });
  const { code } = t.sent.at(-1)!;
  const res = await t.json('/api/v1/auth/otp/verify', { email, code });
  return { cookie: res.headers.get('set-cookie')!.split(';')[0], user: (await read(res)).user };
}

const get = (path: string, cookie?: string) =>
  t.app.request(path, { headers: cookie ? { cookie } : undefined });

/** Dos clientes, un grader y un QA, con un servicio. */
async function setup() {
  const ana = await insertUser(db, 'ana@example.com');
  const bea = await insertUser(db, 'bea@example.com');
  const grader = await insertUser(db, 'grader@example.com', 'grader');
  const qa = await insertUser(db, 'qa@example.com', 'qa');
  const tier = await insertTier(db);
  return { ana, bea, grader, qa, tier };
}

describe('GET /orders', () => {
  it('exige sesión', async () => {
    expect((await get('/api/v1/orders')).status).toBe(401);
  });

  it('una cuenta nueva no tiene pedidos', async () => {
    const { cookie } = await loginAs('nueva@example.com');
    const res = await get('/api/v1/orders', cookie);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ orders: [] });
  });

  it('devuelve solo los pedidos del usuario con sesión', async () => {
    const { ana, bea, grader, qa, tier } = await setup();
    const common = { tierId: tier.id, graderId: grader.id, qaId: qa.id, grade: 10 };
    await insertGradedOrder(db, { ...common, ownerId: ana.id, orderCode: '284719365', certNumber: '00000100', cardName: 'Charizard' });
    await insertGradedOrder(db, { ...common, ownerId: bea.id, orderCode: '284720378', certNumber: '00000200', cardName: 'Blastoise' });

    const { cookie } = await loginAs('ana@example.com');
    const body = await read(await get('/api/v1/orders', cookie));

    expect(body.orders.map((o: { code: string }) => o.code)).toEqual(['284719365']);
    expect(JSON.stringify(body)).not.toContain('284720378');
    expect(JSON.stringify(body)).not.toContain('Blastoise');
  });

  it('incluye recuento de cartas, primera carta y datos del envío', async () => {
    const { ana, grader, qa, tier } = await setup();
    const { orderId } = await insertGradedOrder(db, {
      ownerId: ana.id, tierId: tier.id, graderId: grader.id, qaId: qa.id, grade: 10,
      orderCode: '284719365', certNumber: '00000100', cardName: 'Charizard',
    });
    await db.insert(orderItems).values({
      orderId, position: 2, cardName: 'Pikachu', game: 'Pokemon', declaredValueCents: 1000,
      serviceTierId: tier.id, unitPriceCents: 2500, maxDeclaredValueCents: 150000,
    });
    await db.insert(shipments).values({ orderId, direction: 'inbound', carrier: 'GLS', trackingNumber: 'ES-123' });

    const { cookie } = await loginAs('ana@example.com');
    const [order] = (await read(await get('/api/v1/orders', cookie))).orders;
    expect(order).toMatchObject({
      code: '284719365',
      status: 'DELIVERED',
      itemCount: 2,
      firstCardName: 'Charizard',
      carrier: 'GLS',
      trackingNumber: 'ES-123',
    });
  });

  it('no incluye los borradores', async () => {
    const { ana } = await setup();
    await db.insert(orders).values({ code: '284721391', userId: ana.id, status: 'DRAFT' });
    const { cookie } = await loginAs('ana@example.com');
    expect((await read(await get('/api/v1/orders', cookie))).orders).toEqual([]);
  });

  it('ordena del más reciente al más antiguo', async () => {
    const { ana } = await setup();
    await db.insert(orders).values([
      { code: '284719365', userId: ana.id, status: 'SUBMITTED', submittedAt: new Date('2026-08-01') },
      { code: '284720378', userId: ana.id, status: 'SUBMITTED', submittedAt: new Date('2026-09-15') },
    ]);
    const { cookie } = await loginAs('ana@example.com');
    const codes = (await read(await get('/api/v1/orders', cookie))).orders.map((o: { code: string }) => o.code);
    expect(codes).toEqual(['284720378', '284719365']);
  });

  it('no expone direcciones, notas internas ni datos de otros usuarios', async () => {
    const { ana } = await setup();
    const [o] = await db
      .insert(orders)
      .values({
        code: '284719365', userId: ana.id, status: 'PRE_INSPECTION', submittedAt: new Date(),
        shippingAddress: { fullName: 'Ana', line1: 'Calle Secreta 1', city: 'Madrid', postalCode: '28001', countryCode: 'ES' },
      })
      .returning();
    await db.insert(custodyEvents).values({ orderId: o.id, toStatus: 'PRE_INSPECTION', publicLabel: 'x', internalNote: 'nota interna' });
    const { cookie } = await loginAs('ana@example.com');
    const text = await (await get('/api/v1/orders', cookie)).text();
    expect(text).not.toContain('Calle Secreta');
    expect(text).not.toContain('nota interna');
  });
});

describe('GET /me/cards', () => {
  it('exige sesión', async () => {
    expect((await get('/api/v1/me/cards')).status).toBe(401);
  });

  it('una cuenta nueva tiene la bóveda vacía', async () => {
    const { cookie } = await loginAs('nueva@example.com');
    expect(await read(await get('/api/v1/me/cards', cookie))).toEqual({ cards: [] });
  });

  it('devuelve las cartas certificadas del usuario con sus defectos y valor declarado', async () => {
    const { ana, grader, qa, tier } = await setup();
    await insertGradedOrder(db, {
      ownerId: ana.id, tierId: tier.id, graderId: grader.id, qaId: qa.id, grade: 9.5,
      orderCode: '284719365', certNumber: '00000100', cardName: 'Charizard', declaredValueCents: 45000,
    });
    const { cookie } = await loginAs('ana@example.com');
    const [card] = (await read(await get('/api/v1/me/cards', cookie))).cards;

    expect(card).toMatchObject({
      certNumber: '00000100',
      name: 'Charizard',
      grade: 9.5,
      declaredValueEur: 450,
      frontImage: '/images/cards/front.jpg',
      subgrades: { centering: { score: 9.5 }, edges: { score: 10 } },
    });
    expect(card.defects).toHaveLength(1);
    expect(card.defects[0]).toMatchObject({ category: 'Surface', severity: 'minor', x: 62, y: 42, deduction: 0.2 });
  });

  it('no muestra cartas de otro usuario', async () => {
    const { ana, bea, grader, qa, tier } = await setup();
    const common = { tierId: tier.id, graderId: grader.id, qaId: qa.id, grade: 10 };
    await insertGradedOrder(db, { ...common, ownerId: bea.id, orderCode: '284720378', certNumber: '00000200', cardName: 'Blastoise' });
    await insertGradedOrder(db, { ...common, ownerId: ana.id, orderCode: '284719365', certNumber: '00000100', cardName: 'Charizard' });

    const { cookie } = await loginAs('ana@example.com');
    const { cards } = await read(await get('/api/v1/me/cards', cookie));
    expect(cards.map((c: { certNumber: string }) => c.certNumber)).toEqual(['00000100']);
  });

  it('calcula la población con todas las cartas iguales, sean de quien sean', async () => {
    const { ana, bea, grader, qa, tier } = await setup();
    const common = { tierId: tier.id, graderId: grader.id, qaId: qa.id, cardName: 'Charizard' };
    const first = await insertGradedOrder(db, { ...common, ownerId: ana.id, orderCode: '284719365', certNumber: '00000100', grade: 9 });
    // Otras dos copias de la misma carta, de otra persona: una mejor y otra igual.
    await insertGradedOrder(db, { ...common, ownerId: bea.id, orderCode: '284720378', certNumber: '00000200', grade: 10, identityId: first.identityId });
    await insertGradedOrder(db, { ...common, ownerId: bea.id, orderCode: '284722404', certNumber: '00000300', grade: 9, identityId: first.identityId });

    const { cookie } = await loginAs('ana@example.com');
    const [card] = (await read(await get('/api/v1/me/cards', cookie))).cards;
    expect(card.population).toEqual({ totalGraded: 3, higherCount: 1, equalCount: 2 });
  });

  it('no muestra certificados revocados', async () => {
    const { ana, grader, qa, tier } = await setup();
    await insertGradedOrder(db, {
      ownerId: ana.id, tierId: tier.id, graderId: grader.id, qaId: qa.id, grade: 10,
      orderCode: '284719365', certNumber: '00000100', cardName: 'Charizard', certStatus: 'revoked',
    });
    const { cookie } = await loginAs('ana@example.com');
    expect(await read(await get('/api/v1/me/cards', cookie))).toEqual({ cards: [] });
  });
});

describe('GET /me', () => {
  it('incluye el código de cliente y la fecha de alta', async () => {
    const { user } = await loginAs('ana@example.com');
    expect(user.customerCode).toMatch(/^[0-9]{6}$/);
    expect(new Date(user.createdAt).getTime()).not.toBeNaN();
  });
});
