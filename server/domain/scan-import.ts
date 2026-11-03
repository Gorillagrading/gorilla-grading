import { createHash, randomUUID } from 'node:crypto';
import { and, eq, ne } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { certificates, gradingDefects, gradingResults, orderItems, orders } from '../../db/schema.js';
import type { UserDto } from '../../shared/auth.js';
import type { AdminGradingResult } from '../../shared/grading-admin.js';
import type { CornerPosition, DamageSize, ScanReport, ScanSide } from '../../shared/scan-report.js';
import { ProblemError } from '../problem.js';
import { parseScanReport, ScanReportError, type ScanImages } from '../scanner/parse-report.js';
import { readPdf } from '../scanner/read-pdf.js';
import type { ObjectStorage } from '../storage.js';
import { GRADABLE, audit, conflict, currentResult, loadGradingResults, loadItem } from './grading-results.js';

const SEVERITY: Record<DamageSize, 'minor' | 'moderate' | 'critical'> = { small: 'minor', medium: 'moderate', large: 'critical' };

/**
 * Importa el informe en PDF del escáner de una carta: lee las notas, las medidas, las esquinas y los daños,
 * guarda el PDF y sus imágenes, y deja el resultado pendiente de control de calidad con el número de
 * certificado del informe. Si el PDF no se puede leer entero o no cuadra, no se guarda nada.
 */
export async function importScanReport(
  db: Db,
  storage: ObjectStorage,
  actor: UserDto,
  code: string,
  position: number,
  pdf: Uint8Array,
  context: { ip: string | null },
  now = new Date(),
): Promise<AdminGradingResult> {
  const { order, item } = await loadItem(db, code, position);
  if (!GRADABLE.includes(order.status)) {
    throw conflict('El pedido no está en una fase en la que se pueda graduar.', 'grading_not_allowed');
  }
  const existing = await currentResult(db, item.id);
  if (existing?.status === 'approved' && actor.role !== 'admin') {
    throw conflict('El resultado ya está aprobado. Solo un administrador puede corregirlo.', 'grading_approved');
  }

  let parsed: ReturnType<typeof parseScanReport>;
  try {
    parsed = parseScanReport(await readPdf(pdf));
  } catch (error) {
    if (error instanceof ScanReportError) {
      throw new ProblemError(422, 'Validation Error', 'El informe del escáner no se puede importar.', {
        code: 'scan_report_invalid',
        extensions: { problems: error.problems },
      });
    }
    throw new ProblemError(422, 'Validation Error', 'El archivo no es un PDF que se pueda leer.', { code: 'scan_report_unreadable' });
  }
  const { report, images } = parsed;
  const number = report.certificateNumber;

  // El número del informe no puede estar ya en otro certificado ni en otra carta.
  const [issued] = await db.select({ id: certificates.id }).from(certificates).where(eq(certificates.number, number)).limit(1);
  if (issued) throw conflict(`Ya existe un certificado con el número ${number}.`, 'certificate_number_taken');
  const [claimed] = await db
    .select({ orderCode: orders.code, position: orderItems.position })
    .from(gradingResults)
    .innerJoin(orderItems, eq(orderItems.id, gradingResults.orderItemId))
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(eq(gradingResults.certificateNumber, number), ne(gradingResults.status, 'superseded'), ne(gradingResults.orderItemId, item.id)))
    .limit(1);
  if (claimed) {
    throw conflict(`Este informe (${number}) ya está importado en la carta ${claimed.position} del pedido ${claimed.orderCode}.`, 'certificate_number_taken');
  }

  // Control de calidad revisa una carta concreta: si el laboratorio no la identificó, vale el nombre del informe.
  const cardName = item.cardName ?? report.card.name;
  const game = item.game ?? report.card.game;
  if (!cardName || !game) {
    throw conflict('Identifica la carta (nombre y juego) antes de importar el informe: el PDF no trae su nombre.', 'card_unidentified');
  }

  // El PDF y sus imágenes, en una carpeta propia de esta importación.
  const folder = `items/${item.id}/scanner-${randomUUID()}`;
  const stored: ScanReport['images'] = { scan: {}, corners: {} };
  const uploads: Promise<void>[] = [storage.upload(`${folder}/informe.pdf`, pdf, 'application/pdf')];
  for (const [side, jpeg] of Object.entries(images.scan) as [ScanSide, Uint8Array][]) {
    stored.scan[side] = `${folder}/${side}-escaneo.jpg`;
    uploads.push(storage.upload(stored.scan[side]!, jpeg, 'image/jpeg'));
  }
  for (const [side, corners] of Object.entries(images.corners) as [ScanSide, ScanImages['corners'][ScanSide]][]) {
    stored.corners[side] = {};
    for (const [position, jpeg] of Object.entries(corners ?? {}) as [CornerPosition, Uint8Array][]) {
      const key = `${folder}/${side}-esquina-${position}.jpg`;
      stored.corners[side]![position] = key;
      uploads.push(storage.upload(key, jpeg, 'image/jpeg'));
    }
  }
  await Promise.all(uploads);

  const scanReport: ScanReport = {
    ...report,
    images: stored,
    pdf: { key: `${folder}/informe.pdf`, sha256: createHash('sha256').update(pdf).digest('hex'), bytes: pdf.byteLength },
  };
  const front = report.faces.find((f) => f.side === 'front');
  const back = report.faces.find((f) => f.side === 'back');
  const ratio = (c: NonNullable<typeof front>['centering']) => (c ? `${c.horizontal} L/R, ${c.vertical} T/B` : null);
  const { subgrades } = report;

  const values = {
    isAuthentic: true,
    rule: 'scanner',
    certificateNumber: number,
    scanReport,
    finalGrade: report.final,
    gradeLabel: null,
    centeringScore: subgrades.centering.score,
    centeringFrontRatio: ratio(front?.centering ?? null),
    centeringBackRatio: ratio(back?.centering ?? null),
    centeringNotes: null,
    cornersScore: subgrades.corners.score,
    cornersFrontScore: front?.cornersScore ?? null,
    cornersBackScore: back?.cornersScore ?? null,
    cornersNotes: null,
    edgesScore: subgrades.edges.score,
    edgesFrontScore: null,
    edgesBackScore: null,
    edgesNotes: null,
    surfaceScore: subgrades.surface.score,
    surfaceFrontScore: null,
    surfaceBackScore: null,
    surfaceNotes: null,
    station: null,
    status: 'pending_qa' as const,
    gradedBy: actor.id,
    gradedAt: now,
    qaApprovedBy: null,
    qaApprovedAt: null,
  };

  const replacedReport = existing && existing.status !== 'approved' ? (existing.scanReport as ScanReport | null) : null;
  await db.transaction(async (tx) => {
    if (!item.cardName || !item.game) await tx.update(orderItems).set({ cardName, game }).where(eq(orderItems.id, item.id));

    let resultId: string;
    if (existing && existing.status !== 'approved') {
      await tx.update(gradingResults).set(values).where(eq(gradingResults.id, existing.id));
      await tx.delete(gradingDefects).where(eq(gradingDefects.gradingResultId, existing.id));
      resultId = existing.id;
    } else {
      // Corregir un resultado aprobado crea una versión nueva y deja la anterior como histórico.
      if (existing) await tx.update(gradingResults).set({ status: 'superseded' }).where(eq(gradingResults.id, existing.id));
      const [created] = await tx
        .insert(gradingResults)
        .values({ ...values, orderItemId: item.id, version: (existing?.version ?? 0) + 1 })
        .returning({ id: gradingResults.id });
      if (existing) await tx.update(gradingResults).set({ supersededById: created.id }).where(eq(gradingResults.id, existing.id));
      resultId = created.id;
    }

    const damages = report.faces.flatMap((face) => face.damages.map((d) => ({ ...d, side: face.side })));
    if (damages.length > 0) {
      await tx.insert(gradingDefects).values(
        damages.map((d) => ({
          gradingResultId: resultId,
          side: d.side,
          category: d.area,
          severity: d.size ? SEVERITY[d.size] : ('moderate' as const),
          title: d.kind.slice(0, 120),
          description: [d.location, d.lengthMm !== null ? `${String(d.lengthMm).replace('.', ',')} mm` : null].filter(Boolean).join(' · ') || null,
          x: d.x,
          y: d.y,
          deduction: 0,
        })),
      );
    }
    await audit(tx, actor, 'grading.scan_imported', order.code, position, {
      certificateNumber: number,
      finalGrade: report.final,
      criteria: report.criteria,
      sha256: scanReport.pdf.sha256,
    }, context.ip);
  });

  // Los archivos de un informe anterior sin aprobar ya no los usa nadie.
  if (replacedReport?.pdf) {
    const old = [replacedReport.pdf.key, ...Object.values(replacedReport.images.scan), ...Object.values(replacedReport.images.corners).flatMap((c) => Object.values(c ?? {}))];
    await Promise.all(old.filter((k): k is string => !!k).map((k) => storage.remove(k).catch(() => undefined)));
  }

  return (await loadGradingResults(db, [item.id])).get(item.id)!;
}
