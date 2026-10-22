import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/* ═════════════════════════════════════════════════════════════════════
   ESCENARIO DEL HERO POR CAPAS
   - HeroStageBackdrop: escenario oscuro con luces doradas (cubre todo el hero)
   - HeroCardStage: slabs reales animados que SIEMPRE caben completos en su caja
   Para añadir cartas basta con agregar entradas a HERO_STAGE_ITEMS.
   ═════════════════════════════════════════════════════════════════════ */

interface SlabLabel {
  grade: string;
  cert: string;
  line1: string;
  line2: string;
  line3: string;
}

type StageItem =
  // Foto de un slab ya armado (PNG con fondo transparente)
  | { id: string; kind: 'slab-image'; src: string; alt: string }
  // Escaneo de una carta suelta: el slab y la etiqueta se dibujan en código
  | { id: string; kind: 'card'; src: string; alt: string; label: SlabLabel };

export const HERO_STAGE_ITEMS: StageItem[] = [
  { id: 'charizard', kind: 'slab-image', src: '/images/slab/front.png', alt: 'Charizard ex GGI 10' },
  {
    id: 'cade',
    kind: 'card',
    src: '/images/cards/cade_cunningham_front.jpg',
    alt: 'Cade Cunningham NBA Hoops GGI 10',
    label: { grade: '10', cert: 'GGI 0001024', line1: '2024-25 NBA HOOPS', line2: 'HARD WIRED', line3: 'CADE CUNNINGHAM' },
  },
  { id: 'pokemon-back', kind: 'slab-image', src: '/images/slab/back.png', alt: 'Gorila Grading International' },
];

// Proporción del slab (ancho / alto), tomada de /images/slab/front.png (613×974)
const SLAB_RATIO = 613 / 974;
// Tiempo que cada slab permanece al frente
const CYCLE_MS = 5600;
const EASE = [0.22, 1, 0.36, 1] as const;

// Posiciones deterministas de las luces desenfocadas del fondo (x %, y %, tamaño px, retardo s)
const BOKEH: [number, number, number, number][] = [
  [52, 14, 46, 0], [61, 32, 22, 2.4], [68, 9, 70, 1.1], [74, 41, 30, 3.6], [79, 18, 18, 0.6],
  [84, 56, 54, 2.0], [89, 27, 26, 4.2], [93, 47, 38, 1.6], [57, 62, 20, 3.0], [65, 74, 34, 0.3],
  [72, 66, 16, 2.7], [97, 12, 44, 3.3], [46, 38, 18, 1.9], [36, 12, 30, 4.6], [24, 26, 16, 2.2],
  [12, 8, 40, 0.9], [8, 52, 22, 3.9], [30, 70, 26, 1.3], [88, 78, 18, 4.8], [60, 88, 28, 2.6],
];

export const HeroStageBackdrop: React.FC = () => (
  <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#040605]">
    <style>{`
      @keyframes heroBokehDrift {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.55; }
        50% { transform: translate3d(0, -14px, 0) scale(1.08); opacity: 1; }
      }
      @keyframes heroSpotBreath {
        0%, 100% { opacity: 0.75; }
        50% { opacity: 1; }
      }
    `}</style>

    {/* Luz cenital cálida sobre el lado de las cartas */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse 55% 60% at 74% 28%, rgba(214,160,72,0.34) 0%, rgba(120,84,30,0.14) 40%, rgba(0,0,0,0) 70%)',
        animation: 'heroSpotBreath 9s ease-in-out infinite',
      }}
    />
    {/* Brillo verde de marca muy sutil al fondo */}
    <div
      className="absolute inset-0"
      style={{ background: 'radial-gradient(ellipse 40% 45% at 20% 70%, rgba(34,197,94,0.07) 0%, rgba(0,0,0,0) 70%)' }}
    />

    {/* Luces doradas desenfocadas (bokeh) */}
    {BOKEH.map(([x, y, size, delay], i) => (
      <span
        key={i}
        className="absolute rounded-full"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          background: 'radial-gradient(circle, rgba(255,206,120,0.9) 0%, rgba(232,160,64,0.35) 45%, rgba(232,160,64,0) 72%)',
          filter: `blur(${size > 36 ? 6 : 3}px)`,
          animation: `heroBokehDrift ${7 + (i % 5)}s ease-in-out ${delay}s infinite`,
          willChange: 'transform, opacity',
        }}
      />
    ))}

    {/* Piso: superficie oscura con resplandor dorado donde descansan los slabs */}
    <div
      className="absolute inset-x-0 bottom-0 h-[42%]"
      style={{
        background:
          'radial-gradient(ellipse 45% 55% at 74% 18%, rgba(196,140,60,0.18) 0%, rgba(0,0,0,0) 70%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(8,8,6,0.85) 45%, #030303 100%)',
      }}
    />
    {/* Viñeta */}
    <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 180px 40px rgba(0,0,0,0.85)' }} />
  </div>
);

/* Slab dibujado en código alrededor de una carta suelta, con la etiqueta verde de GGI */
const CodeSlab: React.FC<{ item: Extract<StageItem, { kind: 'card' }>; width: number }> = ({ item, width }) => {
  const fs = (k: number) => Math.max(6, width * k);
  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{
        padding: `${width * 0.055}px`,
        borderRadius: width * 0.045,
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 18%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0.22) 100%), rgba(18,20,20,0.55)',
        border: '1px solid rgba(255,255,255,0.45)',
        boxShadow:
          'inset 0 0 0 3px rgba(255,255,255,0.08), inset 0 0 0 6px rgba(0,0,0,0.35), inset 0 0 0 7px rgba(255,255,255,0.25), 0 30px 60px -20px rgba(0,0,0,0.9)',
      }}
    >
      {/* Etiqueta GGI */}
      <div
        className="relative flex items-center justify-between shrink-0 overflow-hidden text-[#0d1512]"
        style={{
          height: '20%',
          borderRadius: width * 0.015,
          padding: `0 ${width * 0.045}px`,
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 3px), linear-gradient(135deg, #79c3a2 0%, #5aa886 50%, #6fb998 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      >
        <div className="flex flex-col leading-none">
          <span className="flex items-center font-['Nunito',sans-serif] font-[900]" style={{ fontSize: fs(0.07), gap: width * 0.012 }}>
            <svg viewBox="0 0 24 28" style={{ width: fs(0.055), height: fs(0.064) }} aria-hidden="true">
              <path d="M12 0 24 4v10c0 7-5 12-12 14C5 26 0 21 0 14V4z" fill="#111" />
              <text x="12" y="19" textAnchor="middle" fontSize="13" fontWeight="900" fill="#79c3a2" fontFamily="Nunito, sans-serif">G</text>
            </svg>
            GGI
          </span>
          <span className="font-['Nunito',sans-serif] font-[900]" style={{ fontSize: fs(0.13), marginTop: width * 0.012 }}>
            {item.label.grade}
          </span>
          <span className="font-sans" style={{ fontSize: fs(0.03), marginTop: width * 0.008 }}>{item.label.cert}</span>
        </div>
        <div className="flex flex-col items-end text-right leading-tight font-sans">
          <span className="font-bold" style={{ fontSize: fs(0.036) }}>{item.label.line1}</span>
          <span style={{ fontSize: fs(0.034) }}>{item.label.line2}</span>
          <span className="font-bold" style={{ fontSize: fs(0.036) }}>{item.label.line3}</span>
        </div>
      </div>
      {/* Ventana de la carta */}
      <div
        className="relative flex-1 flex items-center justify-center"
        style={{ marginTop: width * 0.05, borderRadius: width * 0.03, background: 'rgba(0,0,0,0.55)', padding: width * 0.035 }}
      >
        <img
          src={item.src}
          alt={item.alt}
          draggable={false}
          className="max-w-full max-h-full object-contain"
          style={{ borderRadius: width * 0.025, boxShadow: '0 4px 14px rgba(0,0,0,0.6)' }}
        />
      </div>
    </div>
  );
};

const SlabVisual: React.FC<{ item: StageItem; width: number }> = ({ item, width }) =>
  item.kind === 'slab-image' ? (
    <img src={item.src} alt={item.alt} draggable={false} className="w-full h-full object-contain" />
  ) : (
    <CodeSlab item={item} width={width} />
  );

/* Mide la caja del escenario para calcular el tamaño de los slabs */
function useBoxSize<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export const HeroCardStage: React.FC<{ items?: StageItem[]; className?: string }> = ({
  items = HERO_STAGE_ITEMS,
  className = '',
}) => {
  const reduceMotion = useReducedMotion();
  const [boxRef, { w, h }] = useBoxSize<HTMLDivElement>();
  const [active, setActive] = React.useState(0);
  const n = items.length;

  React.useEffect(() => {
    if (reduceMotion || n < 2) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setActive((a) => (a + 1) % n);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, n]);

  // Tamaño del slab frontal: limitado por el alto (deja sitio al reflejo) y por el ancho
  // (los slabs laterales también deben caber), así ninguna carta se corta nunca.
  const frontH = Math.max(0, Math.min(h * 0.8, (w * 0.9) / (SLAB_RATIO * 2.28)));
  const frontW = frontH * SLAB_RATIO;
  const floorY = (h - frontH * 1.1) / 2 + frontH; // base común de los slabs
  const sideScale = 0.78;
  const sideOffset = frontW * 0.75;

  const slot = (rel: number) => {
    if (rel === 0) return { x: 0, scale: 1, rotateY: 0, opacity: 1, brightness: 1, z: 30 };
    const side = Math.sign(rel);
    if (Math.abs(rel) === 1)
      return { x: side * sideOffset, scale: sideScale, rotateY: -side * 22, opacity: 1, brightness: 0.55, z: 20 };
    return { x: side * sideOffset * 1.35, scale: 0.62, rotateY: -side * 30, opacity: 0, brightness: 0.4, z: 10 };
  };

  return (
    <div ref={boxRef} className={`relative select-none pointer-events-none ${className}`} style={{ perspective: 1600 }}>
      <style>{`
        @keyframes heroStageFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -7px, 0); }
        }
      `}</style>

      {frontH > 0 &&
        items.map((item, i) => {
          let rel = (((i - active) % n) + n) % n;
          if (rel > n / 2) rel -= n;
          const s = slot(rel);
          const isFront = rel === 0;
          // Alinea la base de cada slab con el piso aunque esté escalado (la escala parte del centro)
          const y = floorY - frontH + (frontH * (1 - s.scale)) / 2;
          return (
            <motion.div
              key={item.id}
              className="absolute left-1/2 top-0"
              style={{ width: frontW, height: frontH, marginLeft: -frontW / 2, zIndex: s.z, transformStyle: 'preserve-3d' }}
              initial={false}
              animate={{
                x: s.x,
                y,
                scale: s.scale,
                rotateY: s.rotateY,
                opacity: s.opacity,
                filter: `brightness(${s.brightness})`,
              }}
              transition={{ duration: reduceMotion ? 0 : 1.5, ease: EASE }}
            >
              <div
                className="relative w-full h-full"
                style={{ animation: reduceMotion ? undefined : `heroStageFloat 6.5s ease-in-out ${i * 1.3}s infinite` }}
              >
                <div className="relative w-full h-full" style={{ filter: 'drop-shadow(0 28px 34px rgba(0,0,0,0.75))' }}>
                  <SlabVisual item={item} width={frontW} />
                </div>

                {/* Luz de escáner + reflejo que recorren el slab cuando llega al frente */}
                {isFront && !reduceMotion && (
                  <div key={`fx-${active}`} className="absolute inset-0 overflow-hidden" style={{ borderRadius: frontW * 0.045 }}>
                    <motion.div
                      className="absolute inset-x-0"
                      style={{
                        height: '14%',
                        background:
                          'linear-gradient(to bottom, rgba(34,197,94,0) 0%, rgba(74,222,128,0.28) 46%, rgba(220,255,230,0.95) 50%, rgba(74,222,128,0.28) 54%, rgba(34,197,94,0) 100%)',
                        mixBlendMode: 'screen',
                      }}
                      initial={{ top: '-16%', opacity: 0 }}
                      animate={{ top: ['-16%', '102%'], opacity: [0, 1, 1, 0] }}
                      transition={{ delay: 1.3, duration: 2, ease: 'easeInOut', times: [0, 0.1, 0.85, 1] }}
                    />
                    <motion.div
                      className="absolute inset-y-0 w-[45%]"
                      style={{
                        background: 'linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,240,210,0.38) 50%, rgba(255,255,255,0) 100%)',
                        mixBlendMode: 'screen',
                      }}
                      initial={{ left: '-60%' }}
                      animate={{ left: '130%' }}
                      transition={{ delay: 3.4, duration: 1.4, ease: 'easeInOut' }}
                    />
                  </div>
                )}

                {/* Reflejo en el piso */}
                <div
                  aria-hidden="true"
                  className="absolute left-0 w-full"
                  style={{
                    top: '100%',
                    height: '100%',
                    transform: 'scaleY(-1)',
                    opacity: 0.16,
                    WebkitMaskImage: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0) 12%)',
                    maskImage: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0) 12%)',
                  }}
                >
                  <SlabVisual item={item} width={frontW} />
                </div>
              </div>
            </motion.div>
          );
        })}

      {/* Resplandor dorado bajo el slab frontal */}
      {frontH > 0 && (
        <div
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: floorY - frontH * 0.02,
            width: frontW * 2.4,
            height: frontH * 0.12,
            background: 'radial-gradient(ellipse at center, rgba(232,170,80,0.28) 0%, rgba(232,170,80,0) 70%)',
            zIndex: 5,
          }}
        />
      )}
    </div>
  );
};
