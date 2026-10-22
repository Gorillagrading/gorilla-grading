import { publicBaseUrl } from '../env.js';
import type { Mail } from './transport.js';

type Locale = 'es' | 'en';
type Data = Record<string, unknown>;

/** Carta del pedido tal como la guarda la emisión de certificados (server/domain/issue-certificates.ts). */
type IssuedCard =
  | { position: number; cardName: string; authentic: true; number: string; grade: number; label: string }
  | { position: number; cardName: string; authentic: false };

const euros = (cents: unknown, locale: Locale) =>
  typeof cents === 'number'
    ? new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
    : '';

const text = (value: unknown) => (typeof value === 'string' ? value : '');

/** Todo lo que viene del pedido (nombres de cartas, textos) se escapa antes de ir al HTML. */
const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const isIssuedCard = (v: unknown): v is IssuedCard =>
  !!v && typeof v === 'object' && typeof (v as IssuedCard).cardName === 'string' && typeof (v as IssuedCard).authentic === 'boolean';

const COPY = {
  es: {
    order: 'Pedido',
    footer: 'Puedes seguir tu pedido en cualquier momento desde tu cuenta.',
    viewOrder: 'Ver mi pedido',
    myAccount: 'Ir a mi cuenta',
    certificates: 'Tus certificados',
    viewCert: 'Ver certificado',
    notAuthentic: 'No hemos podido autenticar estas cartas, por lo que no reciben certificado:',
    tracking: 'Seguimiento de la devolución',
    certNote: 'Cada certificado se puede verificar en cualquier momento con su número o con el código QR del slab.',
    legal: 'Has recibido este correo porque tienes un pedido en Gorilla Grading.',
    submittedSubject: (code: string) => `Hemos registrado tu pedido ${code}`,
    submittedBody: (code: string, count: number, total: string) =>
      `Hemos registrado tu pedido ${code}${count ? ` (${count} cartas)` : ''}${total ? `, total ${total}` : ''}.`,
    submittedNext: 'En cuanto recibamos tu paquete te avisaremos.',
    update: 'Actualización de tu pedido',
  },
  en: {
    order: 'Order',
    footer: 'You can follow your order at any time from your account.',
    viewOrder: 'View my order',
    myAccount: 'Go to my account',
    certificates: 'Your certificates',
    viewCert: 'View certificate',
    notAuthentic: 'We could not authenticate these cards, so they do not receive a certificate:',
    tracking: 'Return tracking',
    certNote: 'Every certificate can be verified at any time with its number or the QR code on the slab.',
    legal: 'You received this email because you have an order with Gorilla Grading.',
    submittedSubject: (code: string) => `We registered your order ${code}`,
    submittedBody: (code: string, count: number, total: string) =>
      `We registered your order ${code}${count ? ` (${count} cards)` : ''}${total ? `, total ${total}` : ''}.`,
    submittedNext: 'We will let you know as soon as we receive your package.',
    update: 'Update on your order',
  },
} as const;

const gradeText = (n: number, lang: Locale) => n.toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB', { maximumFractionDigits: 1 });

/** Plantilla HTML común: sobria, con estilos en línea (los clientes de correo ignoran las hojas de estilo). */
function layout(opts: { lang: Locale; title: string; code: string; body: string; base: string }): string {
  const c = COPY[opts.lang];
  const button = (href: string, label: string, primary: boolean) =>
    `<a href="${href}" style="display:inline-block;padding:11px 20px;margin:0 8px 8px 0;font-weight:700;font-size:14px;text-decoration:none;border-radius:6px;${
      primary ? 'background:#15803D;color:#ffffff;' : 'background:#ffffff;color:#14532D;border:1px solid #15803D;'
    }">${label}</a>`;
  return `<!doctype html>
<html lang="${opts.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#F3F4F1;font-family:Helvetica,Arial,sans-serif;color:#111827;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F1;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E5E7EB;">
<tr><td style="padding:22px 28px;border-bottom:3px solid #15803D;">
<div style="font-size:20px;font-weight:900;letter-spacing:0.5px;line-height:1;">GORILLA</div>
<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#15803D;margin-top:2px;">GRADING</div>
</td></tr>
<tr><td style="padding:28px;">
<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6B7280;">${c.order} <span style="font-family:Consolas,Menlo,monospace;color:#111827;">${esc(opts.code)}</span></div>
<h1 style="font-size:22px;line-height:1.25;margin:8px 0 16px;font-weight:800;">${esc(opts.title)}</h1>
${opts.body}
<div style="margin-top:24px;">
${button(`${opts.base}/track?code=${encodeURIComponent(opts.code)}`, c.viewOrder, true)}${button(`${opts.base}/account`, c.myAccount, false)}
</div>
</td></tr>
<tr><td style="padding:18px 28px;background:#F9FAFB;border-top:1px solid #E5E7EB;font-size:12px;color:#6B7280;line-height:1.5;">
${c.footer}<br>${c.legal}<br><a href="${opts.base}" style="color:#15803D;">${opts.base.replace(/^https?:\/\//, '')}</a>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

const paragraph = (value: string) => `<p style="font-size:15px;line-height:1.55;margin:0 0 14px;color:#374151;">${esc(value)}</p>`;

/** Bloque de certificados y cartas no auténticas, en HTML y en texto. */
function certificatesBlock(cards: IssuedCard[], lang: Locale, base: string) {
  const c = COPY[lang];
  const certified = cards.filter((x): x is Extract<IssuedCard, { authentic: true }> => x.authentic);
  const rejected = cards.filter((x) => !x.authentic);
  let html = '';
  let plain = '';

  if (certified.length > 0) {
    const rows = certified
      .map((x) => {
        const url = `${base}/certificates/${encodeURIComponent(x.number)}`;
        return `<tr>
<td style="padding:12px 0;border-top:1px solid #E5E7EB;vertical-align:top;">
<div style="font-weight:700;font-size:14px;">${esc(x.cardName)}</div>
<div style="font-family:Consolas,Menlo,monospace;font-size:12px;color:#6B7280;margin-top:2px;">${esc(x.number)}</div>
</td>
<td style="padding:12px 0 12px 12px;border-top:1px solid #E5E7EB;text-align:right;vertical-align:top;white-space:nowrap;">
<div style="font-size:20px;font-weight:900;color:#15803D;line-height:1;">${gradeText(x.grade, lang)}</div>
<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#374151;margin-top:3px;">${esc(x.label)}</div>
<a href="${url}" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:700;color:#15803D;">${c.viewCert} &rarr;</a>
</td></tr>`;
      })
      .join('');
    html += `<h2 style="font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#6B7280;margin:22px 0 4px;">${c.certificates}</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<p style="font-size:12px;color:#6B7280;margin:8px 0 0;">${c.certNote}</p>`;
    plain += `\n${c.certificates}:\n${certified
      .map((x) => `- ${x.cardName}: ${gradeText(x.grade, lang)} ${x.label} · ${x.number}\n  ${base}/certificates/${x.number}`)
      .join('\n')}\n${c.certNote}\n`;
  }

  if (rejected.length > 0) {
    html += `<p style="font-size:13px;color:#991B1B;margin:18px 0 4px;">${c.notAuthentic}</p>
<ul style="margin:0 0 0 18px;padding:0;font-size:13px;color:#374151;">${rejected.map((x) => `<li>${esc(x.cardName)}</li>`).join('')}</ul>`;
    plain += `\n${c.notAuthentic}\n${rejected.map((x) => `- ${x.cardName}`).join('\n')}\n`;
  }
  return { html, plain };
}

/** Convierte una fila de la cola (plantilla + datos) en el email que se envía al cliente. */
export function renderOrderEmail(template: string, locale: string, to: string, data: Data): Mail {
  const lang: Locale = locale === 'en' ? 'en' : 'es';
  const c = COPY[lang];
  const code = text(data.orderCode);
  const base = publicBaseUrl();
  const orderUrl = `${base}/track?code=${encodeURIComponent(code)}`;

  if (template === 'order_submitted') {
    const total = euros(data.totalCents, lang);
    const count = typeof data.itemCount === 'number' ? data.itemCount : 0;
    const title = c.submittedSubject(code);
    const body = paragraph(c.submittedBody(code, count, total)) + paragraph(c.submittedNext);
    return {
      to,
      subject: title,
      text: `${c.submittedBody(code, count, total)}\n\n${c.submittedNext}\n\n${c.viewOrder}: ${orderUrl}\n\n${c.footer}\n\nGorilla Grading`,
      html: layout({ lang, title, code, body, base }),
    };
  }

  // Resto de plantillas `order_<estado>`: el título y la descripción ya vienen en el idioma del cliente.
  const label = text(data.label) || c.update;
  const description = text(data.description);
  const cards = Array.isArray(data.cards) ? data.cards.filter(isIssuedCard) : [];
  const carrier = text(data.carrier);
  const trackingNumber = text(data.trackingNumber);

  let htmlBody = description ? paragraph(description) : '';
  let plainBody = description ? `${description}\n` : '';

  if (trackingNumber) {
    htmlBody += `<div style="margin:6px 0 4px;padding:12px 14px;background:#F9FAFB;border:1px solid #E5E7EB;">
<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6B7280;">${c.tracking}</div>
<div style="font-size:15px;margin-top:4px;">${esc(carrier)} &middot; <span style="font-family:Consolas,Menlo,monospace;font-weight:700;">${esc(trackingNumber)}</span></div>
</div>`;
    plainBody += `\n${c.tracking}: ${carrier} · ${trackingNumber}\n`;
  }

  if (cards.length > 0) {
    const block = certificatesBlock(cards, lang, base);
    htmlBody += block.html;
    plainBody += block.plain;
  }

  return {
    to,
    subject: `${label} · ${code}`,
    text: `${label}\n${c.order} ${code}\n\n${plainBody}\n${c.viewOrder}: ${orderUrl}\n${c.myAccount}: ${base}/account\n\n${c.footer}\n\nGorilla Grading`,
    html: layout({ lang, title: label, code, body: htmlBody, base }),
  };
}
