import { Hono } from 'hono';
import { AdminOrdersQuery, STAFF_ROLES, ShipmentBody, TransitionBody } from '../../shared/admin.js';
import { requireRole, requireUser } from '../auth/middleware.js';
import type { AppEnv, Deps } from '../context.js';
import { flushOutbox } from '../domain/outbox.js';
import { addShipment, getAdminOrder, listAdminOrders, transitionOrder } from '../domain/admin-orders.js';
import { clientIp, parseJson } from '../http.js';
import { ProblemError } from '../problem.js';

/**
 * Panel del laboratorio. Todo exige sesión y un rol del personal; el control fino de quién
 * puede cada cambio de estado está en server/domain/order-flow.ts. Nada de aquí es cacheable.
 */
export function adminRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();
  const staff = [requireUser(deps), requireRole(...STAFF_ROLES)] as const;

  routes.use('/admin/*', async (c, next) => {
    c.header('Cache-Control', 'private, no-store');
    await next();
  });

  routes.get('/admin/orders', ...staff, async (c) => {
    const parsed = AdminOrdersQuery.safeParse(c.req.query());
    if (!parsed.success) {
      throw new ProblemError(422, 'Validation Error', 'Los filtros no son válidos.', { code: 'validation_error' });
    }
    return c.json(await listAdminOrders(deps.getDb(), parsed.data));
  });

  routes.get('/admin/orders/:code', ...staff, async (c) =>
    c.json({ order: await getAdminOrder(deps.getDb(), c.get('user'), c.req.param('code')) }),
  );

  routes.post('/admin/orders/:code/transitions', ...staff, async (c) => {
    const body = await parseJson(c, TransitionBody);
    const detail = await transitionOrder(deps.getDb(), c.get('user'), c.req.param('code'), body, { ip: clientIp(c) });
    await flushOutbox(deps);
    return c.json({ order: detail });
  });

  routes.post('/admin/orders/:code/shipments', ...staff, async (c) => {
    const body = await parseJson(c, ShipmentBody);
    const detail = await addShipment(deps.getDb(), c.get('user'), c.req.param('code'), body, { ip: clientIp(c) });
    return c.json({ order: detail }, 201);
  });

  return routes;
}
