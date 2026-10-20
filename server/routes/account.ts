import { Hono } from 'hono';
import { requireUser } from '../auth/middleware';
import type { AppEnv, Deps } from '../context';
import { listUserOrders } from '../domain/orders';
import { listUserVault } from '../domain/vault';

/** Datos del dashboard. Todo se filtra por el usuario de la sesión; nunca se acepta un id de usuario del cliente. */
export function accountRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();
  const signedIn = requireUser(deps);

  routes.get('/orders', signedIn, async (c) =>
    c.json({ orders: await listUserOrders(deps.getDb(), c.get('user').id) }),
  );

  routes.get('/me/cards', signedIn, async (c) =>
    c.json({ cards: await listUserVault(deps.getDb(), c.get('user').id) }),
  );

  return routes;
}
