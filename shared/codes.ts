/**
 * Formatos de los códigos visibles de Gorilla Grading: solo números.
 * La base de datos rechaza cualquier código que no cumpla su formato.
 *
 *   Pedido       284719365   9 dígitos aleatorios
 *   Ticket       3958201     7 dígitos aleatorios
 *   Certificado  199157603   el número que trae el informe del escáner (8 o 9 dígitos); si la carta
 *                            se gradúa a mano, 8 dígitos aleatorios
 *   Slab         199157603   el mismo número que su certificado
 *   Cliente      582014      derivado del id de la cuenta (solo para mostrar)
 *
 * Un pedido y un certificado pueden tener las mismas cifras: se buscan en sitios distintos
 * (seguimiento y verificador), nunca en la misma casilla.
 */
export const ORDER_CODE_DIGITS = 9;
export const TICKET_CODE_DIGITS = 7;
export const CERTIFICATE_DIGITS = 8;

export const ORDER_CODE = /^[0-9]{9}$/;
export const TICKET_CODE = /^[0-9]{7}$/;
export const CERTIFICATE_NUMBER = /^[0-9]{8,9}$/;
export const SLAB_SERIAL = CERTIFICATE_NUMBER;

/** Lo que alguien escribe a mano: sin espacios, guiones ni puntos ("284 719 365" → "284719365"). */
export const normalizeCode = (raw: string) => raw.trim().replace(/[\s.-]+/g, '');
