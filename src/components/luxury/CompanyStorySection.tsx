import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

// Brochure-style 3D tilt that follows the mouse on hover (same effect as the pillar cards)
const TiltCard: React.FC<{ isLight: boolean; className: string; children: React.ReactNode }> = ({ isLight, className, children }) => {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 12, y: px * 16 });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className={`relative ${hovered ? 'z-10' : 'z-0'}`} style={{ perspective: 1000 }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.2 : 1})`,
          transition: hovered ? 'transform 0.12s ease-out' : 'transform 0.5s ease',
          boxShadow: hovered
            ? `${-tilt.y * 1.2}px ${14 + tilt.x}px 30px rgba(0,0,0,0.35)`
            : 'none',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        className={className}
      >
        {children}
      </div>
    </div>
  );
};

export const CompanyStorySection: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <section className={`w-full transition-colors duration-300 pt-20 pb-24 px-6 lg:px-12 relative overflow-hidden ${
      isLight ? 'bg-[#ECE5D8] text-[#14170F]' : 'bg-[#454545] text-white'
    }`}>

      {/* Background Subtle Elements */}
      <div className={`absolute top-0 right-0 w-[800px] h-[800px] blur-[150px] pointer-events-none rounded-full ${
        isLight ? 'bg-[#15803D]/[0.03]' : 'bg-[#48C765]/[0.015]'
      }`} />
      <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] blur-[120px] pointer-events-none rounded-full ${
        isLight ? 'bg-black/[0.02]' : 'bg-white/[0.01]'
      }`} />

      <div className="max-w-[1200px] mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <span className={`w-8 h-[1px] ${isLight ? 'bg-[#15803D]' : 'bg-[#48C765]'}`}></span>
            <span className={`font-mono text-[10px] font-bold tracking-[0.25em] uppercase ${
              isLight ? 'text-[#15803D]' : 'text-[#48C765]'
            }`}>
              {language === 'es' ? 'NUESTRA HISTORIA' : 'OUR STORY'}
            </span>
            <span className={`w-8 h-[1px] ${isLight ? 'bg-[#15803D]' : 'bg-[#48C765]'}`}></span>
          </div>

          <h1 className={`font-['Nunito',sans-serif] font-[900] text-4xl sm:text-6xl uppercase tracking-normal leading-tight mb-8 ${
            isLight ? 'text-[#14170F]' : 'text-white'
          }`}>
            {language === 'es' ? 'REDEFINIENDO EL ESTÁNDAR ' : 'REDEFINING THE STANDARD '}
            <br/>
            <span className={isLight ? 'text-[#15803D]' : 'text-[#48C765]'}>
              {language === 'es' ? 'A NIVEL MUNDIAL' : 'GLOBALLY'}
            </span>
          </h1>

          <p className={`font-sans text-sm sm:text-base max-w-2xl leading-relaxed text-center sm:text-justify ${
            isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
          }`}>
            {language === 'es'
              ? 'Nacimos de la frustración de coleccionistas de todo el mundo cansados de servicios lentos y subjetivos. Gorilla Grading surge para ofrecer precisión óptica, velocidad y total transparencia a escala internacional.'
              : 'Born from the frustration of collectors worldwide tired of slow and subjective services. Gorilla Grading emerged to offer optical precision, speed, and total transparency on an international scale.'}
          </p>
        </div>

        {/* The Grid / Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">

          {/* Pillar 1 */}
          <TiltCard isLight={isLight} className={`p-8 md:p-10 flex flex-col items-start group border transition-all duration-300 ${
            isLight
              ? 'bg-[#F2ECE1] border-black/[0.08] hover:bg-[#EAE2D5] shadow-sm'
              : 'bg-[#161B16]/50 border-white/[0.04] hover:bg-[#161B16]'
          }`}>
            <div className={`mb-6 group-hover:scale-105 transition-transform duration-300 ${
              isLight ? 'text-[#15803D]' : 'text-[#48C765]'
            }`}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={`font-['Nunito',sans-serif] text-xl uppercase font-[900] tracking-normal mb-4 ${
              isLight ? 'text-[#14170F]' : 'text-white'
            }`}>
              {language === 'es' ? 'ALCANCE GLOBAL' : 'GLOBAL REACH'}
            </h3>
            <p className={`font-sans text-xs leading-relaxed text-justify ${
              isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
            }`}>
              {language === 'es'
                ? 'Con laboratorios y logística optimizada, ofrecemos un servicio de graduación rápido y seguro para coleccionistas sin importar de dónde vengan, eliminando los tiempos de espera absurdos.'
                : 'With optimized laboratories and logistics, we offer a fast and secure grading service for collectors no matter where they are from, eliminating absurd wait times.'}
            </p>
          </TiltCard>

          {/* Pillar 2 */}
          <TiltCard isLight={isLight} className={`p-8 md:p-10 flex flex-col items-start group border transition-all duration-300 ${
            isLight
              ? 'bg-[#F2ECE1] border-black/[0.08] hover:bg-[#EAE2D5] shadow-sm'
              : 'bg-[#161B16]/50 border-white/[0.04] hover:bg-[#161B16]'
          }`}>
            <div className={`mb-6 group-hover:scale-105 transition-transform duration-300 ${
              isLight ? 'text-[#15803D]' : 'text-[#48C765]'
            }`}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className={`font-['Nunito',sans-serif] text-xl uppercase font-[900] tracking-normal mb-4 ${
              isLight ? 'text-[#14170F]' : 'text-white'
            }`}>
              {language === 'es' ? 'VERDAD ABSOLUTA' : 'ABSOLUTE TRUTH'}
            </h3>
            <p className={`font-sans text-xs leading-relaxed text-justify ${
              isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
            }`}>
              {language === 'es'
                ? 'Se acabó el depender del "buen o mal día" de un graduador humano. Implementamos tecnología óptica y láser porque los números no mienten.'
                : 'No more depending on a human grader\'s "good or bad day". We implemented optical and laser technology because numbers don\'t lie.'}
            </p>
          </TiltCard>

          {/* Pillar 3 */}
          <TiltCard isLight={isLight} className={`p-8 md:p-10 flex flex-col items-start group border transition-all duration-300 ${
            isLight
              ? 'bg-[#F2ECE1] border-black/[0.08] hover:bg-[#EAE2D5] shadow-sm'
              : 'bg-[#161B16]/50 border-white/[0.04] hover:bg-[#161B16]'
          }`}>
            <div className={`mb-6 group-hover:scale-105 transition-transform duration-300 ${
              isLight ? 'text-[#15803D]' : 'text-[#48C765]'
            }`}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className={`font-['Nunito',sans-serif] text-xl uppercase font-[900] tracking-normal mb-4 ${
              isLight ? 'text-[#14170F]' : 'text-white'
            }`}>
              {language === 'es' ? 'PARA COLECCIONISTAS' : 'FOR COLLECTORS'}
            </h3>
            <p className={`font-sans text-xs leading-relaxed text-justify ${
              isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
            }`}>
              {language === 'es'
                ? 'No somos un fondo de inversión sin alma. Somos entusiastas de los TCG, diseñando el producto que siempre quisimos usar para nuestras propias colecciones.'
                : 'We are not a soulless investment fund. We are TCG enthusiasts, building the exact product we always wanted to use for our own collections.'}
            </p>
          </TiltCard>

        </div>

      </div>
    </section>
  );
};
