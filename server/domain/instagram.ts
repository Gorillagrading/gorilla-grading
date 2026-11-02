import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { integrationTokens } from '../../db/schema.js';
import type { Db } from '../../db/client.js';
import type { InstagramPostDto, InstagramPostsResponse } from '../../shared/instagram.js';

/**
 * Publicaciones de la cuenta de Instagram de Gorilla Grading, leídas con la API oficial de Instagram
 * (inicio de sesión de Instagram, cuenta profesional). La clave de acceso dura 60 días: se guarda en la
 * base de datos y se renueva sola desde la tarea programada, así que nadie tiene que acordarse.
 *
 * Para conectar la cuenta basta con pegar la clave en la variable INSTAGRAM_ACCESS_TOKEN (ver docs).
 */

const GRAPH = 'https://graph.instagram.com';
const PROVIDER = 'instagram';
const FIELDS = 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp';
/** Se renueva cuando faltan menos de estos días para que caduque, o hace más de ellos que se renovó. */
const RENEW_BEFORE_DAYS = 20;
const DAY_MS = 86_400_000;
/** Lo que se conserva en memoria para no consultar a Instagram en cada visita. */
const MEMORY_TTL_MS = 10 * 60_000;

type FetchLike = typeof fetch;

interface MediaItem {
  id: string;
  caption?: string;
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
}

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

/** Convierte lo que devuelve Instagram en lo que usa la web. Descarta lo que no se puede mostrar. */
export function toPosts(items: MediaItem[], limit: number): InstagramPostDto[] {
  const posts: InstagramPostDto[] = [];
  for (const item of items) {
    const type = item.media_type === 'VIDEO' ? 'video' : item.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'image';
    // De un video se muestra la portada; de una foto o un álbum, su primera imagen.
    const imageUrl = type === 'video' ? item.thumbnail_url : item.media_url;
    if (!item.id || !imageUrl || !item.permalink || !item.timestamp) continue;
    posts.push({
      id: item.id,
      type,
      isReel: item.media_product_type === 'REELS',
      imageUrl,
      permalink: item.permalink,
      caption: item.caption?.trim() || null,
      postedAt: item.timestamp,
    });
    if (posts.length >= limit) break;
  }
  return posts;
}

/** La clave guardada. Si en el entorno hay una distinta de la que se usó para sembrarla, la sustituye. */
async function currentToken(db: Db): Promise<string | null> {
  const seed = process.env.INSTAGRAM_ACCESS_TOKEN?.trim() || null;
  const [row] = await db.select().from(integrationTokens).where(eq(integrationTokens.provider, PROVIDER)).limit(1);

  if (seed && (!row || row.seedHash !== hash(seed))) {
    await db
      .insert(integrationTokens)
      .values({ provider: PROVIDER, accessToken: seed, seedHash: hash(seed), expiresAt: null, refreshedAt: new Date() })
      .onConflictDoUpdate({
        target: integrationTokens.provider,
        set: { accessToken: seed, seedHash: hash(seed), expiresAt: null, refreshedAt: new Date() },
      });
    return seed;
  }
  return row?.accessToken ?? null;
}

async function fetchMedia(token: string, limit: number, fetchImpl: FetchLike): Promise<MediaItem[]> {
  const url = `${GRAPH}/me/media?fields=${FIELDS}&limit=${Math.max(limit * 2, 12)}&access_token=${encodeURIComponent(token)}`;
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Instagram respondió ${res.status}`);
  const body = (await res.json()) as { data?: MediaItem[] };
  return body.data ?? [];
}

let memory: { at: number; response: InstagramPostsResponse } | null = null;

/** Borra lo guardado en memoria (para las pruebas). */
export const resetInstagramMemory = () => {
  memory = null;
};

/**
 * Las últimas publicaciones. Nunca lanza error: si Instagram falla se enseña lo último que se tuvo, y si la
 * cuenta no está conectada se devuelve `configured: false` para que la web muestre solo el enlace.
 */
export async function getInstagramPosts(db: Db, limit = 8, fetchImpl: FetchLike = fetch): Promise<InstagramPostsResponse> {
  if (memory && Date.now() - memory.at < MEMORY_TTL_MS) return memory.response;
  try {
    const token = await currentToken(db);
    if (!token) return { configured: false, posts: [] };
    const response: InstagramPostsResponse = { configured: true, posts: toPosts(await fetchMedia(token, limit, fetchImpl), limit) };
    memory = { at: Date.now(), response };
    return response;
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', source: 'instagram', error: String(err) }));
    return memory?.response ?? { configured: true, posts: [] };
  }
}

/**
 * Renueva la clave si le toca. Instagram devuelve una nueva con 60 días más; hay que renovarla antes de que
 * caduque (y pasadas 24 horas de su creación). Se llama desde la tarea programada diaria.
 */
export async function renewInstagramToken(db: Db, fetchImpl: FetchLike = fetch): Promise<'not_configured' | 'not_due' | 'renewed' | 'failed'> {
  try {
    const token = await currentToken(db);
    if (!token) return 'not_configured';
    const [row] = await db.select().from(integrationTokens).where(eq(integrationTokens.provider, PROVIDER)).limit(1);
    if (!row) return 'not_configured';

    const now = Date.now();
    const age = now - row.refreshedAt.getTime();
    const expiresSoon = row.expiresAt ? row.expiresAt.getTime() - now < RENEW_BEFORE_DAYS * DAY_MS : false;
    if (age < RENEW_BEFORE_DAYS * DAY_MS && !expiresSoon) return 'not_due';

    const res = await fetchImpl(
      `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(row.accessToken)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error(`Instagram respondió ${res.status} al renovar la clave`);
    const body = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!body.access_token) throw new Error('Instagram no devolvió la clave renovada');
    await db
      .update(integrationTokens)
      .set({
        accessToken: body.access_token,
        expiresAt: body.expires_in ? new Date(now + body.expires_in * 1000) : null,
        refreshedAt: new Date(now),
      })
      .where(eq(integrationTokens.provider, PROVIDER));
    return 'renewed';
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', source: 'instagram-renew', error: String(err) }));
    return 'failed';
  }
}
