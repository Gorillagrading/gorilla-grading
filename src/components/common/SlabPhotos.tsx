import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

/** Fotos de la carta ya graduada y encapsulada en su slab, por delante y por detrás, tal como las sube el laboratorio. */
export const SlabPhotos: React.FC<{ images: { front: string; back: string }; name: string }> = ({ images, name }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const es = language === 'es';
  const rule = isLight ? 'border-gray-200' : 'border-white/10';
  const muted = isLight ? 'text-gray-600' : 'text-gray-400';

  const sides = [
    { key: 'front', label: es ? 'Anverso' : 'Front', url: images.front },
    { key: 'back', label: es ? 'Reverso' : 'Back', url: images.back },
  ] as const;

  return (
    <div className={`w-full flex flex-col border-t pt-5 ${rule}`}>
      <div className="flex flex-col mb-4">
        <span className={`font-mono text-[9px] tracking-[0.2em] uppercase font-bold mb-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
          {es ? 'Carta certificada' : 'Certified card'}
        </span>
        <h3 className={`font-['Space_Grotesk',sans-serif] font-bold uppercase tracking-wide text-base sm:text-lg ${isLight ? 'text-gray-950' : 'text-white'}`}>
          {es ? 'La carta en su slab' : 'The card in its slab'}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-[420px]">
        {sides.map((side) => (
          <figure key={side.key} className="min-w-0">
            {side.url ? (
              <a href={side.url} target="_blank" rel="noreferrer" className="block" title={es ? 'Ver a tamaño completo' : 'View full size'}>
                <img src={side.url} alt={`${name} — slab, ${side.label.toLowerCase()}`} className={`block w-full h-auto border ${rule}`} loading="lazy" />
              </a>
            ) : (
              <div className={`w-full aspect-[3/5] flex items-center justify-center p-3 text-center border border-dashed text-[11px] ${rule} ${muted}`}>
                {es ? 'Sin foto todavía' : 'No photo yet'}
              </div>
            )}
            <figcaption className={`mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${muted}`}>{side.label}</figcaption>
          </figure>
        ))}
      </div>
      <p className={`mt-2 text-xs ${muted}`}>
        {es ? 'Fotos del laboratorio. Pulsa una para verla a tamaño completo.' : 'Lab photos. Click one to view it full size.'}
      </p>
    </div>
  );
};
