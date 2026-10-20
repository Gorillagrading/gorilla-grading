import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { getDb } from '../db/client.js';
import type { AppEnv, Deps } from './context.js';
import { sendLoginCode } from './email/login-code.js';
import { sameOriginOnly } from './http.js';
import { ProblemError, problemResponse } from './problem.js';
import { accountRoutes } from './routes/account.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { certificateRoutes } from './routes/certificates.js';
import { jobRoutes } from './routes/jobs.js';
import { orderRoutes } from './routes/orders.js';
import { trackingRoutes } from './routes/tracking.js';

export function createApp(deps: Deps) {
  const app = new Hono<AppEnv>().basePath('/api/v1');

  app.use(requestId());
  app.use(secureHeaders());
  app.use(sameOriginOnly);

  /** Comprueba que la función responde, sin tocar la base de datos. */
  app.get('/health', (c) => c.json({ status: 'ok' }));

  /** Comprueba la conexión con PostgreSQL. */
  app.get('/health/db', async (c) => {
    await deps.getDb().execute(sql`select 1`);
    return c.json({ status: 'ok' });
  });

  app.route('/', authRoutes(deps));
  app.route('/', accountRoutes(deps));
  app.route('/', orderRoutes(deps));
  app.route('/', adminRoutes(deps));
  app.route('/', jobRoutes(deps));
  app.route('/', trackingRoutes(deps));
  app.route('/', certificateRoutes(deps));

  app.notFound((c) =>
    problemResponse(c, { type: 'about:blank', title: 'Not Found', status: 404, instance: c.req.path }),
  );

  app.onError((err, c) => {
    if (err instanceof ProblemError) {
      return problemResponse(
        c,
        {
          ...err.extensions,
          ...(err.code && { code: err.code }),
          type: 'about:blank',
          title: err.title,
          status: err.status,
          detail: err.detail,
          instance: c.req.path,
        },
        err.headers,
      );
    }
    if (err instanceof HTTPException) {
      return problemResponse(c, {
        type: 'about:blank',
        title: err.message || 'HTTP Error',
        status: err.status,
        instance: c.req.path,
      });
    }
    console.error(
      JSON.stringify({ level: 'error', requestId: c.get('requestId'), path: c.req.path, error: String(err) }),
    );
    return problemResponse(c, {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      instance: c.req.path,
      requestId: c.get('requestId'),
    });
  });

  return app;
}

export const app = createApp({ getDb, sendLoginCode });
