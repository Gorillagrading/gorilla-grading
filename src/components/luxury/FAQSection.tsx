import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface FAQSectionProps {
  onNavigate?: (path: string) => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: language === 'es' ? '¿Cómo preparo mis cartas para enviarlas?' : 'How should I prepare my cards for shipping?',
      a: language === 'es' 
        ? 'Recomendamos usar un penny sleeve dentro de un toploader semirrígido (Card Saver). Evita usar celo o cinta adhesiva. Asegúrate de empacar todo en una caja resistente con plástico de burbujas.'
        : 'We recommend using a penny sleeve inside a semi-rigid toploader (Card Saver). Avoid using tape. Make sure to pack everything in a sturdy box with bubble wrap.',
      route: '/faq/prepare',
      linkText: language === 'es' ? 'VER DETALLES' : 'VIEW DETAILS'
    },
    {
      q: language === 'es' ? '¿Puedo entregar mis cartas en persona?' : 'Can I drop off my cards in person?',
      a: language === 'es'
        ? 'Sí, organizamos "Pickup Events" regularmente y también contamos con puntos de entrega asociados. Revisa nuestra sección de Eventos para las próximas fechas.'
        : 'Yes, we regularly host "Pickup Events" and have partnered drop-off locations. Check our Events section for upcoming dates.',
      route: '/faq/dropoff',
      linkText: language === 'es' ? 'VER DETALLES' : 'VIEW DETAILS'
    },
    {
      q: language === 'es' ? '¿Cuánto tardan los tiempos de respuesta (turnaround)?' : 'How long are the turnaround times?',
      a: language === 'es'
        ? 'El tiempo comienza a contar el día hábil en que procesamos tu paquete en nuestras oficinas, no cuando lo envías. Ofrecemos plazos desde 48 horas hasta 20 días hábiles según el paquete.'
        : 'Turnaround time starts on the business day we process your package at our facility, not when you ship it. We offer timeframes from 48 hours up to 20 business days.',
      route: '/faq/turnaround',
      linkText: language === 'es' ? 'VER DETALLES' : 'VIEW DETAILS'
    },
    {
      q: language === 'es' ? '¿Qué pasa si mi carta supera el valor declarado del nivel elegido?' : 'What if my card exceeds the declared value of the chosen tier?',
      a: language === 'es'
        ? 'Si nuestro equipo determina que el valor de mercado de tu carta excede el límite del servicio contratado, te notificaremos para actualizarla al siguiente nivel. Esto es crucial por motivos de seguro.'
        : 'If our team determines your card\'s market value exceeds the tier limit, we will notify you to upgrade it to the next tier. This is crucial for insurance purposes.'
    }
  ];

  return (
    <section 
      id="faq"
      className={`w-full py-10 sm:py-12 lg:py-14 px-6 lg:px-12 border-b transition-colors duration-300 scroll-mt-20 ${
        isLight ? 'bg-[#ECE7DF] text-[#1C201D] border-black/[0.06]' : 'bg-[#14170F] text-white border-white/[0.04]'
      }`}
    >
      <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row gap-12 lg:gap-20">
        
        {/* Left Col: Header - Centered on mobile, left-aligned on desktop */}
        <div className="w-full md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left">
          <p className={`font-mono text-[10px] tracking-[0.2em] uppercase mb-4 text-center md:text-left ${
            isLight ? 'text-[#6B7268]' : 'text-[#A4ACA1]'
          }`}>
            {language === 'es' ? 'SOPORTE AL CLIENTE' : 'CUSTOMER SUPPORT'}
          </p>
          <h2 className={`font-['Nunito',sans-serif] font-[900] text-4xl uppercase leading-[1.1] mb-6 text-center md:text-left ${
            isLight ? 'text-[#1C201D]' : 'text-white'
          }`}>
            {language === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
          </h2>
          <p className={`font-sans text-sm mb-8 leading-relaxed text-center md:text-left mx-auto md:mx-0 max-w-[360px] ${
            isLight ? 'text-[#555C54]' : 'text-[#C2C9C3]'
          }`}>
            {language === 'es' 
              ? 'Encuentra respuestas rápidas a las consultas más comunes sobre el proceso de grading y envíos.' 
              : 'Find quick answers to common questions about the grading and shipping process.'}
          </p>
          <button 
            onClick={() => onNavigate && onNavigate('/faq')}
            className={`font-mono text-xs tracking-wider uppercase flex items-center gap-2 transition-colors w-fit cursor-pointer mx-auto md:mx-0 self-center md:self-start ${
              isLight ? 'text-[#2D9A46] hover:text-[#1C201D]' : 'text-[#48C765] hover:text-white'
            }`}
          >
            <span>{language === 'es' ? 'Ir al Centro de Ayuda' : 'Go to Help Center'}</span>
            <span>→</span>
          </button>
        </div>

        {/* Right Col: Accordion */}
        <div className={`w-full md:w-2/3 flex flex-col border-t ${
          isLight ? 'border-black/10' : 'border-white/10'
        }`}>
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`border-b ${isLight ? 'border-black/10' : 'border-white/10'}`}>
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full py-6 flex items-center justify-between text-left focus:outline-none group cursor-pointer"
                >
                  <span className={`font-sans font-bold text-lg pr-8 transition-colors ${
                    isOpen 
                      ? (isLight ? 'text-[#2D9A46]' : 'text-[#48C765]') 
                      : (isLight ? 'text-[#1C201D] group-hover:text-[#2D9A46]' : 'text-white group-hover:text-[#48C765]')
                  }`}>
                    {faq.q}
                  </span>
                  <div className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                    isOpen 
                      ? (isLight ? 'border-[#2D9A46] bg-[#2D9A46]/10' : 'border-[#48C765] bg-[#48C765]/10') 
                      : (isLight ? 'border-black/20' : 'border-white/20')
                  }`}>
                    <svg className={`w-3 h-3 transition-transform duration-300 ${
                      isOpen 
                        ? (isLight ? 'rotate-180 text-[#2D9A46]' : 'rotate-180 text-[#48C765]') 
                        : (isLight ? 'text-[#1C201D]' : 'text-white')
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-60 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}
                >
                  <p className={`font-sans text-sm leading-relaxed pr-8 mb-4 ${
                    isLight ? 'text-[#555C54]' : 'text-[#A4ACA1]'
                  }`}>
                    {faq.a}
                  </p>
                  {faq.route && faq.linkText && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigate) {
                          onNavigate(faq.route);
                        } else {
                          window.location.href = faq.route;
                        }
                      }}
                      className="btn-gorilla-square-secondary mt-4 px-4 py-2 text-[10px] font-bold tracking-normal uppercase flex items-center gap-2 w-fit cursor-pointer"
                    >
                      <span>{faq.linkText}</span>
                      <svg className="w-3 h-3 text-[#48C765]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
