import type { Mail } from './transport.js';

type Locale = 'es' | 'en';
type Data = Record<string, unknown>;

const euros = (cents: unknown, locale: Locale) =>
  typeof cents === 'number'
    ? new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
    : '';

const text = (value: unknown) => (typeof value === 'string' ? value : '');

const SIGNATURE = { es: 'Gorilla Grading', en: 'Gorilla Grading' } as const;

const FOOTER = {
  es: 'Puedes seguir tu pedido en cualquier momento desde tu cuenta.',
  en: 'You can follow your order at any time from your account.',
} as const;

/** Convierte una fila de la cola (plantilla + datos) en el email que se envía al cliente. */
export function renderOrderEmail(template: string, locale: string, to: string, data: Data): Mail {
  const lang: Locale = locale === 'en' ? 'en' : 'es';
  const code = text(data.orderCode);

  if (template === 'order_submitted') {
    const total = euros(data.totalCents, lang);
    const count = typeof data.itemCount === 'number' ? data.itemCount : 0;
    return {
      to,
      subject: lang === 'es' ? `Hemos registrado tu pedido ${code}` : `We registered your order ${code}`,
      text:
        lang === 'es'
          ? `Hemos registrado tu pedido ${code}${count ? ` (${count} cartas)` : ''}${total ? `, total ${total}` : ''}.\n\nEn cuanto recibamos tu paquete te avisaremos.\n\n${FOOTER.es}\n\n${SIGNATURE.es}`
          : `We registered your order ${code}${count ? ` (${count} cards)` : ''}${total ? `, total ${total}` : ''}.\n\nWe will let you know as soon as we receive your package.\n\n${FOOTER.en}\n\n${SIGNATURE.en}`,
    };
  }

  // Resto de plantillas `order_<estado>`: el título y la descripción ya vienen en el idioma del cliente.
  const label = text(data.label) || (lang === 'es' ? 'Actualización de tu pedido' : 'Update on your order');
  const description = text(data.description);
  return {
    to,
    subject: `${label} · ${code}`,
    text: `${label}\n${lang === 'es' ? 'Pedido' : 'Order'} ${code}\n\n${description}\n\n${FOOTER[lang]}\n\n${SIGNATURE[lang]}`,
  };
}
