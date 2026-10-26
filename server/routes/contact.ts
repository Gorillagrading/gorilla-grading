import { Hono } from 'hono';
import { ContactBody } from '../../shared/contact.js';
import { currentUser } from '../auth/middleware.js';
import type { AppEnv, Deps } from '../context.js';
import { submitContactMessage } from '../domain/contact.js';
import { flushOutbox } from '../domain/outbox.js';
import { clientIp, parseJson } from '../http.js';
import { enforceRateLimit } from '../rate-limit.js';

const MESSAGES_PER_WINDOW = 5;
const WINDOW_MS = 60 * 60_000;

export function contactRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();

  // Público: el formulario de contacto. Guarda el mensaje y avisa al equipo y al cliente por correo.
  routes.post('/contact', async (c) => {
    const db = deps.getDb();
    await enforceRateLimit(db, { bucket: 'contact', key: clientIp(c) ?? 'unknown', limit: MESSAGES_PER_WINDOW, windowMs: WINDOW_MS });
    const body = await parseJson(c, ContactBody);

    // Un robot que rellena el campo trampa recibe la misma respuesta, pero no se guarda nada.
    if (body.website) return c.json({ ticket: null }, 201);

    const viewer = await currentUser(deps, c);
    const { ticket } = await submitContactMessage(db, body, viewer?.id ?? null);
    await flushOutbox(deps);
    return c.json({ ticket }, 201);
  });

  return routes;
}
