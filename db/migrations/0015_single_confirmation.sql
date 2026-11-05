-- El resultado sale del PDF del escáner y lo confirma una sola persona del laboratorio (puede ser quien subió el PDF).
ALTER TABLE "grading_results" DROP CONSTRAINT IF EXISTS "grading_results_double_signature";
