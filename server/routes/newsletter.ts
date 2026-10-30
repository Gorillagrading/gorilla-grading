import { Hono } from 'hono';
import { NewsletterBody, NewsletterTokenBody } from '../../shared/newsletter.js';
import type { AppEnv, Deps } from '../context.js';
import { confirmSubscription, subscribe, unsubscribe } from '../domain/newsletter.js';
import { flushOutbox } from '../domain/outbox.js';
import { clientIp, parseJson } from '../http.js';
import { enforceRateLimit } from '../rate-limit.js';

export function newsletterRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();

  // Público: apuntarse. Siempre responde igual, esté o no ya suscrito el correo.
  routes.post('/newsletter', async (c) => {
    const db = deps.getDb();
    await enforceRateLimit(db, { bucket: 'newsletter', key: clientIp(c) ?? 'unknown', limit: 5, windowMs: 60 * 60_000 });
    const body = await parseJson(c, NewsletterBody);
    // Un robot que rellena el campo trampa recibe la misma respuesta, pero no se guarda nada.
    if (!body.website) {
      await subscribe(db, body);
      await flushOutbox(deps);
    }
    return c.json({ ok: true }, 202);
  });

  // Desde los enlaces del correo (la página los envía por POST para que un antivirus que abre el enlace no confirme solo).
  routes.post('/newsletter/confirm', async (c) => {
    const { token } = await parseJson(c, NewsletterTokenBody);
    await confirmSubscription(deps.getDb(), token);
    return c.json({ ok: true });
  });

  routes.post('/newsletter/unsubscribe', async (c) => {
    const { token } = await parseJson(c, NewsletterTokenBody);
    await unsubscribe(deps.getDb(), token);
    return c.json({ ok: true });
  });

  return routes;
}
