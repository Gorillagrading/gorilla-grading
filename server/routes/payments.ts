import { Hono } from 'hono';
import type { AppEnv, Deps } from '../context.js';
import { flushOutbox } from '../domain/outbox.js';
import { handlePaymentEvent } from '../domain/payments.js';
import { ProblemError } from '../problem.js';

/**
 * Avisos (webhooks) de Stripe. No llevan sesión: la autenticidad la da la firma del aviso,
 * que se comprueba con STRIPE_WEBHOOK_SECRET antes de tocar nada.
 */
export function paymentRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();

  routes.post('/payments/stripe/webhook', async (c) => {
    if (!deps.payments) {
      throw new ProblemError(503, 'Service Unavailable', 'El cobro no está configurado.', { code: 'payments_unavailable' });
    }
    // La firma se calcula sobre el cuerpo exacto: se lee como texto, sin interpretarlo antes.
    const raw = await c.req.text();
    const event = deps.payments.parseWebhook(raw, c.req.header('stripe-signature'));
    const result = await handlePaymentEvent(deps.getDb(), event);
    await flushOutbox(deps);
    return c.json({ received: true, result });
  });

  return routes;
}
