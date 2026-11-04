import React, { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import type { UserDto } from '../../../shared/auth';
import type { OrderStatus } from '../../../shared/domain';
import { SECTION_STATUS, type StaffToday, type TodaySection, type TodaySectionKey, type TodayTask } from '../../../shared/staff-today';
import { adminErrorMessage, fetchStaffToday } from '../../api/admin';
import { INK, LATE, LINE_STAGES, PlazoRuler, STATION_NAME, daysLeft, groupCode, waiting } from './ui';

/** Cada tipo de tarea: su nombre, el nombre corto del filtro y el botón con lo que hay que hacer. */
const KIND: Record<TodaySectionKey, { title: string; short: string; action: string; primary?: boolean }> = {
  late: { title: 'Fuera de plazo', short: 'Fuera de plazo', action: 'Abrir', primary: true },
  returnedByQa: { title: 'Devueltas por calidad', short: 'Devueltas', action: 'Corregir', primary: true },
  toReceive: { title: 'Confirmar recepción', short: 'Recepción', action: 'Recibir' },
  toIdentify: { title: 'Identificar cartas', short: 'Identificar', action: 'Identificar' },
  toGrade: { title: 'Importar informe del escáner', short: 'Escáner', action: 'Subir PDF', primary: true },
  myDrafts: { title: 'Borradores sin enviar', short: 'Borradores', action: 'Continuar' },
  toReview: { title: 'Aprobar en calidad', short: 'Calidad', action: 'Revisar', primary: true },
  readyToShip: { title: 'Aprobar la salida', short: 'Salida', action: 'Aprobar salida', primary: true },
  toDeliver: { title: 'Confirmar entrega', short: 'Entrega', action: 'Confirmar' },
  onHold: { title: 'En pausa', short: 'Pausa', action: 'Resolver' },
  photosMissing: { title: 'Fotos del slab', short: 'Fotos', action: 'Subir fotos' },
};
/** Lo urgente va primero, siempre. */
const URGENT: TodaySectionKey[] = ['late', 'returnedByQa'];

const timeLabel = (d: Date) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
/** Como mucho tantas rayitas por estación; el resto se resume con "+N". */
const MAX_TICKS = 14;

/**
 * Pantalla de inicio del laboratorio: una frase con lo que toca, la línea del laboratorio (cuántos pedidos hay en
 * cada estación y cuáles van tarde) y la cola de trabajo de quien entra, cada tarea con su plazo y su botón.
 */
export const TodayPanel: React.FC<{
  user: UserDto;
  onOpenOrder: (code: string) => void;
  onOpenQueue: (status: string) => void;
}> = ({ user, onOpenOrder, onOpenQueue }) => {
  const [data, setData] = useState<StaffToday | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TodaySectionKey | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchStaffToday()
      .then((d) => {
        setData(d);
        setUpdatedAt(new Date());
        setError('');
      })
      .catch((err) => setError(adminErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const title = (key: TodaySectionKey) => (key === 'myDrafts' && user.role === 'admin' ? 'Borradores' : KIND[key].title);
  const sections = data?.sections ?? [];
  const pending = sections.reduce((sum, s) => sum + s.count, 0);
  const active = sections
    .filter((s) => s.count > 0)
    .sort((a, b) => Number(URGENT.includes(b.key)) - Number(URGENT.includes(a.key)));
  const shown = active.filter((s) => !filter || s.key === filter);
  const pipeline = data?.pipeline ?? [];
  const stage = (st: OrderStatus) => pipeline.find((p) => p.status === st) ?? { status: st, count: 0, late: 0 };
  const lateTotal = pipeline.reduce((sum, p) => sum + p.late, 0);
  const onHold = stage('ON_HOLD').count;
  const inLine = LINE_STAGES.reduce((n, st) => n + stage(st).count, 0);

  return (
    <div className="space-y-8" aria-busy={loading}>
      {/* Lo que toca hoy, en una frase */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[30px] leading-[1.1] font-semibold tracking-[-0.02em]">
            {!data ? 'Cargando…' : pending === 0 ? 'Todo al día' : `${pending} ${pending === 1 ? 'tarea' : 'tareas'} para hoy`}
          </h2>
          <p className="text-[14px] text-[#666A67] mt-1.5">
            {!data ? ' ' : lateTotal > 0 ? (
              <>
                <strong className="font-semibold" style={{ color: LATE }}>
                  {lateTotal} {lateTotal === 1 ? 'pedido fuera de plazo.' : 'pedidos fuera de plazo.'}
                </strong>{' '}
                Empieza por {lateTotal === 1 ? 'él' : 'ellos'}; el resto va por fecha de vencimiento.
              </>
            ) : pending === 0 ? 'No tienes nada pendiente. Cuando un pedido necesite algo de ti, aparecerá aquí.' : 'Todo va en plazo. La cola está ordenada por fecha de vencimiento.'}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 h-8 px-3 rounded-[7px] border border-[#E1E1DC] bg-white text-[13px] font-medium hover:border-[#0F1110] cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {updatedAt ? `Actualizado ${timeLabel(updatedAt)}` : 'Actualizar'}
        </button>
      </div>

      {error && <p role="alert" className="text-sm" style={{ color: LATE }}>{error}</p>}

      {/* La línea del laboratorio: cada estación con sus pedidos, una rayita por pedido; en rojo, los que van tarde */}
      {data && (
        <section aria-labelledby="lab-line" className="bg-white border border-[#E7E7E2] rounded-[10px] px-5 sm:px-7 pt-5 pb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <h3 id="lab-line" className="text-[13px] font-semibold">Línea del laboratorio</h3>
            <span className="text-[13px] text-[#666A67]">
              {inLine} {inLine === 1 ? 'pedido activo' : 'pedidos activos'}
              {onHold > 0 && (
                <>
                  {' · '}
                  <button type="button" onClick={() => onOpenQueue('ON_HOLD')} className="underline underline-offset-4 decoration-[#C9CBC7] hover:decoration-[#0F1110] cursor-pointer">
                    {onHold} en pausa
                  </button>
                </>
              )}
            </span>
          </div>
          <div className="overflow-x-auto -mx-2">
            <ol className="relative grid grid-cols-7 min-w-[640px] px-2">
              <span className="absolute h-px bg-[#0F1110] top-[61px]" style={{ left: 'calc(100% / 14)', right: 'calc(100% / 14)' }} aria-hidden="true" />
              {LINE_STAGES.map((st) => {
                const s = stage(st);
                const ticks = Math.min(s.count, MAX_TICKS);
                const lateTicks = Math.min(s.late, ticks);
                return (
                  <li key={st}>
                    <button
                      type="button"
                      onClick={() => onOpenQueue(st)}
                      className="group relative w-full h-[96px] flex flex-col items-center cursor-pointer"
                      aria-label={`${STATION_NAME[st]}: ${s.count} ${s.count === 1 ? 'pedido' : 'pedidos'}${s.late ? `, ${s.late} fuera de plazo` : ''}`}
                    >
                      <span className={`text-[22px] leading-[28px] font-semibold tracking-[-0.02em] ${s.count === 0 ? 'text-[#C9CBC7]' : ''}`}>{s.count}</span>
                      <span className="flex items-end gap-[3px] h-[22px] mt-[3px]" aria-hidden="true">
                        {Array.from({ length: ticks }, (_, i) => (
                          <i key={i} className="block w-[3px] rounded-[1px]" style={{ height: i < lateTicks ? 18 : 14, background: i < lateTicks ? LATE : INK }} />
                        ))}
                        {s.count > MAX_TICKS && <span className="font-mono text-[10px] text-[#666A67] ml-0.5">+{s.count - MAX_TICKS}</span>}
                      </span>
                      <span
                        className={`absolute top-[57px] w-[9px] h-[9px] rounded-full border-[1.5px] border-[#0F1110] transition-transform group-hover:scale-125 ${s.count ? 'bg-[#0F1110]' : 'bg-white'}`}
                        aria-hidden="true"
                      />
                      <span className="absolute top-[74px] text-[12px] text-[#666A67] whitespace-nowrap group-hover:text-[#0F1110]">
                        {STATION_NAME[st]}
                        {s.late > 0 && <strong className="font-semibold" style={{ color: LATE }}> · {s.late} tarde</strong>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {/* Cola de trabajo */}
      {data && (
        <section aria-labelledby="queue-title" className="bg-white border border-[#E7E7E2] rounded-[10px] overflow-hidden">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 border-b border-[#E7E7E2]">
            <h3 id="queue-title" className="text-[13px] font-semibold">Cola de trabajo</h3>
            {active.length > 1 && (
              <div className="flex flex-wrap gap-0.5 p-0.5 rounded-[7px] bg-[#F1F1EE]" role="group" aria-label="Filtrar la cola">
                <Segment label="Todo" count={pending} on={!filter} onClick={() => setFilter(null)} />
                {active.map((s) => (
                  <Segment key={s.key} label={KIND[s.key].short} count={s.count} on={filter === s.key} onClick={() => setFilter(filter === s.key ? null : s.key)} />
                ))}
              </div>
            )}
          </div>

          {pending === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto w-10 h-10 rounded-full border border-[#E7E7E2] flex items-center justify-center">
                <Check className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
              </span>
              <p className="mt-3 text-[14px] font-semibold">Nada pendiente</p>
              <p className="text-[13px] text-[#666A67] mt-1">Cuando un pedido necesite algo de tu parte, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="pb-2">
              {shown.map((s) => (
                <Group key={s.key} section={s} title={title(s.key)} onOpenOrder={onOpenOrder} onOpenQueue={onOpenQueue} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

const Segment: React.FC<{ label: string; count: number; on: boolean; onClick: () => void }> = ({ label, count, on, onClick }) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    className={`h-7 px-2.5 rounded-[5px] text-[12.5px] cursor-pointer transition-colors ${
      on ? 'bg-white text-[#0F1110] font-semibold shadow-[0_1px_2px_rgba(15,17,16,0.08)]' : 'text-[#666A67] hover:text-[#0F1110]'
    }`}
  >
    {label} <span className="font-mono text-[11px]">{count}</span>
  </button>
);

const Group: React.FC<{
  section: TodaySection;
  title: string;
  onOpenOrder: (code: string) => void;
  onOpenQueue: (status: string) => void;
}> = ({ section, title, onOpenOrder, onOpenQueue }) => {
  const kind = KIND[section.key];
  const status = SECTION_STATUS[section.key];
  const more = section.count - section.tasks.length;
  const urgent = URGENT.includes(section.key);
  // Dentro del grupo, lo que vence antes primero; sin fecha, lo que más lleva esperando.
  const tasks = [...section.tasks].sort((a, b) => {
    const da = daysLeft(a);
    const db = daysLeft(b);
    if (da !== null && db !== null && da !== db) return da - db;
    if ((da === null) !== (db === null)) return da === null ? 1 : -1;
    return a.since.localeCompare(b.since);
  });

  return (
    <section aria-label={title}>
      <header className="flex items-baseline gap-2 px-5 pt-4 pb-1.5">
        <h4 className="text-[12.5px] font-semibold" style={urgent ? { color: LATE } : undefined}>{title}</h4>
        <span className="font-mono text-[11.5px] text-[#666A67]">{section.count}</span>
        {status && (
          <button type="button" onClick={() => onOpenQueue(status)} className="ml-auto text-[12.5px] text-[#666A67] hover:text-[#0F1110] underline-offset-4 hover:underline cursor-pointer">
            Ver en Pedidos
          </button>
        )}
      </header>
      <ul>
        {tasks.map((task, i) => (
          <li key={`${task.orderCode}#${task.position ?? 0}`} className={i > 0 ? 'border-t border-[#F1F1EE]' : ''}>
            <TaskRow task={task} action={kind.action} primary={!!kind.primary} onOpen={() => onOpenOrder(task.orderCode)} />
          </li>
        ))}
      </ul>
      {more > 0 && <p className="px-5 py-2 text-[12.5px] text-[#666A67]">Y {more} más: las que llevan menos tiempo esperando.</p>}
    </section>
  );
};

const TaskRow: React.FC<{ task: TodayTask; action: string; primary: boolean; onOpen: () => void }> = ({ task, action, primary, onOpen }) => {
  const isCard = task.position !== undefined;
  const headline = isCard ? task.cardName ?? 'Carta sin identificar' : task.customerName ?? task.customerEmail;
  const detail = isCard ? (task.note ?? `Carta ${task.position}`) : (task.note ?? `Desde ${waiting(task.since)}`);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[112px_minmax(0,1.2fr)_minmax(0,1fr)_140px_auto] gap-x-5 gap-y-1.5 items-center px-5 py-2.5 cursor-pointer hover:bg-[#FAFAF8] focus-visible:bg-[#FAFAF8]"
    >
      <span className="hidden md:block font-mono text-[12.5px] text-[#3B3F3C]">{groupCode(task.orderCode)}</span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold truncate">{headline}</span>
        <span className="block text-[12.5px] text-[#666A67] truncate">
          <span className="md:hidden font-mono">{groupCode(task.orderCode)} · </span>
          {detail}
        </span>
      </span>
      <span className="hidden md:block min-w-0">
        <span className="block text-[13.5px] truncate">{isCard ? task.customerName ?? task.customerEmail : task.customerEmail}</span>
        {isCard && task.customerName && <span className="block text-[12.5px] text-[#666A67] truncate">{task.customerEmail}</span>}
      </span>
      <span className="row-start-2 md:row-start-auto">
        <PlazoRuler task={task} />
      </span>
      <span
        className={`row-span-2 md:row-span-1 justify-self-end inline-flex items-center h-7 px-3 rounded-[6px] text-[12.5px] font-semibold whitespace-nowrap transition-colors ${
          primary ? 'bg-[#0F1110] text-white group-hover:bg-[#2A2E2B]' : 'border border-[#E1E1DC] group-hover:border-[#0F1110]'
        }`}
      >
        {action}
      </span>
    </div>
  );
};
