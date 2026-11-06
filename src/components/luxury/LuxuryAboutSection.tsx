import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface LuxuryAboutSectionProps {
  onNavigate?: (path: string) => void;
}

export const LuxuryAboutSection: React.FC<LuxuryAboutSectionProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  const steps = [
    {
      num: t('how.step1.num'),
      title: t('how.step1.title'),
      sub: t('how.step1.sub'),
      tag: language === 'es' ? 'CÁMARA ACORAZADA' : 'SECURE VAULT',
      img: '/images/step_1_vault.webp'
    },
    {
      num: t('how.step2.num'),
      title: t('how.step2.title'),
      sub: t('how.step2.sub'),
      tag: language === 'es' ? 'SALA LIMPIA ISO' : 'ISO CLEANROOM',
      img: '/images/step_2_cleanroom.webp'
    },
    {
      num: t('how.step3.num'),
      title: t('how.step3.title'),
      sub: t('how.step3.sub'),
      tag: language === 'es' ? 'ESPECTROMETRÍA' : 'SPECTROMETRY',
      img: '/images/step_3_spectrometry.webp'
    },
    {
      num: t('how.step4.num'),
      title: t('how.step4.title'),
      sub: t('how.step4.sub'),
      tag: language === 'es' ? 'CALIBRE LÁSER' : 'LASER CALIPER',
      img: '/images/macro_understand.webp'
    },
    {
      num: t('how.step5.num'),
      title: t('how.step5.title'),
      sub: t('how.step5.sub'),
      tag: language === 'es' ? 'CAMPO OSCURO 40X' : '40X DARKFIELD',
      img: '/images/macro_authenticate.webp'
    },
    {
      num: t('how.step6.num'),
      title: t('how.step6.title'),
      sub: t('how.step6.sub'),
      tag: language === 'es' ? 'FUSIÓN 35 KHZ' : '35 KHZ FUSION',
      img: '/images/06encap.webp'
    }
  ];

  return (
    <section id="about" className="w-full bg-[#454545] text-white pt-12 pb-12 px-6 lg:px-12 border-b border-white/[0.04] select-none relative overflow-hidden">
      
      {/* Minimal Background Glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-[#48C765]/[0.02] blur-[150px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-start">
        
        {/* Left Editorial Header (Sticky) */}
        <div className="lg:col-span-5 lg:sticky lg:top-32 pr-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-12 h-[1px] bg-[#48C765]"></span>
            <span className="font-mono text-[10px] font-bold tracking-[0.25em] text-[#48C765] uppercase">
              {t('how.kicker')}
            </span>
          </div>
          
          <h2 className="font-['Nunito',sans-serif] font-[900] text-3xl sm:text-4xl text-white uppercase tracking-normal leading-[0.95] mb-8">
            {language === 'es' ? 'EL VIAJE A LA ' : 'THE JOURNEY TO '}
            <br/>
            <span className="text-[#48C765]">{language === 'es' ? 'PERFECCIÓN' : 'PERFECTION'}</span>
          </h2>
          
          <p className="font-sans text-sm text-[#A4ACA1] leading-relaxed mb-12 max-w-sm">
            {language === 'es'
              ? 'Eliminamos la subjetividad humana. Operamos en salas limpias ISO Clase 7 con óptica de precisión industrial para certificar tus cartas.'
              : 'We eliminate human subjectivity. Operating in ISO Class 7 cleanrooms with industrial precision optics to certify your cards.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
             <button
                onClick={() => onNavigate && onNavigate('/submit')}
                className="btn-gorilla-square px-8 py-3.5 text-xs font-bold tracking-normal gap-2 shadow-lg"
              >
                <span>{language === 'es' ? 'ENVIAR CARTAS' : 'SUBMIT CARDS'}</span>
                <span>→</span>
              </button>
          </div>

          {/* Interactive Image Display */}
          <div className="mt-12 relative w-full aspect-[4/3] bg-[#3B3B3B] border border-white/[0.04] overflow-hidden group">
            <div className="absolute bottom-4 left-4 font-mono text-[10px] font-bold text-[#48C765] tracking-widest z-20 uppercase">
              {hoveredStep ? steps.find(s => s.num === hoveredStep)?.tag : steps[0].tag}
            </div>

            {steps.map((st) => {
              const isActive = (hoveredStep === st.num) || (!hoveredStep && st.num === '01');
              return (
                <div
                  key={`img-${st.num}`}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <div className="absolute inset-0 bg-black/40 z-10 mix-blend-overlay" />
                  {st.img ? (
                    <img
                      src={st.img}
                      alt={st.tag}
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
                      <svg className="w-12 h-12 mb-4 text-[#48C765]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="font-mono text-xs tracking-widest text-[#48C765] uppercase">
                        {language === 'es' ? 'Datos visuales no disponibles' : 'Visual data unavailable'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Minimalist Process List */}
        <div className="lg:col-span-7 flex flex-col mt-8 lg:mt-0">
          <div className="flex flex-col border-t border-white/[0.04]">
            {steps.map((st, idx) => {
              const isHovered = hoveredStep === st.num;
              
              return (
                <div 
                  key={st.num}
                  onMouseEnter={() => setHoveredStep(st.num)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className={`group flex items-center py-8 border-b border-white/[0.04] transition-all duration-500 cursor-default ${
                    isHovered ? 'bg-white/[0.01] px-4 -mx-4' : ''
                  }`}
                >
                  {/* Big Number */}
                  <div className="w-20 md:w-28 shrink-0">
                    <span className={`font-['Nunito',sans-serif] font-[900] text-xl md:text-2xl transition-colors duration-300 ${
                      isHovered ? 'text-[#48C765]' : 'text-white/10'
                    }`}>
                      {st.num}
                    </span>
                  </div>

                  {/* Title & Sub */}
                  <div className="flex-1">
                    <h3 className={`font-['Nunito',sans-serif] font-[900] text-lg md:text-xl uppercase tracking-normal mb-1 transition-colors duration-300 ${
                      isHovered ? 'text-white' : 'text-[#A4ACA1]'
                    }`}>
                      {st.title}
                    </h3>
                    <p className="font-mono text-[10px] md:text-xs text-[#A4ACA1] uppercase tracking-widest">
                      {st.sub}
                    </p>
                  </div>

                  {/* Tech Tag */}
                  <div className="hidden md:block shrink-0 text-right">
                    <span className={`inline-block border px-3 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors duration-300 ${
                      isHovered ? 'border-[#48C765]/30 text-[#48C765] bg-[#48C765]/10' : 'border-white/10 text-[#A4ACA1] bg-transparent'
                    }`}>
                      {st.tag}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 flex items-center justify-end font-mono text-[9px] text-[#A4ACA1] tracking-widest uppercase">
            <span>{language === 'es' ? 'Precisión de calibre óptico: ' : 'Optical caliper precision: '}</span>
            <span className="text-[#48C765] ml-2">0.01mm</span>
          </div>

        </div>
      </div>
    </section>
  );
};
