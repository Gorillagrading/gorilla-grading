import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseStorage } from './storage.js';

type Call = { url: string; init: RequestInit };
let calls: Call[];
let respond: (url: string, init: RequestInit) => Response;

beforeEach(() => {
  calls = [];
  respond = () => new Response('{}', { status: 200 });
  vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    return respond(url, init);
  });
  process.env.SUPABASE_URL = 'https://abc.supabase.co/';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_abc';
  delete process.env.SUPABASE_BUCKET;
  delete process.env.SUPABASE_ANON_KEY;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

const headers = (call: Call) => call.init.headers as Record<string, string>;

describe('Supabase Storage', () => {
  it('con una clave nueva (sb_secret_…) solo envía "apikey"', async () => {
    respond = () => new Response(JSON.stringify({ url: '/object/upload/sign/lab-private/items/x.jpg?token=T' }), { status: 200 });
    const upload = await createSupabaseStorage().createUpload('items/x.jpg', 'image/jpeg');

    expect(calls[0].url).toBe('https://abc.supabase.co/storage/v1/object/upload/sign/lab-private/items/x.jpg');
    expect(headers(calls[0])).toMatchObject({ apikey: 'sb_secret_abc' });
    expect(headers(calls[0]).Authorization).toBeUndefined();
    expect(upload).toMatchObject({
      method: 'PUT',
      url: 'https://abc.supabase.co/storage/v1/object/upload/sign/lab-private/items/x.jpg?token=T',
    });
    // La clave de servicio nunca llega al navegador.
    expect(JSON.stringify(upload)).not.toContain('sb_secret_abc');
  });

  it('con la clave antigua (JWT) envía también "Authorization: Bearer"', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOi.payload.firma';
    respond = () => new Response(JSON.stringify({ signedURL: '/object/sign/lab-private/a.jpg?token=T' }), { status: 200 });
    const url = await createSupabaseStorage().createDownloadUrl('a.jpg', 600);

    expect(headers(calls[0])).toMatchObject({ Authorization: 'Bearer eyJhbGciOi.payload.firma', apikey: 'eyJhbGciOi.payload.firma' });
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ expiresIn: 600 });
    expect(url).toBe('https://abc.supabase.co/storage/v1/object/sign/lab-private/a.jpg?token=T');
  });

  it('usa la clave pública solo si se configura, y es la que se entrega al navegador', async () => {
    process.env.SUPABASE_ANON_KEY = 'sb_publishable_xyz';
    respond = () => new Response(JSON.stringify({ url: '/object/upload/sign/lab-private/a.jpg?token=T' }), { status: 200 });
    const upload = await createSupabaseStorage().createUpload('a.jpg', 'image/jpeg');
    expect(upload.headers).toMatchObject({ apikey: 'sb_publishable_xyz' });
  });

  it('un error de Supabase llega con su detalle, sin exponer la clave', async () => {
    respond = () => new Response('{"message":"Invalid Compact JWS"}', { status: 401 });
    await expect(createSupabaseStorage().createUpload('a.jpg', 'image/jpeg')).rejects.toMatchObject({
      status: 502,
      code: 'storage_error',
      message: expect.stringContaining('(401): {"message":"Invalid Compact JWS"}'),
    });
  });

  it('sin configuración responde 503 storage_unavailable', async () => {
    delete process.env.SUPABASE_URL;
    await expect(createSupabaseStorage().exists('a.jpg')).rejects.toMatchObject({ status: 503, code: 'storage_unavailable' });
  });

  it('comprueba si un archivo existe con HEAD y lo borra por prefijo', async () => {
    respond = () => new Response(null, { status: 200 });
    const storage = createSupabaseStorage();
    expect(await storage.exists('a b/ñ.jpg')).toBe(true);
    expect(calls[0].init.method).toBe('HEAD');
    expect(calls[0].url).toBe('https://abc.supabase.co/storage/v1/object/lab-private/a%20b/%C3%B1.jpg');

    await storage.remove('a.jpg');
    expect(calls[1].init.method).toBe('DELETE');
    expect(JSON.parse(calls[1].init.body as string)).toEqual({ prefixes: ['a.jpg'] });
  });
});

describe('Supabase Storage: fallos de conexión', () => {
  it('si a la dirección le falta el https:// se lo añade, y quita espacios y barras', async () => {
    respond = () => new Response(null, { status: 200 });
    for (const value of ['abc.supabase.co', '  https://abc.supabase.co/  ', 'abc.supabase.co//']) {
      process.env.SUPABASE_URL = value;
      calls = [];
      await createSupabaseStorage().exists('a.jpg');
      expect(calls[0].url).toBe('https://abc.supabase.co/storage/v1/object/lab-private/a.jpg');
    }
  });

  it('una dirección sin sentido se explica en vez de dar un error ciego', async () => {
    process.env.SUPABASE_URL = 'localhost';
    await expect(createSupabaseStorage().exists('a.jpg')).rejects.toMatchObject({ status: 503, code: 'storage_error', message: expect.stringContaining('SUPABASE_URL') });
  });

  it('un fallo de red llega con su motivo', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND abc.supabase.co') });
    });
    await expect(createSupabaseStorage().createUpload('a.jpg', 'image/jpeg')).rejects.toMatchObject({
      status: 502,
      code: 'storage_error',
      message: expect.stringContaining('ENOTFOUND'),
    });
  });
});
