import React from 'react';
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

export const LuxuryHero: React.FC<LuxuryHeroProps> = ({ onNavigate, onOpenTechModal }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const ambientRef = React.useRef<HTMLVideoElement>(null);
  // No poster image: the video fades in once its first frame is ready
  const [videoReady, setVideoReady] = React.useState(false);

  // React does not set the DOM `muted` property from the attribute, so browsers
  // sometimes block autoplay and leave the poster/first frame on screen.
  // Force muted and retry playback until it actually starts (main video and its blurred backdrop).
  React.useEffect(() => {
    const videos = [videoRef.current, ambientRef.current].filter((v): v is HTMLVideoElement => !!v);
    if (videos.length === 0) return;
    videos.forEach((v) => {
      v.muted = true;
      v.defaultMuted = true;
    });

    const tryPlay = () => {
      videos.forEach((v) => {
        if (v.paused) v.play().catch(() => {});
      });
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') tryPlay();
    };

    tryPlay();
    videos.forEach((v) => {
      v.addEventListener('loadeddata', tryPlay);
      v.addEventListener('canplay', tryPlay);
      v.addEventListener('stalled', tryPlay);
    });
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pointerdown', tryPlay);
    window.addEventListener('scroll', tryPlay, { passive: true });

    return () => {
      videos.forEach((v) => {
        v.removeEventListener('loadeddata', tryPlay);
        v.removeEventListener('canplay', tryPlay);
        v.removeEventListener('stalled', tryPlay);
      });
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pointerdown', tryPlay);
      window.removeEventListener('scroll', tryPlay);
    };
  }, []);

  return (
    <section 
      id="hero"
      className="relative w-full min-h-[calc(100vh-5rem-38px)] flex flex-col justify-between overflow-hidden bg-transparent text-white pt-2 sm:pt-4 pb-0 select-none touch-pan-y"
    >
      
      {/* ═════════════════════════════════════════════════════════════════════
          SISTEMA DE ESCÁNERES ÓPTICOS + ANIMACIÓN 3D DE PLACA TIPO VÍDEO
          - Ejecutado 100% en el compositor GPU de forma autónoma
          - Cero carga en hilo JS, sin temblores en móvil y sin interferencias táctiles
          ═════════════════════════════════════════════════════════════════════ */}
      <style>{`

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

      {/* Full-Section Video Background - Covers the whole hero, text sits on a theme-aware gradient for legibility */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        {/* Blurred copy of the video that fills the whole width behind the real one (desktop only),
            so the complete video can be shown at the hero height without empty side bands */}
        {videoReady && (
        <video
          ref={ambientRef}
          src="/videos/gorilla_hero_loop.mp4"
          aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          className="hidden lg:block absolute inset-0 w-full h-full object-cover scale-110 blur-2xl"
          style={{ opacity: 0.85, pointerEvents: 'none' }}
          onLoadedData={(e) => { e.currentTarget.muted = true; void e.currentTarget.play().catch(() => {}); }}
        />
        )}
        {/* On desktop the real video keeps its 16:9 shape at the hero height, centered, with its side
            edges feathered into the blurred backdrop. On small screens it simply covers the hero. */}
        <div className="absolute inset-0 flex justify-center lg:justify-end">
          <div className="relative w-full h-full lg:w-auto lg:aspect-video lg:max-w-full shrink-0 lg:[mask-image:linear-gradient(to_right,transparent,#000_22%)] lg:[-webkit-mask-image:linear-gradient(to_right,transparent,#000_22%)]">
            <video
              ref={videoRef}
              src="/videos/gorilla_hero_loop.mp4"
              aria-label="Gorilla Grading hero video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              onLoadedData={() => setVideoReady(true)}
              onPlaying={() => setVideoReady(true)}
              className="w-full h-full object-cover lg:object-contain"
              style={{
                opacity: videoReady ? 1 : 0,
                transition: 'opacity 0.6s ease',
                WebkitTouchCallout: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: isLight
              ? 'linear-gradient(90deg, rgba(240,247,240,0.80) 0%, rgba(240,247,240,0.55) 38%, rgba(240,247,240,0.10) 70%, rgba(240,247,240,0) 100%)'
              : 'linear-gradient(90deg, rgba(5,10,8,0.92) 0%, rgba(5,10,8,0.75) 38%, rgba(5,10,8,0.20) 70%, rgba(5,10,8,0) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center flex-1 my-auto py-4 sm:py-6">
        
        {/* Left Editorial Column */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center items-center lg:items-start text-center lg:text-left pt-2 lg:pt-0">
          
          {/* Refined Technical Kicker - Pure Floating Editorial Typography (Zero Generic Box) */}
          <div className="flex items-center justify-center lg:justify-start mb-3 sm:mb-4">
            <span className={`font-['Nunito',sans-serif] text-xs font-bold tracking-normal uppercase select-none ${
              isLight ? 'text-[#15803D]' : 'text-[#22C55E]'
            }`}>
              {t('ref.hero.eyebrow')}
            </span>
          </div>

          {/* Monumental Display Headline — Limpio, nítido y de alto impacto (sin efecto 3D) */}
          <h1 
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
          </h1>

          {/* Clear Editorial Description */}
          <div className="relative mb-4 sm:mb-5">
            <p className="font-sans text-sm sm:text-base lg:text-lg text-[#F4F6F0] max-w-[520px] leading-relaxed font-medium">
              {t('ref.hero.desc')}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-5 sm:mb-6 w-full sm:w-auto">
            {/* Primary Capsule Button */}
            <button
              onClick={() => onNavigate && onNavigate('/pricing')}
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
          </div>

          {/* 3 Scientific Rigor Badges */}
          <div 
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
          </div>

        </div>

      </div>

      {/* Embedded Ecosystem Logos Ribbon - Integral part of the Hero, visible above the fold */}
      <div className="relative z-30 w-full shrink-0 mt-auto">
        <BrandEcosystemRibbon isHeroEmbedded={true} />
      </div>

    </section>
  );
};