/**
 * Contratos del resultado de graduación que introduce el laboratorio. La nota final y la etiqueta
 * las calcula el servidor con la regla de shared/grading.ts; la persona solo aporta las subnotas.
 */
import { z } from 'zod';
import { isGradeValue } from './grading.js';

const gradeValue = z.number().refine(isGradeValue, 'La nota va de 1 a 10 en pasos de 0,5.');
const note = z.string().trim().max(500).optional();

/** Una subnota con el detalle por cara que se muestra en el certificado. */
export const SubgradeInput = z.object({
  score: gradeValue,
  frontScore: gradeValue.optional(),
  backScore: gradeValue.optional(),
  notes: note,
});
export type SubgradeInput = z.infer<typeof SubgradeInput>;

export const CenteringInput = z.object({
  score: gradeValue,
  /** Por ejemplo "52/48 L/R, 50/50 T/B". */
  frontRatio: z.string().trim().max(60).optional(),
  backRatio: z.string().trim().max(60).optional(),
  notes: note,
});
export type CenteringInput = z.infer<typeof CenteringInput>;

export const DefectInput = z.object({
  side: z.enum(['front', 'back']),
  category: z.enum(['centering', 'corners', 'edges', 'surface']),
  severity: z.enum(['flawless', 'minor', 'moderate', 'critical']),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  /** Posición en porcentaje (0-100) sobre la imagen de la carta. */
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  deduction: z.number().min(0).max(9.99).optional(),
});
export type DefectInput = z.infer<typeof DefectInput>;

export const GradingBody = z
  .object({
    isAuthentic: z.boolean(),
    centering: CenteringInput.optional(),
    corners: SubgradeInput.optional(),
    edges: SubgradeInput.optional(),
    surface: SubgradeInput.optional(),
    /** Opcional. Si se omite se usa la nota que dan las subnotas; nunca puede ser superior a ella. */
    finalGrade: gradeValue.optional(),
    station: z.string().trim().max(60).optional(),
    defects: z.array(DefectInput).max(60).default([]),
    /** Falso: se guarda como borrador. Verdadero: se envía a control de calidad. */
    submit: z.boolean().default(false),
  })
  .superRefine((body, ctx) => {
    if (!body.isAuthentic) return;
    for (const key of ['centering', 'corners', 'edges', 'surface'] as const) {
      if (!body[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'Falta la subnota.' });
    }
  });
export type GradingBody = z.input<typeof GradingBody>;

export const RejectGradingBody = z.object({
  /** Motivo que verá quien graduó la carta. */
  reason: z.string().trim().min(1).max(500),
});
export type RejectGradingBody = z.infer<typeof RejectGradingBody>;

export const GRADING_STATUSES = ['draft', 'pending_qa', 'approved'] as const;
export type GradingStatus = (typeof GRADING_STATUSES)[number];

/** Resultado de una carta tal como lo ve el personal. */
export interface AdminGradingResult {
  version: number;
  status: GradingStatus;
  isAuthentic: boolean;
  finalGrade: number | null;
  gradeLabel: string | null;
  centering: { score: number; frontRatio: string | null; backRatio: string | null; notes: string | null } | null;
  corners: { score: number; frontScore: number | null; backScore: number | null; notes: string | null } | null;
  edges: { score: number; frontScore: number | null; backScore: number | null; notes: string | null } | null;
  surface: { score: number; frontScore: number | null; backScore: number | null; notes: string | null } | null;
  station: string | null;
  defects: {
    side: 'front' | 'back';
    category: 'centering' | 'corners' | 'edges' | 'surface';
    severity: 'flawless' | 'minor' | 'moderate' | 'critical';
    title: string;
    description: string | null;
    x: number;
    y: number;
    deduction: number;
  }[];
  gradedBy: string;
  gradedAt: string;
  qaApprovedBy: string | null;
  qaApprovedAt: string | null;
}
