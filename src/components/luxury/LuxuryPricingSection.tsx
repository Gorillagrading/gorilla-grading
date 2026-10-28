import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  FileText, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Printer, 
  Download, 
  Package, 
  Check, 
  ChevronRight,
  HelpCircle,
  Building2,
  Info,
  Sliders,
  Shield,
  Sparkles,
  Lock,
  Camera,
  FileCheck,
  QrCode,
  Layers,
  Cpu,
  Award,
  Zap,
  CheckCircle2,
  Scan
} from 'lucide-react';

interface LuxuryPricingSectionProps {
  onNavigate?: (path: string) => void;
  isHome?: boolean;
}

// Backward-compatibility exports for legacy imports
export const BlueprintScanner: React.FC<{ className?: string; color?: string; isLight?: boolean }> = () => null;
export const BlueprintCaliper: React.FC<{ className?: string; color?: string; isLight?: boolean }> = () => null;
export const BlueprintMagnifier: React.FC<{ className?: string; color?: string; isLight?: boolean }> = () => null;
export const BlueprintBriefcase: React.FC<{ className?: string; color?: string; isLight?: boolean }> = () => null;

export const LuxuryPricingSection: React.FC<LuxuryPricingSectionProps> = ({ onNavigate, isHome = false }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Selected tier for the shipment manifest generator (none selected by default)
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [cardCount, setCardCount] = useState<number>(10);

  // Lo que incluye cada carta: igual en todos los servicios.
  const bullets = language === 'es'
    ? ['4 Subgrados ópticos (Centrado, Esquinas, Bordes, Superficie)', 'Escaneo micro-fotométrico 4K UHD', 'Certificado público firmado digitalmente']
    : ['4 Optical Subgrades (Centering, Corners, Edges, Surface)', '4K UHD micro-photometric scan', 'Digitally signed public certificate'];

  // Industrial Service Levels (Tariff Matrix Data)
  const serviceLevels = [
    {
      code: 'RCDM.01',
      id: 'standard',
      shortName: 'Standard',
      name: 'STANDARD',
      purpose: language === 'es' 
        ? 'Remesas regulares, sets modernos y colecciones particulares.' 
        : 'Regular submissions, modern sets, and personal binder collections.',
      turnaround: language === 'es' ? '10 días hábiles' : '10 business days',
      maxInsurance: '500 €',
      maxInsuranceNum: 500,
      bullets,
      price: 19,
      accentColor: '#3B82F6'
    },
    {
      code: 'RCDM.02',
      id: 'premium',
      shortName: 'Premium',
      name: 'PREMIUM',
      purpose: language === 'es' 
        ? 'El estándar del mercado. Cartas de valor medio-alto con 4 subgrados métricos.' 
        : 'The market standard. Mid-to-high value cards with micrometric subgrades.',
      turnaround: language === 'es' ? '5 días hábiles' : '5 business days',
      maxInsurance: '1.500 €',
      maxInsuranceNum: 1500,
      bullets,
      price: 25,
      accentColor: '#16A34A'
    },
    {
      code: 'RCDM.03',
      id: 'express',
      shortName: language === 'es' ? 'Exprés' : 'Express',
      name: 'EXPRESS',
      purpose: language === 'es' 
        ? 'Procesamiento en cola preferente para transacciones de mercado y eventos.' 
        : 'Priority queue routing for urgent transactions, market timing, and conventions.',
      turnaround: language === 'es' ? '2 días hábiles' : '2 business days',
      maxInsurance: '3.000 €',
      maxInsuranceNum: 3000,
      bullets,
      price: 50,
      accentColor: '#EA580C'
    },
    {
      code: 'RCDM.EVENT',
      id: 'event',
      shortName: 'Event',
      name: 'EVENT',
      purpose: language === 'es' 
        ? 'Servicio exclusivo para eventos y ferias. Solo entrega presencial en pop ups.' 
        : 'Exclusive service for events and fairs. In-person drop-off only at pop ups.',
      turnaround: '48 h',
      maxInsurance: '1.000 €',
      maxInsuranceNum: 1000,
      bullets,
      price: 15,
      accentColor: '#CA8A04'
    }
  ];

  const currentLevel = serviceLevels.find(s => s.id === selectedTierId) || serviceLevels[0];

  // Bulk tier discounts for commercial volume
  const getBulkDiscountRate = (qty: number) => {
    if (qty >= 50) return 0.12; // 12%
    if (qty >= 25) return 0.08; // 8%
    if (qty >= 10) return 0.05; // 5%
    return 0;
  };

  const discountRate = getBulkDiscountRate(cardCount);
  const baseUnitPrice = currentLevel.price;
  const unitPrice = Math.round(baseUnitPrice * (1 - discountRate));
  const subtotal = baseUnitPrice * cardCount;
  const totalAmount = unitPrice * cardCount;
  const discountAmount = subtotal - totalAmount;
  const totalInsuredCoverage = currentLevel.maxInsuranceNum * cardCount;

  // Volume estimation bar, drawn as the footer of the tariff card.
  const renderVolumeCalculator = () => (
          <div className={`border-t px-4 py-3 ${
            isLight ? 'border-[#E5E7EB] bg-[#FAFAF8]' : 'border-white/10 bg-black/30'
          }`}>
            <div className="grid grid-cols-12 gap-4 items-center">

              {/* Left: quantity selection */}
              <div className="col-span-7 space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <h3 className="font-['Nunito',sans-serif] text-sm font-[900] uppercase tracking-normal">
                    {language === 'es' ? 'Calcular tarifa por cantidad' : 'Volume estimation'}
                  </h3>
                  <span className={`font-sans text-[11px] ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                    {language === 'es'
                      ? 'Descuentos: 5% desde 10 cartas, 8% desde 25 y 12% desde 50.'
                      : 'Bulk discounts: 5% from 10 cards, 8% from 25, 12% from 50.'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[1, 5, 10, 25, 50, 100].map((vol) => {
                    const isSelected = cardCount === vol;
                    return (
                      <button
                        key={vol}
                        type="button"
                        onClick={() => setCardCount(vol)}
                        className={`px-2.5 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer border ${
                          isSelected
                            ? 'border-[#16A34A] bg-[#16A34A] text-white'
                            : (isLight ? 'border-gray-300 bg-white text-gray-800 hover:border-gray-500' : 'border-white/15 bg-white/5 text-gray-100 hover:border-white/30')
                        }`}
                      >
                        {vol} {vol === 1 ? (language === 'es' ? 'carta' : 'card') : (language === 'es' ? 'cartas' : 'cards')}
                      </button>
                    );
                  })}

                  {/* Direct stepper input */}
                  <div className={`flex items-center border ${
                    isLight ? 'border-gray-300 bg-white' : 'border-white/15 bg-white/5'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setCardCount(Math.max(1, cardCount - 1))}
                      className="w-7 h-7 flex items-center justify-center font-mono font-bold text-sm hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-current"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={cardCount}
                      onChange={(e) => setCardCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-11 text-center font-mono text-xs font-bold bg-transparent outline-none text-current"
                    />
                    <button
                      type="button"
                      onClick={() => setCardCount(Math.min(1000, cardCount + 1))}
                      className="w-7 h-7 flex items-center justify-center font-mono font-bold text-sm hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-current"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={`font-mono text-[10.5px] flex flex-wrap items-center gap-x-2 ${
                  isLight ? 'text-gray-600' : 'text-gray-300'
                }`}>
                  <span className="font-semibold">{language === 'es' ? `Servicio: ${currentLevel.name}` : `Service: ${currentLevel.name}`}</span>
                  <span className="text-gray-400">/</span>
                  <span>{language === 'es' ? `Plazo: ${currentLevel.turnaround}` : `Turnaround: ${currentLevel.turnaround}`}</span>
                  <span className="text-gray-400">/</span>
                  <span>{language === 'es' ? 'Envío asegurado 100%' : '100% Insured Transit'}</span>
                </div>
              </div>

              {/* Right: total and action */}
              <div className="col-span-5 flex items-center justify-end gap-4">
                <div className="text-right">
                  <span className={`font-mono text-[10px] uppercase tracking-wider block font-semibold ${
                    isLight ? 'text-gray-600' : 'text-gray-300'
                  }`}>
                    {language === 'es' ? 'Total estimado' : 'Estimated total'} · {unitPrice} € / {language === 'es' ? 'carta' : 'card'} {discountRate > 0 && `(-${Math.round(discountRate * 100)}%)`}
                  </span>
                  <span className="font-['Nunito',sans-serif] text-3xl font-[900] tracking-tight leading-none">
                    {totalAmount} €
                  </span>
                  <span className={`block font-mono text-[9.5px] font-medium ${
                    isLight ? 'text-gray-600' : 'text-gray-300'
                  }`}>
                    {language === 'es' ? 'IVA 21% y seguro incluidos' : 'VAT 21% & insurance included'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate(`/submit?tier=${selectedTierId || currentLevel.id}&qty=${cardCount}&fromConfig=true&step=2`)}
                  className="btn-gorilla-pill shrink-0 py-3 px-5 text-xs font-bold tracking-normal gap-2 shadow-lg"
                >
                  <span>{language === 'es' ? `Configurar envío (${cardCount}) →` : `Configure shipment (${cardCount}) →`}</span>
                </button>
              </div>

            </div>
          </div>
  );

  // Card-style tiers, used only on the home page. Dark navy cards in dark mode, white cards in light mode.
  const homeCards = (
    <div className="w-full mb-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-stretch pt-3">
        {serviceLevels.map((lvl) => {
          const isPopular = lvl.id === 'premium';
          const badge =
            lvl.id === 'premium' ? (language === 'es' ? 'MÁS POPULAR' : 'MOST POPULAR')
            : lvl.id === 'express' ? (language === 'es' ? 'COLA PRIORITARIA' : 'PRIORITY QUEUE')
            : lvl.id === 'event' ? (language === 'es' ? 'POP UP PRESENCIAL' : 'POP UP IN-PERSON')
            : null;

          const t = isLight
            ? {
                card: 'bg-white text-[#14170F] shadow-md border-[#E2DBD0]',
                badgeMain: 'bg-[#15803D] text-white',
                badgeAlt: 'border border-[#14170F]/25 bg-white text-[#14170F]',
                purpose: 'text-gray-600',
                perCard: 'text-gray-500',
                rule: 'border-black/10',
                label: 'text-gray-500',
                value: 'text-[#14170F]',
                accent: 'text-[#15803D]',
                bullet: 'text-gray-700',
                btnMain: 'bg-[#15803D] text-white hover:bg-[#166534]',
                btnAlt: 'border border-[#D8D2C5] bg-white text-[#14170F] hover:border-[#16A34A]',
              }
            : {
                card: 'text-white bg-gradient-to-b from-[#222636] to-[#141720] shadow-xl border-white/10',
                badgeMain: 'bg-[#4ADE80] text-[#0F1A12]',
                badgeAlt: 'border border-white/30 bg-[#1B1F2C] text-white',
                purpose: 'text-white/65',
                perCard: 'text-white/55',
                rule: 'border-white/10',
                label: 'text-white/55',
                value: 'text-white',
                accent: 'text-[#4ADE80]',
                bullet: 'text-white/80',
                btnMain: 'bg-[#4ADE80] text-[#0F1A12] hover:bg-[#6EE79A]',
                btnAlt: 'border border-white/20 bg-white/[0.04] text-white hover:border-[#4ADE80] hover:bg-white/10',
              };

          return (
            <div
              key={lvl.id}
              className={`relative flex flex-col rounded-xl border p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 ${t.card}`}
            >
              {badge && (
                <span
                  className={`absolute -top-3 left-5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
                    isPopular ? t.badgeMain : t.badgeAlt
                  }`}
                >
                  {badge}
                </span>
              )}

              <h3 className="mt-1 font-['Nunito',sans-serif] text-2xl font-[900] uppercase tracking-normal">{lvl.name}</h3>
              <p className={`mt-2 min-h-[3.6rem] font-sans text-[12.5px] leading-relaxed ${t.purpose}`}>{lvl.purpose}</p>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-['Nunito',sans-serif] text-4xl font-[900] leading-none">{lvl.price} €</span>
                <span className={`font-mono text-[11px] ${t.perCard}`}>/ {language === 'es' ? 'carta' : 'card'}</span>
              </div>

              <div className={`my-4 border-t ${t.rule}`} />

              <dl className="space-y-2 font-mono text-[10.5px] uppercase tracking-wider">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className={t.label}>{language === 'es' ? 'Plazo' : 'Turnaround'}:</dt>
                  <dd className={`text-right font-bold ${t.value}`}>{lvl.turnaround}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className={t.label}>{language === 'es' ? 'Valor máx. declarado' : 'Max declared value'}:</dt>
                  <dd className={`font-bold ${t.accent}`}>{lvl.maxInsurance}</dd>
                </div>
              </dl>

              <ul className="mt-4 mb-6 flex-1 space-y-2">
                {lvl.bullets.map((bullet, idx) => (
                  <li key={idx} className={`flex items-start gap-2 font-sans text-[12.5px] leading-snug ${t.bullet}`}>
                    <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${t.accent}`} strokeWidth={3} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate(`/submit?tier=${lvl.id}`)}
                className={`w-full cursor-pointer py-3 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  isPopular ? t.btnMain : t.btnAlt
                }`}
              >
                {language === 'es' ? 'Seleccionar nivel →' : 'Select tier →'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <section 
      id="pricing" 
      className={`relative w-full py-10 sm:py-12 lg:py-14 px-5 lg:px-12 border-b select-none transition-colors duration-300 ${
        isLight 
          ? 'bg-transparent text-[#111827] border-[#E5E7EB]' 
          : 'bg-transparent text-white border-white/[0.08]'
      }`}
    >
      <div className="relative z-10 max-w-[1400px] mx-auto">
        
        {/* Institutional Header Banner (Theme-Responsive Light/Dark) */}
        <div className={`relative overflow-hidden border mb-6 sm:mb-8 transition-colors duration-500 ${
          isLight 
            ? 'bg-[#FAF9F6] border-[#E5E7EB] shadow-sm' 
            : 'bg-[#060806] border-white/10 shadow-2xl'
        }`}>
          {/* Keyframe animation for banner laser sweep */}
          <style>{`
            @keyframes bannerLaserSweep {
              0% {
                transform: translateY(-80px);
                opacity: 0;
              }
              6% {
                opacity: 0.95;
              }
              92% {
                opacity: 0.95;
              }
              100% {
                transform: translateY(300px);
                opacity: 0;
              }
            }
          `}</style>

          {/* 1. Base Degradado Sutil Idéntico al Proyecto */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isLight
                ? 'radial-gradient(ellipse at 50% 30%, #FFFFFF 0%, #FAF8F5 50%, #F3EFE9 100%)'
                : 'radial-gradient(ellipse at 50% 35%, #0B0E0B 0%, #060806 60%, #030403 100%)'
            }}
          />

          {/* 4. Haz Láser de Escaneo Óptico Dinámico */}
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
            <div 
              className="w-full absolute left-0 right-0 pointer-events-none will-change-transform"
              style={{
                height: '80px',
                animation: 'bannerLaserSweep 8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              }}
            >
              {/* Estela luminosa suave degradada */}
              <div 
                className="w-full h-full"
                style={{
                  background: isLight
                    ? 'linear-gradient(to bottom, transparent 0%, rgba(34, 197, 94, 0.015) 50%, rgba(22, 163, 74, 0.08) 100%)'
                    : 'linear-gradient(to bottom, transparent 0%, rgba(34, 197, 94, 0.04) 50%, rgba(74, 222, 128, 0.18) 100%)',
                }}
              />
              {/* Filamento Láser de Precisión */}
              <div 
                className="w-full h-[1.5px]"
                style={{
                  background: isLight
                    ? 'linear-gradient(90deg, transparent 0%, rgba(22, 163, 74, 0.25) 15%, #16A34A 50%, rgba(22, 163, 74, 0.25) 85%, transparent 100%)'
                    : 'linear-gradient(90deg, transparent 0%, rgba(74, 222, 128, 0.35) 15%, #4ADE80 50%, rgba(74, 222, 128, 0.35) 85%, transparent 100%)',
                  boxShadow: isLight
                    ? '0 0 10px rgba(22, 163, 74, 0.35), 0 0 18px rgba(22, 163, 74, 0.15)'
                    : '0 0 12px rgba(74, 222, 128, 0.6), 0 0 24px rgba(74, 222, 128, 0.25)',
                }}
              />
            </div>
          </div>

          <div className="relative z-10 px-6 sm:px-10 lg:px-12 py-8 sm:py-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
            {/* Left Column: Heading & Tagline */}
            <div className="max-w-2xl">
              <h2 className={`font-['Nunito',sans-serif] text-2xl sm:text-4xl lg:text-[44px] font-[900] tracking-normal uppercase leading-[1.08] ${
                isLight ? 'text-[#111827]' : 'text-white'
              }`}>
                {language === 'es' 
                  ? 'TARIFAS Y ESPECIFICACIONES DE SERVICIO' 
                  : 'LABORATORY RATES & SERVICE SPECIFICATIONS'}
              </h2>
            </div>

            {/* Right Column: Official Tariff Schedule with Down Arrow (seamless, without box container) */}
            <div className="shrink-0 flex items-start sm:items-center gap-3.5 sm:gap-4 max-w-md w-full lg:w-auto">
              {/* Green Down Arrow */}
              <div className="shrink-0 mt-0.5 sm:mt-0 flex items-center justify-center">
                <svg 
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 hover:translate-y-0.5 ${
                    isLight ? 'text-[#15803D]' : 'text-[#48C765]'
                  }`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </div>

              {/* Text Information */}
              <div className="flex flex-col justify-center">
                <div className={`font-mono text-[11px] sm:text-xs font-bold tracking-wider uppercase ${
                  isLight ? 'text-[#0F172A]' : 'text-white'
                }`}>
                  {language === 'es' 
                    ? 'TABLA DE TARIFAS OFICIALES | LABORATORIO 2026' 
                    : 'OFFICIAL TARIFF SCHEDULE | LABORATORY 2026'}
                </div>
                <p className={`font-sans text-xs sm:text-[13px] mt-1 leading-relaxed ${
                  isLight ? 'text-[#374151]' : 'text-[#D1D5DB]'
                }`}>
                  {language === 'es'
                    ? 'Tarifas fijas por carta según el plazo de retorno requerido y la cobertura asegurada declarada.'
                    : 'Fixed unit fees per card determined strictly by required laboratory turnaround and declared insurance coverage.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isHome ? (
          <>
            <div className="mb-8 sm:mb-14">{homeCards}</div>
          </>
        ) : (
          <>
        {/* 1. TECHNICAL TARIFF MATRIX (Tabla Oficial de Laboratorio - Desktop Only) */}
        <div className={`hidden lg:block w-full border overflow-hidden shadow-sm mb-8 sm:mb-14 ${
          isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#141815] border-white/10'
        }`}>
          
          {/* Matrix Top Header Bar - Limpio, Sobrio y Profesional */}
          <div className={`px-4 sm:px-6 py-2 sm:py-2.5 border-b flex flex-wrap items-center justify-between gap-2 sm:gap-4 font-mono text-[11px] sm:text-xs ${
            isLight 
              ? 'bg-gray-100 border-[#E5E7EB] text-gray-800' 
              : 'bg-white/[0.04] border-white/10 text-gray-200'
          }`}>
            <span className="font-bold tracking-wider uppercase">
              {language === 'es' ? 'CUADRO REGULATORIO DE GRADUACIÓN ÓPTICA' : 'OPTICAL GRADING REGULATORY MATRIX'}
            </span>
            <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-400">
              <span>{language === 'es' ? 'CALIBRE LÁSER 0.01mm' : '0.01mm LASER CALIPER'}</span>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b font-mono text-[11px] uppercase tracking-wider font-bold ${
                  isLight ? 'bg-gray-100 text-gray-900 border-gray-300' : 'bg-black/70 text-gray-300 border-white/10'
                }`}>
                  <th className="py-2 px-4 font-bold">{language === 'es' ? 'NIVEL DE SERVICIO' : 'SERVICE TIER'}</th>
                  <th className="py-2 px-4 font-bold">{language === 'es' ? 'PLAZO DE RETORNO' : 'ESTIMATED TURNAROUND'}</th>
                  <th className="py-2 px-4 font-bold">{language === 'es' ? 'SEGURO MÁXIMO' : 'MAX INSURANCE'}</th>
                  <th className="py-2 px-4 font-bold text-right">{language === 'es' ? 'TARIFA / CARTA' : 'RATE / CARD'}</th>
                  <th className="py-2 px-4 font-bold text-center">{language === 'es' ? 'ACCIÓN' : 'ACTION'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/70 dark:divide-white/10 font-mono text-xs">
                {serviceLevels.map((lvl, index) => {
                  const isSelected = selectedTierId === lvl.id;
                  const isEven = index % 2 === 0;

                  // Dark Mode uses only two colors: neutral grays plus a single green accent
                  const darkTierColor = '#4ADE80';

                  // Alternating background shades:
                  // In Light Mode: exactly as original
                  // In Dark Mode: two neutral grays; the selected row gets a subtle green tint
                  const rowBg = isSelected
                    ? (isLight
                        ? 'bg-[#E7F6EA]'
                        : 'bg-[#14301C]')
                    : (isLight
                        ? (isEven ? 'bg-white' : 'bg-[#F2EFE8]')
                        : (isEven ? 'bg-[#141815]' : 'bg-[#1A1E1A]'));

                  const hoverBg = isLight 
                    ? 'hover:bg-[#E7F6EA] hover:border-l-[#16A34A]' 
                    : 'hover:bg-[#122A17] hover:border-l-[#4ADE80]';

                  return (
                    <tr 
                      key={lvl.id}
                      onClick={() => setSelectedTierId(prev => prev === lvl.id ? null : lvl.id)}
                      className={`cursor-pointer transition-all border-l-4 ${rowBg} ${hoverBg}`}
                      style={{
                        borderLeftColor: isLight
                          ? (isSelected ? '#16A34A' : 'transparent')
                          : (isSelected ? '#4ADE80' : 'transparent')
                      }}
                    >
                      {/* Name & Purpose */}
                      <td className="py-2.5 px-4">
                        <div 
                          className={`font-['Nunito',sans-serif] text-sm sm:text-base uppercase font-[900] tracking-normal ${
                            isLight ? '' : 'text-white'
                          }`}
                        >
                          {lvl.name}
                        </div>
                        <div className={`font-sans text-[11.5px] leading-snug max-w-sm mt-0.5 ${
                          isLight ? 'text-gray-800' : 'text-gray-300'
                        }`}>
                          {lvl.purpose}
                        </div>
                      </td>

                      {/* Turnaround */}
                      <td className={`py-2.5 px-4 font-extrabold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        <div className="flex items-center gap-2">
                          <Clock 
                            className="w-3.5 h-3.5 shrink-0" 
                            style={{
                              color: !isLight ? darkTierColor : undefined
                            }}
                          />
                          <span>{lvl.turnaround}</span>
                        </div>
                      </td>

                      {/* Max Insurance / Cobertura */}
                      <td className={`py-2.5 px-4 font-extrabold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck 
                            className="w-3.5 h-3.5 shrink-0 text-emerald-500" 
                            style={{
                              color: !isLight ? darkTierColor : undefined
                            }}
                          />
                          <span>{lvl.maxInsurance}</span>
                        </div>
                        <span className={`block font-mono text-[9.5px] font-normal mt-0.5 ${
                          isLight ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {language === 'es' ? 'cobertura / carta' : 'coverage / card'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-2.5 px-4 text-right font-['Nunito',sans-serif] text-xl font-[900]">
                        <span style={{ color: !isLight && isSelected ? '#4ADE80' : undefined }}>
                          {lvl.price} €
                        </span>
                        <span className={`block font-mono text-[9.5px] font-semibold mt-0.5 ${
                          isLight ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {language === 'es' ? 'IVA INCLUIDO' : 'VAT INCLUDED'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTierId(lvl.id);
                          }}
                          className={
                            isSelected
                              ? 'btn-gorilla-square px-4 py-2 text-[10px] font-extrabold tracking-wider shadow-[0_0_15px_rgba(22,163,74,0.4)]'
                              : isLight
                                ? 'btn-gorilla-square-secondary px-4 py-2 text-[10px] font-bold tracking-wider'
                                : 'px-4 py-2 text-[10px] font-bold tracking-wider rounded border border-white/20 bg-white/5 hover:bg-white/15 text-white transition-all hover:border-emerald-400'
                          }
                        >
                          {language === 'es'
                            ? (isSelected ? '✓ SELECCIONADO' : 'SELECCIONAR')
                            : (isSelected ? '✓ SELECTED' : 'SELECT')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {renderVolumeCalculator()}
        </div>

        {/* 2. DEDICATED MOBILE SERVICE & PRICING SUITE (Zero Overload, Single-Screen Mobile Hub - Mobile Only) */}
        <div className="lg:hidden w-full mb-8">
          {/* 4-Pill Segmented Selector Bar */}
          <div className={`grid grid-cols-4 gap-1 p-1 rounded-xl mb-3 border ${
            isLight ? 'bg-gray-100/90 border-gray-200' : 'bg-black/40 border-white/10'
          }`}>
            {serviceLevels.map((lvl) => {
              const isActive = selectedTierId === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedTierId(lvl.id)}
                  className={`relative py-2 px-1 text-center rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isActive
                      ? 'bg-[#16A34A] text-white shadow-md font-bold'
                      : isLight
                        ? 'text-gray-700 hover:text-black hover:bg-gray-200/60'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="font-['Nunito',sans-serif] text-sm sm:text-base font-[900] leading-tight">
                    {lvl.price} €
                  </span>
                  <span className={`font-mono text-[10px] tracking-tight truncate max-w-full ${
                    isActive ? 'text-emerald-100 font-semibold' : 'opacity-80'
                  }`}>
                    {lvl.shortName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Tier Luxury Mobile Card */}
          <div className={`w-full rounded-2xl border overflow-hidden transition-all duration-300 ${
            isLight 
              ? 'bg-white border-gray-200/90 shadow-lg' 
              : 'bg-[#151915] border-white/10 shadow-2xl'
          }`}>
            {/* Top Color Accent Bar */}
            <div 
              className="h-1.5 w-full transition-colors duration-300"
              style={{ backgroundColor: isLight ? currentLevel.accentColor : '#4ADE80' }} 
            />

            <div className="p-4 sm:p-5">
              {/* Card Header: Name + Unit Price */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-['Nunito',sans-serif] text-base sm:text-lg font-[900] uppercase tracking-normal text-current">
                    {currentLevel.name}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-['Nunito',sans-serif] text-2xl font-[900] leading-tight">
                    {currentLevel.price} €
                  </div>
                  <span className="font-mono text-[9px] font-semibold text-gray-700 dark:text-gray-300 block">
                    {language === 'es' ? 'c/u IVA inc.' : 'ea. incl. VAT'}
                  </span>
                </div>
              </div>

              {/* Two Side-by-Side Key Metric Chips (No text wrapping) */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/30 border-white/5'
                }`}>
                  <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      {language === 'es' ? 'Plazo retorno' : 'Turnaround'}
                    </span>
                    <span className="block font-sans text-xs font-bold truncate text-current">
                      {currentLevel.turnaround}
                    </span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/30 border-white/5'
                }`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      {language === 'es' ? 'Seguro máx.' : 'Max insurance'}
                    </span>
                    <span className="block font-sans text-xs font-bold truncate text-current">
                      {currentLevel.maxInsurance}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Value Proposition Bullets (Clean, concise, zero walls of text) */}
              <div className={`my-3 py-2.5 px-3 rounded-xl border space-y-2 ${
                isLight ? 'bg-gray-50/70 border-gray-200/80' : 'bg-white/[0.02] border-white/5'
              }`}>
                {currentLevel.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className={`text-[11.5px] leading-tight font-medium ${
                      isLight ? 'text-gray-800' : 'text-gray-200'
                    }`}>
                      {bullet}
                    </span>
                  </div>
                ))}
              </div>

              {/* Integrated Volume Selector & Stepper */}
              <div className={`pt-3 border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-[10.5px] font-bold uppercase tracking-wider ${
                    isLight ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {language === 'es' ? 'Cantidad de cartas:' : 'Number of cards:'}
                  </span>
                  {discountRate > 0 && (
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {language === 'es' ? `-${Math.round(discountRate * 100)}% dto. lote` : `-${Math.round(discountRate * 100)}% bulk disc.`}
                    </span>
                  )}
                </div>

                {/* Quick Presets + Stepper in 1 line */}
                <div className="flex items-center gap-1.5">
                  {[1, 5, 10, 25, 50].map((qty) => {
                    const isQtyActive = cardCount === qty;
                    return (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setCardCount(qty)}
                        className={`flex-1 py-1.5 text-center font-mono text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          isQtyActive
                            ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                            : isLight
                              ? 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                              : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {qty}
                      </button>
                    );
                  })}

                  {/* Compact Stepper */}
                  <div className={`flex items-center border rounded-lg ${
                    isLight ? 'border-gray-300 bg-gray-50' : 'border-white/15 bg-white/5'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setCardCount(Math.max(1, cardCount - 1))}
                      className="w-7 h-7 flex items-center justify-center font-mono font-bold text-sm text-gray-700 dark:text-gray-200 active:scale-95 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-7 text-center font-mono text-xs font-bold text-current">
                      {cardCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCardCount(Math.min(500, cardCount + 1))}
                      className="w-7 h-7 flex items-center justify-center font-mono font-bold text-sm text-gray-700 dark:text-gray-200 active:scale-95 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Real-time price summary banner */}
                <div className={`mt-3 p-3 rounded-xl flex items-center justify-between ${
                  isLight ? 'bg-gray-50 border border-gray-200' : 'bg-black/30 border border-white/10'
                }`}>
                  <div>
                    <span className="font-mono text-[9.5px] uppercase tracking-wider text-gray-700 dark:text-gray-300 block font-semibold">
                      {language === 'es' ? 'Total remesa' : 'Estimated total'}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-gray-800 dark:text-gray-200">
                      {unitPrice} € / {language === 'es' ? 'carta' : 'card'}
                      {discountRate > 0 && <span className="text-emerald-500 font-extrabold ml-1">(-{Math.round(discountRate * 100)}%)</span>}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-['Nunito',sans-serif] text-2xl font-[900] tracking-tight text-emerald-600 dark:text-emerald-400">
                      {totalAmount} €
                    </span>
                    <span className="block font-mono text-[9px] text-gray-700 dark:text-gray-300">
                      {language === 'es' ? 'IVA 21% y seguro inc.' : 'VAT 21% & insurance inc.'}
                    </span>
                  </div>
                </div>

                {/* Mobile Direct Action Button */}
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate(`/submit?tier=${selectedTierId || currentLevel.id}&qty=${cardCount}&fromConfig=true&step=2`)}
                  className="btn-gorilla-pill w-full mt-3 py-3 px-4 text-xs font-extrabold tracking-wider flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>
                    {language === 'es' 
                      ? `CONFIGURAR ENVÍO (${cardCount} ${cardCount === 1 ? 'CARTA' : 'CARTAS'}) →` 
                      : `CONFIGURE SHIPMENT (${cardCount} ${cardCount === 1 ? 'CARD' : 'CARDS'}) →`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

          </>
        )}
      </div>
    </section>
  );
};
