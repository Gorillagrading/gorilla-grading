import { randomInt } from 'node:crypto';
import { CODE_ALPHABET, CODE_PREFIX } from '../shared/codes';

const randomChars = (length: number) =>
  Array.from({ length }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');

/** Código de pedido no adivinable. Quien lo crea debe reintentar si choca con uno existente (índice único). */
export const newOrderCode = () => `${CODE_PREFIX}-ORD-${randomChars(6)}`;

export const newTicketCode = () => `${CODE_PREFIX}-TKT-${randomChars(6)}`;

export const newCertificateNumber = () => `${CODE_PREFIX}-${String(randomInt(0, 1_000_000)).padStart(6, '0')}`;

/** El serial del slab lleva los mismos dígitos que el certificado que contiene. */
export const slabSerialFor = (certificateNumber: string) =>
  `${CODE_PREFIX}-SLB-${certificateNumber.slice(CODE_PREFIX.length + 1)}`;
