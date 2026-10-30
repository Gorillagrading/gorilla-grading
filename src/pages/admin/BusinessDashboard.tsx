import React, { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Download, Mail, Minus, RefreshCw, Search } from 'lucide-react';
import type { CertificateHistory, DashboardBucket, DashboardData, DashboardMetric, DashboardRange } from '../../../shared/dashboard';
import type { OrderStatus } from '../../../shared/domain';
import { GRADE_LABELS } from '../../../shared/grading';
import { adminErrorMessage, fetchCertificateHistory, fetchDashboard, fetchNewsletterStats } from '../../api/admin';
import type { NewsletterStatsDto } from '../../../shared/newsletter';
import { STATUS_LABEL } from '../../utils/orderStatus';
import { BarList, ColumnChart, Sparkline, type Point } from './charts';
import { formatDate, formatDateTime, money, usePanelTheme } from './ui';

const RANGES: { key: DashboardRange; label: string; during: string; previous: string }[] = [
  { key: '30d', label: '30 días', during: 'En los últimos 30 días', previous: 'los 30 días anteriores' },
  { key: '90d', label: '90 días', during: 'En los últimos 90 días', previous: 'los 90 días anteriores' },
  { key: '12m', label: '12 meses', during: 'En los últimos 12 meses', previous: 'los 12 meses anteriores' },
  { key: 'all', label: 'Todo', during: 'Desde el inicio', previous: '' },
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

const plural = (n: number, one: string, many: string) => `${whole(n)} ${n === 1 ? one : many}`;

export const BusinessDashboard: React.FC<{ onOpenOrder: (code: string) => void }> = ({ onOpenOrder }) => {
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
          {/* El resumen en una frase, para leerlo de un vistazo. */}
          <p className={`text-lg leading-relaxed ${t.text}`}>
            {current.during} se cobraron <strong>{money(data.metrics.revenueCents.current)}</strong> en{' '}
            <strong>{plural(data.metrics.payments.current, 'pago', 'pagos')}</strong>, se registraron{' '}
            <strong>{plural(data.metrics.newCustomers.current, 'cliente nuevo', 'clientes nuevos')}</strong> y el laboratorio calificó{' '}
            <strong>{plural(data.metrics.cardsGraded.current, 'carta', 'cartas')}</strong>.
          </p>

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
            <Tile label="Clientes nuevos" hint="Personas que crearon su cuenta" metric={data.metrics.newCustomers} previous={current.previous} trend={data.buckets.map((b) => b.newCustomers)} />
            <Tile label="Pedidos recibidos" hint="Pedidos que enviaron los clientes" metric={data.metrics.orders} previous={current.previous} trend={data.buckets.map((b) => b.orders)} />
            <Tile label="Cartas calificadas" hint="Con nota aprobada por control de calidad" metric={data.metrics.cardsGraded} previous={current.previous} trend={data.buckets.map((b) => b.cardsGraded)} />
            <Tile label="Certificados emitidos" hint="Uno por carta auténtica enviada de vuelta" metric={data.metrics.certificates} previous={current.previous} />
            <Tile label="Verificaciones" hint="Veces que alguien comprobó un certificado (web o QR)" metric={data.metrics.verifications} previous={current.previous} />
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
                    <thead>
                      <tr className={`text-left text-[11px] uppercase tracking-wider ${t.muted}`}>
                        <th className="pb-2 pr-3 font-bold">Fecha</th>
                        <th className="pb-2 pr-3 font-bold">Cliente</th>
                        <th className="pb-2 pr-3 font-bold">Pedido</th>
                        <th className="pb-2 text-right font-bold">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentPayments.map((p) => (
                        <tr key={`${p.orderCode}-${p.paidAt}`} className={`border-t ${t.rule}`}>
                          <td className={`py-2 pr-3 whitespace-nowrap ${t.muted}`}>{formatDateTime(p.paidAt)}</td>
                          <td className="py-2 pr-3">
                            <Customer email={p.customerEmail} name={p.customerName} />
                          </td>
                          <td className="py-2 pr-3">
                            <OrderLink code={p.orderCode} onOpen={onOpenOrder} />
                          </td>
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

          <NewsletterCard />

          <CertificateHistorySection onOpenOrder={onOpenOrder} />

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
  // En palabras: "64% más que los 30 días anteriores".
  const [strong, rest] =
    diff === 0
      ? ['Igual', `que ${previous}`]
      : metric.previous === 0
        ? ['Nuevo', `(ninguno en ${previous})`]
        : [`${Math.round((Math.abs(diff) / metric.previous) * 100)}% ${diff > 0 ? 'más' : 'menos'}`, `que ${previous}`];
  return (
    <div className="mt-1 flex items-start gap-1.5 text-xs">
      <span className={`inline-flex items-center gap-0.5 font-bold whitespace-nowrap ${tone}`}>
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        {strong}
      </span>
      <span className={t.muted}>{rest}</span>
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

const Customer: React.FC<{ email: string; name: string | null }> = ({ email, name }) => {
  const t = usePanelTheme();
  return (
    <div className="min-w-0">
      {name && <div className={`font-bold truncate ${t.text}`}>{name}</div>}
      <div className={`truncate ${name ? `text-xs ${t.muted}` : t.text}`}>{email}</div>
    </div>
  );
};

const OrderLink: React.FC<{ code: string; onOpen: (code: string) => void }> = ({ code, onOpen }) => {
  const t = usePanelTheme();
  return (
    <button
      type="button"
      onClick={() => onOpen(code)}
      className={`font-mono text-xs whitespace-nowrap underline-offset-2 hover:underline cursor-pointer ${t.positive}`}
    >
      {code}
    </button>
  );
};

const CERT_STATUS: Record<string, string> = { revoked: 'Revocado', superseded: 'Sustituido' };

/** Todas las cartas certificadas, con su cliente y su número de certificado. Con buscador y páginas. */
const CertificateHistorySection: React.FC<{ onOpenOrder: (code: string) => void }> = ({ onOpenOrder }) => {
  const t = usePanelTheme();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CertificateHistory | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // El buscador espera a que termines de escribir.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCertificateHistory(q, page)
      .then((h) => {
        if (!cancelled) {
          setData(h);
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
  }, [q, page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const pageButton = `px-3 py-2 border rounded-lg font-bold cursor-pointer disabled:opacity-40 disabled:cursor-default ${t.secondary}`;

  return (
    <section className={`border rounded-2xl p-5 ${t.card}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={`text-xs font-bold uppercase tracking-wider ${t.muted}`}>Historial de cartas certificadas</h2>
          <p className={`mt-1 text-sm ${t.muted}`}>
            Todas las cartas, desde el inicio{data ? ` · ${plural(data.total, 'certificado', 'certificados')}` : ''}.
          </p>
        </div>
        <label className="relative w-full sm:w-80">
          <span className="sr-only">Buscar en el historial</span>
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.muted}`} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Correo, nº de certificado, carta o pedido"
            className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none ${t.input}`}
          />
        </label>
      </div>

      {error && <p className={`mt-3 text-sm font-bold ${t.negative}`} role="alert">{error}</p>}

      {data && (
        <div className={`mt-4 overflow-x-auto transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {data.rows.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left text-[11px] uppercase tracking-wider ${t.muted}`}>
                  <th className="pb-2 pr-3 font-bold">Fecha</th>
                  <th className="pb-2 pr-3 font-bold">Nº de certificado</th>
                  <th className="pb-2 pr-3 font-bold">Carta</th>
                  <th className="pb-2 pr-3 font-bold text-right">Nota</th>
                  <th className="pb-2 pr-3 font-bold">Cliente</th>
                  <th className="pb-2 font-bold">Pedido</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.certNumber} className={`border-t align-top ${t.rule}`}>
                    <td className={`py-2.5 pr-3 whitespace-nowrap ${t.muted}`}>{formatDate(r.issuedAt)}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      <span className={`font-mono font-bold ${t.text}`}>{r.certNumber}</span>
                      {CERT_STATUS[r.status] && <div className={`text-xs font-bold ${t.negative}`}>{CERT_STATUS[r.status]}</div>}
                    </td>
                    <td className="py-2.5 pr-3 min-w-[10rem]">
                      <div className={`font-bold ${t.text}`}>{r.cardName ?? '—'}</div>
                      <div className={`text-xs ${t.muted}`}>{[r.game, r.setName].filter(Boolean).join(' · ')}</div>
                    </td>
                    <td className={`py-2.5 pr-3 text-right whitespace-nowrap ${t.text}`}>
                      {r.grade != null ? (
                        <>
                          <div className="font-[800] text-base tabular-nums">{r.grade.toLocaleString('es-ES')}</div>
                          <div className={`text-xs ${t.muted}`}>{r.gradeLabel?.replace(/\s[\d.]+$/, '')}</div>
                        </>
                      ) : (
                        <span className={t.muted}>—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 max-w-[16rem]">
                      <Customer email={r.customerEmail} name={r.customerName} />
                    </td>
                    <td className="py-2.5">
                      <OrderLink code={r.orderCode} onOpen={onOpenOrder} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={`text-sm ${t.muted}`}>{q ? 'Ningún certificado coincide con la búsqueda.' : 'Todavía no hay cartas certificadas.'}</p>
          )}
        </div>
      )}

      {data && pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 text-xs">
          <span className={t.muted}>Página {data.page} de {pages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={pageButton}>
              Anterior
            </button>
            <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className={pageButton}>
              Siguiente
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

/** Suscriptores de la newsletter: cuántos hay y la lista de confirmados, para la herramienta de envíos. */
const NewsletterCard: React.FC = () => {
  const t = usePanelTheme();
  const [stats, setStats] = useState<NewsletterStatsDto | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetchNewsletterStats().then(setStats).catch((err) => setError(adminErrorMessage(err)));
  }, []);

  const download = () => {
    if (!stats) return;
    const csv = ['email,idioma,confirmado', ...stats.subscribers.map((s) => `${s.email},${s.locale},${s.confirmedAt.slice(0, 10)}`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-suscriptores-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className={`border rounded-xl p-5 flex flex-wrap items-center gap-5 ${t.card}`} aria-label="Newsletter">
      <span className="w-10 h-10 rounded-xl bg-[#15803D] text-white flex items-center justify-center shrink-0">
        <Mail className="w-5 h-5" aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-[200px]">
        <h2 className={`text-sm font-bold ${t.text}`}>Newsletter · Inner Circle</h2>
        <p className={`text-xs ${t.muted}`}>
          {error || (stats
            ? `${stats.confirmed} ${stats.confirmed === 1 ? 'suscriptor confirmado' : 'suscriptores confirmados'} · ${stats.pending} sin confirmar · ${stats.unsubscribed} ${stats.unsubscribed === 1 ? 'baja' : 'bajas'}`
            : 'Cargando…')}
        </p>
      </div>
      <button
        type="button"
        onClick={download}
        disabled={!stats || stats.confirmed === 0}
        className={`inline-flex items-center gap-2 px-3.5 py-2 border rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t.secondary}`}
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        Descargar confirmados (CSV)
      </button>
    </section>
  );
};
