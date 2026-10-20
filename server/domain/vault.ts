import { and, desc, eq, inArray, type SQL } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import {
  cardIdentities,
  certificates,
  gradingDefects,
  gradingResults,
  orderItems,
  orders,
} from '../../db/schema.js';
import type { CardDefectDto, GradedCardDto } from '../../shared/account.js';

const CATEGORY_LABEL = {
  centering: 'Centering',
  corners: 'Corners',
  edges: 'Edges',
  surface: 'Surface',
} as const;

type CertificateImages = { front?: string; back?: string; slabMockup?: string };

export type CertificateRecord = typeof certificates.$inferSelect;

export interface LoadedCard {
  /** Incluye `declaredValueEur`, que solo se puede enviar al dueño. */
  card: GradedCardDto;
  certificate: CertificateRecord;
  /** Número del certificado que sustituye a este, si fue reemplazado. */
  supersededByNumber: string | null;
}

/**
 * Carga certificados con su informe completo. La población de cada carta se calcula en el
 * momento, con todas las copias activas de esa misma carta, sean de quien sean.
 * `userId` limita a las cartas de un usuario; `number` a un certificado concreto.
 */
export async function loadCards(
  db: Db,
  filter: { userId?: string; number?: string; activeOnly: boolean },
): Promise<LoadedCard[]> {
  const conditions: SQL[] = [];
  if (filter.userId) conditions.push(eq(orders.userId, filter.userId));
  if (filter.number) conditions.push(eq(certificates.number, filter.number));
  if (filter.activeOnly) conditions.push(eq(certificates.status, 'active'));

  const rows = await db
    .select({
      certificate: certificates,
      result: gradingResults,
      identity: cardIdentities,
      declaredValueCents: orderItems.declaredValueCents,
    })
    .from(certificates)
    .innerJoin(gradingResults, eq(gradingResults.id, certificates.gradingResultId))
    .innerJoin(orderItems, eq(orderItems.id, gradingResults.orderItemId))
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(cardIdentities, eq(cardIdentities.id, certificates.cardIdentityId))
    .where(and(...conditions))
    .orderBy(desc(certificates.issuedAt));
  if (rows.length === 0) return [];

  const resultIds = rows.map((r) => r.result.id);
  const identityIds = [...new Set(rows.map((r) => r.identity.id))];
  const replacedBy = [...new Set(rows.map((r) => r.certificate.supersededById).filter((v): v is string => !!v))];

  const [defects, peers, replacements] = await Promise.all([
    db.select().from(gradingDefects).where(inArray(gradingDefects.gradingResultId, resultIds)),
    db
      .select({ identityId: certificates.cardIdentityId, grade: gradingResults.finalGrade })
      .from(certificates)
      .innerJoin(gradingResults, eq(gradingResults.id, certificates.gradingResultId))
      .where(and(inArray(certificates.cardIdentityId, identityIds), eq(certificates.status, 'active'))),
    replacedBy.length
      ? db.select({ id: certificates.id, number: certificates.number }).from(certificates).where(inArray(certificates.id, replacedBy))
      : Promise.resolve([] as { id: string; number: string }[]),
  ]);

  return rows.map(({ certificate: cert, result: r, identity, declaredValueCents }) => {
    const grade = r.finalGrade ?? 0;
    const samePrint = peers.filter((p) => p.identityId === identity.id);
    const images = (cert.payload as { images?: CertificateImages } | null)?.images ?? {};

    const card: GradedCardDto = {
      id: cert.id,
      certNumber: cert.number,
      name: identity.name,
      set: identity.setName,
      year: identity.year ?? 0,
      cardNumber: identity.cardNumber,
      rarity: identity.rarity ?? '',
      game: identity.game,
      language: identity.language,
      grade,
      gradeLabel: r.gradeLabel ?? '',
      subgrades: {
        centering: {
          score: r.centeringScore ?? 0,
          frontRatio: r.centeringFrontRatio ?? '',
          backRatio: r.centeringBackRatio ?? '',
          description: r.centeringNotes ?? '',
        },
        corners: {
          score: r.cornersScore ?? 0,
          frontScore: r.cornersFrontScore ?? 0,
          backScore: r.cornersBackScore ?? 0,
          description: r.cornersNotes ?? '',
        },
        edges: {
          score: r.edgesScore ?? 0,
          frontScore: r.edgesFrontScore ?? 0,
          backScore: r.edgesBackScore ?? 0,
          description: r.edgesNotes ?? '',
        },
        surface: {
          score: r.surfaceScore ?? 0,
          frontScore: r.surfaceFrontScore ?? 0,
          backScore: r.surfaceBackScore ?? 0,
          description: r.surfaceNotes ?? '',
        },
      },
      frontImage: images.front ?? '',
      backImage: images.back ?? '',
      slabMockupImage: images.slabMockup ?? undefined,
      defects: defects
        .filter((d) => d.gradingResultId === r.id)
        .map<CardDefectDto>((d) => ({
          id: d.id,
          category: CATEGORY_LABEL[d.category],
          title: d.title,
          description: d.description ?? '',
          severity: d.severity,
          x: d.x,
          y: d.y,
          deduction: d.deduction,
        })),
      population: {
        totalGraded: samePrint.length,
        higherCount: samePrint.filter((p) => (p.grade ?? 0) > grade).length,
        equalCount: samePrint.filter((p) => (p.grade ?? 0) === grade).length,
      },
      certDate: cert.issuedAt.toISOString().slice(0, 10),
      verifier: r.station ?? '',
      securityHash: cert.signature ?? '',
      declaredValueEur: declaredValueCents / 100,
      isAuthentic: r.isAuthentic,
    };

    return {
      card,
      certificate: cert,
      supersededByNumber: replacements.find((s) => s.id === cert.supersededById)?.number ?? null,
    };
  });
}

/** Cartas certificadas (certificados activos) de un usuario, para su bóveda. */
export async function listUserVault(db: Db, userId: string): Promise<GradedCardDto[]> {
  return (await loadCards(db, { userId, activeOnly: true })).map((r) => r.card);
}
