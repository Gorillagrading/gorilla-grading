import { ROLE_INFO } from '../../shared/team.js';
import type { StaffRole } from '../../shared/admin.js';
import { publicBaseUrl } from '../env.js';
import { frame } from './contact-notice.js';
import { esc } from './order-notice.js';
import type { Mail } from './transport.js';

type Data = Record<string, unknown>;

/** Aviso a quien entra en el equipo: qué rol tiene y cómo entrar (correo + código). */
export function renderTeamEmail(_template: string, locale: string, to: string, data: Data): Mail {
  const role = (typeof data.role === 'string' && data.role in ROLE_INFO ? data.role : 'staff') as StaffRole;
  const info = ROLE_INFO[role];
  const name = typeof data.fullName === 'string' && data.fullName ? data.fullName : null;
  const invitedBy = typeof data.invitedBy === 'string' ? data.invitedBy : 'Gorilla Grading';
  const loginUrl = `${publicBaseUrl()}/login`;
  const en = locale === 'en';

  const title = en ? 'You now have access to the Gorilla Grading lab panel' : 'Ya tienes acceso al panel del laboratorio de Gorilla Grading';
  const hello = en ? `Hi${name ? ` ${name}` : ''},` : `Hola${name ? ` ${name}` : ''},`;
  const intro = en
    ? `${invitedBy} has added you to the team with the role "${info.name}". ${info.summary}`
    : `${invitedBy} te ha añadido al equipo con el rol «${info.name}». ${info.summary}`;
  const how = en
    ? `To sign in, go to ${loginUrl}, enter this email address (${to}) and type the code we send you. No password needed.`
    : `Para entrar, ve a ${loginUrl}, escribe este correo (${to}) e introduce el código que te enviaremos. No necesitas contraseña.`;
  const button = en ? 'Sign in' : 'Entrar';

  return {
    to,
    subject: title,
    text: `${hello}\n\n${intro}\n\n${how}\n\nGorilla Grading`,
    html: frame(
      en ? 'en' : 'es',
      title,
      `<p style="font-size:15px;line-height:1.55;margin:0 0 12px;color:#374151;">${esc(hello)}</p>
<p style="font-size:15px;line-height:1.55;margin:0 0 12px;color:#374151;">${esc(intro)}</p>
<p style="font-size:15px;line-height:1.55;margin:0 0 20px;color:#374151;">${esc(how)}</p>
<a href="${loginUrl}" style="display:inline-block;background:#15803D;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:12px 22px;">${esc(button)}</a>`,
    ),
  };
}
