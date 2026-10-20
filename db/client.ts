import type { PgDatabase } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type Database = ReturnType<typeof createDb>;

/** Tipo común a la conexión de producción (postgres-js) y a la de las pruebas (PGlite). */
export type Db = PgDatabase<any, typeof schema>;

/**
 * `prepare: false` es obligatorio con el pooler de Supabase en modo
 * transacción (puerto 6543), que es el que se usa desde Vercel Functions.
 */
export function createDb(url: string, options: { max?: number } = {}) {
  const client = postgres(url, { prepare: false, max: options.max ?? 1 });
  return drizzle(client, { schema });
}

let db: Database | undefined;

/** Conexión compartida del proceso, creada al primer uso. */
export function getDb(): Database {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL no está definida');
    db = createDb(url);
  }
  return db;
}
