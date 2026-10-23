import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchCards, fetchOrders, fetchPayments } from '../api/account';
import type { OrderSummaryDto, PaymentReceiptDto } from '../../shared/account';
import { PaymentReceipts } from '../components/common/PaymentReceipts';
import type { OrderStatus } from '../../shared/domain';
import type { GradedCard } from '../types';
import { STATUS_LABEL } from '../utils/orderStatus';
import { SlabCard } from '../components/common/SlabCard';
import { SlabTimelineIcon } from '../components/common/SlabTimelineIcon';

interface CollectorVaultPageProps {
  onNavigate: (path: string) => void;
}

/** Estados en los que el pedido sigue en curso: no está entregado, cancelado ni devuelto. */
const IN_PROGRESS: OrderStatus[] = [
  'SUBMITTED', 'PAYMENT_PENDING', 'PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING',
  'ENCAPSULATION', 'QUALITY_ASSURANCE', 'SHIPPED', 'ON_HOLD',
];

/**
 * Fase en curso de las 5 que muestra el recorrido (recepción, inspección, sub-grados,
 * graduación, encapsulado). -1 si ya terminaron todas o el pedido está en pausa.
 */
function currentStage(status: OrderStatus): number {
  switch (status) {
    case 'SUBMITTED':
    case 'PAYMENT_PENDING':
      return 0;
    case 'PACKAGE_RECEIVED':
    case 'PRE_INSPECTION':
      return 1;
    case 'OPTICAL_GRADING':
      return 2;
    case 'ENCAPSULATION':
      return 4;
    default:
      return -1;
  }
}

/** Panel para mensajes de carga, error y listas vacías. */
const EmptyPanel: React.FC<{
  isLight: boolean;
  title: string;
  text: string;
  action?: { label: string; onClick: () => void };
}> = ({ isLight, title, text, action }) => (
  <div
    className={`border rounded-xl p-8 sm:p-12 flex flex-col items-center text-center gap-3 ${
      isLight ? 'bg-white border-[#E2DBD0] shadow-sm' : 'bg-[#383838] border-[#4E4E4E]'
    }`}
  >
    <h3 className={`font-['Nunito',sans-serif] text-xl sm:text-2xl uppercase font-[900] ${isLight ? 'text-[#14170F]' : 'text-white'}`}>
      {title}
    </h3>
    <p className={`text-sm max-w-md leading-relaxed ${isLight ? 'text-neutral-600' : 'text-[#D1D5DB]'}`}>{text}</p>
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className={`mt-3 py-3 px-5 rounded-lg text-xs font-['Nunito',sans-serif] font-[900] tracking-wider uppercase cursor-pointer transition-all ${
          isLight ? 'bg-[#15803D] hover:bg-[#166534] text-white' : 'bg-[#61B663] hover:bg-[#48C765] text-[#111311]'
        }`}
      >
        {action.label}
      </button>
    )}
  </div>
);

export const CollectorVaultPage: React.FC<CollectorVaultPageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLight = theme === 'light';
  const es = language === 'es';
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'vault' | 'invoices'>('overview');
  const [filterGame, setFilterGame] = useState('ALL');

  const [data, setData] = useState<{ orders: OrderSummaryDto[]; cards: GradedCard[] } | null>(null);
  /** Los pagos se cargan aparte: si fallan, el resto de la cuenta sigue funcionando. */
  const [paymentList, setPaymentList] = useState<PaymentReceiptDto[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(() => {
    setLoadFailed(false);
    Promise.all([fetchOrders(), fetchCards()])
      .then(([orders, cards]) => setData({ orders, cards }))
      .catch(() => setLoadFailed(true));
    fetchPayments()
      .then(setPaymentList)
      .catch(() => setPaymentList([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const userCards = data?.cards ?? [];
  const orders = data?.orders ?? [];
  const activeOrder = orders.find((o) => IN_PROGRESS.includes(o.status));
  const inProgressCount = orders.filter((o) => IN_PROGRESS.includes(o.status)).length;
  // En las listas el pedido en curso va primero; el resto conserva el orden por fecha.
  const allOrders = activeOrder ? [activeOrder, ...orders.filter((o) => o !== activeOrder)] : orders;

  const filteredCards = filterGame === 'ALL'
    ? userCards
    : userCards.filter(c => c.game.toUpperCase().includes(filterGame));

  const statusLabel = (status: OrderStatus) => STATUS_LABEL[status][es ? 'es' : 'en'];
  const locale = es ? 'es-ES' : 'en-GB';
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  // Datos de la persona. Una cuenta nueva todavía no tiene nombre: se usa la parte local del email.
  const displayName = user?.fullName || user?.email.split('@')[0] || '';
  const firstName = displayName.split(/\s+/)[0];
  const initials = (user?.fullName ? user.fullName.split(/\s+/).slice(0, 2).map((p) => p[0]).join('') : displayName.slice(0, 2)).toUpperCase();
  const memberSince = user ? new Date(user.createdAt).toLocaleDateString(locale, { month: 'long', year: 'numeric' }) : '';

  // Fase en curso del pedido activo y cuántas fases ya están completadas.
  const stage = activeOrder ? currentStage(activeOrder.status) : -1;
  const stagesDone = !activeOrder ? 0 : stage >= 0 ? stage : activeOrder.status === 'ON_HOLD' ? 0 : 5;

  // TABS
  const tabs = [
    { id: 'overview', index: '01', label: es ? 'RESUMEN' : 'OVERVIEW', count: null },
    { id: 'submissions', index: '02', label: es ? 'EXPEDIENTES' : 'ORDERS', count: data ? `${allOrders.length}` : null },
    { id: 'vault', index: '03', label: es ? 'BÓVEDA DIGITAL' : 'GRADED VAULT', count: data ? `${userCards.length}` : null },
    { id: 'invoices', index: '04', label: es ? 'PAGOS Y RECIBOS' : 'PAYMENTS', count: paymentList ? `${paymentList.length}` : null },
  ];

  const renderOrderStatusBadge = (status: string, isActive: boolean) => {
    switch (status) {
      case 'OPTICAL_GRADING':
        return (
          <div className="flex items-start gap-2.5 select-none text-left py-1">
            {/* Metrological Status Line Bar */}
            <div className="w-1 self-stretch bg-[#15803D] dark:bg-[#48C765] shrink-0 mt-0.5" />
            
            <div className="flex flex-col min-w-0">
              {/* Technical Protocol Header */}
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] leading-none">
                <span className="font-extrabold text-[#15803D] dark:text-[#48C765]">
                  {language === 'es' ? 'FASE 03 · ACTIVO' : 'STAGE 03 · ACTIVE'}
                </span>
                <span className="text-neutral-400 font-light">/</span>
                <span className="text-[#15803D] dark:text-[#48C765] font-medium">
                  1200 DPI
                </span>
              </div>

              {/* Main Status Title */}
              <span className={`font-['Nunito',sans-serif] text-sm sm:text-base font-[900] tracking-normal uppercase mt-1 leading-tight ${
                isLight ? 'text-[#14170F]' : 'text-white'
              }`}>
                {language === 'es' ? 'Peritaje Óptico Espectral' : 'Spectral Optical Audit'}
              </span>

              {/* Detail Telemetry Footnote */}
              <span className={`font-mono text-[10px] mt-0.5 leading-tight ${
                isLight ? 'text-neutral-600' : 'text-[#A4ACA1]'
              }`}>
                {language === 'es' 
                  ? 'Calibre láser 4 cuadrantes en curso' 
                  : '4-quadrant micrometric laser active'}
              </span>
            </div>
          </div>
        );

      case 'DELIVERED':
        return (
          <div className="flex items-start gap-2.5 select-none text-left py-1">
            {/* Archival Vault Status Line Bar */}
            <div className={`w-1 self-stretch shrink-0 mt-0.5 ${
              isLight ? 'bg-[#52594F]' : 'bg-neutral-500'
            }`} />
            
            <div className="flex flex-col min-w-0">
              {/* Technical Protocol Header */}
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] leading-none">
                <span className={`font-extrabold ${
                  isLight ? 'text-[#3E443A]' : 'text-neutral-300'
                }`}>
                  {language === 'es' ? 'REGISTRO COMPLETADO' : 'PROTOCOL COMPLETED'}
                </span>
                <span className="text-neutral-400 font-light">/</span>
                <span className={`font-medium ${
                  isLight ? 'text-[#3E443A]' : 'text-neutral-300'
                }`}>
                  {language === 'es' ? 'CUSTODIADO' : 'VAULTED'}
                </span>
              </div>

              {/* Main Status Title */}
              <span className={`font-['Nunito',sans-serif] text-sm sm:text-base font-[900] tracking-normal uppercase mt-1 leading-tight ${
                isLight ? 'text-[#14170F]' : 'text-white'
              }`}>
                {language === 'es' ? 'Entregado en Bóveda' : 'Vaulted & Secured'}
              </span>

              {/* Detail Telemetry Footnote */}
              <span className={`font-mono text-[10px] mt-0.5 leading-tight ${
                isLight ? 'text-neutral-600' : 'text-[#A4ACA1]'
              }`}>
                {language === 'es' 
                  ? 'Custodia blindada certificada' 
                  : 'Certified armored vault custody'}
              </span>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-2 py-1 select-none">
            <div className="w-1 h-6 bg-neutral-400 shrink-0" />
            <span className={`font-['Nunito',sans-serif] text-sm font-[900] uppercase tracking-normal ${
              isLight ? 'text-[#14170F]' : 'text-white'
            }`}>
              {STATUS_LABEL[status as OrderStatus]?.[es ? 'es' : 'en'] ?? status}
            </span>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen pt-24 pb-20 relative overflow-hidden flex flex-col transition-colors duration-300 ${
      isLight ? 'bg-[#F9F7F2] text-[#111827]' : 'bg-[#111311] text-[#F5F6F2]'
    }`}>
      
      {/* Background Ambience (Brand Subtle Glow) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#61B663]/[0.03] blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-white/[0.015] blur-[160px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12 relative z-10 flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* LEFT COLUMN: Sidebar Profile & Command Dossier */}
        <aside className="lg:w-[320px] shrink-0 flex flex-col gap-6 lg:gap-7">
          
          {/* Institutional Collector Credential Folio (Brand Gray Card) */}
          <div 
            className={`border rounded-xl relative overflow-hidden transition-all duration-300 shadow-md p-5 sm:p-6 flex flex-col gap-5 ${
              isLight 
                ? 'bg-[#FAF8F5] border-[#D8D2C5] text-[#14170F]' 
                : 'bg-[#383838] border-[#4E4E4E] text-[#F5F6F2]'
            }`}
          >
            {/* Profile Identity Lockup */}
            <div className="flex items-center gap-4 relative z-10">
              {/* Prestigious Monogram Badge */}
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border flex items-center justify-center font-['Nunito',sans-serif] font-[900] shrink-0 shadow-sm transition-colors ${
                isLight 
                  ? 'border-[#D8D2C5] bg-white text-[#14170F]' 
                  : 'border-[#4E4E4E] bg-[#2A2A2A] text-white'
              }`}>
                <span className="text-xl sm:text-2xl font-bold tracking-wider">{initials}</span>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-mono tracking-wider ${isLight ? 'text-neutral-500' : 'text-[#8C9185]'}`}>
                    #{user?.customerCode ?? ''}
                  </span>
                </div>
                
                <h1 className="font-['Nunito',sans-serif] text-2xl uppercase tracking-normal leading-tight truncate font-[900]">
                  {displayName}
                </h1>
                <span className={`text-[11px] mt-0.5 truncate ${isLight ? 'text-neutral-500' : 'text-[#8C9185]'}`}>
                  {user?.email}
                </span>
              </div>
            </div>

            {/* Collector Specification Matrix */}
            <div className={`space-y-2.5 border-t border-b py-3.5 text-xs relative z-10 ${
              isLight ? 'border-black/10 text-[#3E443A]' : 'border-[#4E4E4E] text-[#E2E8F0]'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`text-[10px] uppercase tracking-wide ${isLight ? 'text-neutral-500' : 'text-[#8C9185]'}`}>
                  {language === 'es' ? 'Expediente Cliente' : 'Client ID'}
                </span>
                <span className="font-mono font-semibold text-current">#{user?.customerCode ?? ''}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={`text-[10px] uppercase tracking-wide ${isLight ? 'text-neutral-500' : 'text-[#8C9185]'}`}>
                  {language === 'es' ? 'Cliente desde' : 'Member since'}
                </span>
                <span className="font-medium text-current">
                  {memberSince} · {es ? 'Verificado' : 'Verified'}
                </span>
              </div>

            </div>

            {/* Gorilla Grading Submission Action Button */}
            <button
              type="button"
              onClick={() => onNavigate('/submit')}
              className={`w-full py-3.5 px-4 rounded-lg text-xs font-['Nunito',sans-serif] font-[900] tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all duration-200 group relative z-10 ${
                isLight
                  ? 'bg-[#15803D] hover:bg-[#166534] text-white'
                  : 'bg-[#61B663] hover:bg-[#48C765] text-[#111311] font-extrabold shadow-sm'
              }`}
            >
              <span>{language === 'es' ? 'NUEVO ENVÍO' : 'NEW SUBMISSION'}</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* Dossier Navigation Tabs */}
          <nav className="flex flex-col gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative w-full p-3.5 sm:p-4 text-left border rounded-lg transition-all duration-200 flex items-center justify-between cursor-pointer select-none ${
                    isActive
                      ? (isLight 
                          ? 'bg-white text-[#14170F] border-[#16A34A] shadow-md ring-1 ring-[#16A34A]/10' 
                          : 'bg-[#383838] text-white border-white/20 shadow-sm')
                      : (isLight 
                          ? 'bg-[#FAF8F5] hover:bg-white border-[#D8D2C5] text-[#3E453D] hover:text-[#14170F]' 
                          : 'bg-[#2A2A2A] hover:bg-[#383838] border-[#4E4E4E] text-[#A4ACA1] hover:text-white')
                  }`}
                >
                  {/* Left Active Indicator Notch */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r bg-[#16A34A] dark:bg-[#48C765]" />
                  )}

                  <div className="flex items-center gap-3 pl-1.5">
                    <span className={`text-[11px] font-bold font-mono tracking-wider ${
                      isActive 
                        ? (isLight ? 'text-[#15803D]' : 'text-[#4ADE80]') 
                        : (isLight ? 'text-neutral-400' : 'text-[#8C9185]')
                    }`}>
                      {tab.index}
                    </span>
                    <span className={`text-xs font-['Nunito',sans-serif] uppercase tracking-wide ${
                      isActive 
                        ? (isLight ? 'text-[#14170F] font-[900]' : 'text-white font-[900]') 
                        : (isLight ? 'text-[#3E453D] font-[700]' : 'text-[#A4ACA1] font-[700]')
                    }`}>
                      {tab.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {tab.count && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        isActive 
                          ? (isLight ? 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/25 font-bold' : 'bg-white/10 text-white border-white/15')
                          : (isLight ? 'bg-black/[0.04] text-neutral-600 border-black/10' : 'bg-white/[0.05] text-[#8C9185] border-[#343931]')
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    <svg 
                      className={`w-3.5 h-3.5 transition-transform ${
                        isActive 
                          ? (isLight ? 'translate-x-0 opacity-100 text-[#15803D]' : 'translate-x-0 opacity-100 text-white') 
                          : (isLight ? 'opacity-40 text-neutral-400 group-hover:opacity-80 group-hover:text-[#14170F] group-hover:translate-x-0.5' : 'opacity-30 text-neutral-400 group-hover:opacity-70 group-hover:text-white group-hover:translate-x-0.5')
                      }`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* RIGHT COLUMN: Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* Carga de los datos de la cuenta */}
          {!data && (
            <EmptyPanel
              isLight={isLight}
              title={loadFailed ? (es ? 'No se pudo cargar tu cuenta' : 'Could not load your account') : (es ? 'Cargando tu cuenta…' : 'Loading your account…')}
              text={loadFailed ? (es ? 'Comprueba tu conexión e inténtalo de nuevo.' : 'Check your connection and try again.') : ''}
              action={loadFailed ? { label: es ? 'Reintentar' : 'Retry', onClick: load } : undefined}
            />
          )}

          {/* TAB: OVERVIEW */}
          {data && activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              
              {/* Premium Greeting Banner (User Gray Card #383838) */}
              <div className={`relative overflow-hidden rounded-xl border p-7 sm:p-8 transition-colors ${
                isLight 
                  ? 'bg-white border-[#E2DBD0] shadow-sm' 
                  : 'bg-[#383838] border-[#4E4E4E] shadow-md'
              }`}>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className={`w-3.5 h-[1.5px] ${isLight ? 'bg-[#15803D]' : 'bg-[#61B663]'}`} />
                      <span className={`font-mono font-bold text-[10px] uppercase tracking-[0.2em] ${
                        isLight ? 'text-[#15803D]' : 'text-[#61B663]'
                      }`}>
                        {language === 'es' ? 'BÓVEDA PROTEGIDA & CONECTADA' : 'VAULT PROTECTED & CONNECTED'}
                      </span>
                    </div>
                    <h2 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl uppercase tracking-normal leading-tight mb-2 font-[900] ${
                      isLight ? 'text-[#14170F]' : 'text-white'
                    }`}>
                      {language === 'es' ? 'Bienvenido,' : 'Welcome,'} <span className={isLight ? 'text-neutral-500' : 'text-[#D1D5DB]'}>{firstName}</span>
                    </h2>
                    <p className={`text-sm max-w-lg leading-relaxed ${
                      isLight ? 'text-neutral-600' : 'text-[#D1D5DB]'
                    }`}>
                      {language === 'es' 
                        ? `Tu colección se encuentra custodiada bajo estándares de alta seguridad.${inProgressCount > 0 ? ` Tienes ${inProgressCount} ${inProgressCount === 1 ? 'expediente' : 'expedientes'} en proceso de evaluación y certificación.` : ''}` 
                        : `Your collection is protected under certified security standards.${inProgressCount > 0 ? ` You have ${inProgressCount} ${inProgressCount === 1 ? 'submission' : 'submissions'} undergoing evaluation and certification.` : ''}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Row (User Gray Cards #383838) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stat 1: Certified Slabs */}
                <div className={`border rounded-xl p-6 flex flex-col justify-between transition-colors ${
                  isLight 
                    ? 'bg-white border-[#E2DBD0] shadow-sm' 
                    : 'bg-[#383838] border-[#4E4E4E]'
                }`}>
                  <span className={`text-[11px] font-['Nunito',sans-serif] font-bold uppercase tracking-wider mb-4 ${
                    isLight ? 'text-neutral-400' : 'text-[#D1D5DB]'
                  }`}>
                    {language === 'es' ? 'Cartas Certificadas' : 'Certified Slabs'}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className={`font-['Nunito',sans-serif] text-4xl leading-none font-[900] ${
                      isLight ? 'text-[#14170F]' : 'text-white'
                    }`}>
                      {userCards.length}
                    </span>
                    <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                      {language === 'es' ? 'EN CUSTODIA' : 'IN VAULT'}
                    </span>
                  </div>
                </div>

                {/* Stat 2: Historical Orders */}
                <div className={`border rounded-xl p-6 flex flex-col justify-between transition-colors ${
                  isLight 
                    ? 'bg-white border-[#E2DBD0] shadow-sm' 
                    : 'bg-[#383838] border-[#4E4E4E]'
                }`}>
                  <span className={`text-[11px] font-['Nunito',sans-serif] font-bold uppercase tracking-wider mb-4 ${
                    isLight ? 'text-neutral-400' : 'text-[#D1D5DB]'
                  }`}>
                    {language === 'es' ? 'Expedientes & Envíos' : 'Historical Orders'}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className={`font-['Nunito',sans-serif] text-4xl leading-none font-[900] ${
                      isLight ? 'text-[#14170F]' : 'text-white'
                    }`}>
                      {allOrders.length}
                    </span>
                    <span className={`font-mono text-[10px] font-semibold tracking-wider uppercase ${
                      isLight ? 'text-neutral-500' : 'text-neutral-400'
                    }`}>
                      {language === 'es' ? 'EXPEDIENTES' : 'ORDERS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Order Tracker (User Gray Card #383838) */}
              {activeOrder && (
                <div className={`border rounded-xl p-6 md:p-8 relative transition-colors ${
                  isLight 
                    ? 'bg-white border-[#E2DBD0] shadow-sm' 
                    : 'bg-[#383838] border-[#4E4E4E] shadow-md'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2 font-mono text-xs">
                        <span className={`font-bold uppercase tracking-wider text-[11px] ${
                          isLight ? 'text-[#15803D]' : 'text-[#61B663]'
                        }`}>
                          {(es ? 'EXPEDIENTE EN PROCESO' : 'SUBMISSION IN PROGRESS') + ' · ' + statusLabel(activeOrder.status).toUpperCase()}
                        </span>
                        <span className={isLight ? 'text-black/30' : 'text-white/30'}>/</span>
                        <span className={`tracking-wider ${
                          isLight ? 'text-neutral-600' : 'text-[#D1D5DB]'
                        }`}>
                          ID: {activeOrder.code}
                        </span>
                      </div>
                      <h3 className={`font-['Nunito',sans-serif] text-2xl uppercase tracking-normal font-[900] ${
                        isLight ? 'text-[#14170F]' : 'text-white'
                      }`}>
                        {activeOrder.itemCount} {es ? (activeOrder.itemCount === 1 ? 'Carta' : 'Cartas') : (activeOrder.itemCount === 1 ? 'Card' : 'Cards')} · {statusLabel(activeOrder.status)}
                      </h3>
                    </div>
                    <button
                      onClick={() => onNavigate(`/track?code=${activeOrder?.code ?? ''}`)}
                      className={`font-['Nunito',sans-serif] font-[800] text-xs uppercase tracking-wider flex items-center gap-2 py-2 px-3.5 rounded-lg border transition-all cursor-pointer ${
                        isLight
                          ? 'bg-[#F4EFE6] text-[#14170F] border-[#D8D2C5] hover:bg-[#EAE4D7]'
                          : 'bg-[#2A2A2A] text-white border-[#4E4E4E] hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      <span>{language === 'es' ? 'Ver Rastreo Completo' : 'Live Tracking'}</span>
                      <span className="text-sm">→</span>
                    </button>
                  </div>

                  {/* Horizontal Slab Cards Timeline */}
                  <div className="overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-none">
                    <div className="min-w-[620px] sm:min-w-full relative py-3">
                      {/* Background Guide Line */}
                      <div className={`absolute top-[28px] left-[7%] right-[7%] h-[2px] ${
                        isLight ? 'bg-neutral-200' : 'bg-[#555555]'
                      }`} />
                      
                      {/* Active Progress Line */}
                      <div 
                        className="absolute top-[28px] left-[7%] h-[2px] bg-[#16A34A] dark:bg-[#61B663] transition-all duration-500" 
                        style={{ width: `${(Math.min(stagesDone, 4) / 4) * 86}%` }}
                      />

                      {/* Steps with Slab Cards */}
                      <div className="relative z-10 flex justify-between items-start">
                        {[
                          { id: 'RECEIVED', labelEs: 'Recepción', labelEn: 'Received', subEs: 'Ingreso verificado', subEn: 'Intake verified' },
                          { id: 'CLEANROOM', labelEs: 'Inspección', labelEn: 'Inspection', subEs: 'Sala limpia óptica', subEn: 'Cleanroom intake' },
                          { id: 'SPECTROMETRY', labelEs: 'Sub-Grados Láser', labelEn: 'Subgrading', subEs: 'Escaneo en curso', subEn: 'Laser scan active' },
                          { id: 'GRADING', labelEs: 'Graduación', labelEn: 'Grading', subEs: 'Cálculo de nota', subEn: 'Final score QA' },
                          { id: 'ENCAPSULATION', labelEs: 'Encapsulado', labelEn: 'Encapsulation', subEs: 'Sellado hermético', subEn: 'Sonic sealing' },
                        ].map((st, idx) => {
                          const isCompleted = idx < stagesDone;
                          const isCurrent = idx === stage;
                          const isPending = !isCompleted && !isCurrent;

                          return (
                            <div 
                              key={st.id} 
                              onClick={() => onNavigate(`/track?code=${activeOrder?.code ?? ''}`)}
                              className="flex flex-col items-center text-center group cursor-pointer w-24 sm:w-28"
                            >
                              {/* Micro Slab Card Icon */}
                              <div className={`p-1.5 rounded-lg transition-all duration-300 flex items-center justify-center ${
                                isCurrent 
                                  ? (isLight ? 'bg-white shadow-md ring-2 ring-[#16A34A]' : 'bg-[#2A2A2A] shadow-md ring-2 ring-[#61B663]')
                                  : (isLight ? 'bg-white shadow-sm' : 'bg-[#2A2A2A] border border-[#4E4E4E]')
                              }`}>
                                <SlabTimelineIcon
                                  status={isCurrent ? 'current' : isCompleted ? 'completed' : 'pending'}
                                  size="md"
                                  isLight={isLight}
                                />
                              </div>

                              {/* Step Title */}
                              <span className={`font-['Nunito',sans-serif] text-xs font-[800] uppercase tracking-wide mt-2.5 leading-tight transition-colors ${
                                isCurrent 
                                  ? (isLight ? 'text-[#15803D]' : 'text-[#61B663]') 
                                  : isCompleted 
                                    ? (isLight ? 'text-[#14170F]' : 'text-white') 
                                    : (isLight ? 'text-neutral-400' : 'text-white/40')
                              }`}>
                                {language === 'es' ? st.labelEs : st.labelEn}
                              </span>

                              {/* Status Subtitle Badge */}
                              <span className={`text-[10px] mt-0.5 leading-tight ${
                                isCurrent 
                                  ? (isLight ? 'text-[#15803D] font-bold' : 'text-[#61B663] font-bold')
                                  : (isLight ? 'text-neutral-400' : 'text-[#8C9185]')
                              }`}>
                                {isCurrent 
                                  ? (language === 'es' ? 'En curso' : 'Active') 
                                  : (language === 'es' ? st.subEs : st.subEn)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Showcase / Highlight Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. Spectrometry in Detail */}
                <div 
                  onClick={() => onNavigate('/technology')}
                  className={`border rounded-xl relative overflow-hidden group min-h-[260px] sm:min-h-[280px] cursor-pointer shadow-md transition-all duration-300 ${
                    isLight 
                      ? 'border-[#D8D2C5] bg-[#F5F2EB]' 
                      : 'border-[#4E4E4E] bg-[#383838]'
                  }`}
                >
                  {/* High Clarity Photographic Background */}
                  <img 
                    src="/images/step_3_spectrometry.jpg" 
                    alt="Spectrometry" 
                    className="absolute inset-0 w-full h-full object-cover object-center brightness-125 contrast-110 saturate-110 group-hover:scale-105 group-hover:brightness-135 transition-all duration-700 pointer-events-none"
                  />

                  {/* Gradient Scrim Only Over Lower Text Zone (Upper Image is 100% Bright and Clear) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 via-50% to-transparent pointer-events-none" />
                  
                  {/* Subtle Tech Hover Tint */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-[#61B663]/15 to-transparent transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3.5 h-[1.5px] bg-[#61B663]" />
                      <span className="font-mono text-[9.5px] text-[#61B663] uppercase tracking-widest font-bold drop-shadow-sm">
                        {language === 'es' ? 'Descubre la Tecnología' : 'Discover the Tech'}
                      </span>
                    </div>
                    <h3 className="font-['Nunito',sans-serif] text-2xl sm:text-[26px] text-white uppercase tracking-normal mb-3 font-[900] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] leading-tight">
                      {language === 'es' ? 'Espectrometría en Detalle' : 'Spectrometry in Detail'}
                    </h3>
                    <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white group-hover:text-[#61B663] transition-colors drop-shadow-md">
                      <span className="border-b border-white/30 group-hover:border-[#61B663] pb-0.5">
                        {language === 'es' ? 'Leer Más' : 'Read More'}
                      </span>
                      <span className="text-xs transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>

                {/* 2. View Graded Cards / Collection */}
                <div 
                  onClick={() => setActiveTab('vault')}
                  className={`border rounded-xl relative overflow-hidden group min-h-[260px] sm:min-h-[280px] cursor-pointer shadow-md transition-all duration-300 ${
                    isLight 
                      ? 'border-[#D8D2C5] bg-[#F5F2EB]' 
                      : 'border-[#4E4E4E] bg-[#383838]'
                  }`}
                >
                  {/* High Clarity Photographic Background */}
                  <img 
                    src="/images/preservar.png" 
                    alt="Your Collection" 
                    className="absolute inset-0 w-full h-full object-cover object-center brightness-125 contrast-110 saturate-110 group-hover:scale-105 group-hover:brightness-135 transition-all duration-700 pointer-events-none"
                  />

                  {/* Gradient Scrim Only Over Lower Text Zone (Upper Image is 100% Bright and Clear) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 via-50% to-transparent pointer-events-none" />
                  
                  {/* Subtle Tech Hover Tint */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-[#61B663]/15 to-transparent transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3.5 h-[1.5px] bg-[#61B663]" />
                      <span className="font-mono text-[9.5px] text-[#A4ACA1] uppercase tracking-widest font-bold drop-shadow-sm">
                        {language === 'es' ? 'Tu Colección' : 'Your Collection'}
                      </span>
                    </div>
                    <h3 className="font-['Nunito',sans-serif] text-2xl sm:text-[26px] text-white uppercase tracking-normal mb-3 font-[900] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] leading-tight">
                      {language === 'es' ? 'Ver Cartas Graduadas' : 'View Graded Cards'}
                    </h3>
                    <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white group-hover:text-[#61B663] transition-colors drop-shadow-md">
                      <span className="border-b border-white/30 group-hover:border-[#61B663] pb-0.5">
                        {language === 'es' ? 'Ir a la Bóveda' : 'Go to Vault'}
                      </span>
                      <span className="text-xs transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: SUBMISSIONS */}
          {data && activeTab === 'submissions' && (
            <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-700">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#16A34A] dark:text-[#4ADE80] font-bold mb-1.5">
                    <span>{language === 'es' ? 'REGISTRO OFICIAL DE EXPEDIENTES' : 'OFFICIAL SUBMISSION REGISTRY'}</span>
                    <span className="text-neutral-400 font-normal">| CADENA DE CUSTODIA GORILLA</span>
                  </div>
                  <h2 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl uppercase tracking-normal font-[900] ${
                    isLight ? 'text-[#14170F]' : 'text-white'
                  }`}>
                    {language === 'es' ? 'Historial de Envíos & Seguimiento' : 'Submission History & Tracking'}
                  </h2>
                  <p className={`text-xs mt-1 max-w-xl ${
                    isLight ? 'text-neutral-600' : 'text-[#A4ACA1]'
                  }`}>
                    {language === 'es' 
                      ? 'Seguimiento oficial de lotes en laboratorio, admisión técnica y custodia asegurada.' 
                      : 'Official tracking for laboratory batches, technical admission, and insured custody.'}
                  </p>
                </div>

                {/* Batch Metrics Plaque */}
                <div className={`px-4 py-2.5 rounded-lg border text-xs flex items-center gap-3 shrink-0 ${
                  isLight ? 'bg-white border-[#D8D2C5] shadow-sm text-[#14170F]' : 'bg-white/[0.03] border-white/10 text-white'
                }`}>
                  <span className="text-[10px] font-['Nunito',sans-serif] font-bold uppercase tracking-wider text-neutral-400">
                    {language === 'es' ? 'LOTES DECLARADOS' : 'DECLARED BATCHES'}
                  </span>
                  <span className="font-['Nunito',sans-serif] text-base font-[900] text-[#16A34A] dark:text-[#4ADE80]">
                    {allOrders.length} {es ? (allOrders.length === 1 ? 'EXPEDIENTE' : 'EXPEDIENTES') : (allOrders.length === 1 ? 'DOSSIER' : 'DOSSIERS')}
                  </span>
                </div>
              </div>

              {allOrders.length === 0 && (
                <EmptyPanel
                  isLight={isLight}
                  title={es ? 'Todavía no tienes envíos' : 'You have no submissions yet'}
                  text={es ? 'Cuando envíes tus primeras cartas a graduar, aparecerán aquí con su seguimiento.' : 'When you send your first cards for grading, they will appear here with their tracking.'}
                  action={{ label: es ? 'Enviar cartas a graduar' : 'Submit cards for grading', onClick: () => onNavigate('/submit') }}
                />
              )}

              {/* Mobile Card View (< md) with Alternating Zebra Rows */}
              <div className="flex flex-col gap-3.5 md:hidden">
                {allOrders.map((order, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <div 
                      key={order.code} 
                      className={`border rounded-xl p-4.5 flex flex-col gap-3.5 relative overflow-hidden transition-all duration-200 ${
                        isEven 
                          ? (isLight ? 'bg-[#FAF8F5] border-[#DCD5C7]' : 'bg-[#383838] border-[#4E4E4E]')
                          : (isLight ? 'bg-[#EFE9DE] border-[#D4CCA] shadow-inner' : 'bg-[#2E2E2E] border-[#4A4A4A]')
                      }`}
                    >
                      {/* Left Status Marker */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                        order.code === activeOrder?.code ? 'bg-[#61B663]' : 'bg-neutral-500/40'
                      }`} />

                      <div className="flex items-center justify-between gap-2 pl-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
                            isLight ? 'border-[#D8D2C5] bg-[#F5F2EB] text-[#14170F]' : 'border-[#4E4E4E] bg-[#2A2A2A] text-[#61B663]'
                          }`}>
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </span>
                          <span className={`font-['Nunito',sans-serif] text-base font-[900] tracking-normal ${
                            isLight ? 'text-[#14170F]' : 'text-white'
                          }`}>
                            {order.code}
                          </span>
                        </div>
                        {renderOrderStatusBadge(order.status, order.code === activeOrder?.code)}
                      </div>

                      <div className={`flex items-center justify-between text-xs border-y py-2.5 px-2 ${
                        isLight ? 'border-current/10 text-[#4A5046]' : 'border-[#4E4E4E] text-[#D1D5DB]'
                      }`}>
                        <div className="flex flex-col">
                          <span className={`font-mono text-[9px] uppercase tracking-wider ${isLight ? 'text-neutral-400' : 'text-[#8C9185]'}`}>{language === 'es' ? 'Fecha' : 'Date'}</span>
                          <span className="font-mono text-xs font-semibold">{formatDate(order.submittedAt)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`font-mono text-[9px] uppercase tracking-wider ${isLight ? 'text-neutral-400' : 'text-[#8C9185]'}`}>{language === 'es' ? 'Volumen' : 'Volume'}</span>
                          <span className={`font-['Nunito',sans-serif] text-sm font-[900] ${isLight ? 'text-[#14170F]' : 'text-white'}`}>
                            {order.itemCount} {language === 'es' ? 'CARTAS' : 'CARDS'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pl-2 pt-0.5">
                        <span className={`font-mono text-[9px] ${isLight ? 'text-neutral-400' : 'text-[#8C9185]'}`}>
                          {order.carrier ?? (es ? 'Sin transportista asignado' : 'No carrier assigned')}
                        </span>
                        <button
                          onClick={() => onNavigate(`/track?code=${order.code}`)}
                          className={`font-['Nunito',sans-serif] text-xs font-[800] uppercase tracking-wider py-1.5 px-3 rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isLight 
                              ? 'bg-black text-white border-black hover:bg-neutral-800' 
                              : 'bg-[#2A2A2A] text-white border-[#4E4E4E] hover:bg-white/10 hover:border-white/30'
                          }`}
                        >
                          <span>{language === 'es' ? 'Ver Seguimiento' : 'Track Order'}</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= md) with Alternating Zebra Rows */}
              <div className={`${allOrders.length === 0 ? 'hidden' : 'hidden md:block'} border rounded-xl overflow-hidden shadow-sm ${
                isLight 
                  ? 'border-[#D8D2C5]' 
                  : 'border-[#4E4E4E]'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-sm min-w-[760px] border-collapse">
                    <thead>
                      <tr className={`border-b font-mono text-[10px] uppercase tracking-wider select-none ${
                        isLight 
                          ? 'bg-[#E7E1D4] border-[#D8D0C0] text-[#4A5046]' 
                          : 'bg-[#2A2A2A] border-[#4E4E4E] text-[#D1D5DB]'
                      }`}>
                        <th className="px-6 py-4 font-bold">
                          {language === 'es' ? 'EXPEDIENTE / LOTE' : 'ORDER ID / BATCH'}
                        </th>
                        <th className="px-6 py-4 font-bold">
                          {language === 'es' ? 'FECHA DE ADMISIÓN' : 'ADMISSION DATE'}
                        </th>
                        <th className="px-6 py-4 font-bold">
                          {language === 'es' ? 'VOLUMEN' : 'ITEMS'}
                        </th>
                        <th className="px-6 py-4 font-bold">
                          {language === 'es' ? 'ESTADO' : 'STATUS'}
                        </th>
                        <th className="px-6 py-4 font-bold text-right">
                          {language === 'es' ? 'ACCIONES' : 'ACTION'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allOrders.map((order, idx) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <tr 
                            key={order.code} 
                            className={`border-b transition-colors duration-200 group ${
                              isLight 
                                ? (isEven 
                                    ? 'bg-[#FAF8F5] hover:bg-[#F3EEE3] border-[#E2DBD0]' 
                                    : 'bg-[#EFE9DE] hover:bg-[#E6E0D4] border-[#DCD5C8]')
                                : (isEven 
                                    ? 'bg-[#383838] hover:bg-[#444444] border-[#4E4E4E]' 
                                    : 'bg-[#2E2E2E] hover:bg-[#444444] border-[#4E4E4E]')
                            }`}
                          >
                            {/* Order ID & Carrier */}
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                  isLight 
                                    ? 'bg-[#F5F2EB] border-[#D8D2C5] text-[#14170F]' 
                                    : 'bg-white/[0.03] border-white/10 text-white'
                                }`}>
                                  <svg className="w-4.5 h-4.5 text-[#16A34A] dark:text-[#4ADE80]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </div>
                                <div>
                                  <span className={`font-['Nunito',sans-serif] text-base font-[900] tracking-normal block whitespace-nowrap ${
                                    isLight ? 'text-[#14170F]' : 'text-white'
                                  }`}>
                                    {order.code}
                                  </span>
                                  <span className="font-mono text-[10px] text-neutral-400 block mt-0.5">
                                    {order.carrier ?? (es ? 'Sin transportista asignado' : 'No carrier assigned')}{order.trackingNumber && <> &bull; {order.trackingNumber}</>}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className={`font-mono text-xs font-semibold ${
                                  isLight ? 'text-[#14170F]' : 'text-white'
                                }`}>
                                  {formatDate(order.submittedAt)}
                                </span>
                                <span className="font-mono text-[10px] text-neutral-400 mt-0.5">
                                  {formatTime(order.submittedAt)}
                                </span>
                              </div>
                            </td>

                            {/* Items / Volume */}
                            <td className="px-6 py-5">
                              <div className="flex items-baseline gap-1.5">
                                <span className={`font-['Nunito',sans-serif] text-lg font-[900] ${
                                  isLight ? 'text-[#14170F]' : 'text-white'
                                }`}>
                                  {order.itemCount}
                                </span>
                                <span className="font-mono text-xs text-neutral-400 uppercase font-medium">
                                  {language === 'es' ? 'cartas' : 'cards'}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-neutral-400 block">
                                {order.firstCardName ? (order.firstCardName.length > 22 ? order.firstCardName.slice(0, 22) + '…' : order.firstCardName) : 'TCG Collectibles'}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-5">
                              {renderOrderStatusBadge(order.status, order.code === activeOrder?.code)}
                            </td>

                            {/* Action Button */}
                            <td className="px-6 py-5 text-right">
                              <button
                                onClick={() => onNavigate(`/track?code=${order.code}`)}
                                className={`font-['Nunito',sans-serif] text-xs uppercase tracking-wider font-[800] py-2 px-3.5 rounded-lg border transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm ${
                                  isLight 
                                    ? 'bg-black text-white border-black hover:bg-neutral-800 hover:shadow' 
                                    : 'bg-white/[0.06] text-white border-white/20 hover:bg-white/10 hover:border-white/30'
                                }`}
                              >
                                <span>{language === 'es' ? 'Ver Seguimiento' : 'Track Order'}</span>
                                <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB: VAULT */}
          {data && activeTab === 'vault' && (
            <div className="space-y-12 animate-in fade-in duration-700">
              
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                  <h2 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl uppercase tracking-normal mb-2 font-[900] ${
                    isLight ? 'text-[#14170F]' : 'text-white'
                  }`}>
                    {language === 'es' ? 'Bóveda Digital' : 'Digital Vault'}
                  </h2>
                  <p className={`font-sans text-xs sm:text-sm max-w-md ${
                    isLight ? 'text-neutral-600' : 'text-[#A4ACA1]'
                  }`}>
                    {language === 'es' 
                      ? 'Explora tus cartas certificadas en 3D. Selecciona una carta para ver su reporte óptico detallado.' 
                      : 'Explore your certified cards in 3D. Select a card to view its detailed optical report.'}
                  </p>
                </div>

                <div className={`flex items-center gap-2 border p-1 rounded-lg ${
                  isLight ? 'border-[#D8D2C5] bg-[#F5F2EB]' : 'border-[#4E4E4E] bg-[#2A2A2A]'
                }`}>
                  {['ALL', 'POKEMON', 'MAGIC'].map(game => (
                    <button
                      key={game}
                      onClick={() => setFilterGame(game)}
                      className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest rounded transition-colors ${
                        filterGame === game 
                          ? (isLight ? 'bg-white text-[#14170F] shadow-sm font-bold border border-[#D8D2C5]' : 'bg-[#383838] text-white border border-[#4E4E4E]') 
                          : (isLight ? 'text-neutral-600 hover:text-[#14170F] hover:bg-black/5' : 'text-[#A4ACA1] hover:text-white hover:bg-white/5')
                      }`}
                    >
                      {game}
                    </button>
                  ))}
                </div>
              </div>

              {filteredCards.length === 0 && (
                <EmptyPanel
                  isLight={isLight}
                  title={userCards.length === 0 ? (es ? 'Tu bóveda está vacía' : 'Your vault is empty') : (es ? 'Sin cartas de este juego' : 'No cards for this game')}
                  text={userCards.length === 0
                    ? (es ? 'Tus cartas certificadas aparecerán aquí cuando termine su graduación.' : 'Your certified cards will appear here once their grading is complete.')
                    : (es ? 'Prueba con otro filtro para ver el resto de tu colección.' : 'Try another filter to see the rest of your collection.')}
                  action={userCards.length === 0 ? { label: es ? 'Enviar cartas a graduar' : 'Submit cards for grading', onClick: () => onNavigate('/submit') } : undefined}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredCards.map(card => (
                  <div key={card.id} className="flex flex-col items-center group">
                    <SlabCard
                      card={card}
                      size="sm"
                      variant="card-only"
                      onInspect={() => onNavigate(`/certificates/${card.certNumber}`)}
                    />
                    <div className={`w-full mt-6 border rounded-xl p-4 flex items-center justify-between transition-colors shadow-sm ${
                      isLight ? 'bg-white border-[#E2DBD0]' : 'bg-[#383838] border-[#4E4E4E]'
                    }`}>
                      <div className="flex flex-col pr-2 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#16A34A]/15 text-[#16A34A] dark:text-[#4ADE80] font-black border border-[#16A34A]/25">
                            GGI {card.grade}
                          </span>
                          <span className={`font-mono text-[10px] uppercase truncate ${isLight ? 'text-neutral-500 font-medium' : 'text-[#A4ACA1]'}`}>
                            {card.set}
                          </span>
                        </div>
                        <h4 className={`font-['Nunito',sans-serif] font-bold text-sm truncate ${
                          isLight ? 'text-[#14170F]' : 'text-white'
                        }`}>
                          {card.name}
                        </h4>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className={`font-mono text-[9px] uppercase tracking-widest ${isLight ? 'text-neutral-500 font-medium' : 'text-[#A4ACA1]'}`}>
                            {language === 'es' ? 'Valuación:' : 'Valuation:'}
                          </span>
                          <span className={`font-['Nunito',sans-serif] text-base font-[900] ${
                            isLight ? 'text-[#14170F]' : 'text-white'
                          }`}>
                            €{card.declaredValueEur.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigate(`/certificates/${card.certNumber}`)}
                        className={`w-9 h-9 shrink-0 flex items-center justify-center border rounded-full transition-colors ${
                          isLight 
                            ? 'border-[#D8D2C5] text-neutral-600 hover:border-[#15803D] hover:text-[#15803D] hover:bg-neutral-50' 
                            : 'border-[#4E4E4E] bg-[#2A2A2A] text-[#A4ACA1] hover:border-[#61B663] hover:text-[#61B663] hover:bg-[#333333]'
                        }`}
                        title={language === 'es' ? 'Ver Dossier con Slab 3D' : 'View Dossier with 3D Slab'}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB: INVOICES */}
          {activeTab === 'invoices' && (
            <div className="animate-in fade-in duration-700">
              <PaymentReceipts
                payments={paymentList ?? []}
                lang={es ? 'es' : 'en'}
                isLight={isLight}
                onOpenOrder={(code) => onNavigate(`/track?code=${code}`)}
              />
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
