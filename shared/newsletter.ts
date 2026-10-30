/**
 * Newsletter con doble confirmación: quien se apunta recibe un correo y solo queda suscrito al
 * pulsar el enlace. Es lo que pide el RGPD para enviar comunicaciones comerciales.
 */
import { z } from 'zod';

/** Versión del texto de consentimiento que acepta quien se suscribe. Cambiarla si cambia el texto. */
export const NEWSLETTER_CONSENT_VERSION = '2026-10-30';

export const NewsletterBody = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  locale: z.enum(['es', 'en']).default('es'),
  /** Campo trampa, invisible para las personas: si llega con texto, lo ha rellenado un robot. */
  website: z.string().max(200).optional(),
});
export type NewsletterBody = z.infer<typeof NewsletterBody>;

export const NewsletterTokenBody = z.object({ token: z.string().trim().min(20).max(100) });

export interface NewsletterSubscriberDto {
  email: string;
  locale: string;
  confirmedAt: string;
}

export interface NewsletterStatsDto {
  confirmed: number;
  pending: number;
  unsubscribed: number;
  subscribers: NewsletterSubscriberDto[];
}
