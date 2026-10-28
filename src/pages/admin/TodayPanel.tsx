import React, { useCallback, useEffect, useState } from 'react';
import {
  Camera, CheckCircle2, ChevronRight, ClipboardList, FilePen, PackageCheck, PackageOpen, PauseCircle, RefreshCw,
  ShieldCheck, TriangleAlert, Truck, Undo2, type LucideIcon,
} from 'lucide-react';
import type { UserDto } from '../../../shared/auth';
import { SECTION_STATUS, type StaffToday, type TodaySection, type TodaySectionKey } from '../../../shared/staff-today';
import { adminErrorMessage, fetchStaffToday } from '../../api/admin';
import { usePanelTheme, waiting } from './ui';

const COPY: Record<TodaySectionKey, { icon: LucideIcon; title: string; hint: string }> = {
  late: { icon: TriangleAlert, title: 'Pedidos con retraso', hint: 'Han pasado la fecha prevista y siguen en el laboratorio.' },
  toReceive: { icon: PackageOpen, title: 'Paquetes por recibir', hint: 'Pedidos pagados cuyo paquete aún no se ha confirmado. Cuando llegue, ábrelo y confirma la recepción.' },
  photosMissing: { icon: Camera, title: 'Fotos por hacer', hint: 'Cartas en el laboratorio sin la foto del anverso o del reverso.' },
  returnedByQa: { icon: Undo2, title: 'Devueltas por calidad', hint: 'Control de calidad las ha rechazado: corrígelas y vuelve a enviarlas.' },
  toGrade: { icon: ClipboardList, title: 'Por calificar', hint: 'Cartas en el laboratorio que todavía no tienen resultado.' },
  myDrafts: { icon: FilePen, title: 'Mis borradores', hint: 'Resultados guardados que aún no se han enviado a control de calidad.' },
  toReview: { icon: ShieldCheck, title: 'Por revisar', hint: 'Resultados enviados por los calificadores, esperando aprobación.' },
  readyToShip: { icon: PackageCheck, title: 'Listos para aprobar la salida', hint: 'Todas sus cartas están aprobadas. Revisa el pedido y aprueba el envío.' },
  toDeliver: { icon: Truck, title: 'Enviados, sin confirmar la entrega', hint: 'Confirma la entrega cuando el transportista la marque como entregada.' },
  onHold: { icon: PauseCircle, title: 'En pausa', hint: 'Pedidos detenidos. Resuelve el motivo y reanúdalos.' },
};

/** Saludo según la hora de Madrid. */
function greeting(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: 'numeric', hourCycle: 'h23' }).format(now));
  return hour < 6 ? 'Buenas noches' : hour < 14 ? 'Buenos días' : hour < 21 ? 'Buenas tardes' : 'Buenas noches';
}

/**
 * Pantalla de inicio del laboratorio: lo que tiene pendiente quien entra, según su rol.
 * Cada tarea abre el pedido; las secciones de pedidos enteros enlazan a la lista ya filtrada.
 */
export const TodayPanel: React.FC<{
  user: UserDto;
  onOpenOrder: (code: string) => void;
  onOpenQueue: (status: string) => void;
}> = ({ user, onOpenOrder, onOpenQueue }) => {
  const t = usePanelTheme();
  const [data, setData] = useState<StaffToday | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchStaffToday()
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((err) => setError(adminErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const pending = data?.sections.reduce((sum, s) => sum + s.count, 0) ?? 0;
  const firstName = user.fullName?.split(' ')[0];

  return (
    <div className="space-y-5" aria-busy={loading}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={`font-['Nunito',sans-serif] text-xl font-[900] ${t.text}`}>
            {greeting()}{firstName ? `, ${firstName}` : ''}.
          </h2>
          <p className={`text-sm ${t.muted}`}>
            {!data
              ? 'Cargando lo que tienes pendiente…'
              : pending === 0
                ? 'No tienes nada pendiente. Todo al día.'
                : `Tienes ${pending} ${pending === 1 ? 'tarea pendiente' : 'tareas pendientes'}. Lo que más tiempo lleva esperando aparece primero.`}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {data.sections.map((section) => (
            <SectionCard
              key={section.key}
              section={section}
              title={section.key === 'myDrafts' && user.role === 'admin' ? 'Borradores sin terminar' : COPY[section.key].title}
              onOpenOrder={onOpenOrder}
              onOpenQueue={onOpenQueue}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SectionCard: React.FC<{
  section: TodaySection;
  title: string;
  onOpenOrder: (code: string) => void;
  onOpenQueue: (status: string) => void;
}> = ({ section, title, onOpenOrder, onOpenQueue }) => {
  const t = usePanelTheme();
  const { icon: Icon, hint } = COPY[section.key];
  const status = SECTION_STATUS[section.key];
  const empty = section.count === 0;
  const urgent = section.key === 'late' || section.key === 'returnedByQa';
  const countColor = empty ? t.muted : urgent ? t.negative : t.text;
  const more = section.count - section.tasks.length;

  return (
    <section className={`border rounded-xl p-5 flex flex-col ${t.card}`} aria-label={title}>
      <header className="flex items-start gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${empty ? t.muted : urgent ? t.negative : t.positive}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h3 className={`font-['Nunito',sans-serif] text-sm font-[900] uppercase ${t.text}`}>{title}</h3>
          <p className={`text-xs mt-0.5 ${t.muted}`}>{hint}</p>
        </div>
        <div className={`font-['Nunito',sans-serif] text-3xl font-[900] leading-none tabular-nums ${countColor}`}>{section.count}</div>
      </header>

      {empty ? (
        <p className={`flex items-center gap-2 text-xs mt-4 ${t.muted}`}>
          <CheckCircle2 className={`w-4 h-4 ${t.positive}`} aria-hidden="true" />
          Nada pendiente.
        </p>
      ) : (
        <ul className={`mt-4 border-t ${t.rule}`}>
          {section.tasks.map((task) => (
            <li key={`${task.orderCode}#${task.position ?? 0}`} className={`border-b last:border-b-0 ${t.rule}`}>
              <button
                type="button"
                onClick={() => onOpenOrder(task.orderCode)}
                className={`w-full flex items-center gap-3 py-2.5 px-1 text-left cursor-pointer rounded ${t.ghostHover}`}
              >
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${t.text}`}>
                    <span className="font-mono font-bold">{task.orderCode}</span>
                    {task.position !== undefined && (
                      <span> · #{String(task.position).padStart(2, '0')} {task.cardName}</span>
                    )}
                  </div>
                  <div className={`text-[11px] truncate ${t.muted}`}>
                    {task.customerName ?? task.customerEmail}
                    {task.note && <> · {task.note}</>}
                  </div>
                </div>
                <span className={`text-[11px] whitespace-nowrap ${t.muted}`}>{waiting(task.since)}</span>
                <ChevronRight className={`w-4 h-4 shrink-0 ${t.muted}`} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!empty && (more > 0 || status) && (
        <div className={`flex items-center justify-between gap-3 mt-3 text-xs ${t.muted}`}>
          <span>{more > 0 ? `y ${more} más` : ''}</span>
          {status && (
            <button type="button" onClick={() => onOpenQueue(status)} className={`font-bold cursor-pointer hover:underline ${t.positive}`}>
              Ver en la lista de pedidos
            </button>
          )}
        </div>
      )}
    </section>
  );
};
