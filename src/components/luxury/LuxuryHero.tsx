import React from 'react';
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

// After Effects Diamond Star Lens Flare Component (Zero background box, pure light physics, 100% GPU CSS animation)
const StarGlint: React.FC<{ x: number; y: number; animationClass: string; color?: string }> = ({ 
  x, 
  y, 
  animationClass, 
  color = '#48C765' 
}) => {
  return (
    <div 
      className={`absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 select-none ${animationClass}`}
      style={{ left: `${x}%`, top: `${y}%` }}
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

  return (
    <section 
      id="hero"
      className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between overflow-hidden bg-transparent text-white pt-2 sm:pt-4 pb-12 sm:pb-16 lg:pb-20 select-none touch-pan-y"
    >
      
      {/* ═════════════════════════════════════════════════════════════════════
          SISTEMA DE ESCÁNERES ÓPTICOS + ANIMACIÓN 3D DE PLACA TIPO VÍDEO
          - Ejecutado 100% en el compositor GPU de forma autónoma
          - Cero carga en hilo JS, sin temblores en móvil y sin interferencias táctiles
          ═════════════════════════════════════════════════════════════════════ */}
      <style>{`
        /* 1. Escáner Rojo: Lateral pausado de izquierda a derecha (2.5s a 12s) */
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

        /* 4. Movimiento 3D Cinemático de la Placa / Slab (Compositor GPU 100% Fluido - Cero Temblores) */
        @keyframes heroSlabCinematicMotion {
          0% {
            transform: translate3d(0px, 0px, 34px) rotateX(10deg) rotateY(0deg) rotateZ(0deg) scale(1.04);
          }
          12.5% {
            transform: translate3d(0px, 10px, 26px) rotateX(7.5deg) rotateY(15deg) rotateZ(2deg) scale(1.07);
          }
          25% {
            transform: translate3d(0px, 14px, 12px) rotateX(0deg) rotateY(18.2deg) rotateZ(3deg) scale(1.085);
          }
          37.5% {
            transform: translate3d(0px, 10px, -4px) rotateX(-7.5deg) rotateY(10deg) rotateZ(2deg) scale(1.07);
          }
          50% {
            transform: translate3d(0px, 0px, -14px) rotateX(-10deg) rotateY(0deg) rotateZ(0deg) scale(1.04);
          }
          62.5% {
            transform: translate3d(0px, -10px, -4px) rotateX(-7.5deg) rotateY(-15deg) rotateZ(-2deg) scale(1.02);
          }
          75% {
            transform: translate3d(0px, -14px, 12px) rotateX(0deg) rotateY(-18.2deg) rotateZ(-3deg) scale(1.015);
          }
          87.5% {
            transform: translate3d(0px, -10px, 26px) rotateX(7.5deg) rotateY(-10deg) rotateZ(-2deg) scale(1.02);
          }
          100% {
            transform: translate3d(0px, 0px, 34px) rotateX(10deg) rotateY(0deg) rotateZ(0deg) scale(1.04);
          }
        }

        @media (max-width: 639px) {
          @keyframes heroSlabCinematicMotion {
            0% {
              transform: translate3d(0px, 0px, 18px) rotateX(6deg) rotateY(0deg) rotateZ(0deg) scale(1.02);
            }
            12.5% {
              transform: translate3d(0px, 6px, 14px) rotateX(4.5deg) rotateY(10deg) rotateZ(1.5deg) scale(1.04);
            }
            25% {
              transform: translate3d(0px, 9px, 8px) rotateX(0deg) rotateY(12deg) rotateZ(2deg) scale(1.05);
            }
            37.5% {
              transform: translate3d(0px, 6px, -2px) rotateX(-4.5deg) rotateY(7deg) rotateZ(1.5deg) scale(1.04);
            }
            50% {
              transform: translate3d(0px, 0px, -8px) rotateX(-6deg) rotateY(0deg) rotateZ(0deg) scale(1.02);
            }
            62.5% {
              transform: translate3d(0px, -6px, -2px) rotateX(-4.5deg) rotateY(-10deg) rotateZ(-1.5deg) scale(1.01);
            }
            75% {
              transform: translate3d(0px, -9px, 8px) rotateX(0deg) rotateY(-12deg) rotateZ(-2deg) scale(1.005);
            }
            87.5% {
              transform: translate3d(0px, -6px, 14px) rotateX(4.5deg) rotateY(-7deg) rotateZ(-1.5deg) scale(1.01);
            }
            100% {
              transform: translate3d(0px, 0px, 18px) rotateX(6deg) rotateY(0deg) rotateZ(0deg) scale(1.02);
            }
          }
        }

        /* 5. Aura de Profundidad 3D */
        @keyframes heroDepthAuraMotion {
          0%, 100% {
            transform: translate3d(0px, -18px, -70px);
            opacity: 0.65;
          }
          25% {
            transform: translate3d(-38px, 0px, -70px);
            opacity: 0.90;
          }
          50% {
            transform: translate3d(0px, 18px, -70px);
            opacity: 0.65;
          }
          75% {
            transform: translate3d(38px, 0px, -70px);
            opacity: 0.90;
          }
        }

        /* 6. Brillo Holográfico Arcoíris Carta Frontal */
        @keyframes heroFoilFrontSheen {
          0%, 100% {
            opacity: 0.40;
            transform: translate3d(0%, 8%, 0);
          }
          25% {
            opacity: 0.90;
            transform: translate3d(22%, 0%, 0);
          }
          50% {
            opacity: 0.45;
            transform: translate3d(0%, -8%, 0);
          }
          75% {
            opacity: 0.88;
            transform: translate3d(-22%, 0%, 0);
          }
        }

        /* 7. Shimmer Metálico Etiqueta Grado 10 */
        @keyframes heroLabelFrontShimmer {
          0%, 100% {
            opacity: 0.28;
            transform: translate3d(-18%, 0, 0);
          }
          25% {
            opacity: 0.82;
            transform: translate3d(20%, 0, 0);
          }
          50% {
            opacity: 0.32;
            transform: translate3d(0%, 0, 0);
          }
          75% {
            opacity: 0.74;
            transform: translate3d(-20%, 0, 0);
          }
        }

        /* 8. Brillo Iridiscente Carta Trasera */
        @keyframes heroFoilReverseSheen {
          0%, 100% {
            opacity: 0.30;
            transform: translate3d(0%, 0, 0);
          }
          25% {
            opacity: 0.45;
            transform: translate3d(16%, 0, 0);
          }
          50% {
            opacity: 0.35;
            transform: translate3d(0%, 0, 0);
          }
          75% {
            opacity: 0.82;
            transform: translate3d(-16%, 0, 0);
          }
        }

        /* 9. Destellos de Luz Diamante (Star Glints) */
        @keyframes heroStarGlint1 {
          0%, 20% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
          24% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          28%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
        }

        @keyframes heroStarGlint2 {
          0%, 46% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          54%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
        }

        @keyframes heroStarGlint3 {
          0%, 72% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
          76% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          80%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
        }

        .hero-slab-animated {
          animation: heroSlabCinematicMotion 13s ease-in-out infinite;
          will-change: transform;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .hero-aura-animated {
          animation: heroDepthAuraMotion 13s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .hero-foil-animated {
          animation: heroFoilFrontSheen 13s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .hero-label-animated {
          animation: heroLabelFrontShimmer 13s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .hero-reverse-animated {
          animation: heroFoilReverseSheen 13s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .hero-glint-1-animated {
          animation: heroStarGlint1 13s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .hero-glint-2-animated {
          animation: heroStarGlint2 13s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .hero-glint-3-animated {
          animation: heroStarGlint3 13s ease-in-out infinite;
          will-change: transform, opacity;
        }
      `}</style>

      {/* Contenedor de Escáneres Ópticos (Z-20, no interactivo, estricta precisión) */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        
        {/* ================================================================= */}
        {/* ESCÁNER ROJO RUBÍ (BARRE LENTO DE IZQUIERDA A DERECHA)            */}
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
              background: 'linear-gradient(to left, rgba(239,68,68,0.08) 0%, transparent 100%)'
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
        {/* ESCÁNER ULTRAVIOLETA λ 395nm (ASCIENDE LENTO DE ABAJO A ARRIBA)    */}
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
              background: 'linear-gradient(to bottom, rgba(168,85,247,0.08) 0%, transparent 100%)'
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
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center justify-center relative w-full pointer-events-none select-none touch-pan-y">
          
          {/* 3D Slab Continuous Metrology Stage (Pronounced 3D Perspective & Motion - 100% GPU Autonomous Video-Like) */}
          <div
            style={{ perspective: 1000 }}
            className="relative w-full max-w-[500px] sm:max-w-[620px] lg:max-w-[720px] xl:max-w-[820px] 2xl:max-w-[920px] aspect-[1.48/1] flex items-center justify-center bg-transparent select-none pointer-events-none"
          >
            {/* 3D Depth Aura Behind Slab (Separates slab from background in physical Z-space) */}
            <div
              className={`hero-aura-animated absolute pointer-events-none rounded-full blur-[75px] select-none ${
                isLight 
                  ? 'bg-gradient-to-r from-emerald-500/25 via-green-500/15 to-transparent' 
                  : 'bg-gradient-to-r from-[#48C765]/40 via-emerald-500/20 to-transparent'
              }`}
              style={{
                width: '88%',
                height: '78%',
              }}
            />

            {/* 3D Tilting Slab Wrapper - Pure floating stage with rich 3D levitation, roll & depth */}
            <div
              className="hero-slab-animated relative w-full h-full flex items-center justify-center bg-transparent pointer-events-none select-none"
            >
              {/* Slab Artwork Image - Pure transparent PNG with contoured drop-shadow */}
              <img 
                src={heroImageSrc}
                alt="Gorilla Grading Certified Slab"
                draggable={false}
                loading="eager"
                decoding="async"
                className={`w-full h-full object-contain pointer-events-none select-none transition-filter duration-300 ${
                  isLight
                    ? 'filter drop-shadow-[0_18px_30px_rgba(0,0,0,0.15)]'
                    : 'filter drop-shadow-[0_22px_40px_rgba(0,0,0,0.85)]'
                }`}
                style={{
                  WebkitTouchCallout: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  pointerEvents: 'none',
                }}
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
                  className="hero-foil-animated w-full h-full"
                  style={{
                    background: `linear-gradient(118deg, 
                      transparent 10%, 
                      rgba(236, 72, 153, 0.35) 25%, 
                      rgba(59, 130, 246, 0.48) 40%, 
                      rgba(255, 255, 255, 0.88) 50%, 
                      rgba(52, 211, 153, 0.50) 60%, 
                      rgba(251, 191, 36, 0.45) 75%, 
                      transparent 90%)`,
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
                  className="hero-label-animated w-full h-full"
                  style={{
                    background: `linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.88) 50%, transparent 75%)`
                  }}
                />
              </div>



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
                  className="hero-reverse-animated w-full h-full"
                  style={{
                    background: `linear-gradient(132deg, 
                      transparent 20%, 
                      rgba(59, 130, 246, 0.42) 40%, 
                      rgba(255, 255, 255, 0.78) 50%, 
                      rgba(245, 158, 11, 0.42) 60%, 
                      transparent 80%)`,
                    filter: 'contrast(1.25)'
                  }}
                />
              </div>

              {/* After Effects Diamond Anamorphic Star Glints */}
              <StarGlint x={18.2} y={15} animationClass="hero-glint-1-animated" color="#A7F3D0" />
              <StarGlint x={50.7} y={45} animationClass="hero-glint-2-animated" color="#34D399" />
              <StarGlint x={84.2} y={15} animationClass="hero-glint-3-animated" color="#6EE7B7" />

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
