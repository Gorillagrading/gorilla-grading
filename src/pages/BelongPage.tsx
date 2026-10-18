import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  onNavigate: (path: string) => void;
}

export const BelongPage: React.FC<PageProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`relative w-full min-h-[80vh] py-24 px-6 lg:px-12 select-none flex flex-col items-center justify-center overflow-hidden transition-colors duration-300 ${
      isLight ? 'bg-[#ECE5D8] text-[#14170F]' : 'bg-[#14170F] text-white'
    }`}>
      
      {/* Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[120px] rounded-full pointer-events-none ${
        isLight ? 'bg-[#15803D]/5' : 'bg-[#48C765]/5'
      }`} />

      {/* Back Button */}
      <button 
        onClick={() => onNavigate('/#faq')} 
        className={`absolute top-8 left-6 sm:left-12 flex items-center gap-3 transition-colors group z-20 ${
          isLight ? 'text-[#4A5048] hover:text-[#15803D]' : 'text-white/40 hover:text-[#48C765]'
        }`}
      >
        <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
          isLight ? 'border-black/10 group-hover:border-[#15803D]/50 group-hover:bg-[#15803D]/10' : 'border-white/[0.05] group-hover:border-[#48C765]/50 group-hover:bg-[#48C765]/10'
        }`}>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </div>
        <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5">{language === 'es' ? 'Volver al Inicio' : 'Back to Home'}</span>
      </button>

      <div className="relative z-10 max-w-[1000px] mx-auto text-center space-y-10">
        
        {/* Tech/Luxury Badge */}
        <div className="inline-flex relative group">
          <div className={`relative px-8 py-3 border flex items-center justify-center overflow-hidden transition-all duration-300 ${
            isLight ? 'bg-[#F2ECE1] border-black/[0.08]' : 'bg-[#1A1E1C] border-white/[0.05]'
          }`}>
            <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${isLight ? 'border-[#15803D]' : 'border-[#48C765]'}`} />
            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${isLight ? 'border-[#15803D]' : 'border-[#48C765]'}`} />

            <span className={`relative z-10 font-mono text-[11px] font-bold tracking-[0.4em] uppercase mt-0.5 transition-colors duration-300 ${
              isLight ? 'text-[#15803D]' : 'text-[#F4F6F0] group-hover:text-[#48C765]'
            }`}>
              {t('ref.pillar4.title')}
            </span>
          </div>
        </div>
        
        <h1 className={`font-['Nunito',sans-serif] font-[900] text-4xl sm:text-5xl md:text-6xl uppercase tracking-normal leading-[1.05] ${
          isLight ? 'text-[#14170F]' : 'text-white'
        }`}>
          {language === 'es' ? 'ECOSISTEMA INTERNACIONAL' : 'INTERNATIONAL ECOSYSTEM'}
        </h1>
        
        <p className={`font-sans text-lg max-w-2xl mx-auto leading-relaxed ${
          isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
        }`}>
          {t('ref.pillar4.desc')}
        </p>

        <div className={`mt-12 border p-8 rounded-none text-left transition-colors duration-300 ${
          isLight ? 'bg-[#F2ECE1] border-black/[0.08] shadow-sm' : 'bg-[#14170F] border-white/[0.05]'
        }`}>
          <h3 className={`font-['Nunito',sans-serif] font-[900] text-2xl uppercase tracking-normal mb-4 ${
            isLight ? 'text-[#15803D]' : 'text-[#48C765]'
          }`}>
            {language === 'es' ? 'Ventajas del Mercado Unificado' : 'Unified Market Advantages'}
          </h3>
          <ul className={`space-y-4 font-mono text-sm ${isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'}`}>
            <li className="flex gap-4 items-center">
              <span className={`px-2 py-1 rounded text-xs font-bold ${isLight ? 'text-white bg-[#15803D]' : 'text-white bg-[#14170F]'}`}>01</span> 
              {language === 'es' ? 'Logística global optimizada y trazabilidad permanente' : 'Optimized global logistics and permanent tracking'}
            </li>
            <li className="flex gap-4 items-center">
              <span className={`px-2 py-1 rounded text-xs font-bold ${isLight ? 'text-white bg-[#15803D]' : 'text-white bg-[#14170F]'}`}>02</span> 
              {language === 'es' ? 'Liquidez de mercado y red internacional de confianza' : 'Market liquidity and international trust network'}
            </li>
            <li className="flex gap-4 items-center">
              <span className={`px-2 py-1 rounded text-xs font-bold ${isLight ? 'text-white bg-[#15803D]' : 'text-white bg-[#14170F]'}`}>03</span> 
              {language === 'es' ? 'Tránsito blindado puerta a puerta 100% asegurado' : '100% fully insured door-to-door armored transit'}
            </li>
            <li className="flex gap-4 items-center">
              <span className={`px-2 py-1 rounded text-xs font-bold ${isLight ? 'text-white bg-[#15803D]' : 'text-white bg-[#14170F]'}`}>04</span> 
              {language === 'es' ? 'Cadena de custodia ininterrumpida' : 'Uninterrupted chain of custody'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
