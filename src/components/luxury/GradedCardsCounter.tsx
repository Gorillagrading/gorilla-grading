import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/client';

/**
 * GradedCardsCounter — cuántas cartas tienen hoy un certificado vigente, leído del registro.
 * Solo cuentan los certificados activos: uno revocado o sustituido deja de sumar.
 * Si la consulta falla no se muestra nada, nunca una cifra inventada.
 */
export const GradedCardsCounter: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ certified: number }>('/registry/summary')
      .then((r) => !cancelled && setCount(r.certified))
      .catch(() => !cancelled && setCount(null));
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null) return null;

  // Format number with locale-appropriate separators
  const formattedCount = count.toLocaleString(language === 'es' ? 'es-ES' : 'en-US');

  return (
    <div className={`w-full mt-5 pt-4 border-t ${isLight ? 'border-[#E5E1D8]' : 'border-white/[0.08]'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`font-mono text-[9px] uppercase tracking-[0.22em] font-semibold ${
          isLight ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {language === 'es' ? 'CENSO DE EJEMPLARES' : 'CERTIFIED CENSUS'}
        </span>
        <span className={`font-mono text-[9px] tracking-wider uppercase font-semibold ${
          isLight ? 'text-gray-700' : 'text-gray-300'
        }`}>
          ISO-9001 · EU
        </span>
      </div>

      <div className="flex items-baseline gap-2.5">
        <span className={`font-['Nunito',sans-serif] text-3xl font-[900] tracking-tight leading-none ${
          isLight ? 'text-[#111827]' : 'text-white'
        }`}>
          {formattedCount}
        </span>
        <div className="flex flex-col">
          <span className={`font-sans text-[11px] font-bold uppercase tracking-wider leading-tight ${
            isLight ? 'text-gray-900' : 'text-gray-200'
          }`}>
            {language === 'es' ? 'Cartas Certificadas' : 'Graded & Sealed'}
          </span>
          <span className={`font-mono text-[9px] tracking-tight ${
            isLight ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {language === 'es' ? 'Cápsula sónica hermética' : 'Hermetic sonic slab'}
          </span>
        </div>
      </div>
    </div>
  );
};
