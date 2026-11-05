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
        { tier: 'standard' },
        { tier: 'standard' },
      ],
      shippingMethod: 'COURIER_INSURED',
      fullName: 'Carla Cliente',
      shippingAddress: { line1: 'Calle Secreta 7', city: 'Madrid', postalCode: '28001', countryCode: 'ES' },
      locale: 'es',
      clientToken: `token-${Math.random().toString(36).slice(2)}-0000`,
      acceptedTerms: true,
    },
  });
  expect(res.status).toBe(201);
  return (await read(res)).order.code as string;
}

// Los datos de la carta salen del PDF del escáner; corregirlos a mano es cosa de administración.
const identify = (code: string, position: number, cardName: string, email = 'admin@lab.test') =>
  api(`/admin/orders/${code}/items/${position}/card`, email, { method: 'PUT', body: { cardName, game: 'Pokemon', setName: 'Base Set' } });

/** Recibe el paquete y deja las dos cartas con nombre. */
const received = async (identified = true) => {
  const code = await placeOrder();
  const res = await api(`/admin/orders/${code}/transitions`, 'staff@lab.test', { body: { to: 'PACKAGE_RECEIVED', expectedStatus: 'SUBMITTED' } });
  expect(res.status).toBe(200);
  if (identified) {
    expect((await identify(code, 1, 'Charizard Holo')).status).toBe(200);
    expect((await identify(code, 2, 'Blastoise Holo')).status).toBe(200);
  }
  return code;
};

const result = (submit: boolean, isAuthentic = true) =>
  isAuthentic
    ? { isAuthentic, centering: { score: 9 }, corners: { score: 9 }, edges: { score: 9 }, surface: { score: 9 }, submit }
    : { isAuthentic, submit };
/** Resultado a mano (solo administración); en el día a día sale del PDF del escáner. */
const grade = (code: string, position: number, submit = false, isAuthentic = true) =>
  api(`/admin/orders/${code}/items/${position}/grading`, 'admin@lab.test', { method: 'PUT', body: result(submit, isAuthentic) });
const confirm = (code: string, position: number, email = 'qa@lab.test') =>
  api(`/admin/orders/${code}/items/${position}/grading/approve`, email, { body: {} });

/** Sube y confirma fotos del slab de una carta. */
async function slabPhotos(code: string, position: number, kinds: ('front' | 'back')[] = ['front', 'back']) {
  for (const kind of kinds) {
    const { image, upload } = await read(
      await api(`/admin/orders/${code}/items/${position}/images`, 'staff@lab.test', { body: { kind, contentType: 'image/jpeg', byteSize: 1000 } }),
    );
    t.storage.put(upload.url.replace('memory://upload/', ''));
    expect((await api(`/admin/orders/${code}/items/${position}/images/${image.id}/confirm`, 'staff@lab.test', { body: {} })).status).toBe(200);
  }
}

const today = async (email: string) => {
  const res = await api('/admin/today', email);
  expect(res.status).toBe(200);
  const { sections } = await read(res);
  return Object.fromEntries(sections.map((s: any) => [s.key, s])) as Record<string, any>;
};

describe('pantalla "Hoy" del laboratorio', () => {
  it('cada rol ve sus propias secciones', async () => {
    expect(Object.keys(await today('staff@lab.test'))).toEqual(['toReceive', 'toScan', 'toConfirm', 'toDeliver', 'onHold']);
    expect(Object.keys(await today('grader@lab.test'))).toEqual(['toScan', 'toConfirm']);
    expect(Object.keys(await today('qa@lab.test'))).toEqual(['toScan', 'toConfirm', 'readyToShip']);
    expect(Object.keys(await today('admin@lab.test'))).toEqual(['late', 'toReceive', 'toScan', 'toConfirm', 'readyToShip', 'toDeliver', 'onHold']);
  });

  it('recepción ve los paquetes por recibir y, al recibirlos, las cartas que faltan por escanear y fotografiar', async () => {
    const code = await placeOrder();
    let s = await today('staff@lab.test');
    expect(s.toReceive).toMatchObject({ count: 1, tasks: [{ orderCode: code, customerEmail: 'cliente@example.com' }] });
    expect(s.toScan.count).toBe(0);

    await api(`/admin/orders/${code}/transitions`, 'staff@lab.test', { body: { to: 'PACKAGE_RECEIVED', expectedStatus: 'SUBMITTED' } });
    s = await today('staff@lab.test');
    expect(s.toReceive.count).toBe(0);
    expect(s.toScan).toMatchObject({
      count: 2,
      tasks: [{ orderCode: code, position: 1, note: 'Falta el PDF del escáner y la foto del slab (anverso y reverso)' }, { position: 2 }],
    });
    // Aún no hay PDF, así que la carta no tiene nombre.
    expect(s.toScan.tasks[0].cardName).toBeUndefined();

    await slabPhotos(code, 1, ['front']);
    expect((await today('staff@lab.test')).toScan.tasks[0].note).toBe('Falta el PDF del escáner y la foto del slab (reverso)');
    await slabPhotos(code, 1, ['back']);
    expect((await today('staff@lab.test')).toScan.tasks[0].note).toBe('Falta el PDF del escáner');
  });

  it('una carta con el resultado pendiente pasa de "por escanear" a "por confirmar", con lo que le falta', async () => {
    const code = await received();
    expect((await today('grader@lab.test')).toScan.count).toBe(2);

    // Un borrador sigue contando como pendiente de escanear.
    await grade(code, 1);
    expect((await today('grader@lab.test')).toScan.count).toBe(2);

    await grade(code, 1, true);
    let s = await today('grader@lab.test');
    expect(s.toScan).toMatchObject({ count: 1, tasks: [{ position: 2 }] });
    expect(s.toConfirm).toMatchObject({ count: 1, tasks: [{ orderCode: code, position: 1, cardName: 'Charizard Holo', note: 'Nota 9 · falta la foto del slab (anverso y reverso)' }] });

    await slabPhotos(code, 1, ['front']);
    expect((await today('qa@lab.test')).toConfirm.tasks[0].note).toBe('Nota 9 · falta la foto del slab (reverso)');
    await slabPhotos(code, 1, ['back']);
    // Todos los roles del laboratorio ven lo mismo.
    for (const email of ['staff@lab.test', 'grader@lab.test', 'qa@lab.test', 'admin@lab.test']) {
      expect((await today(email)).toConfirm, email).toMatchObject({ count: 1, tasks: [{ position: 1, note: 'Nota 9' }] });
    }

    // Una carta no auténtica no lleva fotos del slab.
    await grade(code, 2, true, false);
    s = await today('staff@lab.test');
    expect(s.toScan.count).toBe(0);
    expect(s.toConfirm.tasks.find((x: any) => x.position === 2)).toMatchObject({ note: 'No auténtica' });

    // Al confirmarla sale de la lista.
    expect((await confirm(code, 1)).status).toBe(200);
    expect((await today('staff@lab.test')).toConfirm).toMatchObject({ count: 1, tasks: [{ position: 2 }] });
  });

  it('avisa cuando a una carta pendiente de confirmar le falta el nombre', async () => {
    const code = await received();
    await slabPhotos(code, 1);
    await grade(code, 1, true);
    await db.execute(sql`update order_items set card_name = null where position = 1`);
    const s = await today('qa@lab.test');
    expect(s.toConfirm).toMatchObject({ count: 1, tasks: [{ position: 1, note: 'Nota 9 · sin nombre de carta' }] });
    expect((await read(await confirm(code, 1))).code).toBe('card_unidentified');
  });

  it('calidad ve los pedidos con todas las cartas confirmadas, listos para aprobar la salida', async () => {
    const code = await received();
    await slabPhotos(code, 1);
    await slabPhotos(code, 2);
    await grade(code, 1, true);
    await grade(code, 2, true);
    expect((await confirm(code, 1)).status).toBe(200);
    await db.update(orders).set({ status: 'QUALITY_ASSURANCE' }).where(eq(orders.code, code));
    expect((await today('qa@lab.test')).readyToShip.count).toBe(0);

    expect((await confirm(code, 2, 'staff@lab.test')).status).toBe(200);
    expect((await today('qa@lab.test')).readyToShip).toMatchObject({ count: 1, tasks: [{ orderCode: code, note: '2 cartas confirmadas' }] });
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

describe('corregir a mano qué carta es', () => {
  it('solo administración; el resto del laboratorio y los clientes no', async () => {
    const code = await received(false);
    const asAdmin = await api(`/admin/orders/${code}/items/2/card`, 'admin@lab.test', { method: 'PUT', body: { cardName: 'Blastoise', game: 'Pokemon', year: 1999, language: 'English' } });
    expect(asAdmin.status).toBe(200);
    expect((await read(asAdmin)).order.items[1]).toMatchObject({ cardName: 'Blastoise', game: 'Pokemon', year: 1999, language: 'English' });
    // El cliente ya inició sesión al hacer el pedido.
    for (const email of ['staff@lab.test', 'grader@lab.test', 'qa@lab.test', 'cliente@example.com']) {
      expect((await identify(code, 1, 'Charizard Holo', email)).status, email).toBe(403);
    }
  });

  it('pide nombre y juego, y solo mientras la carta está en el laboratorio', async () => {
    const code = await placeOrder();
    // Antes de recibir el paquete no hay carta que identificar.
    expect((await identify(code, 1, 'Charizard Holo')).status).toBe(409);
    await api(`/admin/orders/${code}/transitions`, 'staff@lab.test', { body: { to: 'PACKAGE_RECEIVED', expectedStatus: 'SUBMITTED' } });
    expect((await api(`/admin/orders/${code}/items/1/card`, 'admin@lab.test', { method: 'PUT', body: { cardName: ' ', game: 'Pokemon' } })).status).toBe(422);
    expect((await api(`/admin/orders/${code}/items/9/card`, 'admin@lab.test', { method: 'PUT', body: { cardName: 'A', game: 'B' } })).status).toBe(404);
  });

  it('una carta sin identificar no se puede dejar pendiente de confirmar', async () => {
    const code = await received(false);
    const res = await grade(code, 1, true);
    expect(res.status).toBe(409);
    expect(await read(res)).toMatchObject({ code: 'card_unidentified' });
    // Como borrador sí se puede guardar mientras tanto.
    expect((await grade(code, 1)).status).toBe(200);
    await identify(code, 1, 'Charizard Holo');
    expect((await grade(code, 1, true)).status).toBe(200);
  });
});
