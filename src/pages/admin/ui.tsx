import React from 'react';
import type { OrderStatus } from '../../../shared/domain';
import { STATUS_LABEL } from '../../utils/orderStatus';

/**
 * Colores del panel ("banco de calibración"): suelo gris banco, hojas blancas con filetes de 1 px, tinta casi negra
 * y el verde de Gorilla solo para la acción principal. El panel es siempre claro: se usa en un laboratorio iluminado.
 */
export function usePanelTheme() {
  return {
    isLight: true,
    card: 'bg-white border-[#D7D9D3]',
    muted: 'text-[#5A5F5B]',
    text: 'text-[#121413]',
    rule: 'border-[#D7D9D3]',
    input: 'bg-white border-[#C7CAC4] text-[#121413] placeholder:text-[#6B706C] focus:border-[#2F8F3E] focus:ring-2 focus:ring-[#2F8F3E]/20',
    primary: 'bg-[#2F8F3E] hover:bg-[#25762F] text-white',
    secondary: 'bg-white border-[#C7CAC4] text-[#121413] hover:border-[#121413]',
    ghostHover: 'hover:bg-[#EDEEEA]',
    positive: 'text-[#25762F]',
    negative: 'text-[#B42B22]',
    // Colores de las gráficas (SVG). La superficie es el fondo de `card`.
    chart: { mark: '#2F8F3E', grid: 'rgba(18,20,19,0.08)', wash: 'rgba(18,20,19,0.04)', trend: '#B8BCB6', surface: '#FFFFFF' },
  };
}

/**
 * Nombre de cada estado dentro del laboratorio. El cliente ve «Enviado» cuando manda su pedido; para el equipo,
 * ese pedido está «Por recibir».
 */
export const statusName = (status: OrderStatus) =>
  ({ SUBMITTED: 'Por recibir', PACKAGE_RECEIVED: 'Recibido', SHIPPED: 'Enviado al cliente' } as Partial<Record<OrderStatus, string>>)[status] ??
  STATUS_LABEL[status].es;

/** Etapas del recorrido normal de un pedido, en orden. Sirven para dibujar el avance. */
const PIPELINE: OrderStatus[] = [
  'PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE', 'SHIPPED', 'DELIVERED',
];

/**
 * Color de cada fase, como los parches de una carta de calibración: las fases del laboratorio van de verde claro
 * a verde oscuro según avanzan; calidad en violeta; avisos en ámbar y rojo.
 */
export const STAGE_COLOR: Record<OrderStatus, string> = {
  DRAFT: '#B8BCB6',
  SUBMITTED: '#1E8FC6',
  PAYMENT_PENDING: '#C98A12',
  PACKAGE_RECEIVED: '#8CC79A',
  PRE_INSPECTION: '#4FA862',
  OPTICAL_GRADING: '#2F8F3E',
  ENCAPSULATION: '#1F6B2B',
  QUALITY_ASSURANCE: '#6A4FC4',
  SHIPPED: '#3A403D',
  DELIVERED: '#121413',
  ON_HOLD: '#C98A12',
  CANCELLED: '#B42B22',
  RETURNED: '#8A8F8B',
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
        <span className="w-2 h-2 shrink-0" style={{ background: STAGE_COLOR[status] }} />
        {statusName(status)}
      </span>
      {step >= 0 && (
        <span className="flex gap-[3px]" aria-hidden="true">
          {PIPELINE.map((stage, i) => (
            <span key={stage} className="h-[3px] w-3.5" style={{ background: i <= step ? STAGE_COLOR[status] : '#E2E4DF' }} />
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
