/** Publicaciones de Instagram que muestra la web. Solo tipos: el servidor y el frontend los comparten. */

export type InstagramPostType = 'image' | 'video' | 'carousel';

export interface InstagramPostDto {
  id: string;
  type: InstagramPostType;
  /** Un video corto de Instagram (Reel). */
  isReel: boolean;
  /** Imagen para mostrar: la foto, o la portada si es un video. */
  imageUrl: string;
  /** Enlace a la publicación en Instagram. */
  permalink: string;
  caption: string | null;
  /** Fecha de publicación (ISO 8601). */
  postedAt: string;
}

export interface InstagramPostsResponse {
  /** Falso si la cuenta aún no está conectada: la web enseña entonces solo el enlace a Instagram. */
  configured: boolean;
  posts: InstagramPostDto[];
}
