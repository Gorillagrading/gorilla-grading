import React from 'react';
import { STAFF_ROLES } from '../../shared/admin';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BusinessDashboard } from './admin/BusinessDashboard';
import { OrderDetail } from './admin/OrderDetail';
import { OrderQueue } from './admin/OrderQueue';
import { TodayPanel } from './admin/TodayPanel';
import { EventsCalendar } from './admin/EventsCalendar';

const ROLE_LABEL: Record<string, string> = {
  staff: 'Recepción y logística',
  grader: 'Graduador',
  qa: 'Control de calidad',
  admin: 'Administración',
};

export const DASHBOARD_PATH = '/admin/dashboard';
export const QUEUE_PATH = '/admin/orders';
export const EVENTS_PATH = '/admin/events';

/** Última pantalla de lista visitada, para que "Volver" desde un pedido regrese a ella. */
let lastListPath = '/admin';

interface AdminPageProps {
  /** Ruta actual: /admin (hoy), /admin/orders (lista), /admin/dashboard (negocio) o /admin/orders/284719365 (detalle). */
  path: string;
  onNavigate: (path: string) => void;
}

/** Panel del laboratorio. Solo para cuentas con un rol del personal; el servidor lo vuelve a comprobar en cada llamada. */
export const AdminPage: React.FC<AdminPageProps> = ({ path, onNavigate }) => {
  const { status, user, logout } = useAuth();
  const isLight = useTheme().theme === 'light';
  const muted = isLight ? 'text-neutral-500' : 'text-[#A4ACA1]';
  const text = isLight ? 'text-[#14170F]' : 'text-white';
  const shell = `min-h-screen pt-24 pb-20 transition-colors duration-300 ${isLight ? 'bg-[#F9F7F2] text-[#111827]' : 'bg-[#111311] text-[#F5F6F2]'}`;

  const message = (title: string, body: string, action?: { label: string; to: string }) => (
    <div className={shell}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center space-y-3">
        <h1 className={`font-['Nunito',sans-serif] text-2xl font-[900] uppercase ${text}`}>{title}</h1>
        <p className={`text-sm ${muted}`}>{body}</p>
        {action && (
          <button type="button" onClick={() => onNavigate(action.to)} className="btn-gorilla-square mt-3 px-6 py-3 text-xs font-extrabold tracking-normal cursor-pointer">
            {action.label}
          </button>
        )}
      </div>
    </div>
  );

  if (status === 'loading') return <div className={shell} aria-busy="true" />;
  if (!user) return message('Panel del laboratorio', 'Inicia sesión con tu cuenta del laboratorio para entrar.', { label: 'Iniciar sesión', to: '/login' });
  if (!(STAFF_ROLES as readonly string[]).includes(user.role)) {
    return message('Sin acceso', 'Tu cuenta no tiene permisos para usar el panel del laboratorio.', { label: 'Ir a mi cuenta', to: '/account' });
  }

  const detailPrefix = '/admin/orders/';
  const code = path.startsWith(detailPrefix) ? decodeURIComponent(path.slice(detailPrefix.length)) : null;
  const isAdmin = user.role === 'admin';
  // El panel de negocio es solo para la dirección; el servidor también lo comprueba.
  const section = code
    ? 'detail'
    : isAdmin && path === DASHBOARD_PATH
      ? 'dashboard'
      : isAdmin && path === EVENTS_PATH
        ? 'events'
        : path === QUEUE_PATH ? 'queue' : 'today';
  const openOrder = (c: string) => onNavigate(`${detailPrefix}${encodeURIComponent(c)}`);
  if (section !== 'detail') lastListPath = path + window.location.search;
  const initialStatus = section === 'queue' ? new URLSearchParams(window.location.search).get('status') ?? 'active' : 'active';
  const tab = (to: string, label: string, selected: boolean) => (
    <button
      key={to}
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => onNavigate(to)}
      className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
        selected
          ? isLight ? 'bg-[#15803D] text-white' : 'bg-[#61B663] text-[#111311]'
          : `${muted} ${isLight ? 'hover:bg-black/5' : 'hover:bg-white/10'}`
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={shell}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#15803D] dark:text-[#61B663] font-bold">
              {section === 'dashboard' || section === 'events' ? 'Dirección' : 'Laboratorio'}
            </div>
            <h1 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] uppercase ${text}`}>
              {{ dashboard: 'Negocio', events: 'Eventos', detail: 'Pedido', queue: 'Pedidos', today: 'Hoy' }[section]}
            </h1>
          </div>
          <div className={`text-xs text-right ${muted}`}>
            <div className="font-bold">{user.fullName ?? user.email}</div>
            <div className="font-mono">{ROLE_LABEL[user.role] ?? user.role}</div>
            <button
              type="button"
              onClick={() => void logout().finally(() => onNavigate('/login'))}
              className="mt-1 font-bold underline-offset-4 hover:underline cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {!code && (
          <nav className="flex flex-wrap gap-2" role="tablist" aria-label="Secciones del panel">
            {tab('/admin', 'Hoy', section === 'today')}
            {tab(QUEUE_PATH, 'Pedidos', section === 'queue')}
            {isAdmin && tab(EVENTS_PATH, 'Eventos', section === 'events')}
            {isAdmin && tab(DASHBOARD_PATH, 'Negocio', section === 'dashboard')}
          </nav>
        )}

        {section === 'dashboard' ? (
          <BusinessDashboard onOpenOrder={openOrder} />
        ) : section === 'events' ? (
          <EventsCalendar />
        ) : code ? (
          <OrderDetail code={code} onBack={() => onNavigate(lastListPath)} />
        ) : section === 'queue' ? (
          <OrderQueue key={initialStatus} initialStatus={initialStatus} onOpen={openOrder} />
        ) : (
          <TodayPanel user={user} onOpenOrder={openOrder} onOpenQueue={(status) => onNavigate(`${QUEUE_PATH}?status=${status}`)} />
        )}
      </div>
    </div>
  );
};
