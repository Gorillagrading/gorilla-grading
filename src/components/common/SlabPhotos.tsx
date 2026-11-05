import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * Las fotos del laboratorio llevan un fondo oscuro de estudio. Para que el slab se vea "recortado", se
 * muestra solo el rectángulo del slab con sus esquinas redondeadas. Las proporciones salen del
 * encuadre fijo de las fotos del laboratorio (arriba, derecha, abajo, izquierda).
 */
const SLAB_CLIP = 'inset(6.2% 3.2% 3.8% 2.8% round 4.5%)';

const MAX_TILT = 12;

/** Foto del slab con inclinación 3D según el puntero y un reflejo suave. Al pulsarla se abre el zoom. */
const TiltPhoto: React.FC<{ url: string; alt: string; label: string; onOpen: () => void }> = ({ url, alt, label, onOpen }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, gx: 50, gy: 50, active: false });
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const move = (e: React.PointerEvent) => {
    if (reduced || e.pointerType === 'touch' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ x: (0.5 - py) * 2 * MAX_TILT, y: (px - 0.5) * 2 * MAX_TILT, gx: px * 100, gy: py * 100, active: true });
  };
  const leave = () => setTilt({ x: 0, y: 0, gx: 50, gy: 50, active: false });

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      onPointerMove={move}
      onPointerLeave={leave}
      aria-label={label}
      className="group relative block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] rounded-xl"
      style={{ perspective: '900px' }}
    >
      <div
        className="relative w-full"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.active ? 1.03 : 1})`,
          transition: tilt.active ? 'transform 90ms ease-out' : 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)',
          transformStyle: 'preserve-3d',
          filter: 'drop-shadow(0 18px 22px rgba(0,0,0,0.28)) drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
        }}
      >
        <img src={url} alt={alt} className="block w-full h-auto select-none" style={{ clipPath: SLAB_CLIP }} loading="lazy" draggable={false} />
        {/* Reflejo que sigue al puntero */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            clipPath: SLAB_CLIP,
            opacity: tilt.active ? 1 : 0,
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.28), transparent 55%)`,
          }}
        />
        <span aria-hidden="true" className="absolute bottom-[7%] right-[7%] w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  );
};

/** Visor a pantalla completa, sin salir de la página: pulsar la foto alterna el zoom y se arrastra con el dedo o el ratón. */
const Lightbox: React.FC<{
  photos: { url: string; alt: string; label: string }[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  es: boolean;
}> = ({ photos, index, onIndex, onClose, es }) => {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const photo = photos[index];

  useEffect(() => setZoomed(false), [index]);

  const step = useCallback((d: number) => onIndex((index + d + photos.length) % photos.length), [index, photos.length, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (photos.length > 1 && e.key === 'ArrowRight') step(1);
      if (photos.length > 1 && e.key === 'ArrowLeft') step(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, step, photos.length]);

  const aim = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
      className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={es ? 'Cerrar' : 'Close'}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {photos.length > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label={es ? 'Foto anterior' : 'Previous photo'}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer z-10">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label={es ? 'Foto siguiente' : 'Next photo'}
            className="absolute right-3 sm:right-16 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer z-10">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <div
        className="relative max-w-full max-h-full overflow-hidden rounded-lg"
        onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
        onPointerMove={zoomed ? aim : undefined}
        style={{ cursor: zoomed ? 'zoom-out' : 'zoom-in' }}
      >
        <img
          src={photo.url}
          alt={photo.alt}
          draggable={false}
          className="block max-w-[92vw] max-h-[86vh] w-auto h-auto select-none transition-transform duration-300 ease-out"
          style={{ transform: zoomed ? 'scale(2.4)' : 'scale(1)', transformOrigin: `${origin.x}% ${origin.y}%` }}
        />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-[11px] font-mono uppercase tracking-[0.14em] pointer-events-none">
        {photo.label} · {zoomed ? (es ? 'Mueve el cursor para recorrer' : 'Move to pan') : (es ? 'Pulsa para ampliar' : 'Click to zoom')}
      </div>
    </div>,
    document.body,
  );
};

/** Fotos de la carta ya graduada y encapsulada en su slab, por delante y por detrás, tal como las sube el laboratorio. */
export const SlabPhotos: React.FC<{ images: { front: string; back: string }; name: string }> = ({ images, name }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const es = language === 'es';
  const rule = isLight ? 'border-gray-200' : 'border-white/10';
  const muted = isLight ? 'text-gray-600' : 'text-gray-400';
  const [open, setOpen] = useState<number | null>(null);

  const sides = [
    { key: 'front', label: es ? 'Anverso' : 'Front', url: images.front },
    { key: 'back', label: es ? 'Reverso' : 'Back', url: images.back },
  ] as const;
  const available = sides.filter((s) => s.url).map((s) => ({ url: s.url, label: s.label, alt: `${name} — slab, ${s.label.toLowerCase()}` }));

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

      <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-[460px]">
        {sides.map((side) => {
          const at = available.findIndex((p) => p.url === side.url);
          return (
            <figure key={side.key} className="min-w-0">
              {side.url ? (
                <TiltPhoto
                  url={side.url}
                  alt={`${name} — slab, ${side.label.toLowerCase()}`}
                  label={es ? `Ampliar foto: ${side.label}` : `Enlarge photo: ${side.label}`}
                  onOpen={() => setOpen(at)}
                />
              ) : (
                <div className={`w-full aspect-[3/5] flex items-center justify-center p-3 text-center border border-dashed text-[11px] ${rule} ${muted}`}>
                  {es ? 'Sin foto todavía' : 'No photo yet'}
                </div>
              )}
              <figcaption className={`mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${muted}`}>{side.label}</figcaption>
            </figure>
          );
        })}
      </div>
      <p className={`mt-2 text-xs ${muted}`}>
        {es ? 'Fotos del laboratorio. Pulsa una para ampliarla.' : 'Lab photos. Click one to enlarge it.'}
      </p>

      {open !== null && available[open] && (
        <Lightbox photos={available} index={open} onIndex={setOpen} onClose={() => setOpen(null)} es={es} />
      )}
    </div>
  );
};
