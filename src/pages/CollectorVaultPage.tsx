import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { MOCK_GRADED_CARDS } from '../data/mockCards';
import { MOCK_ORDERS } from '../data/mockOrders';
import { SlabCard } from '../components/common/SlabCard';
import { SlabTimelineIcon } from '../components/common/SlabTimelineIcon';

interface CollectorVaultPageProps {
  onNavigate: (path: string) => void;
}

export const CollectorVaultPage: React.FC<CollectorVaultPageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'vault' | 'invoices'>('overview');
  const [filterGame, setFilterGame] = useState('ALL');
  const [showInvoiceModal, setShowInvoiceModal] = useState<string | null>(null);
  const [expandedInvoices, setExpandedInvoices] = useState<Record<string, boolean>>({});

  const toggleInvoice = (id: string) => {
    setExpandedInvoices(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const userCards = MOCK_GRADED_CARDS;
  const activeOrder = MOCK_ORDERS[0];
  const pastOrders = MOCK_ORDERS.slice(1);

  const filteredCards = filterGame === 'ALL'
    ? userCards
    : userCards.filter(c => c.game.toUpperCase().includes(filterGame));

  // TABS
  const tabs = [
    { id: 'overview', index: '01', label: language === 'es' ? 'RESUMEN' : 'OVERVIEW', count: null },
    { id: 'submissions', index: '02', label: language === 'es' ? 'EXPEDIENTES' : 'ORDERS', count: `${[activeOrder, ...pastOrders].length}` },
    { id: 'vault', index: '03', label: language === 'es' ? 'BÓVEDA DIGITAL' : 'GRADED VAULT', count: `${userCards.length}` },
    { id: 'invoices', index: '04', label: language === 'es' ? 'FACTURACIÓN' : 'INVOICES', count: '2' },
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
              {status.replace('_', ' ')}
            </span>
          </div>
        );
    }
  };

  const invoicesData: Record<string, {
    id: string;
    date: string;
    orderId: string;
    hash: string;
    clientName: string;
    clientAddress: string;
    clientCity: string;
    items: Array<{ code: string; title: string; subtitle: string; qty: number; unitPrice: number; total: number }>;
    baseNet: number;
    vatRate: number;
    vatAmount: number;
    total: number;
  }> = {
    'INV-2026-0892': {
      id: 'INV-2026-0892',
      date: language === 'es' ? '15 SEP 2026 · 14:32 CET' : 'SEP 15, 2026 · 14:32 CET',
      orderId: 'GG-ORD-88219',
      hash: 'SHA256: 7F4A·90E1·8829·003C',
      clientName: 'Carlos Mendes',
      clientAddress: 'Calle Serrano 120, 4ºB',
      clientCity: '28006 Madrid, España',
      items: [
        {
          code: 'SRV-STD-15D',
          title: language === 'es' ? 'Servicio de Graduación Standard (15 Días)' : 'Standard Grading Service (15 Days)',
          subtitle: language === 'es' ? 'Peritaje óptico 1200 DPI, cálculo centesimal y encapsulado sónico 35 kHz' : '1200 DPI multispectral imaging, centesimal centering & 35 kHz ultrasonic encapsulation',
          qty: 1,
          unitPrice: 30.00,
          total: 30.00
        },
        {
          code: 'OPT-SUB-4X',
          title: language === 'es' ? 'Suplemento Sub-Grados Ópticos Láser' : 'Sub-Grades Laser Optical Addon',
          subtitle: language === 'es' ? 'Telemetría de 4 cuadrantes con calibre láser de 0.01 mm (Centering, Corners, Edges, Surface)' : '4-quadrant micrometric laser telemetry (Centering, Corners, Edges, Surface)',
          qty: 1,
          unitPrice: 5.00,
          total: 5.00
        },
        {
          code: 'LOG-INS-EU',
          title: language === 'es' ? 'Custodia y Retorno Asegurado (UE)' : 'Insured Armored Return Shipping (EU)',
          subtitle: language === 'es' ? 'Tránsito blindado con seguro de valor real de reposición certificado' : 'Armored transit with certified full replacement market value insurance',
          qty: 1,
          unitPrice: 10.00,
          total: 10.00
        }
      ],
      baseNet: 37.19,
      vatRate: 21,
      vatAmount: 7.81,
      total: 45.00
    },
    'INV-2026-0741': {
      id: 'INV-2026-0741',
      date: language === 'es' ? '02 AGO 2026 · 11:15 CET' : 'AUG 02, 2026 · 11:15 CET',
      orderId: 'GG-ORD-88102',
      hash: 'SHA256: 9C3B·11D4·7702·884F',
      clientName: 'Carlos Mendes',
      clientAddress: 'Calle Serrano 120, 4ºB',
      clientCity: '28006 Madrid, España',
      items: [
        {
          code: 'SRV-EXP-05D',
          title: language === 'es' ? 'Servicio de Graduación Express Prioritario (5 Días)' : 'Express Priority Grading Service (5 Days)',
          subtitle: language === 'es' ? 'Admisión preferente en sala blanca ISO y doble peritaje óptico' : 'Priority ISO cleanroom admission & dual-operator optical audit',
          qty: 2,
          unitPrice: 50.00,
          total: 100.00
        },
        {
          code: 'LOG-PRI-EU',
          title: language === 'es' ? 'Transporte Retorno Blindado Express' : 'Express Armored Return Transit',
          subtitle: language === 'es' ? 'Entrega garantizada 24h con custodia con código de verificación' : 'Guaranteed 24h delivery with tamper-evident security custody',
          qty: 1,
          unitPrice: 20.00,
          total: 20.00
        }
      ],
      baseNet: 99.17,
      vatRate: 21,
      vatAmount: 20.83,
      total: 120.00
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
            {/* Header Badge: Verified Status */}
            <div className={`flex items-center justify-between pb-1 border-b ${isLight ? 'border-black/10' : 'border-[#4E4E4E]'}`}>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {language === 'es' ? 'Socio Premier' : 'Premier Member'}
              </span>
            </div>

            {/* Profile Identity Lockup */}
            <div className="flex items-center gap-4 relative z-10">
              {/* Prestigious Monogram Badge */}
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border flex items-center justify-center font-['Nunito',sans-serif] font-[900] shrink-0 shadow-sm transition-colors ${
                isLight 
                  ? 'border-[#D8D2C5] bg-white text-[#14170F]' 
                  : 'border-[#4E4E4E] bg-[#2A2A2A] text-white'
              }`}>
                <span className="text-xl sm:text-2xl font-bold tracking-wider">CM</span>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${
                    isLight ? 'text-[#15803D]' : 'text-[#61B663]'
                  }`}>
                    {language === 'es' ? 'Bóveda Activa' : 'Active Vault'}
                  </span>
                  <span className="text-neutral-400 text-xs">•</span>
                  <span className={`text-[10px] font-mono tracking-wider ${isLight ? 'text-neutral-500' : 'text-[#8C9185]'}`}>
                    #GOR-8821
                  </span>
                </div>
                
                <h1 className="font-['Nunito',sans-serif] text-2xl uppercase tracking-normal leading-tight truncate font-[900]">
                  Carlos Mendes
                </h1>
                <span className={`text-[11px] mt-0.5 ${isLight ? 'text-neutral-500' : 'text-[#8C9185]'}`}>
                  {language === 'es' ? 'Coleccionista Certificado' : 'Certified Collector'}
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
                <span className="font-mono font-semibold text-current">#GOR-8821</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={`text-[10px] uppercase tracking-wide ${isLight ? 'text-neutral-500' : 'text-[#8C9185]'}`}>
                  {language === 'es' ? 'Acreditación' : 'Member Since'}
                </span>
                <span className="font-medium text-current">
                  {language === 'es' ? 'Octubre 2025 · Verificado' : 'October 2025 · Verified'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={`text-[10px] uppercase tracking-wide ${isLight ? 'text-neutral-500' : 'text-[#8C9185]'}`}>
                  {language === 'es' ? 'Custodia Oficial' : 'Custody Center'}
                </span>
                <span className="font-medium text-current">
                  {language === 'es' ? 'Madrid, España' : 'Madrid, Spain'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={`text-[10px] uppercase tracking-wide ${isLight ? 'text-neutral-500' : 'text-[#8C9185]'}`}>
                  {language === 'es' ? 'Bóveda Asignada' : 'Vault Tier'}
                </span>
                <span className={`font-semibold ${isLight ? 'text-[#15803D]' : 'text-[#61B663]'}`}>
                  {language === 'es' ? 'Bóveda de Seguridad A' : 'Security Vault A'}
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
                          ? 'bg-[#14170F] text-white border-[#14170F] shadow-sm' 
                          : 'bg-[#383838] text-white border-white/20 shadow-sm')
                      : (isLight 
                          ? 'bg-[#FAF8F5] hover:bg-[#F2EFE8] border-[#D8D2C5] text-[#14170F]' 
                          : 'bg-[#2A2A2A] hover:bg-[#383838] border-[#4E4E4E] text-[#A4ACA1] hover:text-white')
                  }`}
                >
                  {/* Left Active Indicator Notch */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#16A34A] dark:bg-[#48C765]" />
                  )}

                  <div className="flex items-center gap-3 pl-1.5">
                    <span className={`text-[11px] font-bold font-mono tracking-wider ${
                      isActive 
                        ? (isLight ? 'text-white' : 'text-neutral-200') 
                        : (isLight ? 'text-neutral-400' : 'text-[#8C9185]')
                    }`}>
                      {tab.index}
                    </span>
                    <span className="text-xs font-['Nunito',sans-serif] font-[800] uppercase tracking-wide">
                      {tab.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {tab.count && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        isActive 
                          ? (isLight ? 'bg-white/10 text-white border-white/20' : 'bg-white/10 text-white border-white/15')
                          : (isLight ? 'bg-neutral-200/60 text-neutral-600 border-neutral-300' : 'bg-white/[0.05] text-[#8C9185] border-[#343931]')
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    <svg 
                      className={`w-3.5 h-3.5 transition-transform ${
                        isActive 
                          ? 'translate-x-0 opacity-100 text-white' 
                          : 'opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5'
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
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              
              {/* Premium Greeting Banner (User Gray Card #383838) */}
              <div className={`relative overflow-hidden rounded-xl border p-7 sm:p-8 transition-colors ${
                isLight 
                  ? 'bg-white border-[#E2DBD0] shadow-sm' 
                  : 'bg-[#383838] border-[#4E4E4E] shadow-md'
              }`}>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-[#61B663]" />
                      <span className={`font-['Nunito',sans-serif] font-bold text-[11px] uppercase tracking-wider ${
                        isLight ? 'text-[#15803D]' : 'text-[#61B663]'
                      }`}>
                        {language === 'es' ? 'Bóveda Segura y Conectada' : 'Vault Protected & Connected'}
                      </span>
                    </div>
                    <h2 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl uppercase tracking-normal leading-tight mb-2 font-[900] ${
                      isLight ? 'text-[#14170F]' : 'text-white'
                    }`}>
                      {language === 'es' ? 'Bienvenido,' : 'Welcome,'} <span className={isLight ? 'text-neutral-500' : 'text-[#D1D5DB]'}>Carlos</span>
                    </h2>
                    <p className={`text-sm max-w-lg leading-relaxed ${
                      isLight ? 'text-neutral-600' : 'text-[#D1D5DB]'
                    }`}>
                      {language === 'es' 
                        ? 'Tu colección se encuentra custodiada bajo estándares de alta seguridad. Tienes 1 expediente en proceso de evaluación y certificación.' 
                        : 'Your collection is protected under certified security standards. You have 1 submission undergoing evaluation and certification.'}
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
                      {MOCK_ORDERS.length}
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
                          {language === 'es' ? 'EXPEDIENTE EN PROCESO · FASE 03' : 'SUBMISSION IN PROGRESS · STAGE 03'}
                        </span>
                        <span className={isLight ? 'text-black/30' : 'text-white/30'}>/</span>
                        <span className={`tracking-wider ${
                          isLight ? 'text-neutral-600' : 'text-[#D1D5DB]'
                        }`}>
                          ID: {activeOrder.id}
                        </span>
                      </div>
                      <h3 className={`font-['Nunito',sans-serif] text-2xl uppercase tracking-normal font-[900] ${
                        isLight ? 'text-[#14170F]' : 'text-white'
                      }`}>
                        {activeOrder.items.length} {language === 'es' ? 'Cartas' : 'Cards'} · Optical Grading
                      </h3>
                    </div>
                    <button
                      onClick={() => onNavigate('/track')}
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
                        style={{ width: '43%' }}
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
                          const isCompleted = idx < 2;
                          const isCurrent = idx === 2;
                          const isPending = idx > 2;

                          return (
                            <div 
                              key={st.id} 
                              onClick={() => onNavigate('/track')}
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
                      <span className="w-1.5 h-1.5 rounded-full bg-[#61B663] shadow-[0_0_8px_#61B663]" />
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
                      <span className="w-1.5 h-1.5 rounded-full bg-[#61B663] shadow-[0_0_8px_#61B663]" />
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
          {activeTab === 'submissions' && (
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
                    {[activeOrder, ...pastOrders].length} {language === 'es' ? 'EXPEDIENTES' : 'DOSSIERS'}
                  </span>
                </div>
              </div>

              {/* Mobile Card View (< md) with Alternating Zebra Rows */}
              <div className="flex flex-col gap-3.5 md:hidden">
                {[activeOrder, ...pastOrders].map((order, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <div 
                      key={order.id} 
                      className={`border rounded-xl p-4.5 flex flex-col gap-3.5 relative overflow-hidden transition-all duration-200 ${
                        isEven 
                          ? (isLight ? 'bg-[#FAF8F5] border-[#DCD5C7]' : 'bg-[#383838] border-[#4E4E4E]')
                          : (isLight ? 'bg-[#EFE9DE] border-[#D4CCA] shadow-inner' : 'bg-[#2E2E2E] border-[#4A4A4A]')
                      }`}
                    >
                      {/* Left Status Marker */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                        idx === 0 ? 'bg-[#61B663]' : 'bg-neutral-500/40'
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
                            {order.id}
                          </span>
                        </div>
                        {renderOrderStatusBadge(order.status, idx === 0)}
                      </div>

                      <div className={`flex items-center justify-between text-xs border-y py-2.5 px-2 ${
                        isLight ? 'border-current/10 text-[#4A5046]' : 'border-[#4E4E4E] text-[#D1D5DB]'
                      }`}>
                        <div className="flex flex-col">
                          <span className={`font-mono text-[9px] uppercase tracking-wider ${isLight ? 'text-neutral-400' : 'text-[#8C9185]'}`}>{language === 'es' ? 'Fecha' : 'Date'}</span>
                          <span className="font-mono text-xs font-semibold">{order.createdAt}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`font-mono text-[9px] uppercase tracking-wider ${isLight ? 'text-neutral-400' : 'text-[#8C9185]'}`}>{language === 'es' ? 'Volumen' : 'Volume'}</span>
                          <span className={`font-['Nunito',sans-serif] text-sm font-[900] ${isLight ? 'text-[#14170F]' : 'text-white'}`}>
                            {order.items.length} {language === 'es' ? 'CARTAS' : 'CARDS'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pl-2 pt-0.5">
                        <span className={`font-mono text-[9px] ${isLight ? 'text-neutral-400' : 'text-[#8C9185]'}`}>
                          {order.carrier || 'GLS Express EU'}
                        </span>
                        <button
                          onClick={() => onNavigate('/track')}
                          className={`font-['Nunito',sans-serif] text-xs font-[800] uppercase tracking-wider py-1.5 px-3 rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isLight 
                              ? 'bg-[#14170F] text-white border-[#14170F] hover:bg-[#2A3125]' 
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
              <div className={`hidden md:block border rounded-xl overflow-hidden shadow-sm ${
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
                      {[activeOrder, ...pastOrders].map((order, idx) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <tr 
                            key={order.id} 
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
                                  <span className={`font-['Nunito',sans-serif] text-base font-[900] tracking-normal block ${
                                    isLight ? 'text-[#14170F]' : 'text-white'
                                  }`}>
                                    {order.id}
                                  </span>
                                  <span className="font-mono text-[10px] text-neutral-400 block mt-0.5">
                                    {order.carrier || 'GLS Express EU'} &bull; {order.trackingNumber || 'REF-STD'}
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
                                  {order.createdAt}
                                </span>
                                <span className="font-mono text-[10px] text-neutral-400 mt-0.5">
                                  10:24 CET &bull; {language === 'es' ? 'AUDITADO' : 'AUDITED'}
                                </span>
                              </div>
                            </td>

                            {/* Items / Volume */}
                            <td className="px-6 py-5">
                              <div className="flex items-baseline gap-1.5">
                                <span className={`font-['Nunito',sans-serif] text-lg font-[900] ${
                                  isLight ? 'text-[#14170F]' : 'text-white'
                                }`}>
                                  {order.items.length}
                                </span>
                                <span className="font-mono text-xs text-neutral-400 uppercase font-medium">
                                  {language === 'es' ? 'cartas' : 'cards'}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-neutral-400 block">
                                {order.items[0]?.cardName ? order.items[0].cardName.slice(0, 22) + '...' : 'TCG Collectibles'}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-5">
                              {renderOrderStatusBadge(order.status, idx === 0)}
                            </td>

                            {/* Action Button */}
                            <td className="px-6 py-5 text-right">
                              <button
                                onClick={() => onNavigate('/track')}
                                className={`font-['Nunito',sans-serif] text-xs uppercase tracking-wider font-[800] py-2 px-3.5 rounded-lg border transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm ${
                                  isLight 
                                    ? 'bg-[#14170F] text-white border-[#14170F] hover:bg-[#2A3125] hover:shadow' 
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
          {activeTab === 'vault' && (
            <div className="space-y-12 animate-in fade-in duration-700">
              
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                  <h2 className="font-['Nunito',sans-serif] text-2xl sm:text-3xl text-white uppercase tracking-normal mb-2 font-[900]">
                    {language === 'es' ? 'Bóveda Digital' : 'Digital Vault'}
                  </h2>
                  <p className="font-sans text-xs sm:text-sm text-[#A4ACA1] max-w-md">
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
                          ? (isLight ? 'bg-white text-[#14170F] shadow-sm' : 'bg-[#383838] text-white border border-[#4E4E4E]') 
                          : 'text-[#A4ACA1] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {game}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredCards.map(card => (
                  <div key={card.id} className="flex flex-col items-center group">
                    <SlabCard
                      card={card}
                      size="sm"
                      variant="card-only"
                      onInspect={() => onNavigate('/certificates/demo')}
                    />
                    <div className={`w-full mt-6 border rounded-xl p-4 flex items-center justify-between transition-colors shadow-sm ${
                      isLight ? 'bg-white border-[#E2DBD0]' : 'bg-[#383838] border-[#4E4E4E]'
                    }`}>
                      <div className="flex flex-col pr-2 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#16A34A]/15 text-[#16A34A] dark:text-[#4ADE80] font-black border border-[#16A34A]/25">
                            GGI {card.grade}
                          </span>
                          <span className="font-mono text-[10px] text-[#A4ACA1] uppercase truncate">
                            {card.set}
                          </span>
                        </div>
                        <h4 className={`font-['Nunito',sans-serif] font-bold text-sm truncate ${
                          isLight ? 'text-[#14170F]' : 'text-white'
                        }`}>
                          {card.name}
                        </h4>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="font-mono text-[9px] text-[#A4ACA1] uppercase tracking-widest">
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
                        onClick={() => onNavigate('/certificates/demo')}
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
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
              
              {/* Telemetry & Fiscal Archive Command Header */}
              <div className={`p-5 sm:p-6 border rounded-xl relative overflow-hidden transition-colors ${
                isLight 
                  ? 'bg-white border-[#D8D2C5] shadow-sm text-[#14170F]' 
                  : 'bg-[#383838] border-[#4E4E4E] text-white shadow-md'
              }`}>
                {/* Holographic Top Hairline */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#16A34A] via-[#38BDF8] to-[#16A34A] opacity-70" />
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#16A34A] dark:text-[#48C765] font-bold mb-1.5">
                      <span>{language === 'es' ? 'REGISTRO MERCANTIL & EXPEDIENTES TRIBUTARIOS' : 'COMMERCIAL REGISTRY & TAX ARCHIVES'}</span>
                      <span className="text-neutral-400 font-normal">| R.D. 1619/2012</span>
                    </div>
                    <h2 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl uppercase tracking-normal font-[900] ${
                      isLight ? 'text-[#14170F]' : 'text-white'
                    }`}>
                      {language === 'es' ? 'BÓVEDA DE FACTURACIÓN & PERITAJE FISCAL' : 'BILLING & VALUATION ARCHIVE'}
                    </h2>
                    <p className={`font-mono text-xs mt-1 max-w-xl ${
                      isLight ? 'text-neutral-600' : 'text-[#A4ACA1]'
                    }`}>
                      {language === 'es' 
                        ? 'Expedientes fiscales oficiales consolidados con telemetría de peritaje y sellado criptográfico VeriFactu.' 
                        : 'Official consolidated fiscal dossiers with optical metrology telemetry and VeriFactu cryptographic digital seal.'}
                    </p>
                  </div>

                  {/* Vault Telemetry Metrics Plaque & Master Accordion Toggle */}
                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                    <div className={`px-4 py-2.5 border rounded-lg ${
                      isLight ? 'bg-[#F7F4EC] border-[#E0D9CB]' : 'bg-[#2A2A2A] border-[#4E4E4E]'
                    }`}>
                      <span className="block text-[8px] uppercase tracking-wider text-neutral-400">
                        {language === 'es' ? 'EJERCICIO 2026' : 'FISCAL YEAR 2026'}
                      </span>
                      <span className={`font-['Nunito',sans-serif] text-base font-[900] ${isLight ? 'text-[#14170F]' : 'text-white'}`}>
                        2 {language === 'es' ? 'EXPEDIENTES' : 'DOSSIERS'}
                      </span>
                    </div>

                    <div className={`px-4 py-2.5 border rounded-lg ${
                      isLight ? 'bg-[#F7F4EC] border-[#E0D9CB]' : 'bg-[#2A2A2A] border-[#4E4E4E]'
                    }`}>
                      <span className="block text-[8px] uppercase tracking-wider text-neutral-400">
                        {language === 'es' ? 'TOTAL CONCILIADO' : 'TOTAL SETTLED'}
                      </span>
                      <span className="font-['Nunito',sans-serif] text-base font-[900] text-[#16A34A] dark:text-[#48C765]">
                        €165.00 EUR
                      </span>
                    </div>

                    <div className={`px-4 py-2.5 border rounded-lg ${
                      isLight ? 'bg-[#F7F4EC] border-[#E0D9CB]' : 'bg-[#2A2A2A] border-[#4E4E4E]'
                    }`}>
                      <span className="block text-[8px] uppercase tracking-wider text-neutral-400">
                        {language === 'es' ? 'ESTADO' : 'STATUS'}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#16A34A] dark:text-[#48C765]">
                        {language === 'es' ? 'REGULARIZADO' : 'SETTLED'}
                      </span>
                    </div>

                    {/* Master Expand/Collapse Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const allExp = Object.values(invoicesData).every(inv => !!expandedInvoices[inv.id]);
                        const next: Record<string, boolean> = {};
                        Object.keys(invoicesData).forEach(id => {
                          next[id] = !allExp;
                        });
                        setExpandedInvoices(next);
                      }}
                      className={`px-3.5 py-2.5 border rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer select-none ${
                        isLight 
                          ? 'bg-white hover:bg-[#F2EFE8] border-[#D8D2C5] text-[#14170F]' 
                          : 'bg-[#2A2A2A] hover:bg-[#333333] border-[#4E4E4E] text-white'
                      }`}
                      title={Object.values(invoicesData).every(inv => !!expandedInvoices[inv.id]) ? 'Reducir todos los cuadros' : 'Expandir todos los cuadros'}
                    >
                      <svg 
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${
                          Object.values(invoicesData).every(inv => !!expandedInvoices[inv.id]) ? 'rotate-180' : 'rotate-0'
                        }`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                      <span>
                        {Object.values(invoicesData).every(inv => !!expandedInvoices[inv.id])
                          ? (language === 'es' ? 'REDUCIR TODOS' : 'COLLAPSE ALL')
                          : (language === 'es' ? 'EXPANDIR TODOS' : 'EXPAND ALL')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bespoke Archival Folio Cards Collection (Expandable / Collapsible) */}
              <div className="flex flex-col gap-4 sm:gap-5">
                {Object.values(invoicesData).map((inv) => {
                  const isExpanded = !!expandedInvoices[inv.id];
                  return (
                    <div 
                      key={inv.id} 
                      className={`border rounded-xl relative transition-all duration-300 group overflow-hidden ${
                        isLight 
                          ? 'bg-[#FAF9F5] border-[#D8D2C5] text-[#191D19] shadow-sm hover:border-[#16A34A]/80' 
                          : 'bg-[#383838] border-[#4E4E4E] text-white hover:border-[#61B663]/60 shadow-md'
                      }`}
                    >
                      {/* Document Paper Texture & Watermark */}
                      <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-10 pointer-events-none mix-blend-overlay z-0" />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.025] dark:opacity-[0.03] font-['Nunito',sans-serif] text-8xl font-[900] uppercase tracking-widest hidden md:block">
                        {inv.id}
                      </div>

                      <div className="relative z-10 p-4 sm:p-6 pl-5 sm:pl-7 flex flex-col">
                        
                        {/* 1. Folio Identification Header (Click to Expand / Reduce) */}
                        <div 
                          onClick={() => toggleInvoice(inv.id)}
                          className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
                            isExpanded ? 'pb-4 border-b border-dashed border-current/15' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Official Fiscal Document Seal */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                              isLight 
                                ? 'bg-[#F5F2EB] border-[#D8D2C5] text-[#14170F]' 
                                : 'bg-[#2A2A2A] border-[#4E4E4E] text-white'
                            }`}>
                              <svg className="w-5 h-5 text-[#16A34A] dark:text-[#4ADE80]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-['Nunito',sans-serif] text-lg sm:text-xl font-[900] tracking-normal">
                                  {inv.id}
                                </span>
                                <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">
                                  {language === 'es' ? '· FACTURA OFICIAL' : '· OFFICIAL INVOICE'}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-neutral-500 mt-0.5">
                                <span>{language === 'es' ? 'Expediente Pedido:' : 'Order Ref:'} <strong className="text-current font-semibold">{inv.orderId}</strong></span>
                                <span>&bull;</span>
                                <span>{inv.date}</span>
                                <span>&bull;</span>
                                <span>{inv.items.length} {language === 'es' ? 'servicios' : 'services'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Controls: Amount Summary + Status + Expand/Reduce Button */}
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            {/* Total Amount Plaque */}
                            <div className={`px-3 py-1.5 rounded-lg border font-mono flex items-center gap-2 ${
                              isLight ? 'bg-white border-[#E0D9CB]' : 'bg-[#2A2A2A] border-[#4E4E4E]'
                            }`}>
                              <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-normal">
                                {language === 'es' ? 'TOTAL:' : 'TOTAL:'}
                              </span>
                              <span className="font-['Nunito',sans-serif] text-base font-[900] tracking-tight text-[#16A34A] dark:text-[#4ADE80]">
                                €{inv.total.toFixed(2)}
                              </span>
                            </div>

                            {/* Status Typographic Endorsement */}
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              {language === 'es' ? 'LIQUIDADO · STRIPE' : 'SETTLED · STRIPE'}
                            </span>

                            {/* Bespoke Expand / Reduce Toggle Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleInvoice(inv.id);
                              }}
                              className={`px-3 py-1.5 rounded-lg font-['Nunito',sans-serif] text-xs font-[800] uppercase tracking-wider border transition-all duration-200 flex items-center gap-2 cursor-pointer select-none shadow-sm ${
                                isExpanded
                                  ? (isLight ? 'bg-[#14170F] text-white border-[#14170F]' : 'bg-white/10 text-white border-white/20')
                                  : (isLight ? 'bg-white hover:bg-neutral-100 text-[#14170F] border-[#D4CDC0]' : 'bg-[#2A2A2A] hover:bg-[#333333] text-white border-[#4E4E4E]')
                              }`}
                            >
                              <span>
                                {isExpanded 
                                  ? (language === 'es' ? 'REDUCIR' : 'COLLAPSE') 
                                  : (language === 'es' ? 'EXPANDIR' : 'EXPAND')}
                              </span>
                              <svg 
                                className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>


                        {/* 2. Collapsible Services Breakdown & Financial Ledger Matrix */}
                        <div 
                          className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            isExpanded 
                              ? 'max-h-[1400px] opacity-100 mt-5' 
                              : 'max-h-0 opacity-0 mt-0 pointer-events-none'
                          }`}
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                            
                            {/* Left: Audited Services Telemetry (7 cols) */}
                            <div className="lg:col-span-7 space-y-2">
                              <span className="font-mono text-[9px] uppercase tracking-[0.18em] font-bold block text-[#16A34A] dark:text-[#48C765]">
                                // {language === 'es' ? 'SERVICIOS METROLÓGICOS FACTURADOS' : 'AUDITED SERVICES BREAKDOWN'}
                              </span>
                              <div className="space-y-1.5 font-mono text-xs">
                                {inv.items.map((it, idx) => (
                                  <div key={idx} className={`flex items-start justify-between gap-2 p-2.5 rounded-lg border ${
                                    isLight ? 'bg-white/80 border-[#E2DCce]' : 'bg-[#2A2A2A] border-[#4E4E4E]'
                                  }`}>
                                    <div className="flex items-start gap-2">
                                      <span className="font-bold text-[10px] text-[#16A34A] dark:text-[#48C765] shrink-0 mt-0.5">
                                        [{it.code}]
                                      </span>
                                      <div>
                                        <p className="font-sans font-medium text-xs leading-snug">
                                          {it.title}
                                        </p>
                                        <p className={`font-sans text-[10px] mt-0.5 leading-tight ${isLight ? 'text-neutral-500' : 'text-[#8E968B]'}`}>
                                          {it.subtitle}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="font-bold text-xs shrink-0">
                                      €{it.total.toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex items-center justify-between font-mono text-[9px] text-neutral-400 pt-1">
                                <span>HASH: {inv.hash}</span>
                                <span>{language === 'es' ? 'CENTRO: MADRID · SEDE TÉCNICA' : 'FACILITY: MADRID · TECHNICAL LAB'}</span>
                              </div>
                            </div>

                            {/* Right: Accounting Summary Plaque & Custom Gorilla Buttons (5 cols) */}
                            <div className={`lg:col-span-5 p-4 rounded-xl border flex flex-col justify-between gap-4 font-mono ${
                              isLight 
                                ? 'bg-white border-[#D4CDC0] shadow-sm' 
                                : 'bg-[#2A2A2A] border-[#4E4E4E]'
                            }`}>
                              <div className="space-y-1.5 text-xs border-b border-current/10 pb-3">
                                <div className="flex justify-between">
                                  <span className="text-neutral-500">{language === 'es' ? 'Base Imponible:' : 'Net Base:'}</span>
                                  <span className="font-bold">€{inv.baseNet.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-neutral-500">{language === 'es' ? `IVA (${inv.vatRate}%):` : `VAT (${inv.vatRate}%):`}</span>
                                  <span className="font-bold">€{inv.vatAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-2">
                                  <div>
                                    <span className="font-['Nunito',sans-serif] text-sm uppercase tracking-normal font-[900] block">
                                      TOTAL LIQUIDADO
                                    </span>
                                    <span className="text-[7.5px] text-[#16A34A] dark:text-[#48C765] block font-mono">
                                      EUR // R.D. 1619/2012
                                    </span>
                                  </div>
                                  <span className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] tracking-tight ${
                                    isLight ? 'text-[#16A34A]' : 'text-[#48C765]'
                                  }`}>
                                    €{inv.total.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {/* Bespoke Gorilla Grading Action Buttons (Zero Generic Links) */}
                              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                                <button 
                                  type="button"
                                  onClick={() => setShowInvoiceModal(inv.id)}
                                  className="btn-gorilla-square-secondary w-full sm:flex-1 py-2.5 px-4 text-[11px] font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>{language === 'es' ? 'Ver Expediente' : 'View Dossier'}</span>
                                </button>

                                <button 
                                  type="button"
                                  onClick={() => setShowInvoiceModal(inv.id)}
                                  className="btn-gorilla-square w-full sm:flex-1 py-2.5 px-4 text-[11px] font-extrabold tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  <span>{language === 'es' ? 'Descargar PDF' : 'Download PDF'}</span>
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>
      {/* Bespoke Architectural Laboratory Fiscal Dossier Modal */}
      {showInvoiceModal && (() => {
        const currentInvoice = invoicesData[showInvoiceModal] || invoicesData['INV-2026-0892'];

        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
            {/* Backdrop Blur Layer */}
            <div 
              className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300" 
              onClick={() => setShowInvoiceModal(null)} 
            />

            {/* Bespoke Physical Metrology Fiscal Dossier (Zero Generic Templates) */}
            <div 
              className={`relative w-full max-w-3xl my-auto flex flex-col max-h-[95vh] overflow-hidden border rounded-xl shadow-2xl transition-all duration-300 ${
                isLight 
                  ? 'bg-[#FCFBF8] border-[#D8D2C5] text-[#191D19] shadow-[0_30px_90px_rgba(0,0,0,0.30)]' 
                  : 'bg-[#383838] border-[#4E4E4E] text-white shadow-[0_30px_90px_rgba(0,0,0,0.95)]'
              }`}
            >
              {/* 1. Holographic Top Security Strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#16A34A] via-[#38BDF8] via-[#A855F7] via-[#F59E0B] to-[#16A34A] opacity-90 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20" />
              </div>

              {/* Archival Security Watermark Background Motif */}
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 flex items-center justify-center opacity-[0.035] dark:opacity-[0.04]">
                <div className="font-['Nunito',sans-serif] text-[120px] font-[900] tracking-[0.2em] uppercase rotate-[-25deg] whitespace-nowrap">
                  GORILLA LABS
                </div>
              </div>

              {/* Technical Registration Crosshairs (Architectural Lab Detailing) */}
              <div className={`absolute top-3 left-3 font-mono text-[9px] pointer-events-none select-none z-20 ${
                isLight ? 'text-black/30' : 'text-white/25'
              }`}>┌ [METROLOGY LAB 01 · MADRID]</div>
              <div className={`absolute top-3 right-12 font-mono text-[9px] pointer-events-none select-none z-20 hidden sm:block ${
                isLight ? 'text-black/30' : 'text-white/25'
              }`}>[ISO-17025 ARCHIVE] ┐</div>

              {/* 2. Technical Ledger Header */}
              <div className={`shrink-0 px-5 sm:px-8 pt-5 pb-3.5 border-b relative z-10 ${
                isLight ? 'border-[#E2DCce] bg-white/80' : 'border-[#4E4E4E] bg-[#2A2A2A]'
              }`}>
                {/* Security Micro-print Line */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-dashed border-current/15 font-mono text-[8.5px] uppercase tracking-[0.22em] text-[#16A34A] dark:text-[#48C765]">
                  <span>// GORILLA METROLOGY LEDGER // CERTIFICACIÓN FISCAL</span>
                  <span className="hidden sm:inline font-mono">HASH: {currentInvoice.hash}</span>
                  <span>R.D. 1619/2012 · VALIDEZ OFICIAL</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {/* Official Fiscal Seal Insignia */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border relative shadow-sm ${
                      isLight 
                        ? 'bg-[#F5F2EB] border-[#D8D2C5] text-[#14170F]' 
                        : 'bg-[#383838] border-[#4E4E4E] text-white'
                    }`}>
                      <span className="absolute -top-[1px] -left-[1px] w-2.5 h-2.5 border-t-2 border-l-2 border-[#16A34A] dark:border-[#48C765]" />
                      <span className="absolute -bottom-[1px] -right-[1px] w-2.5 h-2.5 border-b-2 border-r-2 border-[#16A34A] dark:border-[#48C765]" />
                      <svg className="w-6 h-6 text-[#16A34A] dark:text-[#48C765]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h3 className={`font-['Nunito',sans-serif] text-xl sm:text-2xl uppercase tracking-normal font-[900] ${
                          isLight ? 'text-[#14170F]' : 'text-white'
                        }`}>
                          {language === 'es' ? 'FACTURA FISCAL DE CERTIFICACIÓN' : 'CERTIFICATION FISCAL INVOICE'}
                        </h3>
                        <span className="font-mono text-xs sm:text-sm font-bold text-[#16A34A] dark:text-[#48C765] tracking-wider">
                          [{currentInvoice.id}]
                        </span>
                      </div>
                      <p className={`font-mono text-[9px] uppercase tracking-wider mt-0.5 ${
                        isLight ? 'text-neutral-600' : 'text-[#A4ACA1]'
                      }`}>
                        Gorilla Grading International S.L. &bull; NIF: B-88291042 &bull; Registro Mercantil de Madrid Tomo 41208
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="hidden sm:flex flex-col items-end font-mono text-[9.5px] uppercase tracking-wider">
                      <span className="font-bold text-[#15803D] dark:text-[#48C765]">
                        [{language === 'es' ? 'LIQUIDADO · STRIPE' : 'SETTLED · STRIPE'}]
                      </span>
                      <span className="text-[7.5px] text-neutral-400 mt-0.5 tracking-widest font-semibold">VERIFACTU REGISTRADO</span>
                    </div>

                    {/* Architectural Close Button */}
                    <button 
                      type="button"
                      onClick={() => setShowInvoiceModal(null)} 
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        isLight 
                          ? 'border-[#D4CDC0] text-neutral-600 hover:text-black hover:bg-black/5 hover:border-black' 
                          : 'border-[#4E4E4E] text-[#A4ACA1] hover:text-white hover:bg-[#2A2A2A] hover:border-[#61B663]'
                      }`}
                      title={language === 'es' ? 'Cerrar documento' : 'Close document'}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Scrollable Document Body */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4 sm:py-5 space-y-4 sm:space-y-5 relative z-10">
                
                {/* Architectural Metadata Grid (Hairline Rules, Zero Generic Boxes) */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 border rounded-xl overflow-hidden ${
                  isLight ? 'border-[#E2DCce] divide-y sm:divide-y-0 sm:divide-x divide-[#E2DCce] bg-white/70' : 'border-[#4E4E4E] divide-y sm:divide-y-0 sm:divide-x divide-[#4E4E4E] bg-[#2A2A2A]'
                }`}>
                  {/* Left: Recipient Data */}
                  <div className="p-3.5 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-[#16A34A] dark:text-[#48C765]">
                        // {language === 'es' ? 'TITULAR FISCAL / RECEPTOR' : 'TAX RECIPIENT'}
                      </span>
                      <span className="font-mono text-[8.5px] text-neutral-400">ID: GG-4091</span>
                    </div>
                    <p className={`font-['Nunito',sans-serif] text-sm font-bold tracking-tight ${
                      isLight ? 'text-[#14170F]' : 'text-white'
                    }`}>
                      {currentInvoice.clientName}
                    </p>
                    <p className={`text-xs mt-0.5 font-mono ${isLight ? 'text-neutral-600' : 'text-[#B8BFB5]'}`}>
                      {currentInvoice.clientAddress}
                    </p>
                    <p className={`text-xs font-mono ${isLight ? 'text-neutral-600' : 'text-[#B8BFB5]'}`}>
                      {currentInvoice.clientCity}
                    </p>
                    <div className="mt-2 pt-1.5 border-t border-dashed border-current/15 flex items-center justify-between font-mono text-[8.5px] text-neutral-400">
                      <span>DNI/NIF: ES-***3491-B</span>
                      <span className="text-[#16A34A] dark:text-[#48C765] font-semibold">✓ DOMICILIO FISCAL VERIFICADO</span>
                    </div>
                  </div>

                  {/* Right: Laboratory Order Metrics */}
                  <div className="p-3.5 sm:p-4">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold block mb-2 text-[#16A34A] dark:text-[#48C765]">
                      // {language === 'es' ? 'TELEMETRÍA DE LA TRANSACCIÓN' : 'TRANSACTION METRICS'}
                    </span>
                    <div className="space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className={isLight ? 'text-neutral-500' : 'text-[#A4ACA1]'}>{language === 'es' ? 'Fecha de Emisión:' : 'Issue Date:'}</span>
                        <span className="font-semibold">{currentInvoice.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isLight ? 'text-neutral-500' : 'text-[#A4ACA1]'}>{language === 'es' ? 'Expediente Pedido:' : 'Order Ref:'}</span>
                        <span className="font-bold text-[#16A34A] dark:text-[#48C765]">{currentInvoice.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isLight ? 'text-neutral-500' : 'text-[#A4ACA1]'}>{language === 'es' ? 'Canal Liquidación:' : 'Settlement:'}</span>
                        <span className="font-medium">Stripe SEPA Gateway (EUR)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isLight ? 'text-neutral-500' : 'text-[#A4ACA1]'}>{language === 'es' ? 'Centro de Peritaje:' : 'Facility:'}</span>
                        <span className="font-medium">Madrid Cleanroom Lab 01</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Itemization Ledger Table */}
                <div className={`border rounded-xl overflow-hidden ${
                  isLight ? 'border-[#E2DCce] bg-white/90' : 'border-[#4E4E4E] bg-[#2A2A2A]'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs sm:text-sm min-w-[520px]">
                      <thead>
                        <tr className={`border-b font-mono text-[9px] uppercase tracking-[0.16em] ${
                          isLight ? 'bg-[#F4EFE6] border-[#E2DCce] text-neutral-700' : 'bg-[#333333] border-[#4E4E4E] text-[#A4ACA1]'
                        }`}>
                          <th className="px-4 py-2.5 font-bold">{language === 'es' ? 'Cód. Servicio' : 'Code'}</th>
                          <th className="px-4 py-2.5 font-bold">{language === 'es' ? 'Especificación Técnica del Peritaje' : 'Service Specification'}</th>
                          <th className="px-3 py-2.5 font-bold text-center">{language === 'es' ? 'Cant.' : 'Qty'}</th>
                          <th className="px-3 py-2.5 font-bold text-right">{language === 'es' ? 'Precio Ud.' : 'Unit'}</th>
                          <th className="px-4 py-2.5 font-bold text-right">{language === 'es' ? 'Base Neta' : 'Amount'}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y font-mono ${isLight ? 'divide-[#EFE9DF]' : 'divide-[#4E4E4E]/60'}`}>
                        {currentInvoice.items.map((item, idx) => (
                          <tr key={idx} className={isLight ? 'hover:bg-black/[0.01]' : 'hover:bg-white/[0.03]'}>
                            <td className="px-4 py-3 font-bold text-[10px] text-[#16A34A] dark:text-[#48C765]">
                              [{item.code}]
                            </td>
                            <td className="px-4 py-3">
                              <p className={`font-sans font-bold text-xs ${isLight ? 'text-[#14170F]' : 'text-white'}`}>
                                {item.title}
                              </p>
                              <p className={`font-sans text-[10.5px] mt-0.5 leading-snug ${isLight ? 'text-neutral-500' : 'text-[#8E968B]'}`}>
                                {item.subtitle}
                              </p>
                            </td>
                            <td className={`px-3 py-3 text-center text-xs ${isLight ? 'text-neutral-600' : 'text-[#A4ACA1]'}`}>
                              {item.qty}
                            </td>
                            <td className={`px-3 py-3 text-right text-xs ${isLight ? 'text-neutral-600' : 'text-[#A4ACA1]'}`}>
                              €{item.unitPrice.toFixed(2)}
                            </td>
                            <td className={`px-4 py-3 text-right font-bold text-xs ${isLight ? 'text-[#14170F]' : 'text-white'}`}>
                              €{item.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Verification Seal & Totals Plaque */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-1">
                  
                  {/* Left: Official Digital Seal & Stamp Block */}
                  <div className="sm:col-span-7 flex items-center gap-4">
                    {/* Authentic Rotating Laboratory Wax/Ink Stamp */}
                    <div className="relative border-2 border-[#16A34A]/80 dark:border-[#48C765]/80 w-22 h-22 p-1 flex items-center justify-center text-center font-mono text-[7px] uppercase tracking-wider rotate-[-5deg] select-none shrink-0 opacity-90 shadow-sm">
                      <div className="w-full h-full border border-dashed border-[#16A34A]/60 dark:border-[#48C765]/60 flex flex-col items-center justify-center p-1 leading-tight">
                        <span className="font-bold text-[7.5px] tracking-widest text-[#16A34A] dark:text-[#48C765]">GORILLA LABS</span>
                        <span className="text-[6px] tracking-wider opacity-80">INTERNATIONAL</span>
                        <span className="font-['Nunito',sans-serif] text-[11px] font-[900] text-[#16A34A] dark:text-[#48C765] my-0.5">CERTIFIED</span>
                        <span className="text-[6px] tracking-tighter opacity-70">PROBATIVE VALUE</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 font-mono text-[8.5px]">
                      <div className="flex items-center gap-2">
                        {/* Stylized Barcode */}
                        <div className="flex gap-[1.5px] h-6 items-end opacity-85 text-[#16A34A] dark:text-[#48C765]">
                          <div className="w-[2px] h-full bg-current"></div>
                          <div className="w-[1px] h-3/4 bg-current"></div>
                          <div className="w-[3px] h-full bg-current"></div>
                          <div className="w-[1px] h-1/2 bg-current"></div>
                          <div className="w-[2px] h-full bg-current"></div>
                          <div className="w-[4px] h-full bg-current"></div>
                          <div className="w-[1px] h-3/4 bg-current"></div>
                          <div className="w-[2px] h-current bg-current"></div>
                          <div className="w-[3px] h-2/3 bg-current"></div>
                          <div className="w-[1px] h-full bg-current"></div>
                          <div className="w-[3px] h-full bg-current"></div>
                        </div>
                        <div>
                          <span className="font-bold block tracking-wider text-[#16A34A] dark:text-[#48C765]">
                            {language === 'es' ? 'VERIFACTU // SELLO TRIBUTARIO' : 'VERIFACTU // TAX AUDIT SEAL'}
                          </span>
                          <span className="text-[7.5px] opacity-75">
                            {language === 'es' ? 'FIRMA ELECTRÓNICA V4.2 CONSOLIDADA' : 'CONSOLIDATED ELECTRONIC SIGNATURE V4.2'}
                          </span>
                        </div>
                      </div>
                      <p className={`text-[8px] leading-snug ${isLight ? 'text-neutral-500' : 'text-[#8E968B]'}`}>
                        {language === 'es'
                          ? 'Documento fiscal emitido por Gorilla Grading International S.L. con plena eficacia mercantil conforme al R.D. 1619/2012 y directivas de la Unión Europea.'
                          : 'Fiscal document issued by Gorilla Grading International S.L. with full commercial validity under R.D. 1619/2012 and EU directives.'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Bespoke Totals Plaque (Guaranteed Full Visibility) */}
                  <div className={`sm:col-span-5 border rounded-xl p-3.5 font-mono ${
                    isLight 
                      ? 'border-[#D4CDC0] bg-white shadow-sm text-neutral-800' 
                      : 'border-[#4E4E4E] bg-[#2A2A2A] text-white'
                  }`}>
                    <div className="flex justify-between py-1 text-xs border-b border-current/10">
                      <span className="text-neutral-500">{language === 'es' ? 'Base Imponible:' : 'Net Subtotal:'}</span>
                      <span className="font-bold">€{currentInvoice.baseNet.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-xs border-b border-current/10">
                      <span className="text-neutral-500">IVA ({currentInvoice.vatRate}%):</span>
                      <span className="font-bold">€{currentInvoice.vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 mt-1">
                      <div>
                        <span className="font-['Nunito',sans-serif] text-xs sm:text-sm uppercase tracking-normal font-[900] block">
                          TOTAL LIQUIDADO
                        </span>
                        <span className="text-[8px] text-[#16A34A] dark:text-[#48C765] block font-mono">
                          EUR // TOTAL FACTURA
                        </span>
                      </div>
                      <span className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] tracking-tight ${
                        isLight ? 'text-[#16A34A]' : 'text-[#48C765]'
                      }`}>
                        €{currentInvoice.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              {/* 4. Executive Action Footer (Gorilla Custom Square Buttons, Zero Templates) */}
              <div className={`shrink-0 px-5 sm:px-8 py-3.5 border-t flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10 ${
                isLight ? 'bg-[#F4EFE6] border-[#E2DCce]' : 'bg-[#2A2A2A] border-[#4E4E4E]'
              }`}>
                <div className="hidden sm:flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                  <span>// REGISTRO OFICIAL // ACCESO PERMANENTE EN BÓVEDA</span>
                </div>

                <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                  <button 
                    type="button"
                    onClick={() => setShowInvoiceModal(null)}
                    className="btn-gorilla-square-secondary py-2.5 px-6 text-xs font-bold tracking-normal"
                  >
                    {language === 'es' ? 'Cerrar' : 'Close'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => window.print()}
                    className="btn-gorilla-square py-2.5 px-7 text-xs font-extrabold tracking-normal flex items-center justify-center gap-2 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>{language === 'es' ? 'Descargar / Imprimir PDF' : 'Download / Print PDF'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
