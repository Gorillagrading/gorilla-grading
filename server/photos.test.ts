import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { auditLogs, itemImages, orders } from '../db/schema.js';
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
    ['staff@lab.test', 'staff'], ['grader@lab.test', 'grader'], ['qa@lab.test', 'qa'], ['admin@lab.test', 'admin'],
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

const api = (path: string, email?: string, init: { method?: string; body?: unknown } = {}) =>
  t.app.request(`/api/v1${path}`, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers: { ...(email && { cookie: cookies.get(email)! }), ...(init.body ? { 'content-type': 'application/json' } : {}) },
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

const received = async () => {
  const code = await placeOrder();
  await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
  return code;
};

const reserve = (code: string, email: string, body: unknown, position = 1) =>
  api(`/admin/orders/${code}/items/${position}/images`, email, { body });
const keyOf = (upload: { url: string }) => upload.url.replace('memory://upload/', '');

/** Reserva, "sube" y confirma una foto. */
async function addPhoto(code: string, kind: 'front' | 'back' | 'extra', position = 1, email = 'staff@lab.test') {
  const { image, upload } = await read(await reserve(code, email, { kind, contentType: 'image/jpeg', byteSize: 2_000_000 }, position));
  t.storage.put(keyOf(upload));
  const res = await api(`/admin/orders/${code}/items/${position}/images/${image.id}/confirm`, email, { body: {} });
  expect(res.status).toBe(200);
  return image.id as string;
}

describe('subir fotos', () => {
  it('reserva el hueco, devuelve dónde subir y la foto no cuenta hasta confirmarla', async () => {
    const code = await received();
    const res = await reserve(code, 'staff@lab.test', { kind: 'front', contentType: 'image/jpeg', byteSize: 3_000_000 });
    expect(res.status).toBe(201);
    const { image, upload } = await read(res);
    expect(upload).toMatchObject({ method: 'PUT', body: 'multipart' });
    expect(keyOf(upload)).toMatch(/^items\/[0-9a-f-]{36}\/front-[0-9a-f-]{36}\.jpg$/);

    const listed = await read(await api(`/admin/orders/${code}/images`, 'staff@lab.test'));
    expect(listed.items[0].images).toEqual([]);

    // Sin archivo en el almacenamiento no se puede confirmar.
    const early = await api(`/admin/orders/${code}/items/1/images/${image.id}/confirm`, 'staff@lab.test', { body: {} });
    expect(early.status).toBe(409);
    expect(await read(early)).toMatchObject({ code: 'upload_missing' });

    t.storage.put(keyOf(upload));
    const ok = await api(`/admin/orders/${code}/items/1/images/${image.id}/confirm`, 'staff@lab.test', { body: {} });
    expect((await read(ok)).image).toMatchObject({ id: image.id, kind: 'front', contentType: 'image/jpeg' });

    const after = await read(await api(`/admin/orders/${code}/images`, 'staff@lab.test'));
    expect(after.items[0].images).toHaveLength(1);
    expect(after.items[0].images[0].url).toBe(`memory://download/${keyOf(upload)}?ttl=600`);
    expect(after.items[1].images).toEqual([]);
  });

  it('solo acepta imágenes JPEG, PNG o WebP de tamaño razonable', async () => {
    const code = await received();
    for (const body of [
      { kind: 'front', contentType: 'application/pdf', byteSize: 1000 },
      { kind: 'front', contentType: 'image/gif', byteSize: 1000 },
      { kind: 'front', contentType: 'image/jpeg', byteSize: 0 },
      { kind: 'front', contentType: 'image/jpeg', byteSize: 31 * 1024 * 1024 },
      { kind: 'side', contentType: 'image/jpeg', byteSize: 1000 },
    ]) {
      expect((await reserve(code, 'staff@lab.test', body)).status, JSON.stringify(body)).toBe(422);
    }
    expect(await db.select().from(itemImages)).toHaveLength(0);
  });

  it('suben quienes reciben o gradúan; control de calidad solo mira; los clientes no entran', async () => {
    const code = await received();
    const body = { kind: 'back', contentType: 'image/png', byteSize: 1000 };
    for (const email of ['staff@lab.test', 'grader@lab.test', 'admin@lab.test']) {
      expect((await reserve(code, email, body)).status, email).toBe(201);
    }
    for (const email of ['qa@lab.test', 'cliente@example.com']) {
      expect((await reserve(code, email, body)).status, email).toBe(403);
    }
    expect((await api(`/admin/orders/${code}/images`, 'qa@lab.test')).status).toBe(200);
    expect((await api(`/admin/orders/${code}/images`, 'cliente@example.com')).status).toBe(403);
    expect((await api(`/admin/orders/${code}/images`)).status).toBe(401);
  });

  it('una foto no se confirma desde otra carta ni con un id inventado', async () => {
    const code = await received();
    const { image, upload } = await read(await reserve(code, 'staff@lab.test', { kind: 'front', contentType: 'image/jpeg', byteSize: 100 }, 1));
    t.storage.put(keyOf(upload));
    expect((await api(`/admin/orders/${code}/items/2/images/${image.id}/confirm`, 'staff@lab.test', { body: {} })).status).toBe(404);
    expect((await api(`/admin/orders/${code}/items/1/images/no-es-un-id/confirm`, 'staff@lab.test', { body: {} })).status).toBe(404);
    expect((await api(`/admin/orders/${code}/items/1/images/00000000-0000-0000-0000-000000000000/confirm`, 'staff@lab.test', { body: {} })).status).toBe(404);
    expect((await reserve(code, 'staff@lab.test', { kind: 'front', contentType: 'image/jpeg', byteSize: 100 }, 9)).status).toBe(404);
  });

  it('se puede borrar una foto: desaparece de la lista y del almacenamiento, y queda registrado', async () => {
    const code = await received();
    const id = await addPhoto(code, 'extra');
    const key = [...t.storage.files][0];
    expect((await api(`/admin/orders/${code}/items/1/images/${id}`, 'staff@lab.test', { method: 'DELETE' })).status).toBe(204);
    expect(await db.select().from(itemImages)).toHaveLength(0);
    expect(t.storage.removed).toEqual([key]);
    expect((await db.select().from(auditLogs)).map((a) => a.action)).toEqual(expect.arrayContaining(['image.uploaded', 'image.deleted']));
  });
});

describe('resultados para el cliente', () => {
  const scores = (n: number) => ({
    isAuthentic: true,
    centering: { score: n, frontRatio: '52/48 L/R', backRatio: '50/50 L/R', notes: 'Bien centrada' },
    corners: { score: n, frontScore: n, backScore: n },
    edges: { score: n },
    surface: { score: n },
    station: 'Mesa 3',
    defects: [{ side: 'front', category: 'corners', severity: 'minor', title: 'Esquina', x: 95, y: 4, deduction: 0.5 }],
    submit: true,
  });

  const results = (code: string, email?: string) => api(`/orders/${code}/results`, email);

  async function toShipped(code: string) {
    await db.execute(sql`update custody_events set occurred_at = occurred_at - interval '40 days'`);
    await db.execute(sql`update orders set auto_anchor_at = auto_anchor_at - interval '40 days' where auto_anchor_at is not null`);
    await advanceDueOrders(db);
    await api(`/admin/orders/${code}/shipments`, 'staff@lab.test', { body: { direction: 'outbound', carrier: 'GLS', trackingNumber: 'ES-1' } });
    for (const position of [1, 2]) {
      await api(`/admin/orders/${code}/items/${position}/grading`, 'grader@lab.test', { method: 'PUT', body: scores(position === 1 ? 9.5 : 8.5) });
      await api(`/admin/orders/${code}/items/${position}/grading/approve`, 'qa@lab.test', { body: {} });
    }
    expect((await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(200);
  }

  it('mientras el pedido está en el laboratorio no se ve ni la nota ni las fotos', async () => {
    const code = await received();
    await addPhoto(code, 'front');
    await api(`/admin/orders/${code}/items/1/grading`, 'grader@lab.test', { method: 'PUT', body: scores(9) });

    const res = await results(code, 'cliente@example.com');
    expect(res.status).toBe(200);
    const { results: view } = await read(res);
    expect(view).toMatchObject({ code, status: 'PACKAGE_RECEIVED', released: false });
    expect(view.items).toHaveLength(2);
    expect(view.items.every((i: any) => i.grading === null && i.images.length === 0)).toBe(true);
  });

  it('cuando sale del laboratorio, el cliente ve nota, subnotas, defectos y fotos, sin datos internos', async () => {
    const code = await received();
    await addPhoto(code, 'front', 1);
    await addPhoto(code, 'back', 1, 'grader@lab.test');
    await toShipped(code);

    const { results: view } = await read(await results(code, 'cliente@example.com'));
    expect(view).toMatchObject({ status: 'SHIPPED', released: true });
    const [first, second] = view.items;
    expect(first).toMatchObject({ position: 1, cardName: 'Charizard Holo', grading: { finalGrade: 9.5, gradeLabel: 'Mint+ 9.5', isAuthentic: true } });
    expect(first.grading.centering).toMatchObject({ score: 9.5, frontRatio: '52/48 L/R', notes: 'Bien centrada' });
    expect(first.grading.defects).toEqual([{ side: 'front', category: 'corners', severity: 'minor', title: 'Esquina', description: null, x: 95, y: 4 }]);
    expect(first.images.map((i: any) => i.kind).sort()).toEqual(['back', 'front']);
    expect(first.images[0].url).toMatch(/\?ttl=900$/);
    expect(second.grading).toMatchObject({ finalGrade: 8.5 });
    expect(second.images).toEqual([]);

    // Nada interno: ni quién graduó, ni la estación, ni las claves del almacenamiento.
    const text = JSON.stringify(view);
    expect(text).not.toContain('grader@lab.test');
    expect(text).not.toContain('qa@lab.test');
    expect(text).not.toContain('Mesa 3');
    expect(text).not.toContain('storage');
  });

  it('solo el dueño del pedido lo ve', async () => {
    const code = await received();
    await loginAs('otro@example.com');
    expect((await results(code, 'otro@example.com')).status).toBe(404);
    expect((await results(code, 'staff@lab.test')).status).toBe(404);
    expect((await results(code)).status).toBe(401);
    expect((await results('GGI-ORD-ZZZZZZ', 'cliente@example.com')).status).toBe(404);
  });

  it('las respuestas no se guardan en cachés', async () => {
    const code = await received();
    const res = await results(code, 'cliente@example.com');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });
});

describe('diagnóstico del almacenamiento', () => {
  it('solo un admin lo ve y nunca devuelve claves', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_muy_secreta';
    process.env.SUPABASE_URL = 'https://abc.supabase.co';
    try {
      for (const email of ['staff@lab.test', 'grader@lab.test', 'qa@lab.test']) {
        expect((await api('/admin/storage-check', email)).status, email).toBe(403);
      }
      expect((await api('/admin/storage-check')).status).toBe(401);

      const res = await api('/admin/storage-check', 'admin@lab.test');
      const body = await read(res);
      expect(res.status).toBe(200);
      expect(body).toMatchObject({ ok: true, env: { supabaseUrl: 'https://abc.supabase.co', secretKey: 'sb_secret_… (nueva)', bucket: 'lab-private' } });
      expect(body.steps.map((s: any) => s.step)).toHaveLength(3);
      expect(JSON.stringify(body)).not.toContain('muy_secreta');
    } finally {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_URL;
    }
  });
});
