import nodemailer from 'nodemailer';
import { isProduction } from '../env.js';
import { ProblemError } from '../problem.js';

export type SendLoginCode = (to: string, code: string, locale: 'es' | 'en') => Promise<void>;

/** Configuración SMTP. Sirve para IONOS, Amazon SES, Postmark, Google Workspace… solo cambian las variables. */
function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM;
  if (!host || !user || !pass || !from) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  return { host, port, user, pass, from };
}

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

/**
 * En desarrollo (sin SMTP) el código se escribe en la consola de la API.
 * En producción hace falta SMTP_HOST, SMTP_USER, SMTP_PASS y MAIL_FROM.
 */
export const sendLoginCode: SendLoginCode = async (to, code, locale) => {
  const config = smtpConfig();
  if (!config) {
    if (isProduction()) {
      throw new ProblemError(503, 'Service Unavailable', 'El envío de emails todavía no está configurado.', {
        code: 'email_unavailable',
      });
    }
    console.log(`\n  [DEV] Código de acceso para ${to}: ${code}\n`);
    return;
  }
  const t = texts[locale] ?? texts.en;
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });
  try {
    await transport.sendMail({ from: config.from, to, subject: t.subject(code), text: t.body(code) });
  } catch (error) {
    console.error('[email] fallo al enviar el código de acceso', error);
    throw new ProblemError(503, 'Service Unavailable', 'No se ha podido enviar el email.', {
      code: 'email_unavailable',
    });
  }
};
