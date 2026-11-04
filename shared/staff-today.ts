/**
 * Pantalla "Hoy" del panel del laboratorio: lo que tiene pendiente cada persona del equipo
 * según su rol. Solo la ve el personal.
 */
import type { OrderStatus } from './domain.js';
import type { StaffRole } from './admin.js';

export const TODAY_SECTIONS = [
  'late',
  'toReceive',
  'toIdentify',
  'photosMissing',
  'returnedByQa',
  'toGrade',
  'myDrafts',
  'toReview',
  'readyToShip',
  'toDeliver',
  'onHold',
] as const;
export type TodaySectionKey = (typeof TODAY_SECTIONS)[number];

/** Qué ve cada rol, en el orden en que lo ve. */
export const SECTIONS_BY_ROLE: Record<StaffRole, readonly TodaySectionKey[]> = {
  staff: ['toReceive', 'toIdentify', 'toDeliver', 'onHold', 'photosMissing'],
  grader: ['returnedByQa', 'toIdentify', 'toGrade', 'myDrafts', 'photosMissing'],
  qa: ['toReview', 'readyToShip'],
  admin: ['late', 'returnedByQa', 'toReceive', 'toIdentify', 'toGrade', 'myDrafts', 'toReview', 'readyToShip', 'toDeliver', 'onHold', 'photosMissing'],
};

/** Secciones de pedidos enteros que se pueden abrir filtradas en la lista de pedidos. */
export const SECTION_STATUS: Partial<Record<TodaySectionKey, OrderStatus>> = {
  toReceive: 'SUBMITTED',
  readyToShip: 'QUALITY_ASSURANCE',
  toDeliver: 'SHIPPED',
  onHold: 'ON_HOLD',
};

/** Cuántas tareas de cada sección se muestran; el número total va aparte. */
export const TODAY_ITEMS_LIMIT = 20;

export interface TodayTask {
  orderCode: string;
  customerName: string | null;
  customerEmail: string;
  /** Carta dentro del pedido (#1, #2…), en las tareas de una carta concreta. */
  position?: number;
  cardName?: string;
  /** Desde cuándo está pendiente. */
  since: string;
  /** Detalle útil: motivo del rechazo, de la pausa, fecha prevista… */
  note?: string;
  /** Estado del pedido. */
  status: OrderStatus;
  /** Inicio del plazo del servicio (recepción del paquete), si ya empezó. */
  startedAt: string | null;
  /** Fecha prevista de finalización (AAAA-MM-DD), si ya se conoce. */
  dueDate: string | null;
}

/** Pedidos en cada fase y cuántos de ellos han pasado su fecha prevista. */
export interface PipelineStage {
  status: OrderStatus;
  count: number;
  late: number;
}

export interface TodaySection {
  key: TodaySectionKey;
  count: number;
  tasks: TodayTask[];
}

export interface StaffToday {
  sections: TodaySection[];
  /** El laboratorio entero, fase por fase (igual para todos los roles). */
  pipeline: PipelineStage[];
}

/** Fases que se cuentan en la tira del laboratorio, en orden. */
export const PIPELINE_STAGES: OrderStatus[] = [
  'SUBMITTED', 'PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE', 'SHIPPED', 'ON_HOLD',
];
