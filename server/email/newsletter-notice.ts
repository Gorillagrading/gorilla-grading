import { publicBaseUrl } from '../env.js';
import { frame } from './contact-notice.js';
import { esc } from './order-notice.js';
import type { Mail } from './transport.js';

type Data = Record<string, unknown>;

/** Correo de doble confirmación: solo queda suscrito quien pulsa el enlace. */
export function renderNewsletterEmail(_template: string, locale: string, to: string, data: Data): Mail {
  const token = typeof data.token === 'string' ? data.token : '';
  const base = publicBaseUrl();
  const confirmUrl = `${base}/newsletter?action=confirm&token=${encodeURIComponent(token)}`;
  const unsubscribeUrl = `${base}/newsletter?action=unsubscribe&token=${encodeURIComponent(token)}`;
  const en = locale === 'en';

  const title = en ? 'Confirm your subscription to the Inner Circle' : 'Confirma tu suscripción al Inner Circle';
  const body = en
    ? 'Someone (hopefully you) asked to receive Gorilla Grading news, early access to events and exclusive offers at this address. Confirm it with the button below. If it was not you, ignore this email and you will not receive anything.'
    : 'Alguien (esperamos que tú) ha pedido recibir en este correo las novedades de Gorilla Grading, acceso anticipado a eventos y ofertas exclusivas. Confírmalo con el botón. Si no has sido tú, ignora este correo y no recibirás nada.';
  const button = en ? 'Confirm subscription' : 'Confirmar suscripción';
  const leave = en ? 'You can unsubscribe at any time with this link:' : 'Puedes darte de baja cuando quieras con este enlace:';

  return {
    to,
    subject: title,
    text: `${body}\n\n${button}: ${confirmUrl}\n\n${leave} ${unsubscribeUrl}\n\nGorilla Grading`,
    html: frame(
      en ? 'en' : 'es',
      title,
      `<p style="font-size:15px;line-height:1.55;margin:0 0 20px;color:#374151;">${esc(body)}</p>
<a href="${confirmUrl}" style="display:inline-block;background:#15803D;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:12px 22px;">${esc(button)}</a>
<p style="font-size:12px;color:#6B7280;margin:22px 0 0;">${esc(leave)} <a href="${unsubscribeUrl}" style="color:#6B7280;">${esc(en ? 'unsubscribe' : 'darme de baja')}</a></p>`,
    ),
  };
}
