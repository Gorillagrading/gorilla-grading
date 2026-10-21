import { Hono } from 'hono';
import { CreateOrderBody, QuoteBody, type QuoteResponse } from '../../shared/orders.js';
import { requireUser } from '../auth/middleware.js';
import type { AppEnv, Deps } from '../context.js';
import { loadActiveTiers } from '../domain/catalog.js';
import { computeQuote } from '../domain/pricing.js';
import { flushOutbox } from '../domain/outbox.js';
import { createOrder } from '../domain/submit-order.js';
import { clientIp, parseJson } from '../http.js';
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
    const order = await createOrder(db, user, body, { ip: clientIp(c) });
    if (!order.alreadyExisted) await flushOutbox(deps);
    return c.json({ order }, order.alreadyExisted ? 200 : 201);
  });

  return routes;
}
