/**
 * Eventos y puntos de entrega en mano. Los crea la dirección en su panel; los que están publicados,
 * aceptan entregas y aún no han terminado aparecen al cliente al elegir "entrega en mano".
 */
import { z } from 'zod';

export const EVENT_KINDS = ['fair', 'hub'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

/** Países en los que se puede organizar un evento (los mismos que admite la devolución). */
export const EVENT_COUNTRIES = ['ES', 'PT', 'FR'] as const;

const text = (max: number) => z.string().trim().max(max);

export const EventBody = z
  .object({
    kind: z.enum(EVENT_KINDS),
    name: text(120).min(1),
    city: text(80).min(1),
    countryCode: z.enum(EVENT_COUNTRIES),
    venue: text(120).optional(),
    address: text(200).optional(),
    details: text(500).optional(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    acceptsSubmissions: z.boolean().default(true),
    published: z.boolean().default(true),
  })
  .refine((e) => new Date(e.endsAt) > new Date(e.startsAt), {
    path: ['endsAt'],
    message: 'El evento tiene que terminar después de empezar.',
  });
export type EventBody = z.input<typeof EventBody>;

/** Lo que ve el cliente de un evento. */
export interface PublicEventDto {
  id: string;
  kind: EventKind;
  name: string;
  city: string;
  countryCode: string;
  venue: string | null;
  address: string | null;
  details: string | null;
  startsAt: string;
  endsAt: string;
}

/** Lo que ve la dirección: además, si está publicado y cuántos pedidos lo eligieron. */
export interface AdminEventDto extends PublicEventDto {
  acceptsSubmissions: boolean;
  published: boolean;
  orderCount: number;
}

/** Fecha y horario de un evento en hora de Madrid: "sábado, 15 de noviembre de 2026 · 10:00–19:00". */
export function formatEventWhen(startsAt: string, endsAt: string, lang: 'es' | 'en' = 'es'): string {
  const locale = lang === 'en' ? 'en-GB' : 'es-ES';
  const tz = { timeZone: 'Europe/Madrid' } as const;
  const day = (d: Date) => d.toLocaleDateString(locale, { ...tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = (d: Date) => d.toLocaleTimeString(locale, { ...tz, hour: '2-digit', minute: '2-digit' });
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return day(start) === day(end)
    ? `${day(start)} · ${time(start)}–${time(end)}`
    : `${day(start)} ${time(start)} – ${day(end)} ${time(end)}`;
}
