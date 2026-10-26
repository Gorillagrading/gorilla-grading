import React, { useLayoutEffect, useRef, useState } from 'react';
import { usePanelTheme } from './ui';

/**
 * Gráficas del panel de negocio, en SVG simple. Una sola serie por gráfica (un solo color,
 * el verde de la marca), barras finas con el extremo redondeado y la base recta, rejilla tenue
 * y un aviso al pasar el ratón o el foco por cada barra. Cada gráfica tiene su tabla de datos.
 */


/** Ancho real del contenedor, para dibujar sin deformar las esquinas redondeadas. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    setWidth(ref.current.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Máximo redondeado del eje: 1, 2, 2.5, 5 o 10 por potencia de diez. */
function niceMax(max: number) {
  if (max <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= max)!;
  return step * power;
}

/** Barra con las dos esquinas de arriba redondeadas (4px) y la base recta. */
function columnPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export interface Point {
  key: string;
  /** Etiqueta corta para el eje. */
  label: string;
  /** Etiqueta completa para el aviso y la tabla. */
  fullLabel: string;
  value: number;
}

export const ColumnChart: React.FC<{
  data: Point[];
  format: (n: number) => string;
  /** Formato corto de las marcas del eje (1K, 2,5K…). */
  formatTick?: (n: number) => string;
  title: string;
  height?: number;
}> = ({ data, format, formatTick = format, title, height = 200 }) => {
  const t = usePanelTheme();
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const left = 52;
  const bottom = 24;
  const top = 8;
  const plotW = Math.max(0, width - left);
  const plotH = height - top - bottom;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const slot = data.length ? plotW / data.length : 0;
  const barW = Math.max(2, Math.min(24, slot * 0.62));
  const y = (v: number) => top + plotH - (v / max) * plotH;
  // Unas seis etiquetas en el eje como mucho, siempre incluida la última.
  const every = Math.max(1, Math.ceil(data.length / 6));
  const showLabel = (i: number) => (data.length - 1 - i) % every === 0;
  const point = active != null ? data[active] : null;

  return (
    <div>
      <div ref={ref} className="relative" onMouseLeave={() => setActive(null)}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={title} className="block overflow-visible">
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line x1={left} x2={width} y1={y(max * f)} y2={y(max * f)} stroke={t.chart.grid} strokeWidth={1} />
                <text x={left - 8} y={y(max * f)} dy="0.32em" textAnchor="end" className={`fill-current text-[10px] tabular-nums ${t.muted}`}>
                  {formatTick(max * f)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const x = left + i * slot + (slot - barW) / 2;
              const h = d.value > 0 ? Math.max(2, top + plotH - y(d.value)) : 0;
              return (
                <g
                  key={d.key}
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.fullLabel}: ${format(d.value)}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="outline-none"
                >
                  {/* Zona sensible: toda la columna, no solo la barra pintada. */}
                  <rect x={left + i * slot} y={top} width={slot} height={plotH} fill="transparent" />
                  {active === i && <rect x={left + i * slot} y={top} width={slot} height={plotH} fill={t.chart.wash} />}
                  {h > 0 && <path d={columnPath(x, top + plotH - h, barW, h)} fill={t.chart.mark} opacity={active == null || active === i ? 1 : 0.55} />}
                  {showLabel(i) && (
                    <text x={left + i * slot + slot / 2} y={height - 6} textAnchor="middle" className={`fill-current text-[10px] ${t.muted}`}>
                      {d.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        {point && active != null && (
          <div
            className={`pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border px-3 py-2 text-xs shadow-lg whitespace-nowrap ${t.card}`}
            style={{ left: left + active * slot + slot / 2, top: Math.max(0, y(point.value) - 8) }}
          >
            <div className={`font-bold text-sm ${t.text}`}>{format(point.value)}</div>
            <div className={t.muted}>{point.fullLabel}</div>
          </div>
        )}
      </div>
      <DataTable open={showTable} onToggle={() => setShowTable((v) => !v)} rows={data.map((d) => [d.fullLabel, format(d.value)])} />
    </div>
  );
};

/** Tabla con los mismos datos de la gráfica, plegada por defecto. */
export const DataTable: React.FC<{ open: boolean; onToggle: () => void; rows: [string, string][] }> = ({ open, onToggle, rows }) => {
  const t = usePanelTheme();
  return (
    <div className="mt-2">
      <button type="button" onClick={onToggle} className={`text-[11px] font-bold underline-offset-2 hover:underline cursor-pointer ${t.muted}`}>
        {open ? 'Ocultar datos' : 'Ver datos'}
      </button>
      {open && (
        <div className={`mt-2 max-h-56 overflow-y-auto border-t ${t.rule}`}>
          <table className="w-full text-xs">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className={`border-b ${t.rule}`}>
                  <td className={`py-1.5 ${t.muted}`}>{label}</td>
                  <td className={`py-1.5 text-right font-bold tabular-nums ${t.text}`}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/** Línea pequeña de tendencia: gris, con el último tramo marcado en verde. */
export const Sparkline: React.FC<{ values: number[]; width?: number; height?: number }> = ({ values, width = 96, height = 28 }) => {
  const t = usePanelTheme();
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const x = (i: number) => 4 + (i / (values.length - 1)) * (width - 8);
  const y = (v: number) => 4 + (1 - v / max) * (height - 8);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const last = values.length - 1;
  return (
    <svg width={width} height={height} aria-hidden="true" className="block overflow-visible">
      <path d={d} fill="none" stroke={t.chart.trend} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(values[last])} r={4} strokeWidth={2} fill={t.chart.mark} stroke={t.chart.surface} />
    </svg>
  );
};

/** Lista de barras horizontales con el valor al final de cada barra. */
export const BarList: React.FC<{
  rows: { key: string; label: React.ReactNode; value: number; display?: string }[];
  empty: string;
}> = ({ rows, empty }) => {
  const t = usePanelTheme();
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length) return <p className={`text-sm ${t.muted}`}>{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-xs">
          <span className={`truncate font-bold ${t.text}`}>{r.label}</span>
          <span className="flex items-center gap-2 min-w-0">
            <span
              className="h-2.5 shrink-0 rounded-r"
              style={{ width: `calc((100% - 4.5rem) * ${r.value / max})`, minWidth: r.value > 0 ? 3 : 0, background: t.chart.mark }}
            />
            <span className={`tabular-nums font-bold ${t.text}`}>{r.display ?? r.value.toLocaleString('es-ES')}</span>
          </span>
        </li>
      ))}
    </ul>
  );
};
