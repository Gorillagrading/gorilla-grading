import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface TechDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

type FolioId = 'scan' | 'analyze' | 'measure' | 'grade';

// Four registration corners that gently "breathe" outwards in sequence, like an optical
// scanner locking on the specimen. Static when the user prefers reduced motion.
const RegistrationCorners: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const corners = [
    { pos: 'top-0 left-0 border-t-2 border-l-2', dx: -3, dy: -3, delay: 0 },
    { pos: 'top-0 right-0 border-t-2 border-r-2', dx: 3, dy: -3, delay: 0.25 },
    { pos: 'bottom-0 right-0 border-b-2 border-r-2', dx: 3, dy: 3, delay: 0.5 },
    { pos: 'bottom-0 left-0 border-b-2 border-l-2', dx: -3, dy: 3, delay: 0.75 },
  ];

  return (
    <>
      {corners.map((c) => (
        <motion.div
          key={c.pos}
          className={`absolute w-3 h-3 border-[#15803D] dark:border-[#48C765] pointer-events-none ${c.pos}`}
          animate={reduceMotion ? undefined : {
            x: [0, c.dx, 0],
            y: [0, c.dy, 0],
            opacity: [0.65, 1, 0.65],
          }}
          transition={{ duration: 3, delay: c.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </>
  );
};

export const TechDetailModal: React.FC<TechDetailModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isEs = language === 'es';

  const [activeFolio, setActiveFolio] = useState<FolioId>('measure');
  const [scanFilter, setScanFilter] = useState<'standard' | 'polarized'>('polarized');
  const [loupeZoom, setLoupeZoom] = useState<boolean>(true);

  // Folio navigation sequence
  const folioList: FolioId[] = ['scan', 'analyze', 'measure', 'grade'];
  const currentIndex = folioList.indexOf(activeFolio);

  const handlePrevFolio = () => {
    if (currentIndex > 0) setActiveFolio(folioList[currentIndex - 1]);
  };

  const handleNextFolio = () => {
    if (currentIndex < folioList.length - 1) setActiveFolio(folioList[currentIndex + 1]);
  };

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowRight' && currentIndex < folioList.length - 1) {
          setActiveFolio(folioList[currentIndex + 1]);
        }
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
          setActiveFolio(folioList[currentIndex - 1]);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose, currentIndex]);

  if (!isOpen) return null;

  const folioTabs = [
    {
      id: 'scan' as const,
      num: 'I',
      code: 'FOLIO-01',
      title: isEs ? 'Digitalización Óptica' : 'Optical Telecentric Scan',
      metric: '1200 DPI · D65',
    },
    {
      id: 'analyze' as const,
      num: 'II',
      code: 'FOLIO-02',
      title: isEs ? 'Peritaje de Roseta & UV' : 'Substrate & UV Spectrometry',
      metric: '2400 LPI · 365nm',
    },
    {
      id: 'measure' as const,
      num: 'III',
      code: 'FOLIO-03',
      title: isEs ? 'Metrología Centesimal' : 'Centesimal Centering',
      metric: '50/50 Sub-Pixel',
    },
    {
      id: 'grade' as const,
      num: 'IV',
      code: 'FOLIO-04',
      title: isEs ? 'Sellado Sónico & NFC' : 'Piezo-Sonic Seal & NFC',
      metric: '35 kHz · NTAG 424',
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* ── ARCHIVAL DOSSIER FOLIO CONTAINER ── */}
      <div 
        className={`relative w-full max-w-6xl shadow-2xl flex flex-col h-[96dvh] sm:h-auto sm:max-h-[92vh] border transition-colors duration-300 font-sans ${
          isLight 
            ? 'bg-[#F9F7F2] border-[#D4CBBF] text-[#14170F]' 
            : 'bg-[#0E1310] border-white/15 text-white'
        }`}
        style={{
          boxShadow: isLight
            ? '0 25px 60px -15px rgba(20, 23, 15, 0.25), 0 0 0 1px rgba(212, 203, 191, 0.5)'
            : '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)'
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── ARCHIVAL HEADER: SECURITY FOLIO BANNER ── */}
        <div className={`shrink-0 px-3.5 sm:px-8 py-2.5 sm:py-3.5 border-b flex items-center justify-between gap-3 transition-colors ${
          isLight 
            ? 'bg-[#EFEAE0] border-[#D4CBBF]' 
            : 'bg-[#131A14] border-white/10'
        }`}>
          {/* Official Dossier Identification */}
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[8.5px] sm:text-[10px] font-bold tracking-[0.14em] sm:tracking-[0.2em] uppercase text-[#15803D] dark:text-[#48C765] truncate">
              {isEs ? 'DOSSIER DE LABORATORIO · REF. GGI-LAB-2026-MET' : 'LABORATORY DOSSIER · REF. GGI-LAB-2026-MET'}
            </div>
            <h2 className={`font-['Nunito',sans-serif] text-xs sm:text-base md:text-lg font-[900] tracking-normal uppercase leading-tight mt-0.5 ${
              isLight ? 'text-[#14170F]' : 'text-white'
            }`}>
              {isEs 
                ? 'PROTOCOLO METROLÓGICO Y PERITAJE FORENSE' 
                : 'METROLOGICAL PROTOCOL & FORENSIC DOSSIER'}
            </h2>
          </div>

          {/* Dossier Top Controls: Return Button */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider opacity-60">
              ISO/IEC 17025 ACCREDITED
            </span>

            <button
              type="button"
              onClick={onClose}
              className={`px-2.5 sm:px-4 py-1 sm:py-1.5 border text-[11px] sm:text-xs font-mono font-bold tracking-wider sm:tracking-widest uppercase transition-all duration-150 flex items-center gap-1.5 cursor-pointer rounded-sm ${
                isLight 
                  ? 'border-[#14170F] text-[#14170F] hover:bg-[#14170F] hover:text-[#F9F7F2]' 
                  : 'border-white/30 text-white hover:bg-white hover:text-[#0E1310]'
              }`}
              title={isEs ? 'Cerrar Dossier (Esc)' : 'Close Dossier (Esc)'}
            >
              <span>{isEs ? 'CERRAR' : 'CLOSE'}</span>
              <span className="text-xs sm:text-sm leading-none font-bold">✕</span>
            </button>
          </div>
        </div>

        {/* ── ARCHIVAL FOLIO TABS (PHYSICAL FOLIO DIVIDERS) ── */}
        <div className={`shrink-0 border-b transition-colors ${
          isLight 
            ? 'bg-[#E7E1D4] border-[#D4CBBF]' 
            : 'bg-[#090C0A] border-white/10'
        }`}>
          <div className="grid grid-cols-4 w-full divide-x divide-current/10">
            {folioTabs.map((tab) => {
              const isActive = activeFolio === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFolio(tab.id)}
                  className={`py-2 px-1 sm:px-5 sm:py-3.5 text-center sm:text-left transition-all duration-200 cursor-pointer relative select-none flex flex-col justify-center ${
                    isActive
                      ? isLight 
                        ? 'bg-[#F9F7F2] text-[#14170F]' 
                        : 'bg-[#151D17] text-white'
                      : isLight 
                        ? 'bg-transparent text-neutral-600 hover:bg-[#EFEAE0] hover:text-[#14170F]' 
                        : 'bg-transparent text-neutral-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {/* Active Folio Gilt Bar */}
                  {isActive && (
                    <div className="absolute top-0 inset-x-0 h-0.5 sm:h-1 bg-[#15803D] dark:bg-[#48C765]" />
                  )}

                  <div className="flex items-center justify-center sm:justify-between mb-0.5 sm:mb-1">
                    <span className={`font-mono text-[9px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest ${
                      isActive ? 'text-[#15803D] dark:text-[#48C765]' : 'opacity-60'
                    }`}>
                      FOLIO {tab.num}
                    </span>
                    <span className="hidden sm:inline font-mono text-[9px] opacity-40 uppercase">
                      {tab.code}
                    </span>
                  </div>

                  <h3 className="font-['Nunito',sans-serif] text-[10px] sm:text-xs md:text-sm font-[900] tracking-tight sm:tracking-normal uppercase truncate leading-tight">
                    {tab.title}
                  </h3>
                  <div className="hidden xs:block font-mono text-[8px] sm:text-[10px] opacity-60 mt-0.5 truncate">
                    {tab.metric}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── DOSSIER INTERIOR: SPECIMEN PLATE (LEFT) & METROLOGICAL LEDGER (RIGHT) ── */}
        <div className="p-3 sm:p-6 md:p-8 overflow-y-auto flex-1 min-h-0">
          <AnimatePresence mode="wait">

            {/* ════════════════════════════════════════════════════════════════════
                FOLIO I: DIGITALIZACIÓN ÓPTICA TELECÉNTRICA (1200 DPI)
            ════════════════════════════════════════════════════════════════════ */}
            {activeFolio === 'scan' && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
              >
                {/* LEFT: Archival Museum Specimen Plate I */}
                <div className={`lg:col-span-6 p-3.5 sm:p-5 md:p-7 border flex flex-col justify-between relative overflow-hidden transition-colors ${
                  isLight 
                    ? 'bg-[#EFEAE0] border-[#D4CBBF]' 
                    : 'bg-[#090C0A] border-white/10'
                }`}>
                  {/* Plate Header */}
                  <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-current/15 font-mono text-[9.5px] sm:text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold tracking-wider text-[#15803D] dark:text-[#48C765]">LÁMINA I</span>
                      <span className="opacity-40">|</span>
                      <span className="uppercase opacity-80">{isEs ? 'REGISTRO DE SUPERFICIE' : 'SURFACE RECORD'}</span>
                    </div>
                    <span className="opacity-60">ESC 1:1 METROLÓGICA</span>
                  </div>

                  {/* Specimen Viewport with Precision Registration Corners */}
                  <div className="my-2 sm:my-4 relative flex flex-col items-center justify-center">
                    {/* Millimetric Scale Bar along left side */}
                    <div className="absolute -left-1 sm:left-2 top-0 bottom-0 flex flex-col justify-between font-mono text-[8px] opacity-40 select-none py-2 border-r border-current/20 pr-1.5">
                      <span>0 mm</span>
                      <span>20 mm</span>
                      <span>40 mm</span>
                      <span>60 mm</span>
                      <span>88 mm</span>
                    </div>

                    {/* Specimen Display */}
                    <div className="relative w-36 sm:w-56 h-48 sm:h-76 flex items-center justify-center p-2">
                      {/* Authentic Archival Photo Mounting Corners */}
                      <RegistrationCorners />

                      <img 
                        src="/images/alakazam_hero.png" 
                        alt="Especimen óptico 1200 DPI"
                        className={`w-full h-full object-contain filter transition-all duration-300 ${
                          scanFilter === 'polarized' ? 'contrast-115 brightness-100' : 'contrast-100 brightness-105'
                        } ${
                          isLight ? 'drop-shadow-[0_16px_28px_rgba(0,0,0,0.18)]' : 'drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]'
                        }`}
                      />

                      {/* Optical Grid Overlay */}
                      <div className="absolute inset-0 border border-current/10 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25" />
                    </div>

                    {/* Polarization Filter Switcher */}
                    <div className="mt-4 flex items-center gap-2 border p-1 bg-current/5 border-current/15 font-mono text-[10px]">
                      <span className="px-2 py-0.5 opacity-60 uppercase text-[9px]">
                        {isEs ? 'ILUMINACIÓN:' : 'ILLUMINATION:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setScanFilter('standard')}
                        className={`px-2.5 py-1 transition-all cursor-pointer ${
                          scanFilter === 'standard' 
                            ? 'bg-[#14170F] text-white dark:bg-white dark:text-[#14170F] font-bold' 
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        {isEs ? 'D65 Estándar' : 'D65 Standard'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setScanFilter('polarized')}
                        className={`px-2.5 py-1 transition-all cursor-pointer ${
                          scanFilter === 'polarized' 
                            ? 'bg-[#15803D] text-white dark:bg-[#48C765] dark:text-[#0E1310] font-bold' 
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        {isEs ? 'Polarización Cruzada 90° (Sin Reflejo)' : 'Cross-Polarized 90° (Anti-Glare)'}
                      </button>
                    </div>
                  </div>

                  {/* Plate Technical Legend */}
                  <div className="pt-3 border-t border-current/15 flex items-center justify-between font-mono text-[9.5px] opacity-70">
                    <span>SENSOR TELECÉNTRICO 1200 DPI</span>
                    <span>PROFUNDIDAD 48-BIT RGB RAW</span>
                  </div>
                </div>

                {/* RIGHT: Archival Inspection Ledger Folio I */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
                  <div>
                    {/* Archival Classification Stamp */}
                    <div className="flex items-center justify-between pb-2 border-b border-current/10">
                      <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-[#15803D] dark:text-[#48C765]">
                        {isEs ? 'ACTA TÉCNICA · CAPTURA ESPECTRAL' : 'TECHNICAL ACT · SPECTRAL CAPTURE'}
                      </span>
                      <span className="font-mono text-[9px] opacity-50">DOCUMENTACIÓN SIN CONTACTO</span>
                    </div>

                    <h3 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] uppercase tracking-normal mt-2 ${
                      isLight ? 'text-[#14170F]' : 'text-white'
                    }`}>
                      {isEs 
                        ? 'Digitalización Óptica Telecéntrica sin Reflejos' 
                        : 'Telecentric Glare-Free Optical Metrology'}
                    </h3>

                    <p className={`font-sans text-xs sm:text-sm leading-relaxed mt-2.5 ${
                      isLight ? 'text-neutral-700' : 'text-neutral-300'
                    }`}>
                      {isEs
                        ? 'La digitalización se ejecuta en cámara oscura mediante un sensor óptico telecéntrico de dispersión nula calibrado bajo iluminante CIE D65 (5000K, CRI > 98). El sistema de polarización ortogonal cruzada anula los brillos especulares de los acabados holográficos, registrando la condición física de bordes, masa de impresión y superficie sin degradar el soporte.'
                        : 'Capture is conducted inside a calibrated optical darkroom chamber using zero-dispersion telecentric optics under standardized CIE D65 illumination (5000K, CRI > 98). Orthogonal 90° cross-polarization neutralizes specular holographic glare, registering raw physical edge condition, ink laydown, and planar geometry without tactile stress.'}
                    </p>
                  </div>

                  {/* Metrological Ledger Data Sheet */}
                  <div className={`border divide-y font-mono text-xs ${
                    isLight 
                      ? 'border-[#D4CBBF] divide-[#E2D9CC] bg-white/70' 
                      : 'border-white/10 divide-white/10 bg-[#121813]'
                  }`}>
                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Resolución Espacial' : 'Spatial Resolution'}
                      </span>
                      <span className="font-bold tracking-tight">1200 DPI (48-bit RGB Raw)</span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Temperatura Espectral' : 'Spectral Temperature'}
                      </span>
                      <span className="font-bold tracking-tight">CIE D65 · 5000 K (CRI &gt; 98.4)</span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Cancelación Especular' : 'Specular Cancellation'}
                      </span>
                      <span className="font-bold tracking-tight text-[#15803D] dark:text-[#48C765]">
                        {isEs ? 'Filtro Polarizador Cruzado 90°' : '90° Cross-Polarized Array'}
                      </span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Desviación Cromática' : 'Colorimetric Deviation'}
                      </span>
                      <span className="font-bold tracking-tight">ΔE*ab &lt; 0.28 (Tolerancia ISO)</span>
                    </div>
                  </div>

                  {/* Inspection Endorsement */}
                  <div className={`p-3.5 border flex items-center justify-between font-mono text-[10px] ${
                    isLight ? 'bg-[#F2ECE1] border-[#D4CBBF]' : 'bg-[#151D17] border-white/10'
                  }`}>
                    <div>
                      <span className="block opacity-50 text-[8.5px] uppercase">
                        {isEs ? 'DICTAMEN METROLÓGICO' : 'METROLOGY ENDORSEMENT'}
                      </span>
                      <span className="font-bold text-[#15803D] dark:text-[#48C765]">
                        {isEs ? 'PATRÓN REGISTRADO Y SELLADO' : 'RECORD STORED & VERIFIED'}
                      </span>
                    </div>
                    <div className="text-right opacity-60">
                      <span>CÁMARA TELECÉNTRICA #02</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                FOLIO II: ANÁLISIS DE AUTENTICIDAD LITOGRÁFICA & UV (2400 LPI)
            ════════════════════════════════════════════════════════════════════ */}
            {activeFolio === 'analyze' && (
              <motion.div
                key="analyze"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
              >
                {/* LEFT: Archival Museum Specimen Plate II */}
                <div className={`lg:col-span-6 p-3.5 sm:p-5 md:p-7 border flex flex-col justify-between relative overflow-hidden transition-colors ${
                  isLight 
                    ? 'bg-[#EFEAE0] border-[#D4CBBF]' 
                    : 'bg-[#090C0A] border-white/10'
                }`}>
                  {/* Plate Header */}
                  <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-current/15 font-mono text-[9.5px] sm:text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold tracking-wider text-[#15803D] dark:text-[#48C765]">LÁMINA II</span>
                      <span className="opacity-40">|</span>
                      <span className="uppercase opacity-80">{isEs ? 'MICRO-ROSETA LITOGRÁFICA' : 'LITHOGRAPHIC ROSETTE'}</span>
                    </div>
                    <span className="opacity-60">MAG 100X FORENSE</span>
                  </div>

                  {/* Micro-Reticle Specimen Viewport */}
                  <div className="my-2 sm:my-4 relative flex flex-col items-center justify-center">
                    <div className="relative w-full max-w-[340px] aspect-[4/3] border border-current/25 shadow-xl overflow-hidden bg-black">
                      <img 
                        src="/images/macro_authenticate.jpg" 
                        alt="Detalle forense de roseta litográfica"
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          loupeZoom ? 'scale-115' : 'scale-100'
                        }`}
                      />

                      {/* Optical Micro-Reticle Reticle */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-24 h-24 rounded-full border border-white/50" />
                        <div className="w-40 h-40 rounded-full border border-white/20 border-dashed" />
                        <div className="absolute inset-x-6 top-1/2 h-[1px] bg-white/40" />
                        <div className="absolute inset-y-6 left-1/2 w-[1px] bg-white/40" />
                        
                        {/* 4 Reticle Tickmarks */}
                        <div className="absolute top-4 font-mono text-[8px] text-white/80 bg-black/60 px-1">
                          2400 LPI OFFSET MATRIX
                        </div>
                      </div>
                    </div>

                    {/* Loupe Mode Toggle */}
                    <div className="mt-4 flex items-center gap-2 font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={() => setLoupeZoom(!loupeZoom)}
                        className={`px-3 py-1 border transition-all cursor-pointer ${
                          loupeZoom 
                            ? 'bg-[#15803D] text-white border-[#15803D] dark:bg-[#48C765] dark:text-[#0E1310] dark:border-[#48C765] font-bold' 
                            : 'border-current/30 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {loupeZoom 
                          ? (isEs ? 'Lupa Micro-Roseta Activa (100X)' : 'Micro-Rosette Loupe Active (100X)') 
                          : (isEs ? 'Activar Zoom Forense (100X)' : 'Enable Forensic Zoom (100X)')}
                      </button>
                    </div>
                  </div>

                  {/* Plate Technical Legend */}
                  <div className="pt-3 border-t border-current/15 flex items-center justify-between font-mono text-[9.5px] opacity-70">
                    <span>ROSETA ESTOCÁSTICA CMYK</span>
                    <span>RESPUESTA UV @ 365nm</span>
                  </div>
                </div>

                {/* RIGHT: Archival Inspection Ledger Folio II */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-current/10">
                      <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-[#15803D] dark:text-[#48C765]">
                        {isEs ? 'ACTA TÉCNICA · PERITAJE DE SOPORTE' : 'TECHNICAL ACT · SUBSTRATE VERIFICATION'}
                      </span>
                      <span className="font-mono text-[9px] opacity-50">ESPECTROMETRÍA FORENSE</span>
                    </div>

                    <h3 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] uppercase tracking-normal mt-2 ${
                      isLight ? 'text-[#14170F]' : 'text-white'
                    }`}>
                      {isEs 
                        ? 'Examen Micro-Litográfico y Respuesta UV' 
                        : 'Lithographic Micro-Rosette & UV Analysis'}
                    </h3>

                    <p className={`font-sans text-xs sm:text-sm leading-relaxed mt-2.5 ${
                      isLight ? 'text-neutral-700' : 'text-neutral-300'
                    }`}>
                      {isEs
                        ? 'El peritaje examina la estructura microscópica de las tramas litográficas offset originales (2400 LPI), verificando que la separación tonal CMYK coincida exactamente con las matrices de imprenta de la época. Mediante fluorescencia UV a 365 nm se evalúa la presencia de agentes blanqueadores ópticos (OBA) para descartar reproducciones modernas y re-estampados.'
                        : 'Forensic evaluation examines the microscopic geometry of genuine offset lithographic printing rosettes (2400 LPI), validating that four-color CMYK screening corresponds exactly to factory print matrix angles. 365 nm ultraviolet spectrometry inspects optical brightening agents (OBA) to eliminate modern reproductions and restrikes.'}
                    </p>
                  </div>

                  {/* Metrological Ledger Data Sheet */}
                  <div className={`border divide-y font-mono text-xs ${
                    isLight 
                      ? 'border-[#D4CBBF] divide-[#E2D9CC] bg-white/70' 
                      : 'border-white/10 divide-white/10 bg-[#121813]'
                  }`}>
                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Patrón de Impresión' : 'Printing Pattern'}
                      </span>
                      <span className="font-bold tracking-tight">Roseta Litográfica 2400 LPI</span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Capa de Tinta Negra (K)' : 'Black Ink Layer (K)'}
                      </span>
                      <span className="font-bold tracking-tight">Capa Pura Continua (2.42 OD)</span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Estructura del Núcleo' : 'Substrate Core Structure'}
                      </span>
                      <span className="font-bold tracking-tight">Núcleo Tricapa Genuino (312 μm)</span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Excitación UV 365 nm' : 'UV 365 nm Excitation'}
                      </span>
                      <span className="font-bold tracking-tight text-[#15803D] dark:text-[#48C765]">
                        {isEs ? 'Cero OBA Sintéticos (Auténtico)' : 'Zero Synthetic OBAs (Authentic)'}
                      </span>
                    </div>
                  </div>

                  {/* Inspection Endorsement */}
                  <div className={`p-3.5 border flex items-center justify-between font-mono text-[10px] ${
                    isLight ? 'bg-[#F2ECE1] border-[#D4CBBF]' : 'bg-[#151D17] border-white/10'
                  }`}>
                    <div>
                      <span className="block opacity-50 text-[8.5px] uppercase">
                        {isEs ? 'VERIFICACIÓN DE AUTENTICIDAD' : 'AUTHENTICITY VERDICT'}
                      </span>
                      <span className="font-bold text-[#15803D] dark:text-[#48C765]">
                        {isEs ? 'MATRICERÍA HISTÓRICA CONFIRMADA' : 'PERIOD PRINT MATRIX VERIFIED'}
                      </span>
                    </div>
                    <div className="text-right opacity-60">
                      <span>ESPECTRÓMETRO FORENSE #04</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                FOLIO III: MEDICIÓN DE CENTRADO CENTESIMAL (50/50 SUB-PIXEL)
            ════════════════════════════════════════════════════════════════════ */}
            {activeFolio === 'measure' && (
              <motion.div
                key="measure"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
              >
                {/* LEFT: Archival Museum Specimen Plate III */}
                <div className={`lg:col-span-6 p-3.5 sm:p-5 md:p-7 border flex flex-col justify-between relative overflow-hidden transition-colors ${
                  isLight 
                    ? 'bg-[#EFEAE0] border-[#D4CBBF]' 
                    : 'bg-[#090C0A] border-white/10'
                }`}>
                  {/* Plate Header */}
                  <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-current/15 font-mono text-[9.5px] sm:text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold tracking-wider text-[#15803D] dark:text-[#48C765]">LÁMINA III</span>
                      <span className="opacity-40">|</span>
                      <span className="uppercase opacity-80">{isEs ? 'PERIMETRÍA CENTESIMAL' : 'PERIMETRIC METROLOGY'}</span>
                    </div>
                    <span className="opacity-60">± 0.015 mm SUBPÍXEL</span>
                  </div>

                  {/* Top Datum Callout (Cleanly floating outside the card) */}
                  <div className="w-full flex justify-between items-center font-mono text-[9.5px] sm:text-[10px] pb-1.5 sm:pb-2 border-b border-current/10">
                    <span className="opacity-70">{isEs ? 'MARGEN SUPERIOR' : 'TOP MARGIN'}: 3.21 mm</span>
                    <span className="font-bold text-[#15803D] dark:text-[#48C765]">50.4% [GEM 10]</span>
                  </div>

                  {/* Clean Specimen Viewport: Completely Unobstructed Card Artwork */}
                  <div className="my-2 sm:my-3 relative flex items-center justify-center">
                    {/* Left Dimension Datum */}
                    <div className="absolute -left-8 sm:-left-12 top-1/2 -translate-y-1/2 font-mono text-[9px] text-right opacity-80 select-none hidden xs:block">
                      <span className="block text-[7.5px] uppercase opacity-50">{isEs ? 'IZQ' : 'L'}</span>
                      <span className="font-bold">3.18 mm</span>
                      <span className="block text-[8px] text-[#15803D] dark:text-[#48C765] font-semibold">50.1%</span>
                    </div>

                    {/* Unobstructed Card Specimen */}
                    <div className="relative w-36 sm:w-52 h-48 sm:h-72 flex items-center justify-center">
                      <img 
                        src="/images/alakazam_hero.png?v=3" 
                        alt="Medición centesimal de carta"
                        className={`w-full h-full object-contain filter contrast-110 pointer-events-none select-none ${
                          isLight ? 'drop-shadow-[0_16px_28px_rgba(0,0,0,0.18)]' : 'drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]'
                        }`}
                      />

                      {/* Optical 0.5px Caliper Reticle Hairlines (Zero black boxes) */}
                      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-neutral-500/30 pointer-events-none" />
                      <div className="absolute inset-y-0 left-1/2 w-[1px] bg-neutral-500/30 pointer-events-none" />

                      {/* Delicate Precision Corner Caliper Ticks */}
                      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#15803D] dark:border-[#48C765] pointer-events-none" />
                      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-[#15803D] dark:border-[#48C765] pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-[#15803D] dark:border-[#48C765] pointer-events-none" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#15803D] dark:border-[#48C765] pointer-events-none" />
                    </div>

                    {/* Right Dimension Datum */}
                    <div className="absolute -right-8 sm:-right-12 top-1/2 -translate-y-1/2 font-mono text-[9px] text-left opacity-80 select-none hidden xs:block">
                      <span className="block text-[7.5px] uppercase opacity-50">{isEs ? 'DER' : 'R'}</span>
                      <span className="font-bold">3.17 mm</span>
                      <span className="block text-[8px] text-[#15803D] dark:text-[#48C765] font-semibold">49.9%</span>
                    </div>
                  </div>

                  {/* Bottom Datum Callout */}
                  <div className="w-full flex justify-between items-center font-mono text-[10px] pt-2 border-t border-current/10">
                    <span className="opacity-70">{isEs ? 'MARGEN INFERIOR' : 'BOTTOM MARGIN'}: 3.16 mm</span>
                    <span className="font-bold text-[#15803D] dark:text-[#48C765]">49.6% [GEM 10]</span>
                  </div>

                  {/* Symmetry Matrix Summary */}
                  <div className="pt-2.5 mt-2 border-t border-dashed border-current/20 flex items-center justify-between font-mono text-[10px]">
                    <div>
                      <span className="text-[8px] uppercase block opacity-50">{isEs ? 'SIMETRÍA HORIZONTAL' : 'HORIZONTAL RATIO'}</span>
                      <span className="font-bold">50.1% / 49.9%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] uppercase block opacity-50">{isEs ? 'SIMETRÍA VERTICAL' : 'VERTICAL RATIO'}</span>
                      <span className="font-bold">50.4% / 49.6%</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Archival Inspection Ledger Folio III */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-current/10">
                      <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-[#15803D] dark:text-[#48C765]">
                        {isEs ? 'ACTA TÉCNICA · METROLOGÍA PERIMÉTRICA' : 'TECHNICAL ACT · PERIMETRIC METROLOGY'}
                      </span>
                      <span className="font-mono text-[9px] opacity-50">CALIBRE SUBPÍXEL</span>
                    </div>

                    <h3 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] uppercase tracking-normal mt-2 ${
                      isLight ? 'text-[#14170F]' : 'text-white'
                    }`}>
                      {isEs 
                        ? 'Cálculo Fotogramétrico de Centrado Subpíxel' 
                        : 'Photogrammetric Sub-Pixel Centering'}
                    </h3>

                    <p className={`font-sans text-xs sm:text-sm leading-relaxed mt-2.5 ${
                      isLight ? 'text-neutral-700' : 'text-neutral-300'
                    }`}>
                      {isEs
                        ? 'Algoritmo de metrología óptica que detecta los vectores de corte exterior frente a los límites del área impresa mediante análisis gradiente de bordes a resolución subpíxel (± 0.015 mm). Las proporciones se calculan en los ejes ortogonales X e Y con rigor matemático libre de subjetividad humana.'
                        : 'Advanced optical metrology algorithm detecting physical die-cut vectors against print boundaries using sub-pixel gradient edge analysis (± 0.015 mm). Proportions are evaluated across orthogonal X and Y axes with uncompromising mathematical objectivity, completely eliminating human estimator error.'}
                    </p>
                  </div>

                  {/* Metrological Ledger Data Sheet */}
                  <div className={`border divide-y font-mono text-xs ${
                    isLight 
                      ? 'border-[#D4CBBF] divide-[#E2D9CC] bg-white/70' 
                      : 'border-white/10 divide-white/10 bg-[#121813]'
                  }`}>
                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Incertidumbre Metrológica' : 'Measurement Uncertainty'}
                      </span>
                      <span className="font-bold tracking-tight">&plusmn; 0.015 mm (Resolución Subpíxel)</span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Simetría Horizontal (X)' : 'Horizontal Symmetry (X)'}
                      </span>
                      <span className="font-bold tracking-tight text-[#15803D] dark:text-[#48C765]">
                        50.1% / 49.9% [GEM 10 TIER]
                      </span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Simetría Vertical (Y)' : 'Vertical Symmetry (Y)'}
                      </span>
                      <span className="font-bold tracking-tight text-[#15803D] dark:text-[#48C765]">
                        50.4% / 49.6% [GEM 10 TIER]
                      </span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Desviación Angular' : 'Angular Skew Alignment'}
                      </span>
                      <span className="font-bold tracking-tight">&lt; 0.018° (Ortogonalidad Absoluta)</span>
                    </div>
                  </div>

                  {/* Inspection Endorsement */}
                  <div className={`p-3.5 border flex items-center justify-between font-mono text-[10px] ${
                    isLight ? 'bg-[#F2ECE1] border-[#D4CBBF]' : 'bg-[#151D17] border-white/10'
                  }`}>
                    <div>
                      <span className="block opacity-50 text-[8.5px] uppercase">
                        {isEs ? 'CALIFICACIÓN DE CENTRADO' : 'CENTERING RATING'}
                      </span>
                      <span className="font-bold text-[#15803D] dark:text-[#48C765]">
                        {isEs ? 'PERFECTO 50/50 — CALIDAD GEM MINT' : 'PERFECT 50/50 — GEM MINT COMPLIANT'}
                      </span>
                    </div>
                    <div className="text-right opacity-60">
                      <span>BANCO FOTOGRAMÉTRICO #01</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                FOLIO IV: SELLADO MOLECULAR SÓNICO & NFC CRIPTOGRÁFICO
            ════════════════════════════════════════════════════════════════════ */}
            {activeFolio === 'grade' && (
              <motion.div
                key="grade"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
              >
                {/* LEFT: Archival Museum Specimen Plate IV */}
                <div className={`lg:col-span-6 p-3.5 sm:p-5 md:p-7 border flex flex-col justify-between relative overflow-hidden transition-colors ${
                  isLight 
                    ? 'bg-[#EFEAE0] border-[#D4CBBF]' 
                    : 'bg-[#090C0A] border-white/10'
                }`}>
                  {/* Plate Header */}
                  <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-current/15 font-mono text-[9.5px] sm:text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold tracking-wider text-[#15803D] dark:text-[#48C765]">LÁMINA IV</span>
                      <span className="opacity-40">|</span>
                      <span className="uppercase opacity-80">{isEs ? 'CÁPSULA SELLADA & CHIP NFC' : 'SEALED SLAB & NFC CHIP'}</span>
                    </div>
                    <span className="opacity-60">HERMÉTICO PIEZO-SÓNICO</span>
                  </div>

                  {/* Clean Specimen Viewport: Gorilla Slab Specimen */}
                  <div className="my-2 sm:my-4 relative flex flex-col items-center justify-center">
                    <div className="relative w-36 sm:w-52 h-48 sm:h-72 flex items-center justify-center">
                      <img 
                        src="/images/hero_card_slab.jpg" 
                        alt="Cápsula Gorilla Grading con sellado ultrasónico"
                        className={`w-full h-full object-contain filter contrast-105 pointer-events-none select-none ${
                          isLight ? 'drop-shadow-[0_18px_30px_rgba(0,0,0,0.2)]' : 'drop-shadow-[0_22px_45px_rgba(0,0,0,0.75)]'
                        }`}
                      />
                    </div>

                    <div className="mt-3 font-mono text-[9.5px] uppercase tracking-wider opacity-75">
                      {isEs ? 'BLOQUEO ULTRAVIOLETA UV400 (>99.8%)' : 'UV400 ULTRAVIOLET BLOCK (>99.8%)'}
                    </div>
                  </div>

                  {/* Plate Technical Legend */}
                  <div className="pt-3 border-t border-current/15 flex items-center justify-between font-mono text-[9.5px] opacity-70">
                    <span>POLÍMERO ÓPTICO GRADO MUSEO</span>
                    <span>CHIP NFC NTAG 424 DNA (AES-128)</span>
                  </div>
                </div>

                {/* RIGHT: Archival Inspection Ledger Folio IV */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-current/10">
                      <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-[#15803D] dark:text-[#48C765]">
                        {isEs ? 'ACTA TÉCNICA · ENCAPSULADO ESTANCO' : 'TECHNICAL ACT · HERMETIC ENCAPSULATION'}
                      </span>
                      <span className="font-mono text-[9px] opacity-50">SOLDADURA PIEZOELÉCTRICA</span>
                    </div>

                    <h3 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] uppercase tracking-normal mt-2 ${
                      isLight ? 'text-[#14170F]' : 'text-white'
                    }`}>
                      {isEs 
                        ? 'Encapsulado Hermético y Registro Inmutable' 
                        : 'Piezo-Sonic Encapsulation & Immutable Ledger'}
                    </h3>

                    <p className={`font-sans text-xs sm:text-sm leading-relaxed mt-2.5 ${
                      isLight ? 'text-neutral-700' : 'text-neutral-300'
                    }`}>
                      {isEs
                        ? 'La cápsula de polímero acrílico virgen de grado museo se fusiona molecularmente a 35 kHz mediante transductor ultrasónico piezoeléctrico, sin adhesivos químicos ni vapores residuales. La protección óptica UV400 bloquea más del 99.8% de la radiación actínica, integrando un microchip criptográfico NFC NTAG 424 DNA con firma SUN (Secure Unique NFC).'
                        : 'The museum-grade virgin acrylic polymer capsule undergoes molecular fusion at 35 kHz via piezoelectric ultrasonic sonotrode, eliminating chemical adhesives and volatile outgassing. Optical UV400 filtration blocks >99.8% of actinic radiation, accompanied by an embedded cryptographic NFC NTAG 424 DNA chip with hardware AES-128 SUN signatures.'}
                    </p>
                  </div>

                  {/* Metrological Ledger Data Sheet */}
                  <div className={`border divide-y font-mono text-xs ${
                    isLight 
                      ? 'border-[#D4CBBF] divide-[#E2D9CC] bg-white/70' 
                      : 'border-white/10 divide-white/10 bg-[#121813]'
                  }`}>
                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Frecuencia de Fusión Sónica' : 'Sonic Fusion Frequency'}
                      </span>
                      <span className="font-bold tracking-tight">35.0 kHz &plusmn; 0.02 (Sellado Molecular)</span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Filtración Ultravioleta' : 'Ultraviolet Filtration'}
                      </span>
                      <span className="font-bold tracking-tight text-[#15803D] dark:text-[#48C765]">
                        &gt; 99.8% Bloqueo @ 395nm (UV400)
                      </span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Adhesivos Químicos' : 'Chemical Adhesives'}
                      </span>
                      <span className="font-bold tracking-tight">0.00% (Cero Vapores Residuales)</span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="opacity-60 uppercase text-[10.5px]">
                        {isEs ? 'Criptografía Integrada' : 'Embedded Cryptography'}
                      </span>
                      <span className="font-bold tracking-tight">NTAG 424 DNA (AES-128 SUN Cripto)</span>
                    </div>
                  </div>

                  {/* Inspection Endorsement */}
                  <div className={`p-3.5 border flex items-center justify-between font-mono text-[10px] ${
                    isLight ? 'bg-[#F2ECE1] border-[#D4CBBF]' : 'bg-[#151D17] border-white/10'
                  }`}>
                    <div>
                      <span className="block opacity-50 text-[8.5px] uppercase">
                        {isEs ? 'CERTIFICACIÓN DE PRESERVACIÓN' : 'PRESERVATION CERTIFICATE'}
                      </span>
                      <span className="font-bold text-[#15803D] dark:text-[#48C765]">
                        {isEs ? 'ENCAPSULADO INVIOLABLE CERTIFICADO' : 'TAMPER-EVIDENT ARCHIVAL SEAL'}
                      </span>
                    </div>
                    <div className="text-right opacity-60">
                      <span>CÉLULA ULTRASÓNICA #03</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── ARCHIVAL FOOTER CONTROLS ── */}
        <div className={`shrink-0 px-3.5 sm:px-8 py-2.5 sm:py-3.5 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 transition-colors ${
          isLight 
            ? 'bg-[#EFEAE0] border-[#D4CBBF]' 
            : 'bg-[#131A14] border-white/10'
        }`}>
          {/* Folio Step Navigator */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handlePrevFolio}
              disabled={currentIndex === 0}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 border font-mono text-[10px] sm:text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 sm:gap-2 ${
                currentIndex === 0 
                  ? 'opacity-30 cursor-not-allowed border-current/10' 
                  : isLight
                    ? 'border-[#14170F] text-[#14170F] hover:bg-[#14170F] hover:text-[#F9F7F2] cursor-pointer'
                    : 'border-white/30 text-white hover:bg-white hover:text-[#0E1310] cursor-pointer'
              }`}
            >
              <span>←</span>
              <span className="hidden xs:inline">{isEs ? 'FOLIO ANTERIOR' : 'PREVIOUS FOLIO'}</span>
            </button>

            <span className="font-mono text-xs opacity-60 px-1">
              [ 0{currentIndex + 1} / 0{folioList.length} ]
            </span>

            <button
              type="button"
              onClick={handleNextFolio}
              disabled={currentIndex === folioList.length - 1}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 border font-mono text-[10px] sm:text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 sm:gap-2 ${
                currentIndex === folioList.length - 1 
                  ? 'opacity-30 cursor-not-allowed border-current/10' 
                  : isLight
                    ? 'border-[#14170F] text-[#14170F] hover:bg-[#14170F] hover:text-[#F9F7F2] cursor-pointer'
                    : 'border-white/30 text-white hover:bg-white hover:text-[#0E1310] cursor-pointer'
              }`}
            >
              <span className="hidden xs:inline">{isEs ? 'SIGUIENTE FOLIO' : 'NEXT FOLIO'}</span>
              <span>→</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigate) onNavigate('/submit');
            }}
            className="btn-gorilla-square py-2.5 sm:py-3.5 px-4 sm:px-8 text-xs font-bold tracking-normal uppercase flex items-center justify-center gap-2 sm:gap-3 shadow-xl cursor-pointer"
          >
            <span>{isEs ? 'ENVIAR CARTAS A PERITAJE' : 'SUBMIT CARDS FOR GRADING'}</span>
            <span className="text-sm">→</span>
          </button>
        </div>

      </div>
    </div>
  );
};
