import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { auditLogs, certificates, orders, slabs } from '../db/schema.js';
import { advanceDueOrders } from './domain/automation.js';
import { ProblemError } from './problem.js';
import { canonicalJson, createSigner, generateSigningKey, verifySignature } from './signing.js';
import { createTestApp, createTestDb, insertAllTiers, insertUser, testSigner, type TestDb } from './testing.js';

const read = (res: Response) => res.json() as Promise<any>;

let db: TestDb;
let t: ReturnType<typeof createTestApp>;
const cookies = new Map<string, string>();

beforeAll(async () => {
  db = await createTestDb();
});

async function setup(overrides: Parameters<typeof createTestApp>[1] = {}) {
  await db.execute(
    sql`truncate users, orders, service_tiers, otp_challenges, sessions, rate_limit_events, consents, email_outbox, audit_logs, card_identities restart identity cascade`,
  );
  await insertAllTiers(db);
  cookies.clear();
  t = createTestApp(db, overrides);
  for (const [email, role] of [
    ['staff@lab.test', 'staff'], ['grader@lab.test', 'grader'], ['qa@lab.test', 'qa'], ['admin@lab.test', 'admin'],
  ] as const) {
    await insertUser(db, email, role);
    await loginAs(email);
  }
}

beforeEach(() => setup());

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
        { tier: 'standard', cardName: 'Falsa Pikachu', game: 'Pokemon', setName: 'Base Set', declaredValueCents: 2_000 },
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

const grade = (code: string, position: number, body: unknown) =>
  api(`/admin/orders/${code}/items/${position}/grading`, 'grader@lab.test', { method: 'PUT', body });
const approve = (code: string, position: number) =>
  api(`/admin/orders/${code}/items/${position}/grading/approve`, 'qa@lab.test', { body: {} });

/** Pedido con dos cartas (la segunda no es auténtica), listo para la aprobación final. */
async function readyToShip() {
  const code = await placeOrder();
  await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
  // Fotos de la primera carta.
  for (const kind of ['front', 'back'] as const) {
    const { image, upload } = await read(
      await api(`/admin/orders/${code}/items/1/images`, 'staff@lab.test', { body: { kind, contentType: 'image/jpeg', byteSize: 1000 } }),
    );
    t.storage.put(upload.url.replace('memory://upload/', ''));
    await api(`/admin/orders/${code}/items/1/images/${image.id}/confirm`, 'staff@lab.test', { body: {} });
  }
  await db.execute(sql`update custody_events set occurred_at = occurred_at - interval '40 days'`);
  await db.execute(sql`update orders set auto_anchor_at = auto_anchor_at - interval '40 days' where auto_anchor_at is not null`);
  await advanceDueOrders(db);
  await api(`/admin/orders/${code}/shipments`, 'staff@lab.test', { body: { direction: 'outbound', carrier: 'GLS', trackingNumber: 'ES-1' } });

  await grade(code, 1, {
    isAuthentic: true,
    centering: { score: 9.5, frontRatio: '50/50 L/R', backRatio: '51/49 L/R', notes: 'Muy bien centrada' },
    corners: { score: 9 }, edges: { score: 9.5 }, surface: { score: 9.5 },
    defects: [{ side: 'back', category: 'surface', severity: 'minor', title: 'Arañazo en el reverso', x: 30, y: 70 }],
    submit: true,
  });
  await grade(code, 2, { isAuthentic: false, submit: true });
  await approve(code, 1);
  await approve(code, 2);
  return code;
}

describe('emisión de certificados', () => {
  it('al aprobar la salida se emite un certificado firmado por cada carta auténtica', async () => {
    const code = await readyToShip();
    expect((await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(200);

    const certs = await db.select().from(certificates);
    expect(certs).toHaveLength(1);
    const [cert] = certs;
    expect(cert.number).toMatch(/^GGI-\d{6}$/);
    expect(cert).toMatchObject({ status: 'active', keyId: 'test-key-1' });

    const [slab] = await db.select().from(slabs);
    expect(slab.serial).toBe(`GGI-SLB-${cert.number.slice(4)}`);
    expect(slab.qrPayload).toBe(`https://gorilla-grading.vercel.app/certificates/${cert.number}?via=qr`);

    const { images, ...record } = cert.payload as Record<string, any>;
    expect(record).toMatchObject({
      v: 1, number: cert.number, slab: slab.serial,
      card: { name: 'Charizard Holo', set: 'Base Set', game: 'Pokemon' },
      grade: { final: 9.5, label: 'Mint+ 9.5', subgrades: { centering: 9.5, corners: 9, edges: 9.5, surface: 9.5 } },
    });
    expect(images.frontKey).toMatch(/^items\/.+\/front-/);
    expect(verifySignature(testSigner.publicKey, record, cert.signature!)).toBe(true);
    expect((await db.select().from(auditLogs)).map((a) => a.action)).toContain('certificate.issued');
  });

  it('una carta que no es auténtica no recibe certificado ni slab', async () => {
    const code = await readyToShip();
    await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE');
    expect(await db.select().from(slabs)).toHaveLength(1);
  });

  it('si no hay clave de firma el pedido no sale y no queda nada a medias', async () => {
    await setup({
      getSigner: () => {
        throw new ProblemError(503, 'Service Unavailable', 'sin clave', { code: 'signing_unavailable' });
      },
    });
    const code = await readyToShip();
    const res = await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE');
    expect(res.status).toBe(503);
    expect(await read(res)).toMatchObject({ code: 'signing_unavailable' });
    expect((await db.select().from(orders))[0].status).toBe('QUALITY_ASSURANCE');
    expect(await db.select().from(certificates)).toHaveLength(0);
    expect(await db.select().from(slabs)).toHaveLength(0);
  });

  it('un pedido se puede aprobar otra vez tras configurar la clave', async () => {
    const broken = createTestApp(db, { getSigner: () => { throw new ProblemError(503, 'x', 'x', { code: 'signing_unavailable' }); } });
    const code = await readyToShip();
    const attempt = await broken.app.request(`/api/v1/admin/orders/${code}/transitions`, {
      method: 'POST',
      headers: { cookie: cookies.get('qa@lab.test')!, 'content-type': 'application/json' },
      body: JSON.stringify({ to: 'SHIPPED', expectedStatus: 'QUALITY_ASSURANCE' }),
    });
    expect(attempt.status).toBe(503);
    expect((await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(200);
    expect(await db.select().from(certificates)).toHaveLength(1);
  });
});

describe('verificación pública de un certificado firmado', () => {
  it('devuelve el registro firmado y la firma se comprueba con la clave pública publicada', async () => {
    const code = await readyToShip();
    await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE');
    const [cert] = await db.select().from(certificates);

    const res = await api(`/certificates/${cert.number}`);
    expect(res.status).toBe(200);
    const { certificate } = await read(res);
    expect(certificate).toMatchObject({ certNumber: cert.number, grade: 9.5, keyId: 'test-key-1', status: 'active' });
    expect(certificate.frontImage).toMatch(/^memory:\/\/download\/items\/.+\/front-.+\?ttl=900$/);
    expect(certificate.backImage).toContain('/back-');
    // El cliente no indicó número, idioma ni año: no se envían valores de relleno.
    expect(certificate.defects).toEqual([expect.objectContaining({ side: 'back', category: 'Surface', title: 'Arañazo en el reverso', x: 30, y: 70 })]);
    expect(certificate).toMatchObject({ set: 'Base Set', cardNumber: '', language: '', year: 0, verifier: 'Gorilla Grading' });

    const keys = await read(await api('/certificates/keys'));
    expect(keys.keys[0]).toMatchObject({ keyId: 'test-key-1', algorithm: 'Ed25519', publicKey: testSigner.publicKey });
    expect(verifySignature(keys.keys[0].publicKey, certificate.signedRecord, certificate.signature)).toBe(true);

    // Cambiar cualquier dato del registro invalida la firma.
    const forged = { ...certificate.signedRecord, grade: { ...certificate.signedRecord.grade, final: 10 } };
    expect(verifySignature(keys.keys[0].publicKey, forged, certificate.signature)).toBe(false);
  });

  it('no filtra rutas privadas, el dueño ni el valor declarado', async () => {
    const code = await readyToShip();
    await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE');
    const [cert] = await db.select().from(certificates);
    const text = JSON.stringify(await read(await api(`/certificates/${cert.number}`)));
    for (const secret of ['frontKey', 'backKey', 'cliente@example.com', 'declaredValue', code]) {
      expect(text, secret).not.toContain(secret);
    }
  });

  it('también se encuentra por el serial del slab', async () => {
    const code = await readyToShip();
    await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE');
    const [slab] = await db.select().from(slabs);
    expect((await api(`/certificates/${slab.serial}`)).status).toBe(200);
  });

  it('el cliente ve la carta certificada en su bóveda, y nadie más', async () => {
    const code = await readyToShip();
    await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE');
    const mine = await read(await api('/me/cards', 'cliente@example.com'));
    expect(mine.cards).toHaveLength(1);
    expect(mine.cards[0]).toMatchObject({ name: 'Charizard Holo', grade: 9.5, declaredValueEur: 450 });
    await loginAs('otro@example.com');
    expect((await read(await api('/me/cards', 'otro@example.com'))).cards).toEqual([]);
  });
});

describe('firma', () => {
  it('el JSON canónico no depende del orden de las claves', () => {
    expect(canonicalJson({ b: 1, a: { d: [2, { y: 1, x: 2 }], c: null } })).toBe('{"a":{"c":null,"d":[2,{"x":2,"y":1}]},"b":1}');
    expect(canonicalJson({ a: 1, b: undefined })).toBe('{"a":1}');
  });

  it('una firma solo es válida con su clave y su registro', () => {
    const one = createSigner(generateSigningKey().privateKey, 'a');
    const other = createSigner(generateSigningKey().privateKey, 'b');
    const record = { n: 'GGI-123456', g: 9.5 };
    const signature = one.sign({ g: 9.5, n: 'GGI-123456' });
    expect(verifySignature(one.publicKey, record, signature)).toBe(true);
    expect(verifySignature(other.publicKey, record, signature)).toBe(false);
    expect(verifySignature(one.publicKey, { ...record, g: 10 }, signature)).toBe(false);
    expect(verifySignature('no-es-una-clave', record, signature)).toBe(false);
  });

  it('sin variables de entorno no hay firmador', async () => {
    const { loadSigner } = await import('./signing.js');
    const saved = { key: process.env.CERT_SIGNING_KEY, id: process.env.CERT_KEY_ID };
    delete process.env.CERT_SIGNING_KEY;
    delete process.env.CERT_KEY_ID;
    try {
      expect(() => loadSigner()).toThrowError(expect.objectContaining({ code: 'signing_unavailable' }));
      process.env.CERT_SIGNING_KEY = 'basura';
      process.env.CERT_KEY_ID = 'x';
      expect(() => loadSigner()).toThrowError(expect.objectContaining({ code: 'signing_unavailable' }));
    } finally {
      if (saved.key) process.env.CERT_SIGNING_KEY = saved.key; else delete process.env.CERT_SIGNING_KEY;
      if (saved.id) process.env.CERT_KEY_ID = saved.id; else delete process.env.CERT_KEY_ID;
    }
  });
});

describe('email de salida', () => {
  it('al aprobar la salida, el correo del cliente lleva su certificado, la nota y el seguimiento', async () => {
    const code = await readyToShip();
    await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE');
    const [cert] = await db.select().from(certificates);
    const mail = t.mails.find((m) => m.subject.includes(code) && m.text.includes(cert.number));
    expect(mail, 'correo de salida').toBeDefined();
    expect(mail!.to).toBe('cliente@example.com');
    expect(mail!.text).toContain(`/certificates/${cert.number}`);
    expect(mail!.text).toContain('Mint+ 9.5');
    expect(mail!.text).toContain('ES-1');
    expect(mail!.text).toContain('Falsa Pikachu');
    expect(mail!.html).toContain(cert.number);
  });
});

describe('contador público de cartas certificadas', () => {
  it('cuenta los certificados vigentes: sube al emitir y no suma los revocados', async () => {
    const certified = async () => (await read(await api('/stats/certificates'))).certified;
    expect(await certified()).toBe(0);

    const code = await readyToShip();
    await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE');
    // Dos cartas en el pedido, una no auténtica: solo una recibe certificado.
    expect(await certified()).toBe(1);

    await db.update(certificates).set({ status: 'revoked', revokedAt: new Date(), revokedReason: 'prueba' });
    expect(await certified()).toBe(0);
  });

  it('se puede guardar en caché unos minutos', async () => {
    const res = await api('/stats/certificates');
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
  });
});
