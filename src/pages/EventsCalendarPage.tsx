import React, { useEffect, useState } from 'react';
import { fetchUpcomingEvents } from '../api/orders';
import type { PublicEventDto } from '../../shared/events';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Calendar, 
  Download, 
  X, 
  ExternalLink 
} from 'lucide-react';

interface EventsCalendarPageProps {
  onNavigate: (path: string) => void;
}

interface EventEntry {
  id: string;
  type: 'convention' | 'hub';
  dateLabel: string;
  city: string;
  country: string;
  title: string;
  venue: string;
  address: string;
  hours: string;
  standInfo?: string;
  services: string[];
  startsAt: string;
  endsAt: string;
}

const COUNTRY: Record<string, { es: string; en: string }> = {
  ES: { es: 'España', en: 'Spain' },
  PT: { es: 'Portugal', en: 'Portugal' },
  FR: { es: 'Francia', en: 'France' },
};

/** Un evento publicado por la dirección, en el formato de esta página. */
const toEntry = (e: PublicEventDto, isEs: boolean): EventEntry => {
  const locale = isEs ? 'es-ES' : 'en-GB';
  const tz = { timeZone: 'Europe/Madrid' } as const;
  const start = new Date(e.startsAt);
  const end = new Date(e.endsAt);
  const time = (d: Date) => d.toLocaleTimeString(locale, { ...tz, hour: '2-digit', minute: '2-digit' });
  return {
    id: e.id,
    type: e.kind === 'hub' ? 'hub' : 'convention',
    dateLabel: start.toLocaleDateString(locale, { ...tz, day: 'numeric', month: 'long', year: 'numeric' }),
    city: e.city,
    country: COUNTRY[e.countryCode]?.[isEs ? 'es' : 'en'] ?? e.countryCode,
    title: e.name,
    venue: e.venue ?? '',
    address: e.address ?? '',
    hours: `${time(start)}–${time(end)}`,
    standInfo: e.details ?? undefined,
    services: [],
    startsAt: e.startsAt,
    endsAt: e.endsAt,
  };
};

const icsDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export const EventsCalendarPage: React.FC<EventsCalendarPageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isEs = language === 'es';

  const [activeTab, setActiveTab] = useState<'convention' | 'hub'>('convention');
  const [selectedEvent, setSelectedEvent] = useState<EventEntry | null>(null);

  // Los eventos los publica la dirección desde su panel (Eventos); aquí solo se muestran los próximos.
  const [published, setPublished] = useState<PublicEventDto[]>([]);
  useEffect(() => {
    fetchUpcomingEvents().then(setPublished).catch(() => setPublished([]));
  }, []);
  const entries = published.map((e) => toEntry(e, isEs));
  const conventions = entries.filter((e) => e.type === 'convention');
  const partnerHubs = entries.filter((e) => e.type === 'hub');
  const noEvents = conventions.length === 0 && partnerHubs.length === 0;

  const currentList = activeTab === 'convention' ? conventions : partnerHubs;

  const handleDownloadIcs = (event: EventEntry) => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gorilla Grading//Events//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@gorillagrading.com`,
      `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${icsDate(event.startsAt)}`,
      `DTEND:${icsDate(event.endsAt)}`,
      `SUMMARY:Gorilla Grading: ${event.title}`,
      `LOCATION:${event.venue}, ${event.address}`,
      `DESCRIPTION:Entrega presencial Gorilla Grading en ${event.city}. Horario: ${event.hours}.`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gorilla-${event.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`w-full min-h-screen py-16 px-6 lg:px-12 selection:bg-[#48C765] selection:text-black transition-colors duration-300 ${
      isLight ? 'bg-transparent text-[#14170F]' : 'bg-[#0B0E0B] text-white'
    }`}>
      <div className="max-w-[1100px] mx-auto">
        
        {/* Back Link */}
        <div className="mb-10">
          <button 
            onClick={() => onNavigate('/faq/dropoff')}
            className={`inline-flex items-center gap-2 font-mono text-[11px] font-bold tracking-widest uppercase transition-colors ${
              isLight ? 'text-[#6B7268] hover:text-[#14170F]' : 'text-[#A4ACA1] hover:text-white'
            }`}
          >
            <ArrowLeft size={13} />
            <span>{isEs ? 'Volver a Entrega Presencial' : 'Back to Drop-Off'}</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2.5 mb-3">
            <span className={`w-6 h-[1.5px] ${isLight ? 'bg-[#15803D]' : 'bg-[#48C765]'}`} />
            <span className={`font-mono text-[10px] font-bold tracking-[0.25em] uppercase ${
              isLight ? 'text-[#15803D]' : 'text-[#48C765]'
            }`}>
              {isEs ? 'CIRCUITO OFICIAL & PUNTOS DE RECOGIDA' : 'OFFICIAL INTAKE TOUR & HUBS'}
            </span>
          </div>

          <h1 className={`font-['Nunito',sans-serif] font-[900] text-3xl sm:text-5xl uppercase tracking-normal leading-[1.08] mb-4 ${
            isLight ? 'text-[#14170F]' : 'text-white'
          }`}>
            {isEs ? 'Calendario de Eventos & Drop-Off' : 'Events Calendar & Drop-Off Hubs'}
          </h1>

          <p className={`font-sans text-sm sm:text-base max-w-2xl leading-relaxed ${
            isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
          }`}>
            {isEs
              ? 'La entrega en mano en eventos permite enviar tus cartas sin mensajería postal. Publicaremos aquí cada evento cuando esté confirmado.'
              : 'Hand delivery at events lets you submit your cards without postal shipping. We will publish each event here once it is confirmed.'}
          </p>
        </div>

        {noEvents && (
          <div className={`p-8 sm:p-10 border mb-16 ${isLight ? 'bg-[#FAF8F5] border-black/10' : 'bg-[#121612] border-white/10'}`}>
            <h2 className="font-['Nunito',sans-serif] font-[900] text-xl sm:text-2xl uppercase tracking-normal mb-3">
              {isEs ? 'Próximamente' : 'Coming soon'}
            </h2>
            <p className={`font-sans text-sm leading-relaxed max-w-2xl mb-6 ${isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'}`}>
              {isEs
                ? 'Todavía no hay eventos ni puntos de entrega confirmados. Mientras tanto puedes enviar tus cartas por mensajería asegurada. Si quieres que te avisemos de los próximos eventos, escríbenos.'
                : 'There are no confirmed events or drop-off points yet. Meanwhile you can send your cards by insured courier. If you would like to hear about upcoming events, write to us.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('/submit')}
                className="btn-gorilla-square px-6 py-3 text-xs font-extrabold tracking-normal cursor-pointer"
              >
                {isEs ? 'ENVIAR CARTAS' : 'SUBMIT CARDS'}
              </button>
              <button
                onClick={() => onNavigate('/contact')}
                className="btn-gorilla-square-secondary px-6 py-3 text-xs font-bold tracking-normal cursor-pointer"
              >
                {isEs ? 'CONTACTAR' : 'CONTACT US'}
              </button>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className={`flex items-center gap-3 mb-8 border-b border-black/10 dark:border-white/10 pb-4 ${noEvents ? 'hidden' : ''}`}>
          <button
            onClick={() => setActiveTab('convention')}
            className={`font-mono text-xs font-bold uppercase tracking-wider py-2 px-4 transition-all ${
              activeTab === 'convention'
                ? isLight
                  ? 'bg-[#14170F] text-white shadow-sm'
                  : 'bg-[#16A34A] text-white shadow-sm'
                : isLight
                  ? 'text-[#5A6357] hover:text-[#14170F]'
                  : 'text-[#A4ACA1] hover:text-white'
            }`}
          >
            {isEs ? 'Card Shows & Convenciones' : 'Card Shows & Expos'} ({conventions.length})
          </button>

          <button
            onClick={() => setActiveTab('hub')}
            className={`font-mono text-xs font-bold uppercase tracking-wider py-2 px-4 transition-all ${
              activeTab === 'hub'
                ? isLight
                  ? 'bg-[#14170F] text-white shadow-sm'
                  : 'bg-[#16A34A] text-white shadow-sm'
                : isLight
                  ? 'text-[#5A6357] hover:text-[#14170F]'
                  : 'text-[#A4ACA1] hover:text-white'
            }`}
          >
            {isEs ? 'Puntos Permanentes (Hubs)' : 'Permanent Hubs'} ({partnerHubs.length})
          </button>
        </div>

        {/* Schedule List */}
        <div className={`space-y-4 mb-16 ${noEvents ? 'hidden' : ''}`}>
          {currentList.map((item) => (
            <div
              key={item.id}
              className={`p-6 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                isLight 
                  ? 'bg-[#FAF8F5] border-black/10 hover:border-black/30 shadow-sm' 
                  : 'bg-[#121612] border-white/10 hover:border-white/25'
              }`}
            >
              {/* Left Column: Date & Location */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
                
                {/* Date Block */}
                <div className="shrink-0 min-w-[130px]">
                  <span className={`font-mono text-xs font-bold tracking-wider block ${
                    isLight ? 'text-[#15803D]' : 'text-[#4ADE80]'
                  }`}>
                    {item.dateLabel}
                  </span>
                  <span className={`font-sans text-xs ${isLight ? 'text-[#6B7268]' : 'text-[#A4ACA1]'}`}>
                    {item.hours}
                  </span>
                </div>

                {/* Event Name & Venue */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-['Nunito',sans-serif] font-[900] text-lg uppercase tracking-normal">
                      {item.city}
                    </span>
                    <span className={`text-xs font-sans ${isLight ? 'text-[#6B7268]' : 'text-[#8A9388]'}`}>
                      · {item.country}
                    </span>
                  </div>

                  <h3 className={`font-sans text-sm font-semibold mb-1 ${
                    isLight ? 'text-[#14170F]' : 'text-gray-100'
                  }`}>
                    {item.title}
                  </h3>

                  <div className={`flex items-center gap-1.5 font-sans text-xs ${
                    isLight ? 'text-[#5A6357]' : 'text-[#A4ACA1]'
                  }`}>
                    <MapPin size={12} className="shrink-0 text-[#16A34A]" />
                    <span>{item.venue} · {item.address}</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Stand & Action */}
              <div className="shrink-0 flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-black/5 dark:border-white/5">
                {item.standInfo && (
                  <span className={`hidden lg:inline-block font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border ${
                    isLight 
                      ? 'border-black/10 bg-white text-[#5A6357]' 
                      : 'border-white/10 bg-[#161B16] text-[#A4ACA1]'
                  }`}>
                    {item.standInfo}
                  </span>
                )}

                <button
                  onClick={() => setSelectedEvent(item)}
                  className={`px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                    isLight
                      ? 'bg-[#14170F] text-white hover:bg-[#2B302B]'
                      : 'bg-[#16A34A] text-white hover:bg-[#15803D]'
                  }`}
                >
                  {isEs ? 'Ver Detalles' : 'View Details'}
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Drop-Off Guidelines Box (Minimalist & Direct) */}
        <div className={`p-6 sm:p-8 border ${
          isLight 
            ? 'bg-white border-black/10' 
            : 'bg-[#141814] border-white/10'
        }`}>
          <h4 className="font-['Nunito',sans-serif] font-[900] text-sm uppercase tracking-wider mb-2">
            {isEs ? 'Instrucciones para la Entrega en Mano' : 'Hand-Delivery Instructions'}
          </h4>
          <p className={`font-sans text-xs leading-relaxed max-w-3xl ${
            isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
          }`}>
            {isEs
              ? 'Lleva tus cartas dentro de fundas suaves (penny sleeves) protegidas en toploaders semirrígidos (Card Savers). Ten a mano el identificador de tu pedido online o realiza la solicitud directamente en el mostrador del stand. Te entregaremos un recibo de custodia oficial en el momento.'
              : 'Bring your cards in soft penny sleeves inserted into semi-rigid Card Savers. Have your online submission ID ready, or submit on-site directly at our intake counter. An official custody receipt will be generated immediately.'}
          </p>
        </div>

      </div>

      {/* Clean Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg p-6 sm:p-8 border relative shadow-2xl ${
            isLight 
              ? 'bg-[#FAF8F5] border-black/20 text-[#14170F]' 
              : 'bg-[#141714] border-white/20 text-white'
          }`}>
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-black dark:hover:text-white"
            >
              <X size={18} />
            </button>

            <span className="font-mono text-[10px] font-bold text-[#16A34A] uppercase tracking-widest block mb-2">
              {selectedEvent.city} · {selectedEvent.dateLabel}
            </span>

            <h3 className="font-['Nunito',sans-serif] font-[900] text-2xl uppercase mb-1">
              {selectedEvent.title}
            </h3>

            <p className={`font-sans text-xs mb-6 ${isLight ? 'text-[#5A6357]' : 'text-[#A4ACA1]'}`}>
              {selectedEvent.venue} · {selectedEvent.address}
            </p>

            <div className={`p-4 border mb-6 space-y-2 text-xs font-sans ${
              isLight ? 'bg-white border-black/10' : 'bg-[#181D18] border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-[#16A34A] shrink-0" />
                <span><strong>{isEs ? 'Horario:' : 'Hours:'}</strong> {selectedEvent.hours}</span>
              </div>
              {selectedEvent.standInfo && (
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-[#16A34A] shrink-0" />
                  <span><strong>{isEs ? 'Ubicación:' : 'Location:'}</strong> {selectedEvent.standInfo}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#16A34A] mb-2">
                {isEs ? 'Servicios Confirmados en Stand:' : 'Confirmed Services on Site:'}
              </h5>
              <ul className="space-y-1.5">
                {selectedEvent.services.map((srv, idx) => (
                  <li key={idx} className="font-sans text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />
                    <span>{srv}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleDownloadIcs(selectedEvent)}
                className={`flex-1 py-3 px-4 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-colors ${
                  isLight 
                    ? 'border-black/20 hover:border-black text-[#14170F]' 
                    : 'border-white/20 hover:border-white text-white'
                }`}
              >
                <Download size={14} />
                <span>{isEs ? 'Añadir a Calendario (.ics)' : 'Add to Calendar (.ics)'}</span>
              </button>

              <button
                onClick={() => setSelectedEvent(null)}
                className={`py-3 px-5 font-mono text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'bg-[#14170F] text-white' : 'bg-[#16A34A] text-white'
                }`}
              >
                {isEs ? 'Cerrar' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
