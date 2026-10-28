/**
 * Motor de precios. Es la única fuente de verdad: la web solo muestra lo que devuelve.
 * Reglas decididas por el negocio (2026-10-20):
 *   - IVA del 21 % incluido en el precio de lista.
 *   - Seguro incluido en el precio del servicio: cada carta queda asegurada hasta el máximo de su nivel
 *     (el cliente no declara el valor de cada carta; decisión del 2026-10-28).
 *   - Devolución por mensajería asegurada: 14,50 € aparte. Entrega en evento: gratis.
 *   - Descuento por volumen sobre el número total de cartas del pedido: 5 % desde 10,
 *     8 % desde 25 y 12 % desde 50.
 */
import type { QuoteBody, QuoteDto, QuoteIssue, QuoteLine, SubmittableShippingMethod } from '../../shared/orders.js';

export const VAT_RATE = 0.21;
export const COURIER_RETURN_CENTS = 1450;

const VOLUME_DISCOUNTS = [
  { minCards: 50, rate: 0.12 },
  { minCards: 25, rate: 0.08 },
  { minCards: 10, rate: 0.05 },
];

export function volumeDiscountRate(cardCount: number): number {
  return VOLUME_DISCOUNTS.find((d) => cardCount >= d.minCards)?.rate ?? 0;
}

export interface TierPricing {
  code: string;
  name: string;
  priceCents: number;
  maxDeclaredValueCents: number;
  /** Solo se puede usar con entrega en mano en un evento oficial. */
  eventOnly: boolean;
}

export const shippingCents = (method: SubmittableShippingMethod) =>
  method === 'COURIER_INSURED' ? COURIER_RETURN_CENTS : 0;

/** Precio de una carta tras el descuento, en céntimos enteros. */
export const discountedUnitCents = (listCents: number, rate: number) => Math.round(listCents * (1 - rate));

export function computeQuote(
  input: QuoteBody,
  tiers: ReadonlyMap<string, TierPricing>,
): { quote: QuoteDto; issues: QuoteIssue[] } {
  const issues: QuoteIssue[] = [];
  const itemCount = input.items.length;
  const discountRate = volumeDiscountRate(itemCount);

  const byTier = new Map<string, { tier: TierPricing; count: number }>();
  input.items.forEach((item, index) => {
    const tier = tiers.get(item.tier);
    if (!tier) {
      issues.push({ code: 'unknown_tier', index, tier: item.tier });
      return;
    }
    if (tier.eventOnly && input.shippingMethod !== 'CARD_SHOW_DROPOFF') {
      issues.push({ code: 'event_tier_requires_dropoff', index, tier: tier.code });
    }
    const entry = byTier.get(tier.code) ?? { tier, count: 0 };
    entry.count += 1;
    byTier.set(tier.code, entry);
  });

  const lines: QuoteLine[] = [...byTier.values()].map(({ tier, count }) => {
    const unitCents = discountedUnitCents(tier.priceCents, discountRate);
    return {
      tier: tier.code,
      name: tier.name,
      count,
      listUnitCents: tier.priceCents,
      unitCents,
      totalCents: unitCents * count,
    };
  });

  const listSubtotalCents = lines.reduce((sum, l) => sum + l.listUnitCents * l.count, 0);
  const subtotalCents = lines.reduce((sum, l) => sum + l.totalCents, 0);
  const shipping = shippingCents(input.shippingMethod);
  const totalCents = subtotalCents + shipping;
  const vatBaseCents = Math.round(totalCents / (1 + VAT_RATE));

  return {
    quote: {
      itemCount,
      discountRate,
      lines,
      listSubtotalCents,
      discountCents: listSubtotalCents - subtotalCents,
      subtotalCents,
      insuranceCents: 0,
      shippingCents: shipping,
      totalCents,
      vatRate: VAT_RATE,
      vatBaseCents,
      vatCents: totalCents - vatBaseCents,
    },
    issues,
  };
}
