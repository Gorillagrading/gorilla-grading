/**
 * Regla de la nota de Gorilla Grading (versión 1).
 *
 * Se basa en cómo lo resuelven los graduadores que usan cuatro subnotas, sobre todo Beckett (BGS):
 * la nota final nunca es una simple media; la peor subnota la limita y los dos tramos más altos
 * tienen condiciones propias. Detalle, fuentes y puntos por confirmar: docs/engineering/REGLA_DE_NOTA.md.
 *
 *   1. Cada subnota (centrado, esquinas, bordes, superficie) va de 1 a 10 en pasos de 0,5.
 *   2. Se hace la media y se redondea al 0,5 más cercano; si queda justo a medias, hacia abajo.
 *   3. La nota final no puede superar en más de 0,5 a la peor subnota.
 *   4. Para un 9,5 o un 10 hacen falta al menos tres subnotas en 9,5 o más.
 *   5. "Pristine 10" es un 10 con las cuatro subnotas en 10; el resto de 10 es "Gem Mint 10".
 *
 * Comprobado sobre las 130.321 combinaciones posibles de subnotas: un 10 solo sale con 10/10/10/10 o con
 * tres 10 y un 9,5, así que no hace falta una regla aparte para el 10 ni para "la cuarta en 9 o más":
 * se deducen de las reglas 2 y 3 (la base de datos las comprueba igualmente).
 *
 * La base de datos impone estas mismas reglas (db/schema.ts), así que no puede guardarse un
 * certificado con una nota que las incumpla.
 */

export const SUBGRADE_KEYS = ['centering', 'corners', 'edges', 'surface'] as const;
export type SubgradeKey = (typeof SUBGRADE_KEYS)[number];
export type SubgradeScores = Record<SubgradeKey, number>;

export const MIN_GRADE = 1;
export const MAX_GRADE = 10;

/** Etiqueta (o etiquetas posibles) de cada nota. El nombre de las notas altas sigue la escala pública de CGC. */
export const GRADE_LABELS: Readonly<Record<number, readonly string[]>> = {
  10: ['Pristine 10', 'Gem Mint 10'],
  9.5: ['Mint+ 9.5'],
  9: ['Mint 9'],
  8.5: ['Near Mint-Mint 8.5'],
  8: ['Near Mint 8'],
  7.5: ['Near Mint 7.5'],
  7: ['Excellent 7'],
  6.5: ['Excellent 6.5'],
  6: ['Excellent 6'],
  5.5: ['Very Good-Excellent 5.5'],
  5: ['Very Good-Excellent 5'],
  4.5: ['Very Good 4.5'],
  4: ['Very Good 4'],
  3.5: ['Good 3.5'],
  3: ['Good 3'],
  2.5: ['Fair 2.5'],
  2: ['Fair 2'],
  1.5: ['Poor 1.5'],
  1: ['Poor 1'],
};

export const ALL_GRADE_LABELS: readonly string[] = Object.values(GRADE_LABELS).flat();

/** Un valor válido de nota: entre 1 y 10, en pasos de 0,5. */
export const isGradeValue = (n: number) => Number.isFinite(n) && n >= MIN_GRADE && n <= MAX_GRADE && Number.isInteger(n * 2);

/** Las subnotas en medios puntos enteros (9,5 -> 19), para calcular sin errores de decimales. */
const halves = (s: SubgradeScores) => SUBGRADE_KEYS.map((k) => Math.round(s[k] * 2));

/** Qué reglas rebajaron la nota respecto a la media redondeada. */
export type GradeReason = 'weakest_caps' | 'top_needs_three_half';

/** El cálculo paso a paso, para poder explicar de dónde sale una nota. */
export interface GradeTrace {
  /** Media exacta de las cuatro subnotas. */
  average: number;
  /** Media redondeada al 0,5 más cercano (a la baja si queda justo en medio). */
  rounded: number;
  lowest: number;
  final: number;
  reasons: GradeReason[];
}

/** Calcula la nota final y deja el razonamiento. Es la única implementación de la regla. */
export function traceGrade(scores: SubgradeScores): GradeTrace {
  const h = halves(scores);
  const sum = h.reduce((a, b) => a + b, 0);
  const lowest = Math.min(...h);
  const reasons: GradeReason[] = [];

  // Media redondeada al 0,5 más cercano, a la baja si queda justo en medio: ceil((sum - 2) / 4).
  const rounded = Math.ceil((sum - 2) / 4);
  let grade = rounded;
  // La peor subnota limita la nota: como mucho 0,5 por encima.
  if (grade > lowest + 1) {
    grade = lowest + 1;
    reasons.push('weakest_caps');
  }
  // Un 9,5 o un 10 exigen al menos tres subnotas de 9,5 o más. Rebaja la nota a 9.
  if (grade >= 19 && h.filter((v) => v >= 19).length < 3) {
    grade = 18;
    reasons.push('top_needs_three_half');
  }
  return { average: sum / 8, rounded: rounded / 2, lowest: lowest / 2, final: grade / 2, reasons };
}

/** La nota final que corresponde a unas subnotas. */
export const deriveFinalGrade = (scores: SubgradeScores): number => traceGrade(scores).final;

/** La etiqueta que corresponde a una nota final dadas las subnotas. */
export function deriveGradeLabel(finalGrade: number, scores: SubgradeScores): string {
  const labels = GRADE_LABELS[finalGrade];
  if (!labels) throw new RangeError(`No existe la nota ${finalGrade}`);
  if (finalGrade === 10) return SUBGRADE_KEYS.every((k) => scores[k] === 10) ? 'Pristine 10' : 'Gem Mint 10';
  return labels[0];
}

export type GradeIssue =
  | { code: 'invalid_value'; field: SubgradeKey | 'finalGrade' }
  | { code: 'grade_above_subgrades'; maxAllowed: number }
  | { code: 'label_mismatch'; expected: readonly string[] }
  | { code: 'pristine_needs_four_tens' };

/**
 * Comprueba que una nota y su etiqueta son coherentes con las subnotas. La nota puede ser
 * igual o inferior a la que dan las subnotas (un graduador puede ser más estricto), nunca superior.
 */
export function checkGrade(scores: SubgradeScores, finalGrade: number, label: string): GradeIssue[] {
  const issues: GradeIssue[] = [];
  for (const key of SUBGRADE_KEYS) if (!isGradeValue(scores[key])) issues.push({ code: 'invalid_value', field: key });
  if (!isGradeValue(finalGrade)) issues.push({ code: 'invalid_value', field: 'finalGrade' });
  if (issues.length > 0) return issues;

  const maxAllowed = deriveFinalGrade(scores);
  if (finalGrade > maxAllowed) issues.push({ code: 'grade_above_subgrades', maxAllowed });

  const allowed = GRADE_LABELS[finalGrade] ?? [];
  if (!allowed.includes(label)) issues.push({ code: 'label_mismatch', expected: allowed });
  else if (label === 'Pristine 10' && !SUBGRADE_KEYS.every((k) => scores[k] === 10)) issues.push({ code: 'pristine_needs_four_tens' });
  return issues;
}
