import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { ACTIVE_STATUSES, type OrderStatus } from '../../../shared/domain';
import type { AdminOrderList } from '../../../shared/admin';
import { adminErrorMessage, fetchAdminOrders } from '../../api/admin';
import { PlazoRuler, SHIPPING_LABEL, STAGE_COLOR, StatusPill, formatDate, money, statusName, usePanelTheme, waiting } from './ui';

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
    ...TAB_STATUSES.map((s) => ({ key: s, label: statusName(s), count: data?.counts[s] ?? (data ? 0 : undefined) })),
  ];
  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  const finished = (st: OrderStatus) => st === 'DELIVERED' || st === 'CANCELLED' || st === 'RETURNED';

  return (
    <div className="space-y-4">
      {/* Fases del pedido como una tira de parches: cada una filtra la lista */}
      <div className="bg-white border border-[#D7D9D3] rounded-[3px] overflow-x-auto">
        <div className="flex min-w-max" role="tablist" aria-label="Estado de los pedidos">
          {tabs.map((tab, i) => {
            const selected = status === tab.key;
            const color = tab.key === 'active' ? '#121413' : STAGE_COLOR[tab.key as OrderStatus];
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={selected}
                type="button"
                onClick={() => { setStatus(tab.key); setPage(1); }}
                className={`relative flex flex-col items-start gap-1 px-4 pt-3 pb-2.5 min-w-[104px] text-left cursor-pointer transition-colors ${
                  i > 0 ? 'border-l border-[#E2E4DF]' : ''
                } ${selected ? 'bg-[#F4F5F2]' : 'hover:bg-[#F7F8F5]'}`}
              >
                <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: color, opacity: selected ? 1 : 0.55 }} aria-hidden="true" />
                <span className={`text-[12px] whitespace-nowrap ${selected ? 'font-semibold text-[#121413]' : 'text-[#5A5F5B]'}`}>{tab.label}</span>
                <span className={`font-mono text-[18px] leading-none ${tab.count ? 'text-[#121413]' : 'text-[#A9AEA9]'}`}>{tab.count ?? '–'}</span>
                {selected && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#121413]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <label className="relative sm:w-[340px]">
          <span className="sr-only">Buscar por código, correo o nombre</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B706C]" aria-hidden="true" />
          <input
            id="queue-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Código, correo o nombre"
            className={`w-full h-9 pl-9 pr-3 text-[14px] border rounded-[3px] focus:outline-none ${t.input}`}
          />
        </label>
        <span className="text-[13px] text-[#5A5F5B] sm:mr-auto">
          {data ? `${data.total} ${data.total === 1 ? 'pedido' : 'pedidos'}` : ' '}
        </span>
        <label className="inline-flex items-center gap-2 text-[13px] text-[#5A5F5B]">
          Ordenar
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
            className={`h-9 px-2.5 text-[13px] border rounded-[3px] cursor-pointer ${t.input}`}
          >
            <option value="oldest">Los más antiguos primero</option>
            <option value="newest">Los más recientes primero</option>
          </select>
        </label>
      </div>

      {error && <p role="alert" className="text-[#B42B22] text-sm">{error}</p>}

      <div className="bg-white border border-[#D7D9D3] rounded-[3px] overflow-x-auto" aria-busy={loading}>
        <table className="w-full text-left text-[14px] min-w-[900px]">
          <thead>
            <tr className="bg-[#F4F5F2] border-b border-[#D7D9D3] text-[12px] text-[#5A5F5B]">
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
                className={`border-b border-[#ECEDE9] last:border-b-0 hover:bg-[#F7F8F5] cursor-pointer ${finished(order.status) ? 'text-[#5A5F5B]' : ''}`}
                onClick={() => onOpen(order.code)}
              >
                <td className="px-4 py-3 align-top">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpen(order.code); }}
                    className="font-mono text-[14px] font-semibold whitespace-nowrap underline-offset-4 hover:underline cursor-pointer"
                  >
                    {order.code}
                  </button>
                  <div className="text-[12px] text-[#5A5F5B] mt-0.5 whitespace-nowrap">
                    {order.itemCount} {order.itemCount === 1 ? 'carta' : 'cartas'}
                    {order.shippingMethod ? ` · ${SHIPPING_LABEL[order.shippingMethod]}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold">{order.customerName ?? '—'}</div>
                  <div className="text-[12px] text-[#5A5F5B]">{order.customerEmail}</div>
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusPill status={order.status} />
                  {order.status === 'QUALITY_ASSURANCE' && <div className="mt-1 text-[12px] font-semibold text-[#6A4FC4]">Pendiente de aprobar</div>}
                </td>
                <td className="px-4 py-3 align-top">
                  {finished(order.status) ? (
                    <span className="text-[12px] text-[#5A5F5B]">Cerrado</span>
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
                  <div className="text-[12px] text-[#5A5F5B]">{waiting(order.submittedAt)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.orders.length === 0 && (
          <p className="px-4 py-12 text-center text-[14px] text-[#5A5F5B]">
            {q ? `Ningún pedido coincide con «${q}».` : 'No hay pedidos en esta fase.'}
          </p>
        )}
        {!data && loading && <p className="px-4 py-12 text-center text-[14px] text-[#5A5F5B]">Cargando pedidos…</p>}
      </div>

      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#5A5F5B]">{from}–{to} de {data.total}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className={`h-9 px-3 border rounded-[3px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${t.secondary}`}>
              Anterior
            </button>
            <button type="button" disabled={to >= data.total} onClick={() => setPage(page + 1)} className={`h-9 px-3 border rounded-[3px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${t.secondary}`}>
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
