import { Hono } from 'hono';
import type { AppEnv, Deps } from '../context.js';
import { listUpcomingEvents } from '../domain/events.js';

export function eventRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();

  // Público: los próximos eventos con entrega en mano, para el formulario de envío y el calendario.
  routes.get('/events', async (c) => {
    c.header('Cache-Control', 'public, max-age=60');
    return c.json({ events: await listUpcomingEvents(deps.getDb()) });
  });

  return routes;
}
