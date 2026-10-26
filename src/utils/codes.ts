import { ORDER_CODE_DIGITS, TICKET_CODE_DIGITS } from '../../shared/codes';

/**
 * Código provisional con el formato oficial (solo números: 9 cifras el pedido, 7 el ticket).
 * Se usa mientras el pedido o el ticket todavía no se guardan en el servidor;
 * los códigos reales los genera la API.
 */
export function provisionalCode(type: 'ORD' | 'TKT'): string {
  const digits = type === 'ORD' ? ORDER_CODE_DIGITS : TICKET_CODE_DIGITS;
  const bytes = crypto.getRandomValues(new Uint8Array(digits));
  return Array.from(bytes, (b) => String(b % 10)).join('');
}
