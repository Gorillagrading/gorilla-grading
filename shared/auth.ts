/**
 * Contratos de la API de cuentas, compartidos por frontend y backend.
 * El frontend solo debe importar tipos de aquí (`import type`).
 */
import { z } from 'zod';
import { UserRole } from './domain.js';

export const Locale = z.enum(['es', 'en']);
export type Locale = z.infer<typeof Locale>;

export const Email = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const RequestCodeBody = z.object({
  email: Email,
  locale: Locale.optional(),
});
export type RequestCodeBody = z.infer<typeof RequestCodeBody>;

export const VerifyCodeBody = z.object({
  email: Email,
  code: z.string().regex(/^\d{6}$/),
});
export type VerifyCodeBody = z.infer<typeof VerifyCodeBody>;

export const UserDto = z.object({
  id: z.uuid(),
  email: z.string(),
  fullName: z.string().nullable(),
  locale: z.string(),
  role: UserRole,
  createdAt: z.string(),
  /** Código para mostrar en la cuenta (GGI-CLI-XXXXXX). Se deriva del id; no sustituye al id. */
  customerCode: z.string(),
});
export type UserDto = z.infer<typeof UserDto>;

/** Códigos de error que el frontend traduce a un mensaje para la persona. */
export type AuthErrorCode =
  | 'invalid_code'
  | 'too_many_attempts'
  | 'too_many_requests'
  | 'validation_error'
  | 'email_unavailable'
  | 'unauthenticated'
  | 'forbidden'
  | 'cross_origin';
