import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface CardAnalysisPillarsProps {
  onNavigate?: (path: string) => void;
}

interface Pillar {
  id: string;
  title: string;
  desc: string;
  imgSrc: string;
  imgAlt: string;
}

// Brochure-style 3D tilt that follows the mouse on hover
const PillarCard: React.FC<{ p: Pillar; isLight: boolean }> = ({ p, isLight }) => {
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
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.1 : 1})`,
          transition: hovered ? 'transform 0.12s ease-out' : 'transform 0.5s ease',
          boxShadow: hovered
            ? `${-tilt.y * 1.2}px ${14 + tilt.x}px 30px rgba(0,0,0,0.35)`
            : 'none',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        className={`rounded-none border overflow-hidden flex flex-col justify-between h-full ${
          isLight
            ? 'bg-[#EDE8DF] border-black/10 shadow-xs'
            : 'bg-[#1C201C] border-white/[0.08]'
        }`}
      >
        {/* Macro Photographic Image Area */}
        <div className={`w-full h-48 sm:h-52 relative border-b overflow-hidden ${
          isLight ? 'border-black/5 bg-[#E2DCD1]' : 'border-white/[0.06] bg-[#14170F]'
        }`}>
          <img
            src={p.imgSrc}
            alt={p.imgAlt}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Editorial Pillar Body Content - Pure Informative */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className={`font-['Nunito',sans-serif] font-[900] text-lg uppercase tracking-tight mb-2.5 ${
            isLight ? 'text-[#14170F]' : 'text-white'
          }`}>
            {p.title}
          </h3>
          <p className={`font-sans text-xs leading-relaxed font-normal ${
            isLight ? 'text-[#4A5546]' : 'text-[#A4ACA1]'
          }`}>
            {p.desc}
          </p>
        </div>
      </div>
    </div>
  );
};

export const CardAnalysisPillars: React.FC<CardAnalysisPillarsProps> = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const pillars = [
    {
      id: 'preserve',
      title: t('ref.pillar1.title'),
      desc: t('ref.pillar1.desc'),
      imgSrc: '/images/preservar.png?v=7',
      imgAlt: 'Preserve - Hermetic acrylic slab protection'
    },
    {
      id: 'authenticate',
      title: t('ref.pillar2.title'),
      desc: t('ref.pillar2.desc'),
      imgSrc: '/images/autenticar.png?v=7',
      imgAlt: 'Authenticate - Advanced analysis against fakes'
    },
    {
      id: 'understand',
      title: t('ref.pillar3.title'),
      desc: t('ref.pillar3.desc'),
      imgSrc: '/images/comprender.png?v=7',
      imgAlt: 'Understand - Clear explanation for every grade'
    },
    {
      id: 'belong',
      title: t('ref.pillar4.title'),
      desc: t('ref.pillar4.desc'),
      imgSrc: '/images/pertenecer.png?v=7',
      imgAlt: 'Belong - A growing community across Europe'
    }
  ];

  return (
    <section 
      id="pillars" 
      className={`w-full py-16 sm:py-20 px-6 lg:px-12 border-b select-none transition-colors duration-300 ${
        isLight 
          ? 'bg-[#E5DFD5] text-[#14170F] border-black/10' 
          : 'bg-[#14170F] text-white border-white/[0.06]'
      }`}
    >
      <div className="max-w-[1400px] mx-auto">
        
        {/* 4 Informative Pillars Grid (Without links or navigation) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => (
            <PillarCard key={p.id} p={p} isLight={isLight} />
          ))}
        </div>

      </div>
    </section>
  );
};
