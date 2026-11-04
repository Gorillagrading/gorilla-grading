import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

type Side = 'front' | 'back';

/** Fotos de la carta ya graduada y encapsulada en su slab, tal como la sube el laboratorio. */
export const SlabPhotos: React.FC<{ images: { front: string; back: string }; name: string }> = ({ images, name }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const es = language === 'es';
  const sides = (['front', 'back'] as const).filter((s) => images[s]);
  const [side, setSide] = useState<Side>(sides[0] ?? 'front');
  const rule = isLight ? 'border-gray-200' : 'border-white/10';
  const muted = isLight ? 'text-gray-600' : 'text-gray-400';

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

      {sides.length > 1 && (
        <div className={`inline-flex self-start border mb-3 ${rule}`} role="group" aria-label={es ? 'Cara del slab' : 'Slab side'}>
          {sides.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={side === s}
              onClick={() => setSide(s)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] cursor-pointer ${
                side === s ? (isLight ? 'bg-gray-900 text-white' : 'bg-white text-gray-950') : muted
              }`}
            >
              {s === 'front' ? (es ? 'Anverso' : 'Front') : (es ? 'Reverso' : 'Back')}
            </button>
          ))}
        </div>
      )}

      <a href={images[side]} target="_blank" rel="noreferrer" className="block self-start">
        <img
          src={images[side]}
          alt={`${name} — ${es ? 'slab' : 'slab'} (${side === 'front' ? (es ? 'anverso' : 'front') : (es ? 'reverso' : 'back')})`}
          className={`block w-full max-w-[360px] h-auto border ${rule}`}
          loading="lazy"
        />
      </a>
      <p className={`mt-2 text-xs ${muted}`}>
        {es ? 'Foto del laboratorio. Pulsa para verla a tamaño completo.' : 'Lab photo. Click to view it full size.'}
      </p>
    </div>
  );
};
