import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface TechnologySectionProps {
  onNavigate?: (path: string) => void;
  showExploreButton?: boolean;
}

export const TechnologySection: React.FC<TechnologySectionProps> = ({ 
  onNavigate,
  showExploreButton = true
}) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [activeStep, setActiveStep] = React.useState(-1);

  React.useEffect(() => {
    // Slower pacing so the user has time to see each step clearly.
    // 1200ms per step.
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev >= 5 ? -1 : prev + 1));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      id: '01',
      title: language === 'es' ? 'SELECCIONA TU SERVICIO' : 'SELECT YOUR SERVICE',
      desc: language === 'es' ? 'Elige la tarifa de graduación para tus cartas.' : 'Choose the grading tier for your cards.'
    },
    {
      id: '02',
      title: language === 'es' ? 'PREPARA TUS CARTAS' : 'PREPARE YOUR CARDS',
      desc: language === 'es' ? 'Empaqueta tus cartas siguiendo nuestras guías de envío.' : 'Pack your cards following our submission guidelines.'
    },
    {
      id: '03',
      title: language === 'es' ? 'ENVÍA O ENTREGA' : 'SHIP OR DROP OFF',
      desc: language === 'es' ? 'Envía tus cartas o usa uno de nuestros eventos de recogida.' : 'Send your cards or use one of our pickup events.'
    },
    {
      id: '04',
      title: language === 'es' ? 'RASTREA TU PEDIDO' : 'TRACK YOUR ORDER',
      desc: language === 'es' ? 'Sigue tu envío a lo largo de todo el proceso.' : 'Follow your submission throughout the process.'
    },
    {
      id: '05',
      title: language === 'es' ? 'RECIBE TUS CARTAS' : 'RECEIVE YOUR GRADED CARDS',
      desc: language === 'es' ? 'Tus cartas regresan autenticadas, graduadas y protegidas.' : 'Your cards return authenticated, graded and protected.'
    }
  ];

  const isLight = theme === 'light';

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const FADE_SECONDS = 0.8;

  // Fade out during the last moments of the clip
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const remaining = v.duration - v.currentTime;
    v.style.opacity = String(remaining < FADE_SECONDS ? Math.max(remaining / FADE_SECONDS, 0) : 1);
  };

  // Restart from the beginning; timeupdate then fades it back in
  const handleEnded = () => {
    const v = videoRef.current;
    if (!v) return;
    v.style.opacity = '0';
    v.currentTime = 0;
    v.play().catch(() => {});
  };

  // The video is far below the hero: do not download it until the section is about to be seen,
  // so it does not compete with the hero for bandwidth. It pauses again when out of view.
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (typeof IntersectionObserver === 'undefined') {
      v.play().catch(() => {});
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: '300px' },
    );
    observer.observe(v);
    return () => observer.disconnect();
  }, [isLight]);

  return (
    <section
      id="how-it-works"
      className={`relative w-full overflow-hidden select-none transition-colors duration-300 ${
        isLight ? 'bg-[#F1ECE5] text-[#1C201D]' : 'bg-[#14170F] text-white'
      }`}
    >
      {/* Full Width Background Video - fades out at the end and back in, so the loop is not abrupt */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          key={isLight ? 'video-light' : 'video-dark'}
          ref={videoRef}
          preload="none"
          muted
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          style={{ transition: 'opacity 0.25s linear' }}
          className="w-full h-full object-cover object-center pointer-events-none"
          poster={isLight ? '/images/tecnoSeccion.png' : '/images/Dark/tecnoSeccion.png'}
        >
          <source src="/images/tecnoSeccionScn.mp4" type="video/mp4" />
        </video>
      </div>
      
      {/* Sombra lateral para la versión clara (legibilidad de texto) y limpio en modo oscuro */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {isLight ? (
          <>
            <div className="absolute inset-0 lg:hidden bg-[#F1ECE5]/70" />
            <div className="hidden lg:flex w-full h-full">
              <div className="w-[50%] bg-gradient-to-r from-[#F1ECE5]/95 via-[#F1ECE5]/80 to-transparent" />
              <div className="flex-1" />
              <div className="w-[36%] bg-gradient-to-l from-[#F1ECE5]/92 via-[#F1ECE5]/70 to-transparent" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-black/25" />
        )}
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-10 sm:py-12 lg:py-14 min-h-0 flex items-center">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 w-full items-center">
          
          {/* Left Copy Overlay */}
          <div className={`lg:col-span-5 flex flex-col justify-center items-center lg:items-start text-center lg:text-left opacity-100 ${
            isLight ? '[text-shadow:0_0_12px_rgba(241,236,229,0.6)]' : ''
          }`}>
            <p className={`font-mono text-[10px] tracking-[0.2em] uppercase mb-4 text-center lg:text-left ${
              isLight ? 'text-[#15803D] font-bold' : 'text-[#4ADE80] font-bold'
            }`}>
              {language === 'es' ? 'EL PROCESO' : 'SUBMISSION PROCESS'}
            </p>
            <h2 className={`font-['Nunito',sans-serif] font-[900] text-4xl sm:text-5xl lg:text-[46px] xl:text-[52px] tracking-normal uppercase leading-[1.05] mb-5 whitespace-pre-line text-center lg:text-left ${
              isLight ? 'text-[#14170F]' : 'text-white'
            }`}>
              {language === 'es' ? 'CÓMO FUNCIONA' : 'HOW IT WORKS'}
            </h2>
            <div className={`font-sans text-sm sm:text-base max-w-[360px] font-normal leading-relaxed mb-8 mx-auto lg:mx-0 text-center lg:text-left ${
              isLight ? 'text-[#2B322C]' : 'text-[#C8D2C5]'
            }`}>
              <p className={`font-bold mb-2 tracking-wide uppercase ${
                isLight ? 'text-[#14170F]' : 'text-white'
              }`}>
                {language === 'es' ? 'SIMPLE | SEGURO | TRANSPARENTE' : 'SIMPLE | SECURE | TRANSPARENT'}
              </p>
              <p>
                {language === 'es' 
                  ? 'Desde que empaquetas tus cartas hasta que las recibes totalmente encapsuladas.' 
                  : 'From packing your cards to receiving them fully encapsulated.'}
              </p>
            </div>
            
            {showExploreButton && (typeof window === 'undefined' || window.location.pathname !== '/technology') && (
              <button
                onClick={() => onNavigate ? onNavigate('/technology') : window.location.href = '/technology'}
                className="btn-gorilla-pill px-8 py-3.5 text-xs font-bold tracking-normal gap-2 shadow-lg group w-fit mx-auto lg:mx-0"
              >
                <span>{language === 'es' ? 'Conoce la tecnología' : 'Explore Technology'}</span>
                <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>

          {/* Empty spacer for center image focus */}
          <div className="hidden lg:block lg:col-span-3"></div>

          {/* Right Steps - Open layout without box, with enhanced text legibility */}
          <div className={`lg:col-span-4 flex flex-col justify-center lg:pl-10 ${
            isLight ? '[text-shadow:0_1px_10px_rgba(0,0,0,0.7)]' : ''
          }`}>
            <div className={`flex flex-col border-l overflow-hidden ${
              isLight ? 'border-white/25' : 'border-white/10'
            }`}>
              
              {steps.map((step, index) => {
                const isRevealed = activeStep >= index;
                const isCurrent = activeStep === index;
                
                return (
                  <div 
                    key={step.id} 
                    className={`flex gap-5 sm:gap-6 py-5 px-6 border-b relative transition-all duration-300 ease-out opacity-100 translate-y-0 ${
                      isLight ? 'border-white/15' : 'border-white/5'
                    } ${
                      isCurrent 
                        ? (isLight ? 'bg-gradient-to-r from-black/[0.04] to-transparent' : 'bg-gradient-to-r from-white/[0.04] to-transparent')
                        : 'bg-transparent'
                    }`}
                  >
                    <div className={`absolute top-0 left-[-1px] w-[2px] h-full transition-all duration-300 ${
                      isCurrent 
                        ? (isLight ? 'bg-gradient-to-b from-[#15803D] to-transparent scale-y-100' : 'bg-gradient-to-b from-[#48C765] to-transparent scale-y-100')
                        : 'scale-y-0 bg-transparent'
                    }`} />
                    
                    <span 
                      className="font-mono text-lg font-bold transition-colors duration-300 shrink-0"
                      style={{ 
                        color: isCurrent 
                          ? (isLight ? '#4ADE80' : '#48C765')
                          : (isLight ? '#FFFFFF' : '#A4ACA1')
                      }}
                    >
                      {step.id}
                    </span>
                    <div>
                      <h4 
                        className="font-sans font-bold text-sm tracking-normal uppercase mb-1"
                        style={{ color: '#FFFFFF' }}
                      >
                        {step.title}
                      </h4>
                      <p 
                        className="text-xs leading-relaxed font-medium"
                        style={{ color: isLight ? '#E5EBE3' : '#C8D2C5' }}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};


