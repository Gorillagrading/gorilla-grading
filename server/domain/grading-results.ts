import { and, eq, inArray, ne } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { auditLogs, gradingDefects, gradingResults, orderItems, orders, users } from '../../db/schema.js';
import type { UserDto } from '../../shared/auth.js';
import type { AdminGradingResult, GradingBody } from '../../shared/grading-admin.js';
import { deriveFinalGrade, deriveGradeLabel } from '../../shared/grading.js';
import type { OrderStatus } from '../../shared/domain.js';
import { hashIp } from '../auth/crypto.js';
import { ProblemError } from '../problem.js';

/** Mientras el pedido está en el laboratorio y no en pausa se puede introducir o cambiar el resultado. */
const GRADABLE: OrderStatus[] = ['PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE'];

const conflict = (detail: string, code: string) => new ProblemError(409, 'Conflict', detail, { code });

type ResultRow = typeof gradingResults.$inferSelect;

/** Resultados vigentes (no sustituidos) de unas cartas, ya con sus defectos y los nombres del personal. */
export async function loadGradingResults(db: Db, itemIds: string[]): Promise<Map<string, AdminGradingResult>> {
  const out = new Map<string, AdminGradingResult>();
  if (itemIds.length === 0) return out;

  const rows = await db
    .select()
    .from(gradingResults)
    .where(and(inArray(gradingResults.orderItemId, itemIds), ne(gradingResults.status, 'superseded')));
  if (rows.length === 0) return out;

  const [defects, people] = await Promise.all([
    db.select().from(gradingDefects).where(inArray(gradingDefects.gradingResultId, rows.map((r) => r.id))),
    db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(inArray(users.id, [...new Set(rows.flatMap((r) => [r.gradedBy, r.qaApprovedBy].filter((v): v is string => !!v)))])),
  ]);
  const emailOf = new Map(people.map((p) => [p.id, p.email]));

  for (const r of rows) {
    out.set(r.orderItemId, {
      version: r.version,
      status: r.status as AdminGradingResult['status'],
      isAuthentic: r.isAuthentic,
      finalGrade: r.finalGrade,
      gradeLabel: r.gradeLabel,
      centering:
        r.centeringScore === null
          ? null
          : { score: r.centeringScore, frontRatio: r.centeringFrontRatio, backRatio: r.centeringBackRatio, notes: r.centeringNotes },
      corners: sub(r.cornersScore, r.cornersFrontScore, r.cornersBackScore, r.cornersNotes),
      edges: sub(r.edgesScore, r.edgesFrontScore, r.edgesBackScore, r.edgesNotes),
      surface: sub(r.surfaceScore, r.surfaceFrontScore, r.surfaceBackScore, r.surfaceNotes),
      station: r.station,
      defects: defects
        .filter((d) => d.gradingResultId === r.id)
        .map((d) => ({
          side: d.side,
          category: d.category,
          severity: d.severity,
          title: d.title,
          description: d.description,
          x: d.x,
          y: d.y,
          deduction: d.deduction,
        })),
      gradedBy: emailOf.get(r.gradedBy) ?? '',
      gradedAt: r.gradedAt.toISOString(),
      qaApprovedBy: r.qaApprovedBy ? (emailOf.get(r.qaApprovedBy) ?? null) : null,
      qaApprovedAt: r.qaApprovedAt?.toISOString() ?? null,
    });
  }
  return out;
}

const sub = (score: number | null, front: number | null, back: number | null, notes: string | null) =>
  score === null ? null : { score, frontScore: front, backScore: back, notes };

async function loadItem(db: Db, code: string, position: number) {
  const [row] = await db
    .select({ order: orders, item: orderItems })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.code, code.trim().toUpperCase()), eq(orderItems.position, position), ne(orders.status, 'DRAFT')))
    .limit(1);
  if (!row) throw new ProblemError(404, 'Not Found', 'No existe esa carta en el pedido.', { code: 'item_not_found' });
  return row;
}

async function currentResult(db: Db, itemId: string): Promise<ResultRow | undefined> {
  const [row] = await db
    .select()
    .from(gradingResults)
    .where(and(eq(gradingResults.orderItemId, itemId), ne(gradingResults.status, 'superseded')))
    .limit(1);
  return row;
}

function audit(db: Pick<Db, 'insert'>, actor: UserDto, action: string, orderCode: string, position: number, extra: object, ip: string | null) {
  return db.insert(auditLogs).values({
    actorId: actor.id,
    action,
    entityType: 'order_item',
    entityId: `${orderCode}#${position}`,
    after: extra,
    ipHash: ip ? hashIp(ip) : null,
  });
}

/** Guarda el resultado de una carta como borrador o lo envía a control de calidad. */
export async function saveGrading(
  db: Db,
  actor: UserDto,
  code: string,
  position: number,
  input: GradingBody,
  context: { ip: string | null },
  now = new Date(),
): Promise<AdminGradingResult> {
  const { order, item } = await loadItem(db, code, position);
  if (!GRADABLE.includes(order.status)) {
    throw conflict('El pedido no está en una fase en la que se pueda graduar.', 'grading_not_allowed');
  }

  const authentic = input.isAuthentic;
  const defects = input.defects ?? [];
  const scores =
    authentic && input.centering && input.corners && input.edges && input.surface
      ? { centering: input.centering.score, corners: input.corners.score, edges: input.edges.score, surface: input.surface.score }
      : null;
  if (authentic && !scores) throw new ProblemError(422, 'Validation Error', 'Faltan subnotas.', { code: 'validation_error' });

  let finalGrade: number | null = null;
  let gradeLabel: string | null = null;
  if (scores) {
    const derived = deriveFinalGrade(scores);
    finalGrade = input.finalGrade ?? derived;
    if (finalGrade > derived) {
      throw new ProblemError(422, 'Validation Error', `La nota final no puede superar ${derived}, que es la que dan las subnotas.`, {
        code: 'grade_above_subgrades',
        extensions: { maxAllowed: derived },
      });
    }
    gradeLabel = deriveGradeLabel(finalGrade, scores);
  }

  const values = {
    isAuthentic: authentic,
    finalGrade,
    gradeLabel,
    centeringScore: scores ? input.centering!.score : null,
    centeringFrontRatio: scores ? (input.centering!.frontRatio ?? null) : null,
    centeringBackRatio: scores ? (input.centering!.backRatio ?? null) : null,
    centeringNotes: scores ? (input.centering!.notes ?? null) : null,
    cornersScore: scores ? input.corners!.score : null,
    cornersFrontScore: scores ? (input.corners!.frontScore ?? null) : null,
    cornersBackScore: scores ? (input.corners!.backScore ?? null) : null,
    cornersNotes: scores ? (input.corners!.notes ?? null) : null,
    edgesScore: scores ? input.edges!.score : null,
    edgesFrontScore: scores ? (input.edges!.frontScore ?? null) : null,
    edgesBackScore: scores ? (input.edges!.backScore ?? null) : null,
    edgesNotes: scores ? (input.edges!.notes ?? null) : null,
    surfaceScore: scores ? input.surface!.score : null,
    surfaceFrontScore: scores ? (input.surface!.frontScore ?? null) : null,
    surfaceBackScore: scores ? (input.surface!.backScore ?? null) : null,
    surfaceNotes: scores ? (input.surface!.notes ?? null) : null,
    station: input.station ?? null,
    status: input.submit ? ('pending_qa' as const) : ('draft' as const),
    gradedBy: actor.id,
    gradedAt: now,
    qaApprovedBy: null,
    qaApprovedAt: null,
  };

  const existing = await currentResult(db, item.id);
  if (existing?.status === 'approved' && actor.role !== 'admin') {
    throw conflict('El resultado ya está aprobado. Solo un administrador puede corregirlo.', 'grading_approved');
  }

  await db.transaction(async (tx) => {
    let resultId: string;
    if (existing && existing.status !== 'approved') {
      await tx.update(gradingResults).set(values).where(eq(gradingResults.id, existing.id));
      await tx.delete(gradingDefects).where(eq(gradingDefects.gradingResultId, existing.id));
      resultId = existing.id;
    } else {
      // Una corrección de un resultado aprobado crea una versión nueva y deja la anterior como histórico.
      if (existing) await tx.update(gradingResults).set({ status: 'superseded' }).where(eq(gradingResults.id, existing.id));
      const [created] = await tx
        .insert(gradingResults)
        .values({ ...values, orderItemId: item.id, version: (existing?.version ?? 0) + 1 })
        .returning({ id: gradingResults.id });
      if (existing) await tx.update(gradingResults).set({ supersededById: created.id }).where(eq(gradingResults.id, existing.id));
      resultId = created.id;
    }

    if (defects.length > 0) {
      await tx.insert(gradingDefects).values(
        defects.map((d) => ({
          gradingResultId: resultId,
          side: d.side,
          category: d.category,
          severity: d.severity,
          title: d.title,
          description: d.description ?? null,
          x: d.x,
          y: d.y,
          deduction: d.deduction ?? 0,
        })),
      );
    }
    await audit(tx, actor, input.submit ? 'grading.submitted' : 'grading.saved', order.code, position, { finalGrade, gradeLabel, isAuthentic: authentic }, context.ip);
  });

  return (await loadGradingResults(db, [item.id])).get(item.id)!;
}

/** Control de calidad aprueba el resultado. Quien graduó no puede aprobar su propio trabajo. */
export async function approveGrading(
  db: Db,
  actor: UserDto,
  code: string,
  position: number,
  context: { ip: string | null },
  now = new Date(),
): Promise<AdminGradingResult> {
  const { order, item } = await loadItem(db, code, position);
  const current = await currentResult(db, item.id);
  if (!current || current.status !== 'pending_qa') {
    throw conflict('Este resultado no está pendiente de control de calidad.', 'grading_not_pending');
  }
  if (current.gradedBy === actor.id) {
    throw conflict('Quien gradúa la carta no puede aprobar su propio resultado. Debe hacerlo otra persona.', 'two_person_rule');
  }
  await db.transaction(async (tx) => {
    await tx
      .update(gradingResults)
      .set({ status: 'approved', qaApprovedBy: actor.id, qaApprovedAt: now })
      .where(eq(gradingResults.id, current.id));
    await audit(tx, actor, 'grading.approved', order.code, position, { version: current.version, finalGrade: current.finalGrade }, context.ip);
  });
  return (await loadGradingResults(db, [item.id])).get(item.id)!;
}

/** Control de calidad devuelve el resultado a borrador para que se revise. El motivo queda en el registro de auditoría. */
export async function rejectGrading(
  db: Db,
  actor: UserDto,
  code: string,
  position: number,
  reason: string,
  context: { ip: string | null },
): Promise<AdminGradingResult> {
  const { order, item } = await loadItem(db, code, position);
  const current = await currentResult(db, item.id);
  if (!current || current.status !== 'pending_qa') {
    throw conflict('Este resultado no está pendiente de control de calidad.', 'grading_not_pending');
  }
  await db.transaction(async (tx) => {
    await tx.update(gradingResults).set({ status: 'draft' }).where(eq(gradingResults.id, current.id));
    await audit(tx, actor, 'grading.rejected', order.code, position, { reason }, context.ip);
  });
  return (await loadGradingResults(db, [item.id])).get(item.id)!;
}
