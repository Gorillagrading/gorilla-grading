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

/**
 * Una consulta que tarda más que esto se da por colgada en una conexión muerta: con una sola conexión, todas las
 * peticiones que llegan detrás esperarían para siempre en su cola. Se tira la conexión (la consulta colgada falla)
 * y la siguiente petición abre otra. Las transacciones tienen más margen.
 */
const QUERY_STALL_MS = 10_000;
const TRANSACTION_STALL_MS = 30_000;

type Client = ReturnType<typeof postgres>;
let shared: { client: Client; db: Database; lastUsed: number } | undefined;

function discard(client: Client) {
  if (shared?.client !== client) return;
  shared = undefined;
  // Sin espera: lo que siga en esta conexión falla ya en vez de quedarse colgado.
  void client.end({ timeout: 0 }).catch(() => {});
}

/** Si la consulta (o transacción) no termina a tiempo, se tira la conexión. */
function guard<T>(work: PromiseLike<T>, client: Client, ms: number): PromiseLike<T> {
  const timer = setTimeout(() => {
    console.error(`[db] una consulta lleva más de ${ms / 1000} s: se descarta la conexión`);
    discard(client);
  }, ms);
  Promise.resolve(work).then(
    () => clearTimeout(timer),
    () => clearTimeout(timer),
  );
  return work;
}

/** El cliente de postgres con el vigilante puesto en cada consulta y en cada transacción. */
function watched(client: Client): Client {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === 'unsafe') {
        return (...args: Parameters<Client['unsafe']>) => {
          const query = target.unsafe(...args);
          // En un microtask: drizzle ya ha elegido el modo (`.values()`) y ya la está esperando.
          queueMicrotask(() => guard(query, client, QUERY_STALL_MS));
          return query;
        };
      }
      if (prop === 'begin') {
        return (...args: unknown[]) => guard((target.begin as (...a: unknown[]) => PromiseLike<unknown>)(...args), client, TRANSACTION_STALL_MS);
      }
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

/** Conexión compartida del proceso, creada al primer uso y renovada si lleva un rato sin usarse o se cuelga. */
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
    shared = { client, db: drizzle(watched(client), { schema }), lastUsed: now };
  }
  shared.lastUsed = now;
  return shared.db;
}
