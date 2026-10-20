/**
 * Errores de la API en formato application/problem+json (RFC 9457).
 * `code` es un identificador estable que el frontend usa para elegir el mensaje.
 */
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type Problem = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [extension: string]: unknown;
};

type ProblemOptions = {
  code?: string;
  extensions?: Record<string, unknown>;
  headers?: Record<string, string>;
};

export class ProblemError extends Error {
  readonly code?: string;
  readonly extensions: Record<string, unknown>;
  readonly headers: Record<string, string>;

  constructor(
    readonly status: ContentfulStatusCode,
    readonly title: string,
    readonly detail?: string,
    options: ProblemOptions = {},
  ) {
    super(detail ?? title);
    this.code = options.code;
    this.extensions = options.extensions ?? {};
    this.headers = options.headers ?? {};
  }
}

export function problemResponse(c: Context, problem: Problem, headers: Record<string, string> = {}) {
  return c.body(JSON.stringify(problem), problem.status as ContentfulStatusCode, {
    ...headers,
    'Content-Type': 'application/problem+json',
  });
}

export const notFound = (detail?: string) => new ProblemError(404, 'Not Found', detail);

export const unauthenticated = () =>
  new ProblemError(401, 'Unauthorized', 'Inicia sesión para continuar.', { code: 'unauthenticated' });

export const forbidden = () =>
  new ProblemError(403, 'Forbidden', 'No tienes permiso para hacer esto.', { code: 'forbidden' });

export const tooManyRequests = (retryAfterSeconds: number) =>
  new ProblemError(429, 'Too Many Requests', 'Demasiadas solicitudes. Inténtalo más tarde.', {
    code: 'too_many_requests',
    extensions: { retryAfterSeconds },
    headers: { 'Retry-After': String(retryAfterSeconds) },
  });
