import type { Context, MiddlewareHandler } from 'hono';
import type { z } from 'zod';
import { allowedOrigins } from './env.js';
import { ProblemError } from './problem.js';

/** Lee el cuerpo JSON y lo valida con un schema Zod; responde 400 o 422 si no es válido. */
export async function parseJson<T extends z.ZodType>(c: Context, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new ProblemError(400, 'Bad Request', 'El cuerpo de la petición debe ser JSON válido.', {
      code: 'invalid_json',
    });
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ProblemError(422, 'Validation Error', 'Los datos enviados no son válidos.', {
      code: 'validation_error',
      extensions: {
        errors: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }
  return result.data;
}

/** IP del cliente. En Vercel x-forwarded-for la fija la plataforma. */
export function clientIp(c: Context): string | null {
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || c.req.header('x-real-ip') || null;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Defensa contra CSRF además de SameSite=Lax: una petición que modifica datos
 * debe venir del propio sitio o de un origen permitido.
 */
export const sameOriginOnly: MiddlewareHandler = async (c, next) => {
  if (!SAFE_METHODS.has(c.req.method)) {
    const origin = c.req.header('origin');
    if (origin && origin !== new URL(c.req.url).origin && !allowedOrigins().includes(origin)) {
      throw new ProblemError(403, 'Forbidden', 'Origen no permitido.', { code: 'cross_origin' });
    }
  }
  await next();
};
