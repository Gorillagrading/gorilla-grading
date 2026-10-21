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
    const base = process.env.SUPABASE_URL?.replace(/\/+$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) throw unavailable();
    return { api: `${base}/storage/v1`, key, bucket: process.env.SUPABASE_BUCKET ?? 'lab-private' };
  };
  const auth = (key: string) => ({ Authorization: `Bearer ${key}`, apikey: key });
  const path = (bucket: string, objectKey: string) => `${bucket}/${objectKey.split('/').map(encodeURIComponent).join('/')}`;

  return {
    async createUpload(objectKey, contentType) {
      const { api, key, bucket } = config();
      const res = await fetch(`${api}/object/upload/sign/${path(bucket, objectKey)}`, {
        method: 'POST',
        headers: { ...auth(key), 'content-type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) throw new Error(`Supabase Storage: no se pudo preparar la subida (${res.status})`);
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
      const res = await fetch(`${api}/object/${path(bucket, objectKey)}`, { method: 'HEAD', headers: auth(key) });
      return res.ok;
    },

    async createDownloadUrl(objectKey, ttlSeconds) {
      const { api, key, bucket } = config();
      const res = await fetch(`${api}/object/sign/${path(bucket, objectKey)}`, {
        method: 'POST',
        headers: { ...auth(key), 'content-type': 'application/json' },
        body: JSON.stringify({ expiresIn: ttlSeconds }),
      });
      if (!res.ok) throw new Error(`Supabase Storage: no se pudo firmar el enlace (${res.status})`);
      const { signedURL } = (await res.json()) as { signedURL: string };
      return encodeURI(`${api}${signedURL}`);
    },

    async remove(objectKey) {
      const { api, key, bucket } = config();
      await fetch(`${api}/object/${bucket}`, {
        method: 'DELETE',
        headers: { ...auth(key), 'content-type': 'application/json' },
        body: JSON.stringify({ prefixes: [objectKey] }),
      });
    },
  };
}
