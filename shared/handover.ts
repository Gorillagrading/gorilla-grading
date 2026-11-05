/**
 * Qué tiene que hacer el cliente con sus cartas después de pagar: enviarlas al laboratorio o
 * llevarlas al evento que eligió. Sale en su seguimiento y en el correo de confirmación.
 */
import type { PublicEventDto } from './events.js';

export interface LabAddress {
  /** A nombre de quién va el paquete, por ejemplo "Gorilla Grading – Recepción". */
  recipient: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
  /** Horario de recepción de paquetes, si se quiere indicar. */
  hours?: string;
  phone?: string;
}

/**
 * Dirección a la que los clientes envían o llevan sus cartas: el punto de venta de Gorilla Grading.
 * Es la misma para el envío por mensajería y para la entrega en el punto de venta.
 */
export const LAB_RECEIVING_ADDRESS: LabAddress | null = {
  recipient: 'Gorilla Grading',
  line1: 'Travesía de la Iglesia 3 (local)',
  postalCode: '28860',
  city: 'Paracuellos de Jarama, Madrid',
  country: 'España',
};

export type Handover =
  | { kind: 'ship'; address: LabAddress | null }
  | { kind: 'dropoff'; event: PublicEventDto | null }
  | { kind: 'store'; address: LabAddress | null };

/** La dirección en líneas, tal como se escribe en el paquete. */
export const addressLines = (a: LabAddress) =>
  [a.recipient, a.line1, a.line2, `${a.postalCode} ${a.city}`, a.country].filter((l): l is string => !!l);
