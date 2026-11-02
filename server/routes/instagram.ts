import { Hono } from 'hono';
import type { AppEnv, Deps } from '../context.js';
import { getInstagramPosts } from '../domain/instagram.js';

export function instagramRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();

  // Público: las últimas publicaciones de la cuenta de Instagram, para la sección de comunidad de la web.
  // La respuesta se guarda diez minutos en la red de Vercel, así que Instagram recibe muy pocas consultas.
  routes.get('/instagram/posts', async (c) => {
    const result = await getInstagramPosts(deps.getDb());
    c.header(
      'Cache-Control',
      result.configured && result.posts.length > 0 ? 'public, s-maxage=600, stale-while-revalidate=3600' : 'public, s-maxage=60',
    );
    return c.json(result);
  });

  return routes;
}
