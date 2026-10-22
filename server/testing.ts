/**
 * Ayudas para las pruebas de integración: un PostgreSQL real en memoria (PGlite)
 * con las mismas migraciones que Supabase.
 */
import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../db/schema.js';
import { GRADE_LABELS } from '../shared/grading.js';
import { createApp } from './app.js';
import { slabSerialFor } from './codes.js';
import type { Deps } from './context.js';
import type { Mail } from './email/transport.js';
import type { CheckoutRequest, PaymentGateway } from './payments/gateway.js';
import { ProblemError } from './problem.js';
import { createSigner, generateSigningKey } from './signing.js';
import type { ObjectStorage } from './storage.js';

/** Clave de firma de pruebas, distinta en cada ejecución. */
export const testSigner = createSigner(generateSigningKey().privateKey, 'test-key-1');

process.env.AUTH_SECRET ??= 'test-secret-test-secret-test-secret-123456';

export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './db/migrations' });
  return db;
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

export const insertUser = async (db: TestDb, email: string, role: 'customer' | 'staff' | 'grader' | 'qa' | 'admin' = 'customer') => {
  const [user] = await db.insert(schema.users).values({ email, role, emailVerifiedAt: new Date() }).returning();
  return user;
};

export const insertTier = async (db: TestDb) => {
  const [tier] = await db
    .insert(schema.serviceTiers)
    .values({
      code: 'premium',
      name: 'Premium',
      priceCents: 2500,
      turnaroundBusinessDays: 5,
      maxDeclaredValueCents: 150000,
      subgradesIncluded: true,
      highResScans: true,
      priorityQueue: false,
    })
    .returning();
  return tier;
};

/** Los cuatro servicios con los precios y límites de la web. */
export const insertAllTiers = async (db: TestDb) => {
  const rows = await db
    .insert(schema.serviceTiers)
    .values([
      { code: 'standard', name: 'Standard', priceCents: 1900, turnaroundBusinessDays: 10, maxDeclaredValueCents: 50_000, subgradesIncluded: false, highResScans: true, priorityQueue: false },
      { code: 'premium', name: 'Premium', priceCents: 2500, turnaroundBusinessDays: 5, maxDeclaredValueCents: 150_000, subgradesIncluded: true, highResScans: true, priorityQueue: false },
      { code: 'express', name: 'Express', priceCents: 5000, turnaroundBusinessDays: 2, maxDeclaredValueCents: 300_000, subgradesIncluded: true, highResScans: true, priorityQueue: true },
      { code: 'event', name: 'Event', priceCents: 1500, turnaroundBusinessDays: 2, maxDeclaredValueCents: 100_000, subgradesIncluded: false, highResScans: true, priorityQueue: true, eventOnly: true },
    ])
    .returning();
  return new Map(rows.map((t) => [t.code, t]));
};

/** Crea un pedido con una carta ya graduada y certificada (certificado activo). */
export async function insertGradedOrder(
  db: TestDb,
  o: {
    ownerId: string;
    tierId: string;
    graderId: string;
    qaId: string;
    orderCode: string;
    certNumber: string;
    cardName: string;
    grade: number;
    identityId?: string;
    declaredValueCents?: number;
    certStatus?: 'active' | 'revoked';
  },
) {
  const [order] = await db
    .insert(schema.orders)
    .values({ code: o.orderCode, userId: o.ownerId, status: 'DELIVERED', submittedAt: new Date('2026-09-01') })
    .returning();

  let identityId = o.identityId;
  if (!identityId) {
    const [identity] = await db
      .insert(schema.cardIdentities)
      .values({ game: 'Pokemon', setName: 'Base Set', cardNumber: '4/102', name: o.cardName, language: 'English', year: 1999 })
      .returning();
    identityId = identity.id;
  }

  const [item] = await db
    .insert(schema.orderItems)
    .values({
      orderId: order.id,
      position: 1,
      cardIdentityId: identityId,
      cardName: o.cardName,
      game: 'Pokemon',
      declaredValueCents: o.declaredValueCents ?? 45000,
      serviceTierId: o.tierId,
      unitPriceCents: 2500,
      maxDeclaredValueCents: 150000,
    })
    .returning();

  const [result] = await db
    .insert(schema.gradingResults)
    .values({
      orderItemId: item.id,
      status: 'approved',
      isAuthentic: true,
      finalGrade: o.grade,
      gradeLabel: GRADE_LABELS[o.grade]![0],
      // Subnotas coherentes con la nota final (la base de datos las comprueba).
      centeringScore: o.grade === 9.5 ? 9.5 : o.grade,
      cornersScore: o.grade === 9.5 ? 9.5 : o.grade,
      edgesScore: o.grade === 9.5 ? 10 : o.grade,
      surfaceScore: o.grade === 9.5 ? 9.5 : o.grade,
      gradedBy: o.graderId,
      qaApprovedBy: o.qaId,
      qaApprovedAt: new Date(),
    })
    .returning();

  await db.insert(schema.gradingDefects).values({
    gradingResultId: result.id,
    side: 'front',
    category: 'surface',
    severity: 'minor',
    title: 'Micro raya',
    x: 62,
    y: 42,
    deduction: 0.2,
  });

  const [slab] = await db
    .insert(schema.slabs)
    .values({ orderItemId: item.id, gradingResultId: result.id, serial: slabSerialFor(o.certNumber) })
    .returning();

  await db.insert(schema.certificates).values({
    number: o.certNumber,
    slabId: slab.id,
    gradingResultId: result.id,
    cardIdentityId: identityId,
    status: o.certStatus ?? 'active',
    ...(o.certStatus === 'revoked' && { revokedAt: new Date(), revokedReason: 'prueba' }),
    payload: { images: { front: '/images/cards/front.jpg', back: '/images/cards/back.jpg' } },
  });

  return { orderId: order.id, identityId };
}

/** App conectada a una base de prueba. Los códigos de acceso "enviados" quedan en `sent`. */
export function createTestApp(db: TestDb, overrides: Partial<Deps> = {}) {
  const sent: { to: string; code: string; locale: string }[] = [];
  const mails: Mail[] = [];
  const storage = createFakeStorage();
  const deps: Deps = {
    getDb: () => db,
    sendLoginCode: async (to, code, locale) => {
      sent.push({ to, code, locale });
    },
    sendMail: async (mail) => {
      mails.push(mail);
    },
    storage,
    getSigner: () => testSigner,
    payments: null,
    ...overrides,
  };
  const app = createApp(deps);
  const json = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    app.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  return { app, sent, mails, storage, json };
}

/** Deja todas las cartas de un pedido con el resultado de graduación aprobado (9 en todo), como si el laboratorio ya hubiera terminado. */
export async function approveAllGrading(db: TestDb, orderCode: string) {
  const people = await db
    .insert(schema.users)
    .values([
      { email: 'grader.helper@lab.test', role: 'grader' as const, emailVerifiedAt: new Date() },
      { email: 'qa.helper@lab.test', role: 'qa' as const, emailVerifiedAt: new Date() },
    ])
    .onConflictDoNothing()
    .returning();
  const [grader, qa] = people.length
    ? people
    : await Promise.all(['grader.helper@lab.test', 'qa.helper@lab.test'].map(async (email) => (await db.select().from(schema.users).where(sql`${schema.users.email} = ${email}`))[0]));
  const items = await db
    .select({ id: schema.orderItems.id })
    .from(schema.orderItems)
    .innerJoin(schema.orders, sql`${schema.orders.id} = ${schema.orderItems.orderId}`)
    .where(sql`${schema.orders.code} = ${orderCode}`);
  for (const item of items) {
    await db.insert(schema.gradingResults).values({
      orderItemId: item.id,
      status: 'approved',
      isAuthentic: true,
      finalGrade: 9,
      gradeLabel: 'Mint 9',
      centeringScore: 9,
      cornersScore: 9,
      edgesScore: 9,
      surfaceScore: 9,
      gradedBy: grader.id,
      qaApprovedBy: qa.id,
      qaApprovedAt: new Date(),
    });
  }
}

/** Almacenamiento en memoria para las pruebas: "subir" un archivo es llamar a `put`. */
export function createFakeStorage(): ObjectStorage & { put: (key: string) => void; files: Set<string>; removed: string[] } {
  const files = new Set<string>();
  const removed: string[] = [];
  return {
    files,
    removed,
    put: (key) => void files.add(key),
    createUpload: async (key) => ({ method: 'PUT', url: `memory://upload/${key}`, headers: {}, body: 'multipart' }),
    exists: async (key) => files.has(key),
    createDownloadUrl: async (key, ttl) => `memory://download/${key}?ttl=${ttl}`,
    remove: async (key) => {
      files.delete(key);
      removed.push(key);
    },
  };
}

/** Pasarela de pago simulada: guarda las páginas de pago creadas y acepta avisos con la firma "firma-valida". */
export function createFakePayments() {
  const sessions: (CheckoutRequest & { id: string })[] = [];
  const state = { fail: false };
  const gateway: PaymentGateway = {
    createCheckout: async (request) => {
      if (state.fail) throw new Error('Stripe no responde');
      const id = `cs_test_${sessions.length + 1}`;
      sessions.push({ id, ...request });
      return { id, url: `https://checkout.stripe.test/${id}` };
    },
    parseWebhook: (raw, signature) => {
      if (signature !== 'firma-valida') {
        throw new ProblemError(400, 'Bad Request', 'La firma del aviso no es válida.', { code: 'invalid_signature' });
      }
      return JSON.parse(raw);
    },
  };
  return { gateway, sessions, state };
}
