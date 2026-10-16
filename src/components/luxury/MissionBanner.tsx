import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface MissionBannerProps {
  onNavigate?: (path: string) => void;
}

export const MissionBanner: React.FC<MissionBannerProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [activeStep, setActiveStep] = useState(0);

  const missionImgSrc = theme === 'dark' ? '/images/Dark/ourmission.png' : '/images/ourmission.png?v=7';

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full bg-[#383838] text-white overflow-hidden select-none min-h-[360px] flex items-center border-y border-white/[0.04]">
      
      {/* The Box Image with CSS Mask for perfect edge blending */}
      <img 
        src={missionImgSrc}
        alt="Gorilla Grading Box" 
        className="absolute left-0 top-0 h-full w-full lg:w-[55%] object-cover object-center lg:object-right opacity-90 z-0"
        style={{
          maskImage: 'linear-gradient(to right, black 40%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 50%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in'
        }}
      />
      
      {/* Mobile-only dark overlay to ensure text is readable */}
      <div className="absolute inset-0 bg-[#454545]/85 lg:hidden z-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-10 sm:py-12 lg:py-14 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
        
        {/* Empty left half to reserve space for the absolute positioned image */}
        <div className="hidden lg:block lg:w-[40%] shrink-0"></div>

        {/* Text and buttons (always pushed to the right side on desktop, stacked on mobile) */}
        <div className="w-full lg:w-[35%] flex flex-col justify-center items-center lg:items-start text-center lg:text-left mt-8 lg:mt-0 z-10 bg-transparent p-0 rounded-none lg:pr-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#48C765] uppercase mb-4 text-center lg:text-left">
            {language === 'es' ? 'NUESTRA PROMESA' : 'OUR PROMISE'}
          </p>
          <h2 className="font-['Nunito',sans-serif] font-[900] text-4xl sm:text-5xl lg:text-[46px] text-white uppercase leading-[1.05] mb-5 tracking-normal text-center lg:text-left">
            {language === 'es' ? 'DISEÑADO PARA TU COLECCIÓN' : 'BUILT AROUND YOUR COLLECTION'}
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#C2C9C3] max-w-[480px] font-normal leading-relaxed mb-8 mx-auto lg:mx-0 text-center lg:text-left">
            {language === 'es'
              ? 'Un servicio de graduación premium pensado para darte total tranquilidad en cada paso de la cadena de custodia.'
              : 'A premium grading service designed to give you complete peace of mind at every step of the chain of custody.'}
          </p>
          
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mx-auto lg:mx-0">
            <button
              onClick={() => onNavigate && onNavigate('/submit')}
              className="btn-gorilla-pill px-8 py-3.5 text-xs font-bold tracking-normal gap-2 shadow-lg group"
            >
              <span>{language === 'es' ? 'Empezar Envío' : 'Start Submission'}</span>
              <span className="ml-1 text-sm font-bold transition-transform group-hover:translate-x-1.5">→</span>
            </button>
          </div>
        </div>

        {/* Right Menu/List - 4 Customer Promises */}
        <div className="w-full lg:w-[25%] flex flex-col justify-center pt-8 lg:pt-0">
          <div className="flex flex-col">
            
            {/* 1. PERSONAL SUPPORT */}
            <div className={`flex items-start gap-4 sm:gap-5 py-5 pl-7 pr-3 border-b border-white/5 group relative transition-all duration-500 ease-out transform ${activeStep >= 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'} ${activeStep === 0 ? 'bg-gradient-to-r from-white/[0.04] to-transparent' : 'bg-transparent'}`}>
              <div className={`absolute top-0 left-0 w-[3px] h-full transition-all duration-300 ${activeStep >= 0 ? 'bg-gradient-to-b from-[#48C765] to-transparent scale-y-100' : 'scale-y-0 bg-transparent'}`}></div>
              <svg className={`w-7 h-7 mt-0.5 transition-colors shrink-0 ${activeStep === 0 ? 'text-[#48C765]' : 'text-[#A4ACA1] group-hover:text-[#48C765]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <div className="flex flex-col">
                <span className={`font-sans text-[11px] font-bold tracking-normal uppercase mb-1 transition-colors ${activeStep === 0 ? 'text-[#48C765]' : 'text-white group-hover:text-[#48C765]'}`}>
                  {language === 'es' ? 'SOPORTE PERSONALIZADO' : 'PERSONAL SUPPORT'}
                </span>
                <span className="font-sans text-[11px] text-[#A4ACA1] leading-relaxed">
                  {language === 'es' ? 'Asistencia real durante todo el proceso de tu envío.' : 'Real assistance throughout your entire submission.'}
                </span>
              </div>
            </div>

            {/* 2. INTERNATIONAL SHIPPING */}
            <div className={`flex items-start gap-4 sm:gap-5 py-5 pl-7 pr-3 border-b border-white/5 group relative transition-all duration-500 ease-out transform ${activeStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'} ${activeStep === 1 ? 'bg-gradient-to-r from-white/[0.04] to-transparent' : 'bg-transparent'}`}>
              <div className={`absolute top-0 left-0 w-[3px] h-full transition-all duration-300 ${activeStep >= 1 ? 'bg-gradient-to-b from-[#48C765] to-transparent scale-y-100' : 'scale-y-0 bg-transparent'}`}></div>
              <svg className={`w-7 h-7 mt-0.5 transition-colors shrink-0 ${activeStep === 1 ? 'text-[#48C765]' : 'text-[#A4ACA1] group-hover:text-[#48C765]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex flex-col">
                <span className={`font-sans text-[11px] font-bold tracking-normal uppercase mb-1 transition-colors ${activeStep === 1 ? 'text-[#48C765]' : 'text-white group-hover:text-[#48C765]'}`}>
                  {language === 'es' ? 'ENVÍOS INTERNACIONALES' : 'INTERNATIONAL SHIPPING'}
                </span>
                <span className="font-sans text-[11px] text-[#A4ACA1] leading-relaxed">
                  {language === 'es' ? 'Envía y recibe tus cartas desde toda Europa y más allá.' : 'Send and receive your cards from across Europe and beyond.'}
                </span>
              </div>
            </div>

            {/* 3. ORDER TRACKING */}
            <div className={`flex items-start gap-4 sm:gap-5 py-5 pl-7 pr-3 border-b border-white/5 group relative transition-all duration-500 ease-out transform ${activeStep >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'} ${activeStep === 2 ? 'bg-gradient-to-r from-white/[0.04] to-transparent' : 'bg-transparent'}`}>
              <div className={`absolute top-0 left-0 w-[3px] h-full transition-all duration-300 ${activeStep >= 2 ? 'bg-gradient-to-b from-[#48C765] to-transparent scale-y-100' : 'scale-y-0 bg-transparent'}`}></div>
              <svg className={`w-7 h-7 mt-0.5 transition-colors shrink-0 ${activeStep === 2 ? 'text-[#48C765]' : 'text-[#A4ACA1] group-hover:text-[#48C765]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="flex flex-col">
                <span className={`font-sans text-[11px] font-bold tracking-normal uppercase mb-1 transition-colors ${activeStep === 2 ? 'text-[#48C765]' : 'text-white group-hover:text-[#48C765]'}`}>
                  {language === 'es' ? 'SEGUIMIENTO DE PEDIDOS' : 'ORDER TRACKING'}
                </span>
                <span className="font-sans text-[11px] text-[#A4ACA1] leading-relaxed">
                  {language === 'es' ? 'Conoce el estado exacto de tus cartas en tiempo real.' : 'Follow your cards throughout the grading process in real time.'}
                </span>
              </div>
            </div>

            {/* 4. SECURE RETURN */}
            <div className={`flex items-start gap-4 sm:gap-5 py-5 pl-7 pr-3 border-b border-white/5 group relative transition-all duration-500 ease-out transform ${activeStep >= 3 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'} ${activeStep === 3 ? 'bg-gradient-to-r from-white/[0.04] to-transparent' : 'bg-transparent'}`}>
              <div className={`absolute top-0 left-0 w-[3px] h-full transition-all duration-300 ${activeStep >= 3 ? 'bg-gradient-to-b from-[#48C765] to-transparent scale-y-100' : 'scale-y-0 bg-transparent'}`}></div>
              <svg className={`w-7 h-7 mt-0.5 transition-colors shrink-0 ${activeStep === 3 ? 'text-[#48C765]' : 'text-[#A4ACA1] group-hover:text-[#48C765]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="flex flex-col">
                <span className={`font-sans text-[11px] font-bold tracking-normal uppercase mb-1 transition-colors ${activeStep === 3 ? 'text-[#48C765]' : 'text-white group-hover:text-[#48C765]'}`}>
                  {language === 'es' ? 'DEVOLUCIÓN SEGURA' : 'SECURE RETURN'}
                </span>
                <span className="font-sans text-[11px] text-[#A4ACA1] leading-relaxed">
                  {language === 'es' ? 'Tus cartas están aseguradas y protegidas en cada etapa.' : 'Your cards are fully protected throughout every single step.'}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
