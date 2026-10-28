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
 * Dirección del laboratorio a la que los clientes envían sus paquetes.
 * PENDIENTE: la empresa tiene que confirmar la dirección exacta. Mientras sea null, el cliente
 * ve que se la enviaremos por correo, nunca una dirección inventada.
 */
export const LAB_RECEIVING_ADDRESS: LabAddress | null = null;

export type Handover =
  | { kind: 'ship'; address: LabAddress | null }
  | { kind: 'dropoff'; event: PublicEventDto | null };

/** La dirección en líneas, tal como se escribe en el paquete. */
export const addressLines = (a: LabAddress) =>
  [a.recipient, a.line1, a.line2, `${a.postalCode} ${a.city}`, a.country].filter((l): l is string => !!l);
