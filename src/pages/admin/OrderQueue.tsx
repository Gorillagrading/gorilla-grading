import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { ACTIVE_STATUSES, type OrderStatus } from '../../../shared/domain';
import type { AdminOrderList } from '../../../shared/admin';
import { adminErrorMessage, fetchAdminOrders } from '../../api/admin';
import { PlazoRuler, SHIPPING_LABEL, StatusPill, groupCode, formatDate, money, statusName, usePanelTheme, waiting } from './ui';

/** Pestañas de la cola, en el orden del recorrido del pedido. */
const TAB_STATUSES: OrderStatus[] = [
  'SUBMITTED', 'PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION',
  'QUALITY_ASSURANCE', 'SHIPPED', 'ON_HOLD', 'DELIVERED', 'CANCELLED',
];

export const OrderQueue: React.FC<{ initialStatus?: string; initialQuery?: string; onOpen: (code: string) => void }> = ({
  initialStatus = 'active',
  initialQuery = '',
  onOpen,
}) => {
  const t = usePanelTheme();
  const [status, setStatus] = useState<string>(initialStatus);
  const [search, setSearch] = useState(initialQuery);
  const [q, setQ] = useState(initialQuery);
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
    // Al buscar se busca en todos los pedidos, estén en la fase que estén.
    fetchAdminOrders({ status: q || status === 'all' ? undefined : status, q: q || undefined, sort, page })
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
    { key: 'all', label: 'Todos', count: data ? Object.values(data.counts).reduce((a, b) => a + (b ?? 0), 0) : undefined },
    ...TAB_STATUSES.map((s) => ({ key: s, label: statusName(s), count: data?.counts[s] ?? (data ? 0 : undefined) })),
  ];
  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  const finished = (st: OrderStatus) => st === 'DELIVERED' || st === 'CANCELLED' || st === 'RETURNED';

  return (
    <div className="space-y-4">
      {/* Fases del pedido: control segmentado, cada fase con sus pedidos */}
      <div className="overflow-x-auto">
        <div className="inline-flex gap-0.5 p-0.5 rounded-[8px] bg-[#EDEDE9]" role="tablist" aria-label="Estado de los pedidos">
          {tabs.map((tab) => {
            const selected = !q && status === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={selected}
                type="button"
                onClick={() => { setStatus(tab.key); setPage(1); }}
                className={`h-8 px-3 rounded-[6px] text-[13px] whitespace-nowrap cursor-pointer transition-colors ${
                  selected ? 'bg-white text-[#0F1110] font-semibold shadow-[0_1px_2px_rgba(15,17,16,0.08)]' : 'text-[#666A67] hover:text-[#0F1110]'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && <span className={`ml-1.5 font-mono text-[11.5px] ${tab.count ? '' : 'text-[#A9ADAA]'}`}>{tab.count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <label className="relative sm:w-[340px]">
          <span className="sr-only">Buscar por código, correo o nombre</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8E8B]" aria-hidden="true" />
          <input
            id="queue-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Código, correo o nombre"
            className={`w-full h-9 pl-9 pr-3 text-[14px] border rounded-[8px] focus:outline-none ${t.input}`}
          />
        </label>
        <span className="text-[13px] text-[#666A67] sm:mr-auto">
          {data ? `${data.total} ${data.total === 1 ? 'pedido' : 'pedidos'}${q ? ' en todas las fases' : ''}` : ' '}
        </span>
        <label className="inline-flex items-center gap-2 text-[13px] text-[#666A67]">
          Ordenar
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
            className={`h-9 px-2.5 text-[13px] border rounded-[8px] cursor-pointer ${t.input}`}
          >
            <option value="oldest">Los más antiguos primero</option>
            <option value="newest">Los más recientes primero</option>
          </select>
        </label>
      </div>

      {error && <p role="alert" className="text-[#C2362B] text-sm">{error}</p>}

      <div className="bg-white border border-[#E7E7E2] rounded-[8px] overflow-x-auto" aria-busy={loading}>
        <table className="w-full text-left text-[14px] min-w-[900px]">
          <thead>
            <tr className="bg-[#F6F6F3] border-b border-[#E7E7E2] text-[12px] text-[#666A67]">
              <th className="px-4 py-2.5 font-semibold">Pedido</th>
              <th className="px-4 py-2.5 font-semibold">Cliente</th>
              <th className="px-4 py-2.5 font-semibold">Estado</th>
              <th className="px-4 py-2.5 font-semibold w-[210px]">Plazo</th>
              <th className="px-4 py-2.5 font-semibold text-right">Total</th>
              <th className="px-4 py-2.5 font-semibold">Recibido</th>
            </tr>
          </thead>
          <tbody>
            {data?.orders.map((order) => (
              <tr
                key={order.code}
                className={`border-b border-[#F1F1EE] last:border-b-0 hover:bg-[#FAFAF8] cursor-pointer ${finished(order.status) ? 'text-[#666A67]' : ''}`}
                onClick={() => onOpen(order.code)}
              >
                <td className="px-4 py-3 align-top">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpen(order.code); }}
                    className="font-mono text-[14px] font-semibold whitespace-nowrap underline-offset-4 hover:underline cursor-pointer"
                  >
                    {groupCode(order.code)}
                  </button>
                  <div className="text-[12px] text-[#666A67] mt-0.5 whitespace-nowrap">
                    {order.itemCount} {order.itemCount === 1 ? 'carta' : 'cartas'}
                    {order.shippingMethod ? ` · ${SHIPPING_LABEL[order.shippingMethod]}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold">{order.customerName ?? '—'}</div>
                  <div className="text-[12px] text-[#666A67]">{order.customerEmail}</div>
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusPill status={order.status} />
                  {order.status === 'QUALITY_ASSURANCE' && <div className="mt-1 text-[12px] text-[#666A67]">Pendiente de aprobar</div>}
                </td>
                <td className="px-4 py-3 align-top">
                  {finished(order.status) ? (
                    <span className="text-[12px] text-[#666A67]">Cerrado</span>
                  ) : (
                    <PlazoRuler task={{ status: order.status, startedAt: order.startedAt, dueDate: order.dueDate, since: order.submittedAt }} />
                  )}
                </td>
                <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                  <div className="font-mono">{money(order.totalCents)}</div>
                  {order.paymentStatus === 'unpaid' && (
                    <span className="inline-block mt-1 px-1.5 py-px rounded-[2px] bg-[#FBF1DD] text-[#8A5A0B] text-[11px] font-semibold">Sin pagar</span>
                  )}
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  <div className="text-[13px]">{formatDate(order.submittedAt)}</div>
                  <div className="text-[12px] text-[#666A67]">{waiting(order.submittedAt)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.orders.length === 0 && (
          <p className="px-4 py-12 text-center text-[14px] text-[#666A67]">
            {q ? `Ningún pedido coincide con «${q}».` : 'No hay pedidos en esta fase.'}
          </p>
        )}
        {!data && loading && <p className="px-4 py-12 text-center text-[14px] text-[#666A67]">Cargando pedidos…</p>}
      </div>

      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#666A67]">{from}–{to} de {data.total}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className={`h-9 px-3 border rounded-[8px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${t.secondary}`}>
              Anterior
            </button>
            <button type="button" disabled={to >= data.total} onClick={() => setPage(page + 1)} className={`h-9 px-3 border rounded-[8px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${t.secondary}`}>
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
