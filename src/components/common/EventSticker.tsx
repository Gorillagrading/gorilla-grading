import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { fetchUpcomingEvents } from '../../api/orders';
import type { PublicEventDto } from '../../../shared/events';

// Una sola petición para toda la web: el sticker puede estar en varios sitios a la vez.
// undefined = no se pudo cargar; null = cargado y no hay ningún evento próximo.
let nextEventRequest: Promise<PublicEventDto | null | undefined> | null = null;

const loadNextEvent = (): Promise<PublicEventDto | null | undefined> => {
  if (!nextEventRequest) {
    nextEventRequest = fetchUpcomingEvents()
      .then((events) => {
        const now = Date.now();
        const upcoming = events
          .filter((e) => new Date(e.endsAt).getTime() > now)
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        return upcoming[0] ?? null;
      })
      .catch(() => {
        nextEventRequest = null;
        return undefined;
      });
  }
  return nextEventRequest;
};

/** Próximo evento real con entrega en mano. null si no hay ninguno publicado; undefined si aún no ha cargado o falló. */
export const useNextEvent = (enabled = true): PublicEventDto | null | undefined => {
  const [event, setEvent] = useState<PublicEventDto | null | undefined>(undefined);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadNextEvent().then((e) => {
      if (!cancelled) setEvent(e);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return event;
};

/** Sticker con la fecha, ciudad y nombre del próximo evento (o el aviso de que no hay). Quien lo usa decide dónde colocarlo. */
export const EventSticker: React.FC<{ event: PublicEventDto | null; className?: string; compact?: boolean }> = ({ event, className = '', compact = false }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const when = event ? new Date(event.startsAt) : null;
  const tz = { timeZone: 'Europe/Madrid' } as const;
  const locale = language === 'es' ? 'es-ES' : 'en-GB';
  const month = when ? when.toLocaleDateString(locale, { ...tz, month: 'short' }).replace('.', '').toUpperCase() : '';
  const day = when ? when.toLocaleDateString(locale, { ...tz, day: 'numeric' }) : '';

  return (
    <div
      className={`event-sticker flex items-stretch overflow-hidden rounded-md border shadow-md w-fit ${className}`}
      style={isLight
        ? { background: '#FFFFFF', borderColor: 'rgba(20,23,15,0.18)', color: '#14170F' }
        : { background: '#1B1F2C', borderColor: 'rgba(255,255,255,0.22)', color: '#FFFFFF' }}
      aria-label={language === 'es' ? 'Próximo evento' : 'Next event'}
    >
      <div
        className={`flex flex-col items-center justify-center leading-none ${compact ? 'min-w-[34px] px-1.5 py-0.5' : 'min-w-[44px] px-2.5 py-1'}`}
        style={isLight ? { background: '#15803D', color: '#FFFFFF' } : { background: '#4ADE80', color: '#0F1A12' }}
      >
        {event && (
          <>
            <span className={`font-mono font-bold tracking-wider ${compact ? 'text-[7px]' : 'text-[9px]'}`}>{month}</span>
            <span className={`font-['Nunito',sans-serif] font-[900] mt-0.5 ${compact ? 'text-[15px]' : 'text-xl'}`}>{day}</span>
          </>
        )}
      </div>
      <div className={`min-w-0 flex flex-col justify-center ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}>
        {event ? (
          <>
            <span className={`font-mono font-bold uppercase tracking-wider ${compact ? 'text-[7px]' : 'text-[8px]'}`} style={{ color: isLight ? '#15803D' : '#4ADE80' }}>
              {language === 'es' ? 'Próximo evento · entrega en mano' : 'Next event · in-person delivery'}
            </span>
            <span className={`mt-0.5 truncate font-sans font-bold ${compact ? 'text-[9.5px]' : 'text-[11px]'}`}>
              {event.city}, {event.name}
            </span>
          </>
        ) : (
          <span className="font-sans text-[11px] font-bold">
            {language === 'es' ? 'Sin próximos eventos · por el momento' : 'No upcoming events · for the moment'}
          </span>
        )}
      </div>
    </div>
  );
};

// Sitios donde puede salir el aviso: en cada página cambia al siguiente, para que no sea siempre el mismo.
const POPUP_SPOTS = [
  'top-[88px] left-4 sm:left-6',
  'bottom-6 right-4 sm:right-6',
  'top-[88px] right-4 sm:right-6',
  'bottom-6 left-4 sm:left-6',
  'top-1/2 left-4 sm:left-6',
  'top-1/2 right-4 sm:right-6',
];

/** Aviso flotante: sale unos segundos en cada página, en un sitio distinto cada vez, y se va solo. */
export const EventStickerPopup: React.FC<{ path: string; onNavigate: (path: string) => void }> = ({ path, onNavigate }) => {
  const hidden = path.startsWith('/admin');
  const event = useNextEvent(!hidden);
  const [visible, setVisible] = useState(false);
  const [spot, setSpot] = useState(0);
  const lastPath = useRef(path);

  useEffect(() => {
    if (lastPath.current !== path) {
      lastPath.current = path;
      setSpot((n) => (n + 1) % POPUP_SPOTS.length);
    }
    setVisible(false);
    if (!event || hidden) return;
    const show = setTimeout(() => setVisible(true), 1500);
    const hide = setTimeout(() => setVisible(false), 1500 + 4000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [path, event, hidden]);

  if (!event || hidden || !visible) return null;

  return (
    <button
      type="button"
      onClick={() => onNavigate('/submit?tier=event')}
      className={`event-popup fixed z-40 ${POPUP_SPOTS[spot]} max-w-[calc(100vw-2rem)] text-left cursor-pointer`}
    >
      <EventSticker event={event} compact className="max-w-[230px]" />
    </button>
  );
};
