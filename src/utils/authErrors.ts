import { ApiError } from '../api/client';

/** Mensaje para la persona a partir de un error al pedir o comprobar un código de acceso. */
export function authErrorMessage(err: unknown, es: boolean): string {
  const generic = es ? 'Algo salió mal. Inténtalo de nuevo.' : 'Something went wrong. Please try again.';
  if (!(err instanceof ApiError)) return generic;
  switch (err.code) {
    case 'validation_error':
      return es ? 'Introduce un correo válido' : 'Enter a valid email';
    case 'invalid_code': {
      const left = err.extra.attemptsLeft;
      if (typeof left === 'number') {
        return es
          ? `Código incorrecto. Te quedan ${left} ${left === 1 ? 'intento' : 'intentos'}.`
          : `Incorrect code. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`;
      }
      return es ? 'El código no es válido o ha caducado. Pide uno nuevo.' : 'The code is invalid or has expired. Request a new one.';
    }
    case 'too_many_attempts':
      return es ? 'Demasiados intentos. Pide un código nuevo.' : 'Too many attempts. Request a new code.';
    case 'too_many_requests': {
      const secs = Number(err.extra.retryAfterSeconds);
      const wait = secs > 0 && secs <= 60 ? `${secs} s` : es ? 'unos minutos' : 'a few minutes';
      return es ? `Espera ${wait} antes de pedir otro código.` : `Wait ${wait} before requesting another code.`;
    }
    case 'email_unavailable':
      return es ? 'El envío de códigos no está disponible todavía.' : 'Sending access codes is not available yet.';
    case 'network':
      return es ? 'No se pudo conectar con el servidor.' : 'Could not reach the server.';
    default:
      return generic;
  }
}
