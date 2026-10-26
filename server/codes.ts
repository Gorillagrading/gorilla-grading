import { randomInt } from 'node:crypto';
import { CERTIFICATE_DIGITS, ORDER_CODE_DIGITS, TICKET_CODE_DIGITS } from '../shared/codes.js';

/** Número al azar con exactamente `digits` cifras; puede empezar por cero. */
const randomDigits = (digits: number) => String(randomInt(0, 10 ** digits)).padStart(digits, '0');

/** Código de pedido no adivinable. Quien lo crea debe reintentar si choca con uno existente (índice único). */
export const newOrderCode = () => randomDigits(ORDER_CODE_DIGITS);

export const newTicketCode = () => randomDigits(TICKET_CODE_DIGITS);

export const newCertificateNumber = () => randomDigits(CERTIFICATE_DIGITS);

/** El slab lleva el mismo número que el certificado que contiene. */
export const slabSerialFor = (certificateNumber: string) => certificateNumber;
