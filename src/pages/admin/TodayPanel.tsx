import React, { useCallback, useEffect, useState } from 'react';
import { Check, ChevronRight, RefreshCw, TriangleAlert } from 'lucide-react';
import type { UserDto } from '../../../shared/auth';
import type { OrderStatus } from '../../../shared/domain';
import { SECTION_STATUS, type StaffToday, type TodaySection, type TodaySectionKey, type TodayTask } from '../../../shared/staff-today';
import { adminErrorMessage, fetchStaffToday } from '../../api/admin';
import { PlazoRuler, STAGE_COLOR, daysLeft, statusName, waiting } from './ui';

/** Qué hay que hacer en cada tipo de tarea, dicho como una acción. */
const KIND: Record<TodaySectionKey, { title: string; hint: string }> = {
  late: { title: 'Fuera de plazo', hint: 'Han pasado la fecha prevista y siguen en el laboratorio.' },
  returnedByQa: { title: 'Devueltas por calidad', hint: 'Corrige el resultado y vuelve a enviarlo.' },
  toReceive: { title: 'Confirmar recepción', hint: 'Pedidos pagados cuyo paquete aún no se ha confirmado.' },
  toIdentify: { title: 'Identificar cartas', hint: 'Apunta qué carta es cada una antes de gradearla.' },
  toGrade: { title: 'Importar informe del escáner', hint: 'Cartas en el laboratorio sin resultado: sube su PDF.' },
  myDrafts: { title: 'Borradores sin enviar', hint: 'Resultados guardados que aún no están en control de calidad.' },
  toReview: { title: 'Aprobar en calidad', hint: 'Resultados pendientes de la segunda firma.' },
  readyToShip: { title: 'Aprobar la salida', hint: 'Todas sus cartas están aprobadas: falta registrar el envío y aprobar la salida.' },
  photosMissing: { title: 'Fotos del slab', hint: 'Cartas sin la foto del anverso o del reverso del slab.' },
  toDeliver: { title: 'Confirmar entrega', hint: 'Enviados, pendientes de confirmar que llegaron.' },
  onHold: { title: 'En pausa', hint: 'Pedidos detenidos que hay que resolver y reanudar.' },
};
const stageName = statusName;

const timeLabel = (d: Date) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

/** Lo urgente va primero, siempre. */
const URGENT: TodaySectionKey[] = ['late', 'returnedByQa'];

/**
 * Pantalla de inicio del laboratorio: el estado de todas las fases, la cola de trabajo de quien entra (cada tarea con
 * su regla de plazo) y, al lado, los avisos y lo que ya está al día.
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
  const idle = sections.filter((s) => s.count === 0);
  const shown = active.filter((s) => !filter || s.key === filter);
  const pipeline = data?.pipeline ?? [];
  const lateTotal = pipeline.reduce((sum, p) => sum + p.late, 0);
  const onHold = pipeline.find((p) => p.status === 'ON_HOLD')?.count ?? 0;
  const firstUrgent = active.find((s) => URGENT.includes(s.key));

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Resumen en una línea y actualización */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[26px] leading-tight font-bold tracking-[-0.01em]">
            {!data ? 'Cargando tu cola…' : pending === 0 ? 'Todo al día' : `${pending} ${pending === 1 ? 'tarea pendiente' : 'tareas pendientes'}`}
          </h2>
          <p className="text-[14px] text-[#5A5F5B] mt-1">
            {!data
              ? ' '
              : pending === 0
                ? 'No tienes nada pendiente. Cuando llegue algo nuevo aparecerá aquí.'
                : firstUrgent
                  ? `Empieza por «${title(firstUrgent.key)}». Después, lo que vence antes.`
                  : 'Ordenadas por lo que vence antes.'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[13px] text-[#5A5F5B]">
          {updatedAt && <span>Actualizado a las {timeLabel(updatedAt)}</span>}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[3px] border border-[#C7CAC4] bg-white text-[#121413] font-semibold hover:border-[#121413] cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Actualizar
          </button>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-[#B42B22]">{error}</p>}

      {/* Tira de calibración: el laboratorio entero, fase por fase */}
      {data && (
        <section aria-labelledby="lab-now" className="bg-white border border-[#D7D9D3] rounded-[3px]">
          <h3 id="lab-now" className="sr-only">Pedidos en cada fase</h3>
          <ol className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
            {pipeline.map((stage, i) => (
              <li key={stage.status} className={`border-[#D7D9D3] ${i > 0 ? 'xl:border-l' : ''} ${i % 4 !== 0 ? 'sm:border-l' : ''} ${i % 2 !== 0 ? 'border-l' : ''} ${i >= 2 ? 'border-t sm:border-t-0' : ''} ${i >= 4 ? 'sm:border-t xl:border-t-0' : ''}`}>
                <button
                  type="button"
                  onClick={() => onOpenQueue(stage.status)}
                  className="w-full h-full text-left px-4 pt-0 pb-3 hover:bg-[#F7F8F5] cursor-pointer"
                  title={`Ver los pedidos en «${stageName(stage.status as OrderStatus)}»`}
                >
                  <span className="block h-1.5 -mx-4 mb-3" style={{ background: STAGE_COLOR[stage.status as OrderStatus] }} aria-hidden="true" />
                  <span className="block text-[12px] font-medium text-[#5A5F5B] truncate">{stageName(stage.status as OrderStatus)}</span>
                  <span className={`block text-[28px] leading-none font-bold mt-1.5 ${stage.count === 0 ? 'text-[#A9AEA9]' : ''}`}>{stage.count}</span>
                  <span className={`block text-[12px] mt-1.5 ${stage.late > 0 ? 'text-[#B42B22] font-semibold' : 'text-[#5A5F5B]'}`}>
                    {stage.late > 0 ? `${stage.late} fuera de plazo` : 'En plazo'}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      {data && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
          {/* Cola de trabajo */}
          <section aria-labelledby="queue-title" className="bg-white border border-[#D7D9D3] rounded-[3px] min-w-0">
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[#D7D9D3]">
              <h3 id="queue-title" className="text-[16px] font-bold mr-auto">Tu cola de trabajo</h3>
              {active.length > 1 && (
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar la cola">
                  <FilterChip label="Todas" count={pending} on={!filter} onClick={() => setFilter(null)} />
                  {active.map((s) => (
                    <FilterChip key={s.key} label={title(s.key)} count={s.count} on={filter === s.key} onClick={() => setFilter(filter === s.key ? null : s.key)} />
                  ))}
                </div>
              )}
            </div>

            {pending === 0 ? (
              <div className="px-6 py-14 text-center">
                <span className="mx-auto w-11 h-11 rounded-full bg-[#E6F2E8] text-[#25762F] flex items-center justify-center">
                  <Check className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <p className="mt-3 text-[15px] font-semibold">No tienes tareas pendientes</p>
                <p className="text-[13px] text-[#5A5F5B] mt-1">Cuando un pedido necesite algo de tu parte, aparecerá aquí.</p>
              </div>
            ) : (
              shown.map((s) => <Group key={s.key} section={s} title={title(s.key)} onOpenOrder={onOpenOrder} onOpenQueue={onOpenQueue} />)
            )}
          </section>

          {/* Avisos y lo que está al día */}
          <aside className="space-y-4">
            {lateTotal > 0 && (
              <section className="bg-white border border-[#E3B3AE] rounded-[3px] p-4">
                <h3 className="flex items-center gap-2 text-[14px] font-bold text-[#B42B22]">
                  <TriangleAlert className="w-4 h-4" aria-hidden="true" />
                  {lateTotal} {lateTotal === 1 ? 'pedido fuera de plazo' : 'pedidos fuera de plazo'}
                </h3>
                <p className="text-[13px] text-[#5A5F5B] mt-1.5">Han pasado su fecha prevista y siguen en el laboratorio. Atiéndelos antes que el resto.</p>
              </section>
            )}
            {onHold > 0 && (
              <section className="bg-white border border-[#D7D9D3] rounded-[3px] p-4">
                <h3 className="text-[14px] font-bold">{onHold} {onHold === 1 ? 'pedido en pausa' : 'pedidos en pausa'}</h3>
                <p className="text-[13px] text-[#5A5F5B] mt-1.5">El plazo está detenido hasta que se resuelva la incidencia.</p>
                <button type="button" onClick={() => onOpenQueue('ON_HOLD')} className="mt-2 text-[13px] font-semibold text-[#25762F] hover:underline underline-offset-4 cursor-pointer">
                  Ver los pedidos en pausa
                </button>
              </section>
            )}
            {idle.length > 0 && (
              <section className="bg-white border border-[#D7D9D3] rounded-[3px]">
                <h3 className="px-4 pt-4 pb-2 text-[14px] font-bold">Al día</h3>
                <ul className="pb-2">
                  {idle.map((s) => (
                    <li key={s.key} className="flex items-center gap-2.5 px-4 py-1.5 text-[13px] text-[#3D423F]">
                      <Check className="w-4 h-4 text-[#2F8F3E] shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      {title(s.key)}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

const FilterChip: React.FC<{ label: string; count: number; on: boolean; onClick: () => void }> = ({ label, count, on, onClick }) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[3px] border text-[12px] font-medium cursor-pointer transition-colors ${
      on ? 'bg-[#121413] border-[#121413] text-white' : 'bg-white border-[#C7CAC4] text-[#3D423F] hover:border-[#121413]'
    }`}
  >
    {label}
    <span className={`font-mono text-[11px] ${on ? 'text-[#C4C8C3]' : 'text-[#6B706C]'}`}>{count}</span>
  </button>
);

const Group: React.FC<{
  section: TodaySection;
  title: string;
  onOpenOrder: (code: string) => void;
  onOpenQueue: (status: string) => void;
}> = ({ section, title, onOpenOrder, onOpenQueue }) => {
  const status = SECTION_STATUS[section.key];
  const more = section.count - section.tasks.length;
  const urgent = URGENT.includes(section.key);
  // Dentro del grupo, lo que vence antes primero; sin fecha, lo que más lleva esperando.
  const tasks = [...section.tasks].sort((a, b) => {
    const da = daysLeft(a);
    const db = daysLeft(b);
    if (da !== null && db !== null && da !== db) return da - db;
    if (da === null !== (db === null)) return da === null ? 1 : -1;
    return a.since.localeCompare(b.since);
  });

  return (
    <section aria-label={title} className="border-b border-[#D7D9D3] last:border-b-0">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-2.5 bg-[#F4F5F2] border-b border-[#E2E4DF]">
        <h4 className={`text-[13px] font-bold ${urgent ? 'text-[#B42B22]' : ''}`}>
          {title} <span className="font-mono font-normal text-[#5A5F5B]">· {section.count}</span>
        </h4>
        <p className="text-[12px] text-[#5A5F5B] mr-auto">{KIND[section.key].hint}</p>
        {status && (
          <button type="button" onClick={() => onOpenQueue(status)} className="text-[12px] font-semibold text-[#25762F] hover:underline underline-offset-4 cursor-pointer">
            Abrir en Pedidos
          </button>
        )}
      </header>
      <ul>
        {tasks.map((task) => (
          <li key={`${task.orderCode}#${task.position ?? 0}`} className="border-b border-[#ECEDE9] last:border-b-0">
            <button
              type="button"
              onClick={() => onOpenOrder(task.orderCode)}
              className="group w-full grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_220px_16px] gap-x-6 gap-y-2 items-center px-5 py-3 text-left hover:bg-[#F7F8F5] cursor-pointer"
            >
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold truncate">
                  {task.position !== undefined ? task.cardName ?? 'Carta sin identificar' : `${task.customerName ?? task.customerEmail}`}
                </span>
                <span className="block font-mono text-[12px] text-[#5A5F5B] truncate">
                  {task.orderCode}{task.position !== undefined ? ` · carta ${task.position}` : ''}
                </span>
              </span>
              <span className="hidden md:block min-w-0">
                <span className="block text-[13px] truncate">{task.note ?? (task.position !== undefined ? task.customerName ?? task.customerEmail : stageName(task.status))}</span>
                <span className="block text-[12px] text-[#5A5F5B] truncate">
                  {task.position !== undefined && task.note ? task.customerName ?? task.customerEmail : `Desde ${waiting(task.since)}`}
                </span>
              </span>
              <span className="min-w-0">
                <PlazoRuler task={task} />
              </span>
              <ChevronRight className="hidden md:block w-4 h-4 text-[#8A8F8B] justify-self-end transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      {more > 0 && (
        <p className="px-5 py-2 text-[12px] text-[#5A5F5B] border-t border-[#ECEDE9]">
          Se muestran {section.tasks.length} de {section.count}: las que más tiempo llevan esperando.
        </p>
      )}
    </section>
  );
};
