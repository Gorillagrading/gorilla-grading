import { Hono } from 'hono';
import { requireUser } from '../auth/middleware.js';
import type { AppEnv, Deps } from '../context.js';
import { getOrderResults } from '../domain/item-images.js';
import { listUserOrders } from '../domain/orders.js';
import { listUserVault } from '../domain/vault.js';

/** Datos del dashboard. Todo se filtra por el usuario de la sesión; nunca se acepta un id de usuario del cliente. */
export function accountRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();
  const signedIn = requireUser(deps);

  routes.get('/orders', signedIn, async (c) =>
    c.json({ orders: await listUserOrders(deps.getDb(), c.get('user').id) }),
  );

  // Resultados de un pedido propio: nota, subnotas y fotos, solo cuando ya salió del laboratorio.
  routes.get('/orders/:code/results', signedIn, async (c) => {
    c.header('Cache-Control', 'private, no-store');
    return c.json({ results: await getOrderResults(deps.getDb(), deps.storage, c.get('user').id, c.req.param('code')) });
  });

  routes.get('/me/cards', signedIn, async (c) =>
    c.json({ cards: await listUserVault(deps.getDb(), c.get('user').id) }),
  );

  return routes;
}
