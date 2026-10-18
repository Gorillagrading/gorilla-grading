import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface FAQTurnaroundPageProps {
  onNavigate: (path: string) => void;
}

export const FAQTurnaroundPage: React.FC<FAQTurnaroundPageProps> = ({ onNavigate }) => {
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
                {language === 'es' ? 'VELOCIDAD DE SERVICIO' : 'SERVICE SPEED'}
              </span>
            </div>

            <h1 className={`font-['Nunito',sans-serif] font-[900] text-3xl sm:text-5xl uppercase tracking-normal leading-[1.05] mb-8 ${
              isLight ? 'text-[#14170F]' : 'text-white'
            }`}>
              {language === 'es' ? '¿Cuánto tardan los tiempos de respuesta (turnaround)?' : 'How long are the turnaround times?'}
            </h1>

            <div className={`space-y-6 font-sans text-sm leading-relaxed text-justify ${
              isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
            }`}>
              <p>
                {language === 'es' 
                  ? 'Nuestra promesa de marca es la transparencia. Los tiempos de respuesta estimados son estrictos e inician exclusivamente en el momento en que tu paquete es escaneado y registrado en nuestro sistema (fase de admisión).' 
                  : 'Our brand promise is transparency. Estimated turnaround times are strict and begin exclusively the moment your package is scanned and registered in our system (intake phase).'}
              </p>
              
              <div className={`p-6 border ${
                isLight ? 'border-black/[0.08] bg-black/[0.02]' : 'border-white/[0.05] bg-white/[0.01]'
              }`}>
                <h3 className={`font-[900] mb-2 font-['Nunito',sans-serif] tracking-normal uppercase text-base sm:text-lg ${
                  isLight ? 'text-[#14170F]' : 'text-white'
                }`}>
                  {language === 'es' ? '¿Cuándo empieza a contar el tiempo?' : 'When does the clock start?'}
                </h3>
                <p>
                  {language === 'es' 
                    ? 'El día 1 es el siguiente día hábil después de que tu pedido entra en estado "Recibido". Los envíos en tránsito no cuentan hacia los días de procesamiento.'
                    : 'Day 1 is the next business day after your order enters "Received" status. Transit times do not count towards processing days.'}
                </p>
              </div>

              <div className={`p-6 border ${
                isLight ? 'border-black/[0.08] bg-black/[0.02]' : 'border-white/[0.05] bg-white/[0.01]'
              }`}>
                <h3 className={`font-[900] mb-2 font-['Nunito',sans-serif] tracking-normal uppercase text-base sm:text-lg ${
                  isLight ? 'text-[#14170F]' : 'text-white'
                }`}>
                  {language === 'es' ? 'Días Hábiles de Laboratorio' : 'Laboratory Business Days'}
                </h3>
                <p className={isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'}>
                  {language === 'es' 
                    ? 'Nuestros tiempos operativos (ej. 48h, 10 días, 20 días) se refieren a días laborables (Lunes a Viernes). No se procesan cartas durante fines de semana ni festivos nacionales.'
                    : 'Our operational times (e.g., 48h, 10 days, 20 days) refer to business days (Monday to Friday). Cards are not processed during weekends or national holidays.'}
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
              src="/images/step_2_cleanroom.jpg" 
              alt="Tiempos de respuesta"
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
