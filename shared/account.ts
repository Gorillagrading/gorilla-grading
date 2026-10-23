/**
 * Contratos del dashboard de la cuenta. Solo tipos: el frontend los importa con `import type`.
 */
import type { OrderStatus } from './domain.js';

export interface OrderSummaryDto {
  /** Código visible del pedido, por ejemplo GGI-ORD-7K4M9Q. */
  code: string;
  status: OrderStatus;
  /** Fecha de envío del pedido (ISO 8601). */
  submittedAt: string;
  itemCount: number;
  firstCardName: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  /** Fecha estimada de finalización, YYYY-MM-DD. */
  estimatedCompletionAt: string | null;
}

export interface CardDefectDto {
  id: string;
  category: 'Centering' | 'Corners' | 'Edges' | 'Surface';
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'critical' | 'flawless';
  /** Cara de la carta en la que está el defecto; las coordenadas son sobre la foto de esa cara. */
  side: 'front' | 'back';
  x: number;
  y: number;
  deduction: number;
}

/** Carta certificada de la bóveda del usuario. Tiene la misma forma que `GradedCard` del frontend. */
export interface GradedCardDto {
  id: string;
  certNumber: string;
  name: string;
  set: string;
  year: number;
  cardNumber: string;
  rarity: string;
  game: string;
  language: string;
  grade: number;
  gradeLabel: string;
  subgrades: {
    centering: { score: number; frontRatio: string; backRatio: string; description: string };
    corners: { score: number; frontScore: number; backScore: number; description: string };
    edges: { score: number; frontScore: number; backScore: number; description: string };
    surface: { score: number; frontScore: number; backScore: number; description: string };
  };
  frontImage: string;
  backImage: string;
  slabMockupImage?: string;
  defects: CardDefectDto[];
  population: { totalGraded: number; higherCount: number; equalCount: number };
  certDate: string;
  verifier: string;
  /** Firma del certificado. Vacía hasta que se emitan certificados firmados (Fase 7). */
  securityHash: string;
  /** Valor declarado por el dueño. Solo se envía a su propietario, nunca en la verificación pública. */
  declaredValueEur: number;
  isAuthentic: boolean;
}

/**
 * Un pago cobrado del cliente con el desglose del pedido. Es un justificante de pago, no una factura:
 * no lleva datos fiscales de la empresa ni numeración de factura.
 */
export interface PaymentReceiptDto {
  orderCode: string;
  amountCents: number;
  currency: string;
  status: 'paid' | 'refunded' | 'partially_refunded';
  paidAt: string;
  /** Recibo oficial de Stripe, si ya se obtuvo. */
  receiptUrl: string | null;
  /** Servicios del pedido agrupados por nivel y precio unitario (ya con el descuento por volumen aplicado). */
  lines: { tierName: string; quantity: number; unitCents: number }[];
  /** Cómo se compone el total. El IVA y el seguro ya van incluidos en el precio de los servicios. */
  breakdown: { insuranceCents: number; shippingCents: number; baseCents: number; vatCents: number; totalCents: number };
  customer: { name: string | null; email: string };
}
