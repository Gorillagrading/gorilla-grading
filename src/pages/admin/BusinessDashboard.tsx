import React, { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, RefreshCw } from 'lucide-react';
import type { DashboardBucket, DashboardData, DashboardMetric, DashboardRange } from '../../../shared/dashboard';
import type { OrderStatus } from '../../../shared/domain';
import { GRADE_LABELS } from '../../../shared/grading';
import { adminErrorMessage, fetchDashboard } from '../../api/admin';
import { STATUS_LABEL } from '../../utils/orderStatus';
import { BarList, ColumnChart, Sparkline, type Point } from './charts';
import { formatDateTime, money, usePanelTheme } from './ui';

const RANGES: { key: DashboardRange; label: string; previous: string }[] = [
  { key: '30d', label: '30 días', previous: 'los 30 días anteriores' },
  { key: '90d', label: '90 días', previous: 'los 90 días anteriores' },
  { key: '12m', label: '12 meses', previous: 'los 12 meses anteriores' },
  { key: 'all', label: 'Todo', previous: '' },
];

/** Orden del recorrido del pedido, para la lista de estados. */
const STATUS_ORDER: OrderStatus[] = [
  'PAYMENT_PENDING', 'SUBMITTED', 'PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION',
  'QUALITY_ASSURANCE', 'SHIPPED', 'DELIVERED', 'ON_HOLD', 'CANCELLED', 'RETURNED',
];

const STORAGE_KEY = 'gg.dashboard.range';

const whole = (n: number) => n.toLocaleString('es-ES');
const euros = (cents: number) => (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const compactEuros = (cents: number) =>
  (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 });

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function bucketLabels(start: string, unit: DashboardData['unit']) {
  const [y, m, d] = start.split('-').map(Number);
  const month = MONTHS[m - 1];
  if (unit === 'month') return { label: `${month} ${String(y).slice(2)}`, fullLabel: `${month} ${y}` };
  if (unit === 'week') return { label: `${d} ${month}`, fullLabel: `Semana del ${d} ${month} ${y}` };
  return { label: `${d} ${month}`, fullLabel: `${d} ${month} ${y}` };
}

const series = (data: DashboardData, field: keyof Omit<DashboardBucket, 'start'>): Point[] =>
  data.buckets.map((b) => ({ key: b.start, value: b[field], ...bucketLabels(b.start, data.unit) }));

export const BusinessDashboard: React.FC = () => {
  const t = usePanelTheme();
  const [range, setRange] = useState<DashboardRange>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return RANGES.some((r) => r.key === saved) ? (saved as DashboardRange) : '30d';
    } catch {
      return '30d';
    }
  });
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, range);
    } catch {
      // Sin almacenamiento del navegador simplemente no se recuerda el periodo.
    }
    let cancelled = false;
    setLoading(true);
    fetchDashboard(range)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(adminErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, reload]);

  const current = RANGES.find((r) => r.key === range)!;
  const card = `border rounded-2xl p-5 ${t.card}`;
  const heading = `text-xs font-bold uppercase tracking-wider ${t.muted}`;

  return (
    <div className="space-y-5">
      {/* Filtro: una sola fila, encima de todo lo que filtra. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className={`inline-flex rounded-lg border p-1 ${t.secondary}`} role="radiogroup" aria-label="Periodo">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              role="radio"
              aria-checked={range === r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                range === r.key ? t.primary : t.ghostHover
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setReload((n) => n + 1)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-bold cursor-pointer ${t.secondary}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
        {data && <span className={`text-xs ${t.muted}`}>Datos de {formatDateTime(data.generatedAt)}</span>}
      </div>

      {error && <p className={`text-sm font-bold ${t.negative}`} role="alert">{error}</p>}
      {!data && loading && <div className="min-h-[50vh]" aria-busy="true" />}

      {data && (
        // Al recargar se mantiene lo anterior atenuado, sin saltos.
        <div className={`space-y-5 transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
          {/* La cifra principal: lo cobrado en el periodo, con su evolución. */}
          <section className={card}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className={heading}>Ingresos cobrados · {current.label.toLowerCase()}</h2>
                <div className={`mt-1 text-5xl font-[800] tracking-tight ${t.text}`}>{money(data.metrics.revenueCents.current)}</div>
                <Delta metric={data.metrics.revenueCents} previous={current.previous} />
              </div>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <dt className={t.muted}>Pagos</dt>
                <dd className={`text-right font-bold tabular-nums ${t.text}`}>{whole(data.metrics.payments.current)}</dd>
                <dt className={t.muted}>Pago medio</dt>
                <dd className={`text-right font-bold tabular-nums ${t.text}`}>
                  {data.metrics.payments.current ? money(Math.round(data.metrics.revenueCents.current / data.metrics.payments.current)) : '—'}
                </dd>
                <dt className={t.muted}>Pendiente de cobro</dt>
                <dd className={`text-right font-bold tabular-nums ${t.text}`}>
                  {money(data.awaitingPayment.totalCents)}
                  <span className={`ml-1 font-normal ${t.muted}`}>({whole(data.awaitingPayment.orders)} {data.awaitingPayment.orders === 1 ? 'pedido' : 'pedidos'})</span>
                </dd>
              </dl>
            </div>
            <div className="mt-5">
              <ColumnChart title="Ingresos cobrados por periodo" data={series(data, 'revenueCents')} format={money} formatTick={compactEuros} height={220} />
            </div>
          </section>

          {/* Cifras clave del periodo. */}
          <section className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Tile label="Clientes nuevos" metric={data.metrics.newCustomers} previous={current.previous} trend={data.buckets.map((b) => b.newCustomers)} />
            <Tile label="Pedidos recibidos" metric={data.metrics.orders} previous={current.previous} trend={data.buckets.map((b) => b.orders)} />
            <Tile label="Cartas calificadas" metric={data.metrics.cardsGraded} previous={current.previous} trend={data.buckets.map((b) => b.cardsGraded)} />
            <Tile label="Certificados emitidos" metric={data.metrics.certificates} previous={current.previous} />
            <Tile label="Verificaciones de certificados" hint="Consultas en la web o con el QR" metric={data.metrics.verifications} previous={current.previous} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={card}>
              <h2 className={heading}>Clientes nuevos</h2>
              <div className="mt-4">
                <ColumnChart title="Clientes nuevos por periodo" data={series(data, 'newCustomers')} format={whole} />
              </div>
            </div>
            <div className={card}>
              <h2 className={heading}>Cartas calificadas</h2>
              <div className="mt-4">
                <ColumnChart title="Cartas calificadas por periodo" data={series(data, 'cardsGraded')} format={whole} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={card}>
              <h2 className={heading}>Pedidos por estado · ahora</h2>
              <div className="mt-4">
                <BarList
                  empty="Todavía no hay pedidos."
                  rows={STATUS_ORDER.filter((s) => data.ordersByStatus[s]).map((s) => ({
                    key: s, label: STATUS_LABEL[s].es, value: data.ordersByStatus[s]!,
                  }))}
                />
              </div>
            </div>
            <div className={card}>
              <h2 className={heading}>Notas · {current.label.toLowerCase()}</h2>
              <div className="mt-4 space-y-3">
                <BarList
                  empty="Ninguna carta calificada en este periodo."
                  rows={data.grades.map((g) => ({
                    key: String(g.grade),
                    label: <>{g.grade.toLocaleString('es-ES')} <span className={`font-normal ${t.muted}`}>{GRADE_LABELS[g.grade]?.[0].replace(/\s[\d.]+$/, '')}</span></>,
                    value: g.count,
                  }))}
                />
                {data.notAuthentic > 0 && (
                  <p className={`text-xs ${t.muted}`}>
                    Y {whole(data.notAuthentic)} {data.notAuthentic === 1 ? 'carta no auténtica' : 'cartas no auténticas'}, sin nota.
                  </p>
                )}
              </div>
            </div>
            <div className={card}>
              <h2 className={heading}>Servicios · {current.label.toLowerCase()}</h2>
              <div className="mt-4">
                <BarList
                  empty="Ninguna carta enviada en este periodo."
                  rows={data.services.map((s) => ({
                    key: s.code,
                    label: s.name,
                    value: s.cards,
                    display: `${whole(s.cards)} ${s.cards === 1 ? 'carta' : 'cartas'}`,
                  }))}
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`${card} lg:col-span-2`}>
              <h2 className={heading}>Últimos pagos</h2>
              {data.recentPayments.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {data.recentPayments.map((p) => (
                        <tr key={`${p.orderCode}-${p.paidAt}`} className={`border-b last:border-0 ${t.rule}`}>
                          <td className={`py-2 pr-3 whitespace-nowrap ${t.muted}`}>{formatDateTime(p.paidAt)}</td>
                          <td className={`py-2 pr-3 font-mono text-xs whitespace-nowrap ${t.text}`}>{p.orderCode}</td>
                          <td className={`py-2 pr-3 truncate max-w-[14rem] ${t.text}`}>{p.customer}</td>
                          <td className={`py-2 text-right font-bold tabular-nums whitespace-nowrap ${t.text}`}>{money(p.amountCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={`mt-3 text-sm ${t.muted}`}>Todavía no hay pagos.</p>
              )}
            </div>
            <div className={card}>
              <h2 className={heading}>Desde el inicio</h2>
              <dl className="mt-3 space-y-3">
                {[
                  ['Ingresos cobrados', euros(data.totals.revenueCents)],
                  ['Clientes', whole(data.totals.customers)],
                  ['Cartas calificadas', whole(data.totals.cardsGraded)],
                  ['Certificados', whole(data.totals.certificates)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3">
                    <dt className={`text-sm ${t.muted}`}>{label}</dt>
                    <dd className={`text-xl font-[800] ${t.text}`}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <p className={`text-xs ${t.muted}`}>
            Ingresos: pagos confirmados por Stripe (con IVA). Clientes: cuentas de clientes, sin el personal del laboratorio.
            Cartas calificadas: resultados aprobados por control de calidad. Las fechas se cuentan en hora de Madrid.
          </p>
        </div>
      )}
    </div>
  );
};

/** Cambio frente al periodo anterior: flecha, porcentaje y con qué se compara. Nunca solo color. */
const Delta: React.FC<{ metric: DashboardMetric; previous: string }> = ({ metric, previous }) => {
  const t = usePanelTheme();
  if (metric.previous == null) return <div className={`mt-1 text-xs ${t.muted}`}>Desde el inicio</div>;
  const diff = metric.current - metric.previous;
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  const tone = diff > 0 ? t.positive : diff < 0 ? t.negative : t.muted;
  const text =
    diff === 0 ? 'Igual' : metric.previous === 0 ? 'Nuevo' : `${diff > 0 ? '+' : '−'}${Math.round((Math.abs(diff) / metric.previous) * 100)}%`;
  return (
    <div className="mt-1 flex items-center gap-1.5 text-xs">
      <span className={`inline-flex items-center gap-0.5 font-bold ${tone}`}>
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        {text}
      </span>
      <span className={t.muted}>frente a {previous}</span>
    </div>
  );
};

const Tile: React.FC<{ label: string; hint?: string; metric: DashboardMetric; previous: string; trend?: number[] }> = ({
  label, hint, metric, previous, trend,
}) => {
  const t = usePanelTheme();
  return (
    <div className={`border rounded-2xl p-4 flex flex-col justify-between gap-2 ${t.card}`}>
      <div>
        <div className={`text-xs font-bold ${t.muted}`}>{label}</div>
        {hint && <div className={`text-[11px] ${t.muted}`}>{hint}</div>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className={`text-3xl font-[800] ${t.text}`}>{whole(metric.current)}</div>
        {trend && <Sparkline values={trend} />}
      </div>
      <Delta metric={metric} previous={previous} />
    </div>
  );
};
