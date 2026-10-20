import { Hono } from 'hono';
import type { VerificationChannel } from '../../shared/certificate.js';
import type { AppEnv, Deps } from '../context.js';
import { findPublicCertificate } from '../domain/certificates.js';
import { clientIp } from '../http.js';
import { ProblemError } from '../problem.js';
import { enforceRateLimit } from '../rate-limit.js';

const CHECKS_PER_WINDOW = 120;
const WINDOW_MS = 10 * 60_000;
const CHANNELS: VerificationChannel[] = ['web', 'qr', 'nfc'];

export function certificateRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();

  // Público: verifica un certificado por su número o por el serial de su slab.
  // `?via=qr` o `?via=nfc` lo añaden las direcciones grabadas en el QR y en el chip del slab.
  routes.get('/certificates/:number', async (c) => {
    const db = deps.getDb();
    const ip = clientIp(c);
    await enforceRateLimit(db, { bucket: 'verify', key: ip ?? 'unknown', limit: CHECKS_PER_WINDOW, windowMs: WINDOW_MS });

    const via = c.req.query('via') as VerificationChannel | undefined;
    const certificate = await findPublicCertificate(db, c.req.param('number'), {
      channel: via && CHANNELS.includes(via) ? via : 'web',
      ip,
      userAgent: c.req.header('user-agent') ?? null,
    });
    if (!certificate) {
      throw new ProblemError(404, 'Not Found', 'No existe ningún certificado con ese número.', {
        code: 'certificate_not_found',
      });
    }

    c.header('Cache-Control', 'no-store');
    return c.json({ certificate });
  });

  return routes;
}
