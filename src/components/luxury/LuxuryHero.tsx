import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { BrandEcosystemRibbon } from './BrandEcosystemRibbon';
import { 
  ShieldCheck, 
  Crosshair, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Maximize2,
  Cpu,
  Zap
} from 'lucide-react';

interface LuxuryHeroProps {
  onNavigate?: (path: string) => void;
  onOpenTechModal?: () => void;
}

// After Effects Diamond Star Lens Flare Component (Zero background box, pure light physics)
const StarGlint: React.FC<{ x: number; y: number; intensity: number; color?: string }> = ({ x, y, intensity, color = '#48C765' }) => {
  if (intensity <= 0.02) return null;
  return (
    <div 
      className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 transition-opacity duration-75 select-none"
      style={{ left: `${x}%`, top: `${y}%`, opacity: intensity }}
    >
      {/* Horizontal Anamorphic Flare Beam */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 sm:w-40 h-[1.5px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color} 40%, #ffffff 50%, ${color} 60%, transparent)`,
          filter: 'drop-shadow(0 0 6px rgba(72,199,101,0.9))'
        }}
      />
      {/* Vertical Starlight Beam */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1.5px] h-14 sm:h-20 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, transparent, ${color} 40%, #ffffff 50%, ${color} 60%, transparent)`,
          filter: 'drop-shadow(0 0 6px rgba(72,199,101,0.9))'
        }}
      />
      {/* 45-degree Diagonal Sparkle Micro-Rays */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-[1px] rotate-45 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, #ffffff, transparent)' }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-[1px] -rotate-45 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, #ffffff, transparent)' }}
      />
      {/* Central Starlight Corona Core */}
      <div 
        className="w-4 h-4 rounded-full bg-white blur-[1.5px]"
        style={{ boxShadow: '0 0 14px #ffffff, 0 0 24px #48C765, 0 0 36px #22C55E' }}
      />
    </div>
  );
};

export const LuxuryHero: React.FC<LuxuryHeroProps> = ({ onNavigate, onOpenTechModal }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const heroImageSrc = '/images/alakazam_hero.png?v=9';

  // Continuous Cinematic Optical Metrology Pipeline (Infinite, solemn, 60fps)
  const [introProgress, setIntroProgress] = useState(0); // 0 to 100% loop
  const [glint1, setGlint1] = useState(0); // Gem Mint 10 badge diamond flare
  const [glint2, setGlint2] = useState(0); // Ultrasonic weld diamond flare
  const [glint3, setGlint3] = useState(0); // Cryptographic QR diamond flare
  const [sonicWaveY, setSonicWaveY] = useState(0); // Ultrasonic wave position %
  const [sonicWaveOpacity, setSonicWaveOpacity] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [rotateZ, setRotateZ] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [translateZ, setTranslateZ] = useState(0);
  const [scale, setScale] = useState(1.05);

  // High-Energy 3D Cinematic Motion & Metrology Choreography (Fluid 60fps)
  useEffect(() => {
    let animationFrameId: number;
    const cycleDuration = 13000; // 13.0 seconds dynamic, alive, captivating cycle

    const render = () => {
      const now = performance.now();
      const t = (now % cycleDuration) / cycleDuration; // 0.0 to 1.0 continuous loop
      const p = t * Math.PI * 2;
      setIntroProgress(t * 100);

      // Pronounced 3D Cinematic Motion with Rich Momentum:
      // RotY: Wide, dramatic 3D sweep between -19° and +19°
      const targetRotY = Math.sin(p) * 18.2 + Math.sin(p * 2) * 2.8;
      // RotX: Dynamic vertical inclination between -11° and +10°
      const targetRotX = Math.cos(p) * 10.2 + Math.sin(p * 2) * 1.8;
      // RotZ: Natural organic gyroscopic roll between -3.2° and +3.2°
      const targetRotZ = Math.sin(p) * 3.0;

      // Real 3D Levitation & Depth Breathing:
      const targetTranslateY = Math.sin(p * 2) * 14;
      const targetTranslateZ = Math.cos(p) * 26 + 12;
      const targetScale = 1.05 + Math.sin(p * 2) * 0.035;

      // Choreographed light glints (brilliant diamond flares as light catches angles):
      // Glint 1: Grade 10 badge fires when turned to front left (~t = 0.22 - 0.28)
      const pGlint1 = Math.max(0, 1 - Math.abs(t - 0.24) / 0.045);
      const g1 = Math.pow(pGlint1, 2.2);

      // Glint 2: Ultrasonic acoustic weld on center edge (~t = 0.48 - 0.54)
      const pGlint2 = Math.max(0, 1 - Math.abs(t - 0.50) / 0.045);
      const g2 = Math.pow(pGlint2, 2.2);

      // Glint 3: Cryptographic QR code & ledger on reverse slab (~t = 0.74 - 0.80)
      const pGlint3 = Math.max(0, 1 - Math.abs(t - 0.76) / 0.045);
      const g3 = Math.pow(pGlint3, 2.2);

      // Ultrasonic pulse down the 4mm acrylic weld during center tilt (t = 0.38 to 0.62)
      let sWaveY = 0;
      let sWaveOp = 0;
      if (t >= 0.38 && t <= 0.62) {
        const pSonic = (t - 0.38) / 0.24;
        sWaveY = 8 + pSonic * 84;
        sWaveOp = Math.sin(pSonic * Math.PI);
      }

      setRotateY(targetRotY);
      setRotateX(targetRotX);
      setRotateZ(targetRotZ);
      setTranslateY(targetTranslateY);
      setTranslateZ(targetTranslateZ);
      setScale(targetScale);
      setGlint1(g1);
      setGlint2(g2);
      setGlint3(g3);
      setSonicWaveY(sWaveY);
      setSonicWaveOpacity(sWaveOp);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section 
      id="hero"
      className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between overflow-hidden bg-transparent text-white pt-2 sm:pt-4 pb-12 sm:pb-16 lg:pb-20 select-none"
    >
      
      {/* ═════════════════════════════════════════════════════════════════════
          SISTEMA DE 3 ESCÁNERES ÓPTICOS INSTITUCIONALES (SIN ICONOS):
          - BLANCO: desciende (baja) de arriba hacia abajo
          - ROJO: barre lateralmente de izquierda a derecha
          - ULTRAVIOLETA: asciende (sube) de abajo hacia arriba
          - Al entrar a la web se activan en coreografía de precisión calibrada
          ═════════════════════════════════════════════════════════════════════ */}
      {/* ═════════════════════════════════════════════════════════════════════
          SISTEMA DE 3 ESCÁNERES ÓPTICOS INSTITUCIONALES (SIN ICONOS):
          - Movimiento lento, solemne y pausado de calibre metrológico profesional
          - BLANCO: desciende (baja) de arriba hacia abajo (~9s)
          - ROJO: barre lateralmente de izquierda a derecha (~9.5s)
          - ULTRAVIOLETA: asciende (sube) de abajo hacia arriba (~9s)
          - Ciclo total de 26s: barrido solemne de entrada seguido de reposo sereno
          ═════════════════════════════════════════════════════════════════════ */}
      <style>{`
        /* 1. Escáner Blanco: Desciende lentamente de arriba hacia abajo (0s a 9s) */
        @keyframes scannerBlancoBaja {
          0% {
            top: -2%;
            opacity: 0;
          }
          1.5% {
            opacity: 0.95;
          }
          32.5% {
            opacity: 0.95;
          }
          34.5% {
            top: 102%;
            opacity: 0;
          }
          34.6%, 100% {
            top: -2%;
            opacity: 0;
          }
        }

        /* 2. Escáner Rojo: Lateral pausado de izquierda a derecha (2.5s a 12s) */
        @keyframes scannerRojoLateral {
          0%, 9.5% {
            left: -2%;
            opacity: 0;
          }
          11.5% {
            opacity: 0.90;
          }
          44% {
            opacity: 0.90;
          }
          46% {
            left: 102%;
            opacity: 0;
          }
          46.1%, 100% {
            left: -2%;
            opacity: 0;
          }
        }

        /* 3. Escáner Ultravioleta: Asciende lentamente de abajo hacia arriba (5s a 14s) */
        @keyframes scannerUltravioletaSube {
          0%, 19% {
            top: 102%;
            opacity: 0;
          }
          21% {
            opacity: 0.95;
          }
          52% {
            opacity: 0.95;
          }
          54% {
            top: -2%;
            opacity: 0;
          }
          54.1%, 100% {
            top: 102%;
            opacity: 0;
          }
        }
      `}</style>

      {/* Contenedor de Escáneres Ópticos (Z-20, no interactivo, estricta precisión) */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        
        {/* ================================================================= */}
        {/* ESCÁNER 1: BLANCO POLARIZADO (BAJA LENTO DE ARRIBA HACIA ABAJO)  */}
        {/* ================================================================= */}
        <div
          className="absolute left-0 right-0 pointer-events-none will-change-transform"
          style={{
            animation: 'scannerBlancoBaja 26s cubic-bezier(0.25, 0.1, 0.25, 1.0) infinite',
            opacity: 0
          }}
        >
          {/* Estela sutil de luz blanca superior */}
          <div
            className="w-full h-10 -mt-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(255,255,255,0.06) 0%, transparent 100%)',
              maskImage: 'linear-gradient(to top, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to top, black, transparent)'
            }}
          />

          {/* Línea Láser Blanca Polarizada */}
          <div className="relative w-full flex items-center">
            {/* Micro telemetría óptica derecha */}
            <div className="absolute right-4 sm:right-10 flex items-center opacity-40 select-none">
              <span className="font-mono text-[6px] sm:text-[6.5px] tracking-[0.25em] text-white font-bold uppercase">
                [ 5500K · OPTICAL WHITE ]
              </span>
            </div>

            {/* Filamento Láser Blanco Fino */}
            <div
              className="w-full h-[1px]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.20) 8%, #FFFFFF 50%, rgba(255,255,255,0.20) 92%, transparent 100%)',
                boxShadow: isLight
                  ? '0 0 6px rgba(255,255,255,0.9), 0 0 14px rgba(148,163,184,0.3)'
                  : '0 0 8px #FFFFFF, 0 0 16px rgba(255,255,255,0.5), 0 0 28px rgba(255,255,255,0.2)'
              }}
            />
          </div>
        </div>

        {/* ================================================================= */}
        {/* ESCÁNER 2: ROJO RUBÍ (BARRE LENTO DE IZQUIERDA A DERECHA)         */}
        {/* ================================================================= */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none will-change-transform"
          style={{
            animation: 'scannerRojoLateral 26s cubic-bezier(0.25, 0.1, 0.25, 1.0) infinite',
            opacity: 0
          }}
        >
          {/* Estela sutil de luz roja hacia la izquierda */}
          <div
            className="h-full w-10 -ml-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to left, rgba(239,68,68,0.08) 0%, transparent 100%)',
              maskImage: 'linear-gradient(to left, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to left, black, transparent)'
            }}
          />

          {/* Línea Láser Roja */}
          <div className="relative h-full flex flex-col justify-end pb-8">
            {/* Micro telemetría óptica inferior */}
            <div className="absolute bottom-6 left-3 select-none opacity-50">
              <span className="font-mono text-[6px] sm:text-[6.5px] tracking-[0.25em] text-rose-400 font-bold uppercase whitespace-nowrap">
                [ λ: 635nm · RUBY PROFILE ]
              </span>
            </div>

            {/* Filamento Láser Rojo Fino */}
            <div
              className="h-full w-[1px]"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(239,68,68,0.30) 8%, #FFFFFF 48%, #EF4444 52%, rgba(239,68,68,0.30) 92%, transparent 100%)',
                boxShadow: isLight
                  ? '0 0 6px #EF4444, 0 0 14px rgba(239,68,68,0.45)'
                  : '0 0 8px #EF4444, 0 0 18px rgba(239,68,68,0.65), 0 0 32px rgba(220,38,38,0.35)'
              }}
            />
          </div>
        </div>

        {/* ================================================================= */}
        {/* ESCÁNER 3: ULTRAVIOLETA λ 395nm (ASCIENDE LENTO DE ABAJO A ARRIBA) */}
        {/* ================================================================= */}
        <div
          className="absolute left-0 right-0 pointer-events-none will-change-transform"
          style={{
            animation: 'scannerUltravioletaSube 26s cubic-bezier(0.25, 0.1, 0.25, 1.0) infinite',
            opacity: 0
          }}
        >
          {/* Línea Láser Ultravioleta */}
          <div className="relative w-full flex items-center">
            {/* Micro telemetría óptica izquierda */}
            <div className="absolute left-4 sm:left-10 flex items-center opacity-50 select-none">
              <span className="font-mono text-[6px] sm:text-[6.5px] tracking-[0.25em] text-purple-300 font-bold uppercase">
                [ λ: 395nm · UV FLUORESCENCE ]
              </span>
            </div>

            {/* Filamento Láser Ultravioleta Fino */}
            <div
              className="w-full h-[1px]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.30) 8%, #FAF5FF 48%, #A855F7 52%, rgba(168,85,247,0.30) 92%, transparent 100%)',
                boxShadow: isLight
                  ? '0 0 6px #A855F7, 0 0 14px rgba(168,85,247,0.45)'
                  : '0 0 8px #C084FC, 0 0 18px rgba(168,85,247,0.7), 0 0 35px rgba(126,34,206,0.4)'
              }}
            />
          </div>

          {/* Estela sutil de luz ultravioleta inferior */}
          <div
            className="w-full h-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(168,85,247,0.08) 0%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)'
            }}
          />
        </div>
      </div>

      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center flex-1 my-auto py-1 sm:py-2">
        
        {/* Left Editorial Column */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center items-center lg:items-start text-center lg:text-left pt-2 lg:pt-0">
          
          {/* Refined Technical Kicker - Pure Floating Editorial Typography (Zero Generic Box) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center justify-center lg:justify-start mb-3 sm:mb-4"
          >
            <span className={`font-['Nunito',sans-serif] text-xs font-bold tracking-normal uppercase select-none ${
              isLight ? 'text-[#15803D]' : 'text-[#22C55E]'
            }`}>
              {t('ref.hero.eyebrow')}
            </span>
          </motion.div>

          {/* Monumental Display Headline — Limpio, nítido y de alto impacto (sin efecto 3D) */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className={`font-['Nunito',sans-serif] font-[900] text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[54px] 2xl:text-[62px] leading-[0.98] tracking-normal mb-4 sm:mb-5 uppercase select-none ${
              isLight ? 'text-[#0F172A]' : 'text-white'
            }`}
          >
            {/* First Line: PRECISIÓN / PRECISION */}
            <span className="block">
              {t('ref.hero.title1')}
            </span>

            {/* Second Line: QUE DA / GIVES + VALOR / VALUE */}
            <span className="block mt-1 sm:mt-1.5">
              <span>
                {t('ref.hero.title2')}
              </span>
              <span className={isLight ? 'text-[#16A34A]' : 'text-[#22C55E]'}>
                {t('ref.hero.titleGreen')}
              </span>
            </span>
          </motion.h1>

          {/* Clear Editorial Description */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative mb-4 sm:mb-5"
          >
            <p className="font-sans text-sm sm:text-base lg:text-lg text-[#F4F6F0] max-w-[520px] leading-relaxed font-medium">
              {t('ref.hero.desc')}
            </p>
          </motion.div>

          {/* Action CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-5 sm:mb-6 w-full sm:w-auto"
          >
            {/* Primary Capsule Button */}
            <button
              onClick={() => onNavigate && onNavigate('/submit')}
              className="btn-gorilla-pill w-full sm:w-auto px-7 py-3.5 gap-2 group"
            >
              <span className="font-['Nunito',sans-serif] font-bold text-xs tracking-normal uppercase">
                {t('ref.hero.ctaPrimary')}
              </span>
              <span className="ml-1 text-sm font-bold transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </button>

            {/* Secondary Action: Navigate directly to Technology Page */}
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/technology')}
              className="btn-gorilla-pill-secondary w-full sm:w-auto px-6 py-3 gap-2 group cursor-pointer"
            >
              <span className="font-['Nunito',sans-serif] text-xs font-bold tracking-normal uppercase">
                {t('ref.hero.ctaSecondary')}
              </span>
              <span className="ml-0.5 text-sm font-bold transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>
          </motion.div>

          {/* 3 Scientific Rigor Badges */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className={`w-full max-w-xl grid grid-cols-3 gap-2 sm:gap-3 pt-4 sm:pt-5 border-t ${
              isLight ? 'border-gray-300/80' : 'border-white/10'
            }`}
          >
            {/* Badge 1: Calibre Óptico */}
            <div className={`flex flex-col items-center sm:items-start p-2.5 sm:p-3 border transition-all duration-200 ${
              isLight 
                ? 'bg-white/90 border-gray-200/80 shadow-xs hover:border-gray-400' 
                : 'bg-white/[0.03] border-white/10 hover:border-white/25 backdrop-blur-xs'
            }`}>
              <div className="flex items-center gap-1 mb-1">
                <span className={`font-mono text-xs sm:text-sm font-bold tracking-tight ${
                  isLight ? 'text-gray-950' : 'text-white'
                }`}>
                  0.01 mm
                </span>
              </div>
              <span className={`font-mono text-[9px] uppercase tracking-wider font-semibold ${
                isLight ? 'text-gray-700' : 'text-gray-300'
              }`}>
                {language === 'es' ? 'CALIBRE ÓPTICO' : 'OPTICAL CALIPER'}
              </span>
              <span className={`text-[8.5px] font-sans hidden sm:block ${
                isLight ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {language === 'es' ? 'Centrado 4 cuadrantes' : '4-quadrant centering'}
              </span>
            </div>

            {/* Badge 2: Barrera UV Óptica */}
            <div className={`flex flex-col items-center sm:items-start p-3 border transition-all duration-200 ${
              isLight 
                ? 'bg-white/90 border-gray-200/80 shadow-xs hover:border-gray-400' 
                : 'bg-white/[0.03] border-white/10 hover:border-white/25 backdrop-blur-xs'
            }`}>
              <div className="flex items-center gap-1 mb-1">
                <span className={`font-mono text-xs sm:text-sm font-bold tracking-tight ${
                  isLight ? 'text-gray-950' : 'text-white'
                }`}>
                  {language === 'es' ? 'BARRERA UV' : 'UV SHIELD'}
                </span>
              </div>
              <span className={`font-mono text-[9px] uppercase tracking-wider font-semibold ${
                isLight ? 'text-gray-700' : 'text-gray-300'
              }`}>
                {language === 'es' ? 'POLÍMERO ÓPTICO' : 'OPTICAL POLYMER'}
              </span>
              <span className={`text-[8.5px] font-sans hidden sm:block ${
                isLight ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {language === 'es' ? 'Protección espectral' : 'Spectral preservation'}
              </span>
            </div>

            {/* Badge 3: Cierre Hermético Sónico */}
            <div className={`flex flex-col items-center sm:items-start p-3 border transition-all duration-200 ${
              isLight 
                ? 'bg-white/90 border-gray-200/80 shadow-xs hover:border-gray-400' 
                : 'bg-white/[0.03] border-white/10 hover:border-white/25 backdrop-blur-xs'
            }`}>
              <div className="flex items-center gap-1 mb-1">
                <span className={`font-mono text-xs sm:text-sm font-bold tracking-tight ${
                  isLight ? 'text-gray-950' : 'text-white'
                }`}>
                  {language === 'es' ? 'HERMÉTICO' : 'HERMETIC'}
                </span>
              </div>
              <span className={`font-mono text-[9px] uppercase tracking-wider font-semibold ${
                isLight ? 'text-gray-700' : 'text-gray-300'
              }`}>
                {language === 'es' ? 'FUSIÓN SÓNICA' : 'SONIC FUSION'}
              </span>
              <span className={`text-[8.5px] font-sans hidden sm:block ${
                isLight ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {language === 'es' ? 'Cápsula sin adhesivos' : 'Adhesive-free enclosure'}
              </span>
            </div>
          </motion.div>

        </div>

        {/* Right Column: 3D SLAB INSPECTOR HERO */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center justify-center relative w-full">
          
          {/* 3D Slab Continuous Metrology Stage (Pronounced 3D Perspective & Motion) */}
          <div
            style={{ perspective: 900 }}
            className="relative w-full max-w-[500px] sm:max-w-[620px] lg:max-w-[720px] xl:max-w-[820px] 2xl:max-w-[920px] aspect-[1.48/1] flex items-center justify-center bg-transparent select-none pointer-events-none"
          >
            {/* 3D Depth Aura Behind Slab (Separates slab from background in physical Z-space) */}
            <div
              className="absolute pointer-events-none rounded-full blur-[75px] transition-transform duration-75"
              style={{
                width: '88%',
                height: '78%',
                background: isLight 
                  ? 'radial-gradient(circle, rgba(34,197,94,0.30) 0%, rgba(16,185,129,0.12) 50%, transparent 72%)'
                  : 'radial-gradient(circle, rgba(72,199,101,0.45) 0%, rgba(34,197,94,0.18) 52%, transparent 75%)',
                transform: `translate3d(${-rotateY * 2.2}px, ${-rotateX * 1.8}px, -70px)`,
              }}
            />

            {/* 3D Tilting Slab Wrapper - Pure floating stage with rich 3D levitation, roll & depth */}
            <div
              style={{
                transform: `translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                transition: 'transform 0.05s linear',
                transformStyle: 'preserve-3d',
              }}
              className="relative w-full h-full flex items-center justify-center bg-transparent pointer-events-none"
            >
              {/* Slab Artwork Image - Pure transparent PNG with contoured drop-shadow */}
              <img 
                src={heroImageSrc}
                alt="Gorilla Grading Certified Slab"
                className={`w-full h-full object-contain pointer-events-none transition-all duration-300 ${
                  isLight
                    ? 'filter drop-shadow-[0_18px_30px_rgba(0,0,0,0.15)]'
                    : 'filter drop-shadow-[0_22px_40px_rgba(0,0,0,0.85)]'
                }`}
              />



              {/* Front Slab: Secret Rare Rainbow Holographic Foil Sheen (Directly bounded to card artwork) */}
              <div
                className="absolute pointer-events-none rounded-[6px] overflow-hidden z-10"
                style={{
                  left: '8.4%',
                  top: '26.2%',
                  width: '31.8%',
                  height: '58.2%',
                  mixBlendMode: 'color-dodge',
                }}
              >
                <div
                  className="w-full h-full transition-opacity duration-300"
                  style={{
                    opacity: 0.38 + Math.abs(Math.sin((introProgress / 100) * Math.PI * 2)) * 0.52,
                    background: `linear-gradient(${115 + rotateY * 5.5}deg, 
                      transparent 10%, 
                      rgba(236, 72, 153, 0.32) 25%, 
                      rgba(59, 130, 246, 0.45) 40%, 
                      rgba(255, 255, 255, 0.85) 50%, 
                      rgba(52, 211, 153, 0.48) 60%, 
                      rgba(251, 191, 36, 0.42) 75%, 
                      transparent 90%)`,
                    transform: `translateX(${rotateY * 4.2}%) translateY(${rotateX * 3.0}%)`,
                    filter: 'contrast(1.35) brightness(1.25)'
                  }}
                />
              </div>

              {/* Front Slab: Grade 10 Label Brushed Metallic Optical Shimmer */}
              <div
                className="absolute pointer-events-none rounded-[5px] overflow-hidden z-10"
                style={{
                  left: '8.2%',
                  top: '6.8%',
                  width: '32.2%',
                  height: '16.5%',
                  mixBlendMode: 'overlay',
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    opacity: 0.28 + Math.abs(Math.sin((introProgress / 100) * Math.PI * 2 + 0.5)) * 0.50,
                    background: `linear-gradient(110deg, transparent 28%, rgba(255,255,255,0.85) 50%, transparent 72%)`,
                    transform: `translateX(${rotateY * 3.8}%)`
                  }}
                />
              </div>

              {/* Middle Slab: Ultrasonic Molecular Edge Scanner & Acoustic Pulse */}
              {sonicWaveOpacity > 0.05 && (
                <div
                  className="absolute pointer-events-none z-30 -translate-x-1/2"
                  style={{
                    left: '50.7%',
                    top: `${Math.max(6, Math.min(94, sonicWaveY))}%`,
                    opacity: sonicWaveOpacity
                  }}
                >
                  {/* Center Emerald Laser Bead */}
                  <div
                    className="w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full bg-emerald-200 blur-[0.6px]"
                    style={{
                      boxShadow: '0 0 14px #48C765, 0 0 28px #10B981, 0 0 40px #059669'
                    }}
                  />
                  {/* Transverse Crosshair Metrology Bar */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 sm:w-18 h-[1.5px]"
                    style={{
                      background: 'linear-gradient(90deg, transparent, #48C765 25%, #ffffff 50%, #48C765 75%, transparent)',
                      boxShadow: '0 0 12px #48C765'
                    }}
                  />
                </div>
              )}

              {/* Back Slab: Reverse Card Iridescent Holographic Sheen */}
              <div
                className="absolute pointer-events-none rounded-[6px] overflow-hidden z-10"
                style={{
                  left: '60.0%',
                  top: '26.2%',
                  width: '31.8%',
                  height: '58.2%',
                  mixBlendMode: 'color-dodge',
                }}
              >
                <div
                  className="w-full h-full transition-opacity duration-300"
                  style={{
                    opacity: 0.28 + Math.abs(Math.cos((introProgress / 100) * Math.PI * 2)) * 0.50,
                    background: `linear-gradient(${130 + rotateY * 4.5}deg, 
                      transparent 20%, 
                      rgba(59, 130, 246, 0.40) 40%, 
                      rgba(255, 255, 255, 0.75) 50%, 
                      rgba(245, 158, 11, 0.40) 60%, 
                      transparent 80%)`,
                    transform: `translateX(${rotateY * 3.8}%)`,
                    filter: 'contrast(1.25)'
                  }}
                />
              </div>

              {/* After Effects Diamond Anamorphic Star Glints */}
              <StarGlint x={18.2} y={15} intensity={glint1} color="#A7F3D0" />
              <StarGlint x={50.7} y={45} intensity={glint2} color="#34D399" />
              <StarGlint x={84.2} y={15} intensity={glint3} color="#6EE7B7" />

            </div>
          </div>

        </div>

      </div>

      {/* Embedded Ecosystem Logos Ribbon - Integral part of the Hero, visible above the fold */}
      <div className="relative z-30 w-full shrink-0 mt-6 sm:mt-8">
        <BrandEcosystemRibbon isHeroEmbedded={true} />
      </div>

    </section>
  );
};
