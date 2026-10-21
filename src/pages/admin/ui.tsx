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

/** Etapas del recorrido normal de un pedido, en orden. Sirven para dibujar el avance. */
const PIPELINE: OrderStatus[] = [
  'PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE', 'SHIPPED', 'DELIVERED',
];

/** Color sólido del marcador y del avance de cada estado. */
const MARK: Record<OrderStatus, string> = {
  DRAFT: 'bg-neutral-400',
  SUBMITTED: 'bg-sky-500',
  PAYMENT_PENDING: 'bg-amber-500',
  PACKAGE_RECEIVED: 'bg-[#15803D] dark:bg-[#61B663]',
  PRE_INSPECTION: 'bg-[#15803D] dark:bg-[#61B663]',
  OPTICAL_GRADING: 'bg-[#15803D] dark:bg-[#61B663]',
  ENCAPSULATION: 'bg-[#15803D] dark:bg-[#61B663]',
  QUALITY_ASSURANCE: 'bg-violet-500',
  SHIPPED: 'bg-teal-500',
  DELIVERED: 'bg-[#14170F] dark:bg-white',
  ON_HOLD: 'bg-orange-500',
  CANCELLED: 'bg-red-500',
  RETURNED: 'bg-neutral-400',
};

/**
 * Estado del pedido: marcador cuadrado sólido, nombre en mayúsculas y, en el recorrido normal,
 * una barra de siete tramos que muestra en qué etapa va. Sin caja ni fondo translúcido.
 */
export const StatusPill: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const step = PIPELINE.indexOf(status);
  return (
    <span className="inline-flex flex-col gap-1.5 align-middle">
      <span className="inline-flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-wider whitespace-nowrap">
        <span className={`w-2 h-2 shrink-0 ${MARK[status]}`} />
        {STATUS_LABEL[status].es}
      </span>
      {step >= 0 && (
        <span className="flex gap-[3px]" aria-hidden="true">
          {PIPELINE.map((stage, i) => (
            <span key={stage} className={`h-[3px] w-3.5 ${i <= step ? MARK[status] : 'bg-black/10 dark:bg-white/15'}`} />
          ))}
        </span>
      )}
    </span>
  );
};

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
