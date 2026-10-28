/**
 * Contratos del panel del laboratorio. Solo los ve el personal: incluyen datos de contacto
 * y notas internas que nunca salen en las vistas públicas.
 */
import { z } from 'zod';
import { OrderStatus, ShippingMethod, UserRole } from './domain.js';
import type { AdminGradingResult } from './grading-admin.js';

export const STAFF_ROLES = ['staff', 'grader', 'qa', 'admin'] as const satisfies readonly UserRole[];
export type StaffRole = (typeof STAFF_ROLES)[number];
export const isStaffRole = (role: string): role is StaffRole => (STAFF_ROLES as readonly string[]).includes(role);

/** Adónde va cada cuenta al iniciar sesión: el equipo a su panel, el cliente a su cuenta. */
export const homePathFor = (user: { role: string }) => (isStaffRole(user.role) ? '/admin' : '/account');

export const AdminOrdersQuery = z.object({
  /** Un estado, o "active" para todos los pedidos que siguen en curso. */
  status: z.union([OrderStatus, z.literal('active')]).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['oldest', 'newest']).default('oldest'),
  page: z.coerce.number().int().min(1).default(1),
});
export type AdminOrdersQuery = z.infer<typeof AdminOrdersQuery>;

export const TransitionBody = z.object({
  to: OrderStatus,
  /** Estado que la persona está viendo. Si el pedido ya cambió, el servidor lo rechaza. */
  expectedStatus: OrderStatus,
  /** Texto que verá el cliente. Si se omite, se usa el texto estándar en su idioma. */
  publicDescription: z.string().trim().max(500).optional(),
  /** Nota solo para el personal. */
  internalNote: z.string().trim().max(1000).optional(),
});
export type TransitionBody = z.infer<typeof TransitionBody>;

/** Qué carta es: lo rellena el laboratorio al recibirla. Es lo que sale en el certificado. */
export const IdentifyCardBody = z.object({
  cardName: z.string().trim().min(1).max(200),
  game: z.string().trim().min(1).max(80),
  setName: z.string().trim().max(200).optional(),
  cardNumber: z.string().trim().max(40).optional(),
  year: z.number().int().min(1800).max(2100).optional(),
  language: z.string().trim().max(40).optional(),
});
export type IdentifyCardBody = z.infer<typeof IdentifyCardBody>;

export const ShipmentBody = z.object({
  direction: z.enum(['inbound', 'outbound']),
  carrier: z.string().trim().min(1).max(80),
  trackingNumber: z.string().trim().min(1).max(80),
  insuredValueCents: z.number().int().min(0).max(100_000_000).optional(),
});
export type ShipmentBody = z.infer<typeof ShipmentBody>;

export interface AdminOrderRow {
  code: string;
  status: OrderStatus;
  paymentStatus: string;
  submittedAt: string;
  itemCount: number;
  totalCents: number | null;
  shippingMethod: ShippingMethod | null;
  customerEmail: string;
  customerName: string | null;
}

export interface AdminOrderList {
  orders: AdminOrderRow[];
  /** Pedidos por estado, para las pestañas del panel. No dependen del filtro actual. */
  counts: Partial<Record<OrderStatus, number>>;
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminTransitionOption {
  to: OrderStatus;
  requiresNote: boolean;
  /** Falso si la persona tiene permiso pero hoy no se puede hacer; `blockedReason` explica por qué. */
  allowed: boolean;
  blockedReason?: 'tracking_required' | 'two_person_rule' | 'grading_incomplete';
}

export interface AdminOrderDetail {
  order: {
    code: string;
    status: OrderStatus;
    statusBeforeHold: OrderStatus | null;
    paymentStatus: string;
    shippingMethod: ShippingMethod | null;
    submittedAt: string | null;
    estimatedCompletionAt: string | null;
    subtotalCents: number | null;
    shippingCents: number | null;
    taxCents: number | null;
    totalCents: number | null;
  };
  customer: { email: string; fullName: string | null; locale: string };
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    countryCode: string;
    phone?: string;
  } | null;
  items: {
    position: number;
    cardName: string | null;
    game: string | null;
    setName: string | null;
    cardNumber: string | null;
    year: number | null;
    language: string | null;
    declaredValueCents: number;
    tier: string;
    unitPriceCents: number;
    notes: string | null;
    /** Resultado vigente de la graduación; null si todavía no se ha introducido. */
    grading: AdminGradingResult | null;
  }[];
  shipments: {
    id: string;
    direction: 'inbound' | 'outbound';
    carrier: string;
    trackingNumber: string | null;
    insuredValueCents: number | null;
    createdAt: string;
  }[];
  timeline: {
    id: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    publicLabel: string;
    publicDescription: string | null;
    internalNote: string | null;
    actor: { email: string; fullName: string | null } | null;
    /** Lo hizo el sistema solo, no una persona. */
    automatic: boolean;
    occurredAt: string;
  }[];
  /** Avance automático del pedido; null si no está activado (todavía no se confirmó la recepción). */
  automation: {
    /** Fases que el sistema irá pasando solo, con la fecha prevista. */
    nextSteps: { to: OrderStatus; at: string }[];
    /** Ya pasó todas las fases y espera a que una persona apruebe la salida. */
    awaitingFinalApproval: boolean;
  } | null;
  /** Acciones disponibles para quien consulta, según su rol y el estado actual. */
  transitions: AdminTransitionOption[];
  canAddShipment: boolean;
}
