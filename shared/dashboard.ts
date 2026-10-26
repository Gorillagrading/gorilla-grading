/**
 * Panel de negocio: cifras para la dirección. Solo lo ve el rol admin.
 * Todo sale de la base de datos real; nada se estima ni se rellena.
 */
import { z } from 'zod';
import type { OrderStatus } from './domain.js';

export const DASHBOARD_RANGES = ['30d', '90d', '12m', 'all'] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export const DashboardQuery = z.object({
  range: z.enum(DASHBOARD_RANGES).default('30d'),
});

/** Cada barra de las gráficas: un día (30 días), una semana (90 días) o un mes (12 meses y todo). */
export type DashboardBucketUnit = 'day' | 'week' | 'month';

export interface DashboardBucket {
  /** Inicio del tramo en hora de Madrid: AAAA-MM-DD. */
  start: string;
  revenueCents: number;
  payments: number;
  newCustomers: number;
  cardsGraded: number;
  orders: number;
}

/** Valor del periodo elegido y del periodo anterior de la misma duración (null en "todo"). */
export interface DashboardMetric {
  current: number;
  previous: number | null;
}

export interface DashboardData {
  range: DashboardRange;
  unit: DashboardBucketUnit;
  /** Inicio del periodo (ISO). */
  from: string;
  generatedAt: string;
  metrics: {
    revenueCents: DashboardMetric;
    payments: DashboardMetric;
    newCustomers: DashboardMetric;
    cardsGraded: DashboardMetric;
    orders: DashboardMetric;
    certificates: DashboardMetric;
    verifications: DashboardMetric;
  };
  /** Acumulado desde el principio, sin depender del periodo. */
  totals: {
    revenueCents: number;
    customers: number;
    cardsGraded: number;
    certificates: number;
  };
  /** Pedidos enviados que esperan el pago. */
  awaitingPayment: { orders: number; totalCents: number };
  buckets: DashboardBucket[];
  /** Pedidos por estado ahora mismo. */
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  /** Notas finales aprobadas en el periodo. Las cartas no auténticas van aparte. */
  grades: { grade: number; count: number }[];
  notAuthentic: number;
  /** Cartas enviadas en el periodo por servicio. */
  services: { code: string; name: string; cards: number; revenueCents: number }[];
  recentPayments: {
    orderCode: string;
    customer: string;
    amountCents: number;
    paidAt: string;
  }[];
}
