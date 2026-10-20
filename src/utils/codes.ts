import { CODE_ALPHABET, CODE_PREFIX } from '../../shared/codes';

/**
 * Código provisional con el formato oficial (GGI-ORD-... o GGI-TKT-...).
 * Se usa mientras el pedido o el ticket todavía no se guardan en el servidor;
 * los códigos reales los genera la API.
 */
export function provisionalCode(type: 'ORD' | 'TKT'): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const suffix = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  return `${CODE_PREFIX}-${type}-${suffix}`;
}
