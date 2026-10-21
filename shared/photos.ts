/**
 * Fotos de las cartas y vista del resultado que ve el cliente. Los archivos viven en un almacenamiento
 * privado; la API solo entrega enlaces firmados que caducan a los pocos minutos.
 */
import { z } from 'zod';
import { OrderStatus } from './domain.js';

export const IMAGE_KINDS = ['front', 'back', 'extra'] as const;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;

export const ImageBody = z.object({
  kind: z.enum(IMAGE_KINDS),
  contentType: z.enum(IMAGE_TYPES),
  byteSize: z.number().int().min(1).max(MAX_IMAGE_BYTES),
});
export type ImageBody = z.infer<typeof ImageBody>;

export interface ImageDto {
  id: string;
  kind: (typeof IMAGE_KINDS)[number];
  contentType: string;
  byteSize: number | null;
  /** Enlace firmado de lectura. Caduca pronto: hay que volver a pedirlo. */
  url: string;
}

/** Cómo y adónde subir el archivo, directamente al almacenamiento y sin pasar por la API. */
export interface UploadTarget {
  method: 'PUT';
  url: string;
  headers: Record<string, string>;
  /** Cómo debe ir el cuerpo: el archivo en un formulario multipart (campo vacío) o tal cual. */
  body: 'multipart' | 'raw';
}

export interface AdminOrderImages {
  items: { position: number; images: ImageDto[] }[];
}

export interface PublicGrading {
  isAuthentic: boolean;
  finalGrade: number | null;
  gradeLabel: string | null;
  centering: { score: number; frontRatio: string | null; backRatio: string | null; notes: string | null } | null;
  corners: { score: number; frontScore: number | null; backScore: number | null; notes: string | null } | null;
  edges: { score: number; frontScore: number | null; backScore: number | null; notes: string | null } | null;
  surface: { score: number; frontScore: number | null; backScore: number | null; notes: string | null } | null;
  defects: {
    side: 'front' | 'back';
    category: 'centering' | 'corners' | 'edges' | 'surface';
    severity: 'flawless' | 'minor' | 'moderate' | 'critical';
    title: string;
    description: string | null;
    x: number;
    y: number;
  }[];
}

/** Lo que ve el cliente de su pedido. Hasta que el pedido sale del laboratorio no hay resultados. */
export interface OrderResultsDto {
  code: string;
  status: OrderStatus;
  released: boolean;
  items: {
    position: number;
    cardName: string;
    game: string;
    setName: string | null;
    grading: PublicGrading | null;
    images: ImageDto[];
  }[];
}
