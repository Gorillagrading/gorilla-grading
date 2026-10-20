import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { gradingResults } from '../db/schema.js';
import { deriveFinalGrade, deriveGradeLabel, GRADE_LABELS, type SubgradeScores } from '../shared/grading.js';
import { createTestDb, insertAllTiers, insertGradedOrder, insertUser, type TestDb } from './testing.js';

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

/**
 * Tabla de prueba con las mismas restricciones que grading_results, creada a partir del SQL real de
 * la migración. Así se comprueba que lo que impone la base de datos coincide con la regla en código.
 */
async function createProbeTable() {
  const migration = readFileSync('db/migrations/0005_grade_rule.sql', 'utf8');
  await db.execute(sql.raw(`
    create table grade_probe (
      centering_score numeric(3,1), corners_score numeric(3,1), edges_score numeric(3,1), surface_score numeric(3,1),
      final_grade numeric(3,1), grade_label text
    )`));
  for (const statement of migration.split('--> statement-breakpoint')) {
    await db.execute(sql.raw(statement.replaceAll('"grading_results"', '"grade_probe"')));
  }
}

const insertProbe = (s: SubgradeScores, grade: number, label: string) =>
  db.execute(sql.raw(
    `insert into grade_probe values (${s.centering}, ${s.corners}, ${s.edges}, ${s.surface}, ${grade}, '${label}')`,
  ));

describe('la base de datos y la regla en código coinciden', () => {
  beforeAll(createProbeTable);

  const values = [5, 8, 8.5, 9, 9.5, 10];
  const combos: SubgradeScores[] = [];
  for (const centering of values) for (const corners of values) for (const edges of values) for (const surface of values) {
    combos.push({ centering, corners, edges, surface });
  }

  it('acepta la nota que dan las subnotas, con su etiqueta, en todas las combinaciones', async () => {
    for (const s of combos) {
      const grade = deriveFinalGrade(s);
      await expect(insertProbe(s, grade, deriveGradeLabel(grade, s)), JSON.stringify(s)).resolves.toBeDefined();
    }
  }, 60_000);

  it('rechaza una nota medio punto por encima de la que dan las subnotas, en todas las combinaciones', async () => {
    for (const s of combos) {
      const grade = deriveFinalGrade(s) + 0.5;
      if (grade > 10) continue;
      await expect(insertProbe(s, grade, GRADE_LABELS[grade]![0]), JSON.stringify(s)).rejects.toThrow();
    }
  }, 60_000);

  it('acepta una nota más estricta que la de las subnotas', async () => {
    for (const s of combos.slice(0, 200)) {
      const grade = deriveFinalGrade(s) - 0.5;
      if (grade < 1) continue;
      await expect(insertProbe(s, grade, GRADE_LABELS[grade]![0]), JSON.stringify(s)).resolves.toBeDefined();
    }
  }, 60_000);

  it('rechaza una etiqueta que no corresponde a la nota (el caso de Cade Cunningham)', async () => {
    const cade = { centering: 9.5, corners: 9.5, edges: 10, surface: 9.5 };
    await expect(insertProbe(cade, 9.5, 'Mint+ 9.5')).resolves.toBeDefined();
    await expect(insertProbe(cade, 9.5, 'Gem Mint 10')).rejects.toThrow();
    await expect(insertProbe(cade, 9.5, 'Mint 9')).rejects.toThrow();
  });

  it('"Pristine 10" solo con las cuatro subnotas en 10', async () => {
    await expect(insertProbe({ centering: 10, corners: 10, edges: 10, surface: 10 }, 10, 'Pristine 10')).resolves.toBeDefined();
    await expect(insertProbe({ centering: 10, corners: 10, edges: 9.5, surface: 10 }, 10, 'Pristine 10')).rejects.toThrow();
    await expect(insertProbe({ centering: 10, corners: 10, edges: 9.5, surface: 10 }, 10, 'Gem Mint 10')).resolves.toBeDefined();
  });

  it('rechaza valores fuera de la escala', async () => {
    const ten = { centering: 10, corners: 10, edges: 10, surface: 10 };
    await expect(insertProbe({ ...ten, edges: 9.7 as number }, 9.5, 'Mint+ 9.5')).rejects.toThrow();
    await expect(insertProbe({ ...ten, edges: 0.5 }, 1, 'Poor 1')).rejects.toThrow();
    await expect(insertProbe(ten, 10.5, 'Gem Mint 10')).rejects.toThrow();
    await expect(insertProbe(ten, 0, 'Poor 1')).rejects.toThrow();
  });

  it('un borrador sin subnotas o sin nota no se bloquea', async () => {
    await expect(db.execute(sql.raw(`insert into grade_probe (centering_score) values (9.5)`))).resolves.toBeDefined();
    await expect(db.execute(sql.raw(`insert into grade_probe (final_grade) values (9.5)`))).resolves.toBeDefined();
  });
});

describe('en la tabla real de resultados', () => {
  it('no se puede cambiar la etiqueta de un resultado por una que no le corresponde', async () => {
    await insertAllTiers(db);
    const owner = await insertUser(db, 'dueno@example.com');
    const grader = await insertUser(db, 'grader@example.com', 'grader');
    const qa = await insertUser(db, 'qa@example.com', 'qa');
    const [tier] = await db.execute(sql`select id from service_tiers where code = 'premium'`).then((r) => r.rows as { id: string }[]);
    await insertGradedOrder(db, {
      ownerId: owner.id, tierId: tier.id, graderId: grader.id, qaId: qa.id, grade: 9.5,
      orderCode: 'GGI-ORD-AAAAA1', certNumber: 'GGI-111111', cardName: 'Charizard',
    });
    const [result] = await db.select().from(gradingResults);
    expect(result).toMatchObject({ finalGrade: 9.5, gradeLabel: 'Mint+ 9.5' });

    await expect(db.execute(sql`update grading_results set grade_label = 'Gem Mint 10'`)).rejects.toThrow();
    await expect(db.execute(sql`update grading_results set final_grade = 10, grade_label = 'Gem Mint 10'`)).rejects.toThrow();
    await expect(db.execute(sql`update grading_results set edges_score = 7`)).rejects.toThrow();
  });
});
