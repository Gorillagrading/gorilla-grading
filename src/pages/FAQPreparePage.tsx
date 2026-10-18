import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface FAQPreparePageProps {
  onNavigate: (path: string) => void;
}

export const FAQPreparePage: React.FC<FAQPreparePageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen pt-24 pb-24 px-6 lg:px-12 relative overflow-hidden transition-colors duration-300 ${
      isLight ? 'bg-transparent text-[#14170F]' : 'bg-[#14170F] text-white'
    }`}>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#48C765]/[0.03] blur-[150px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto relative z-10">
        <button 
          onClick={() => onNavigate('/#faq')}
          className={`mb-12 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
            isLight ? 'text-[#6B7268] hover:text-[#14170F]' : 'text-[#A4ACA1] hover:text-white'
          }`}
        >
          <ArrowLeft size={14} />
          {language === 'es' ? 'Volver al Inicio' : 'Back to Home'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Text */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <span className={`w-8 h-[1px] ${isLight ? 'bg-[#16A34A]' : 'bg-[#48C765]'}`}></span>
              <span className={`font-mono text-[10px] font-bold tracking-[0.25em] uppercase ${
                isLight ? 'text-[#15803D]' : 'text-[#48C765]'
              }`}>
                {language === 'es' ? 'GUÍA DE ENVÍO' : 'SHIPPING GUIDE'}
              </span>
            </div>

            <h1 className={`font-['Nunito',sans-serif] font-[900] text-3xl sm:text-5xl uppercase tracking-normal leading-[1.05] mb-8 ${
              isLight ? 'text-[#14170F]' : 'text-white'
            }`}>
              {language === 'es' ? '¿Cómo preparo mis cartas para enviarlas?' : 'How should I prepare my cards for shipping?'}
            </h1>

            <div className={`space-y-6 font-sans text-sm leading-relaxed text-justify ${
              isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
            }`}>
              <p>
                {language === 'es' 
                  ? 'Preparar tus cartas adecuadamente es el paso más crítico para asegurar que lleguen en perfectas condiciones a nuestras instalaciones.' 
                  : 'Properly preparing your cards is the most critical step to ensure they arrive at our facility in pristine condition.'}
              </p>
              
              <div className={`p-6 border ${
                isLight ? 'border-black/[0.08] bg-black/[0.02]' : 'border-white/[0.05] bg-white/[0.01]'
              }`}>
                <h3 className={`font-[900] mb-2 font-['Nunito',sans-serif] tracking-normal uppercase text-base sm:text-lg ${
                  isLight ? 'text-[#14170F]' : 'text-white'
                }`}>1. Penny Sleeve + Card Saver</h3>
                <p>
                  {language === 'es' 
                    ? 'Inserta cada carta en una funda protectora blanda (penny sleeve) y luego introdúcela en un toploader semirrígido tipo Card Saver. Esto evita que la carta se mueva y protege los bordes durante el tránsito.'
                    : 'Insert each card into a soft penny sleeve, then place it inside a semi-rigid toploader like a Card Saver. This prevents shifting and protects the edges during transit.'}
                </p>
              </div>

              <div className={`p-6 border ${
                isLight ? 'border-black/[0.08] bg-black/[0.02]' : 'border-white/[0.05] bg-white/[0.01]'
              }`}>
                <h3 className={`font-[900] mb-2 font-['Nunito',sans-serif] tracking-normal uppercase text-base sm:text-lg ${
                  isLight ? 'text-[#14170F]' : 'text-white'
                }`}>2. {language === 'es' ? 'Orden de las cartas' : 'Order of cards'}</h3>
                <p>
                  {language === 'es' 
                    ? 'Asegúrate de que las cartas estén en el mismo orden que tu hoja de envío (submission form).'
                    : 'Ensure the cards are in the exact same order as your submission form.'}
                </p>
              </div>

              <div className={`p-6 border ${
                isLight ? 'border-black/[0.08] bg-black/[0.02]' : 'border-white/[0.05] bg-white/[0.01]'
              }`}>
                <div className="flex items-center gap-2 mb-2 font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-amber-500">
                  <span>PROTOCOL NOTICE</span>
                  <span className={isLight ? 'text-black/20' : 'text-white/20'}>/</span>
                  <span>{language === 'es' ? 'AVISO CRÍTICO' : 'CRITICAL CAUTION'}</span>
                </div>
                <h3 className={`font-[900] mb-2 font-['Nunito',sans-serif] tracking-normal uppercase text-base sm:text-lg ${
                  isLight ? 'text-[#14170F]' : 'text-white'
                }`}>
                  {language === 'es' ? 'Protección de Aberturas' : 'Toploader Sealing Protocol'}
                </h3>
                <p className={`text-sm leading-relaxed ${isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'}`}>
                  {language === 'es' 
                    ? 'NUNCA uses cinta adhesiva (celo) sobre la abertura del toploader. Al abrir el paquete, el adhesivo puede adherirse a la carta y arruinarla. Empaca las cartas agrupadas entre dos piezas de cartón rígido.'
                    : 'NEVER use tape on the opening of the toploader. When unpacking, adhesive can stick to the card and ruin it. Pack the cards grouped between two pieces of rigid cardboard.'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`relative aspect-square lg:aspect-[4/5] overflow-hidden border shadow-2xl ${
              isLight ? 'bg-[#EAE5DC] border-black/[0.08]' : 'bg-[#14170F] border-white/[0.05]'
            }`}
          >
            
            <img 
              src="/images/preservar.png" 
              alt="Preparación de cartas"
              className={`absolute inset-0 w-full h-full object-cover ${
                isLight ? 'opacity-90' : 'mix-blend-luminosity opacity-80'
              }`}
            />
            {!isLight && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-[#14170F] via-transparent to-[#48C765]/10 mix-blend-overlay z-10" />
                <div className="absolute inset-0 bg-[#48C765]/5 z-10" />
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
