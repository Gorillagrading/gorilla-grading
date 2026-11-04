import React, { useState } from 'react';
import type { CornerPosition, DamageArea, PublicScanReport, ScanFace, ScanSide } from '../../../shared/scan-report';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { formatGrade } from '../../utils/cardDisplay';

type Lang = 'es' | 'en';

const CORNER_LABEL: Record<CornerPosition, Record<Lang, string>> = {
  topLeft: { es: 'Superior izquierda', en: 'Top left' },
  topRight: { es: 'Superior derecha', en: 'Top right' },
  bottomLeft: { es: 'Inferior izquierda', en: 'Bottom left' },
  bottomRight: { es: 'Inferior derecha', en: 'Bottom right' },
};
export const AREA_LABEL: Record<DamageArea, Record<Lang, string>> = {
  edges: { es: 'Bordes', en: 'Edges' },
  surface: { es: 'Superficie', en: 'Surface' },
  corners: { es: 'Esquinas', en: 'Corners' },
};
export const SIZE_LABEL = { small: { es: 'pequeño', en: 'small' }, medium: { es: 'mediano', en: 'medium' }, large: { es: 'grande', en: 'large' } } as const;
const SIDE_LABEL: Record<ScanSide, Record<Lang, string>> = { front: { es: 'Anverso', en: 'Front' }, back: { es: 'Reverso', en: 'Back' } };

/** El escáner escribe en español; en inglés se traducen los tipos de daño y los sitios que conocemos. */
export const KIND_EN: Record<string, string> = {
  'filo comido': 'Edge wear',
  manchón: 'Smudge',
  'desconchón de tinta': 'Ink chip',
  'punto o mota': 'Dot or speck',
  golpe: 'Dent',
  corte: 'Cut',
  arañazo: 'Scratch',
  rayón: 'Scratch',
  doblez: 'Crease',
  arruga: 'Crease',
};
export const LOCATION_EN: Record<string, string> = {
  'borde de arriba': 'top edge',
  'borde de abajo': 'bottom edge',
  'borde derecho': 'right edge',
  'borde izquierdo': 'left edge',
};
export const translate = (text: string, dictionary: Record<string, string>, lang: Lang) =>
  lang === 'en' ? (dictionary[text.trim().toLowerCase()] ?? text) : text;

/** Números con coma en español: 2,47. */
export const mm = (n: number, lang: Lang, digits = 2) =>
  n.toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** El reparto más descentrado de los dos ejes ("51/49" frente a "50/50"). */
const offCenter = (ratio: string) => Math.max(...ratio.split('/').map(Number).filter(Number.isFinite), 0);

/**
 * Informe del escáner en el certificado: las medidas del centrado, las esquinas ampliadas, la lista de daños
 * numerada (los mismos números que en el mapa de defectos) y cómo sale la nota final.
 */
export const ScanReportPanel: React.FC<{ scan: PublicScanReport }> = ({ scan }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const lang: Lang = language === 'es' ? 'es' : 'en';
  const es = lang === 'es';
  const [side, setSide] = useState<ScanSide>(scan.faces[0]?.side ?? 'front');
  const face = scan.faces.find((f) => f.side === side) ?? scan.faces[0];

  const muted = isLight ? 'text-gray-600' : 'text-gray-400';
  const strong = isLight ? 'text-gray-950' : 'text-white';
  const rule = isLight ? 'border-gray-200' : 'border-white/10';
  const kicker = `font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-bold ${isLight ? 'text-gray-500' : 'text-gray-400'}`;

  const facts: [string, string][] = [
    [es ? 'Resolución' : 'Resolution', scan.ppi ? `${scan.ppi} ${es ? 'ppp' : 'dpi'}` : '—'],
    [es ? 'Medida de la carta' : 'Card size', scan.widthMm && scan.heightMm ? `${mm(scan.widthMm, lang)} × ${mm(scan.heightMm, lang)} mm` : '—'],
    [es ? 'Caras escaneadas' : 'Sides scanned', scan.sides === 'front' ? (es ? 'Solo anverso' : 'Front only') : (es ? 'Anverso y reverso' : 'Front and back')],
    [es ? 'Criterios' : 'Criteria', scan.criteria],
    [es ? 'Notas emitidas' : 'Grades issued', scan.gradedAt],
  ];

  return (
    <section
      className={`p-5 sm:p-7 border shadow-md space-y-8 ${rule}`}
      style={{ backgroundColor: isLight ? '#FFFFFF' : '#0E120E' }}
      aria-labelledby="scan-report-title"
    >
      {/* Cabecera */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <span className={`${kicker} mb-1`}>{es ? 'Informe del escáner' : 'Scanner report'}</span>
          <h3 id="scan-report-title" className={`font-['Space_Grotesk',sans-serif] font-bold uppercase tracking-wide text-xl sm:text-3xl ${strong}`}>
            {es ? 'Medidas de la carta' : 'Card measurements'}
          </h3>
        </div>
        <dl className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3 pt-4 border-t ${rule}`}>
          {facts.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className={`font-mono text-[9px] uppercase tracking-[0.16em] ${muted}`}>{label}</dt>
              <dd className={`font-mono text-xs sm:text-sm font-bold break-words ${strong}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {scan.faces.length > 1 && (
        <div className={`inline-flex border ${rule}`} role="group" aria-label={es ? 'Cara de la carta' : 'Card side'}>
          {scan.faces.map((f) => (
            <button
              key={f.side}
              type="button"
              aria-pressed={side === f.side}
              onClick={() => setSide(f.side)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] cursor-pointer ${
                side === f.side ? (isLight ? 'bg-gray-900 text-white' : 'bg-white text-gray-950') : muted
              }`}
            >
              {SIDE_LABEL[f.side][lang]}
            </button>
          ))}
        </div>
      )}

      {face && (
        <>
          <Centering face={face} widthMm={scan.widthMm ?? 63} heightMm={scan.heightMm ?? 88} lang={lang} isLight={isLight} kicker={kicker} />
          <Corners face={face} images={scan.images.corners[face.side] ?? {}} lang={lang} isLight={isLight} kicker={kicker} />
          <Damages face={face} lang={lang} isLight={isLight} kicker={kicker} />
        </>
      )}

      <FinalGrade scan={scan} lang={lang} isLight={isLight} kicker={kicker} />
    </section>
  );
};

type BlockProps = { lang: Lang; isLight: boolean; kicker: string };

const BlockTitle: React.FC<{ title: string; score?: number | null; kicker: string; isLight: boolean; lang: Lang }> = ({ title, score, kicker, isLight, lang }) => (
  <div className={`flex items-baseline justify-between gap-3 pb-2 mb-4 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
    <span className={kicker}>{title}</span>
    {score !== undefined && score !== null && (
      <span className={`font-mono text-[11px] ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
        {lang === 'es' ? 'nota' : 'grade'} <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{formatGrade(score)}</strong>
      </span>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Centrado
// ---------------------------------------------------------------------------

const Centering: React.FC<BlockProps & { face: ScanFace; widthMm: number; heightMm: number }> = ({ face, widthMm, heightMm, lang, isLight, kicker }) => {
  const es = lang === 'es';
  const c = face.centering;
  if (!c) return null;
  const muted = isLight ? 'text-gray-600' : 'text-gray-400';
  const strong = isLight ? 'text-gray-950' : 'text-white';
  // Manda el eje más descentrado: se marca en ámbar, como en el informe.
  const worst = offCenter(c.vertical) > offCenter(c.horizontal) ? 'vertical' : offCenter(c.horizontal) > offCenter(c.vertical) ? 'horizontal' : null;
  const amber = isLight ? 'text-amber-700' : 'text-amber-300';

  const pad = 14;
  const stroke = isLight ? '#9CA3AF' : 'rgba(255,255,255,0.35)';
  const text = isLight ? '#111827' : '#F3F4F6';
  const label = (value: number) => mm(value, lang);

  const rows: [string, string, boolean][] = [
    [es ? 'Izquierda' : 'Left', `${mm(c.leftMm, lang)} mm`, false],
    [es ? 'Derecha' : 'Right', `${mm(c.rightMm, lang)} mm`, false],
    [es ? 'Izq. / dcha.' : 'Left / right', c.horizontal, worst === 'horizontal'],
    [es ? 'Arriba' : 'Top', `${mm(c.topMm, lang)} mm`, false],
    [es ? 'Abajo' : 'Bottom', `${mm(c.bottomMm, lang)} mm`, false],
    [es ? 'Arriba / abajo' : 'Top / bottom', c.vertical, worst === 'vertical'],
  ];

  return (
    <div>
      <BlockTitle title={es ? 'Centrado' : 'Centering'} score={c.score} kicker={kicker} isLight={isLight} lang={lang} />
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
        {/* Dibujo a escala: la carta y la línea del marco impreso, con el ancho de cada lado en mm. */}
        <svg
          viewBox={`${-pad - 4} ${-pad} ${widthMm + 2 * pad + 8} ${heightMm + 2 * pad}`}
          className="w-[200px] sm:w-[220px] h-auto mx-auto md:mx-0"
          role="img"
          aria-label={es ? 'Dibujo a escala del centrado' : 'Scale drawing of the centering'}
        >
          <rect x={0} y={0} width={widthMm} height={heightMm} rx={3} fill={isLight ? '#F3F4F1' : '#1A1F1A'} stroke={stroke} strokeWidth={0.4} />
          <rect
            x={c.leftMm}
            y={c.topMm}
            width={widthMm - c.leftMm - c.rightMm}
            height={heightMm - c.topMm - c.bottomMm}
            fill={isLight ? '#E7F2E5' : 'rgba(16,185,129,0.12)'}
            stroke="#16A34A"
            strokeWidth={0.45}
          />
          <g fontFamily="ui-monospace, monospace" fontSize={4.2} fontWeight={700} fill={text}>
            <text x={widthMm / 2} y={-4} textAnchor="middle">{label(c.topMm)}</text>
            <text x={widthMm / 2} y={heightMm + 8} textAnchor="middle">{label(c.bottomMm)}</text>
            <text x={-3} y={heightMm / 2 + 1.5} textAnchor="end">{label(c.leftMm)}</text>
            <text x={widthMm + 3} y={heightMm / 2 + 1.5} textAnchor="start">{label(c.rightMm)}</text>
          </g>
        </svg>

        <dl className="grid grid-cols-3 gap-x-4 gap-y-4">
          {rows.map(([name, value, highlight]) => (
            <div key={name}>
              <dt className={`font-mono text-[9px] uppercase tracking-[0.16em] ${muted}`}>{name}</dt>
              <dd className={`font-mono text-sm sm:text-base font-bold ${highlight ? amber : strong}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className={`mt-4 text-xs leading-relaxed ${muted}`}>
        {es
          ? 'El ancho del marco impreso en cada lado, medido en el escaneo. Manda el eje más descentrado (en ámbar).'
          : 'The width of the printed border on each side, measured on the scan. The most off-centre axis decides (in amber).'}
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Esquinas
// ---------------------------------------------------------------------------

const Corners: React.FC<BlockProps & { face: ScanFace; images: Partial<Record<CornerPosition, string>> }> = ({ face, images, lang, isLight, kicker }) => {
  const es = lang === 'es';
  if (face.corners.length === 0) return null;
  const muted = isLight ? 'text-gray-600' : 'text-gray-400';
  const strong = isLight ? 'text-gray-950' : 'text-white';
  const rule = isLight ? 'border-gray-200' : 'border-white/10';
  const head = `py-2 pr-3 font-mono text-[9px] uppercase tracking-[0.14em] font-bold text-left ${muted}`;
  const cell = `py-2.5 pr-3 font-mono text-xs sm:text-sm ${strong}`;

  return (
    <div>
      <BlockTitle title={es ? 'Esquinas' : 'Corners'} score={face.cornersScore} kicker={kicker} isLight={isLight} lang={lang} />
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {face.corners.map((corner) => (
          <li key={corner.position} className="min-w-0">
            {images[corner.position] ? (
              <img
                src={images[corner.position]}
                alt={`${es ? 'Esquina' : 'Corner'} ${CORNER_LABEL[corner.position][lang].toLowerCase()}`}
                className={`block w-full aspect-square object-cover border ${rule}`}
                loading="lazy"
              />
            ) : (
              <div className={`w-full aspect-square border ${rule} ${isLight ? 'bg-gray-100' : 'bg-white/[0.03]'}`} />
            )}
            <div className="flex items-baseline justify-between gap-2 mt-1.5">
              <span className={`text-[11px] sm:text-xs truncate ${muted}`}>{CORNER_LABEL[corner.position][lang]}</span>
              <span className={`font-display font-black text-lg leading-none ${strong}`}>{formatGrade(corner.score)}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className={`border-b ${rule}`}>
              <th className={head}>{es ? 'Esquina' : 'Corner'}</th>
              <th className={head}>{es ? 'Radio' : 'Radius'}</th>
              <th className={head}>{es ? 'Mordisco' : 'Bite'}</th>
              <th className={head}>{es ? 'Medida' : 'Shape'}</th>
              <th className={head}>{es ? 'Estado' : 'Condition'}</th>
              <th className={head}>{es ? 'Nota' : 'Grade'}</th>
            </tr>
          </thead>
          <tbody>
            {face.corners.map((corner) => (
              <tr key={corner.position} className={`border-b last:border-b-0 ${rule}`}>
                <td className={`${cell} font-sans`}>{CORNER_LABEL[corner.position][lang]}</td>
                <td className={cell}>{corner.radiusMm !== null ? `${mm(corner.radiusMm, lang)} mm` : '—'}</td>
                <td className={cell}>{corner.biteRemoved ? (es ? 'quitado' : 'removed') : corner.biteUm !== null ? `${corner.biteUm} µm` : '—'}</td>
                <td className={cell}>{corner.measure ?? '—'}</td>
                <td className={cell}>{corner.condition ?? '—'}</td>
                <td className={`${cell} font-black`}>{formatGrade(corner.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`mt-4 text-xs leading-relaxed ${muted}`}>
        {es
          ? 'Radio: el del arco que mejor encaja con el contorno. Mordisco: lo más hondo que se mete el contorno. Medida: la forma frente a una esquina perfecta. Estado: 10 sin daños. Cada esquina es la media de su medida y su estado.'
          : 'Radius: the arc that best fits the outline. Bite: the deepest point where the outline cuts in. Shape: compared with a perfect corner. Condition: 10 with no damage. Each corner is the average of its shape and its condition.'}
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Daños
// ---------------------------------------------------------------------------

const Damages: React.FC<BlockProps & { face: ScanFace }> = ({ face, lang, isLight, kicker }) => {
  const es = lang === 'es';
  const muted = isLight ? 'text-gray-600' : 'text-gray-400';
  const strong = isLight ? 'text-gray-950' : 'text-white';
  const groups = (['edges', 'surface', 'corners'] as const)
    .map((area) => ({ area, items: face.damages.filter((d) => d.area === area) }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <BlockTitle title={es ? `Daños (${face.damages.length})` : `Damage (${face.damages.length})`} kicker={kicker} isLight={isLight} lang={lang} />
      {groups.length === 0 ? (
        <p className={`text-sm ${muted}`}>{es ? 'El escáner no encontró daños en esta cara.' : 'The scanner found no damage on this side.'}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {groups.map(({ area, items }) => (
            <div key={area}>
              <h4 className={`font-mono text-[10px] uppercase tracking-[0.16em] font-bold mb-2 ${strong}`}>{AREA_LABEL[area][lang]}</h4>
              <ol className="space-y-2">
                {items.map((d) => (
                  <li key={d.n} className="flex items-start gap-2.5">
                    <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold">
                      {d.n}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm ${strong}`}>
                        {translate(d.kind, KIND_EN, lang)}
                        {d.size && <span className={muted}>, {SIZE_LABEL[d.size][lang]}</span>}
                      </span>
                      {(d.location || d.lengthMm !== null) && (
                        <span className={`block text-xs ${muted}`}>
                          {[d.location ? translate(d.location, LOCATION_EN, lang) : null, d.lengthMm !== null ? `${mm(d.lengthMm, lang, 1)} mm` : null].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
      {groups.length > 0 && (
        <p className={`mt-4 text-xs leading-relaxed ${muted}`}>
          {es
            ? 'Cada número es el mismo que en el mapa de defectos de arriba. En esquinas solo se listan los daños que bajan su estado; en bordes y superficie, los que cuentan en su nota.'
            : 'Each number matches the defect map above. Corners list only the damage that lowers their condition; edges and surface, what counts towards their grade.'}
        </p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Nota final
// ---------------------------------------------------------------------------

const FinalGrade: React.FC<BlockProps & { scan: PublicScanReport }> = ({ scan, lang, isLight, kicker }) => {
  const es = lang === 'es';
  const muted = isLight ? 'text-gray-600' : 'text-gray-400';
  const strong = isLight ? 'text-gray-950' : 'text-white';
  const rule = isLight ? 'border-gray-200' : 'border-white/10';
  const { subgrades: s } = scan;
  // Nombre, nota y cómo se dice que esa parte "tiene" la nota.
  const parts: [string, number, string][] = [
    [es ? 'centrado' : 'centering', s.centering.score, es ? 'el centrado tiene' : 'centering has'],
    [es ? 'esquinas' : 'corners', s.corners.score, es ? 'las esquinas tienen' : 'corners have'],
    [es ? 'bordes' : 'edges', s.edges.score, es ? 'los bordes tienen' : 'edges have'],
    [es ? 'superficie' : 'surface', s.surface.score, es ? 'la superficie tiene' : 'surface has'],
  ];
  const lowest = parts.reduce((a, b) => (b[1] < a[1] ? b : a));
  const average = scan.average.toLocaleString(es ? 'es-ES' : 'en-GB', { maximumFractionDigits: 2 });
  // Si la nota es la peor subnota más 2 y queda por debajo de la media, es que la peor parte la ha limitado.
  const capped = scan.final === lowest[1] + 2 && scan.final < Math.round(scan.average);

  return (
    <div>
      <BlockTitle title={es ? 'Cómo sale la nota final' : 'How the final grade is reached'} score={scan.final} kicker={kicker} isLight={isLight} lang={lang} />
      <p className={`text-sm leading-relaxed ${strong}`}>
        {es ? 'Media de ' : 'Average of '}
        {parts.map(([name, score], i) => (
          <React.Fragment key={name}>
            {i > 0 && (i === parts.length - 1 ? (es ? ' y ' : ' and ') : ', ')}
            {name} <strong>{formatGrade(score)}</strong>
          </React.Fragment>
        ))}
        {': '}
        <strong>{average}</strong>
        {es ? ', a la nota más cercana.' : ', to the nearest grade.'}
        {capped && (
          es
            ? <> Pero se queda en <strong>{formatGrade(scan.final)}</strong>: {lowest[2]} {formatGrade(lowest[1])}, y la nota final no puede pasar de 2 puntos por encima de su peor parte.</>
            : <> But it stays at <strong>{formatGrade(scan.final)}</strong>: {lowest[2]} {formatGrade(lowest[1])}, and the final grade cannot be more than 2 points above its weakest part.</>
        )}
      </p>
      {scan.method && (
        <details className={`mt-4 border-t pt-3 ${rule}`}>
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] font-bold text-emerald-600 dark:text-emerald-400">
            {es ? 'Criterios completos del escáner' : 'Full scanner criteria'}
          </summary>
          {!es && <p className={`mt-2 text-xs italic ${muted}`}>As written in the scanner report (in Spanish):</p>}
          <p className={`mt-2 text-xs leading-relaxed ${muted}`} lang="es">{scan.method}</p>
        </details>
      )}
    </div>
  );
};

/** Solo las esquinas del informe (recortes ampliados, nota y tabla), para el verificador. */
export const ScanCorners: React.FC<{ scan: PublicScanReport }> = ({ scan }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const lang: Lang = language === 'es' ? 'es' : 'en';
  const kicker = `font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-bold ${isLight ? 'text-gray-500' : 'text-gray-400'}`;
  const faces = scan.faces.filter((f) => f.corners.length > 0);
  if (faces.length === 0) return null;
  return (
    <div className="space-y-6">
      {faces.map((face) => (
        <div key={face.side}>
          {faces.length > 1 && <p className={`${kicker} mb-2`}>{SIDE_LABEL[face.side][lang]}</p>}
          <Corners face={face} images={scan.images.corners[face.side] ?? {}} lang={lang} isLight={isLight} kicker={kicker} />
        </div>
      ))}
    </div>
  );
};
