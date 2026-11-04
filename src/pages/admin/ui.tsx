import React from 'react';
import type { OrderStatus } from '../../../shared/domain';
import { STATUS_LABEL } from '../../utils/orderStatus';

/**
 * Colores del panel: fondo neutro, hojas blancas con filetes finos y una sola tinta casi negra. El color solo
 * aparece cuando significa algo (rojo: tarde; ámbar: vence ya). El panel es siempre claro: se usa en un
 * laboratorio iluminado.
 */
export const INK = '#0F1110';
export const LATE = '#C2362B';
export const WARN = '#A86A12';
/** Verde de Gorilla: acción principal, avance y lo que está bien. */
export const GO = '#2F8F3E';

/**
 * Colores de las series de datos, siempre en este orden (validados para daltonismo sobre fondo blanco): el verde
 * de Gorilla y después azul, naranja, violeta, amarillo y rosa. El color sigue a la serie, nunca a su posición.
 */
export const SERIES = {
  green: '#2F8F3E',
  blue: '#2A78D6',
  orange: '#EB6834',
  violet: '#6250D6',
  yellow: '#EDA100',
  pink: '#E87BA4',
} as const;
export const SERIES_ORDER = [SERIES.green, SERIES.blue, SERIES.orange, SERIES.violet, SERIES.yellow, SERIES.pink];

export function usePanelTheme() {
  return {
    isLight: true,
    card: 'bg-white border-[#E7E7E2]',
    muted: 'text-[#666A67]',
    text: 'text-[#0F1110]',
    rule: 'border-[#E7E7E2]',
    input: 'bg-white border-[#E1E1DC] text-[#0F1110] placeholder:text-[#8A8E8B] focus:border-[#0F1110] focus:ring-2 focus:ring-[#0F1110]/10',
    primary: 'bg-[#2F8F3E] hover:bg-[#25762F] text-white',
    secondary: 'bg-white border-[#E1E1DC] text-[#0F1110] hover:border-[#0F1110]',
    ghostHover: 'hover:bg-[#F1F1EE]',
    positive: 'text-[#25762F]',
    negative: 'text-[#C2362B]',
    // Colores de las gráficas (SVG). La superficie es el fondo de `card`.
    chart: { mark: '#2F8F3E', grid: 'rgba(15,17,16,0.07)', wash: 'rgba(15,17,16,0.035)', trend: '#C9CBC7', surface: '#FFFFFF' },
  };
}

/**
 * Nombre de cada estado dentro del laboratorio. El cliente ve «Enviado» cuando manda su pedido; para el equipo,
 * ese pedido está «Por recibir».
 */
export const statusName = (status: OrderStatus) =>
  ({ SUBMITTED: 'Por recibir', PACKAGE_RECEIVED: 'Recibido', SHIPPED: 'Enviado al cliente' } as Partial<Record<OrderStatus, string>>)[status] ??
  STATUS_LABEL[status].es;

/** Estaciones de la línea del laboratorio, en orden. */
export const LINE_STAGES: OrderStatus[] = [
  'SUBMITTED', 'PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE', 'SHIPPED',
];

/** Nombre corto de cada estación de la línea. */
export const STATION_NAME: Partial<Record<OrderStatus, string>> = {
  SUBMITTED: 'Por recibir',
  PACKAGE_RECEIVED: 'Recibido',
  PRE_INSPECTION: 'Pre-inspección',
  OPTICAL_GRADING: 'Graduación',
  ENCAPSULATION: 'Encapsulado',
  QUALITY_ASSURANCE: 'Calidad',
  SHIPPED: 'Enviado',
};

/** Color del punto de estado: tinta para el recorrido normal; color solo cuando el estado pide atención o cierra. */
const DOT: Partial<Record<OrderStatus, string>> = {
  ON_HOLD: WARN,
  PAYMENT_PENDING: WARN,
  CANCELLED: LATE,
  DELIVERED: '#2F8F3E',
  RETURNED: '#9A9E9B',
  DRAFT: '#9A9E9B',
};

/** Estado del pedido: un punto y su nombre; en el recorrido normal, en qué estación va (3/7). */
export const StatusPill: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const step = LINE_STAGES.indexOf(status);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] align-middle">
      <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: DOT[status] ?? INK }} aria-hidden="true" />
      {statusName(status)}
      {step >= 0 && <span className="font-mono text-[11px] text-[#8A8E8B]">{step + 1}/{LINE_STAGES.length}</span>}
    </span>
  );
};

export const money = (cents: number | null) =>
  cents == null ? '—' : (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Un código de 9 cifras en tres grupos, como se lee en voz alta: 713 209 782. */
export const groupCode = (code: string) => (/^\d{9}$/.test(code) ? code.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : code);

/** "hoy", "hace 1 día", "hace 12 días". */
export function waiting(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? 'hoy' : days === 1 ? 'hace 1 día' : `hace ${days} días`;
}

export const SHIPPING_LABEL: Record<string, string> = {
  COURIER_INSURED: 'Mensajería asegurada',
  CARD_SHOW_DROPOFF: 'Entrega en evento',
  VAULT_STORE: 'Custodia en bóveda',
};

/** Lo que hace falta para dibujar el plazo de un pedido. */
export interface Plazo {
  status: OrderStatus;
  startedAt: string | null;
  dueDate: string | null;
  /** Desde cuándo espera, para cuando aún no hay plazo. */
  since: string;
}

const DAY = 86_400_000;
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const parseDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};

/** Días que quedan hasta la fecha prevista (negativo: días de retraso), o null si no hay fecha. */
export function daysLeft(task: Plazo, now = new Date()): number | null {
  return task.dueDate ? Math.round((parseDay(task.dueDate) - dayStart(now)) / DAY) : null;
}

/**
 * Plazo de un pedido en una línea: una barra corta con lo consumido del plazo y lo que queda dicho en palabras
 * ("6 días", "Mañana", "+2 días"). Tinta si va bien, ámbar si vence ya, rojo si va tarde.
 */
export const PlazoRuler: React.FC<{ task: Plazo }> = ({ task }) => {
  const left = daysLeft(task);
  if (task.status === 'ON_HOLD') return <span className="text-[13px] font-medium" style={{ color: WARN }}>Detenido</span>;
  if (!task.startedAt || !task.dueDate || left === null) {
    return <span className="text-[13px] text-[#8A8E8B]">{task.status === 'SUBMITTED' ? 'Sin empezar' : `Espera ${waiting(task.since)}`}</span>;
  }
  const start = dayStart(new Date(task.startedAt));
  const due = parseDay(task.dueDate);
  const used = Math.min(1, Math.max(0.04, (dayStart(new Date()) - start) / Math.max(due - start, DAY)));
  const late = left < 0;
  const tight = !late && left <= 1;
  const color = late ? LATE : tight ? WARN : INK;
  const label = late ? `+${-left} ${-left === 1 ? 'día' : 'días'}` : left === 0 ? 'Hoy' : left === 1 ? 'Mañana' : `${left} días`;

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap" title={`Fecha prevista: ${new Date(due).toLocaleDateString('es-ES')}`}>
      <span className="relative w-14 h-[3px] rounded-full bg-[#ECECE8] overflow-hidden" aria-hidden="true">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(late ? 1 : used) * 100}%`, background: color }} />
      </span>
      <span className={`text-[13px] ${late || tight ? 'font-semibold' : ''}`} style={{ color }}>{label}</span>
    </span>
  );
};
