/**
 * Formatos de los códigos visibles de Gorilla Grading. Todos empiezan por GGI-.
 * La base de datos rechaza cualquier código que no cumpla su formato.
 *
 *   Pedido       GGI-ORD-7K4M9Q   6 caracteres aleatorios
 *   Ticket       GGI-TKT-3FX8RB   6 caracteres aleatorios
 *   Certificado  GGI-892401       6 dígitos
 *   Slab         GGI-SLB-892401   los mismos 6 dígitos que su certificado
 */
export const CODE_PREFIX = 'GGI';

/** Letras y números sin confusiones: sin 0, O, 1 ni I. Se usa solo al generar códigos nuevos. */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const ORDER_CODE = /^GGI-ORD-[A-Z0-9]{6}$/;
export const TICKET_CODE = /^GGI-TKT-[A-Z0-9]{6}$/;
export const CERTIFICATE_NUMBER = /^GGI-[0-9]{6}$/;
export const SLAB_SERIAL = /^GGI-SLB-[0-9]{6}$/;
