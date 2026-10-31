import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { WORLD_DOTS } from './worldDots';

const { lon0, lon1, lat0, lat1, cols, rows, data } = WORLD_DOTS;
const W = 1000;
const CELL = W / cols;
const H = rows * CELL;

const project = (lon: number, lat: number) => ({
  x: ((lon - lon0) / (lon1 - lon0)) * W,
  y: ((lat0 - lat) / (lat0 - lat1)) * H,
});

// Colores del mapa: oscuro (verde luminoso sobre negro) y claro (verde profundo sobre crema).
const PALETTE = {
  dark: {
    bg: '#060B07', border: '#1F3D27', grid: 'rgba(74,222,128,0.07)', glow: 'rgba(74,222,128,0.12)',
    land: 'rgba(74,222,128,0.34)', europe: 'rgba(134,239,172,0.85)', arc: '#86EFAC', arcGlow: 'rgba(74,222,128,0.28)',
    trav: '#ECFDF5', ring: 'rgba(74,222,128,0.8)', dot: '#FFFFFF', dotShadow: 'rgba(74,222,128,0.95)',
    labelBg: 'rgba(5,10,6,0.88)', labelStroke: 'rgba(74,222,128,0.6)', labelText: '#D1FAE5',
    hud: '#4ADE80', sweep: 'rgba(134,239,172,0.9)', sweepGlow: 'rgba(74,222,128,0.55)',
  },
  light: {
    bg: '#EFE9DC', border: '#D6CDB8', grid: 'rgba(21,128,61,0.09)', glow: 'rgba(21,128,61,0.10)',
    land: 'rgba(21,128,61,0.30)', europe: 'rgba(21,128,61,0.80)', arc: '#15803D', arcGlow: 'rgba(21,128,61,0.20)',
    trav: '#14532D', ring: 'rgba(21,128,61,0.75)', dot: '#14532D', dotShadow: 'rgba(21,128,61,0.55)',
    labelBg: 'rgba(255,255,255,0.93)', labelStroke: 'rgba(21,128,61,0.65)', labelText: '#14532D',
    hud: '#15803D', sweep: 'rgba(21,128,61,0.85)', sweepGlow: 'rgba(21,128,61,0.4)',
  },
} as const;

// Desde Madrid salen las rutas hacia cada región.
const ORIGIN = project(-3.7, 40.4);

type Region = {
  id: string;
  es: string;
  en: string;
  lon: number;
  lat: number;
  /** Dónde queda la etiqueta respecto al punto: a qué lado y qué tan lejos. */
  label: { dx: string; dy: string };
};

const REGIONS: Region[] = [
  { id: 'na', es: 'AMÉRICA DEL NORTE', en: 'NORTH AMERICA', lon: -100, lat: 40, label: { dx: '-50%', dy: '95%' } },
  { id: 'sa', es: 'AMÉRICA DEL SUR', en: 'SOUTH AMERICA', lon: -58, lat: -15, label: { dx: '-108%', dy: '60%' } },
  { id: 'af', es: 'ÁFRICA', en: 'AFRICA', lon: 22, lat: 2, label: { dx: '-50%', dy: '90%' } },
  { id: 'as', es: 'ASIA', en: 'ASIA', lon: 100, lat: 35, label: { dx: '14%', dy: '-150%' } },
  { id: 'oc', es: 'OCEANÍA', en: 'OCEANIA', lon: 134, lat: -25, label: { dx: '-125%', dy: '-45%' } },
];

const arcPath = (to: { x: number; y: number }) => {
  const mx = (ORIGIN.x + to.x) / 2;
  const dist = Math.hypot(to.x - ORIGIN.x, to.y - ORIGIN.y);
  const my = Math.min(ORIGIN.y, to.y) - dist * 0.26;
  return `M ${ORIGIN.x.toFixed(1)} ${ORIGIN.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
};

// Todos los puntos del mapa en dos trazos: la tierra y, aparte y más brillante, Europa.
function buildDots() {
  let land = '';
  let europe = '';
  for (let r = 0; r < rows; r++) {
    const lat = lat0 - (r + 0.5) * ((lon1 - lon0) / cols);
    for (let c = 0; c < cols; c++) {
      if (data[r][c] !== '1') continue;
      const lon = lon0 + (c + 0.5) * ((lon1 - lon0) / cols);
      const x = ((c + 0.5) * CELL).toFixed(1);
      const y = ((r + 0.5) * CELL).toFixed(1);
      const isEurope = lon >= -11 && lon <= 40 && lat >= 35 && lat <= 62;
      if (isEurope) europe += `M${x} ${y}h0`;
      else land += `M${x} ${y}h0`;
    }
  }
  return { landPath: land, europePath: europe };
}

/**
 * Mapa de rutas de la red: el mundo en puntos, con las conexiones que salen de Europa hacia cada región.
 * Es un adorno de marca y no muestra datos: solo dibuja de dónde a dónde llega el servicio.
 */
export const GlobalRouteMap: React.FC = () => {
  const { language } = useLanguage();
  const es = language === 'es';
  const isLight = useTheme().theme === 'light';
  const pal = isLight ? PALETTE.light : PALETTE.dark;
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setLive(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { landPath, europePath } = useMemo(buildDots, []);

  return (
    <div className="w-full">
      {/* En móvil el rótulo del mapa va encima, no sobre los puntos */}
      <p className="sm:hidden mb-2 text-center font-mono text-[9px] font-bold tracking-[0.18em]" style={{ color: pal.hud }}>
        {es ? 'MAPA DE RUTAS GLOBAL · RED EUROPEA' : 'GLOBAL ROUTE MAP · EUROPEAN NETWORK'}
      </p>
      <div
        ref={ref}
        className={`route-map relative w-full overflow-hidden rounded-xl border ${live ? 'route-map-live' : ''}`}
        style={{ aspectRatio: `${W} / ${H}`, background: pal.bg, borderColor: pal.border }}
        role="img"
        aria-label={es ? 'Mapa de rutas desde Europa hacia todos los continentes' : 'Route map from Europe to every continent'}
      >
        {/* Rejilla y viñeta */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage: `linear-gradient(${pal.grid} 1px, transparent 1px), linear-gradient(90deg, ${pal.grid} 1px, transparent 1px)`,
            backgroundSize: '44px 44px',
          }}
        />
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 52% 40%, ${pal.glow}, transparent 62%)` }} />

        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none" aria-hidden="true">
          <path d={landPath} stroke={pal.land} strokeWidth="3.1" strokeLinecap="round" fill="none" />
          <path d={europePath} stroke={pal.europe} strokeWidth="3.4" strokeLinecap="round" fill="none" />

          {REGIONS.map((region, i) => {
            const to = project(region.lon, region.lat);
            const d = arcPath(to);
            return (
              <g key={region.id}>
                <path d={d} className="route-arc-glow" fill="none" stroke={pal.arcGlow} strokeWidth="5" strokeLinecap="round" pathLength={1} style={{ animationDelay: `${0.3 + i * 0.35}s` }} />
                <path id={`route-${region.id}`} d={d} className="route-arc" fill="none" stroke={pal.arc} strokeWidth="1.6" strokeLinecap="round" pathLength={1} style={{ animationDelay: `${0.3 + i * 0.35}s` }} />
                {live && (
                  <circle r="2.8" fill={pal.trav} className="route-traveler">
                    <animateMotion dur={`${4.2 + i * 0.4}s`} begin={`${2.2 + i * 0.5}s`} repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
                      <mpath href={`#route-${region.id}`} />
                    </animateMotion>
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Origen */}
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
          style={{ left: `${(ORIGIN.x / W) * 100}%`, top: `${(ORIGIN.y / H) * 100}%`, background: pal.dot, boxShadow: `0 0 12px 3px ${pal.dotShadow}` }}
          aria-hidden="true"
        />

        {/* Destinos: punto con pulso y etiqueta */}
        {REGIONS.map((region, i) => {
          const to = project(region.lon, region.lat);
          return (
            <div
              key={region.id}
              className="route-dest absolute"
              style={{ left: `${(to.x / W) * 100}%`, top: `${(to.y / H) * 100}%`, animationDelay: `${1.2 + i * 0.35}s` }}
            >
              <span className="absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ background: pal.dot, boxShadow: `0 0 10px 2px ${pal.dotShadow}` }} />
              <span className="route-ring absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border" style={{ borderColor: pal.ring }} />
              <span
                className="hidden sm:block absolute whitespace-nowrap border px-2 py-1 font-mono text-[9px] lg:text-[10px] font-bold tracking-[0.12em]"
                style={{ transform: `translate(${region.label.dx}, ${region.label.dy})`, background: pal.labelBg, borderColor: pal.labelStroke, color: pal.labelText }}
              >
                {es ? region.es : region.en}
              </span>
            </div>
          );
        })}

        {/* Barrido láser */}
        <div
          className="route-sweep absolute top-0 bottom-0 w-px pointer-events-none"
          style={{ background: `linear-gradient(to bottom, transparent, ${pal.sweep} 20%, ${pal.sweep} 80%, transparent)`, boxShadow: `0 0 14px 2px ${pal.sweepGlow}` }}
          aria-hidden="true"
        />

        {/* Marco HUD */}
        {['top-2.5 left-2.5 border-t border-l', 'top-2.5 right-2.5 border-t border-r', 'bottom-2.5 left-2.5 border-b border-l', 'bottom-2.5 right-2.5 border-b border-r'].map((c) => (
          <span key={c} className={`absolute w-4 h-4 ${c}`} style={{ borderColor: pal.hud }} aria-hidden="true" />
        ))}

        <div className="hidden sm:block absolute top-5 left-8 px-2 py-1.5 font-mono leading-tight" style={{ background: `${pal.bg}D9`, color: pal.hud }}>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.18em]">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: pal.hud }} />
            {es ? 'MAPA DE RUTAS GLOBAL' : 'GLOBAL ROUTE MAP'}
          </div>
          <div className="mt-0.5 ml-3 text-[10px] tracking-[0.18em] opacity-70">{es ? 'RED EUROPEA' : 'EUROPEAN NETWORK'}</div>
        </div>
        <div className="route-hud-foot hidden sm:block absolute bottom-4 left-8 font-mono text-[10px] tracking-[0.18em] opacity-70" style={{ color: pal.hud }}>
          {es ? 'ORIGEN · EUROPA' : 'ORIGIN · EUROPE'}
        </div>
        <div className="route-hud-foot hidden sm:block absolute bottom-4 right-8 font-mono text-[10px] tracking-[0.18em] opacity-70" style={{ color: pal.hud }}>
          GORILLA GRADING // GLOBAL NETWORK
        </div>
      </div>

      {/* En móvil las etiquetas no caben sobre el mapa: van debajo */}
      <ul className="sm:hidden mt-3 flex flex-wrap justify-center gap-2">
        {REGIONS.map((region) => (
          <li key={region.id} className="border px-2 py-1 font-mono text-[9px] font-bold tracking-[0.1em]" style={{ borderColor: pal.labelStroke, color: pal.hud }}>
            {es ? region.es : region.en}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────
// Versión de pantalla completa: el mapa llena todo el bloque y el texto va encima, en una franja
// de la parte alta que el mapa deja vacía. Todo (puntos, rutas y etiquetas) va dentro del mismo SVG,
// así que se escala junto y las etiquetas nunca se descolocan.
// ───────────────────────────────────────────────────────────────────────────

/** Alto (px) que se deja libre arriba del mapa para el título y el texto, para que no pisen las rutas. */
const TEXT_BAND = 175;

/** Etiquetas del mapa grande: desplazamiento respecto al punto, en unidades del mapa (no en píxeles). */
const HERO_LABELS: Record<string, { dx: number; dy: number }> = {
  na: { dx: 0, dy: 15 },
  sa: { dx: -38, dy: 6 },
  af: { dx: 0, dy: 15 },
  as: { dx: 18, dy: -13 },
  oc: { dx: -35, dy: -2 },
};

const heroArc = (to: { x: number; y: number }) => {
  const mx = (ORIGIN.x + to.x) / 2;
  const dist = Math.hypot(to.x - ORIGIN.x, to.y - ORIGIN.y);
  const my = Math.min(ORIGIN.y, to.y) - dist * 0.17;
  return `M ${ORIGIN.x.toFixed(1)} ${ORIGIN.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
};

export const GlobalRouteHero: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const es = language === 'es';
  const isLight = useTheme().theme === 'light';
  const pal = isLight ? PALETTE.light : PALETTE.dark;
  const ref = useRef<HTMLElement>(null);
  const [live, setLive] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setLive(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { landPath, europePath } = useMemo(buildDots, []);

  return (
    <section
      ref={ref}
      className={`route-map route-hero relative w-full overflow-hidden transition-colors duration-300 ${live ? 'route-map-live' : ''}`}
      style={{
        background: pal.bg,
        minHeight: `max(calc(100vh / var(--page-zoom, 1) - 5rem - 140px), calc(100vw / var(--page-zoom, 1) * ${(H / W).toFixed(3)} + ${TEXT_BAND}px))`,
      }}
      aria-label={es ? 'Mapa de rutas desde Europa hacia todos los continentes' : 'Route map from Europe to every continent'}
    >
      {/* Rejilla y luz de fondo */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage: `linear-gradient(${pal.grid} 1px, transparent 1px), linear-gradient(90deg, ${pal.grid} 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 62%, ${pal.glow}, transparent 62%)` }} />

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute bottom-0 left-0 w-full"
        style={{ aspectRatio: `${W} / ${H}` }}
        aria-hidden="true"
      >
        <path d={landPath} stroke={pal.land} strokeWidth="3.1" strokeLinecap="round" fill="none" />
        <path d={europePath} stroke={pal.europe} strokeWidth="3.4" strokeLinecap="round" fill="none" />

        {REGIONS.map((region, i) => {
          const to = project(region.lon, region.lat);
          const d = heroArc(to);
          const label = HERO_LABELS[region.id];
          const text = es ? region.es : region.en;
          const w = text.length * 5.5 + 12;
          const cx = to.x + label.dx;
          const cy = to.y + label.dy;
          return (
            <g key={region.id}>
              <path d={d} className="route-arc-glow" fill="none" stroke={pal.arcGlow} strokeWidth="5" strokeLinecap="round" pathLength={1} style={{ animationDelay: `${0.3 + i * 0.35}s` }} />
              <path id={`hero-route-${region.id}`} d={d} className="route-arc" fill="none" stroke={pal.arc} strokeWidth="1.5" strokeLinecap="round" pathLength={1} style={{ animationDelay: `${0.3 + i * 0.35}s` }} />
              {live && !reduce && (
                <circle r="2.6" fill={pal.trav} className="route-traveler">
                  <animateMotion dur={`${4.2 + i * 0.4}s`} begin={`${2.2 + i * 0.5}s`} repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
                    <mpath href={`#hero-route-${region.id}`} />
                  </animateMotion>
                </circle>
              )}

              <g className="route-dest-svg" style={{ animationDelay: `${1.2 + i * 0.35}s` }}>
                {live && !reduce && (
                  <circle cx={to.x} cy={to.y} r="3" fill="none" stroke={pal.ring} strokeWidth="0.8">
                    <animate attributeName="r" values="3;12" dur="2.6s" begin={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0" dur="2.6s" begin={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={to.x} cy={to.y} r="2.6" fill={pal.dot} style={{ filter: `drop-shadow(0 0 4px ${pal.dotShadow})` }} />
                <rect x={cx - w / 2} y={cy - 6.6} width={w} height="13.2" fill={pal.labelBg} stroke={pal.labelStroke} strokeWidth="0.6" />
                <text x={cx} y={cy + 2.5} textAnchor="middle" fill={pal.labelText} fontSize="6.6" fontWeight="700" letterSpacing="0.8" fontFamily="'JetBrains Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace">
                  {text}
                </text>
              </g>
            </g>
          );
        })}

        {/* Origen: Madrid */}
        <circle cx={ORIGIN.x} cy={ORIGIN.y} r="3.2" fill={pal.dot} style={{ filter: `drop-shadow(0 0 6px ${pal.dotShadow})` }} />
      </svg>

      {/* Sombra detrás del texto, para que se lea sobre cualquier punto del mapa */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{ height: 'min(58%, 380px)', background: `linear-gradient(to bottom, ${pal.bg}, ${pal.bg}D9 45%, transparent)` }}
      />

      {/* Barrido láser */}
      <div
        className="route-sweep absolute top-0 bottom-0 w-px pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent, ${pal.sweep} 20%, ${pal.sweep} 80%, transparent)`, boxShadow: `0 0 14px 2px ${pal.sweepGlow}` }}
        aria-hidden="true"
      />

      {/* Marco HUD */}
      {['top-4 left-4 border-t border-l', 'top-4 right-4 border-t border-r', 'bottom-4 left-4 border-b border-l', 'bottom-4 right-4 border-b border-r'].map((c) => (
        <span key={c} className={`absolute w-5 h-5 ${c}`} style={{ borderColor: pal.hud }} aria-hidden="true" />
      ))}

      <div className="hidden 2xl:block absolute top-8 left-12 font-mono leading-tight" style={{ color: pal.hud }}>
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em]">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: pal.hud }} />
          {es ? 'MAPA DE RUTAS GLOBAL' : 'GLOBAL ROUTE MAP'}
        </div>
        <div className="mt-0.5 ml-3.5 text-[10px] tracking-[0.2em] opacity-70">{es ? 'RED EUROPEA' : 'EUROPEAN NETWORK'}</div>
      </div>
      <div className="absolute bottom-7 left-12 font-mono text-[10px] tracking-[0.2em] opacity-70" style={{ color: pal.hud }}>{es ? 'ORIGEN · EUROPA' : 'ORIGIN · EUROPE'}</div>
      <div className="absolute bottom-7 right-12 font-mono text-[10px] tracking-[0.2em] opacity-70" style={{ color: pal.hud }}>GORILLA GRADING // GLOBAL NETWORK</div>

      {/* Contenido (título y texto) en la franja de arriba */}
      <div className="relative z-10 px-6 lg:px-12">{children}</div>
    </section>
  );
};
