/**
 * Formatos de los códigos visibles de Gorilla Grading: solo números, al azar. Cada tipo tiene
 * una longitud distinta para que un pedido no se confunda con un certificado.
 * La base de datos rechaza cualquier código que no cumpla su formato.
 *
 *   Pedido       284719365   9 dígitos aleatorios
 *   Ticket       3958201     7 dígitos aleatorios
 *   Certificado  48271936    8 dígitos aleatorios (100 millones de combinaciones)
 *   Slab         48271936    el mismo número que su certificado
 *   Cliente      582014      derivado del id de la cuenta (solo para mostrar)
 */
export const ORDER_CODE_DIGITS = 9;
export const TICKET_CODE_DIGITS = 7;
export const CERTIFICATE_DIGITS = 8;

export const ORDER_CODE = /^[0-9]{9}$/;
export const TICKET_CODE = /^[0-9]{7}$/;
export const CERTIFICATE_NUMBER = /^[0-9]{8}$/;
export const SLAB_SERIAL = CERTIFICATE_NUMBER;

/** Lo que alguien escribe a mano: sin espacios, guiones ni puntos ("284 719 365" → "284719365"). */
export const normalizeCode = (raw: string) => raw.trim().replace(/[\s.-]+/g, '');
