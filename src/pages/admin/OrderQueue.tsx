import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { ACTIVE_STATUSES, type OrderStatus } from '../../../shared/domain';
import type { AdminOrderList } from '../../../shared/admin';
import { adminErrorMessage, fetchAdminOrders } from '../../api/admin';
import { STATUS_LABEL } from '../../utils/orderStatus';
import { SHIPPING_LABEL, StatusPill, formatDate, money, usePanelTheme, waiting } from './ui';

/** Pestañas de la cola, en el orden del recorrido del pedido. */
const TAB_STATUSES: OrderStatus[] = [
  'SUBMITTED', 'PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION',
  'QUALITY_ASSURANCE', 'SHIPPED', 'ON_HOLD', 'DELIVERED', 'CANCELLED',
];

export const OrderQueue: React.FC<{ initialStatus?: string; onOpen: (code: string) => void }> = ({ initialStatus = 'active', onOpen }) => {
  const t = usePanelTheme();
  const [status, setStatus] = useState<string>(initialStatus);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'oldest' | 'newest'>('oldest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminOrderList | null>(null);
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
    fetchAdminOrders({ status, q: q || undefined, sort, page })
      .then((list) => {
        if (cancelled) return;
        setData(list);
        setError('');
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
  }, [status, q, sort, page]);

  const activeCount = ACTIVE_STATUSES.reduce((sum, s) => sum + (data?.counts[s] ?? 0), 0);
  const tabs: { key: string; label: string; count: number | undefined }[] = [
    { key: 'active', label: 'Activos', count: data ? activeCount : undefined },
    ...TAB_STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s].es, count: data?.counts[s] ?? (data ? 0 : undefined) })),
  ];
  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Estado de los pedidos">
        {tabs.map((tab) => {
          const selected = status === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={selected}
              type="button"
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={`px-3 py-2 border rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                selected ? t.primary + ' border-transparent' : t.secondary
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${selected ? 'bg-black/20' : t.isLight ? 'bg-black/[0.06]' : 'bg-white/10'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <label className="relative sm:max-w-sm w-full">
          <span className="sr-only">Buscar por código, correo o nombre</span>
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.muted}`} />
          <input
            id="queue-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Código, correo o nombre"
            className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none ${t.input}`}
          />
        </label>
        <button
          type="button"
          onClick={() => { setSort(sort === 'oldest' ? 'newest' : 'oldest'); setPage(1); }}
          className={`px-3 py-2.5 border rounded-lg text-xs font-bold cursor-pointer ${t.secondary}`}
        >
          Orden: {sort === 'oldest' ? 'los más antiguos primero' : 'los más recientes primero'}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-red-500 text-sm">{error}</p>
      )}

      <div className={`border rounded-xl overflow-x-auto ${t.card}`} aria-busy={loading}>
        <table className="w-full text-left text-sm min-w-[820px]">
          <thead>
            <tr className={`border-b font-mono text-[10px] uppercase tracking-wider ${t.rule} ${t.muted}`}>
              <th className="px-4 py-3 font-bold">Pedido</th>
              <th className="px-4 py-3 font-bold">Cliente</th>
              <th className="px-4 py-3 font-bold">Cartas</th>
              <th className="px-4 py-3 font-bold">Estado</th>
              <th className="px-4 py-3 font-bold">Devolución</th>
              <th className="px-4 py-3 font-bold text-right">Total</th>
              <th className="px-4 py-3 font-bold">Recibido</th>
            </tr>
          </thead>
          <tbody>
            {data?.orders.map((order) => (
              <tr
                key={order.code}
                className={`border-b last:border-b-0 ${t.rule} ${t.isLight ? 'hover:bg-[#F6F2E9]' : 'hover:bg-[#444444]'} cursor-pointer`}
                onClick={() => onOpen(order.code)}
              >
                <td className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpen(order.code); }}
                    className={`font-mono font-bold whitespace-nowrap underline-offset-4 hover:underline cursor-pointer ${t.text}`}
                  >
                    {order.code}
                  </button>
                </td>
                <td className="px-4 py-3.5">
                  <div className={`font-bold ${t.text}`}>{order.customerName ?? '—'}</div>
                  <div className={`font-mono text-[11px] ${t.muted}`}>{order.customerEmail}</div>
                </td>
                <td className={`px-4 py-3.5 font-mono ${t.text}`}>{order.itemCount}</td>
                <td className="px-4 py-3.5">
                  <StatusPill status={order.status} />
                  {order.status === 'QUALITY_ASSURANCE' && (
                    <div className={`mt-1 text-[10px] font-bold ${t.positive}`}>Pendiente de aprobar</div>
                  )}
                </td>
                <td className={`px-4 py-3.5 text-xs ${t.muted}`}>{order.shippingMethod ? SHIPPING_LABEL[order.shippingMethod] : '—'}</td>
                <td className={`px-4 py-3.5 text-right font-mono ${t.text}`}>
                  {money(order.totalCents)}
                  {order.paymentStatus === 'unpaid' && <div className={`text-[10px] ${t.muted}`}>sin pagar</div>}
                </td>
                <td className="px-4 py-3.5">
                  <div className={`text-xs ${t.text}`}>{formatDate(order.submittedAt)}</div>
                  <div className={`text-[11px] ${t.muted}`}>{waiting(order.submittedAt)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.orders.length === 0 && (
          <p className={`px-4 py-10 text-center text-sm ${t.muted}`}>
            {q ? `Ningún pedido coincide con "${q}".` : 'No hay pedidos en esta lista.'}
          </p>
        )}
        {!data && loading && <p className={`px-4 py-10 text-center text-sm ${t.muted}`}>Cargando pedidos…</p>}
      </div>

      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between text-xs">
          <span className={t.muted}>{from}–{to} de {data.total}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className={`px-3 py-2 border rounded-lg font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${t.secondary}`}>
              Anterior
            </button>
            <button type="button" disabled={to >= data.total} onClick={() => setPage(page + 1)} className={`px-3 py-2 border rounded-lg font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${t.secondary}`}>
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
