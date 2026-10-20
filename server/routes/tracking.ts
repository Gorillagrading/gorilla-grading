import { Hono } from 'hono';
import { currentUser } from '../auth/middleware.js';
import type { AppEnv, Deps } from '../context.js';
import { findTracking } from '../domain/tracking.js';
import { clientIp } from '../http.js';
import { ProblemError } from '../problem.js';
import { enforceRateLimit } from '../rate-limit.js';

const LOOKUPS_PER_WINDOW = 60;
const WINDOW_MS = 10 * 60_000;

export function trackingRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();

  // Público: sirve para ver el estado de un pedido con su código o su número de seguimiento.
  routes.get('/tracking/:query', async (c) => {
    const db = deps.getDb();
    await enforceRateLimit(db, {
      bucket: 'tracking',
      key: clientIp(c) ?? 'unknown',
      limit: LOOKUPS_PER_WINDOW,
      windowMs: WINDOW_MS,
    });

    const viewer = await currentUser(deps, c);
    const tracking = await findTracking(db, c.req.param('query'), viewer?.id ?? null);
    if (!tracking) {
      throw new ProblemError(404, 'Not Found', 'No hemos encontrado ningún pedido con ese código.', {
        code: 'order_not_found',
      });
    }

    // La respuesta cambia según quién pregunte, así que no se guarda en cachés compartidas.
    c.header('Cache-Control', 'private, no-store');
    return c.json({ tracking });
  });

  return routes;
}
