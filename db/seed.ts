/**
 * Carga los datos simulados de src/data/ en una base de datos de desarrollo.
 * Uso: npm run db:seed
 *
 * Los mocks tienen incoherencias conocidas (PLAN_BACKEND.pdf, hallazgos 4 y 5):
 * notas que no cuadran con su etiqueta, un total de pedido que no cuadra y una
 * carta que supera el límite declarado de su servicio. Se cargan tal cual porque
 * sirven como casos de prueba para las reglas de negocio de fases posteriores.
 */
import { existsSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { MOCK_GRADED_CARDS } from '../src/data/mockCards';
import { MOCK_ORDERS } from '../src/data/mockOrders';
import { MOCK_SERVICES } from '../src/data/mockServices';
import type { GradedCard, Order } from '../src/types';
import { createDb } from './client';
import * as s from './schema';

if (existsSync('.env')) process.loadEnvFile('.env');

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error('Define DATABASE_URL (o MIGRATION_DATABASE_URL) en .env');
if (process.env.VERCEL_ENV === 'production') throw new Error('El seed no se ejecuta en producción');

const db = createDb(url);
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Pedido que agrupa las cartas certificadas de ejemplo. */
const CERTIFIED_ORDER_CODE = 'GG-ORD-000001';

const cents = (eur: number) => Math.round(eur * 100);

const TZ_OFFSETS: Record<string, string> = { CET: '+01:00', CEST: '+02:00', WET: '+00:00', WEST: '+01:00' };
const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

/** Convierte "18 Sep 2026, 10:24 CET" en Date. */
function parseMockTimestamp(value: string): Date {
  const m = /^(\d{2}) (\w{3}) (\d{4}), (\d{2}:\d{2}) (\w+)$/.exec(value);
  if (!m || !MONTHS[m[2]] || !TZ_OFFSETS[m[5]]) throw new Error(`Fecha de mock no reconocida: ${value}`);
  return new Date(`${m[3]}-${MONTHS[m[2]]}-${m[1]}T${m[4]}:00${TZ_OFFSETS[m[5]]}`);
}

async function seedUsers(tx: Tx) {
  const rows = await tx
    .insert(s.users)
    .values([
      { email: 'cliente.demo@gorillagrading.test', fullName: 'Cliente Demo', role: 'customer' },
      { email: 'carlos.mendes@gorillagrading.test', fullName: 'Carlos Mendes', role: 'customer' },
      { email: 'grader.demo@gorillagrading.test', fullName: 'Grader Demo', role: 'grader' },
      { email: 'qa.demo@gorillagrading.test', fullName: 'QA Demo', role: 'qa' },
      { email: 'admin.demo@gorillagrading.test', fullName: 'Admin Demo', role: 'admin' },
    ])
    .returning();
  const byName = (name: string) => rows.find((u) => u.fullName === name)!;
  return {
    customer: byName('Cliente Demo'),
    carlos: byName('Carlos Mendes'),
    grader: byName('Grader Demo'),
    qa: byName('QA Demo'),
  };
}

async function seedServiceTiers(tx: Tx) {
  const rows = await tx
    .insert(s.serviceTiers)
    .values(
      MOCK_SERVICES.map((svc, i) => ({
        code: svc.id,
        name: svc.name,
        tagline: svc.tagline,
        priceCents: cents(svc.priceEur),
        turnaroundBusinessDays: svc.turnaroundDays,
        maxDeclaredValueCents: cents(svc.maxDeclaredValueEur),
        subgradesIncluded: svc.subgradesIncluded,
        highResScans: svc.highResScans,
        priorityQueue: svc.priorityQueue,
        eventOnly: svc.id === 'event',
        badge: svc.badge,
        sortOrder: i,
      })),
    )
    .returning();
  return new Map(rows.map((t) => [t.code, t]));
}

type Tier = typeof s.serviceTiers.$inferSelect;

async function seedMockOrder(tx: Tx, order: Order, userId: string, tiers: Map<string, Tier>) {
  const items = order.items.map((item, i) => {
    const tier = tiers.get(item.serviceTierId)!;
    return {
      position: i + 1,
      cardName: item.cardName,
      game: item.game,
      setName: item.set,
      declaredValueCents: cents(item.declaredValue),
      serviceTierId: tier.id,
      unitPriceCents: tier.priceCents,
      maxDeclaredValueCents: tier.maxDeclaredValueCents,
      notes: item.notes,
    };
  });
  const submittedAt = new Date(`${order.createdAt}T00:00:00Z`);

  const [row] = await tx
    .insert(s.orders)
    .values({
      code: order.id,
      userId,
      status: order.status,
      shippingMethod: order.shippingMethod,
      shippingAddress: order.shippingAddress && {
        fullName: order.shippingAddress.fullName,
        line1: order.shippingAddress.line1,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        countryCode: order.shippingAddress.country === 'Spain' ? 'ES' : 'PT',
      },
      // Solo el subtotal: seguro, envío e IVA dependen de reglas aún sin cerrar.
      subtotalCents: items.reduce((sum, item) => sum + item.unitPriceCents, 0),
      paymentStatus: 'paid',
      submittedAt,
      createdAt: submittedAt,
    })
    .returning();

  await tx.insert(s.orderItems).values(items.map((item) => ({ ...item, orderId: row.id })));

  await tx.insert(s.shipments).values({
    orderId: row.id,
    direction: order.status === 'DELIVERED' ? 'outbound' : 'inbound',
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
  });

  const done = order.steps.filter((step) => step.timestamp);
  await tx.insert(s.custodyEvents).values(
    done.map((step, i) => ({
      orderId: row.id,
      fromStatus: i === 0 ? null : done[i - 1].status,
      toStatus: step.status,
      publicLabel: step.label,
      publicDescription: step.description,
      occurredAt: parseMockTimestamp(step.timestamp!),
    })),
  );
}

/** Nivel más barato cuyo límite declarado cubre el valor; si ninguno, el de mayor límite. */
function tierFor(declaredValueCents: number, tiers: Map<string, Tier>): Tier {
  const candidates = [...tiers.values()].filter((t) => !t.eventOnly);
  const fitting = candidates
    .filter((t) => t.maxDeclaredValueCents >= declaredValueCents)
    .sort((a, b) => a.priceCents - b.priceCents);
  return fitting[0] ?? candidates.sort((a, b) => b.maxDeclaredValueCents - a.maxDeclaredValueCents)[0];
}

async function seedCertifiedCards(
  tx: Tx,
  users: Awaited<ReturnType<typeof seedUsers>>,
  tiers: Map<string, Tier>,
) {
  const [order] = await tx
    .insert(s.orders)
    .values({
      code: CERTIFIED_ORDER_CODE,
      userId: users.customer.id,
      status: 'DELIVERED',
      shippingMethod: 'VAULT_STORE',
      paymentStatus: 'paid',
      submittedAt: new Date('2026-07-01T09:00:00Z'),
    })
    .returning();

  for (const [i, card] of MOCK_GRADED_CARDS.entries()) {
    await seedCertifiedCard(tx, card, i + 1, order.id, users, tiers);
  }
}

async function seedCertifiedCard(
  tx: Tx,
  card: GradedCard,
  position: number,
  orderId: string,
  users: Awaited<ReturnType<typeof seedUsers>>,
  tiers: Map<string, Tier>,
) {
  const certifiedAt = new Date(`${card.certDate}T12:00:00Z`);
  const declaredValueCents = cents(card.declaredValueEur);
  const tier = tierFor(declaredValueCents, tiers);

  const [identity] = await tx
    .insert(s.cardIdentities)
    .values({
      game: card.game,
      setName: card.set,
      cardNumber: card.cardNumber,
      name: card.name,
      language: card.language,
      year: card.year,
      rarity: card.rarity,
    })
    .returning();

  const [item] = await tx
    .insert(s.orderItems)
    .values({
      orderId,
      position,
      cardIdentityId: identity.id,
      cardName: card.name,
      game: card.game,
      setName: card.set,
      cardNumber: card.cardNumber,
      year: card.year,
      language: card.language,
      declaredValueCents,
      serviceTierId: tier.id,
      unitPriceCents: tier.priceCents,
      maxDeclaredValueCents: tier.maxDeclaredValueCents,
    })
    .returning();

  const { centering, corners, edges, surface } = card.subgrades;
  const [result] = await tx
    .insert(s.gradingResults)
    .values({
      orderItemId: item.id,
      status: 'approved',
      isAuthentic: card.isAuthentic,
      finalGrade: card.grade,
      gradeLabel: card.gradeLabel,
      centeringScore: centering.score,
      centeringFrontRatio: centering.frontRatio,
      centeringBackRatio: centering.backRatio,
      centeringNotes: centering.description,
      cornersScore: corners.score,
      cornersFrontScore: corners.frontScore,
      cornersBackScore: corners.backScore,
      cornersNotes: corners.description,
      edgesScore: edges.score,
      edgesFrontScore: edges.frontScore,
      edgesBackScore: edges.backScore,
      edgesNotes: edges.description,
      surfaceScore: surface.score,
      surfaceFrontScore: surface.frontScore,
      surfaceBackScore: surface.backScore,
      surfaceNotes: surface.description,
      station: card.verifier,
      gradedBy: users.grader.id,
      gradedAt: certifiedAt,
      qaApprovedBy: users.qa.id,
      qaApprovedAt: certifiedAt,
    })
    .returning();

  if (card.defects.length > 0) {
    await tx.insert(s.gradingDefects).values(
      card.defects.map((d) => ({
        gradingResultId: result.id,
        // Los mocks no indican la cara del defecto.
        side: 'front' as const,
        category: d.category.toLowerCase() as (typeof s.defectCategory.enumValues)[number],
        severity: d.severity,
        title: d.title,
        description: d.description,
        x: d.x,
        y: d.y,
        deduction: d.deduction,
      })),
    );
  }

  // GGI-774102 -> GG-774102, como el serial que muestra el seguimiento.
  const serial = card.certNumber.replace(/^GGI-/, 'GG-');
  const [slab] = await tx
    .insert(s.slabs)
    .values({
      orderItemId: item.id,
      gradingResultId: result.id,
      serial,
      qrPayload: `https://gorillagrading.com/certificates/${card.certNumber}`,
      encapsulatedAt: certifiedAt,
    })
    .returning();

  await tx.insert(s.certificates).values({
    number: card.certNumber,
    slabId: slab.id,
    gradingResultId: result.id,
    cardIdentityId: identity.id,
    payload: {
      number: card.certNumber,
      serial,
      card: { game: card.game, set: card.set, number: card.cardNumber, name: card.name, language: card.language },
      grade: card.grade,
      gradeLabel: card.gradeLabel,
      issuedAt: certifiedAt.toISOString(),
    },
    issuedAt: certifiedAt,
  });
}

async function main() {
  const existing = await db.query.orders.findFirst({ where: eq(s.orders.code, CERTIFIED_ORDER_CODE) });
  if (existing) {
    console.log('La base de datos ya tiene los datos de ejemplo. No se hace nada.');
    return;
  }

  await db.transaction(async (tx) => {
    const users = await seedUsers(tx);
    const tiers = await seedServiceTiers(tx);
    const owners = [users.carlos.id, users.customer.id];
    for (const [i, order] of MOCK_ORDERS.entries()) {
      await seedMockOrder(tx, order, owners[i] ?? users.customer.id, tiers);
    }
    await seedCertifiedCards(tx, users, tiers);
  });

  console.log(
    `Seed completado: ${MOCK_SERVICES.length} servicios, ${MOCK_ORDERS.length + 1} pedidos, ${MOCK_GRADED_CARDS.length} certificados.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
