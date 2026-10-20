import { isProduction } from '../env.js';
import { ProblemError } from '../problem.js';

export type SendLoginCode = (to: string, code: string, locale: 'es' | 'en') => Promise<void>;

/**
 * En desarrollo el código se escribe en la consola de la API. Fuera de desarrollo hace
 * falta un proveedor de email (Resend, Fase 5); hasta entonces el login no está disponible.
 */
export const sendLoginCode: SendLoginCode = async (to, code) => {
  if (isProduction()) {
    throw new ProblemError(503, 'Service Unavailable', 'El envío de emails todavía no está configurado.', {
      code: 'email_unavailable',
    });
  }
  console.log(`\n  [DEV] Código de acceso para ${to}: ${code}\n`);
};
