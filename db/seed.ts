/**
 * Carga en una base vacía los datos reales que necesita la web para funcionar: los niveles de servicio.
 * Uso: npm run db:seed
 *
 * No crea clientes, pedidos ni certificados de ejemplo: todo lo que aparece en la web viene de datos reales.
 * Es seguro repetirlo: si los niveles ya existen no hace nada.
 */
import { existsSync } from 'node:fs';
import { SERVICE_TIERS } from '../src/data/serviceTiers.js';
import { createDb } from './client.js';
import * as s from './schema.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error('Define DATABASE_URL (o MIGRATION_DATABASE_URL) en .env');
if (process.env.VERCEL_ENV === 'production') throw new Error('El seed no se ejecuta en producción');

const db = createDb(url);
const cents = (eur: number) => Math.round(eur * 100);

async function main() {
  const existing = await db.select({ code: s.serviceTiers.code }).from(s.serviceTiers).limit(1);
  if (existing.length > 0) {
    console.log('Los niveles de servicio ya existen. No se hace nada.');
    return;
  }

  await db.insert(s.serviceTiers).values(
    SERVICE_TIERS.map((svc, i) => ({
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
  );
  console.log(`Seed completado: ${SERVICE_TIERS.length} niveles de servicio.`);
}

try {
  await main();
} finally {
  await db.$client.end();
}
