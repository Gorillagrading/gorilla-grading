import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { AdminOrderDetail, AdminTransitionOption } from '../../../shared/admin';
import type { OrderStatus } from '../../../shared/domain';
import type { ImageDto } from '../../../shared/photos';
import {
  addAdminShipment, adminErrorMessage, fetchAdminOrder, fetchOrderImages, transitionAdminOrder,
} from '../../api/admin';
import { ApiError } from '../../api/client';
import { STATUS_LABEL } from '../../utils/orderStatus';
import { GradingPanel } from './GradingPanel';
import {
  SHIPPING_LABEL, StatusPill, formatDate, formatDateTime, money, usePanelTheme, waiting,
} from './ui';

const BLOCKED_TEXT: Record<NonNullable<AdminTransitionOption['blockedReason']>, string> = {
  tracking_required: 'Registra antes el transportista y el número de seguimiento de la devolución.',
  grading_incomplete: 'Todas las cartas necesitan su resultado de graduación aprobado por control de calidad.',
  two_person_rule: 'Quien encapsuló este pedido no puede aprobarlo. Tiene que hacerlo otra persona.',
};

function actionLabel(option: AdminTransitionOption, order: AdminOrderDetail): string {
  const { status } = order.order;
  if (status === 'ON_HOLD' && option.to !== 'CANCELLED') return `Reanudar: volver a «${STATUS_LABEL[option.to].es}»`;
  switch (option.to) {
    case 'PACKAGE_RECEIVED': return 'Confirmar recepción del paquete';
    case 'PRE_INSPECTION':
    case 'OPTICAL_GRADING':
    case 'ENCAPSULATION':
    case 'QUALITY_ASSURANCE':
      return `Adelantar a mano: pasar a «${STATUS_LABEL[option.to].es}»`;
    case 'SHIPPED':
      return order.order.shippingMethod === 'CARD_SHOW_DROPOFF' ? 'Aprobar: listo para entrega en mano' : 'Aprobar y enviar de vuelta';
    case 'DELIVERED': return 'Marcar como entregado';
    case 'ON_HOLD': return 'Poner en pausa por una incidencia';
    case 'CANCELLED': return 'Cancelar el pedido';
    default: return STATUS_LABEL[option.to].es;
  }
}

/** Acciones que no son el siguiente paso normal: pausar, cancelar o adelantar una fase que el sistema haría solo. */
const AUTOMATIC_STAGES: OrderStatus[] = ['PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE'];
const isRisky = (option: AdminTransitionOption) =>
  option.to === 'ON_HOLD' || option.to === 'CANCELLED' || AUTOMATIC_STAGES.includes(option.to);

export const OrderDetail: React.FC<{ code: string; onBack: () => void }> = ({ code, onBack }) => {
  const t = usePanelTheme();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [notice, setNotice] = useState('');
  const [action, setAction] = useState<AdminTransitionOption | null>(null);
  const [images, setImages] = useState<Record<number, ImageDto[]>>({});

  const reload = useCallback(async () => {
    try {
      setOrder(await fetchAdminOrder(code));
      setError('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setError(adminErrorMessage(err));
    }
  }, [code]);

  /** Las fotos pueden no estar disponibles (almacenamiento sin configurar); el resto del panel sigue funcionando. */
  const reloadImages = useCallback(async () => {
    try {
      const { items } = await fetchOrderImages(code);
      setImages(Object.fromEntries(items.map((i) => [i.position, i.images])));
    } catch {
      setImages({});
    }
  }, [code]);

  useEffect(() => {
    void reloadImages();
  }, [reloadImages]);

  useEffect(() => {
    setOrder(null);
    setNotFound(false);
    void reload();
  }, [reload]);

  if (notFound) {
    return (
      <div className={`border rounded-xl p-10 text-center ${t.card}`}>
        <h2 className={`font-['Nunito',sans-serif] text-xl font-[900] uppercase ${t.text}`}>Pedido no encontrado</h2>
        <p className={`text-sm mt-2 ${t.muted}`}>No existe ningún pedido con el código {code}.</p>
        <button type="button" onClick={onBack} className={`mt-5 px-5 py-2.5 rounded-lg text-xs font-bold cursor-pointer ${t.primary}`}>
          Volver a la cola
        </button>
      </div>
    );
  }
  if (!order) {
    return <p className={`text-sm ${t.muted}`} aria-busy="true">{error || 'Cargando pedido…'}</p>;
  }

  const o = order.order;
  const timeline = [...order.timeline].reverse();

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className={`inline-flex items-center gap-2 text-xs font-bold cursor-pointer ${t.muted} hover:underline`}>
        <ArrowLeft className="w-4 h-4" /> Cola de pedidos
      </button>

      {/* Cabecera */}
      <div className={`border rounded-xl p-5 sm:p-6 ${t.card}`}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className={`font-mono text-xl sm:text-2xl font-bold tracking-tight ${t.text}`}>{o.code}</h2>
          <StatusPill status={o.status} />
          {o.status === 'ON_HOLD' && o.statusBeforeHold && (
            <span className={`text-xs ${t.muted}`}>Estaba en «{STATUS_LABEL[o.statusBeforeHold].es}»</span>
          )}
        </div>
        <dl className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            ['Recibido', `${formatDate(o.submittedAt)}${o.submittedAt ? ` · ${waiting(o.submittedAt)}` : ''}`],
            ['Entrega estimada', formatDate(o.estimatedCompletionAt)],
            ['Devolución', o.shippingMethod ? SHIPPING_LABEL[o.shippingMethod] : '—'],
            ['Total', `${money(o.totalCents)} · ${o.paymentStatus === 'unpaid' ? 'sin pagar' : o.paymentStatus}`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className={`font-mono text-[10px] uppercase tracking-wider ${t.muted}`}>{label}</dt>
              <dd className={`mt-1 font-medium ${t.text}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {notice && <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>}
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          {/* Cartas */}
          <section className={`border rounded-xl overflow-x-auto ${t.card}`} aria-label="Cartas del pedido">
            <h3 className={`px-5 pt-5 pb-3 font-['Nunito',sans-serif] text-sm font-[900] uppercase ${t.text}`}>Cartas ({order.items.length})</h3>
            <table className="w-full text-left text-sm min-w-[560px]">
              <thead>
                <tr className={`border-y font-mono text-[10px] uppercase tracking-wider ${t.rule} ${t.muted}`}>
                  <th className="px-5 py-2 font-bold">#</th>
                  <th className="px-3 py-2 font-bold">Carta</th>
                  <th className="px-3 py-2 font-bold">Servicio</th>
                  <th className="px-3 py-2 font-bold text-right">Valor declarado</th>
                  <th className="px-5 py-2 font-bold text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.position} className={`border-b last:border-b-0 ${t.rule}`}>
                    <td className={`px-5 py-3 font-mono text-xs ${t.muted}`}>{String(item.position).padStart(2, '0')}</td>
                    <td className="px-3 py-3">
                      <div className={`font-bold ${t.text}`}>{item.cardName}</div>
                      <div className={`text-[11px] ${t.muted}`}>
                        {[item.game, item.setName, item.year, item.language].filter(Boolean).join(' · ')}
                      </div>
                      {item.notes && <div className={`text-[11px] italic ${t.muted}`}>«{item.notes}»</div>}
                    </td>
                    <td className={`px-3 py-3 text-xs capitalize ${t.text}`}>{item.tier}</td>
                    <td className={`px-3 py-3 text-right font-mono ${t.text}`}>{money(item.declaredValueCents)}</td>
                    <td className={`px-5 py-3 text-right font-mono ${t.text}`}>{money(item.unitPriceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Graduación y fotos */}
          <section className={`border rounded-xl p-5 space-y-3 ${t.card}`} aria-label="Graduación y fotos">
            <h3 className={`font-['Nunito',sans-serif] text-sm font-[900] uppercase ${t.text}`}>Graduación y fotos</h3>
            {order.items.map((item) => (
              <GradingPanel
                key={item.position}
                code={code}
                order={order}
                item={item}
                images={images[item.position] ?? []}
                onChanged={async () => {
                  await Promise.all([reload(), reloadImages()]);
                }}
                onMessage={(kind, text) => {
                  setNotice(kind === 'notice' ? text : '');
                  setError(kind === 'error' ? text : '');
                }}
              />
            ))}
          </section>

          {/* Historial */}
          <section className={`border rounded-xl p-5 ${t.card}`} aria-label="Historial del pedido">
            <h3 className={`font-['Nunito',sans-serif] text-sm font-[900] uppercase mb-4 ${t.text}`}>Historial</h3>
            <ol className="space-y-5">
              {timeline.map((event) => (
                <li key={event.id} className={`pl-4 border-l-2 ${t.isLight ? 'border-[#D8D2C5]' : 'border-[#4E4E4E]'}`}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={`font-bold text-sm ${t.text}`}>{event.publicLabel}</span>
                    <StatusPill status={event.toStatus} />
                  </div>
                  <div className={`font-mono text-[11px] mt-0.5 ${t.muted}`}>
                    {formatDateTime(event.occurredAt)} · {event.automatic ? 'automático' : event.actor ? (event.actor.fullName ?? event.actor.email) : 'cliente'}
                  </div>
                  {event.publicDescription && (
                    <p className={`text-xs mt-1.5 ${t.muted}`}>
                      <span className="font-mono text-[10px] uppercase tracking-wider mr-1">Lo ve el cliente:</span>
                      {event.publicDescription}
                    </p>
                  )}
                  {event.internalNote && (
                    <p className="text-xs mt-2 px-3 py-2 rounded border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200">
                      <span className="font-mono text-[10px] uppercase tracking-wider mr-1">Nota interna:</span>
                      {event.internalNote}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6 order-1 lg:order-2">
          {/* Acciones */}
          <section className={`border rounded-xl p-5 ${t.card}`} aria-label="Siguiente paso">
            <h3 className={`font-['Nunito',sans-serif] text-sm font-[900] uppercase mb-3 ${t.text}`}>Siguiente paso</h3>
            {order.transitions.length === 0 ? (
              <p className={`text-xs ${t.muted}`}>
                {['DELIVERED', 'CANCELLED', 'RETURNED'].includes(o.status)
                  ? 'Este pedido está cerrado.'
                  : 'Tu rol no tiene acciones disponibles en este estado.'}
              </p>
            ) : (
              <ul className="space-y-3">
                {order.transitions.map((option) => (
                  <li key={option.to}>
                    <button
                      type="button"
                      disabled={!option.allowed}
                      onClick={() => { setNotice(''); setError(''); setAction(option); }}
                      className={`w-full px-4 py-3 rounded-lg text-xs font-extrabold text-left cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isRisky(option) ? `border ${t.secondary}` : t.primary
                      }`}
                    >
                      {actionLabel(option, order)}
                    </button>
                    {option.blockedReason && (
                      <p className="text-[11px] mt-1.5 text-amber-700 dark:text-amber-300">{BLOCKED_TEXT[option.blockedReason]}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Avance automático */}
          {order.automation && (
            <section className={`border rounded-xl p-5 ${t.card}`} aria-label="Avance automático">
              <h3 className={`font-['Nunito',sans-serif] text-sm font-[900] uppercase mb-3 ${t.text}`}>Avance automático</h3>
              {order.automation.awaitingFinalApproval ? (
                <p className="text-xs px-3 py-2.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
                  El pedido ha pasado todas las fases y está <strong>listo para aprobar su salida</strong>. El sistema no lo envía por su cuenta.
                </p>
              ) : order.automation.nextSteps.length > 0 ? (
                <>
                  <p className={`text-xs mb-3 ${t.muted}`}>El sistema pasa estas fases solo, según el plazo del servicio:</p>
                  <ul className="space-y-2">
                    {order.automation.nextSteps.map((step) => (
                      <li key={step.to} className="flex items-baseline justify-between gap-3 text-xs">
                        <span className={`font-bold ${t.text}`}>{STATUS_LABEL[step.to].es}</span>
                        <span className={`font-mono ${t.muted}`}>{formatDateTime(step.at)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className={`text-xs ${t.muted}`}>El reloj está parado mientras el pedido esté en pausa. Al reanudarlo se retrasará lo que haya durado.</p>
              )}
            </section>
          )}

          {/* Envíos */}
          <section className={`border rounded-xl p-5 ${t.card}`} aria-label="Envíos">
            <h3 className={`font-['Nunito',sans-serif] text-sm font-[900] uppercase mb-3 ${t.text}`}>Envíos y seguimiento</h3>
            {order.shipments.length === 0 ? (
              <p className={`text-xs ${t.muted}`}>Todavía no hay ningún envío registrado.</p>
            ) : (
              <ul className="space-y-2.5 mb-4">
                {order.shipments.map((s) => (
                  <li key={s.id} className="text-xs">
                    <span className={`font-mono text-[10px] uppercase tracking-wider mr-2 ${t.muted}`}>{s.direction === 'inbound' ? 'Entrada' : 'Devolución'}</span>
                    <span className={`font-bold ${t.text}`}>{s.carrier}</span>
                    <span className={`font-mono ml-2 ${t.text}`}>{s.trackingNumber}</span>
                  </li>
                ))}
              </ul>
            )}
            {order.canAddShipment && (
              <ShipmentForm
                onSubmit={async (body) => {
                  try {
                    setOrder(await addAdminShipment(code, body));
                    setError('');
                    setNotice('Envío registrado. El cliente ya lo ve en su seguimiento.');
                    return true;
                  } catch (err) {
                    setError(adminErrorMessage(err));
                    return false;
                  }
                }}
              />
            )}
          </section>

          {/* Cliente */}
          <section className={`border rounded-xl p-5 text-sm ${t.card}`} aria-label="Cliente">
            <h3 className={`font-['Nunito',sans-serif] text-sm font-[900] uppercase mb-3 ${t.text}`}>Cliente</h3>
            <div className={`font-bold ${t.text}`}>{order.customer.fullName ?? 'Sin nombre'}</div>
            <a href={`mailto:${order.customer.email}`} className={`font-mono text-xs underline underline-offset-4 ${t.muted}`}>{order.customer.email}</a>
            <div className={`text-[11px] mt-1 ${t.muted}`}>Idioma: {order.customer.locale === 'en' ? 'inglés' : 'español'}</div>
            {order.shippingAddress && (
              <address className={`not-italic text-xs mt-3 leading-relaxed ${t.text}`}>
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
                {order.shippingAddress.postalCode} {order.shippingAddress.city} ({order.shippingAddress.countryCode})
                {order.shippingAddress.phone && <><br />{order.shippingAddress.phone}</>}
              </address>
            )}
          </section>
        </div>
      </div>

      {action && (
        <ActionDialog
          option={action}
          title={actionLabel(action, order)}
          from={o.status}
          onClose={() => setAction(null)}
          onConfirm={async (publicDescription, internalNote) => {
            try {
              setOrder(await transitionAdminOrder(code, {
                to: action.to,
                expectedStatus: o.status,
                publicDescription: publicDescription || undefined,
                internalNote: internalNote || undefined,
              }));
              setAction(null);
              setError('');
              setNotice('Hecho. El cliente ya ve el cambio en su seguimiento.');
              return '';
            } catch (err) {
              // Si otra persona movió el pedido, se muestra su estado actual.
              if (err instanceof ApiError && err.code === 'order_changed') {
                setAction(null);
                setError(adminErrorMessage(err));
                await reload();
                return '';
              }
              return adminErrorMessage(err);
            }
          }}
        />
      )}
    </div>
  );
};

const ShipmentForm: React.FC<{ onSubmit: (body: { direction: 'inbound' | 'outbound'; carrier: string; trackingNumber: string }) => Promise<boolean> }> = ({ onSubmit }) => {
  const t = usePanelTheme();
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('outbound');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const field = `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${t.input}`;

  return (
    <form
      className="space-y-2.5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        if (await onSubmit({ direction, carrier: carrier.trim(), trackingNumber: trackingNumber.trim() })) {
          setCarrier('');
          setTrackingNumber('');
        }
        setBusy(false);
      }}
    >
      <select id="ship-direction" aria-label="Tipo de envío" value={direction} onChange={(e) => setDirection(e.target.value as 'inbound' | 'outbound')} className={field}>
        <option value="outbound">Devolución al cliente</option>
        <option value="inbound">Envío del cliente al laboratorio</option>
      </select>
      <input id="ship-carrier" aria-label="Transportista" placeholder="Transportista (GLS, CTT…)" value={carrier} onChange={(e) => setCarrier(e.target.value)} maxLength={80} required className={field} />
      <input id="ship-tracking" aria-label="Número de seguimiento" placeholder="Número de seguimiento" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} maxLength={80} required className={`${field} font-mono`} />
      <button type="submit" disabled={busy || !carrier.trim() || !trackingNumber.trim()} className={`w-full px-4 py-2.5 border rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t.secondary}`}>
        {busy ? 'Guardando…' : 'Añadir envío'}
      </button>
    </form>
  );
};

const ActionDialog: React.FC<{
  option: AdminTransitionOption;
  title: string;
  from: OrderStatus;
  onClose: () => void;
  onConfirm: (publicDescription: string, internalNote: string) => Promise<string>;
}> = ({ option, title, from, onClose, onConfirm }) => {
  const t = usePanelTheme();
  const [publicDescription, setPublicDescription] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const firstField = useRef<HTMLTextAreaElement>(null);
  const field = `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${t.input}`;

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          if (option.requiresNote && !internalNote.trim()) {
            setError('Escribe el motivo: este cambio necesita una nota.');
            return;
          }
          setBusy(true);
          setError(await onConfirm(publicDescription.trim(), internalNote.trim()));
          setBusy(false);
        }}
        className={`w-full max-w-lg p-6 border rounded-xl shadow-2xl space-y-4 ${t.card}`}
      >
        <div>
          <h3 id="action-title" className={`font-['Nunito',sans-serif] text-lg font-[900] uppercase ${t.text}`}>{title}</h3>
          <p className={`text-xs mt-1 ${t.muted}`}>
            «{STATUS_LABEL[from].es}» → «{STATUS_LABEL[option.to].es}». El cliente verá este cambio en su seguimiento.
          </p>
        </div>

        <label className="block">
          <span className={`block font-mono text-[10px] uppercase tracking-wider mb-1 ${t.muted}`}>Mensaje para el cliente (opcional)</span>
          <textarea
            id="action-public"
            ref={firstField}
            value={publicDescription}
            onChange={(e) => setPublicDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Si lo dejas vacío, se usa el texto estándar en su idioma."
            className={field}
          />
        </label>

        <label className="block">
          <span className={`block font-mono text-[10px] uppercase tracking-wider mb-1 ${t.muted}`}>
            Nota interna {option.requiresNote ? '(obligatoria, el cliente no la ve)' : '(opcional, el cliente no la ve)'}
          </span>
          <textarea
            id="action-note"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            maxLength={1000}
            rows={3}
            required={option.requiresNote}
            className={field}
          />
        </label>

        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className={`px-4 py-2.5 border rounded-lg text-xs font-bold cursor-pointer ${t.secondary}`}>Cancelar</button>
          <button type="submit" disabled={busy} className={`px-5 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer disabled:opacity-60 ${t.primary}`}>
            {busy ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  );
};
