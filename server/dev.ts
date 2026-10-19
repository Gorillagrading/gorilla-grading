/**
 * Servidor local de la API. Vite redirige /api a este puerto (vite.config.ts).
 * Uso: npm run dev:api
 */
import { serve } from '@hono/node-server';
import { app } from './app';

const port = Number(process.env.API_PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API escuchando en http://localhost:${info.port}/api/v1`);
});
