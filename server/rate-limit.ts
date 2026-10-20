import { and, count, eq, gte } from 'drizzle-orm';
import type { Db } from '../db/client';
import { rateLimitEvents } from '../db/schema';
import { hashIp } from './auth/crypto';
import { tooManyRequests } from './problem';

/**
 * Limita cuántas veces puede usar un cliente un endpoint público en una ventana de tiempo.
 * Cada llamada cuenta, también las que acaban en error. Se guarda solo el hash de la clave.
 */
export async function enforceRateLimit(
  db: Db,
  rule: { bucket: string; key: string; limit: number; windowMs: number },
  now = new Date(),
) {
  const keyHash = hashIp(rule.key);
  const since = new Date(now.getTime() - rule.windowMs);

  const [{ n }] = await db
    .select({ n: count() })
    .from(rateLimitEvents)
    .where(
      and(
        eq(rateLimitEvents.bucket, rule.bucket),
        eq(rateLimitEvents.keyHash, keyHash),
        gte(rateLimitEvents.createdAt, since),
      ),
    );
  if (n >= rule.limit) throw tooManyRequests(Math.ceil(rule.windowMs / 2000));

  await db.insert(rateLimitEvents).values({ bucket: rule.bucket, keyHash, createdAt: now });
}
