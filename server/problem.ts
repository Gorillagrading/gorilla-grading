/**
 * Errores de la API en formato application/problem+json (RFC 9457).
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

export class ProblemError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly title: string,
    readonly detail?: string,
    readonly extensions: Record<string, unknown> = {},
    /** Identificador corto del error, se publica como `type`. */
    readonly code = 'about:blank',
  ) {
    super(detail ?? title);
  }
}

export function problemResponse(c: Context, problem: Problem) {
  return c.body(JSON.stringify(problem), problem.status as ContentfulStatusCode, {
    'Content-Type': 'application/problem+json',
  });
}

export const notFound = (detail?: string) => new ProblemError(404, 'Not Found', detail);
