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
      scope: language === 'es' 
        ? 'Encapsulado sónico 35 kHz · Chip NFC de seguridad · Escaneo maestro 1200 DPI' 
        : '35 kHz ultrasonic encapsulation · NFC security chip · 1200 DPI master scan',
      bullets: language === 'es'
        ? ['Encapsulado ultrasónico 35 kHz', 'Chip de seguridad criptográfica NFC', 'Escaneo digital forense 1200 DPI']
        : ['35 kHz ultrasonic encapsulation', 'NFC cryptographic security chip', '1200 DPI master digital scan'],
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
      scope: language === 'es' 
        ? '4 Subgrados láser 0.01mm · Escaneo forense 4K · Registro público en blockchain' 
        : '4 Laser 0.01mm subgrades · 4K forensic scan · Blockchain public registry',
      bullets: language === 'es'
        ? ['4 Subgrados ópticos (Centrado, Esquinas, Bordes, Superficie)', 'Escaneo micro-fotométrico 4K UHD', 'Certificación pública en Blockchain']
        : ['4 Optical Subgrades (Centering, Corners, Edges, Surface)', '4K UHD micro-photometric scan', 'Public Blockchain certification registry'],
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
      scope: language === 'es' 
        ? 'Cola preferente de laboratorio · Auditoría óptica doble · Canal directo de soporte' 
        : 'Priority lab queue · Dual optical audit · Direct laboratory support channel',
      bullets: language === 'es'
        ? ['Cola preferente acelerada (2 días)', 'Auditoría óptica doble por 2 inspectores', 'Canal directo de soporte prioritario']
        : ['Accelerated priority queue (2 days)', 'Dual optical audit by 2 senior graders', 'Direct laboratory priority support'],
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
      scope: language === 'es' 
        ? 'Solo entrega presencial en pop ups · Entrega rápida 48h · Encapsulado sónico' 
        : 'In-person drop-off only at pop ups · 48h express turnaround · Sonic encapsulation',
      bullets: language === 'es'
        ? ['Solo entrega presencial en pop ups', 'Graduación exprés presencial en 48 horas', 'Encapsulado sónico y chip criptográfico NFC']
        : ['In-person drop-off only at pop ups', 'Express in-person 48h turnaround', 'Sonic encapsulation & cryptographic NFC chip'],
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

          {/* 2. Trama Litográfica de Puntos Principales (Idéntica al fondo del proyecto) */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: isLight 
                ? 'radial-gradient(circle, rgba(0, 0, 0, 0.10) 1.15px, transparent 1.25px)' 
                : 'radial-gradient(circle, rgba(255, 255, 255, 0.14) 1.15px, transparent 1.25px)',
              backgroundSize: '9px 9px',
              mixBlendMode: isLight ? 'multiply' : 'screen',
              opacity: isLight ? 0.62 : 0.65
            }}
          />

          {/* 3. Puntos Rosette Escalonados (Efecto laboratorio auténtico idéntico al fondo del proyecto) */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: isLight 
                ? 'radial-gradient(circle, rgba(22, 101, 52, 0.05) 0.85px, transparent 0.95px)' 
                : 'radial-gradient(circle, rgba(74, 222, 128, 0.10) 0.85px, transparent 0.95px)',
              backgroundSize: '9px 9px',
              backgroundPosition: '4.5px 4.5px',
              mixBlendMode: isLight ? 'multiply' : 'screen',
              opacity: 0.50
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
              <p className={`mt-2.5 font-sans text-xs sm:text-sm leading-relaxed font-normal ${
                isLight ? 'text-[#4B5563]' : 'text-neutral-300'
              }`}>
                {language === 'es'
                  ? 'Sin suscripciones recurrentes, sin compromisos mensuales.'
                  : 'No recurring subscriptions, no monthly commitments.'}
              </p>
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

        {/* 1. TECHNICAL TARIFF MATRIX (Tabla Oficial de Laboratorio - Desktop Only) */}
        <div className={`hidden lg:block w-full border overflow-hidden shadow-sm mb-8 sm:mb-14 ${
          isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#141815] border-white/10'
        }`}>
          
          {/* Matrix Top Header Bar - Limpio, Sobrio y Profesional */}
          <div className={`px-4 sm:px-6 py-2.5 sm:py-3.5 border-b flex flex-wrap items-center justify-between gap-2 sm:gap-4 font-mono text-[11px] sm:text-xs ${
            isLight 
              ? 'bg-gray-100 border-[#E5E7EB] text-gray-800' 
              : 'bg-white/[0.04] border-white/10 text-gray-200'
          }`}>
            <span className="font-bold tracking-wider uppercase">
              {language === 'es' ? 'CUADRO REGULATORIO DE GRADUACIÓN ÓPTICA' : 'OPTICAL GRADING REGULATORY MATRIX'}
            </span>
            <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-400">
              <span>ISO-9001 CLEANROOM AUDITED</span>
              <span>/</span>
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
                  <th className="py-3.5 px-6 font-bold">{language === 'es' ? 'NIVEL DE SERVICIO' : 'SERVICE TIER'}</th>
                  <th className="py-3.5 px-6 font-bold">{language === 'es' ? 'PLAZO DE RETORNO' : 'ESTIMATED TURNAROUND'}</th>
                  <th className="py-3.5 px-6 font-bold">{language === 'es' ? 'SEGURO MÁXIMO' : 'MAX INSURANCE'}</th>
                  <th className="py-3.5 px-6 font-bold">{language === 'es' ? 'ALCANCE TÉCNICO' : 'TECHNICAL SCOPE'}</th>
                  <th className="py-3.5 px-6 font-bold text-right">{language === 'es' ? 'TARIFA / CARTA' : 'RATE / CARD'}</th>
                  <th className="py-3.5 px-6 font-bold text-center">{language === 'es' ? 'ACCIÓN' : 'ACTION'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/70 dark:divide-white/10 font-mono text-xs">
                {serviceLevels.map((lvl, index) => {
                  const isSelected = selectedTierId === lvl.id;
                  const isEven = index % 2 === 0;

                  // Distinctive neon tier colors for Dark Mode
                  const darkTierColor = 
                    lvl.id === 'standard' ? '#60A5FA' : 
                    lvl.id === 'premium' ? '#4ADE80' : 
                    lvl.id === 'express' ? '#FB923C' : '#FBBF24';

                  // Alternating background shades: 
                  // In Light Mode: exactly as original
                  // In Dark Mode: subtle luxury gradient matching tier's identity
                  const rowBg = isSelected 
                    ? (isLight 
                        ? 'bg-[#E7F6EA]' 
                        : 'bg-gradient-to-r from-emerald-950/60 via-[#102917] to-[#0D1F13] shadow-[inset_0_0_24px_rgba(74,222,128,0.15)]') 
                    : (isLight 
                        ? (isEven ? 'bg-white' : 'bg-[#F2EFE8]')
                        : (lvl.id === 'standard' 
                            ? 'bg-gradient-to-r from-blue-950/30 via-[#0F1722]/90 to-[#0C121B]' 
                            : lvl.id === 'premium' 
                            ? 'bg-gradient-to-r from-emerald-950/30 via-[#0E1C12]/90 to-[#0A160E]' 
                            : lvl.id === 'express' 
                            ? 'bg-gradient-to-r from-orange-950/30 via-[#1F150E]/90 to-[#170F0A]' 
                            : 'bg-gradient-to-r from-amber-950/35 via-[#211B0D]/90 to-[#191409]'));

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
                          : (isSelected ? '#4ADE80' : darkTierColor)
                      }}
                    >
                      {/* Name & Purpose */}
                      <td className="py-4 px-6">
                        <div 
                          className="font-['Nunito',sans-serif] text-base sm:text-lg uppercase font-[900] tracking-normal"
                          style={{
                            color: !isLight ? darkTierColor : undefined
                          }}
                        >
                          {lvl.name}
                        </div>
                        <div className={`font-sans text-xs leading-relaxed max-w-xs mt-1 ${
                          isLight ? 'text-gray-800' : 'text-gray-300'
                        }`}>
                          {lvl.purpose}
                        </div>
                      </td>

                      {/* Turnaround */}
                      <td className={`py-4 px-6 font-extrabold ${isLight ? 'text-gray-900' : 'text-white'}`}>
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
                      <td className={`py-4 px-6 font-extrabold ${isLight ? 'text-gray-900' : 'text-white'}`}>
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

                      {/* Scope */}
                      <td className={`py-4 px-6 font-sans text-xs sm:text-[12.5px] leading-relaxed max-w-sm ${
                        isLight ? 'text-gray-800' : 'text-gray-300'
                      }`}>
                        {lvl.scope}
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 text-right font-['Nunito',sans-serif] text-2xl font-[900]">
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
                      <td className="py-4 px-6 text-center">
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
              style={{ backgroundColor: currentLevel.accentColor }} 
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

        {/* 3. ESTIMACIÓN DE REMESA (Desktop Only Volume Calculator) */}
        <div className={`hidden lg:block w-full border p-4 sm:p-8 lg:p-10 mb-8 sm:mb-14 transition-colors ${
          isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#181B18] border-white/10'
        }`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-gray-100 dark:border-white/5">
            <div>
              <h3 className="font-['Nunito',sans-serif] text-lg sm:text-2xl font-[900] uppercase tracking-normal">
                {language === 'es' ? 'CALCULAR TARIFA POR CANTIDAD DE CARTAS' : 'VOLUME ESTIMATION'}
              </h3>
              <p className={`mt-1 font-sans text-xs max-w-xl leading-relaxed ${
                isLight ? 'text-gray-700' : 'text-gray-200'
              }`}>
                {language === 'es'
                  ? 'Descuentos por volumen: 5% a partir de 10 cartas, 8% desde 25 cartas y 12% para más de 50 cartas.'
                  : 'Bulk discounts: 5% for 10+ cards, 8% for 25+ cards, and 12% for 50+ cards.'}
              </p>
            </div>
          </div>

          {/* Main interactive area: Volume buttons & Real-time result */}
          <div className="pt-4 sm:pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            
            {/* Left: Volume selector buttons + custom input */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-4">
              <span className={`font-mono text-[11px] sm:text-xs uppercase tracking-wider font-semibold block ${
                isLight ? 'text-gray-700' : 'text-gray-200'
              }`}>
                {language === 'es' ? 'Selecciona o introduce la cantidad de cartas:' : 'Select or enter number of cards:'}
              </span>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {[1, 5, 10, 25, 50, 100].map((vol) => {
                  const isSelected = cardCount === vol;
                  return (
                    <button
                      key={vol}
                      type="button"
                      onClick={() => setCardCount(vol)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 font-mono text-xs font-bold transition-colors cursor-pointer border ${
                        isSelected
                          ? 'border-[#16A34A] bg-[#16A34A] text-white'
                          : (isLight ? 'border-gray-300 bg-gray-50 text-gray-800 hover:border-gray-500' : 'border-white/15 bg-white/5 text-gray-100 hover:border-white/30')
                      }`}
                    >
                      {vol} {vol === 1 ? (language === 'es' ? 'carta' : 'card') : (language === 'es' ? 'cartas' : 'cards')}
                    </button>
                  );
                })}

                {/* Direct Stepper Input */}
                <div className={`flex items-center border ml-auto ${
                  isLight ? 'border-gray-300 bg-gray-50' : 'border-white/15 bg-white/5'
                }`}>
                  <button
                    type="button"
                    onClick={() => setCardCount(Math.max(1, cardCount - 1))}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-mono font-bold text-sm hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-white"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={cardCount}
                    onChange={(e) => setCardCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 sm:w-14 text-center font-mono text-xs sm:text-sm font-bold bg-transparent outline-none text-current"
                  />
                  <button
                    type="button"
                    onClick={() => setCardCount(Math.min(1000, cardCount + 1))}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-mono font-bold text-sm hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={`font-mono text-[11px] sm:text-xs pt-2 flex flex-wrap items-center gap-2 sm:gap-3 ${
                isLight ? 'text-gray-700' : 'text-gray-200'
              }`}>
                <span className="font-semibold">{language === 'es' ? `Servicio: ${currentLevel.name}` : `Service: ${currentLevel.name}`}</span>
                <span className="text-gray-400">/</span>
                <span>{language === 'es' ? `Plazo: ${currentLevel.turnaround}` : `Turnaround: ${currentLevel.turnaround}`}</span>
                <span className="text-gray-400">/</span>
                <span>{language === 'es' ? 'Envío asegurado 100%' : '100% Insured Transit'}</span>
              </div>
            </div>

            {/* Right: Clean Price Display & Action */}
            <div className={`lg:col-span-5 p-4 sm:p-6 border flex flex-col justify-between gap-4 ${
              isLight ? 'bg-gray-50/90 border-gray-200' : 'bg-black/40 border-white/15'
            }`}>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-wider block font-semibold ${
                    isLight ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {language === 'es' ? 'Total estimado' : 'Estimated total'}
                  </span>
                  <span className={`font-mono text-xs font-semibold ${
                    isLight ? 'text-gray-800' : 'text-gray-200'
                  }`}>
                    {unitPrice} € / {language === 'es' ? 'carta' : 'card'} {discountRate > 0 && `(-${Math.round(discountRate * 100)}%)`}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-['Nunito',sans-serif] text-3xl sm:text-5xl font-[900] tracking-tight">
                    {totalAmount} €
                  </span>
                  <span className={`block font-mono text-[10px] font-medium mt-0.5 ${
                    isLight ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {language === 'es' ? 'IVA 21% y seguro incluidos' : 'VAT 21% & insurance included'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate(`/submit?tier=${selectedTierId || currentLevel.id}&qty=${cardCount}&fromConfig=true&step=2`)}
                className="btn-gorilla-pill w-full py-3.5 sm:py-4 px-6 sm:px-8 text-xs font-bold tracking-normal gap-2 shadow-lg"
              >
                <span>{language === 'es' ? `Configurar envío (${cardCount} ${cardCount === 1 ? 'carta' : 'cartas'}) →` : `Configure shipment (${cardCount} ${cardCount === 1 ? 'card' : 'cards'}) →`}</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
