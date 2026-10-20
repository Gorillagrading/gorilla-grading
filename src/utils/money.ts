/** Importes en céntimos a texto en euros: 3350 -> "33,50 €". */
export function formatEur(cents: number, language: 'es' | 'en' = 'es'): string {
  return (cents / 100).toLocaleString(language === 'es' ? 'es-ES' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
  });
}
