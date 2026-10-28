/**
 * Contrato del seguimiento público de un pedido. Solo tipos: el frontend los importa con `import type`.
 * Nunca incluye dirección, datos de contacto, notas internas ni valores declarados.
 */
import type { OrderStatus } from './domain.js';
import type { Handover } from './handover.js';

export interface TrackingStepDto {
  status: OrderStatus;
  /** Texto público que escribe el laboratorio al registrar el evento. */
  label: string;
  description: string;
  occurredAt: string;
  state: 'completed' | 'current';
}

export interface TrackingItemDto {
  position: number;
  cardName: string | null;
  game: string | null;
  set: string | null;
}

export interface TrackingDto {
  code: string;
  status: OrderStatus;
  submittedAt: string;
  estimatedCompletionAt: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  itemCount: number;
  /** Detalle de las cartas. Solo lo recibe el dueño del pedido con sesión iniciada; el resto, null. */
  items: TrackingItemDto[] | null;
  /** Eventos ya ocurridos, en orden cronológico. */
  steps: TrackingStepDto[];
  /** Fases que todavía faltan, en orden. Vacío si el pedido ya terminó. */
  pending: OrderStatus[];
  /**
   * Qué tiene que hacer el cliente con sus cartas (enviarlas o llevarlas al evento). Solo para el dueño
   * y solo mientras el laboratorio no las ha recibido; si no, null.
   */
  handover: Handover | null;
}
