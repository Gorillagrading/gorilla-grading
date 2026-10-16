import React, { useState, useRef } from 'react';
import { GradedCard } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck, QrCode, Sparkles, RefreshCw, Eye, Award } from 'lucide-react';

interface SlabCardProps {
  card: GradedCard;
  interactive?: boolean;
  onInspect?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'slab' | 'card-only';
}

export const SlabCard: React.FC<SlabCardProps> = ({
  card,
  interactive = true,
  onInspect,
  size = 'md',
  variant = 'slab'
}) => {
  const { t, language } = useLanguage();
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Parallax tilt angles
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rX = ((y - centerY) / centerY) * -14;
    const rY = ((x - centerX) / centerX) * 14;

    setRotateX(rX);
    setRotateY(rY);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  };

  const scaleClasses = {
    sm: 'w-60 max-w-full',
    md: 'w-[300px] sm:w-[340px] max-w-full',
    lg: 'w-[340px] sm:w-[380px] max-w-full'
  };

  const isPristine = card.grade === 10;
  const isGold = card.grade >= 9.5;

  // Standalone Raw Card Mode (without slab casing)
  if (variant === 'card-only') {
    return (
      <div className={`relative flex flex-col items-center select-none slab-perspective ${scaleClasses[size]}`}>
        {/* Standalone 3D Raw Card Container */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={onInspect}
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          }}
          className="relative w-full aspect-[2.5/3.5] rounded-[18px] overflow-hidden cursor-pointer transition-transform duration-150 group shadow-[0_18px_40px_rgba(0,0,0,0.55)] hover:shadow-[0_24px_50px_rgba(34,197,94,0.3)] border border-white/20 hover:border-[#22C55E]/80 bg-[#1A1A1A]"
        >
          {/* Card Artwork Image */}
          <img
            src={isFlipped ? card.backImage : card.frontImage}
            alt={card.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />

          {/* Dynamic Holographic Specular Glare across card face */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-75 transition-opacity duration-300 hologram-iridescent"
            style={{
              backgroundPosition: `${glarePosition.x}% ${glarePosition.y}%`,
              maskImage: 'radial-gradient(circle at center, black 65%, transparent 100%)'
            }}
          />

          {/* Luxury Card Edge Specular Highlight */}
          <div className="absolute inset-0 pointer-events-none rounded-[18px] ring-1 ring-inset ring-white/25" />

          {/* Top Left Floating Certified Grade Chip */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/20 shadow-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="font-['Nunito',sans-serif] font-black text-xs text-white tracking-tight">
              GGI {card.grade}
            </span>
          </div>

          {/* Top Right Floating Cert ID Pill */}
          <div className="absolute top-3 right-3 z-20 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 font-mono text-[9px] text-[#A4ACA1] tracking-wider uppercase">
            {card.certNumber || card.id}
          </div>

          {/* Bottom Interactive Action Ribbon (Appears on Hover) */}
          {interactive && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-[#07090C]/90 backdrop-blur-md p-2 rounded-lg border border-white/20 shadow-2xl z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(!isFlipped);
                }}
                className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white flex items-center gap-1.5 font-mono transition-colors"
                title={language === 'es' ? 'Voltear carta' : 'Flip card'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isFlipped ? (language === 'es' ? 'Anverso' : 'Front') : (language === 'es' ? 'Reverso' : 'Back')}</span>
              </button>

              {onInspect && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspect();
                  }}
                  className="px-3 py-1.5 rounded bg-[#16A34A] hover:bg-[#22C55E] text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{language === 'es' ? 'Ver Dossier (Slab 3D)' : 'View Dossier (3D Slab)'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Helper caption underneath */}
        {interactive && (
          <div className="mt-3 text-center text-[#A4ACA1] text-[11px] flex items-center gap-2 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>
              {language === 'es' 
                ? 'Carta 3D Interactiva · Clic para ver en Dossier con Slab' 
                : 'Interactive 3D Card · Click to inspect Dossier with Slab'}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center select-none slab-perspective ${scaleClasses[size]}`}>
      
      {/* 3D Realistic Acrylic Slab Container */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        }}
        className="slab-container relative w-full rounded-[26px] p-3.5 sm:p-4 bg-gradient-to-b from-white/[0.22] via-white/[0.06] to-white/[0.12] backdrop-blur-2xl border border-white/40 shadow-slab transition-all duration-150 group"
      >
        {/* Optical Acrylic Bevel Border & Refraction */}
        <div className="absolute inset-0 rounded-[26px] pointer-events-none acrylic-edge-bevel" />
        
        {/* Dynamic Holographic Specular Glare */}
        <div
          className="absolute inset-0 rounded-[26px] pointer-events-none opacity-40 group-hover:opacity-85 transition-opacity duration-300 hologram-iridescent"
          style={{
            backgroundPosition: `${glarePosition.x}% ${glarePosition.y}%`,
            maskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)'
          }}
        />

        {/* TOP SLAB WHITE LABEL */}
        <div className="relative mb-3.5 p-3 border shadow-sm bg-white text-black font-sans flex flex-col justify-between" style={{ minHeight: '90px' }}>
          {/* Subtle noise texture */}
          <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none" />

          {!isFlipped ? (
            /* FRONT LABEL */
            <div className="flex justify-between items-stretch relative z-10 w-full h-full">
              {/* Left Column */}
              <div className="flex flex-col justify-between items-start">
                <div className="flex items-center gap-1 font-black text-xl leading-none tracking-tighter">
                   <ShieldCheck className="w-5 h-5 text-black" fill="black" stroke="white" />
                   GGI
                </div>
                <div className="text-[42px] font-black leading-[0.8] mt-2 mb-1 tracking-tighter">
                  {card.grade === 10 ? '10' : card.grade.toFixed(1)}
                </div>
                <div className="text-[10px] tracking-tight font-medium uppercase text-black/80">
                  {card.certNumber}
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col justify-between items-end text-right w-2/3">
                <div className="flex flex-col items-end leading-[1.15] w-full">
                  <div className="text-[11px] font-bold uppercase truncate w-full">{card.year} {card.game}</div>
                  <div className="text-[10px] uppercase text-black/90 truncate w-full">{card.language} / {card.rarity}</div>
                  <div className="text-[12px] font-black uppercase mt-1 truncate w-full">{card.name}</div>
                </div>
                
                {/* Subgrades Grid */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-0 text-[9px] uppercase font-semibold mt-3 text-right">
                  <div>CENTERING {card.subgrades.centering.score.toFixed(1)}</div>
                  <div>CORNERS {card.subgrades.corners.score.toFixed(1)}</div>
                  <div>EDGES {card.subgrades.edges.score.toFixed(1)}</div>
                  <div>SURFACE {card.subgrades.surface.score.toFixed(1)}</div>
                </div>
              </div>
            </div>
          ) : (
            /* BACK LABEL */
            <div className="flex justify-between items-center relative z-10 w-full h-full px-1">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-12 h-12 text-black" fill="black" stroke="white" />
                <div className="flex flex-col leading-none">
                  <span className="font-black text-xl tracking-tighter">GORILA GRADING</span>
                  <span className="text-[11px] tracking-widest font-medium mt-1">International</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-white border-2 border-black rounded-md p-1 flex items-center justify-center relative">
                 <QrCode className="w-full h-full text-black" />
                 <div className="absolute inset-0 m-auto w-4 h-4 bg-white flex items-center justify-center">
                   <ShieldCheck className="w-3.5 h-3.5 text-black" fill="black" stroke="white" />
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* CARD PROTAGONIST RECESSED CRADLE */}
        <div className="relative rounded-none overflow-hidden bg-[#454545]/90 aspect-[2.5/3.5] border border-white/20 shadow-inner group-hover:border-[#00DF81]/50 transition-colors">
          
          <img
            src={isFlipped ? card.backImage : card.frontImage}
            alt={card.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />

          {/* Anti-reflective glare texture */}
          <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

          {/* Interactive Hover Bar */}
          {interactive && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-[#07090C]/90 backdrop-blur-md rounded-none p-2 border border-white/20 shadow-2xl z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(!isFlipped);
                }}
                className="px-2.5 py-1.5 rounded-none bg-white/10 hover:bg-white/20 text-[11px] text-white flex items-center gap-1.5 font-mono transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isFlipped ? 'Anverso' : 'Reverso'}</span>
              </button>

              {onInspect && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspect();
                  }}
                  className="px-3 py-1.5 rounded-none bg-[#00DF81] hover:bg-[#10B981] text-[#07090C] text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('btn.inspect')}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* SLAB BASE: Cryptographic NFC & Barcode */}
        <div className="mt-3 flex items-center justify-between px-1 text-slate-400 text-[9px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-none bg-gorilla-neon" />
            <span>NFC ENCRIPTADO</span>
          </div>
          <div className="flex items-center gap-1">
            <QrCode className="w-3 h-3 text-slate-400" />
            <span>INTERNATIONAL REGISTRY</span>
          </div>
        </div>

      </div>

      {/* Helper caption underneath */}
      {interactive && (
        <div className="mt-3 text-center text-slate-400 text-[11px] flex items-center gap-2 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-gorilla-neon" />
          <span>Slab 3D Interactivo • Mueve el cursor para examinar refracción y brillo</span>
        </div>
      )}
    </div>
  );
};
