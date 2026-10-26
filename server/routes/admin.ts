import { Hono } from 'hono';
import { AdminOrdersQuery, STAFF_ROLES, ShipmentBody, TransitionBody } from '../../shared/admin.js';
import { ImageBody } from '../../shared/photos.js';
import { GradingBody, RejectGradingBody } from '../../shared/grading-admin.js';
import { requireRole, requireUser } from '../auth/middleware.js';
import type { AppEnv, Deps } from '../context.js';
import { DashboardQuery } from '../../shared/dashboard.js';
import { getDashboard } from '../domain/dashboard.js';
import { flushOutbox } from '../domain/outbox.js';
import { confirmImage, createImageUpload, deleteImage, listOrderImages } from '../domain/item-images.js';
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
    const detail = await transitionOrder(deps.getDb(), c.get('user'), c.req.param('code'), body, { ip: clientIp(c), getSigner: deps.getSigner });
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

  // Panel de negocio: ingresos, clientes y cartas. Solo para la dirección (rol admin).
  routes.get('/admin/dashboard', requireUser(deps), requireRole('admin'), async (c) => {
    const parsed = DashboardQuery.safeParse(c.req.query());
    if (!parsed.success) {
      throw new ProblemError(422, 'Validation Error', 'El periodo no es válido.', { code: 'validation_error' });
    }
    return c.json(await getDashboard(deps.getDb(), parsed.data.range));
  });

  // Diagnóstico del almacenamiento: prueba cada paso y dice dónde falla. Nunca muestra claves.
  routes.get('/admin/storage-check', requireUser(deps), requireRole('admin'), async (c) => {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
    const env = {
      supabaseUrl: process.env.SUPABASE_URL ?? null,
      bucket: process.env.SUPABASE_BUCKET ?? 'lab-private',
      secretKey: !key ? 'no configurada' : key.startsWith('sb_secret_') ? 'sb_secret_… (nueva)' : key.startsWith('eyJ') ? 'JWT (service_role antigua)' : `formato desconocido (empieza por "${key.slice(0, 4)}…", ${key.length} caracteres)`,
      anonKey: !!process.env.SUPABASE_ANON_KEY,
    };
    const steps: { step: string; ok: boolean; detail?: string }[] = [];
    const probe = 'diagnostico/prueba.txt';
    const attempt = async (step: string, work: () => Promise<unknown>) => {
      try {
        const result = await work();
        steps.push({ step, ok: true, detail: typeof result === 'string' ? result : undefined });
      } catch (error) {
        steps.push({ step, ok: false, detail: error instanceof Error ? error.message : String(error) });
      }
    };
    await attempt('Preparar una subida firmada', async () => (await deps.storage.createUpload(probe, 'text/plain')).url.split('?')[0]);
    await attempt('Comprobar si existe un archivo', async () => String(await deps.storage.exists(probe)));
    // El archivo de prueba no existe: que Supabase conteste "no encontrado" demuestra que la firma funciona.
    await attempt('Firmar un enlace de lectura', async () => {
      try {
        return (await deps.storage.createDownloadUrl(probe, 60)).split('?')[0];
      } catch (error) {
        if (error instanceof Error && /NoSuchKey|not_found|Object not found/.test(error.message)) return 'responde (el archivo de prueba no existe, es lo esperado)';
        throw error;
      }
    });
    c.header('Cache-Control', 'no-store');
    return c.json({ env, steps, ok: steps.every((s) => s.ok) });
  });

  // Fotos de las cartas. Las suben quienes reciben o gradúan; control de calidad solo las mira.
  const photographer = [requireUser(deps), requireRole('staff', 'grader', 'admin')] as const;

  routes.get('/admin/orders/:code/images', ...staff, async (c) =>
    c.json(await listOrderImages(deps.getDb(), deps.storage, c.req.param('code'))),
  );

  routes.post('/admin/orders/:code/items/:position/images', ...photographer, async (c) => {
    const body = await parseJson(c, ImageBody);
    return c.json(await createImageUpload(deps.getDb(), deps.storage, c.req.param('code'), position(c), body), 201);
  });

  routes.post('/admin/orders/:code/items/:position/images/:imageId/confirm', ...photographer, async (c) => {
    const image = await confirmImage(deps.getDb(), deps.storage, c.get('user'), c.req.param('code'), position(c), c.req.param('imageId'), { ip: clientIp(c) });
    return c.json({ image });
  });

  routes.delete('/admin/orders/:code/items/:position/images/:imageId', ...photographer, async (c) => {
    await deleteImage(deps.getDb(), deps.storage, c.get('user'), c.req.param('code'), position(c), c.req.param('imageId'), { ip: clientIp(c) });
    return c.body(null, 204);
  });

  return routes;
}
