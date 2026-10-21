import { Hono } from 'hono';
import { AdminOrdersQuery, STAFF_ROLES, ShipmentBody, TransitionBody } from '../../shared/admin.js';
import { GradingBody, RejectGradingBody } from '../../shared/grading-admin.js';
import { requireRole, requireUser } from '../auth/middleware.js';
import type { AppEnv, Deps } from '../context.js';
import { flushOutbox } from '../domain/outbox.js';
import { approveGrading, rejectGrading, saveGrading } from '../domain/grading-results.js';
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

  // Resultado de graduación de una carta. La posición es el número de carta dentro del pedido (#01 = 1).
  const grader = [requireUser(deps), requireRole('grader', 'admin')] as const;
  const qa = [requireUser(deps), requireRole('qa', 'admin')] as const;
  const position = (c: { req: { param: (name: string) => string } }) => {
    const n = Number(c.req.param('position'));
    if (!Number.isInteger(n) || n < 1) throw new ProblemError(404, 'Not Found', 'No existe esa carta en el pedido.', { code: 'item_not_found' });
    return n;
  };

  routes.put('/admin/orders/:code/items/:position/grading', ...grader, async (c) => {
    const body = await parseJson(c, GradingBody);
    const grading = await saveGrading(deps.getDb(), c.get('user'), c.req.param('code'), position(c), body, { ip: clientIp(c) });
    return c.json({ grading });
  });

  routes.post('/admin/orders/:code/items/:position/grading/approve', ...qa, async (c) => {
    const grading = await approveGrading(deps.getDb(), c.get('user'), c.req.param('code'), position(c), { ip: clientIp(c) });
    return c.json({ grading });
  });

  routes.post('/admin/orders/:code/items/:position/grading/reject', ...qa, async (c) => {
    const body = await parseJson(c, RejectGradingBody);
    const grading = await rejectGrading(deps.getDb(), c.get('user'), c.req.param('code'), position(c), body.reason, { ip: clientIp(c) });
    return c.json({ grading });
  });

  return routes;
}
