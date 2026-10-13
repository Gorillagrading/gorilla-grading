import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
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

interface Hotspot {
  id: string;
  x: number; // percentage
  y: number; // percentage
  title: string;
  metric: string;
  desc: string;
  category: string;
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

  const heroImageSrc = '/images/alakazam_hero.png?v=6';

  // 10s After Effects Level Cinematic Optical Pipeline (100% transparent, zero box)
  const [isIntroPlaying, setIsIntroPlaying] = useState(true);
  const [introProgress, setIntroProgress] = useState(0); // 0 to 100%
  const [glint1, setGlint1] = useState(0); // Gem Mint 10 badge diamond flare
  const [glint2, setGlint2] = useState(0); // Ultrasonic weld diamond flare
  const [glint3, setGlint3] = useState(0); // Cryptographic QR diamond flare
  const [sonicWaveY, setSonicWaveY] = useState(0); // Ultrasonic wave position %
  const [sonicWaveOpacity, setSonicWaveOpacity] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [showHotspots, setShowHotspots] = useState(true);
  const slabRef = useRef<HTMLDivElement>(null);

  // 10-second automatic high-end cinematic sequence on initial visit
  useEffect(() => {
    if (!isIntroPlaying) return;

    const startTime = Date.now();
    const duration = 10000; // Exactly 10.0 seconds

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setIntroProgress(progress);

      const t = progress / 100;

      // 4-Act After Effects Cinematography & Camera Choreography
      let targetRotY = 0;
      let targetRotX = 0;
      let g1 = 0;
      let g2 = 0;
      let g3 = 0;
      let sWaveY = 0;
      let sWaveOp = 0;

      if (t < 0.34) {
        // Act I: Front Slab Holographic & Grade 10 Diamond Lens Flare
        const p1 = t / 0.34;
        const ease1 = Math.sin(p1 * Math.PI);
        targetRotY = -7.2 * ease1;
        targetRotX = -3.2 * ease1;
        // Diamond Anamorphic Star Glint peaks at p1 ~ 0.58 (~2.0s)
        const glintPhase = Math.max(0, 1 - Math.abs(p1 - 0.58) / 0.22);
        g1 = Math.pow(glintPhase, 3);
      } else if (t < 0.68) {
        // Act II: Middle Slab Ultrasonic Molecular Edge Profile & Sonic Wave
        const p2 = (t - 0.34) / 0.34;
        const ease2 = Math.sin(p2 * Math.PI);
        targetRotY = 6.8 * ease2;
        targetRotX = 2.6 * ease2;
        // Ultrasonic molecular pulse traces down the 4mm acrylic weld
        sWaveY = 8 + p2 * 84;
        sWaveOp = Math.sin(p2 * Math.PI);
        // Diamond Star Glint on Ultrasonic seal reticle peaks at p2 ~ 0.50 (~5.1s)
        const glintPhase2 = Math.max(0, 1 - Math.abs(p2 - 0.50) / 0.20);
        g2 = Math.pow(glintPhase2, 3);
      } else if (t < 0.88) {
        // Act III: Back Slab Cryptographic Ledger & QR Code Inspection
        const p3 = (t - 0.68) / 0.20;
        const ease3 = Math.sin(p3 * Math.PI);
        targetRotY = -4.5 * ease3;
        targetRotX = -1.8 * ease3;
        // Diamond Star Glint on QR code peaks at p3 ~ 0.50 (~7.8s)
        const glintPhase3 = Math.max(0, 1 - Math.abs(p3 - 0.50) / 0.22);
        g3 = Math.pow(glintPhase3, 3);
      } else {
        // Act IV: Hermite Eased Deceleration to Rest (8.8s to 10.0s)
        const p4 = (t - 0.88) / 0.12;
        const settleDecel = Math.pow(1 - p4, 2);
        targetRotY = -1.5 * settleDecel;
        targetRotX = -0.6 * settleDecel;
      }

      setRotateY(targetRotY);
      setRotateX(targetRotX);
      setGlint1(g1);
      setGlint2(g2);
      setGlint3(g3);
      setSonicWaveY(sWaveY);
      setSonicWaveOpacity(sWaveOp);

      setGlarePosition({
        x: Math.round(15 + t * 70),
        y: Math.round(30 + Math.sin(t * Math.PI * 2) * 18)
      });

      if (elapsed >= duration) {
        clearInterval(timer);
        setIsIntroPlaying(false);
        setRotateX(0);
        setRotateY(0);
        setGlint1(0);
        setGlint2(0);
        setGlint3(0);
        setSonicWaveOpacity(0);
        setGlarePosition({ x: 50, y: 50 });
      }
    }, 20);

    return () => clearInterval(timer);
  }, [isIntroPlaying]);

  const hotspots: Hotspot[] = [
    {
      id: 'centering',
      x: 21,
      y: 52,
      category: language === 'es' ? 'CENTRADO Y SUPERFICIE' : 'OPTICAL CENTERING & FOIL',
      title: language === 'es' ? 'Centrado Óptico Sub-Píxel' : 'Sub-Pixel Optical Centering',
      metric: language === 'es' ? 'Simetría 50/50 · Gem Mint' : '50/50 Symmetry · Gem Mint',
      desc: language === 'es' 
        ? 'Peritaje digital que verifica la simetría perimetral del marco y la ausencia de defectos en el foil.' 
        : 'Digital analysis confirming border perimeter symmetry and absence of foil anomalies.'
    },
    {
      id: 'corner',
      x: 21,
      y: 18,
      category: language === 'es' ? 'ETIQUETA OFICIAL GGI' : 'OFFICIAL GGI LABEL',
      title: language === 'es' ? 'Calificación 10 Gem Mint' : 'Grade 10 Gem Mint',
      metric: language === 'es' ? 'Holografía y Código Interno' : 'Holographic & Internal Code',
      desc: language === 'es' 
        ? 'Etiqueta de seguridad de alta resolución con metadatos oficiales y código único de certificación.' 
        : 'High-resolution security label with official metadata and unique certification registry code.'
    },
    {
      id: 'sonic',
      x: 48,
      y: 45,
      category: language === 'es' ? 'CIERRE HERMÉTICO SÓNICO' : 'ULTRASONIC FUSION',
      title: language === 'es' ? 'Sellado Ultrasónico de Cantos' : 'Ultrasonic Edge Fusion',
      metric: language === 'es' ? 'Cápsula 100% Estanca' : '100% Hermetic Acrylic Weld',
      desc: language === 'es' 
        ? 'Fusión molecular de acrílico sin adhesivos químicos, aislando la pieza contra el polvo y la humedad.' 
        : 'Molecular acoustic acrylic weld without glues, fully sealing the specimen against humidity.'
    },
    {
      id: 'uv',
      x: 77,
      y: 18,
      category: language === 'es' ? 'REVERSO Y REGISTRO QR' : 'BACK REVERSE & QR LEDGER',
      title: language === 'es' ? 'Verificación Criptográfica' : 'Cryptographic Verification',
      metric: language === 'es' ? 'NFC & Ledger Blockchain' : 'NFC & Blockchain Ledger',
      desc: language === 'es' 
        ? 'Dorso oficial con código QR vinculado al libro mayor público de autenticidad Gorilla Verify.' 
        : 'Official back label featuring QR code linked to the Gorilla Verify ledger of authenticity.'
    }
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isIntroPlaying) {
      setIsIntroPlaying(false);
    }
    if (!slabRef.current) return;
    const rect = slabRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -12;
    const rY = ((x - centerX) / centerX) * 14;

    setRotateX(rX);
    setRotateY(rY);
    setGlarePosition({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100)
    });
  };

  const handleMouseLeave = () => {
    if (isIntroPlaying) return;
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  };

  return (
    <section 
      id="hero"
      className="relative w-full min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden bg-transparent text-white py-8 lg:py-14 select-none"
    >
      
      {/* Background Architectural Lights - Gentle luxury depth without muddy green wash */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="hidden lg:block absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[#48C765]/15 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        
        {/* Left Editorial Column */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center items-center lg:items-start text-center lg:text-left pt-4 lg:pt-6">
          
          {/* Refined Technical Kicker - Pure Floating Editorial Typography (Zero Generic Box) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center justify-center lg:justify-start mb-4 sm:mb-6"
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
            className={`font-['Nunito',sans-serif] font-[900] text-4xl sm:text-5xl md:text-6xl lg:text-[66px] xl:text-[76px] 2xl:text-[82px] leading-[0.96] tracking-normal mb-6 sm:mb-8 uppercase select-none ${
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
            className="relative mb-6 sm:mb-9"
          >
            <p className="font-sans text-base sm:text-lg lg:text-xl text-[#F4F6F0] max-w-[540px] leading-relaxed font-medium">
              {t('ref.hero.desc')}
            </p>
          </motion.div>

          {/* Action CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 mb-8 sm:mb-10 w-full sm:w-auto"
          >
            {/* Primary Capsule Button */}
            <button
              onClick={() => onNavigate && onNavigate('/submit')}
              className="btn-gorilla-pill w-full sm:w-auto px-8 py-4 gap-2.5 group"
            >
              <span className="font-['Nunito',sans-serif] font-bold text-xs tracking-normal uppercase">
                {t('ref.hero.ctaPrimary')}
              </span>
              <span className="ml-1 text-sm font-bold transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </button>

            {/* Secondary Action: Smooth Scroll to 3D Technology Overview Section */}
            <a
              href="#technology-overview"
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById('technology-overview');
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth' });
                } else if (onNavigate) {
                  onNavigate('/technology');
                }
              }}
              className="btn-gorilla-pill-secondary w-full sm:w-auto px-7 py-3.5 gap-2.5 group cursor-pointer"
            >
              <span className="font-['Nunito',sans-serif] text-xs font-bold tracking-normal uppercase">
                {t('ref.hero.ctaSecondary')}
              </span>
              <div className="flex items-center justify-center pl-[2px] transition-transform duration-300 group-hover:translate-y-0.5">
                <svg className="w-2.5 h-2.5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </div>
            </a>
          </motion.div>

          {/* 3 Scientific Rigor Badges */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className={`w-full max-w-xl grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-6 sm:pt-8 border-t ${
              isLight ? 'border-gray-300/80' : 'border-white/10'
            }`}
          >
            {/* Badge 1: Calibre Óptico */}
            <div className={`flex flex-col items-center sm:items-start p-3 border transition-all duration-200 ${
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
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center justify-center relative">
          
          {/* Inspector Controls Ribbon */}
          <div className="w-full max-w-[540px] sm:max-w-[640px] lg:max-w-[740px] xl:max-w-[820px] 2xl:max-w-[880px] flex items-center justify-between mb-3 px-2 font-mono text-[10px] text-gray-400">
            <div className="flex items-center gap-2">
              <Crosshair className={`w-3.5 h-3.5 animate-spin ${isLight ? 'text-[#15803D]' : 'text-emerald-400'}`} style={{ animationDuration: '8s' }} />
              <span className={`uppercase tracking-normal font-bold ${isLight ? 'text-[#15803D]' : 'text-emerald-400/90'}`}>
                SLAB INSPECTOR 3D
              </span>
            </div>

            <div className="flex items-center gap-3">
              {!isIntroPlaying && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIntroProgress(0);
                      setActiveHotspot(null);
                      setIsIntroPlaying(true);
                    }}
                    className="hover:text-emerald-400 underline uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    {language === 'es' ? '▶ Repetir Intro' : '▶ Replay Intro'}
                  </button>
                  <span className="text-gray-600">|</span>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowHotspots(!showHotspots)}
                className="hover:text-white underline uppercase tracking-wider cursor-pointer transition-colors"
              >
                {showHotspots ? (language === 'es' ? 'Ocultar Puntos' : 'Hide Hotspots') : (language === 'es' ? 'Mostrar Puntos' : 'Show Hotspots')}
              </button>
            </div>
          </div>

          {/* 3D Slab Interactive Viewport */}
          <div
            ref={slabRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => {
              if (isIntroPlaying) setIsIntroPlaying(false);
            }}
            style={{ perspective: 1200 }}
            className="relative w-full max-w-[540px] sm:max-w-[640px] lg:max-w-[740px] xl:max-w-[820px] 2xl:max-w-[880px] aspect-[1.48/1] flex items-center justify-center cursor-crosshair bg-transparent select-none"
          >
            {/* 3D Tilting Slab Wrapper - Pure floating stage, zero boxes or overlays */}
            <div
              style={{
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isIntroPlaying ? 1.025 : 1})`,
                transition: isIntroPlaying ? 'transform 0.2s ease-out' : 'transform 0.12s ease-out',
                transformStyle: 'preserve-3d'
              }}
              className="relative w-full h-full flex items-center justify-center bg-transparent pointer-events-auto"
            >
              {/* Slab Artwork Image - Pure transparent PNG, zero square box */}
              <img 
                src={heroImageSrc}
                alt="Gorilla Grading Certified Slab"
                className={`w-full h-full object-contain pointer-events-none transition-all duration-300 filter contrast-[1.06] brightness-[1.08] sm:brightness-[1.04] ${
                  isLight 
                    ? 'drop-shadow-[0_16px_28px_rgba(0,0,0,0.10)]' 
                    : 'drop-shadow-[0_25px_45px_rgba(0,0,0,0.65)]'
                }`}
              />

              {/* Dynamic Laser Metrology Scanning Line (during 10s intro) */}
              {isIntroPlaying && (
                <div
                  className="absolute top-[6%] bottom-[6%] w-[1.5px] pointer-events-none z-20"
                  style={{
                    left: `${14 + (introProgress / 100) * 72}%`,
                    background: 'linear-gradient(to bottom, transparent, rgba(72,199,101,0.85) 20%, #A7F3D0 50%, rgba(72,199,101,0.85) 80%, transparent)',
                    boxShadow: '0 0 12px rgba(72,199,101,0.9), 0 0 24px rgba(72,199,101,0.45)',
                    opacity: Math.sin((introProgress / 100) * Math.PI)
                  }}
                />
              )}

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
                    opacity: isIntroPlaying
                      ? Math.max(0.15, Math.sin((introProgress / 100) * Math.PI) * 0.85)
                      : 0.35,
                    background: `linear-gradient(${115 + rotateY * 4}deg, 
                      transparent 10%, 
                      rgba(236, 72, 153, 0.28) 25%, 
                      rgba(59, 130, 246, 0.38) 40%, 
                      rgba(255, 255, 255, 0.75) 50%, 
                      rgba(52, 211, 153, 0.42) 60%, 
                      rgba(251, 191, 36, 0.38) 75%, 
                      transparent 90%)`,
                    transform: isIntroPlaying
                      ? `translateX(${-60 + (introProgress / 100) * 140}%)`
                      : `translateX(${rotateY * 3}%) translateY(${rotateX * 2}%)`,
                    filter: 'contrast(1.3) brightness(1.2)'
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
                    opacity: isIntroPlaying ? Math.sin((introProgress / 100) * Math.PI) * 0.65 : 0.25,
                    background: `linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.75) 50%, transparent 70%)`,
                    transform: isIntroPlaying
                      ? `translateX(${-80 + (introProgress / 100) * 180}%)`
                      : `translateX(${rotateY * 2}%)`
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
                      boxShadow: '0 0 12px #48C765, 0 0 24px #10B981, 0 0 36px #059669'
                    }}
                  />
                  {/* Transverse Crosshair Metrology Bar */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 sm:w-16 h-[1.5px]"
                    style={{
                      background: 'linear-gradient(90deg, transparent, #48C765 25%, #ffffff 50%, #48C765 75%, transparent)',
                      boxShadow: '0 0 10px #48C765'
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
                    opacity: isIntroPlaying
                      ? Math.max(0.1, Math.sin((introProgress / 100) * Math.PI) * 0.7)
                      : 0.25,
                    background: `linear-gradient(${130 + rotateY * 3}deg, 
                      transparent 20%, 
                      rgba(59, 130, 246, 0.35) 40%, 
                      rgba(255, 255, 255, 0.65) 50%, 
                      rgba(245, 158, 11, 0.35) 60%, 
                      transparent 80%)`,
                    transform: isIntroPlaying
                      ? `translateX(${-70 + (introProgress / 100) * 150}%)`
                      : `translateX(${rotateY * 3}%)`,
                    filter: 'contrast(1.2)'
                  }}
                />
              </div>

              {/* After Effects Diamond Anamorphic Star Glints */}
              <StarGlint x={18.2} y={15} intensity={glint1} color="#A7F3D0" />
              <StarGlint x={50.7} y={45} intensity={glint2} color="#34D399" />
              <StarGlint x={84.2} y={15} intensity={glint3} color="#6EE7B7" />

              {/* Interactive Inspection Hotspots */}
              {showHotspots && !isIntroPlaying && hotspots.map((spot) => {
                const isActive = activeHotspot?.id === spot.id;

                return (
                  <div
                    key={spot.id}
                    style={{
                      left: `${spot.x}%`,
                      top: `${spot.y}%`,
                      transform: 'translate(-50%, -50%) translateZ(40px)'
                    }}
                    className="absolute z-30"
                    onMouseEnter={() => setActiveHotspot(spot)}
                    onClick={() => setActiveHotspot(isActive ? null : spot)}
                  >
                    {/* Precision Metrology Reticle Node - Optical Glass Without Black Box */}
                    <div className="relative cursor-pointer group/node">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full border transition-all duration-200 ${
                        isActive 
                          ? 'border-amber-400 bg-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.7)] scale-110' 
                          : (isLight 
                              ? 'border-[#16A34A] bg-white/70 backdrop-blur-md shadow-sm group-hover/node:border-black group-hover/node:scale-115' 
                              : 'border-[#48C765] bg-black/40 backdrop-blur-md group-hover/node:border-white group-hover/node:scale-115')
                      }`}>
                        <span className={`font-mono text-[11px] font-extrabold leading-none ${
                          isActive 
                            ? 'text-amber-500' 
                            : (isLight ? 'text-[#16A34A]' : 'text-[#48C765]')
                        }`}>
                          +
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Active Hotspot HUD Dossier Tooltip */}
              <AnimatePresence>
                {activeHotspot && (
                  <motion.div
                    key={activeHotspot.id}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                      left: activeHotspot.x > 65 ? 'auto' : activeHotspot.x < 35 ? '10px' : '50%',
                      right: activeHotspot.x > 65 ? '10px' : 'auto',
                      top: activeHotspot.y > 50 ? 'auto' : `${Math.min(activeHotspot.y + 6, 50)}%`,
                      bottom: activeHotspot.y > 50 ? `${Math.max(100 - activeHotspot.y + 6, 8)}%` : 'auto',
                      transform: activeHotspot.x >= 35 && activeHotspot.x <= 65 
                        ? 'translate(-50%, 0) translateZ(50px)' 
                        : 'translateZ(50px)'
                    }}
                    className={`absolute z-40 w-[240px] sm:w-64 max-w-[calc(100%-20px)] p-3 sm:p-3.5 border backdrop-blur-xl text-left font-mono pointer-events-auto shadow-2xl ${
                      isLight 
                        ? 'border-gray-300 bg-white/95 text-gray-900 shadow-xl' 
                        : 'border-[#48C765]/60 bg-[#121613]/95 text-white shadow-[0_15px_35px_rgba(0,0,0,0.9)]'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-current/10">
                      <span className={`text-[9px] uppercase tracking-normal font-bold ${
                        isLight ? 'text-[#16A34A]' : 'text-[#48C765]'
                      }`}>
                        {activeHotspot.category}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveHotspot(null); }}
                        className={`text-xs px-1 ${isLight ? 'text-gray-400 hover:text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        ✕
                      </button>
                    </div>

                    <div className={`font-['Nunito',sans-serif] text-sm uppercase font-[900] tracking-normal mb-0.5 ${
                      isLight ? 'text-gray-950' : 'text-white'
                    }`}>
                      {activeHotspot.title}
                    </div>

                    <div className={`text-[11px] font-bold mb-1.5 ${
                      isLight ? 'text-amber-600' : 'text-amber-300'
                    }`}>
                      {activeHotspot.metric}
                    </div>

                    <p className={`font-sans text-[11px] leading-relaxed ${
                      isLight ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      {activeHotspot.desc}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          <div className={`mt-3 font-mono text-[10px] text-center ${
            isLight ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {language === 'es' ? 'Toca o mueve el cursor sobre el slab para inspeccionar reflejos y puntos forenses' : 'Tap or move cursor over the slab to inspect dynamic glare & forensic hotspots'}
          </div>

        </div>

      </div>

    </section>
  );
};
