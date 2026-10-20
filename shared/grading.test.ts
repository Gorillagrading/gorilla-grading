import { describe, expect, it } from 'vitest';
import {
  ALL_GRADE_LABELS, GRADE_LABELS, checkGrade, deriveFinalGrade, deriveGradeLabel, isGradeValue, traceGrade,
  type SubgradeScores,
} from './grading';

const s = (centering: number, corners: number, edges: number, surface: number): SubgradeScores => ({ centering, corners, edges, surface });

describe('deriveFinalGrade', () => {
  it('reproduce el ejemplo publicado por Beckett: 9,5 / 9,5 / 9 / 8 da un 8,5 (la media sería 9)', () => {
    expect(deriveFinalGrade(s(9.5, 9.5, 9, 8))).toBe(8.5);
  });

  it('las cuatro cartas de ejemplo de la web', () => {
    expect(deriveFinalGrade(s(10, 10, 10, 10))).toBe(10); // Pikachu Illustrator
    expect(deriveFinalGrade(s(10, 10, 9.5, 10))).toBe(10); // Shanks
    expect(deriveFinalGrade(s(9.5, 9.5, 10, 9.5))).toBe(9.5); // Cade Cunningham
    expect(deriveFinalGrade(s(9, 8.5, 8.5, 9))).toBe(8.5); // Black Lotus
  });

  it('redondea la media al 0,5 más cercano y, si queda justo en medio, hacia abajo', () => {
    expect(deriveFinalGrade(s(8, 8, 8, 8.5))).toBe(8); // 8,125 -> 8
    expect(deriveFinalGrade(s(8, 8.5, 8.5, 8.5))).toBe(8.5); // 8,375 -> 8,5
    expect(deriveFinalGrade(s(8.5, 8.5, 9, 9))).toBe(8.5); // 8,75 -> justo en medio -> 8,5
    expect(deriveFinalGrade(s(9, 9, 9.5, 9.5))).toBe(9); // 9,25 -> justo en medio -> 9
    expect(deriveFinalGrade(s(7, 7, 7, 7))).toBe(7);
  });

  it('la peor subnota limita la nota a 0,5 por encima', () => {
    expect(deriveFinalGrade(s(10, 10, 10, 8))).toBe(8.5); // la media daría 9,5
    expect(deriveFinalGrade(s(10, 10, 10, 7))).toBe(7.5);
    expect(deriveFinalGrade(s(9, 9, 9, 6))).toBe(6.5);
    expect(deriveFinalGrade(s(10, 10, 10, 1))).toBe(1.5);
  });

  it('un 10 solo sale con 10/10/10/10 o con tres 10 y un 9,5', () => {
    expect(deriveFinalGrade(s(10, 10, 10, 10))).toBe(10);
    expect(deriveFinalGrade(s(10, 10, 10, 9.5))).toBe(10);
    expect(deriveFinalGrade(s(10, 10, 9.5, 9.5))).toBe(9.5); // media 9,75 justo en medio: hacia abajo
    expect(deriveFinalGrade(s(10, 10, 10, 9))).toBe(9.5); // media 9,75: hacia abajo
  });

  it('un 9,5 o un 10 exigen al menos tres subnotas de 9,5 o más', () => {
    expect(deriveFinalGrade(s(9.5, 9.5, 9.5, 9.5))).toBe(9.5);
    expect(deriveFinalGrade(s(9.5, 9.5, 9.5, 9))).toBe(9.5);
    expect(deriveFinalGrade(s(10, 9.5, 9.5, 9))).toBe(9.5);
    expect(deriveFinalGrade(s(9.5, 9.5, 9, 9))).toBe(9); // solo dos de 9,5
    expect(deriveFinalGrade(s(9, 9, 10, 10))).toBe(9); // media 9,5, pero solo dos subnotas de 9,5 o más
    expect(deriveFinalGrade(s(10, 10, 10, 8.5))).toBe(9); // la peor subnota limita a 9
  });

  it('sobre las 130.321 combinaciones posibles: las condiciones del 10 y del 9,5 se cumplen siempre', () => {
    // Demuestra que la regla no necesita cláusulas aparte para el 10 ni para "la cuarta en 9 o más":
    // se deducen de la media redondeada y del tope de la peor subnota.
    const grid = Array.from({ length: 19 }, (_, i) => 1 + i * 0.5);
    let tens = 0;
    for (const a of grid) for (const b of grid) for (const c of grid) for (const d of grid) {
      const grade = deriveFinalGrade(s(a, b, c, d));
      const v = [a, b, c, d];
      if (grade >= 9.5) {
        expect(v.filter((x) => x >= 9.5).length).toBeGreaterThanOrEqual(3);
        expect(Math.min(...v)).toBeGreaterThanOrEqual(9);
      }
      if (grade === 10) {
        tens++;
        expect(Math.min(...v)).toBeGreaterThanOrEqual(9.5);
        expect(v.filter((x) => x === 10).length).toBeGreaterThanOrEqual(3);
      }
    }
    expect(tens).toBe(5);
  });

  it('nunca da una nota por encima de la media redondeada ni de la peor subnota + 0,5, para todas las combinaciones', () => {
    const values = [1, 3, 5.5, 7, 8, 8.5, 9, 9.5, 10];
    for (const a of values) for (const b of values) for (const c of values) for (const d of values) {
      const grade = deriveFinalGrade(s(a, b, c, d));
      const avg = (a + b + c + d) / 4;
      expect(grade).toBeLessThanOrEqual(Math.min(a, b, c, d) + 0.5);
      expect(grade).toBeLessThanOrEqual(avg + 0.25);
      expect(Number.isInteger(grade * 2)).toBe(true);
      // Si todas las subnotas son iguales, la nota es esa.
      if (a === b && b === c && c === d) expect(grade).toBe(a);
    }
  });

  it('es monótona: subir una subnota nunca baja la nota final', () => {
    const steps = [6, 7, 8, 8.5, 9, 9.5, 10];
    for (const a of steps) for (const b of steps) for (const c of steps) for (let i = 0; i < steps.length - 1; i++) {
      expect(deriveFinalGrade(s(a, b, c, steps[i + 1]))).toBeGreaterThanOrEqual(deriveFinalGrade(s(a, b, c, steps[i])));
    }
  });
});

describe('deriveGradeLabel', () => {
  it('Pristine 10 solo con las cuatro subnotas en 10', () => {
    expect(deriveGradeLabel(10, s(10, 10, 10, 10))).toBe('Pristine 10');
    expect(deriveGradeLabel(10, s(10, 10, 9.5, 10))).toBe('Gem Mint 10');
  });

  it('cada nota tiene su etiqueta', () => {
    expect(deriveGradeLabel(9.5, s(9.5, 9.5, 10, 9.5))).toBe('Mint+ 9.5');
    expect(deriveGradeLabel(9, s(9, 9, 9, 9))).toBe('Mint 9');
    expect(deriveGradeLabel(8.5, s(9, 8.5, 8.5, 9))).toBe('Near Mint-Mint 8.5');
    expect(deriveGradeLabel(7, s(7, 7, 7, 7))).toBe('Excellent 7');
  });

  it('hay etiqueta para las 19 notas posibles y ninguna se repite', () => {
    expect(Object.keys(GRADE_LABELS)).toHaveLength(19);
    expect(new Set(ALL_GRADE_LABELS).size).toBe(ALL_GRADE_LABELS.length);
    for (let g = 1; g <= 10; g += 0.5) expect(GRADE_LABELS[g]).toBeDefined();
  });

  it('rechaza una nota que no existe', () => {
    expect(() => deriveGradeLabel(9.75, s(10, 10, 10, 10))).toThrow(RangeError);
  });
});

describe('checkGrade', () => {
  it('acepta lo coherente, incluidas las cuatro cartas de ejemplo', () => {
    expect(checkGrade(s(10, 10, 10, 10), 10, 'Pristine 10')).toEqual([]);
    expect(checkGrade(s(10, 10, 9.5, 10), 10, 'Gem Mint 10')).toEqual([]);
    expect(checkGrade(s(9.5, 9.5, 10, 9.5), 9.5, 'Mint+ 9.5')).toEqual([]);
    expect(checkGrade(s(9, 8.5, 8.5, 9), 8.5, 'Near Mint-Mint 8.5')).toEqual([]);
  });

  it('el caso de Cade Cunningham: un 9,5 con la etiqueta "Gem Mint 10" no es válido', () => {
    expect(checkGrade(s(9.5, 9.5, 10, 9.5), 9.5, 'Gem Mint 10')).toEqual([{ code: 'label_mismatch', expected: ['Mint+ 9.5'] }]);
  });

  it('una nota por encima de lo que dan las subnotas no es válida', () => {
    expect(checkGrade(s(9.5, 9.5, 10, 9.5), 10, 'Gem Mint 10')).toEqual([{ code: 'grade_above_subgrades', maxAllowed: 9.5 }]);
    expect(checkGrade(s(10, 10, 10, 8), 9.5, 'Mint+ 9.5')).toEqual([{ code: 'grade_above_subgrades', maxAllowed: 8.5 }]);
  });

  it('un graduador puede ser más estricto que las subnotas', () => {
    expect(checkGrade(s(10, 10, 10, 10), 9.5, 'Mint+ 9.5')).toEqual([]);
    expect(checkGrade(s(9, 9, 9, 9), 8.5, 'Near Mint-Mint 8.5')).toEqual([]);
  });

  it('"Pristine 10" no vale con un 9,5 en alguna subnota', () => {
    expect(checkGrade(s(10, 10, 9.5, 10), 10, 'Pristine 10')).toEqual([{ code: 'pristine_needs_four_tens' }]);
  });

  it('rechaza valores que no son de la escala', () => {
    expect(checkGrade(s(9.7, 10, 10, 10), 10, 'Gem Mint 10')).toEqual([{ code: 'invalid_value', field: 'centering' }]);
    expect(checkGrade(s(10, 10, 10, 10), 10.5, 'Gem Mint 10')).toEqual([{ code: 'invalid_value', field: 'finalGrade' }]);
    expect(checkGrade(s(0.5, 10, 10, 10), 1, 'Poor 1')).toEqual([{ code: 'invalid_value', field: 'centering' }]);
  });

  it('isGradeValue', () => {
    for (const ok of [1, 1.5, 5, 9.5, 10]) expect(isGradeValue(ok)).toBe(true);
    for (const bad of [0, 0.5, 10.5, 9.7, NaN, Infinity]) expect(isGradeValue(bad)).toBe(false);
  });
});

describe('traceGrade (el razonamiento de la nota)', () => {
  it('sin reglas que la rebajen, la nota es la media redondeada', () => {
    expect(traceGrade(s(9, 9, 9, 9))).toEqual({ average: 9, rounded: 9, lowest: 9, final: 9, reasons: [] });
    expect(traceGrade(s(10, 10, 9.5, 10))).toMatchObject({ average: 9.875, rounded: 10, final: 10, reasons: [] });
  });

  it('explica cuándo la peor subnota limita la nota', () => {
    expect(traceGrade(s(10, 10, 10, 8))).toMatchObject({ average: 9.5, rounded: 9.5, lowest: 8, final: 8.5, reasons: ['weakest_caps'] });
    expect(traceGrade(s(9.5, 9.5, 9, 8))).toMatchObject({ rounded: 9, final: 8.5, reasons: ['weakest_caps'] });
  });

  it('explica cuándo un 9,5 baja a 9 por no tener tres subnotas de 9,5 o más', () => {
    expect(traceGrade(s(9, 9, 10, 10))).toMatchObject({ average: 9.5, rounded: 9.5, final: 9, reasons: ['top_needs_three_half'] });
    expect(traceGrade(s(10, 10, 10, 8.5))).toMatchObject({ rounded: 9.5, final: 9, reasons: ['weakest_caps'] });
    expect(traceGrade(s(9.5, 9.5, 9, 9))).toMatchObject({ rounded: 9, final: 9, reasons: [] });
  });

  it('con la media justo en medio, redondea hacia abajo sin que ninguna regla intervenga', () => {
    expect(traceGrade(s(10, 10, 10, 9))).toMatchObject({ average: 9.75, rounded: 9.5, final: 9.5, reasons: [] });
  });

  it('la nota del razonamiento es siempre la de deriveFinalGrade', () => {
    const values = [1, 6, 8, 8.5, 9, 9.5, 10];
    for (const a of values) for (const b of values) for (const c of values) for (const d of values) {
      expect(traceGrade(s(a, b, c, d)).final).toBe(deriveFinalGrade(s(a, b, c, d)));
    }
  });
});
