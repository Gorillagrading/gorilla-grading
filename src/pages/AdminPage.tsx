import React, { useState } from 'react';
import '@fontsource-variable/archivo/wght.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import { CalendarDays, ExternalLink, Inbox, LineChart, LogOut, Menu, Package, Search, Users, type LucideIcon } from 'lucide-react';
import { STAFF_ROLES } from '../../shared/admin';
import { useAuth } from '../context/AuthContext';
import { BusinessDashboard } from './admin/BusinessDashboard';
import { OrderDetail } from './admin/OrderDetail';
import { OrderQueue } from './admin/OrderQueue';
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

/** Última pantalla de lista visitada, para que "Volver" desde un pedido regrese a ella. */
let lastListPath = '/admin';

interface AdminPageProps {
  /** Ruta actual: /admin (hoy), /admin/orders (lista), /admin/dashboard (negocio) o /admin/orders/284719365 (detalle). */
  path: string;
  onNavigate: (path: string) => void;
}

/** El escudo de Gorilla, sin animación, para el carril del panel. */
const Shield: React.FC = () => (
  <svg viewBox="8 8 68 76" className="w-7 h-8 shrink-0" aria-hidden="true">
    <path d="M8 16A8 8 0 0 1 16 8h52a8 8 0 0 1 8 8v34c0 16-16 28-34 34C24 78 8 66 8 50Z" fill="#3FA64F" />
    <g transform="translate(42,44)">
      <path d="M13 -9 A15.5 15.5 0 1 0 15.5 3 H2" fill="none" stroke="#1A1D1C" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

type Section = 'today' | 'queue' | 'events' | 'team' | 'dashboard' | 'detail';

const TITLE: Record<Section, string> = {
  today: 'Hoy', queue: 'Pedidos', events: 'Eventos', team: 'Equipo', dashboard: 'Negocio', detail: 'Pedido',
};

/**
 * Panel del laboratorio: una herramienta propia a pantalla completa, con carril lateral y barra de búsqueda.
 * Solo para cuentas con un rol del personal; el servidor lo vuelve a comprobar en cada llamada.
 */
export const AdminPage: React.FC<AdminPageProps> = ({ path, onNavigate }) => {
  const { status, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const message = (title: string, body: string, action?: { label: string; to: string }) => (
    <div className="gg-panel min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-[#D7D9D3] rounded-[3px] p-8 text-center space-y-4">
        <div className="flex justify-center"><Shield /></div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-[#5A5F5B]">{body}</p>
        {action && (
          <button type="button" onClick={() => onNavigate(action.to)} className="w-full h-10 rounded-[3px] bg-[#2F8F3E] hover:bg-[#25762F] text-white text-sm font-semibold cursor-pointer">
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
      : isAdmin && path === EVENTS_PATH
        ? 'events'
        : isAdmin && path === TEAM_PATH
          ? 'team'
          : path === QUEUE_PATH ? 'queue' : 'today';
  const openOrder = (c: string) => onNavigate(`${detailPrefix}${encodeURIComponent(c)}`);
  if (section !== 'detail') lastListPath = path + window.location.search;
  const params = new URLSearchParams(window.location.search);
  const initialStatus = section === 'queue' ? params.get('status') ?? 'active' : 'active';
  const go = (to: string) => {
    setMenuOpen(false);
    onNavigate(to);
  };

  const nav: { to: string; label: string; icon: LucideIcon; on: boolean; show: boolean }[] = [
    { to: '/admin', label: 'Hoy', icon: Inbox, on: section === 'today', show: true },
    { to: QUEUE_PATH, label: 'Pedidos', icon: Package, on: section === 'queue' || section === 'detail', show: true },
    { to: EVENTS_PATH, label: 'Eventos', icon: CalendarDays, on: section === 'events', show: isAdmin },
    { to: TEAM_PATH, label: 'Equipo', icon: Users, on: section === 'team', show: isAdmin },
    { to: DASHBOARD_PATH, label: 'Negocio', icon: LineChart, on: section === 'dashboard', show: isAdmin },
  ];

  const rail = (
    <div className="flex flex-col h-full bg-[#1A1D1C] text-[#C4C8C3]">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[#2C302E]">
        <Shield />
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-white">Gorilla Grading</div>
          <div className="text-[12px] text-[#A3A9A4]">Laboratorio</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Secciones del panel">
        {nav.filter((n) => n.show).map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.to}
              type="button"
              onClick={() => go(n.to)}
              aria-current={n.on ? 'page' : undefined}
              className={`relative w-full flex items-center gap-3 h-10 px-3 rounded-[3px] text-[14px] text-left cursor-pointer transition-colors ${
                n.on ? 'bg-[#2A2F2D] text-white font-semibold' : 'text-[#C4C8C3] hover:bg-[#232725] hover:text-white'
              }`}
            >
              {n.on && <span className="absolute left-0 top-2 bottom-2 w-[2px] bg-[#3FA64F]" aria-hidden="true" />}
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
              {n.label}
            </button>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-[#2C302E] space-y-3">
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-white truncate">{user.fullName ?? user.email}</div>
          <div className="text-[12px] text-[#A3A9A4]">{ROLE_LABEL[user.role] ?? user.role}</div>
        </div>
        <div className="flex items-center gap-4 text-[12px]">
          <button type="button" onClick={() => go('/')} className="inline-flex items-center gap-1.5 text-[#C4C8C3] hover:text-white cursor-pointer">
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> Ver la web
          </button>
          <button
            type="button"
            onClick={() => void logout().finally(() => onNavigate('/login'))}
            className="inline-flex items-center gap-1.5 text-[#C4C8C3] hover:text-white cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' });

  return (
    <div className="gg-panel min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* Carril lateral: fijo en ordenador, cajón en tablet y móvil */}
      <div className="hidden lg:block sticky top-0 h-screen">{rail}</div>
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menú del panel">
          <div className="w-[260px] max-w-[80vw] h-full shadow-[8px_0_24px_rgba(0,0,0,0.25)]">{rail}</div>
          <button type="button" className="flex-1 bg-black/40 cursor-pointer" aria-label="Cerrar el menú" onClick={() => setMenuOpen(false)} />
        </div>
      )}

      <div className="min-w-0 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#D7D9D3] flex items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-1 w-9 h-9 inline-flex items-center justify-center rounded-[3px] hover:bg-[#EDEEEA] cursor-pointer"
            aria-label="Abrir el menú"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <h1 className="text-[17px] font-bold whitespace-nowrap">{TITLE[section]}</h1>
          <form
            role="search"
            className="ml-auto sm:ml-6 flex-1 max-w-[420px]"
            onSubmit={(e) => {
              e.preventDefault();
              const q = search.trim();
              const digits = q.replace(/[\s.-]/g, '');
              setSearch('');
              if (/^\d{9}$/.test(digits)) openOrder(digits);
              else if (q) go(`${QUEUE_PATH}?q=${encodeURIComponent(q)}`);
            }}
          >
            <label className="relative block">
              <span className="sr-only">Buscar un pedido</span>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B706C]" aria-hidden="true" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nº de pedido, cliente o correo"
                className="w-full h-9 pl-9 pr-3 rounded-[3px] border border-[#C7CAC4] bg-[#F7F8F5] text-[14px] placeholder:text-[#6B706C] focus:bg-white focus:border-[#2F8F3E] focus:outline-none focus:ring-2 focus:ring-[#2F8F3E]/20"
              />
            </label>
          </form>
          <span className="hidden md:block ml-4 text-[13px] text-[#5A5F5B] first-letter:uppercase whitespace-nowrap">{today}</span>
        </header>

        <main className="flex-1 w-full max-w-[1320px] px-4 sm:px-6 lg:px-8 py-6">
          {section === 'dashboard' ? (
            <BusinessDashboard onOpenOrder={openOrder} />
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
