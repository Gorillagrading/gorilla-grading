/**
 * Servidor local de la API. Vite redirige /api a este puerto (vite.config.ts).
 * Uso: npm run dev:api
 *
 * Además imita al cron de Vercel: cada minuto avanza los pedidos cuyas fases ya les tocan.
 */
import { serve } from '@hono/node-server';
import { getDb } from '../db/client';
import { app } from './app';
import { advanceDueOrders } from './domain/automation';

const port = Number(process.env.API_PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API escuchando en http://localhost:${info.port}/api/v1`);
});

setInterval(async () => {
  try {
    const advanced = await advanceDueOrders(getDb());
    for (const a of advanced) console.log(`[auto] ${a.code}: ${a.from} -> ${a.to}`);
  } catch (err) {
    console.error('[auto] error al avanzar pedidos:', err instanceof Error ? err.message : err);
  }
}, 60_000);
