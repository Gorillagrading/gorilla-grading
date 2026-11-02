import type { InstagramPostsResponse } from '../../shared/instagram';
import { api } from './client';

/** Últimas publicaciones de la cuenta de Instagram (la API las guarda en caché unos minutos). */
export const fetchInstagramPosts = () => api<InstagramPostsResponse>('/instagram/posts', { timeoutMs: 10000 });
