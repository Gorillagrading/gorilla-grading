import React, { useState } from 'react';
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
}

export const EventsCalendarPage: React.FC<EventsCalendarPageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isEs = language === 'es';

  const [activeTab, setActiveTab] = useState<'convention' | 'hub'>('convention');
  const [selectedEvent, setSelectedEvent] = useState<EventEntry | null>(null);

  const conventions: EventEntry[] = [
    {
      id: 'madrid-tcg-2026',
      type: 'convention',
      dateLabel: '14 - 15 NOV 2026',
      city: 'Madrid',
      country: isEs ? 'España' : 'Spain',
      title: 'Iberian TCG Masters & Card Show',
      venue: 'Pabellón de Cristal · Casa de Campo',
      address: 'Avenida Principal 16, 28011 Madrid',
      hours: '10:00 - 20:00',
      standInfo: 'Stand Gorilla Lab #G-14',
      services: isEs 
        ? ['Servicio Express 48h in situ', 'Pre-check óptico de centrado', 'Recibo de custodia con código QR']
        : ['On-site 48h express grading', 'Optical centering pre-check', 'Digital QR custody receipt']
    },
    {
      id: 'paris-card-2026',
      type: 'convention',
      dateLabel: '28 - 29 NOV 2026',
      city: 'París',
      country: isEs ? 'Francia' : 'France',
      title: 'Paris International Collector Expo',
      venue: 'Paris Expo Porte de Versailles · Hall 4',
      address: '1 Place de la Porte de Versailles, 75015 Paris',
      hours: '09:30 - 19:30',
      standInfo: 'Stand Gorilla #P-08',
      services: isEs 
        ? ['Admisión directa de colecciones', 'Revisión técnica en mano', 'Precinto de seguridad en valija']
        : ['Direct collection intake', 'Technical on-site review', 'Sealed tamper-proof case transfer']
    },
    {
      id: 'london-card-2026',
      type: 'convention',
      dateLabel: '12 - 13 DIC 2026',
      city: 'Londres',
      country: isEs ? 'Reino Unido' : 'United Kingdom',
      title: 'London International Card Show',
      venue: 'ExCeL London · Royal Victoria Dock',
      address: 'One Western Gateway, London E16 1XL',
      hours: '10:00 - 18:30',
      standInfo: 'Booth Gorilla #UK-21',
      services: isEs 
        ? ['Punto de entrega oficial UK', 'Escaneo previo de alta resolución', 'Trazabilidad directa a laboratorio']
        : ['Official UK intake hub', 'High-res pre-inspection', 'Direct laboratory tracking']
    },
    {
      id: 'barcelona-popup-2026',
      type: 'convention',
      dateLabel: '19 DIC 2026',
      city: 'Barcelona',
      country: isEs ? 'España' : 'Spain',
      title: 'Gorilla Pop-Up Lab Barcelona',
      venue: 'Espai Poblenou · Sala de Bóveda',
      address: 'Carrer de Pujades 102, 08005 Barcelona',
      hours: '11:00 - 20:00',
      standInfo: isEs ? 'Mostrador de Admisión Exclusiva' : 'Exclusive Intake Desk',
      services: isEs 
        ? ['Entrega presencial sin cita previa', 'Atención directa con el equipo técnico', 'Asesoramiento de sub-grados']
        : ['Walk-in submissions welcome', 'Direct technical team consultation', 'Sub-grade advice']
    },
    {
      id: 'milan-tcg-2027',
      type: 'convention',
      dateLabel: '16 - 17 ENE 2027',
      city: 'Milán',
      country: isEs ? 'Italia' : 'Italy',
      title: 'Milano TCG & Numismatic Expo',
      venue: 'Fiera Milano City · Gate 3',
      address: 'Piazzale Carlo Magno 1, 20149 Milano',
      hours: '09:00 - 19:00',
      standInfo: 'Stand Gorilla #IT-12',
      services: isEs 
        ? ['Admisión internacional', 'Emisión de recibo digital inmediato', 'Tránsito blindado']
        : ['International intake', 'Instant digital receipt', 'Armored custody transport']
    }
  ];

  const partnerHubs: EventEntry[] = [
    {
      id: 'hub-madrid-centro',
      type: 'hub',
      dateLabel: isEs ? 'PERMANENTE' : 'PERMANENT',
      city: 'Madrid',
      country: isEs ? 'España' : 'Spain',
      title: 'Metropolis TCG Vault',
      venue: isEs ? 'Punto Permanente de Entrega' : 'Permanent Drop-Off Hub',
      address: 'Calle del Arenal 8, 28013 Madrid',
      hours: 'Lun - Sáb: 11:00 - 20:30',
      standInfo: isEs ? 'Urna de Custodia Oficial' : 'Official Custody Vault',
      services: isEs 
        ? ['Entrega presencial todo el año', 'Sin costes de envío de ida', 'Comprobante de depósito firmado']
        : ['Year-round physical drop-off', 'Zero inbound shipping cost', 'Signed deposit receipt']
    },
    {
      id: 'hub-lisboa-centro',
      type: 'hub',
      dateLabel: isEs ? 'PERMANENTE' : 'PERMANENT',
      city: 'Lisboa',
      country: 'Portugal',
      title: 'Lisboa Collectibles Hub',
      venue: isEs ? 'Punto Permanente de Entrega' : 'Permanent Drop-Off Hub',
      address: 'Avenida da Liberdade 142, 1250-146 Lisboa',
      hours: 'Mar - Sáb: 10:30 - 19:30',
      standInfo: isEs ? 'Punto Asociado Autorizado' : 'Authorized Partner Desk',
      services: isEs 
        ? ['Recogida quincenal por mensajería blindada', 'Recepción de paquetes precintados', 'Trazabilidad online']
        : ['Bi-weekly armored courier pickup', 'Sealed package intake', 'Online portal tracking']
    },
    {
      id: 'hub-valencia-centro',
      type: 'hub',
      dateLabel: isEs ? 'PERMANENTE' : 'PERMANENT',
      city: 'Valencia',
      country: isEs ? 'España' : 'Spain',
      title: 'Turia TCG Space',
      venue: isEs ? 'Punto Permanente de Entrega' : 'Permanent Drop-Off Hub',
      address: 'Carrer de Colón 24, 46004 Valencia',
      hours: 'Lun - Vie: 10:00 - 14:00, 16:30 - 20:00',
      standInfo: isEs ? 'Punto Asociado Autorizado' : 'Authorized Partner Desk',
      services: isEs 
        ? ['Depósito gratuito para pedidos web', 'Confirmación por correo en 24h', 'Precinto de seguridad']
        : ['Free drop-off for online orders', 'Email confirmation in 24h', 'Security seal verification']
    }
  ];

  const currentList = activeTab === 'convention' ? conventions : partnerHubs;

  const handleDownloadIcs = (event: EventEntry) => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gorilla Grading//Events//EN',
      'BEGIN:VEVENT',
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
              ? 'Entrega tus cartas en mano a nuestros graduadores en ferias especializadas o en tiendas asociadas permanentes. Sin riesgos de mensajería postal y con confirmación inmediata de custodia.'
              : 'Hand-deliver your collectibles directly to our grading team at major conventions or permanent partner shops. Eliminate shipping friction and receive instant digital proof of custody.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 mb-8 border-b border-black/10 dark:border-white/10 pb-4">
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
        <div className="space-y-4 mb-16">
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
