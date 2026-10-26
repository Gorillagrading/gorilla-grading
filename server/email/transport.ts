import nodemailer from 'nodemailer';
import { isProduction } from '../env.js';

/**
 * `html` es opcional: los clientes de correo muestran el HTML y, si no pueden, el texto.
 * `replyTo` hace que "Responder" conteste a esa dirección (por ejemplo, al cliente que escribió).
 */
export type Mail = { to: string; subject: string; text: string; html?: string; replyTo?: string };
export type SendMail = (mail: Mail) => Promise<void>;

/** Configuración SMTP. Sirve para Postmark, IONOS, Amazon SES…: solo cambian las variables. */
export function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM;
  if (!host || !user || !pass || !from) return null;
  return { host, port: Number(process.env.SMTP_PORT ?? 587), user, pass, from };
}

/** Fuera de desarrollo, sin SMTP no se puede enviar nada. */
export const mailAvailable = () => smtpConfig() !== null || !isProduction();

/** Envía por SMTP. En desarrollo, sin SMTP, escribe el email en la consola de la API. */
export const sendMail: SendMail = async (mail) => {
  const config = smtpConfig();
  if (!config) {
    if (isProduction()) throw new Error('smtp_not_configured');
    console.log(`\n  [DEV] Email para ${mail.to}\n  Asunto: ${mail.subject}\n\n${mail.text}\n`);
    return;
  }
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });
  await transport.sendMail({ from: config.from, ...mail });
};
