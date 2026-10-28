import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { EVENT_COUNTRIES, formatEventWhen, type AdminEventDto, type EventBody, type EventKind } from '../../../shared/events';
import { adminErrorMessage, createAdminEvent, deleteAdminEvent, fetchAdminEvents, updateAdminEvent } from '../../api/admin';
import { usePanelTheme } from './ui';

const KIND_TEXT: Record<EventKind, string> = { fair: 'Evento o feria', hub: 'Punto de entrega' };
const COUNTRY_TEXT: Record<string, string> = { ES: 'España', PT: 'Portugal', FR: 'Francia' };
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Fecha AAAA-MM-DD y hora HH:MM en Madrid de un instante. */
const madridParts = (iso: string) => {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(d);
  const time = d.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return { date, time };
};
const localKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

type Form = {
  kind: EventKind;
  name: string;
  city: string;
  countryCode: string;
  venue: string;
  address: string;
  details: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  published: boolean;
  acceptsSubmissions: boolean;
};

const emptyForm = (date: string): Form => ({
  kind: 'fair', name: '', city: '', countryCode: 'ES', venue: '', address: '', details: '',
  startDate: date, startTime: '10:00', endDate: date, endTime: '19:00', published: true, acceptsSubmissions: true,
});

const formFrom = (e: AdminEventDto): Form => {
  const start = madridParts(e.startsAt);
  const end = madridParts(e.endsAt);
  return {
    kind: e.kind, name: e.name, city: e.city, countryCode: e.countryCode, venue: e.venue ?? '', address: e.address ?? '', details: e.details ?? '',
    startDate: start.date, startTime: start.time, endDate: end.date, endTime: end.time, published: e.published, acceptsSubmissions: e.acceptsSubmissions,
  };
};

/**
 * Calendario de eventos con entrega en mano. Lo que se publica aquí aparece al cliente al elegir
 * "entrega en mano en un evento" antes de pagar. Solo para la dirección.
 */
export const EventsCalendar: React.FC = () => {
  const t = usePanelTheme();
  const [events, setEvents] = useState<AdminEventDto[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);

  const load = useCallback(() => {
    fetchAdminEvents()
      .then((list) => {
        setEvents(list);
        setError('');
      })
      .catch((err) => setError(adminErrorMessage(err)));
  }, []);
  useEffect(load, [load]);

  const byDay = useMemo(() => {
    const map = new Map<string, AdminEventDto[]>();
    for (const e of events ?? []) {
      // Un evento de varios días aparece en cada uno.
      const start = new Date(`${madridParts(e.startsAt).date}T12:00:00`);
      const end = new Date(`${madridParts(e.endsAt).date}T12:00:00`);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = localKey(d);
        map.set(key, [...(map.get(key) ?? []), e]);
      }
    }
    return map;
  }, [events]);

  const now = Date.now();
  const upcoming = (events ?? []).filter((e) => new Date(e.endsAt).getTime() > now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = (events ?? []).filter((e) => new Date(e.endsAt).getTime() <= now);

  // Celdas del mes, empezando en lunes.
  const first = new Date(month);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const todayKey = localKey(new Date());

  const remove = async (e: AdminEventDto) => {
    if (!window.confirm(`¿Borrar "${e.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteAdminEvent(e.id);
      setNotice('Evento borrado.');
      load();
    } catch (err) {
      setError(adminErrorMessage(err));
    }
  };

  const chip = (e: AdminEventDto) => (
    <button
      key={e.id}
      type="button"
      onClick={() => setEditing({ id: e.id, form: formFrom(e) })}
      title={e.name}
      className={`block w-full truncate text-left text-[10px] font-bold px-1.5 py-0.5 rounded text-white cursor-pointer ${
        e.published ? 'bg-[#2D9A46] hover:bg-[#23803A]' : 'bg-[#8A9388] hover:bg-[#6B7268]'
      }`}
    >
      {e.name}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={`font-['Nunito',sans-serif] text-lg font-[900] ${t.text}`}>Calendario de eventos</h2>
          <p className={`text-xs ${t.muted}`}>Los eventos publicados que aceptan entregas aparecen al cliente al elegir "entrega en mano" antes de pagar.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ id: null, form: emptyForm(localKey(new Date())) })}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer ${t.primary}`}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nuevo evento
        </button>
      </div>

      {error && <p role="alert" className={`text-sm ${t.negative}`}>{error}</p>}
      {notice && <p role="status" className={`text-sm ${t.positive}`}>{notice}</p>}

      {/* Mes */}
      <section className={`border rounded-2xl overflow-hidden ${t.card}`} aria-label="Calendario">
        <header className={`flex items-center justify-between px-5 py-3 border-b ${t.rule}`}>
          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className={`p-2 rounded-lg cursor-pointer ${t.ghostHover} ${t.text}`} aria-label="Mes anterior">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <h3 className={`font-['Nunito',sans-serif] text-base font-[900] capitalize ${t.text}`}>
              {month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
              }}
              className={`text-[11px] font-bold px-2 py-1 border rounded cursor-pointer ${t.secondary}`}
            >
              Hoy
            </button>
          </div>
          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className={`p-2 rounded-lg cursor-pointer ${t.ghostHover} ${t.text}`} aria-label="Mes siguiente">
            <ChevronRight className="w-4 h-4" />
          </button>
        </header>
        <div className={`grid grid-cols-7 text-center font-mono text-[10px] uppercase tracking-wider py-2 border-b ${t.rule} ${t.muted}`}>
          {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (!d) return <div key={i} className={`min-h-[84px] border-b border-r ${t.rule} ${t.isLight ? 'bg-[#FAF8F3]' : 'bg-[#333333]'}`} />;
            const key = localKey(d);
            const list = byDay.get(key) ?? [];
            const isToday = key === todayKey;
            return (
              <div
                key={i}
                onClick={(ev) => {
                  if ((ev.target as HTMLElement).closest('button')) return;
                  setEditing({ id: null, form: emptyForm(key) });
                }}
                className={`min-h-[84px] p-1.5 border-b border-r space-y-1 cursor-pointer transition-colors ${t.rule} ${t.isLight ? 'hover:bg-[#F7F4EC]' : 'hover:bg-[#404040]'}`}
                title="Pulsa para crear un evento este día"
              >
                <div
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-[#2D9A46] text-white' : t.text
                  }`}
                >
                  {d.getDate()}
                </div>
                {list.slice(0, 2).map(chip)}
                {list.length > 2 && <div className={`text-[10px] ${t.muted}`}>+{list.length - 2} más</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Listas */}
      <EventList title="Próximos" empty="No hay eventos próximos. Pulsa un día del calendario o «Nuevo evento» para crear uno." events={events === null ? null : upcoming} onEdit={(e) => setEditing({ id: e.id, form: formFrom(e) })} onDelete={remove} />
      {past.length > 0 && <EventList title="Pasados" empty="" events={past} onEdit={(e) => setEditing({ id: e.id, form: formFrom(e) })} onDelete={remove} />}

      {editing && (
        <EventForm
          initial={editing.form}
          isNew={editing.id === null}
          onCancel={() => setEditing(null)}
          onSave={async (body) => {
            if (editing.id) await updateAdminEvent(editing.id, body);
            else await createAdminEvent(body);
            setEditing(null);
            setNotice(editing.id ? 'Evento actualizado.' : 'Evento creado. Ya lo ven los clientes al elegir la entrega en mano.');
            load();
          }}
        />
      )}
    </div>
  );
};

const EventList: React.FC<{
  title: string;
  empty: string;
  events: AdminEventDto[] | null;
  onEdit: (e: AdminEventDto) => void;
  onDelete: (e: AdminEventDto) => void;
}> = ({ title, empty, events, onEdit, onDelete }) => {
  const t = usePanelTheme();
  return (
    <section className={`border rounded-2xl ${t.card}`} aria-label={title}>
      <h3 className={`px-5 py-3 border-b font-['Nunito',sans-serif] text-sm font-[900] uppercase ${t.rule} ${t.text}`}>
        {title} {events && <span className={`font-mono text-xs ${t.muted}`}>{events.length}</span>}
      </h3>
      {events === null && <p className={`px-5 py-6 text-sm ${t.muted}`}>Cargando…</p>}
      {events && events.length === 0 && <p className={`px-5 py-6 text-sm ${t.muted}`}>{empty}</p>}
      <ul>
        {events?.map((e) => {
          const start = new Date(e.startsAt);
          return (
            <li key={e.id} className={`flex flex-wrap items-center gap-4 px-5 py-4 border-b last:border-b-0 ${t.rule}`}>
              <span className={`w-14 shrink-0 rounded-lg overflow-hidden text-center border ${t.rule}`}>
                <span className={`block text-[10px] font-bold uppercase py-0.5 text-white ${e.published ? 'bg-[#2D9A46]' : 'bg-[#8A9388]'}`}>
                  {start.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', month: 'short' }).replace('.', '')}
                </span>
                <span className={`block font-['Nunito',sans-serif] text-xl font-[900] py-1 ${t.text}`}>
                  {start.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric' })}
                </span>
              </span>
              <div className="flex-1 min-w-[220px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-bold ${t.text}`}>{e.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${e.published ? 'bg-[#2D9A46]' : 'bg-[#8A9388]'}`}>
                    {e.published ? 'Publicado' : 'Borrador'}
                  </span>
                  {!e.acceptsSubmissions && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-[#D97706]">Sin entregas</span>}
                  <span className={`text-[11px] ${t.muted}`}>{KIND_TEXT[e.kind]}</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs mt-1 first-letter:uppercase ${t.muted}`}>
                  <CalendarDays className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="first-letter:uppercase">{formatEventWhen(e.startsAt, e.endsAt)}</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${t.muted}`}>
                  <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {[e.venue, e.address, e.city, COUNTRY_TEXT[e.countryCode] ?? e.countryCode].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className={`text-xs text-right ${t.muted}`}>
                <div className={`font-['Nunito',sans-serif] text-lg font-[900] ${t.text}`}>{e.orderCount}</div>
                {e.orderCount === 1 ? 'pedido' : 'pedidos'}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onEdit(e)} className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-bold cursor-pointer ${t.secondary}`}>
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Editar
                </button>
                {e.orderCount === 0 && (
                  <button type="button" onClick={() => onDelete(e)} aria-label={`Borrar ${e.name}`} className={`p-2 border rounded-lg cursor-pointer ${t.secondary}`}>
                    <Trash2 className={`w-3.5 h-3.5 ${t.negative}`} aria-hidden="true" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const EventForm: React.FC<{
  initial: Form;
  isNew: boolean;
  onCancel: () => void;
  onSave: (body: EventBody) => Promise<void>;
}> = ({ initial, isNew, onCancel, onSave }) => {
  const t = usePanelTheme();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const field = `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none ${t.input}`;
  const label = `block text-xs font-bold mb-1 ${t.text}`;
  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // La hora se escribe en hora de España (la del navegador de la dirección).
    const startsAt = new Date(`${form.startDate}T${form.startTime}`);
    const endsAt = new Date(`${form.endDate}T${form.endTime}`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return setError('Revisa las fechas y las horas.');
    if (endsAt <= startsAt) return setError('El evento tiene que terminar después de empezar.');
    setBusy(true);
    setError('');
    try {
      await onSave({
        kind: form.kind,
        name: form.name.trim(),
        city: form.city.trim(),
        countryCode: form.countryCode as EventBody['countryCode'],
        venue: form.venue.trim() || undefined,
        address: form.address.trim() || undefined,
        details: form.details.trim() || undefined,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        published: form.published,
        acceptsSubmissions: form.acceptsSubmissions,
      });
    } catch (err) {
      setError(adminErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true" aria-label={isNew ? 'Nuevo evento' : 'Editar evento'}>
      <form onSubmit={submit} className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto border rounded-2xl ${t.card}`}>
        <header className={`flex items-center justify-between px-6 py-4 border-b ${t.rule}`}>
          <h3 className={`font-['Nunito',sans-serif] text-lg font-[900] ${t.text}`}>{isNew ? 'Nuevo evento' : 'Editar evento'}</h3>
          <button type="button" onClick={onCancel} aria-label="Cerrar" className={`p-1.5 rounded-lg cursor-pointer ${t.ghostHover} ${t.text}`}>
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 py-5">
          <label className="block sm:col-span-2">
            <span className={label}>Nombre *</span>
            <input value={form.name} onChange={set('name')} required maxLength={120} placeholder="Ej. Salón del Cómic de Madrid" className={field} />
          </label>
          <label className="block">
            <span className={label}>Tipo</span>
            <select value={form.kind} onChange={set('kind')} className={field}>
              {Object.entries(KIND_TEXT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={label}>País</span>
            <select value={form.countryCode} onChange={set('countryCode')} className={field}>
              {EVENT_COUNTRIES.map((c) => <option key={c} value={c}>{COUNTRY_TEXT[c]}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={label}>Ciudad *</span>
            <input value={form.city} onChange={set('city')} required maxLength={80} placeholder="Ej. Madrid" className={field} />
          </label>
          <label className="block">
            <span className={label}>Recinto</span>
            <input value={form.venue} onChange={set('venue')} maxLength={120} placeholder="Ej. IFEMA, pabellón 3" className={field} />
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Dirección</span>
            <input value={form.address} onChange={set('address')} maxLength={200} placeholder="Calle y número" className={field} />
          </label>
          <label className="block">
            <span className={label}>Empieza *</span>
            <div className="flex gap-2">
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate < e.target.value ? e.target.value : form.endDate })} required className={field} />
              <input type="time" value={form.startTime} onChange={set('startTime')} required className={`${field} max-w-[120px]`} />
            </div>
          </label>
          <label className="block">
            <span className={label}>Termina *</span>
            <div className="flex gap-2">
              <input type="date" value={form.endDate} min={form.startDate} onChange={set('endDate')} required className={field} />
              <input type="time" value={form.endTime} onChange={set('endTime')} required className={`${field} max-w-[120px]`} />
            </div>
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Indicaciones para el cliente</span>
            <textarea value={form.details} onChange={set('details')} maxLength={500} rows={2} placeholder="Ej. Stand 14 · entregas de 10:00 a 19:00" className={field} />
          </label>
          <label className={`flex items-center gap-2 text-sm ${t.text}`}>
            <input type="checkbox" checked={form.published} onChange={set('published')} className="accent-[#16A34A] w-4 h-4" />
            Publicado (lo ven los clientes)
          </label>
          <label className={`flex items-center gap-2 text-sm ${t.text}`}>
            <input type="checkbox" checked={form.acceptsSubmissions} onChange={set('acceptsSubmissions')} className="accent-[#16A34A] w-4 h-4" />
            Acepta entregas de cartas
          </label>
        </div>
        {error && <p role="alert" className={`px-6 text-sm ${t.negative}`}>{error}</p>}
        <footer className={`flex justify-end gap-2 px-6 py-4 border-t ${t.rule}`}>
          <button type="button" onClick={onCancel} className={`px-4 py-2.5 text-xs font-bold cursor-pointer ${t.muted} hover:underline`}>Cancelar</button>
          <button type="submit" disabled={busy} className={`px-5 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer disabled:opacity-50 ${t.primary}`}>
            {busy ? 'Guardando…' : isNew ? 'Crear evento' : 'Guardar cambios'}
          </button>
        </footer>
      </form>
    </div>
  );
};
