import { CONTACT_SUBJECTS, CONTACT_SUBJECT_LABEL, type ContactSubject } from '../../shared/contact.js';
import { publicBaseUrl } from '../env.js';
import { esc } from './order-notice.js';
import type { Mail } from './transport.js';

type Data = Record<string, unknown>;

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const subjectLabel = (value: unknown) =>
  CONTACT_SUBJECTS.includes(value as ContactSubject) ? CONTACT_SUBJECT_LABEL[value as ContactSubject] : 'Consulta';

const SUBJECT_EN: Record<ContactSubject, string> = {
  shipping: 'Shipping, packing and tracking',
  order: 'Order status',
  pricing: 'Pricing, invoicing and bulk',
  technical: 'Technology and grading criteria',
  events: 'Drop-off points and events',
  other: 'Other inquiry',
};

/** Marco HTML sobrio, con estilos en línea como los demás correos. */
export function frame(lang: 'es' | 'en', title: string, body: string) {
  const base = publicBaseUrl();
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#F3F4F1;font-family:Helvetica,Arial,sans-serif;color:#111827;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F1;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E5E7EB;">
<tr><td style="padding:22px 28px;border-bottom:3px solid #15803D;">
<div style="font-size:20px;font-weight:900;letter-spacing:0.5px;line-height:1;">GORILLA</div>
<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#15803D;margin-top:2px;">GRADING</div>
</td></tr>
<tr><td style="padding:28px;">
<h1 style="font-size:22px;line-height:1.25;margin:0 0 16px;font-weight:800;">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:18px 28px;background:#F9FAFB;border-top:1px solid #E5E7EB;font-size:12px;color:#6B7280;line-height:1.5;">
<a href="${base}" style="color:#15803D;">${base.replace(/^https?:\/\//, '')}</a>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

const row = (label: string, value: string, mono = false) =>
  `<tr><td style="padding:6px 12px 6px 0;font-size:13px;color:#6B7280;white-space:nowrap;vertical-align:top;">${esc(label)}</td><td style="padding:6px 0;font-size:14px;${mono ? 'font-family:Consolas,Menlo,monospace;font-weight:700;' : ''}">${esc(value)}</td></tr>`;

/** El mensaje del cliente, respetando sus saltos de línea. */
const messageBlock = (message: string) =>
  `<div style="margin-top:16px;padding:14px;background:#F9FAFB;border:1px solid #E5E7EB;font-size:14px;line-height:1.55;white-space:pre-wrap;">${esc(message)}</div>`;

export function renderContactEmail(template: string, locale: string, to: string, data: Data): Mail {
  const ticket = text(data.ticket);
  const name = text(data.name);
  const email = text(data.email);
  const orderCode = text(data.orderCode);
  const message = text(data.message);

  if (template === 'contact_received') {
    // Aviso al equipo. "Responder" contesta directamente al cliente.
    const subject = subjectLabel(data.subject);
    const title = `Nuevo mensaje de contacto · ticket ${ticket}`;
    const details = [row('Ticket', ticket, true), row('Nombre', name), row('Correo', email), row('Asunto', subject), ...(orderCode ? [row('Pedido', orderCode, true)] : [])];
    return {
      to,
      replyTo: email,
      subject: `[Contacto ${ticket}] ${subject} · ${name}`,
      text: `Nuevo mensaje de contacto\n\nTicket: ${ticket}\nNombre: ${name}\nCorreo: ${email}\nAsunto: ${subject}${orderCode ? `\nPedido: ${orderCode}` : ''}\n\n${message}\n\nResponde a este correo para contestar al cliente.`,
      html: frame('es', title, `<table role="presentation" cellpadding="0" cellspacing="0">${details.join('')}</table>${messageBlock(message)}<p style="font-size:13px;color:#6B7280;margin:16px 0 0;">Responde a este correo para contestar directamente al cliente.</p>`),
    };
  }

  // Confirmación al cliente, en su idioma.
  const en = locale === 'en';
  const subject = en ? SUBJECT_EN[data.subject as ContactSubject] ?? 'Inquiry' : subjectLabel(data.subject);
  const title = en ? `We received your message · ticket ${ticket}` : `Hemos recibido tu mensaje · ticket ${ticket}`;
  const intro = en
    ? `Hi ${name}, thank you for writing to us. Our team will reply to this email address as soon as possible. Your ticket number is ${ticket}.`
    : `Hola ${name}, gracias por escribirnos. Nuestro equipo te responderá a este correo lo antes posible. Tu número de ticket es ${ticket}.`;
  const copy = en ? 'Your message' : 'Tu mensaje';
  return {
    to,
    subject: title,
    text: `${intro}\n\n${copy} (${subject}):\n\n${message}\n\nGorilla Grading`,
    html: frame(
      en ? 'en' : 'es',
      title,
      `<p style="font-size:15px;line-height:1.55;margin:0 0 14px;color:#374151;">${esc(intro)}</p><div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6B7280;">${esc(copy)} · ${esc(subject)}</div>${messageBlock(message)}`,
    ),
  };
}
