import React, { useCallback, useEffect, useState } from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import type { UserDto } from '../../../shared/auth';
import { SECTION_STATUS, type StaffToday, type TodaySection, type TodaySectionKey } from '../../../shared/staff-today';
import { adminErrorMessage, fetchStaffToday } from '../../api/admin';
import { usePanelTheme, waiting } from './ui';

const COPY: Record<TodaySectionKey, { title: string; hint: string }> = {
  late: { title: 'Con retraso', hint: 'Han pasado la fecha prevista y siguen en el laboratorio.' },
  toReceive: { title: 'Por recibir', hint: 'Pedidos pagados cuyo paquete aún no se ha confirmado.' },
  photosMissing: { title: 'Fotos por hacer', hint: 'Cartas sin la foto del anverso o del reverso.' },
  returnedByQa: { title: 'Devueltas por calidad', hint: 'Rechazadas en control de calidad: corregir y volver a enviar.' },
  toGrade: { title: 'Por calificar', hint: 'Cartas en el laboratorio sin resultado.' },
  myDrafts: { title: 'Mis borradores', hint: 'Resultados guardados sin enviar a control de calidad.' },
  toReview: { title: 'Por revisar', hint: 'Resultados enviados, pendientes de aprobación.' },
  readyToShip: { title: 'Listos para salir', hint: 'Todas las cartas aprobadas: falta aprobar el envío.' },
  toDeliver: { title: 'Entrega sin confirmar', hint: 'Enviados, pendientes de confirmar la entrega.' },
  onHold: { title: 'En pausa', hint: 'Pedidos detenidos que hay que resolver y reanudar.' },
};

/** Las que conviene atender primero: se resaltan cuando tienen algo. */
const URGENT: TodaySectionKey[] = ['late', 'returnedByQa'];

const todayLabel = () => {
  const s = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const timeLabel = (d: Date) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

/**
 * Pantalla de inicio del laboratorio: un resumen con el número de tareas de cada tipo y, debajo,
 * una sola lista de trabajo agrupada. Cada tarea abre su pedido.
 */
export const TodayPanel: React.FC<{
  user: UserDto;
  onOpenOrder: (code: string) => void;
  onOpenQueue: (status: string) => void;
}> = ({ user, onOpenOrder, onOpenQueue }) => {
  const t = usePanelTheme();
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

  const title = (key: TodaySectionKey) => (key === 'myDrafts' && user.role === 'admin' ? 'Borradores' : COPY[key].title);
  const pending = data?.sections.reduce((sum, s) => sum + s.count, 0) ?? 0;
  const shown = data?.sections.filter((s) => s.count > 0 && (!filter || s.key === filter)) ?? [];
  const cells = data?.sections.length ?? 0;
  const cols = cells > 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : cells === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2';

  return (
    <div className="space-y-6" aria-busy={loading}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={`font-['Nunito',sans-serif] text-lg font-[900] ${t.text}`}>Tareas pendientes</h2>
          <p className={`text-xs ${t.muted}`}>
            {todayLabel()}
            {updatedAt && <> · actualizado a las {timeLabel(updatedAt)}</>}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 ${t.secondary}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {error && <p role="alert" className={`text-sm ${t.negative}`}>{error}</p>}

      {data && (
        <>
          {/* Resumen: una celda por tipo de tarea. Pulsar una filtra la lista. */}
          <div
            className={`grid ${cols} gap-px border rounded-xl overflow-hidden ${t.rule} ${t.isLight ? 'bg-[#E2DBD0]' : 'bg-[#4E4E4E]'}`}
            role="group"
            aria-label="Resumen de tareas"
          >
            {data.sections.map((s) => {
              const selected = filter === s.key;
              const urgent = URGENT.includes(s.key) && s.count > 0;
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={selected}
                  disabled={s.count === 0}
                  onClick={() => setFilter(selected ? null : s.key)}
                  className={`text-left px-4 py-3.5 transition-colors cursor-pointer disabled:cursor-default ${
                    selected ? (t.isLight ? 'bg-[#F3EFE6]' : 'bg-[#444444]') : t.isLight ? 'bg-white hover:bg-[#FAF8F3]' : 'bg-[#383838] hover:bg-[#3F3F3F]'
                  }`}
                >
                  <div className={`font-mono text-[10px] uppercase tracking-wider truncate ${selected ? t.text : t.muted}`}>{title(s.key)}</div>
                  <div
                    className={`font-['Nunito',sans-serif] text-2xl font-[900] leading-tight tabular-nums mt-1 ${
                      s.count === 0 ? t.muted : urgent ? t.negative : t.text
                    }`}
                  >
                    {s.count}
                  </div>
                  <div className={`text-[11px] truncate ${t.muted}`}>
                    {s.count === 0 ? 'Al día' : `La más antigua, ${waiting(s.tasks[0].since)}`}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Lista de trabajo */}
          <div className={`border rounded-xl overflow-x-auto ${t.card}`}>
            <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b ${t.rule}`}>
              <span className={`text-xs font-bold ${t.text}`}>
                {filter ? title(filter) : pending === 0 ? 'Sin tareas pendientes' : `${pending} ${pending === 1 ? 'tarea' : 'tareas'}, de la más antigua a la más reciente`}
              </span>
              {filter && (
                <button type="button" onClick={() => setFilter(null)} className={`text-xs font-bold cursor-pointer hover:underline ${t.positive}`}>
                  Ver todas
                </button>
              )}
            </div>

            {shown.length === 0 ? (
              <p className={`px-4 py-10 text-center text-sm ${t.muted}`}>No hay nada pendiente. Todo al día.</p>
            ) : (
              <table className="w-full text-left text-sm min-w-[760px]">
                <thead>
                  <tr className={`border-b font-mono text-[10px] uppercase tracking-wider ${t.rule} ${t.muted}`}>
                    <th className="px-4 py-2.5 font-bold w-[120px]">Pedido</th>
                    <th className="px-4 py-2.5 font-bold">Carta</th>
                    <th className="px-4 py-2.5 font-bold">Cliente</th>
                    <th className="px-4 py-2.5 font-bold">Detalle</th>
                    <th className="px-4 py-2.5 font-bold text-right w-[110px]">Espera</th>
                    <th className="w-8" aria-hidden="true" />
                  </tr>
                </thead>
                {shown.map((s) => (
                  <Group key={s.key} section={s} title={title(s.key)} onOpenOrder={onOpenOrder} onOpenQueue={onOpenQueue} />
                ))}
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const Group: React.FC<{
  section: TodaySection;
  title: string;
  onOpenOrder: (code: string) => void;
  onOpenQueue: (status: string) => void;
}> = ({ section, title, onOpenOrder, onOpenQueue }) => {
  const t = usePanelTheme();
  const status = SECTION_STATUS[section.key];
  const more = section.count - section.tasks.length;
  const urgent = URGENT.includes(section.key);

  return (
    <tbody>
      <tr className={`border-b ${t.rule} ${t.isLight ? 'bg-[#FAF8F3]' : 'bg-[#333333]'}`}>
        <th colSpan={6} scope="colgroup" className="px-4 py-2 text-left font-normal">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div className="flex items-baseline gap-2">
              {urgent && <span className={`w-1.5 h-1.5 rounded-full self-center ${t.isLight ? 'bg-red-600' : 'bg-red-400'}`} aria-hidden="true" />}
              <span className={`text-xs font-bold uppercase tracking-wide ${t.text}`}>{title}</span>
              <span className={`font-mono text-xs ${t.muted}`}>{section.count}</span>
              <span className={`hidden sm:inline text-[11px] ${t.muted}`}>· {COPY[section.key].hint}</span>
            </div>
            {status && (
              <button type="button" onClick={() => onOpenQueue(status)} className={`text-[11px] font-bold cursor-pointer hover:underline ${t.positive}`}>
                Abrir en Pedidos
              </button>
            )}
          </div>
        </th>
      </tr>
      {section.tasks.map((task) => (
        <tr
          key={`${task.orderCode}#${task.position ?? 0}`}
          onClick={() => onOpenOrder(task.orderCode)}
          className={`border-b ${t.rule} cursor-pointer ${t.isLight ? 'hover:bg-[#F6F2E9]' : 'hover:bg-[#444444]'}`}
        >
          <td className="px-4 py-2.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenOrder(task.orderCode); }}
              className={`font-mono font-bold whitespace-nowrap underline-offset-4 hover:underline cursor-pointer ${t.text}`}
            >
              {task.orderCode}
            </button>
          </td>
          <td className={`px-4 py-2.5 ${t.text}`}>
            {task.position !== undefined ? (
              <>
                <span className={`font-mono text-xs mr-1.5 ${t.muted}`}>#{String(task.position).padStart(2, '0')}</span>
                {task.cardName}
              </>
            ) : (
              <span className={t.muted}>Pedido completo</span>
            )}
          </td>
          <td className="px-4 py-2.5">
            <div className={`text-xs ${t.text}`}>{task.customerName ?? task.customerEmail}</div>
            {task.customerName && <div className={`font-mono text-[11px] ${t.muted}`}>{task.customerEmail}</div>}
          </td>
          <td className={`px-4 py-2.5 text-xs ${t.muted}`}>{task.note ?? '—'}</td>
          <td className={`px-4 py-2.5 text-xs text-right whitespace-nowrap ${t.muted}`}>{waiting(task.since)}</td>
          <td className="pr-3">
            <ChevronRight className={`w-4 h-4 ${t.muted}`} aria-hidden="true" />
          </td>
        </tr>
      ))}
      {more > 0 && (
        <tr className={`border-b ${t.rule}`}>
          <td colSpan={6} className={`px-4 py-2 text-[11px] ${t.muted}`}>
            Se muestran {section.tasks.length} de {section.count}.
          </td>
        </tr>
      )}
    </tbody>
  );
};
