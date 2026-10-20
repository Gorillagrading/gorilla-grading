/**
 * Recorrido de un pedido por el laboratorio: qué cambios de estado existen, quién puede
 * hacerlos y qué texto ve el cliente. Es el único sitio donde se definen; para cambiar una
 * regla (por ejemplo, quién puede recibir paquetes) basta con editar esta tabla.
 */
import type { OrderStatus, ShippingMethod, UserRole } from '../../shared/domain.js';

export interface TransitionRule {
  from: OrderStatus;
  to: OrderStatus;
  roles: readonly UserRole[];
  /** El motivo es obligatorio y queda como nota interna. */
  requiresNote?: boolean;
}

const LAB: readonly UserRole[] = ['staff', 'grader', 'qa', 'admin'];

/**
 * Primer paso (recibir el paquete) y últimos (aprobar la salida y entregar): los hace una persona.
 * Los cuatro pasos intermedios los hace solo el sistema según el plazo del servicio
 * (server/domain/automation.ts); aquí solo un admin puede adelantarlos a mano.
 */
const FORWARD: TransitionRule[] = [
  { from: 'SUBMITTED', to: 'PACKAGE_RECEIVED', roles: ['staff', 'admin'] },
  { from: 'PACKAGE_RECEIVED', to: 'PRE_INSPECTION', roles: ['admin'] },
  { from: 'PRE_INSPECTION', to: 'OPTICAL_GRADING', roles: ['admin'] },
  { from: 'OPTICAL_GRADING', to: 'ENCAPSULATION', roles: ['admin'] },
  { from: 'ENCAPSULATION', to: 'QUALITY_ASSURANCE', roles: ['admin'] },
  // Salida del laboratorio: la aprueba una persona de calidad (o un admin).
  { from: 'QUALITY_ASSURANCE', to: 'SHIPPED', roles: ['qa', 'admin'] },
  { from: 'SHIPPED', to: 'DELIVERED', roles: ['staff', 'admin'] },
];

/** Estados desde los que se puede poner un pedido en pausa o cancelarlo. */
const IN_LAB: OrderStatus[] = [
  'SUBMITTED', 'PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE',
];

/** Cambios de estado posibles desde el estado actual del pedido. */
export function rulesFrom(status: OrderStatus, statusBeforeHold: OrderStatus | null): TransitionRule[] {
  const rules: TransitionRule[] = FORWARD.filter((r) => r.from === status);

  if ([...IN_LAB, 'SHIPPED'].includes(status)) {
    rules.push({ from: status, to: 'ON_HOLD', roles: LAB, requiresNote: true });
  }
  if (status === 'ON_HOLD' && statusBeforeHold) {
    rules.push({ from: 'ON_HOLD', to: statusBeforeHold, roles: ['staff', 'admin'], requiresNote: true });
  }
  if (IN_LAB.includes(status) || status === 'ON_HOLD') {
    rules.push({ from: status, to: 'CANCELLED', roles: ['admin'], requiresNote: true });
  }
  return rules;
}

/** Estados en los que el cliente espera un aviso por email. */
export const NOTIFY_ON: OrderStatus[] = ['PACKAGE_RECEIVED', 'SHIPPED', 'DELIVERED', 'ON_HOLD', 'CANCELLED'];

type Locale = 'es' | 'en';
type Copy = { label: string; description: string };

const COPY: Partial<Record<OrderStatus, Record<Locale, Copy>>> = {
  PACKAGE_RECEIVED: {
    es: { label: 'Paquete recibido en la bóveda', description: 'Recibimos tu paquete y comprobamos que el precinto no se ha manipulado.' },
    en: { label: 'Package received in the vault', description: 'We received your package and checked that the seal has not been tampered with.' },
  },
  PRE_INSPECTION: {
    es: { label: 'Pre-inspección óptica', description: 'Identificamos cada carta y retiramos el polvo superficial.' },
    en: { label: 'Optical pre-inspection', description: 'We identify each card and remove surface dust.' },
  },
  OPTICAL_GRADING: {
    es: { label: 'Graduación óptica en curso', description: 'Medimos centrado, esquinas, bordes y superficie, y registramos los defectos.' },
    en: { label: 'Optical grading in progress', description: 'We measure centering, corners, edges and surface, and log any defects.' },
  },
  ENCAPSULATION: {
    es: { label: 'Encapsulado', description: 'Sellamos cada carta en su slab, con número de serie y chip NFC.' },
    en: { label: 'Encapsulation', description: 'We seal each card in its slab, with serial number and NFC chip.' },
  },
  QUALITY_ASSURANCE: {
    es: { label: 'Control de calidad', description: 'Un segundo experto revisa la nota y firma el certificado.' },
    en: { label: 'Quality assurance', description: 'A second expert reviews the grade and signs the certificate.' },
  },
  SHIPPED: {
    es: { label: 'Devolución en camino', description: 'Tus cartas salen hacia ti con envío asegurado y firma.' },
    en: { label: 'Return shipment on its way', description: 'Your cards are on their way back with insured, signed delivery.' },
  },
  DELIVERED: {
    es: { label: 'Entregado', description: 'Pedido entregado.' },
    en: { label: 'Delivered', description: 'Order delivered.' },
  },
  ON_HOLD: {
    es: { label: 'Incidencia en revisión', description: 'Hemos detectado una incidencia en tu pedido y la estamos revisando. Si necesitamos algo de ti, te escribiremos.' },
    en: { label: 'Issue under review', description: 'We found an issue with your order and are reviewing it. If we need anything from you, we will write to you.' },
  },
  CANCELLED: {
    es: { label: 'Pedido cancelado', description: 'Tu pedido ha sido cancelado. Si tienes dudas, escríbenos.' },
    en: { label: 'Order cancelled', description: 'Your order has been cancelled. If you have questions, write to us.' },
  },
};

const RESUMED: Record<Locale, Copy> = {
  es: { label: 'Pedido reanudado', description: 'La incidencia está resuelta y tu pedido sigue su curso.' },
  en: { label: 'Order resumed', description: 'The issue is resolved and your order is moving forward again.' },
};

const PICKUP: Record<Locale, Copy> = {
  es: { label: 'Listo para entrega en mano', description: 'Tus cartas están listas para recogerlas en el evento acordado.' },
  en: { label: 'Ready for in-person handover', description: 'Your cards are ready to be collected at the agreed event.' },
};

/** Texto estándar que ve el cliente al entrar en un estado, en su idioma. */
export function publicCopy(
  from: OrderStatus,
  to: OrderStatus,
  locale: string,
  shippingMethod: ShippingMethod | null,
): Copy {
  const lang: Locale = locale === 'en' ? 'en' : 'es';
  if (from === 'ON_HOLD' && to !== 'CANCELLED') return RESUMED[lang];
  if (to === 'SHIPPED' && shippingMethod === 'CARD_SHOW_DROPOFF') return PICKUP[lang];
  return COPY[to]?.[lang] ?? { label: to, description: '' };
}

/** Suma días hábiles (lunes a viernes). Todavía no se descuentan festivos: está por decidir. */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    const weekday = result.getUTCDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return result;
}
