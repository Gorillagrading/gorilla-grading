import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { certificates, gradingDefects, gradingResults, orderItems, slabs } from '../db/schema.js';
import { advanceDueOrders } from './domain/automation.js';
import { parseScanReport, ScanReportError } from './scanner/parse-report.js';
import { readPdf, type PdfContents } from './scanner/read-pdf.js';
import { verifySignature } from './signing.js';
import { createTestApp, createTestDb, identifyCards, insertAllTiers, insertUser, testSigner, type TestDb } from './testing.js';

/** Informe real del escáner (criterios 3.20): una carta de Pokémon, solo anverso, nota 5. */
const PDF = new Uint8Array(readFileSync(new URL('./scanner/fixtures/informe-199157603.pdf', import.meta.url)));

describe('lectura del informe del escáner', () => {
  let contents: PdfContents;
  beforeAll(async () => {
    contents = await readPdf(PDF);
  });

  it('lee el número de certificado, los criterios y las notas', () => {
    const { report } = parseScanReport(contents);
    expect(report).toMatchObject({
      certificateNumber: '199157603',
      criteria: '3.20',
      gradedAt: '02/11/2026 15:26',
      card: { name: null, game: 'Pokémon' },
      ppi: 1200,
      widthMm: 62.83,
      heightMm: 88,
      sides: 'front',
      final: 5,
      average: 7.25,
      subgrades: {
        centering: { score: 10, note: 'Solo anverso.' },
        corners: { score: 9 },
        edges: { score: 7, note: '4 defectos.' },
        surface: { score: 3, note: '8 defectos.' },
      },
    });
    expect(report.method).toMatch(/^Arriba, en el dibujo a escala.*no puede pasar de 2 puntos por encima de su peor parte\.$/);
  });

  it('lee el centrado y las cuatro esquinas del anverso', () => {
    const [front] = parseScanReport(contents).report.faces;
    expect(front.side).toBe('front');
    expect(front.cornersScore).toBe(9);
    expect(front.centering).toEqual({ leftMm: 2.47, rightMm: 2.48, topMm: 2.54, bottomMm: 2.47, horizontal: '50/50', vertical: '51/49', score: 10 });
    expect(front.corners).toEqual([
      { position: 'topLeft', radiusMm: 2.86, biteUm: 24, biteRemoved: false, measure: 10, condition: 10, score: 10 },
      { position: 'topRight', radiusMm: 3.08, biteUm: 52, biteRemoved: false, measure: 9, condition: 10, score: 9 },
      { position: 'bottomLeft', radiusMm: 2.85, biteUm: 18, biteRemoved: false, measure: 10, condition: 10, score: 10 },
      { position: 'bottomRight', radiusMm: 3.15, biteUm: 18, biteRemoved: false, measure: 8, condition: 10, score: 9 },
    ]);
  });

  it('lee los doce daños con su número, su tipo, su tamaño y su sitio en la carta', () => {
    const { damages } = parseScanReport(contents).report.faces[0];
    expect(damages.map((d) => d.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(damages[0]).toMatchObject({ area: 'edges', kind: 'Filo comido', size: 'medium', location: 'borde de arriba', lengthMm: 13.8 });
    expect(damages[1]).toMatchObject({ kind: 'Filo comido', size: 'large', lengthMm: 29.8 });
    expect(damages[3]).toMatchObject({ area: 'edges', kind: 'Manchón', size: 'small', location: 'borde derecho', lengthMm: null });
    expect(damages[4]).toMatchObject({ area: 'surface', kind: 'Desconchón de tinta', size: 'medium', location: null });
    expect(damages[11]).toMatchObject({ area: 'surface', kind: 'Punto o mota', size: 'small' });
    expect(damages.filter((d) => d.area === 'edges')).toHaveLength(4);
    // El 1 está arriba a la izquierda, el 8 abajo a la izquierda y el 3 en el borde derecho.
    expect(damages[0].x).toBeLessThan(10);
    expect(damages[0].y).toBeLessThan(10);
    expect(damages[7].y).toBeGreaterThan(90);
    expect(damages[2].x).toBeGreaterThan(90);
  });

  it('saca el escaneo y los cuatro recortes de las esquinas como JPEG', () => {
    const { images } = parseScanReport(contents);
    const isJpeg = (b?: Uint8Array) => !!b && b[0] === 0xff && b[1] === 0xd8;
    expect(isJpeg(images.scan.front)).toBe(true);
    expect(images.scan.back).toBeUndefined();
    expect(Object.keys(images.corners.front!)).toEqual(['topLeft', 'topRight', 'bottomLeft', 'bottomRight']);
    expect(Object.values(images.corners.front!).every(isJpeg)).toBe(true);
  });

  it('no adivina: si falta algo o no cuadra, dice qué', () => {
    // Sin la nota de superficie.
    const noSurface = { ...contents, text: contents.text.filter((i) => !(i.str === 'Superficie' && i.size >= 7.5)) };
    expect(() => parseScanReport(noSurface)).toThrow(ScanReportError);

    // Una nota final que no sale de las subnotas (un 8 con una superficie de 3).
    const wrongFinal = { ...contents, text: contents.text.map((i) => (i.str === '5' && i.size > 15 ? { ...i, str: '8' } : i)) };
    try {
      parseScanReport(wrongFinal);
      expect.unreachable();
    } catch (error) {
      expect((error as ScanReportError).problems).toContain('La nota final 8 no cuadra con las subnotas 10, 9, 7, 3.');
    }

    // Un informe provisional no se importa.
    const provisional = {
      ...contents,
      text: contents.text.map((i) => (i.str.startsWith('Certificado 199') ? { ...i, str: i.str.replace('Son definitivas.', 'Son provisionales.') } : i)),
    };
    expect(() => parseScanReport(provisional)).toThrow(/provisionales/);
  });
});

describe('importación del informe en una carta', () => {
  let db: TestDb;
  let t: ReturnType<typeof createTestApp>;
  const cookies = new Map<string, string>();
  const read = (res: Response) => res.json() as Promise<any>;

  beforeAll(async () => {
    db = await createTestDb();
  });

  beforeEach(async () => {
    await db.execute(
      sql`truncate users, orders, service_tiers, otp_challenges, sessions, rate_limit_events, consents, email_outbox, audit_logs, card_identities restart identity cascade`,
    );
    await insertAllTiers(db);
    cookies.clear();
    t = createTestApp(db);
    for (const [email, role] of [['staff@lab.test', 'staff'], ['grader@lab.test', 'grader'], ['qa@lab.test', 'qa'], ['cliente@example.com', 'customer']] as const) {
      await insertUser(db, email, role);
      await t.json('/api/v1/auth/otp', { email });
      const res = await t.json('/api/v1/auth/otp/verify', { email, code: t.sent.at(-1)!.code });
      cookies.set(email, res.headers.get('set-cookie')!.split(';')[0]);
    }
  });

  const api = (path: string, email?: string, init: { method?: string; body?: unknown } = {}) =>
    t.app.request(`/api/v1${path}`, {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers: { ...(email && { cookie: cookies.get(email)! }), ...(init.body ? { 'content-type': 'application/json' } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  const upload = (code: string, email: string, pdf: Uint8Array = PDF, position = 1) =>
    t.app.request(`/api/v1/admin/orders/${code}/items/${position}/scan-report`, {
      method: 'POST',
      headers: { cookie: cookies.get(email)!, 'content-type': 'application/pdf' },
      body: pdf,
    });
  const move = (code: string, email: string, to: string, expectedStatus: string) =>
    api(`/admin/orders/${code}/transitions`, email, { body: { to, expectedStatus } });

  async function receivedOrder(cards = 1) {
    const res = await api('/orders', 'cliente@example.com', {
      body: {
        items: Array.from({ length: cards }, () => ({ tier: 'standard' })),
        shippingMethod: 'COURIER_INSURED',
        fullName: 'Carla Cliente',
        shippingAddress: { line1: 'Calle Secreta 7', city: 'Madrid', postalCode: '28001', countryCode: 'ES' },
        locale: 'es',
        clientToken: `token-${Math.random().toString(36).slice(2)}-0000`,
        acceptedTerms: true,
      },
    });
    const code = (await read(res)).order.code as string;
    await identifyCards(db, code, Array.from({ length: cards }, (_, i) => ({ cardName: `Pikachu ${i + 1}`, game: 'Pokémon' })));
    await move(code, 'staff@lab.test', 'PACKAGE_RECEIVED', 'SUBMITTED');
    return code;
  }

  it('el técnico sube el PDF y queda pendiente de calidad con las notas, los daños y el número del informe', async () => {
    const code = await receivedOrder();
    const res = await upload(code, 'grader@lab.test');
    expect(res.status).toBe(200);
    const { grading } = await read(res);
    expect(grading).toMatchObject({
      status: 'pending_qa',
      rule: 'scanner',
      certificateNumber: '199157603',
      isAuthentic: true,
      finalGrade: 5,
      gradeLabel: null,
      centering: { score: 10, frontRatio: '50/50 L/R, 51/49 T/B' },
      corners: { score: 9, frontScore: 9 },
      edges: { score: 7 },
      surface: { score: 3 },
      scan: { criteria: '3.20', final: 5 },
    });
    expect(grading.scan.pdfSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(grading.defects).toHaveLength(12);
    expect(grading.defects[0]).toMatchObject({ side: 'front', category: 'edges', severity: 'moderate', title: 'Filo comido', description: 'borde de arriba · 13,8 mm' });

    // Se guardan el PDF, el escaneo y los cuatro recortes, y el informe guardado apunta a ellos.
    const files = [...t.storage.files];
    expect(files.filter((f) => f.endsWith('/informe.pdf'))).toHaveLength(1);
    expect(files.filter((f) => f.endsWith('.jpg'))).toHaveLength(5);
    const [row] = await db.select().from(gradingResults);
    expect((row.scanReport as any).images.corners.front.topLeft).toMatch(/front-esquina-topLeft\.jpg$/);
  });

  it('solo gradúan grader y admin; un archivo que no es PDF o un informe que no cuadra no guardan nada', async () => {
    const code = await receivedOrder();
    expect((await upload(code, 'staff@lab.test')).status).toBe(403);
    const notPdf = await upload(code, 'grader@lab.test', new TextEncoder().encode('hola'));
    expect(notPdf.status).toBe(422);
    expect(await read(notPdf)).toMatchObject({ code: 'scan_report_unreadable' });
    // Un PDF roto por dentro.
    const broken = await upload(code, 'grader@lab.test', new TextEncoder().encode('%PDF-1.7 roto'));
    expect(broken.status).toBe(422);
    expect(await db.select().from(gradingResults)).toHaveLength(0);
    expect(t.storage.files.size).toBe(0);
  });

  it('el mismo informe no se puede importar en dos cartas', async () => {
    const code = await receivedOrder(2);
    expect((await upload(code, 'grader@lab.test', PDF, 1)).status).toBe(200);
    const again = await upload(code, 'grader@lab.test', PDF, 2);
    expect(again.status).toBe(409);
    expect(await read(again)).toMatchObject({ code: 'certificate_number_taken' });
    // En la misma carta sí: sustituye al anterior (sigue pendiente) y borra sus archivos.
    expect((await upload(code, 'grader@lab.test', PDF, 1)).status).toBe(200);
    expect(await db.select().from(gradingResults)).toHaveLength(1);
    expect(await db.select().from(gradingDefects)).toHaveLength(12);
    expect(t.storage.removed.filter((f) => f.endsWith('/informe.pdf'))).toHaveLength(1);
  });

  it('si la carta no estaba identificada y el PDF no trae su nombre, pide identificarla', async () => {
    const code = await receivedOrder();
    await db.update(orderItems).set({ cardName: null, game: null });
    const res = await upload(code, 'grader@lab.test');
    expect(res.status).toBe(409);
    expect(await read(res)).toMatchObject({ code: 'card_unidentified' });
  });

  it('al aprobar la salida, el certificado lleva el número del informe y el cliente ve el informe completo', async () => {
    const code = await receivedOrder();
    await upload(code, 'grader@lab.test');
    // Foto de la carta ya en su slab, que sube el laboratorio.
    const photo = await (await api(`/admin/orders/${code}/items/1/images`, 'staff@lab.test', { body: { kind: 'front', contentType: 'image/jpeg', byteSize: 1000 } })).json() as any;
    t.storage.put(photo.upload.url.replace('memory://upload/', ''));
    await api(`/admin/orders/${code}/items/1/images/${photo.image.id}/confirm`, 'staff@lab.test', { body: {} });
    expect((await api(`/admin/orders/${code}/items/1/grading/approve`, 'qa@lab.test', { body: {} })).status).toBe(200);
    await db.execute(sql`update custody_events set occurred_at = occurred_at - interval '40 days'`);
    await db.execute(sql`update orders set auto_anchor_at = auto_anchor_at - interval '40 days' where auto_anchor_at is not null`);
    await advanceDueOrders(db);
    await api(`/admin/orders/${code}/shipments`, 'staff@lab.test', { body: { direction: 'outbound', carrier: 'GLS', trackingNumber: 'ES-1' } });
    expect((await move(code, 'qa@lab.test', 'SHIPPED', 'QUALITY_ASSURANCE')).status).toBe(200);

    const [cert] = await db.select().from(certificates);
    expect(cert.number).toBe('199157603');
    expect((await db.select().from(slabs))[0].serial).toBe('199157603');
    const { images, ...record } = cert.payload as Record<string, any>;
    expect(record).toMatchObject({ number: '199157603', grade: { final: 5, subgrades: { centering: 10, corners: 9, edges: 7, surface: 3 } }, scanner: { criteria: '3.20' } });
    expect(record.grade.label).toBeUndefined();
    expect(record.scanner.pdfSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(images.frontKey).toMatch(/front-escaneo\.jpg$/);
    expect(verifySignature(testSigner.publicKey, record, cert.signature!)).toBe(true);

    // El verificador acepta el número con espacios, como sale en el informe.
    const res = await api('/certificates/199%20157%20603');
    expect(res.status).toBe(200);
    const { certificate } = await read(res);
    expect(certificate).toMatchObject({ certNumber: '199157603', grade: 5, subgrades: { surface: { score: 3 } } });
    expect(certificate.frontImage).toMatch(/front-escaneo\.jpg/);
    expect(certificate.defects).toHaveLength(12);
    expect(certificate.defects[0]).toMatchObject({ n: 1, title: 'Filo comido', category: 'Edges', side: 'front' });
    expect(certificate.scan).toMatchObject({ certificateNumber: '199157603', criteria: '3.20', final: 5, faces: [{ side: 'front', corners: { length: 4 } }] });
    expect(certificate.scan.images.corners.front.bottomRight).toMatch(/front-esquina-bottomRight\.jpg/);
    // La foto del slab va aparte del escaneo, que sigue siendo la imagen con los daños.
    expect(certificate.slabImages.front).toMatch(/items\/.+\/front-.+\.jpg/);
    expect(certificate.slabImages.front).not.toMatch(/escaneo/);
    expect(certificate.slabImages.back).toBe('');
    // Nada privado: ni la ruta del PDF ni su huella.
    expect(JSON.stringify(certificate.scan)).not.toMatch(/informe\.pdf|sha256/);
  });
});
