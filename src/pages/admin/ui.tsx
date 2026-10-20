import React from 'react';
import type { OrderStatus } from '../../../shared/domain';
import { useTheme } from '../../context/ThemeContext';
import { STATUS_LABEL } from '../../utils/orderStatus';

/** Colores del panel, coherentes con la cuenta del cliente. */
export function usePanelTheme() {
  const isLight = useTheme().theme === 'light';
  return {
    isLight,
    card: isLight ? 'bg-white border-[#E2DBD0] shadow-sm' : 'bg-[#383838] border-[#4E4E4E]',
    muted: isLight ? 'text-neutral-500' : 'text-[#A4ACA1]',
    text: isLight ? 'text-[#14170F]' : 'text-white',
    rule: isLight ? 'border-[#E2DBD0]' : 'border-[#4E4E4E]',
    input: isLight
      ? 'bg-white border-[#D8D2C5] text-[#14170F] placeholder:text-neutral-400 focus:border-[#16A34A]'
      : 'bg-[#2A2A2A] border-[#4E4E4E] text-white placeholder:text-[#8C9185] focus:border-[#61B663]',
    primary: isLight ? 'bg-[#15803D] hover:bg-[#166534] text-white' : 'bg-[#61B663] hover:bg-[#48C765] text-[#111311]',
    secondary: isLight
      ? 'bg-white border-[#D8D2C5] text-[#14170F] hover:border-[#16A34A]'
      : 'bg-[#2A2A2A] border-[#4E4E4E] text-white hover:border-[#61B663]',
  };
}

const PILL: Record<OrderStatus, string> = {
  DRAFT: 'bg-neutral-500/15 text-neutral-500 border-neutral-500/30',
  SUBMITTED: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  PAYMENT_PENDING: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  PACKAGE_RECEIVED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  PRE_INSPECTION: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  OPTICAL_GRADING: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  ENCAPSULATION: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  QUALITY_ASSURANCE: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  SHIPPED: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
  DELIVERED: 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-300 border-neutral-500/30',
  ON_HOLD: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40',
  CANCELLED: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  RETURNED: 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-300 border-neutral-500/30',
};

export const StatusPill: React.FC<{ status: OrderStatus }> = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 border rounded font-mono text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${PILL[status]}`}
  >
    {STATUS_LABEL[status].es}
  </span>
);

export const money = (cents: number | null) =>
  cents == null ? '—' : (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

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
