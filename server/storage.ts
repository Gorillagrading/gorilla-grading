import { ProblemError } from './problem.js';
import type { UploadTarget } from '../shared/photos.js';

/** Almacenamiento privado de archivos. Los archivos nunca son públicos: se leen con enlaces firmados que caducan. */
export interface ObjectStorage {
  /** Prepara la subida de un archivo nuevo directamente desde el navegador. */
  createUpload(key: string, contentType: string): Promise<UploadTarget>;
  /** Comprueba que el archivo ya está subido. */
  exists(key: string): Promise<boolean>;
  createDownloadUrl(key: string, ttlSeconds: number): Promise<string>;
  remove(key: string): Promise<void>;
}

const unavailable = () =>
  new ProblemError(503, 'Service Unavailable', 'El almacenamiento de archivos no está configurado.', { code: 'storage_unavailable' });

/**
 * Supabase Storage con un bucket privado. Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY;
 * SUPABASE_BUCKET (por defecto "lab-private") y SUPABASE_ANON_KEY (solo si el almacenamiento la exige al subir).
 * La clave de servicio nunca sale del servidor: al navegador solo llega un enlace de subida firmado de un solo uso.
 */
export function createSupabaseStorage(): ObjectStorage {
  const config = () => {
    // Se tolera que falte el "https://" o que sobren espacios o barras: es el fallo más común al copiar la dirección.
    const raw = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
    const base = raw && !/^https?:\/\//i.test(raw) ? `https://${raw}` : raw;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) throw unavailable();
    if (!/^https?:\/\/[^\s/]+\.[^\s/]+/.test(base)) {
      throw new ProblemError(503, 'Service Unavailable', 'SUPABASE_URL no es una dirección válida. Debe ser como https://xxxx.supabase.co', {
        code: 'storage_error',
      });
    }
    return { api: `${base}/storage/v1`, key, bucket: process.env.SUPABASE_BUCKET ?? 'lab-private' };
  };
  // Las claves nuevas (sb_secret_…) no son JWT: solo van en "apikey" y el gateway de Supabase pone el resto.
  // Las antiguas (service_role, un JWT) admiten además "Authorization: Bearer".
  const auth = (key: string): Record<string, string> =>
    key.startsWith('sb_') ? { apikey: key } : { Authorization: `Bearer ${key}`, apikey: key };
  const failure = async (what: string, res: Response) =>
    new ProblemError(502, 'Bad Gateway', `Supabase Storage no pudo ${what} (${res.status}): ${(await res.text().catch(() => '')).slice(0, 200)}`, {
      code: 'storage_error',
    });
  const call = async (url: string, init: RequestInit): Promise<Response> => {
    try {
      return await fetch(url, init);
    } catch (error) {
      const reason = error instanceof Error ? `${error.message}${error.cause instanceof Error ? ` (${error.cause.message})` : ''}` : String(error);
      throw new ProblemError(502, 'Bad Gateway', `No se pudo conectar con Supabase Storage en ${new URL(url, 'https://x').origin}: ${reason}`, {
        code: 'storage_error',
      });
    }
  };
  const path = (bucket: string, objectKey: string) => `${bucket}/${objectKey.split('/').map(encodeURIComponent).join('/')}`;

  return {
    async createUpload(objectKey, contentType) {
      const { api, key, bucket } = config();
      const res = await call(`${api}/object/upload/sign/${path(bucket, objectKey)}`, {
        method: 'POST',
        headers: { ...auth(key), 'content-type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) throw await failure('preparar la subida', res);
      const { url } = (await res.json()) as { url: string };
      const signed = new URL(`${api}${url.startsWith('/') ? '' : '/'}${url}`);
      const anon = process.env.SUPABASE_ANON_KEY;
      return {
        method: 'PUT',
        url: signed.toString(),
        headers: { ...(anon ? { apikey: anon, Authorization: `Bearer ${anon}` } : {}), 'x-upsert': 'false' },
        body: 'multipart',
      } satisfies UploadTarget;
    },

    async exists(objectKey) {
      const { api, key, bucket } = config();
      const res = await call(`${api}/object/${path(bucket, objectKey)}`, { method: 'HEAD', headers: auth(key) });
      return res.ok;
    },

    async createDownloadUrl(objectKey, ttlSeconds) {
      const { api, key, bucket } = config();
      const res = await call(`${api}/object/sign/${path(bucket, objectKey)}`, {
        method: 'POST',
        headers: { ...auth(key), 'content-type': 'application/json' },
        body: JSON.stringify({ expiresIn: ttlSeconds }),
      });
      if (!res.ok) throw await failure('firmar el enlace', res);
      const { signedURL } = (await res.json()) as { signedURL: string };
      return encodeURI(`${api}${signedURL}`);
    },

    async remove(objectKey) {
      const { api, key, bucket } = config();
      await call(`${api}/object/${bucket}`, {
        method: 'DELETE',
        headers: { ...auth(key), 'content-type': 'application/json' },
        body: JSON.stringify({ prefixes: [objectKey] }),
      });
    },
  };
}
