import { sql } from 'drizzle-orm';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { integrationTokens } from '../db/schema.js';
import { getInstagramPosts, renewInstagramToken, resetInstagramMemory, toPosts } from './domain/instagram.js';
import { createTestApp, createTestDb, type TestDb } from './testing.js';

const DAY = 86_400_000;
let db: TestDb;

const media = (overrides: Record<string, unknown> = {}): any => ({
  id: '1',
  caption: ' Un reel del laboratorio ',
  media_type: 'VIDEO',
  media_product_type: 'REELS',
  thumbnail_url: 'https://cdn.example/thumb.jpg',
  media_url: 'https://cdn.example/video.mp4',
  permalink: 'https://www.instagram.com/reel/abc/',
  timestamp: '2026-11-02T10:00:00+0000',
  ...overrides,
});

const instagramReturns = (data: unknown[]) =>
  vi.fn(async () => new Response(JSON.stringify({ data }), { status: 200 })) as unknown as typeof fetch;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(sql`truncate integration_tokens`);
  resetInstagramMemory();
  delete process.env.INSTAGRAM_ACCESS_TOKEN;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('toPosts', () => {
  it('de un video usa la portada, de una foto su imagen, y marca los reels', () => {
    const posts = toPosts(
      [
        media(),
        media({ id: '2', media_type: 'IMAGE', media_product_type: 'FEED', media_url: 'https://cdn.example/photo.jpg', thumbnail_url: undefined }),
        media({ id: '3', media_type: 'CAROUSEL_ALBUM', media_product_type: 'FEED', media_url: 'https://cdn.example/album.jpg', thumbnail_url: undefined }),
      ],
      8,
    );
    expect(posts.map((p) => [p.id, p.type, p.isReel, p.imageUrl])).toEqual([
      ['1', 'video', true, 'https://cdn.example/thumb.jpg'],
      ['2', 'image', false, 'https://cdn.example/photo.jpg'],
      ['3', 'carousel', false, 'https://cdn.example/album.jpg'],
    ]);
    expect(posts[0].caption).toBe('Un reel del laboratorio');
  });

  it('descarta lo que no se puede mostrar y respeta el límite', () => {
    const posts = toPosts([media({ id: 'a', thumbnail_url: undefined }), media({ id: 'b' }), media({ id: 'c' }), media({ id: 'd' })], 2);
    expect(posts.map((p) => p.id)).toEqual(['b', 'c']);
  });
});

describe('getInstagramPosts', () => {
  it('sin clave configurada dice que la cuenta no está conectada', async () => {
    const fetcher = instagramReturns([]);
    expect(await getInstagramPosts(db, 8, fetcher)).toEqual({ configured: false, posts: [] });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('con la clave del entorno la guarda y devuelve las publicaciones', async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'clave-1';
    const fetcher = instagramReturns([media()]);
    const result = await getInstagramPosts(db, 8, fetcher);
    expect(result.configured).toBe(true);
    expect(result.posts).toHaveLength(1);
    expect(String((fetcher as any).mock.calls[0][0])).toContain('access_token=clave-1');
    const [row] = await db.select().from(integrationTokens);
    expect(row.accessToken).toBe('clave-1');
  });

  it('guarda el resultado en memoria y no vuelve a consultar a Instagram enseguida', async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'clave-1';
    const fetcher = instagramReturns([media()]);
    await getInstagramPosts(db, 8, fetcher);
    await getInstagramPosts(db, 8, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('si la clave del entorno cambia, sustituye a la guardada', async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'clave-1';
    await getInstagramPosts(db, 8, instagramReturns([media()]));
    resetInstagramMemory();
    process.env.INSTAGRAM_ACCESS_TOKEN = 'clave-2';
    const fetcher = instagramReturns([media()]);
    await getInstagramPosts(db, 8, fetcher);
    expect(String((fetcher as any).mock.calls[0][0])).toContain('access_token=clave-2');
  });

  it('si Instagram falla no rompe: devuelve lista vacía y lo registra', async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'clave-1';
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetcher = vi.fn(async () => new Response('{}', { status: 400 })) as unknown as typeof fetch;
    expect(await getInstagramPosts(db, 8, fetcher)).toEqual({ configured: true, posts: [] });
    expect(log).toHaveBeenCalled();
  });
});

describe('GET /instagram/posts', () => {
  it('responde 200 y se puede guardar en caché cuando hay publicaciones', async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'clave-1';
    vi.stubGlobal('fetch', instagramReturns([media()]));
    const t = createTestApp(db);
    const res = await t.app.request('/api/v1/instagram/posts');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('s-maxage=600');
    const body = (await res.json()) as any;
    expect(body.posts[0]).toMatchObject({ id: '1', isReel: true });
    vi.unstubAllGlobals();
  });

  it('sin la cuenta conectada responde configured:false con caché corta', async () => {
    const t = createTestApp(db);
    const res = await t.app.request('/api/v1/instagram/posts');
    expect(await res.json()).toEqual({ configured: false, posts: [] });
    expect(res.headers.get('cache-control')).toContain('s-maxage=60');
  });
});

describe('renewInstagramToken', () => {
  const renewal = (token: string) =>
    vi.fn(async () => new Response(JSON.stringify({ access_token: token, token_type: 'bearer', expires_in: 5_184_000 }), { status: 200 })) as unknown as typeof fetch;

  it('no hace nada si la cuenta no está conectada', async () => {
    expect(await renewInstagramToken(db, renewal('x'))).toBe('not_configured');
  });

  it('no renueva una clave reciente', async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'clave-1';
    const fetcher = renewal('nueva');
    expect(await renewInstagramToken(db, fetcher)).toBe('not_due');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('renueva una clave de más de 20 días y guarda la nueva con su caducidad', async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'clave-1';
    await renewInstagramToken(db, renewal('x'));
    await db.execute(sql`update integration_tokens set refreshed_at = now() - interval '25 days'`);
    expect(await renewInstagramToken(db, renewal('clave-renovada'))).toBe('renewed');
    const [row] = await db.select().from(integrationTokens);
    expect(row.accessToken).toBe('clave-renovada');
    expect(row.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 59 * DAY);
    expect(Date.now() - row.refreshedAt.getTime()).toBeLessThan(60_000);
  });

  it('si Instagram rechaza la renovación lo dice sin tumbar la tarea', async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'clave-1';
    await renewInstagramToken(db, renewal('x'));
    await db.execute(sql`update integration_tokens set refreshed_at = now() - interval '25 days'`);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetcher = vi.fn(async () => new Response('{}', { status: 400 })) as unknown as typeof fetch;
    expect(await renewInstagramToken(db, fetcher)).toBe('failed');
  });
});
