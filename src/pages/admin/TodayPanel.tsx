import React, { useCallback, useEffect, useState } from 'react';
import {
  Camera, Check, ChevronRight, ScanLine, ClipboardList, FilePen, PackageCheck, PackageOpen, PauseCircle, RefreshCw,
  ShieldCheck, TriangleAlert, Truck, Undo2, type LucideIcon,
} from 'lucide-react';
import type { UserDto } from '../../../shared/auth';
import { SECTION_STATUS, type StaffToday, type TodaySection, type TodaySectionKey, type TodayTask } from '../../../shared/staff-today';
import { adminErrorMessage, fetchStaffToday } from '../../api/admin';
import { usePanelTheme, waiting } from './ui';

/** Cada tipo de tarea tiene su color e icono, iguales en el resumen y en la lista. */
const KIND: Record<TodaySectionKey, { title: string; hint: string; icon: LucideIcon; color: string }> = {
  late: { title: 'Con retraso', hint: 'Han pasado la fecha prevista y siguen en el laboratorio.', icon: TriangleAlert, color: '#DC2626' },
  returnedByQa: { title: 'Devueltas por calidad', hint: 'Rechazadas en control de calidad: corrígelas y vuelve a enviarlas.', icon: Undo2, color: '#EA580C' },
  toIdentify: { title: 'Por identificar', hint: 'Cartas recibidas sin nombre: apunta qué carta es cada una.', icon: ScanLine, color: '#DB2777' },
  toReceive: { title: 'Por recibir', hint: 'Pedidos pagados cuyo paquete aún no se ha confirmado.', icon: PackageOpen, color: '#0284C7' },
  photosMissing: { title: 'Fotos por hacer', hint: 'Cartas sin la foto del anverso o del reverso.', icon: Camera, color: '#7C3AED' },
  toGrade: { title: 'Por calificar', hint: 'Cartas en el laboratorio que todavía no tienen resultado.', icon: ClipboardList, color: '#16A34A' },
  myDrafts: { title: 'Mis borradores', hint: 'Resultados guardados sin enviar a control de calidad.', icon: FilePen, color: '#64748B' },
  toReview: { title: 'Por revisar', hint: 'Resultados enviados por los calificadores, pendientes de aprobación.', icon: ShieldCheck, color: '#4F46E5' },
  readyToShip: { title: 'Listos para salir', hint: 'Todas sus cartas están aprobadas: falta aprobar el envío.', icon: PackageCheck, color: '#0D9488' },
  toDeliver: { title: 'Entrega sin confirmar', hint: 'Enviados, pendientes de confirmar la entrega.', icon: Truck, color: '#0891B2' },
  onHold: { title: 'En pausa', hint: 'Pedidos detenidos que hay que resolver y reanudar.', icon: PauseCircle, color: '#D97706' },
};
const URGENT: TodaySectionKey[] = ['late', 'returnedByQa'];

const ROLE_LABEL: Record<string, string> = {
  staff: 'Recepción y logística',
  grader: 'Calificación',
  qa: 'Control de calidad',
  admin: 'Dirección',
};

const AVATAR = ['#0F766E', '#1D4ED8', '#7C3AED', '#B45309', '#BE185D', '#15803D', '#0369A1', '#9333EA'];
const avatarColor = (seed: string) => AVATAR[[...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % AVATAR.length];
const initials = (task: TodayTask) => {
  const source = task.customerName?.trim() || task.customerEmail;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
};

const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

function greeting() {
  const hour = Number(new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  return hour >= 6 && hour < 14 ? 'Buenos días' : hour >= 14 && hour < 21 ? 'Buenas tardes' : 'Buenas noches';
}
const todayLabel = () => {
  const s = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const timeLabel = (d: Date) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

/**
 * Pantalla de inicio del laboratorio: una cabecera con el día de quien entra, un resumen por tipo
 * de tarea (cada uno con su color) y la lista de trabajo agrupada. Cada tarea abre su pedido.
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

  const title = (key: TodaySectionKey) => (key === 'myDrafts' && user.role === 'admin' ? 'Borradores' : KIND[key].title);
  const sections = data?.sections ?? [];
  const pending = sections.reduce((sum, s) => sum + s.count, 0);
  const urgent = sections.filter((s) => URGENT.includes(s.key)).reduce((sum, s) => sum + s.count, 0);
  const shown = sections.filter((s) => s.count > 0 && (!filter || s.key === filter));
  const firstName = user.fullName?.trim().split(/\s+/)[0];
  const cols = sections.length > 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : sections.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2';

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Cabecera del día */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B2414] via-[#123D22] to-[#17733A] text-white shadow-lg">
        <svg className="absolute -right-16 -top-24 w-[420px] h-[420px] pointer-events-none" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeOpacity="0.07" strokeWidth="0.6" />
          <circle cx="50" cy="50" r="36" fill="none" stroke="white" strokeOpacity="0.07" strokeWidth="0.6" />
          <circle cx="50" cy="50" r="24" fill="none" stroke="white" strokeOpacity="0.07" strokeWidth="0.6" />
        </svg>
        <div className="relative p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#A7E3B5]">
                <span>{todayLabel()}</span>
                <span className="w-1 h-1 rounded-full bg-[#A7E3B5]" aria-hidden="true" />
                <span>{ROLE_LABEL[user.role] ?? user.role}</span>
              </div>
              <h2 className="font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] leading-tight">
                {greeting()}{firstName ? `, ${firstName}` : ''}
              </h2>
              <p className="text-sm text-[#D5EEDB] max-w-md">
                {!data
                  ? 'Preparando tu día…'
                  : pending === 0
                    ? 'No tienes nada pendiente. Todo al día, buen trabajo.'
                    : urgent > 0
                      ? `Empieza por ${urgent === 1 ? 'la tarea marcada en rojo' : `las ${urgent} tareas marcadas en rojo`}; después, lo que más tiempo lleva esperando.`
                      : 'Lo que más tiempo lleva esperando aparece primero.'}
              </p>
            </div>
            <div className="text-right">
              <div className="font-['Nunito',sans-serif] text-5xl sm:text-6xl font-[900] leading-none tabular-nums">{data ? pending : '–'}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#A7E3B5] mt-1">
                {pending === 1 ? 'tarea pendiente' : 'tareas pendientes'}
              </div>
              {urgent > 0 && (
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-[#DC2626] text-white text-[11px] font-bold">
                  <TriangleAlert className="w-3 h-3" aria-hidden="true" />
                  {urgent} {urgent === 1 ? 'urgente' : 'urgentes'}
                </div>
              )}
            </div>
          </div>

          {/* Reparto de las tareas por tipo */}
          {pending > 0 && (
            <div className="flex h-2 gap-[3px] rounded-full overflow-hidden bg-[#0B2414]" role="img" aria-label="Reparto de las tareas por tipo">
              {sections.filter((s) => s.count > 0).map((s) => (
                <span key={s.key} title={`${title(s.key)}: ${s.count}`} style={{ flexGrow: s.count, background: KIND[s.key].color }} />
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#D5EEDB]">
            <span>{updatedAt ? `Actualizado a las ${timeLabel(updatedAt)}` : ' '}</span>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white text-[#123D22] font-bold cursor-pointer hover:bg-[#E8F6EC] disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Actualizar
            </button>
          </div>
        </div>
      </section>

      {error && <p role="alert" className={`text-sm ${t.negative}`}>{error}</p>}

      {data && (
        <>
          {/* Resumen por tipo: pulsar uno filtra la lista */}
          <div className={`grid ${cols} gap-3`} role="group" aria-label="Resumen de tareas">
            {sections.map((s) => {
              const kind = KIND[s.key];
              const Icon = kind.icon;
              const selected = filter === s.key;
              const empty = s.count === 0;
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={selected}
                  disabled={empty}
                  onClick={() => setFilter(selected ? null : s.key)}
                  style={selected ? { borderColor: kind.color, boxShadow: `0 0 0 1px ${kind.color}` } : undefined}
                  className={`group relative text-left border rounded-xl p-4 overflow-hidden transition-all cursor-pointer disabled:cursor-default ${t.card} ${
                    empty ? '' : 'hover:-translate-y-0.5 hover:shadow-md'
                  }`}
                >
                  <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: empty ? 'transparent' : kind.color }} aria-hidden="true" />
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ background: empty ? (t.isLight ? '#D6D3D1' : '#57534E') : kind.color }}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className={`font-['Nunito',sans-serif] text-3xl font-[900] leading-none tabular-nums ${empty ? t.muted : t.text}`}>
                      {s.count}
                    </span>
                  </div>
                  <div className={`mt-3 text-xs font-bold ${t.text}`}>{title(s.key)}</div>
                  <div className={`text-[11px] mt-0.5 truncate ${t.muted}`}>
                    {empty ? 'Al día' : `La más antigua, ${waiting(s.tasks[0].since)}`}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Lista de trabajo */}
          {pending === 0 ? (
            <div className={`border rounded-2xl px-6 py-14 text-center ${t.card}`}>
              <span className="mx-auto w-14 h-14 rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-md">
                <Check className="w-7 h-7" strokeWidth={3} aria-hidden="true" />
              </span>
              <h3 className={`mt-4 font-['Nunito',sans-serif] text-lg font-[900] ${t.text}`}>Todo al día</h3>
              <p className={`text-sm mt-1 ${t.muted}`}>No queda ninguna tarea pendiente. Cuando llegue algo nuevo aparecerá aquí.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filter && (
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${t.muted}`}>Mostrando solo <strong className={t.text}>{title(filter)}</strong></span>
                  <button type="button" onClick={() => setFilter(null)} className={`text-xs font-bold cursor-pointer hover:underline ${t.positive}`}>
                    Ver todas las tareas
                  </button>
                </div>
              )}
              {shown.map((s) => (
                <Group key={s.key} section={s} title={title(s.key)} onOpenOrder={onOpenOrder} onOpenQueue={onOpenQueue} />
              ))}
            </div>
          )}
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
  const kind = KIND[section.key];
  const Icon = kind.icon;
  const status = SECTION_STATUS[section.key];
  const more = section.count - section.tasks.length;

  return (
    <section className={`border rounded-2xl overflow-hidden ${t.card}`} aria-label={title}>
      <header className={`flex flex-wrap items-center gap-3 px-5 py-4 border-b ${t.rule}`}>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: kind.color }}>
          <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-['Nunito',sans-serif] text-base font-[900] ${t.text}`}>{title}</h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white tabular-nums" style={{ background: kind.color }}>
              {section.count}
            </span>
          </div>
          <p className={`text-xs ${t.muted}`}>{kind.hint}</p>
        </div>
        {status && (
          <button
            type="button"
            onClick={() => onOpenQueue(status)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-bold cursor-pointer ${t.secondary}`}
          >
            Abrir en Pedidos
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </header>

      <ul>
        {section.tasks.map((task) => {
          const days = daysSince(task.since);
          const waitColor = section.key === 'late' || days >= 5 ? '#DC2626' : days >= 2 ? '#D97706' : '#16A34A';
          return (
            <li key={`${task.orderCode}#${task.position ?? 0}`} className={`border-b last:border-b-0 ${t.rule}`}>
              <button
                type="button"
                onClick={() => onOpenOrder(task.orderCode)}
                className={`group w-full flex items-center gap-4 px-5 py-3.5 text-left cursor-pointer transition-colors ${t.isLight ? 'hover:bg-[#F7F4EC]' : 'hover:bg-[#404040]'}`}
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: avatarColor(task.customerEmail) }}
                  aria-hidden="true"
                >
                  {initials(task)}
                </span>

                <div className="flex-1 min-w-0 grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-x-6 gap-y-0.5 items-center">
                  <div className="min-w-0">
                    <div className={`text-sm font-bold truncate ${t.text}`}>
                      {task.position !== undefined ? task.cardName ?? 'Carta sin identificar' : `Pedido ${task.orderCode}`}
                    </div>
                    <div className={`font-mono text-[11px] truncate ${t.muted}`}>
                      {task.position !== undefined ? `${task.orderCode} · carta #${String(task.position).padStart(2, '0')}` : 'Pedido completo'}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs truncate ${t.text}`}>{task.customerName ?? task.customerEmail}</div>
                    {task.customerName && <div className={`text-[11px] truncate ${t.muted}`}>{task.customerEmail}</div>}
                  </div>
                  <div className={`text-xs min-w-0 truncate ${t.muted}`}>{task.note ?? ''}</div>
                </div>

                <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs whitespace-nowrap ${t.muted}`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: waitColor }} aria-hidden="true" />
                  {waiting(task.since)}
                </span>
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${t.muted}`} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      {more > 0 && (
        <div className={`px-5 py-2.5 text-[11px] border-t ${t.rule} ${t.muted}`}>
          Se muestran {section.tasks.length} de {section.count}, las que más tiempo llevan esperando.
        </div>
      )}
    </section>
  );
};
