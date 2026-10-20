/**
 * Ejecuta una vez el avance automático de pedidos. Útil para probar o para lanzarlo a mano.
 * Uso: npm run jobs:advance
 */
import { existsSync } from 'node:fs';
import { advanceDueOrders } from '../server/domain/automation.js';
import { createDb } from './client.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error('Define DATABASE_URL (o MIGRATION_DATABASE_URL) en .env');

const db = createDb(url);
try {
  const advanced = await advanceDueOrders(db);
  console.log(advanced.length ? advanced.map((a) => `${a.code}: ${a.from} -> ${a.to}`).join('\n') : 'Ningún pedido tenía una fase pendiente.');
} finally {
  await db.$client.end();
}
