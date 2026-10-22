import Stripe from 'stripe';
import { ProblemError } from '../problem.js';

/** Una línea de la página de pago: lo que el cliente ve desglosado antes de pagar. */
export interface CheckoutLine {
  name: string;
  unitCents: number;
  quantity: number;
}

export interface CheckoutRequest {
  orderCode: string;
  email: string;
  locale: 'es' | 'en';
  lines: CheckoutLine[];
  successUrl: string;
  cancelUrl: string;
}

/** Lo justo de un aviso (webhook) de la pasarela para procesarlo. */
export interface PaymentEvent {
  id: string;
  type: string;
  object: Record<string, unknown>;
}

/** La pasarela de pago, aislada detrás de esta interfaz para poder sustituirla en las pruebas. */
export interface PaymentGateway {
  /** Crea la página de pago y devuelve su id y la dirección a la que llevar al cliente. */
  createCheckout(request: CheckoutRequest): Promise<{ id: string; url: string }>;
  /** Comprueba la firma de un aviso y lo devuelve. Lanza 400 si la firma no es válida. */
  parseWebhook(rawBody: string, signature: string | undefined): PaymentEvent;
  /** Dirección del recibo de un cobro (justificante de pago de Stripe), o null si no lo tiene. */
  getReceiptUrl(paymentIntentId: string): Promise<string | null>;
}

const badSignature = () =>
  new ProblemError(400, 'Bad Request', 'La firma del aviso no es válida.', { code: 'invalid_signature' });

/**
 * Stripe Checkout: Stripe aloja la página de pago, así que los datos de la tarjeta nunca pasan
 * por nuestros servidores. Los métodos de pago (tarjeta, Apple Pay, Google Pay…) se eligen en
 * el panel de Stripe, no aquí.
 */
export function createStripeGateway(secretKey: string, webhookSecret: string | undefined): PaymentGateway {
  const stripe = new Stripe(secretKey);
  return {
    async createCheckout(r) {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: r.email,
        client_reference_id: r.orderCode,
        locale: r.locale,
        line_items: r.lines.map((l) => ({
          quantity: l.quantity,
          price_data: { currency: 'eur', unit_amount: l.unitCents, product_data: { name: l.name } },
        })),
        metadata: { orderCode: r.orderCode },
        payment_intent_data: { metadata: { orderCode: r.orderCode }, description: `Gorilla Grading ${r.orderCode}` },
        success_url: r.successUrl,
        cancel_url: r.cancelUrl,
      });
      if (!session.url) throw new Error('Stripe no devolvió la dirección de pago');
      return { id: session.id, url: session.url };
    },

    parseWebhook(rawBody, signature) {
      if (!webhookSecret) {
        throw new ProblemError(503, 'Service Unavailable', 'Falta el secreto de los avisos de Stripe.', { code: 'webhook_unavailable' });
      }
      if (!signature) throw badSignature();
      try {
        const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        return { id: event.id, type: event.type, object: event.data.object as unknown as Record<string, unknown> };
      } catch {
        throw badSignature();
      }
    },

    async getReceiptUrl(paymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] });
      const charge = intent.latest_charge;
      return charge && typeof charge === 'object' ? (charge.receipt_url ?? null) : null;
    },
  };
}

/**
 * La pasarela de producción. El cobro se activa solo con las DOS claves: sin el secreto de los avisos
 * los pedidos quedarían pendientes de pago para siempre, porque nunca llegaría la confirmación.
 * Sin ellas no se cobra y los pedidos quedan registrados al enviarse (desarrollo).
 */
export function paymentGatewayFromEnv(): PaymentGateway | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (key && !webhookSecret) console.warn('[pagos] STRIPE_SECRET_KEY sin STRIPE_WEBHOOK_SECRET: el cobro queda desactivado');
  return key && webhookSecret ? createStripeGateway(key, webhookSecret) : null;
}
