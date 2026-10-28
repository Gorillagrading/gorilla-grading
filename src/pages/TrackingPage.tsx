import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ScanLine } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { SlabTimelineIcon } from '../components/common/SlabTimelineIcon';
import { OrderResults } from '../components/common/OrderResults';
import { PaymentPanel } from '../components/common/PaymentPanel';
import { HandoverPanel } from '../components/common/HandoverPanel';
import { api, ApiError } from '../api/client';
import type { TrackingDto } from '../../shared/tracking';
import { cardTitle } from '../../shared/cards';
import { STATUS_LABEL, STEP_COPY } from '../utils/orderStatus';

interface TrackingPageProps {
  onNavigate: (path: string) => void;
}

type LookupError = 'not_found' | 'rate_limited' | 'network' | 'other';

interface UiStep {
  key: string;
  label: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current: boolean;
}

export const TrackingPage: React.FC<TrackingPageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const es = language === 'es';
  const lang = es ? 'es' : 'en';

  const [searchTracking, setSearchTracking] = useState('');
  const [tracking, setTracking] = useState<TrackingDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ kind: LookupError; query: string } | null>(null);
  /** Resultado al volver de la página de pago de Stripe (?payment=success|cancelled). */
  const [paymentReturn, setPaymentReturn] = useState<'success' | 'cancelled' | null>(null);

  const errorMsg = !error
    ? ''
    : error.kind === 'not_found'
      ? (es ? `No hemos encontrado ningún pedido con "${error.query}".` : `No order found for "${error.query}".`)
      : error.kind === 'rate_limited'
        ? (es ? 'Demasiadas consultas seguidas. Espera unos minutos.' : 'Too many lookups in a row. Please wait a few minutes.')
        : error.kind === 'network'
          ? (es ? 'No se pudo conectar con el servidor.' : 'Could not reach the server.')
          : (es ? 'Algo salió mal. Inténtalo de nuevo.' : 'Something went wrong. Please try again.');

  const lookup = async (raw: string) => {
    const query = raw.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const { tracking } = await api<{ tracking: TrackingDto }>(`/tracking/${encodeURIComponent(query)}`);
      setTracking(tracking);
      // La dirección queda con el código para poder recargar o compartir el enlace.
      window.history.replaceState(window.history.state, '', `/track?code=${encodeURIComponent(tracking.code)}`);
    } catch (err) {
      setTracking(null);
      const kind: LookupError =
        err instanceof ApiError
          ? err.status === 404 ? 'not_found' : err.status === 429 ? 'rate_limited' : err.code === 'network' ? 'network' : 'other'
          : 'other';
      setError({ kind, query: query.toUpperCase() });
    } finally {
      setLoading(false);
    }
  };

  // Si llega un código en la dirección (por ejemplo desde la cuenta), se consulta al abrir la página.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || params.get('id') || params.get('tracking');
    const payment = params.get('payment');
    if (payment === 'success' || payment === 'cancelled') setPaymentReturn(payment);
    if (code) {
      setSearchTracking(code);
      void lookup(code);
    }
  }, []);

  /** Vuelve a leer el pedido sin tocar la búsqueda (por ejemplo, mientras se confirma un pago). */
  const refresh = useCallback(async () => {
    if (!tracking) return;
    try {
      const { tracking: fresh } = await api<{ tracking: TrackingDto }>(`/tracking/${encodeURIComponent(tracking.code)}`);
      setTracking(fresh);
    } catch {
      // Se reintenta en la siguiente vuelta.
    }
  }, [tracking]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void lookup(searchTracking);
  };

  const resetSearch = () => {
    setTracking(null);
    setSearchTracking('');
    setError(null);
    window.history.replaceState(window.history.state, '', '/track');
  };

  const locale = es ? 'es-ES' : 'en-GB';
  const formatDate = (value: string) =>
    new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Los eventos que ya ocurrieron, seguidos de las fases que faltan.
  const uiSteps: UiStep[] = tracking
    ? [
        ...tracking.steps.map((step, i) => ({
          key: `event-${i}`,
          label: step.label,
          description: step.description,
          timestamp: formatDateTime(step.occurredAt),
          completed: step.state === 'completed',
          current: step.state === 'current',
        })),
        ...tracking.pending.map((status) => ({
          key: `pending-${status}`,
          label: STEP_COPY[status]?.label[lang] ?? STATUS_LABEL[status][lang],
          description: STEP_COPY[status]?.description[lang] ?? '',
          completed: false,
          current: false,
        })),
      ]
    : [];

  return (
    <div className={`w-full min-h-screen flex flex-col font-sans selection:bg-[#48C765] selection:text-[#14170F] transition-colors duration-300 ${
      isLight ? 'bg-[#F3EFE6] text-[#1C201D]' : 'bg-[#454545] text-white'
    }`}>
      
      {/* With a tracked order: compact search header + order details & custody timeline */}
      {tracking ? (
        <>
          {/* Editorial Search Section - Compact header when viewing an order */}
          <section className={`w-full pt-3.5 sm:pt-4 pb-3.5 px-6 lg:px-12 border-b transition-colors duration-300 ${
            isLight ? 'bg-[#F3EFE6] border-black/[0.06]' : 'bg-[#454545] border-white/[0.04]'
          }`}>
            <div className="w-full max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4 lg:gap-8">
              <div className="flex flex-col max-w-xl w-full">
                <div className={`flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] uppercase mb-1 ${
                  isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'
                }`}>
                  <ScanLine className="w-3.5 h-3.5" />
                  <span>{language === 'es' ? 'Seguimiento de Custodia' : 'Chain of Custody Tracker'}</span>
                </div>
                <h1 className={`font-['Nunito',sans-serif] text-base md:text-lg font-[900] uppercase tracking-normal mb-2 ${
                  isLight ? 'text-[#1C201D]' : 'text-white'
                }`}>
                  {language === 'es' ? 'ESTADO EN TIEMPO REAL' : 'LIVE ORDER STATUS'}
                </h1>
              
                <form onSubmit={handleSearch} className="relative w-full max-w-md group">
                  <input
                    type="text"
                    placeholder={language === 'es' ? 'INTRODUCE Nº SEGUIMIENTO O ID' : 'ENTER TRACKING # OR ORDER ID'}
                    value={searchTracking}
                    onChange={(e) => setSearchTracking(e.target.value)}
                    className={`w-full bg-transparent border-b px-0 py-1 text-xs md:text-sm transition-colors font-mono uppercase tracking-widest pr-8 focus:outline-none ${
                      isLight 
                        ? 'border-black/20 text-[#1C201D] placeholder:text-[#1C201D]/40 focus:border-[#2D9A46]' 
                        : 'border-white/20 text-white placeholder-white/30 focus:border-[#48C765]'
                    }`}
                  />
                  <button 
                    type="submit"
                    aria-label="Search"
                    disabled={loading}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${
                      isLight 
                        ? 'text-[#1C201D]/50 group-focus-within:text-[#2D9A46] hover:text-[#2D9A46]' 
                        : 'text-white/50 group-focus-within:text-[#48C765] hover:text-[#48C765]'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
                {errorMsg && (
                  <span className="text-red-500 font-mono text-[9px] tracking-widest uppercase mt-1">
                    {errorMsg}
                  </span>
                )}
              </div>
            </div>
          </section>

          <PaymentPanel
            code={tracking.code}
            status={tracking.status}
            isOwner={!!tracking.items}
            paymentReturn={paymentReturn}
            lang={lang}
            isLight={isLight}
            onRefresh={refresh}
            onNavigate={onNavigate}
          />

          {/* Tras pagar: adónde enviar las cartas o en qué evento entregarlas */}
          {tracking.handover && (tracking.status === 'SUBMITTED' || paymentReturn === 'success') && (
            <HandoverPanel code={tracking.code} handover={tracking.handover} lang={lang} isLight={isLight} />
          )}

          {/* Results: Order data + Custody Timeline */}
          <section className={`w-full flex-1 py-6 sm:py-8 px-6 lg:px-12 transition-colors duration-300 ${
            isLight ? 'bg-[#ECE5D8]' : 'bg-[#383838]'
          }`}>
            <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-14 items-start">
              
              {/* Left Column: Order Data */}
              <div className="lg:col-span-4 flex flex-col gap-5">
                
                <div className={`flex flex-col pb-5 border-b ${isLight ? 'border-black/10' : 'border-white/10'}`}>
                  <button
                    type="button"
                    onClick={resetSearch}
                    className={`font-mono text-[9px] uppercase tracking-wider mb-2 text-left flex items-center gap-1 transition-colors cursor-pointer ${
                      isLight ? 'text-gray-500 hover:text-[#16A34A]' : 'text-gray-400 hover:text-[#4ADE80]'
                    }`}
                  >
                    ← {language === 'es' ? 'CONSULTAR OTRO PEDIDO' : 'SEARCH ANOTHER ORDER'}
                  </button>

                  <span className={`font-mono text-[10px] tracking-[0.2em] uppercase mb-2 font-bold ${
                    isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'
                  }`}>
                    STATUS // {STATUS_LABEL[tracking.status][lang].toUpperCase()}
                  </span>
                  <h2 className={`font-['Nunito',sans-serif] text-lg md:text-xl font-[900] uppercase leading-[1.1] mb-3 ${
                    isLight ? 'text-[#1C201D]' : 'text-white'
                  }`}>
                    ORDER #{tracking.code}
                  </h2>

                  <div className={`flex flex-col gap-2.5 font-mono text-[10px] tracking-[0.15em] uppercase ${
                    isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                  }`}>
                    <div className={`flex justify-between border-b pb-1.5 ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                      <span className={isLight ? 'text-[#1C201D]/55 font-semibold' : 'text-white/40'}>Carrier</span>
                      <span className={`font-medium ${isLight ? 'text-[#1C201D]' : 'text-white'}`}>{tracking.carrier ?? '—'}</span>
                    </div>
                    <div className={`flex justify-between border-b pb-1.5 ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                      <span className={isLight ? 'text-[#1C201D]/55 font-semibold' : 'text-white/40'}>Tracking</span>
                      <span className={`font-medium ${isLight ? 'text-[#1C201D]' : 'text-white'}`}>{tracking.trackingNumber ?? '—'}</span>
                    </div>
                    <div className={`flex justify-between border-b pb-1.5 ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                      <span className={isLight ? 'text-[#1C201D]/55 font-semibold' : 'text-white/40'}>Placed</span>
                      <span className={`font-medium ${isLight ? 'text-[#1C201D]' : 'text-white'}`}>{formatDate(tracking.submittedAt)}</span>
                    </div>
                    <div className={`flex justify-between border-b pb-1.5 ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                      <span className={isLight ? 'text-[#1C201D]/55 font-semibold' : 'text-white/40'}>Completion Date</span>
                      <span className={`font-bold ${isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}`}>{tracking.estimatedCompletionAt ? formatDate(tracking.estimatedCompletionAt) : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className={`font-mono text-[10px] tracking-[0.2em] uppercase font-bold mb-4 ${
                    isLight ? 'text-[#1C201D]/60' : 'text-white/40'
                  }`}>
                    {language === 'es' ? 'Cartas en Lote' : 'Cards in Batch'} ({tracking.itemCount})
                  </span>
                  
                  {tracking.items ? (
                    <div className="flex flex-col gap-4">
                      {tracking.items.map((item) => (
                        <div key={item.position} className="flex items-center gap-4">
                          <span className={`font-mono text-[9px] w-4 ${isLight ? 'text-[#1C201D]/40' : 'text-white/30'}`}>{String(item.position).padStart(2, '0')}</span>
                          <div className="flex flex-col min-w-0">
                            <span className={`font-mono text-xs uppercase tracking-widest truncate max-w-[220px] font-semibold ${
                              isLight ? 'text-[#1C201D]' : 'text-white'
                            }`}>
                              {cardTitle(item.cardName, item.position, lang)}
                            </span>
                            <span className={`font-mono text-[9px] uppercase tracking-widest ${
                              isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                            }`}>
                              {item.game ? `${item.game}${item.set ? ` • ${item.set}` : ''}` : es ? 'La identifica el laboratorio al recibirla' : 'Identified by the lab on arrival'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`font-sans text-xs leading-relaxed ${isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'}`}>
                      {es ? 'Por privacidad, el detalle de las cartas solo lo ve el dueño del pedido.' : 'For privacy, only the order owner can see which cards it includes.'}{' '}
                      <button
                        type="button"
                        onClick={() => onNavigate('/login')}
                        className={`underline underline-offset-4 cursor-pointer ${isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}`}
                      >
                        {es ? 'Iniciar sesión' : 'Sign in'}
                      </button>
                    </p>
                  )}
                </div>

              </div>

              {/* Right Column: Timeline (High-contrast, mobile-friendly design) */}
              <div className="lg:col-span-8 flex flex-col">
                <span className={`font-mono text-[10px] tracking-[0.2em] uppercase font-bold mb-5 ${
                  isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'
                }`}>
                  {language === 'es' ? 'Línea de Tiempo de Custodia' : 'Chain of Custody Timeline'}
                </span>

                <div className={`flex flex-col relative border-l ml-2 ${
                  isLight ? 'border-black/15' : 'border-white/10'
                }`}>
                  {uiSteps.map((step, idx) => {
                    const isLast = idx === uiSteps.length - 1;
                    const isFinalCompleted = isLast && (step.completed || tracking.status === 'DELIVERED');
                    
                    return (
                      <div 
                        key={step.key}
                        className={`relative pl-8 sm:pl-10 group transition-all ${
                          isLast ? 'pb-1' : 'pb-6 sm:pb-7'
                        }`}
                      >
                        {/* Node Marker: Slab Card Icon con carta coleccionable y titileo activo */}
                        <div className={`absolute left-0 top-0.5 -translate-x-1/2 flex items-center justify-center p-0.5 z-10 ${
                          isLight ? 'bg-[#ECE5D8]' : 'bg-[#383838]'
                        }`}>


                          <SlabTimelineIcon
                            status={step.current ? 'current' : step.completed ? 'completed' : 'pending'}
                            isLight={isLight}
                            size="md"
                            isFinal={isFinalCompleted}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1">
                          <h4 className={`font-['Nunito',sans-serif] text-base uppercase tracking-normal leading-tight font-[800] transition-colors ${
                            isFinalCompleted
                              ? (isLight ? 'text-amber-600' : 'text-amber-400')
                              : step.current 
                                ? (isLight ? 'text-[#16A34A]' : 'text-[#4ADE80]') 
                                : step.completed 
                                  ? (isLight ? 'text-[#1C201D]' : 'text-white') 
                                  : (isLight ? 'text-[#1C201D]/40' : 'text-white/30')
                          }`}>
                            {step.label}
                          </h4>

                          {step.timestamp && (
                            <span className={`font-mono text-[9.5px] tracking-widest uppercase shrink-0 font-medium ${
                              isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                            }`}>
                              {step.timestamp}
                            </span>
                          )}
                        </div>
                        
                        <p className={`font-sans text-xs leading-relaxed max-w-xl ${
                          step.completed || step.current 
                            ? (isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]') 
                            : (isLight ? 'text-[#1C201D]/40' : 'text-white/30')
                        }`}>
                          {step.description}
                        </p>

                        {/* Connecting line highlight for completed segments */}
                        {step.completed && !isLast && (
                          <div className={`absolute left-0 top-7 bottom-0 -translate-x-[50%] w-[1.5px] ${
                            isLight ? 'bg-[#2D9A46]/60' : 'bg-white/40'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </section>

          {/* Resultados de graduación: solo para el dueño y cuando el pedido ya salió del laboratorio */}
          {tracking.items && <OrderResults code={tracking.code} lang={lang} isLight={isLight} />}
        </>
      ) : (
        /* Empty / Centered Search State - Clean, minimal, zero clutter */
        <section className={`w-full flex-1 flex flex-col items-center justify-center py-20 px-6 transition-colors duration-300 ${
          isLight ? 'bg-[#ECE5D8]' : 'bg-[#383838]'
        }`}>
          <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center">
            
            <div className={`flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] uppercase mb-3 ${
              isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'
            }`}>
              <ScanLine className="w-4 h-4" />
              <span>{language === 'es' ? 'Seguimiento de Custodia' : 'Chain of Custody'}</span>
            </div>

            <h1 className={`font-['Nunito',sans-serif] text-3xl sm:text-4xl md:text-5xl font-[900] uppercase tracking-normal mb-8 ${
              isLight ? 'text-[#1C201D]' : 'text-white'
            }`}>
              {language === 'es' ? 'SEGUIMIENTO EN TIEMPO REAL' : 'LIVE ORDER TRACKING'}
            </h1>

            <form onSubmit={handleSearch} className="relative w-full group mb-4">
              <input
                type="text"
                autoFocus
                placeholder={language === 'es' ? 'INTRODUCE Nº SEGUIMIENTO O ID' : 'ENTER TRACKING # OR ORDER ID'}
                value={searchTracking}
                onChange={(e) => setSearchTracking(e.target.value)}
                className={`w-full bg-transparent border-b-2 px-1 py-3 text-sm sm:text-base transition-colors font-mono uppercase tracking-widest pr-10 focus:outline-none ${
                  isLight 
                    ? 'border-black/30 text-[#1C201D] placeholder:text-[#1C201D]/40 focus:border-[#2D9A46]' 
                    : 'border-white/30 text-white placeholder-white/40 focus:border-[#48C765]'
                }`}
              />
              <button 
                type="submit"
                aria-label="Search"
                    disabled={loading}
                className={`absolute right-1 top-1/2 -translate-y-1/2 transition-colors cursor-pointer p-1 ${
                  isLight 
                    ? 'text-[#1C201D]/60 group-focus-within:text-[#2D9A46] hover:text-[#2D9A46]' 
                    : 'text-white/60 group-focus-within:text-[#48C765] hover:text-[#48C765]'
                }`}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {errorMsg && (
              <span className="text-red-500 font-mono text-[10px] tracking-widest uppercase mb-4">
                {errorMsg}
              </span>
            )}

          </div>
        </section>
      )}
    </div>
  );
};

