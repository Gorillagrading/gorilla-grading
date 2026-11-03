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
  return drizzle(createClient(url, options), { schema });
}

function createClient(url: string, options: { max?: number } = {}) {
  return postgres(url, {
    prepare: false,
    max: options.max ?? 1,
    // En funciones serverless el pooler cierra las conexiones que llevan rato quietas: se cierran antes por nuestro lado
    // y no se reutilizan viejas, para que una consulta no se quede esperando en una conexión muerta.
    connect_timeout: 10,
    idle_timeout: 15,
    max_lifetime: 60 * 5,
  });
}

/**
 * Tiempo máximo sin usar la conexión compartida antes de abrir otra. Vercel congela la función entre visitas y,
 * mientras está congelada, los temporizadores de `idle_timeout` no corren: el pooler cierra la conexión y la
 * siguiente consulta se quedaría esperando para siempre en una conexión muerta. El reloj real sí avanza.
 */
const MAX_IDLE_MS = 10_000;

let shared: { client: ReturnType<typeof postgres>; db: Database; lastUsed: number } | undefined;

/** Conexión compartida del proceso, creada al primer uso y renovada si lleva un rato sin usarse. */
export function getDb(): Database {
  const now = Date.now();
  if (shared && now - shared.lastUsed > MAX_IDLE_MS) {
    // Lo que siga en curso tiene 30 s para terminar; la conexión vieja no se vuelve a usar.
    void shared.client.end({ timeout: 30 }).catch(() => {});
    shared = undefined;
  }
  if (!shared) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL no está definida');
    const client = createClient(url);
    shared = { client, db: drizzle(client, { schema }), lastUsed: now };
  }
  shared.lastUsed = now;
  return shared.db;
}
