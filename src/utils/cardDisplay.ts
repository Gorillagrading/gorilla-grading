/**
 * Ayudas para mostrar los datos de una carta certificada. Hay datos que el cliente no siempre indica
 * (año, número, idioma) o que el laboratorio no mide (nota por cara): no se muestran en vez de enseñar "0".
 */

/** Año de la carta, o null si no se conoce. */
export const cardYear = (year: number) => (year > 0 ? String(year) : null);

/** Nota por cara ("FRENTE 9.5 · DORSO 9.0"), o cadena vacía si el laboratorio no la registró. */
export function sideScores(s: { frontScore: number; backScore: number }, es: boolean, decimals = true): string {
  const fmt = (n: number) => (decimals ? n.toFixed(1) : String(n));
  const parts: string[] = [];
  if (s.frontScore > 0) parts.push(`${es ? 'FRENTE' : 'FRONT'} ${fmt(s.frontScore)}`);
  if (s.backScore > 0) parts.push(`${es ? 'DORSO' : 'BACK'} ${fmt(s.backScore)}`);
  return parts.join(' · ');
}

/** "o —" para un dato vacío en una ficha con etiquetas fijas. */
export const orDash = (value: string | null | undefined) => (value && value.trim() ? value : '—');
