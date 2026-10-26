import { z } from 'zod';

export const CONTACT_SUBJECTS = ['shipping', 'order', 'pricing', 'technical', 'events', 'other'] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

/** Nombre del asunto en el correo que recibe el equipo. */
export const CONTACT_SUBJECT_LABEL: Record<ContactSubject, string> = {
  shipping: 'Envíos, empaque y seguimiento',
  order: 'Estado de un pedido',
  pricing: 'Tarifas, facturación y lotes',
  technical: 'Tecnología y criterios',
  events: 'Puntos de entrega y eventos',
  other: 'Otra consulta',
};

export const ContactBody = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  subject: z.enum(CONTACT_SUBJECTS),
  orderCode: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1).max(5000),
  locale: z.enum(['es', 'en']).default('es'),
  /** Campo trampa, invisible para las personas: si llega con texto, lo ha rellenado un robot. */
  website: z.string().max(200).optional(),
});
export type ContactBody = z.infer<typeof ContactBody>;
