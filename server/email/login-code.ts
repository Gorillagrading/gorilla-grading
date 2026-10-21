import { isProduction } from '../env.js';
import { ProblemError } from '../problem.js';
import { sendMail, smtpConfig } from './transport.js';

export type SendLoginCode = (to: string, code: string, locale: 'es' | 'en') => Promise<void>;

const texts = {
  es: {
    subject: (code: string) => `${code} es tu código de acceso a Gorilla Grading`,
    body: (code: string) =>
      `Tu código de acceso es: ${code}\n\nCaduca en 10 minutos. Si no lo has pedido tú, ignora este correo.\n\nGorilla Grading`,
  },
  en: {
    subject: (code: string) => `${code} is your Gorilla Grading sign-in code`,
    body: (code: string) =>
      `Your sign-in code is: ${code}\n\nIt expires in 10 minutes. If you didn't request it, ignore this email.\n\nGorilla Grading`,
  },
} as const;

const unavailable = (detail: string) =>
  new ProblemError(503, 'Service Unavailable', detail, { code: 'email_unavailable' });

/**
 * En desarrollo (sin SMTP) el código se escribe en la consola de la API.
 * En producción hace falta SMTP_HOST, SMTP_USER, SMTP_PASS y MAIL_FROM.
 */
export const sendLoginCode: SendLoginCode = async (to, code, locale) => {
  if (!smtpConfig()) {
    if (isProduction()) throw unavailable('El envío de emails todavía no está configurado.');
    console.log(`\n  [DEV] Código de acceso para ${to}: ${code}\n`);
    return;
  }
  const t = texts[locale] ?? texts.en;
  try {
    await sendMail({ to, subject: t.subject(code), text: t.body(code) });
  } catch (error) {
    console.error('[email] fallo al enviar el código de acceso', error);
    throw unavailable('No se ha podido enviar el email.');
  }
};
