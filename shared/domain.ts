/**
 * Valores de dominio compartidos por frontend y backend. El esquema de base de
 * datos genera sus enums a partir de estas listas, así que solo se cambian aquí.
 */
import { z } from 'zod';

export const USER_ROLES = ['customer', 'staff', 'grader', 'qa', 'admin'] as const;
export const UserRole = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof UserRole>;

/**
 * Los 8 estados que ya usa el frontend, más DRAFT (borrador antes de enviar) y
 * los que pide el plan: PAYMENT_PENDING, ON_HOLD, CANCELLED y RETURNED.
 */
export const ORDER_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'PAYMENT_PENDING',
  'PACKAGE_RECEIVED',
  'PRE_INSPECTION',
  'OPTICAL_GRADING',
  'ENCAPSULATION',
  'QUALITY_ASSURANCE',
  'SHIPPED',
  'DELIVERED',
  'ON_HOLD',
  'CANCELLED',
  'RETURNED',
] as const;
export const OrderStatus = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof OrderStatus>;

/** Estados en los que un pedido ya no se mueve. */
export const FINISHED_STATUSES: readonly OrderStatus[] = ['DELIVERED', 'CANCELLED', 'RETURNED'];

/** Estados de un pedido en curso: enviado por el cliente y todavía no cerrado. */
export const ACTIVE_STATUSES: readonly OrderStatus[] = ORDER_STATUSES.filter(
  (s) => s !== 'DRAFT' && !FINISHED_STATUSES.includes(s),
);

export const SHIPPING_METHODS = ['COURIER_INSURED', 'CARD_SHOW_DROPOFF', 'VAULT_STORE'] as const;
export const ShippingMethod = z.enum(SHIPPING_METHODS);
export type ShippingMethod = z.infer<typeof ShippingMethod>;

export const CERTIFICATE_STATUSES = ['active', 'revoked', 'superseded'] as const;
export const CertificateStatus = z.enum(CERTIFICATE_STATUSES);
export type CertificateStatus = z.infer<typeof CertificateStatus>;
