import React, { useEffect, useRef, useState } from 'react';
import '@fontsource-variable/archivo/wght.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import { CalendarDays, ChevronDown, ExternalLink, Inbox, LineChart, LogOut, Menu, Package, Search, Users, X, type LucideIcon } from 'lucide-react';
import { STAFF_ROLES } from '../../shared/admin';
import { useAuth } from '../context/AuthContext';
import { fetchAdminOrders, fetchStaffToday } from '../api/admin';
import { ACTIVE_STATUSES, type OrderStatus } from '../../shared/domain';
import { BusinessDashboard, CertificateHistorySection } from './admin/BusinessDashboard';
import { OrderDetail } from './admin/OrderDetail';
import { OrderQueue, QUEUE_STATUSES, queueFilterName } from './admin/OrderQueue';
import { TodayPanel } from './admin/TodayPanel';
import { EventsCalendar } from './admin/EventsCalendar';
import { TeamPanel } from './admin/TeamPanel';

const ROLE_LABEL: Record<string, string> = {
  staff: 'Recepción y logística',
  grader: 'Graduador',
  qa: 'Control de calidad',
  admin: 'Dirección',
};

export const DASHBOARD_PATH = '/admin/dashboard';
export const QUEUE_PATH = '/admin/orders';
export const EVENTS_PATH = '/admin/events';
export const TEAM_PATH = '/admin/team';
export const HISTORY_PATH = '/admin/history';

/** Última pantalla de lista visitada, para que "Volver" desde un pedido regrese a ella. */
let lastListPath = '/admin';

interface AdminPageProps {
  /** Ruta actual: /admin (hoy), /admin/orders (lista), /admin/dashboard (negocio) o /admin/orders/284719365 (detalle). */
  path: string;
  /** Lo que va tras «?» en la dirección (los filtros de Pedidos). */
  search?: string;
  onNavigate: (path: string) => void;
}

/** El escudo de Gorilla, sin animación, para el carril del panel. */
const Shield: React.FC = () => (
  <svg viewBox="8 8 68 76" className="w-[22px] h-[26px] shrink-0" aria-hidden="true">
    <path d="M8 16A8 8 0 0 1 16 8h52a8 8 0 0 1 8 8v34c0 16-16 28-34 34C24 78 8 66 8 50Z" fill="#2F8F3E" />
    <g transform="translate(42,44)">
      <path d="M13 -9 A15.5 15.5 0 1 0 15.5 3 H2" fill="none" stroke="#FFFFFF" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

/**
 * El nombre de quien usa el panel. Se pulsa para cambiarlo: así cada persona del laboratorio aparece con su nombre
 * (en el panel, en el historial de cada pedido y en las aprobaciones).
 */
const NameEditor: React.FC<{ name: string | null; email: string }> = ({ name, email }) => {
  const { updateName } = useAuth();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setValue(name ?? ''); setEditing(true); }}
        title="Cambiar mi nombre"
        className="block max-w-full text-left text-[13px] font-semibold text-[#0F1110] truncate cursor-pointer hover:underline underline-offset-4 decoration-[#C9CBC7]"
      >
        {name ?? 'Pon tu nombre'}
      </button>
    );
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!value.trim()) return;
        setBusy(true);
        setError('');
        try {
          await updateName(value.trim());
          setEditing(false);
        } catch {
          setError('No se pudo guardar.');
        } finally {
          setBusy(false);
        }
      }}
      className="space-y-1"
    >
      <label className="sr-only" htmlFor="my-name">Tu nombre</label>
      <input
        id="my-name"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
        maxLength={80}
        placeholder={email}
        className="w-full h-7 px-2 rounded-[6px] border border-[#0F1110] text-[13px] focus:outline-none"
      />
      <div className="flex items-center gap-2 text-[12px]">
        <button type="submit" disabled={busy || !value.trim()} className="font-semibold text-[#0F1110] hover:underline cursor-pointer disabled:opacity-50">
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-[#666A67] hover:underline cursor-pointer">Cancelar</button>
        {error && <span className="text-[#C2362B]">{error}</span>}
      </div>
    </form>
  );
};

type Section = 'today' | 'queue' | 'events' | 'team' | 'dashboard' | 'history' | 'detail';

const TITLE: Record<Section, string> = {
  today: 'Hoy', queue: 'Pedidos', events: 'Eventos', team: 'Equipo', dashboard: 'Negocio', history: 'Historial de certificados', detail: 'Pedido',
};

/**
 * Panel del laboratorio: una herramienta propia a pantalla completa, con carril lateral y barra de búsqueda.
 * Solo para cuentas con un rol del personal; el servidor lo vuelve a comprobar en cada llamada.
 */
export const AdminPage: React.FC<AdminPageProps> = ({ path, search: query = '', onNavigate }) => {
  const { status, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  /** Contadores del carril: tareas de hoy de quien entra y pedidos activos del laboratorio. */
  const [counts, setCounts] = useState<{ today?: number; active?: number; byStatus?: Partial<Record<OrderStatus, number>> }>({});
  /** Si el submenú de Pedidos está desplegado. Se recuerda en este navegador. */
  const [ordersOpen, setOrdersOpen] = useState(() => {
    try {
      return localStorage.getItem('gg.rail.orders') !== 'closed';
    } catch {
      return true;
    }
  });
  const toggleOrders = (open: boolean) => {
    setOrdersOpen(open);
    try {
      localStorage.setItem('gg.rail.orders', open ? 'open' : 'closed');
    } catch {
      // Sin almacenamiento, solo dura esta visita.
    }
  };
  const searchRef = useRef<HTMLInputElement>(null);
  const isStaff = !!user && (STAFF_ROLES as readonly string[]).includes(user.role);

  useEffect(() => {
    if (!isStaff) return;
    let cancelled = false;
    const load = () => {
      fetchStaffToday()
        .then((d) => !cancelled && setCounts((c) => ({ ...c, today: d.sections.reduce((n, x) => n + x.count, 0) })))
        .catch(() => undefined);
      fetchAdminOrders({ status: 'active', sort: 'oldest', page: 1 })
        .then((l) => !cancelled && setCounts((c) => ({ ...c, byStatus: l.counts, active: ACTIVE_STATUSES.reduce((n, st) => n + (l.counts[st] ?? 0), 0) })))
        .catch(() => undefined);
    };
    load();
    const timer = setInterval(load, 120_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isStaff, path]);

  // "/" lleva al buscador desde cualquier sitio del panel, salvo cuando se está escribiendo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const message = (title: string, body: string, action?: { label: string; to: string }) => (
    <div className="gg-panel min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-[#E7E7E2] rounded-[8px] p-8 text-center space-y-4">
        <div className="flex justify-center"><Shield /></div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-[#666A67]">{body}</p>
        {action && (
          <button type="button" onClick={() => onNavigate(action.to)} className="w-full h-10 rounded-[8px] bg-[#0F1110] hover:bg-[#2A2E2B] text-white text-sm font-semibold cursor-pointer">
            {action.label}
          </button>
        )}
      </div>
    </div>
  );

  if (status === 'loading') return <div className="gg-panel min-h-screen" aria-busy="true" />;
  if (!user) return message('Panel del laboratorio', 'Inicia sesión con tu cuenta del laboratorio para entrar.', { label: 'Iniciar sesión', to: '/login' });
  if (!(STAFF_ROLES as readonly string[]).includes(user.role)) {
    return message('Sin acceso', 'Tu cuenta no tiene permisos para usar el panel del laboratorio.', { label: 'Ir a mi cuenta', to: '/account' });
  }

  const detailPrefix = '/admin/orders/';
  const code = path.startsWith(detailPrefix) ? decodeURIComponent(path.slice(detailPrefix.length)) : null;
  const isAdmin = user.role === 'admin';
  // Eventos, equipo y negocio son solo para la dirección; el servidor también lo comprueba.
  const section: Section = code
    ? 'detail'
    : isAdmin && path === DASHBOARD_PATH
      ? 'dashboard'
      : isAdmin && path === HISTORY_PATH
        ? 'history'
      : isAdmin && path === EVENTS_PATH
        ? 'events'
        : isAdmin && path === TEAM_PATH
          ? 'team'
          : path === QUEUE_PATH ? 'queue' : 'today';
  const openOrder = (c: string) => onNavigate(`${detailPrefix}${encodeURIComponent(c)}`);
  if (section !== 'detail') lastListPath = path + query;
  const params = new URLSearchParams(query);
  const initialStatus = section === 'queue' ? params.get('status') ?? 'active' : 'active';
  const go = (to: string) => {
    setMenuOpen(false);
    onNavigate(to);
  };

  type NavItem = { to: string; label: string; icon?: LucideIcon; on: boolean; count?: number; sub?: boolean; children?: NavItem[] };
  const queueStatus = section === 'queue' ? initialStatus : null;
  const byStatus = counts.byStatus;
  const orderFilters: NavItem[] = ['active', 'all', ...QUEUE_STATUSES].map((key) => ({
    to: `${QUEUE_PATH}?status=${key}`,
    label: queueFilterName(key),
    on: queueStatus === key,
    sub: true,
    count: !byStatus ? undefined
      : key === 'active' ? counts.active
      : key === 'all' ? Object.values(byStatus).reduce((a, b) => a + (b ?? 0), 0)
      : byStatus[key as OrderStatus] ?? 0,
  }));
  const groups: { name: string; items: NavItem[] }[] = [
    {
      name: 'Laboratorio',
      items: [
        { to: '/admin', label: 'Hoy', icon: Inbox, on: section === 'today', count: counts.today },
        { to: QUEUE_PATH, label: 'Pedidos', icon: Package, on: section === 'detail', count: counts.active, children: orderFilters },
      ],
    },
    ...(isAdmin
      ? [{
          name: 'Dirección',
          items: [
            { to: EVENTS_PATH, label: 'Eventos', icon: CalendarDays, on: section === 'events' },
            { to: TEAM_PATH, label: 'Equipo', icon: Users, on: section === 'team' },
            { to: DASHBOARD_PATH, label: 'Negocio', icon: LineChart, on: section === 'dashboard' },
            { to: HISTORY_PATH, label: 'Historial', on: section === 'history', sub: true },
          ],
        }]
      : []),
  ];
  const initials = (user.fullName ?? user.email).split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();


  const rail = (
    <div className="flex flex-col h-full bg-white border-r border-[#E7E7E2] text-[#3B3F3C]">
      <div className="flex items-center gap-2.5 px-5 h-[60px] shrink-0">
        <Shield />
        <span className="text-[14px] font-semibold text-[#0F1110] tracking-[-0.005em]">Gorilla Grading</span>
        <button type="button" onClick={() => setMenuOpen(false)} className="lg:hidden ml-auto w-8 h-8 inline-flex items-center justify-center rounded-[6px] hover:bg-[#F1F1EE] cursor-pointer" aria-label="Cerrar el menú">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4" aria-label="Secciones del panel">
        {groups.map((group, gi) => (
          <div key={group.name} className={gi > 0 ? 'mt-5' : ''}>
            {gi > 0 && <div className="px-2.5 pb-1.5 text-[11.5px] text-[#8A8E8B]">{group.name}</div>}
            <div className="space-y-px">
              {group.items.map((n) => {
                const Icon = n.icon;
                const item = (it: NavItem) => (
                  <button
                    key={it.to}
                    type="button"
                    onClick={() => go(it.to)}
                    aria-current={it.on ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-[6px] text-left cursor-pointer transition-colors ${
                      it.sub ? 'h-[30px] ml-[17px] w-[calc(100%-17px)] pl-[17px] pr-2.5 text-[13px] relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-[#E1E1DC]' : 'w-full h-[34px] px-2.5 text-[13.5px]'
                    } ${it.on ? 'bg-[#EAF4EC] text-[#0F1110] font-semibold' : 'text-[#3B3F3C] hover:bg-[#F6F6F3] hover:text-[#0F1110]'}`}
                  >
                    {it === n && Icon && <Icon className={`w-4 h-4 shrink-0 ${it.on ? 'text-[#2F8F3E]' : 'text-[#8A8E8B]'}`} strokeWidth={1.75} aria-hidden="true" />}
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.count !== undefined && (it.count > 0 || it.sub) && (
                      <span className={`font-mono text-[11.5px] ${it.on ? 'text-[#0F1110]' : it.count ? 'text-[#8A8E8B]' : 'text-[#C9CBC7]'}`}>{it.count}</span>
                    )}
                  </button>
                );
                if (!n.children) return item(n);
                // Pedidos: al pulsarlo se abre la lista y se despliegan sus fases; la flecha pliega y despliega.
                const open = ordersOpen;
                return (
                  <div key={n.to}>
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          toggleOrders(true);
                          go(`${QUEUE_PATH}?status=active`);
                        }}
                        aria-current={n.on ? 'page' : undefined}
                        className={`w-full flex items-center gap-2.5 h-[34px] pl-2.5 pr-9 rounded-[6px] text-[13.5px] text-left cursor-pointer transition-colors ${
                          n.on || section === 'queue' ? 'text-[#0F1110] font-semibold' : 'text-[#3B3F3C] hover:bg-[#F6F6F3] hover:text-[#0F1110]'
                        } ${n.on ? 'bg-[#F1F1EE]' : ''}`}
                      >
                        {Icon && <Icon className={`w-4 h-4 shrink-0 ${n.on || section === 'queue' ? 'text-[#2F8F3E]' : 'text-[#8A8E8B]'}`} strokeWidth={1.75} aria-hidden="true" />}
                        <span className="flex-1">{n.label}</span>
                        {!open && n.count !== undefined && n.count > 0 && <span className="font-mono text-[11.5px] text-[#8A8E8B]">{n.count}</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleOrders(!open)}
                        aria-expanded={open}
                        aria-controls="rail-orders"
                        aria-label={open ? 'Plegar las fases de Pedidos' : 'Desplegar las fases de Pedidos'}
                        className="absolute right-1 w-7 h-7 inline-flex items-center justify-center rounded-[6px] text-[#8A8E8B] hover:bg-[#F1F1EE] hover:text-[#0F1110] cursor-pointer"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${open ? '' : '-rotate-90'}`} aria-hidden="true" />
                      </button>
                    </div>
                    {open && (
                      <div id="rail-orders" className="mt-px space-y-px pb-1">
                        {n.children.map(item)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mx-3 mb-3 pt-3 border-t border-[#E7E7E2]">
        <div className="flex items-center gap-2.5 px-1.5">
          <span className="w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-full bg-[#2F8F3E] text-white text-[11px] font-semibold" aria-hidden="true">
            {initials}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <NameEditor name={user.fullName} email={user.email} />
            <div className="text-[12px] text-[#666A67]">{ROLE_LABEL[user.role] ?? user.role}</div>
          </div>
          <button type="button" onClick={() => go('/')} title="Ver la web" aria-label="Ver la web" className="w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-[6px] text-[#666A67] hover:bg-[#F1F1EE] hover:text-[#0F1110] cursor-pointer">
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => void logout().finally(() => onNavigate('/login'))}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-[6px] text-[#666A67] hover:bg-[#F1F1EE] hover:text-[#0F1110] cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );


  return (
    <div className="gg-panel min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Carril lateral: fijo en ordenador, cajón en tablet y móvil */}
      <div className="hidden lg:block bg-white">
        <div className="sticky top-0 h-screen">{rail}</div>
      </div>
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menú del panel">
          <div className="w-[260px] max-w-[80vw] h-full shadow-[8px_0_24px_rgba(15,17,16,0.18)]">{rail}</div>
          <button type="button" className="flex-1 bg-black/40 cursor-pointer" aria-label="Cerrar el menú" onClick={() => setMenuOpen(false)} />
        </div>
      )}

      <div className="min-w-0 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-[60px] bg-[#F6F6F3]/95 backdrop-blur border-b border-[#E7E7E2] flex items-center gap-3 px-4 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-1 w-9 h-9 inline-flex items-center justify-center rounded-[6px] hover:bg-[#EDEDE9] cursor-pointer"
            aria-label="Abrir el menú"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <nav aria-label="Ruta" className="flex items-center gap-2 text-[13px] min-w-0">
            <span className="hidden sm:inline text-[#8A8E8B]">{section === 'events' || section === 'team' || section === 'dashboard' || section === 'history' ? 'Dirección' : 'Laboratorio'}</span>
            <span className="hidden sm:inline text-[#C9CBC7]" aria-hidden="true">/</span>
            {section === 'detail' && (
              <>
                <button type="button" onClick={() => onNavigate(lastListPath)} className="text-[#8A8E8B] hover:text-[#0F1110] cursor-pointer">Pedidos</button>
                <span className="text-[#C9CBC7]" aria-hidden="true">/</span>
              </>
            )}
            <h1 className="text-[15px] font-semibold text-[#0F1110] truncate">{section === 'detail' && code ? `Pedido ${code}` : TITLE[section]}</h1>
          </nav>
          <form
            role="search"
            className="ml-auto w-full max-w-[320px]"
            onSubmit={(e) => {
              e.preventDefault();
              const q = search.trim();
              const digits = q.replace(/[\s.-]/g, '');
              setSearch('');
              searchRef.current?.blur();
              if (/^\d{9}$/.test(digits)) openOrder(digits);
              else if (q) go(`${QUEUE_PATH}?q=${encodeURIComponent(q)}`);
            }}
          >
            <label className="relative block">
              <span className="sr-only">Buscar un pedido</span>
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#8A8E8B]" aria-hidden="true" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar pedido, cliente o correo"
                className="w-full h-8 pl-8 pr-8 rounded-[7px] border border-[#E1E1DC] bg-white text-[13px] placeholder:text-[#8A8E8B] focus:border-[#0F1110] focus:outline-none focus:ring-2 focus:ring-[#0F1110]/10"
              />
              <kbd className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] leading-none text-[#666A67] border border-[#E1E1DC] rounded-[4px] px-1.5 py-[3px]">/</kbd>
            </label>
          </form>
        </header>

        <main className="flex-1 w-full max-w-[1280px] px-4 sm:px-6 lg:px-10 py-8">
          {section === 'dashboard' ? (
            <BusinessDashboard onOpenOrder={openOrder} />
          ) : section === 'history' ? (
            <CertificateHistorySection onOpenOrder={openOrder} />
          ) : section === 'events' ? (
            <EventsCalendar />
          ) : section === 'team' ? (
            <TeamPanel user={user} />
          ) : code ? (
            <OrderDetail code={code} onBack={() => onNavigate(lastListPath)} />
          ) : section === 'queue' ? (
            <OrderQueue key={`${initialStatus}-${params.get('q') ?? ''}`} initialStatus={initialStatus} initialQuery={params.get('q') ?? ''} onOpen={openOrder} />
          ) : (
            <TodayPanel user={user} onOpenOrder={openOrder} onOpenQueue={(st) => onNavigate(`${QUEUE_PATH}?status=${st}`)} />
          )}
        </main>
      </div>
    </div>
  );
};
