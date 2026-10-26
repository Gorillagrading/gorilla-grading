import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { certificateChecks, certificates } from '../db/schema.js';
import { parseCertificateQuery } from './domain/certificates.js';
import { createTestApp, createTestDb, insertGradedOrder, insertTier, insertUser, type TestDb } from './testing.js';

const read = (res: Response) => res.json() as Promise<any>;

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

const verify = (query: string, opts: { via?: string; ip?: string } = {}) =>
  t.app.request(`/api/v1/certificates/${encodeURIComponent(query)}${opts.via ? `?via=${opts.via}` : ''}`, {
    headers: { 'user-agent': 'vitest', ...(opts.ip && { 'x-forwarded-for': opts.ip }) },
  });

/** Un dueño con una carta certificada. El dueño tiene datos privados que nunca deben salir. */
async function setup(over: { certNumber?: string; certStatus?: 'active' | 'revoked'; grade?: number } = {}) {
  const owner = await insertUser(db, 'dueno.privado@example.com');
  const grader = await insertUser(db, 'grader@example.com', 'grader');
  const qa = await insertUser(db, 'qa@example.com', 'qa');
  const tier = await insertTier(db);
  const graded = await insertGradedOrder(db, {
    ownerId: owner.id, tierId: tier.id, graderId: grader.id, qaId: qa.id,
    grade: over.grade ?? 9.5,
    orderCode: '284728482', certNumber: over.certNumber ?? '89240100', cardName: 'Charizard',
    declaredValueCents: 4_567_800, certStatus: over.certStatus,
  });
  return { owner, grader, qa, tier, ...graded };
}

describe('parseCertificateQuery', () => {
  it.each([
    '89240100',
    '  89240100 ',
    '8924 0100',
    '8924-0100',
    // Formato antiguo, con prefijo: se sigue entendiendo.
    'GGI-89240100',
    'ggi 89240100',
    'GGI-SLB-89240100',
    'GGISLB89240100',
  ])('entiende "%s"', (input) => {
    expect(parseCertificateQuery(input)).toBe('89240100');
  });

  it.each(['', 'hola', 'GG-89240100', '8924010', '892401000', 'GGI-892401', '892401', 'GGI-ABCDEFGH', "89240100'; --", '284728482'])(
    'descarta "%s"',
    (input) => {
      expect(parseCertificateQuery(input)).toBeNull();
    },
  );
});

describe('GET /certificates/:number', () => {
  it('un número que no existe devuelve 404, sin necesidad de sesión', async () => {
    const res = await verify('12345600');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    expect(await read(res)).toMatchObject({ code: 'certificate_not_found' });
  });

  it('un texto que no es un número de certificado también devuelve 404', async () => {
    for (const q of ['demo', 'Cade Cunningham', 'GG-89240100', "x'; drop table certificates; --"]) {
      expect((await verify(q)).status).toBe(404);
    }
    expect((await db.select().from(certificates)).length).toBe(0);
  });

  it('devuelve el certificado con su informe', async () => {
    await setup();
    const res = await verify('89240100');
    expect(res.status).toBe(200);
    const { certificate } = await read(res);
    expect(certificate).toMatchObject({
      certNumber: '89240100',
      name: 'Charizard',
      grade: 9.5,
      status: 'active',
      revokedAt: null,
      signature: null,
      subgrades: { centering: { score: 9.5 }, edges: { score: 10 } },
      population: { totalGraded: 1, higherCount: 0, equalCount: 1 },
      isAuthentic: true,
    });
    expect(certificate.defects).toHaveLength(1);
  });

  it('se puede consultar por el número sin prefijo o por el serial del slab', async () => {
    await setup();
    for (const q of ['89240100', 'ggi-89240100', '89240100']) {
      const res = await verify(q);
      expect(res.status, q).toBe(200);
      expect((await read(res)).certificate.certNumber).toBe('89240100');
    }
  });

  it('nunca expone el valor declarado, el dueño ni el pedido', async () => {
    const { owner } = await setup();
    const text = await (await verify('89240100')).text();
    for (const secret of ['declared', '4567800', '45678', 'dueno.privado', owner.id, '284728482', 'userId', 'orderId']) {
      expect(text, secret).not.toContain(secret);
    }
  });

  it('un certificado revocado sigue siendo consultable y dice que está revocado', async () => {
    await setup({ certStatus: 'revoked' });
    const res = await verify('89240100');
    expect(res.status).toBe(200);
    const { certificate } = await read(res);
    expect(certificate.status).toBe('revoked');
    expect(certificate.revokedAt).not.toBeNull();
    // El motivo interno de la revocación no se publica.
    expect(JSON.stringify(certificate)).not.toContain('prueba');
  });

  it('un certificado sustituido indica cuál lo sustituye', async () => {
    const { owner, grader, qa, tier } = await setup();
    await insertGradedOrder(db, {
      ownerId: owner.id, tierId: tier.id, graderId: grader.id, qaId: qa.id, grade: 10,
      orderCode: '284729495', certNumber: '89240200', cardName: 'Charizard (reemision)',
    });
    const [old, replacement] = await db.select().from(certificates).orderBy(certificates.number);
    await db.update(certificates).set({ status: 'superseded', supersededById: replacement.id }).where(eq(certificates.id, old.id));
    const { certificate } = await read(await verify(old.number));
    expect(certificate.status).toBe('superseded');
    expect(certificate.supersededBy).toBe(replacement.number);
  });

  it('no se guarda en cachés compartidas', async () => {
    await setup();
    expect((await verify('89240100')).headers.get('cache-control')).toBe('no-store');
  });
});

describe('registro de verificaciones', () => {
  it('guarda cada consulta con su canal y la IP con hash', async () => {
    await setup();
    await verify('89240100', { ip: '203.0.113.5' });
    await verify('89240100', { via: 'qr', ip: '203.0.113.5' });
    await verify('89240100', { via: 'nfc' });
    await verify('89240100', { via: 'inventado' });

    const rows = await db.select().from(certificateChecks).orderBy(certificateChecks.checkedAt);
    expect(rows.map((r) => r.channel)).toEqual(['web', 'qr', 'nfc', 'web']);
    expect(rows[0].certificateId).not.toBeNull();
    expect(rows[0].ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(rows)).not.toContain('203.0.113.5');
    expect(rows[2].ipHash).toBeNull();
  });

  it('también guarda las consultas de números que no existen, para detectar intentos de adivinar', async () => {
    await verify('65432100');
    const [row] = await db.select().from(certificateChecks);
    expect(row).toMatchObject({ certificateNumber: '65432100', certificateId: null });
  });

  it('no guarda texto libre del visitante', async () => {
    await verify('hola mundo');
    await verify("x'; drop table certificates; --");
    expect(await db.select().from(certificateChecks)).toHaveLength(0);
  });
});

describe('límite de consultas', () => {
  it('permite 120 consultas por IP y bloquea la siguiente', async () => {
    for (let i = 0; i < 120; i++) expect((await verify('65432100', { ip: '203.0.113.9' })).status).toBe(404);
    const blocked = await verify('65432100', { ip: '203.0.113.9' });
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(await read(blocked)).toMatchObject({ code: 'too_many_requests' });
  });

  it('otra IP no se ve afectada', async () => {
    for (let i = 0; i < 120; i++) await verify('65432100', { ip: '203.0.113.9' });
    expect((await verify('65432100', { ip: '203.0.113.10' })).status).toBe(404);
  });
});
