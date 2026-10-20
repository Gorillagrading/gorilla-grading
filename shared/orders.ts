/**
 * Contratos para presupuestar y enviar un pedido. Los importes son siempre céntimos enteros.
 * El cliente nunca envía precios: solo qué servicio quiere y el valor declarado de cada carta.
 */
import { z } from 'zod';
import { ShippingMethod } from './domain';

/** Métodos de devolución que se pueden elegir hoy. VAULT_STORE existe en la base pero aún no se ofrece. */
export const SubmittableShippingMethod = ShippingMethod.extract(['COURIER_INSURED', 'CARD_SHOW_DROPOFF']);
export type SubmittableShippingMethod = z.infer<typeof SubmittableShippingMethod>;

export const MAX_CARDS_PER_ORDER = 500;

const text = (max: number) => z.string().trim().max(max);

export const QuoteBody = z.object({
  items: z
    .array(
      z.object({
        /** Código del servicio: standard, premium, express o event. */
        tier: z.string().trim().min(1).max(32),
        declaredValueCents: z.number().int().min(0).max(100_000_000),
      }),
    )
    .min(1)
    .max(MAX_CARDS_PER_ORDER),
  shippingMethod: SubmittableShippingMethod,
});
export type QuoteBody = z.infer<typeof QuoteBody>;

export const ShippingAddressInput = z.object({
  line1: text(200).min(1),
  line2: text(200).optional(),
  city: text(120).min(1),
  postalCode: text(20).min(1),
  region: text(120).optional(),
  /** ISO 3166-1 alpha-2, por ejemplo ES, PT o FR. */
  countryCode: z.string().trim().length(2).toUpperCase(),
  phone: text(40).optional(),
});
export type ShippingAddressInput = z.infer<typeof ShippingAddressInput>;

export const CreateOrderBody = z
  .object({
    items: z
      .array(
        z.object({
          tier: z.string().trim().min(1).max(32),
          cardName: text(200).min(1),
          game: text(80).min(1),
          setName: text(200).optional(),
          year: z.number().int().min(1800).max(2100).optional(),
          language: text(40).optional(),
          declaredValueCents: z.number().int().min(0).max(100_000_000),
          notes: text(500).optional(),
        }),
      )
      .min(1)
      .max(MAX_CARDS_PER_ORDER),
    shippingMethod: SubmittableShippingMethod,
    /** Nombre de quien envía. Obligatorio siempre; para la mensajería también es el destinatario. */
    fullName: text(120).min(1),
    /** Obligatoria si la devolución es por mensajería. */
    shippingAddress: ShippingAddressInput.optional(),
    locale: z.enum(['es', 'en']).default('es'),
    /** Identificador que genera el navegador una vez por pedido: reenviarlo no crea un pedido nuevo. */
    clientToken: z.string().trim().min(8).max(64),
    acceptedTerms: z.literal(true),
    confirmedDeclaredValues: z.literal(true),
  })
  .refine((o) => o.shippingMethod !== 'COURIER_INSURED' || !!o.shippingAddress, {
    path: ['shippingAddress'],
    message: 'La dirección es obligatoria para la devolución por mensajería.',
  });
export type CreateOrderBody = z.infer<typeof CreateOrderBody>;

/** Motivos por los que un pedido no se puede enviar. La web los traduce a mensajes. */
export type QuoteIssue =
  | { code: 'unknown_tier'; index: number; tier: string }
  | { code: 'declared_value_required'; index: number }
  | { code: 'declared_value_exceeds_limit'; index: number; tier: string; maxCents: number; declaredValueCents: number }
  | { code: 'event_tier_requires_dropoff'; index: number; tier: string };

export interface QuoteLine {
  tier: string;
  name: string;
  count: number;
  /** Precio de lista de una carta, con IVA incluido. */
  listUnitCents: number;
  /** Precio de una carta tras el descuento por volumen. */
  unitCents: number;
  totalCents: number;
}

export interface QuoteDto {
  itemCount: number;
  /** Descuento por volumen, de 0 a 1. */
  discountRate: number;
  lines: QuoteLine[];
  listSubtotalCents: number;
  discountCents: number;
  subtotalCents: number;
  /** El seguro está incluido en el precio del servicio: no se cobra aparte. */
  insuranceCents: 0;
  shippingCents: number;
  /** Lo que paga el cliente, IVA incluido. */
  totalCents: number;
  vatRate: number;
  /** Parte del total que es base imponible y parte que es IVA. Suman `totalCents`. */
  vatBaseCents: number;
  vatCents: number;
}

export interface QuoteResponse {
  quote: QuoteDto;
  /** Si hay avisos, el pedido no se puede enviar hasta corregirlos. */
  issues: QuoteIssue[];
}

export interface CreatedOrderDto {
  code: string;
  status: 'SUBMITTED';
  paymentStatus: 'unpaid';
  itemCount: number;
  totalCents: number;
  shippingMethod: SubmittableShippingMethod;
  /** True si el pedido ya existía (el mismo `clientToken` se envió dos veces). */
  alreadyExisted: boolean;
}
