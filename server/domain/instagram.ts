import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { integrationTokens } from '../../db/schema.js';
import type { Db } from '../../db/client.js';
import type { InstagramPostDto, InstagramPostsResponse } from '../../shared/instagram.js';

/**
 * Publicaciones de la cuenta de Instagram de Gorilla Grading, leídas con la API oficial de Instagram.
 * Sirven los dos tipos de clave que entrega Meta, y se detecta solo cuál es:
 *  - Clave de «inicio de sesión de Instagram» (graph.instagram.com): dura 60 días. Se guarda en la base de datos
 *    y se renueva sola desde la tarea programada, así que nadie tiene que acordarse.
 *  - Clave de «inicio de sesión unificado» o de Facebook (graph.facebook.com): de usuario del sistema o de
 *    página, no caduca. Se necesita el identificador de la cuenta de Instagram, que se busca solo (o se fija con
 *    INSTAGRAM_USER_ID). No hay nada que renovar.
 *
 * Para conectar la cuenta basta con pegar la clave en la variable INSTAGRAM_ACCESS_TOKEN (ver docs).
 */

const GRAPH = 'https://graph.instagram.com';
const GRAPH_FACEBOOK = 'https://graph.facebook.com/v21.0';
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

interface JsonResult {
  status: number;
  body: any;
}

/** Una consulta que nunca lanza: devuelve el estado y el cuerpo (null si no se pudo leer). */
async function getJson(url: string, fetchImpl: FetchLike): Promise<JsonResult> {
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(8000) });
    return { status: res.status, body: await res.json().catch(() => null) };
  } catch {
    return { status: 0, body: null };
  }
}

/** Cómo se lee la cuenta con cada clave, para no repetir la detección en cada visita. */
const sources = new Map<string, { kind: 'instagram' } | { kind: 'facebook'; userId: string }>();

/** Busca la cuenta de Instagram a la que da acceso una clave de Facebook o unificada. */
async function discoverUserId(token: string, fetchImpl: FetchLike): Promise<string | null> {
  const explicit = process.env.INSTAGRAM_USER_ID?.trim();
  if (explicit) return explicit;
  const t = `access_token=${encodeURIComponent(token)}`;
  // Según el tipo de clave (de página, de usuario o de usuario del sistema) la cuenta aparece en un sitio distinto.
  const attempts: [string, (body: any) => string | undefined][] = [
    [`/me?fields=instagram_business_account&${t}`, (b) => b?.instagram_business_account?.id],
    [`/me/accounts?fields=instagram_business_account&limit=25&${t}`, (b) => b?.data?.find((x: any) => x?.instagram_business_account)?.instagram_business_account?.id],
    [`/me/instagram_accounts?fields=id,username&limit=25&${t}`, (b) => b?.data?.[0]?.id],
  ];
  for (const [path, pick] of attempts) {
    const { status, body } = await getJson(`${GRAPH_FACEBOOK}${path}`, fetchImpl);
    const found = status === 200 ? pick(body) : undefined;
    if (found) return String(found);
  }
  return null;
}

async function fetchMedia(token: string, limit: number, fetchImpl: FetchLike): Promise<MediaItem[]> {
  const key = hash(token);
  const query = `fields=${FIELDS}&limit=${Math.max(limit * 2, 12)}&access_token=${encodeURIComponent(token)}`;
  let source = sources.get(key);
  const explicitUser = process.env.INSTAGRAM_USER_ID?.trim();
  if (!source && explicitUser) source = { kind: 'facebook', userId: explicitUser };

  if (!source || source.kind === 'instagram') {
    const { status, body } = await getJson(`${GRAPH}/me/media?${query}`, fetchImpl);
    if (status === 200 && Array.isArray(body?.data)) {
      sources.set(key, { kind: 'instagram' });
      return body.data;
    }
    if (source?.kind === 'instagram') throw new Error(`Instagram respondió ${status}`);
    // No es una clave de Instagram: se prueba como clave de Facebook o unificada.
    const userId = await discoverUserId(token, fetchImpl);
    if (!userId) throw new Error(`La clave no sirve para Instagram (respondió ${status}) y no se encontró la cuenta vinculada`);
    source = { kind: 'facebook', userId };
  }

  const { status, body } = await getJson(`${GRAPH_FACEBOOK}/${source.userId}/media?${query}`, fetchImpl);
  if (status !== 200 || !Array.isArray(body?.data)) {
    sources.delete(key);
    throw new Error(`Instagram respondió ${status}${body?.error?.message ? `: ${String(body.error.message).slice(0, 160)}` : ''}`);
  }
  sources.set(key, source);
  return body.data;
}

let memory: { at: number; response: InstagramPostsResponse } | null = null;

/** Borra lo guardado en memoria (para las pruebas). */
export const resetInstagramMemory = () => {
  memory = null;
  sources.clear();
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
export async function renewInstagramToken(
  db: Db,
  fetchImpl: FetchLike = fetch,
): Promise<'not_configured' | 'not_due' | 'not_needed' | 'renewed' | 'failed'> {
  try {
    const token = await currentToken(db);
    if (!token) return 'not_configured';
    const [row] = await db.select().from(integrationTokens).where(eq(integrationTokens.provider, PROVIDER)).limit(1);
    if (!row) return 'not_configured';

    const now = Date.now();
    const age = now - row.refreshedAt.getTime();
    const expiresSoon = row.expiresAt ? row.expiresAt.getTime() - now < RENEW_BEFORE_DAYS * DAY_MS : false;
    if (age < RENEW_BEFORE_DAYS * DAY_MS && !expiresSoon) return 'not_due';

    // Solo las claves de «inicio de sesión de Instagram» caducan y se renuevan. Las de usuario del sistema o de
    // Facebook no caducan: si esta no es de Instagram, no hay nada que hacer.
    const kind = await getJson(`${GRAPH}/me?fields=id&access_token=${encodeURIComponent(row.accessToken)}`, fetchImpl);
    if (kind.status !== 200) return 'not_needed';

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
