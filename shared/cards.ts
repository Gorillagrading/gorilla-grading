/** Cómo se nombra una carta que el laboratorio todavía no ha identificado. */
export const cardTitle = (cardName: string | null | undefined, position: number, lang: 'es' | 'en' = 'es') =>
  cardName?.trim() || (lang === 'en' ? `Card #${String(position).padStart(2, '0')}` : `Carta #${String(position).padStart(2, '0')}`);
