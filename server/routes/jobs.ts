import { Hono } from 'hono';
import { safeEqual } from '../auth/crypto.js';
import type { AppEnv, Deps } from '../context.js';
import { advanceDueOrders } from '../domain/automation.js';
import { ProblemError, unauthenticated } from '../problem.js';

/**
 * Tareas programadas. Vercel Cron llama con `Authorization: Bearer <CRON_SECRET>`.
 * Sin CRON_SECRET configurado la ruta no funciona: nunca queda abierta.
 */
export function jobRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();

  routes.get('/jobs/advance-orders', async (c) => {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new ProblemError(503, 'Service Unavailable', 'CRON_SECRET no está configurado.', { code: 'cron_not_configured' });
    }
    if (!safeEqual(c.req.header('authorization') ?? '', `Bearer ${secret}`)) throw unauthenticated();

    const advanced = await advanceDueOrders(deps.getDb());
    c.header('Cache-Control', 'no-store');
    return c.json({ advanced: advanced.length, orders: advanced });
  });

  return routes;
}
