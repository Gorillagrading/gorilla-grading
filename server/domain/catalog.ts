import { and, desc, isNull, lte, or, gt } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { serviceTiers } from '../../db/schema.js';
import type { TierPricing } from './pricing.js';

export type ActiveTier = TierPricing & { id: string };

/**
 * Servicios que se pueden contratar ahora, por código. Si un servicio tiene varias versiones
 * (cambió de precio), se usa la vigente más reciente.
 */
export async function loadActiveTiers(db: Db, now = new Date()): Promise<Map<string, ActiveTier>> {
  const rows = await db
    .select()
    .from(serviceTiers)
    .where(and(lte(serviceTiers.validFrom, now), or(isNull(serviceTiers.validTo), gt(serviceTiers.validTo, now))))
    .orderBy(desc(serviceTiers.version));

  const tiers = new Map<string, ActiveTier>();
  for (const row of rows) {
    if (tiers.has(row.code)) continue;
    tiers.set(row.code, {
      id: row.id,
      code: row.code,
      name: row.name,
      priceCents: row.priceCents,
      maxDeclaredValueCents: row.maxDeclaredValueCents,
      eventOnly: row.eventOnly,
    });
  }
  return tiers;
}
