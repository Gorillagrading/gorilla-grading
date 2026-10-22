import { Hono } from 'hono';
import { CreateOrderBody, QuoteBody, type QuoteResponse } from '../../shared/orders.js';
import { requireUser } from '../auth/middleware.js';
import type { AppEnv, Deps } from '../context.js';
import { loadActiveTiers } from '../domain/catalog.js';
import { computeQuote } from '../domain/pricing.js';
import { flushOutbox } from '../domain/outbox.js';
import { checkoutForOwner } from '../domain/payments.js';
import { createOrder } from '../domain/submit-order.js';
import { clientIp, parseJson } from '../http.js';
import { ProblemError } from '../problem.js';
import { enforceRateLimit } from '../rate-limit.js';

const QUOTES_PER_WINDOW = 300;
const ORDERS_PER_WINDOW = 20;
const WINDOW_MS = 10 * 60_000;

export function orderRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();
  const signedIn = requireUser(deps);

  // Público: calcula el precio de un pedido. La web lo usa para mostrar siempre el mismo total que se cobrará.
  routes.post('/quotes', async (c) => {
    const db = deps.getDb();
    await enforceRateLimit(db, { bucket: 'quotes', key: clientIp(c) ?? 'unknown', limit: QUOTES_PER_WINDOW, windowMs: WINDOW_MS });
    const body = await parseJson(c, QuoteBody);
    const { quote, issues } = computeQuote(body, await loadActiveTiers(db));
    return c.json<QuoteResponse>({ quote, issues });
  });

  // Crea un pedido enviado a nombre del usuario de la sesión. Todavía no se cobra.
  routes.post('/orders', signedIn, async (c) => {
    const db = deps.getDb();
    const user = c.get('user');
    await enforceRateLimit(db, { bucket: 'orders', key: user.id, limit: ORDERS_PER_WINDOW, windowMs: WINDOW_MS });
    const body = await parseJson(c, CreateOrderBody);
    const order = await createOrder(db, user, body, { ip: clientIp(c), requirePayment: !!deps.payments });
    if (!order.alreadyExisted) await flushOutbox(deps);

    // Con cobro: se abre la página de pago. Si Stripe falla, el pedido queda pendiente y se paga luego.
    let checkoutUrl: string | null = null;
    if (deps.payments && order.status === 'PAYMENT_PENDING' && order.paymentStatus !== 'paid') {
      try {
        checkoutUrl = await checkoutForOwner(db, deps.payments, user.id, order.code);
      } catch (error) {
        console.error('[pagos] no se pudo abrir la página de pago', order.code, error instanceof Error ? error.message : error);
      }
    }
    return c.json({ order: { ...order, checkoutUrl } }, order.alreadyExisted ? 200 : 201);
  });

  // Pagar (o volver a intentar pagar) un pedido propio que sigue pendiente de pago.
  routes.post('/orders/:code/checkout', signedIn, async (c) => {
    if (!deps.payments) {
      throw new ProblemError(503, 'Service Unavailable', 'El cobro no está configurado.', { code: 'payments_unavailable' });
    }
    const db = deps.getDb();
    const user = c.get('user');
    await enforceRateLimit(db, { bucket: 'checkout', key: user.id, limit: ORDERS_PER_WINDOW, windowMs: WINDOW_MS });
    const checkoutUrl = await checkoutForOwner(db, deps.payments, user.id, c.req.param('code'));
    c.header('Cache-Control', 'no-store');
    return c.json({ checkoutUrl });
  });

  return routes;
}
