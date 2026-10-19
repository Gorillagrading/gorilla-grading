import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { getDb } from '../db/client';
import { ProblemError, problemResponse } from './problem';

export const app = new Hono().basePath('/api/v1');

app.use(requestId());
app.use(secureHeaders());

/** Comprueba que la función responde, sin tocar la base de datos. */
app.get('/health', (c) => c.json({ status: 'ok' }));

/** Comprueba la conexión con PostgreSQL. */
app.get('/health/db', async (c) => {
  await getDb().execute(sql`select 1`);
  return c.json({ status: 'ok' });
});

app.notFound((c) =>
  problemResponse(c, { type: 'about:blank', title: 'Not Found', status: 404, instance: c.req.path }),
);

app.onError((err, c) => {
  if (err instanceof ProblemError) {
    return problemResponse(c, {
      ...err.extensions,
      type: err.code,
      title: err.title,
      status: err.status,
      detail: err.detail,
      instance: c.req.path,
    });
  }
  if (err instanceof HTTPException) {
    return problemResponse(c, {
      type: 'about:blank',
      title: err.message || 'HTTP Error',
      status: err.status,
      instance: c.req.path,
    });
  }
  console.error(JSON.stringify({ level: 'error', requestId: c.get('requestId'), path: c.req.path, error: String(err) }));
  return problemResponse(c, {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    instance: c.req.path,
    requestId: c.get('requestId'),
  });
});
