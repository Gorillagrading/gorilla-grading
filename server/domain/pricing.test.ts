import { describe, expect, it } from 'vitest';
import type { QuoteBody } from '../../shared/orders.js';
import { computeQuote, discountedUnitCents, volumeDiscountRate, type TierPricing } from './pricing.js';

const tiers = new Map<string, TierPricing>(
  [
    { code: 'standard', name: 'Standard', priceCents: 1900, maxDeclaredValueCents: 50_000, eventOnly: false },
    { code: 'premium', name: 'Premium', priceCents: 2500, maxDeclaredValueCents: 150_000, eventOnly: false },
    { code: 'express', name: 'Express', priceCents: 5000, maxDeclaredValueCents: 300_000, eventOnly: false },
    { code: 'event', name: 'Event', priceCents: 1500, maxDeclaredValueCents: 100_000, eventOnly: true },
  ].map((t) => [t.code, t]),
);

const cards = (n: number, tier = 'standard'): QuoteBody['items'] => Array.from({ length: n }, () => ({ tier }));

const quote = (items: QuoteBody['items'], shippingMethod: QuoteBody['shippingMethod'] = 'COURIER_INSURED') =>
  computeQuote({ items, shippingMethod }, tiers);

describe('descuento por volumen', () => {
  it.each([
    [1, 0], [9, 0], [10, 0.05], [24, 0.05], [25, 0.08], [49, 0.08], [50, 0.12], [500, 0.12],
  ])('%i cartas -> %d', (count, rate) => {
    expect(volumeDiscountRate(count)).toBe(rate);
  });

  it('redondea al céntimo, no al euro', () => {
    expect(discountedUnitCents(1900, 0.05)).toBe(1805);
    expect(discountedUnitCents(2500, 0.08)).toBe(2300);
    expect(discountedUnitCents(1500, 0.12)).toBe(1320);
    expect(discountedUnitCents(1900, 0.12)).toBe(1672);
  });
});

describe('importes', () => {
  it('una carta Standard con mensajería: 19 € + 14,50 € de envío, IVA incluido', () => {
    const { quote: q, issues } = quote(cards(1));
    expect(issues).toEqual([]);
    expect(q).toMatchObject({
      itemCount: 1, discountRate: 0, subtotalCents: 1900, insuranceCents: 0, shippingCents: 1450, totalCents: 3350,
    });
    expect(q.vatBaseCents + q.vatCents).toBe(3350);
    expect(q.vatBaseCents).toBe(2769);
    expect(q.vatCents).toBe(581);
  });

  it('la entrega en evento no cobra envío', () => {
    const { quote: q } = quote(cards(1), 'CARD_SHOW_DROPOFF');
    expect(q.shippingCents).toBe(0);
    expect(q.totalCents).toBe(1900);
  });

  it('el seguro no se cobra aparte: va incluido en el precio del servicio', () => {
    const { quote: q } = quote(cards(1, 'premium'));
    expect(q.insuranceCents).toBe(0);
    expect(q.subtotalCents).toBe(2500);
  });

  it('aplica el descuento a todo el pedido y lo desglosa', () => {
    const { quote: q } = quote(cards(10), 'CARD_SHOW_DROPOFF');
    expect(q).toMatchObject({ discountRate: 0.05, listSubtotalCents: 19_000, subtotalCents: 18_050, discountCents: 950, totalCents: 18_050 });
    expect(q.lines).toEqual([{ tier: 'standard', name: 'Standard', count: 10, listUnitCents: 1900, unitCents: 1805, totalCents: 18_050 }]);
  });

  it('el descuento se calcula con el total de cartas aunque haya varios servicios', () => {
    const items = [...cards(6, 'standard'), ...cards(4, 'premium')];
    const { quote: q } = quote(items, 'CARD_SHOW_DROPOFF');
    expect(q.discountRate).toBe(0.05);
    expect(q.lines.map((l) => [l.tier, l.count, l.unitCents])).toEqual([['standard', 6, 1805], ['premium', 4, 2375]]);
    expect(q.subtotalCents).toBe(6 * 1805 + 4 * 2375);
  });

  it('el descuento no se aplica al envío', () => {
    const { quote: q } = quote(cards(10));
    expect(q.shippingCents).toBe(1450);
    expect(q.totalCents).toBe(18_050 + 1450);
  });

  it('el IVA y la base siempre suman el total', () => {
    for (const n of [1, 3, 7, 10, 25, 50, 123]) {
      for (const method of ['COURIER_INSURED', 'CARD_SHOW_DROPOFF'] as const) {
        const { quote: q } = quote(cards(n, 'express'), method);
        expect(q.vatBaseCents + q.vatCents).toBe(q.totalCents);
      }
    }
  });
});

describe('avisos que impiden enviar el pedido', () => {
  it('un servicio que no existe avisa y no suma al precio', () => {
    const { quote: q, issues } = quote([{ tier: 'platinum' }, ...cards(1)]);
    expect(issues).toEqual([{ code: 'unknown_tier', index: 0, tier: 'platinum' }]);
    expect(q.subtotalCents).toBe(1900);
  });

  it('el servicio Event solo se puede usar con entrega en evento', () => {
    expect(quote(cards(1, 'event')).issues).toEqual([{ code: 'event_tier_requires_dropoff', index: 0, tier: 'event' }]);
    expect(quote(cards(1, 'event'), 'CARD_SHOW_DROPOFF').issues).toEqual([]);
  });

  it('informa de todos los problemas a la vez, cada uno con su carta', () => {
    const { issues } = quote([{ tier: 'standard' }, { tier: 'event' }, { tier: 'nope' }]);
    expect(issues.map((i) => [i.code, i.index])).toEqual([
      ['event_tier_requires_dropoff', 1],
      ['unknown_tier', 2],
    ]);
  });
});
