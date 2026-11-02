import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import type { CardDefect } from '../../types';
import type { PublicCertificate } from '../../api/certificates';
import type { CornerPosition, MarginsMm, ScanCornerDto } from '../../../shared/scan-report';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { cardYear } from '../../utils/cardDisplay';

/**
 * Informe de gradeo: la hoja con el resultado de una carta. Sigue el orden de un informe de laboratorio
 * (identidad, nota y subnotas, defectos por cara, centrado, esquinas, detalle) y solo muestra lo que el
 * laboratorio o el escáner registraron: lo que no se midió se omite o se deja con un guion, nunca se inventa.
 */

type Side = 'front' | 'back';
type Category = CardDefect['category'];

const CATEGORY_ORDER: Category[] = ['Centering', 'Corners', 'Edges', 'Surface'];
const CATEGORY_LABEL: Record<Category, { es: string; en: string }> = {
  Centering: { es: 'Centrado', en: 'Centering' },
  Corners: { es: 'Esquinas', en: 'Corners' },
  Edges: { es: 'Bordes', en: 'Edges' },
  Surface: { es: 'Superficie', en: 'Surface' },
};
const SEVERITY_LABEL: Record<CardDefect['severity'], { es: string; en: string }> = {
  flawless: { es: 'Sin defecto', en: 'Flawless' },
  minor: { es: 'Leve', en: 'Minor' },
  moderate: { es: 'Moderado', en: 'Moderate' },
  critical: { es: 'Grave', en: 'Critical' },
};
const CORNER_ORDER: CornerPosition[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
const CORNER_LABEL: Record<CornerPosition, { es: string; en: string }> = {
  topLeft: { es: 'Superior izquierda', en: 'Top left' },
  topRight: { es: 'Superior derecha', en: 'Top right' },
  bottomLeft: { es: 'Inferior izquierda', en: 'Bottom left' },
  bottomRight: { es: 'Inferior derecha', en: 'Bottom right' },
};

/** Los datos antiguos no indican la cara: se toma el anverso. */
const sideOf = (d: CardDefect): Side => d.side ?? 'front';

/** "199157603" → "199 157 603". */
const groupDigits = (value: string) => (/^\d{9}$/.test(value) ? value.replace(/(\d{3})(?=\d)/g, '$1 ') : value);

/** Saca los dos repartos "52/48" de un texto como "52/48 L/R, 50/50 T/B". */
function parseRatios(text: string | undefined): { lr: [number, number] | null; tb: [number, number] | null } {
  const pairs = [...(text ?? '').matchAll(/(\d{1,3}(?:[.,]\d)?)\s*\/\s*(\d{1,3}(?:[.,]\d)?)/g)]
    .map((m) => [parseFloat(m[1].replace(',', '.')), parseFloat(m[2].replace(',', '.'))] as [number, number])
    .filter(([a, b]) => a + b > 95 && a + b < 105);
  return { lr: pairs[0] ?? null, tb: pairs[1] ?? null };
}

/** Reparto en porcentaje a partir de dos distancias: 2,47 y 2,48 → [50, 50]. */
const split = (a: number, b: number): [number, number] => {
  const total = a + b;
  if (total <= 0) return [50, 50];
  const first = Math.round((a / total) * 100);
  return [first, 100 - first];
};

const fmt = (n: number) => n.toFixed(1);

interface GradingReportProps {
  card: PublicCertificate;
  onNavigate: (path: string) => void;
}

export const GradingReport: React.FC<GradingReportProps> = ({ card, onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const lang = language === 'es' ? 'es' : 'en';
  const es = lang === 'es';
  const [active, setActive] = useState<string | null>(null);
  const scan = card.scan ?? null;

  const mm = (n: number) => `${n.toLocaleString(es ? 'es-ES' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mm`;
  const um = (n: number) => `${n.toLocaleString(es ? 'es-ES' : 'en-GB', { maximumFractionDigits: 0 })} µm`;

  // Colores de la hoja. Van en línea porque el modo claro de la web redefine varias clases de color.
  const c = isLight
    ? { sheet: '#FFFFFF', edge: '#E2DBD0', text: '#14170F', muted: '#5B6258', rule: '#E6E0D3', band: '#EAF4EC', green: '#15803D', soft: '#F6F3EC', head: '#F1EDE3' }
    : { sheet: '#0F130F', edge: 'rgba(255,255,255,0.12)', text: '#FFFFFF', muted: '#A4ACA1', rule: 'rgba(255,255,255,0.12)', band: '#14231A', green: '#4ADE80', soft: '#161B16', head: '#161B16' };
  type Palette = typeof c;

  const frontMargins = scan?.margins.front ?? null;
  const ratios = frontMargins
    ? { lr: split(frontMargins.left, frontMargins.right), tb: split(frontMargins.top, frontMargins.bottom) }
    : parseRatios(card.subgrades.centering.frontRatio);

  const corners = useMemo(
    () => CORNER_ORDER.map((p) => scan?.corners.find((x) => x.position === p)).filter((x): x is ScanCornerDto => !!x),
    [scan],
  );

  const defectsBySide = useMemo(() => {
    const result: Record<Side, { defect: CardDefect; n: number }[]> = { front: [], back: [] };
    for (const side of ['front', 'back'] as const) {
      const list = card.defects
        .filter((d) => sideOf(d) === side)
        .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
      result[side] = list.map((defect, i) => ({ defect, n: i + 1 }));
    }
    return result;
  }, [card.defects]);

  const defectCount = (category: Category) => card.defects.filter((d) => d.category === category).length;
  const countText = (category: Category) => {
    const n = defectCount(category);
    if (n === 0) return es ? 'Sin defectos' : 'No defects';
    return es ? `${n} ${n === 1 ? 'defecto' : 'defectos'}` : `${n} ${n === 1 ? 'defect' : 'defects'}`;
  };

  const ledger: { key: Category; score: number }[] = [
    { key: 'Centering', score: card.subgrades.centering.score },
    { key: 'Corners', score: card.subgrades.corners.score },
    { key: 'Edges', score: card.subgrades.edges.score },
    { key: 'Surface', score: card.subgrades.surface.score },
  ];

  const sides: Side[] = (['front', 'back'] as const).filter(
    (s) => (s === 'front' ? !!card.frontImage : !!card.backImage) || defectsBySide[s].length > 0,
  );

  const meta = [
    card.game ? (card.language ? `${card.game} (${card.language})` : card.game) : null,
    card.set || null,
    card.cardNumber ? `#${card.cardNumber}` : null,
    cardYear(card.year),
    card.rarity || null,
  ].filter((part): part is string => !!part);

  // Datos técnicos del escaneo, en una sola línea bajo el título, como en un informe de laboratorio.
  const specs = [
    scan?.dpi ? `${scan.dpi} ppp` : null,
    scan?.widthMm && scan?.heightMm ? `${mm(scan.widthMm).replace(' mm', '')} × ${mm(scan.heightMm).replace(' mm', '')} mm` : null,
    scan ? (scan.sides === 'front' ? (es ? 'solo anverso' : 'front only') : (es ? 'ambas caras' : 'both sides')) : null,
    `${es ? 'emitida el' : 'issued'} ${card.certDate}`,
  ].filter((part): part is string => !!part);

  const sideSubgrades = (side: Side) => {
    const key = side === 'front' ? 'frontScore' : 'backScore';
    return (['corners', 'edges', 'surface'] as const)
      .map((area) => ({ area, value: card.subgrades[area][key] }))
      .filter((x) => x.value > 0);
  };

  const th = 'px-3 py-2 text-left font-bold text-[10.5px] uppercase tracking-[0.08em] whitespace-nowrap';
  const td = 'px-3 py-2.5 align-top';
  const sectionTitle = "font-['Nunito',sans-serif] font-[900] text-xl";

  const cornerHasMeasures = corners.some((x) => x.radiusMm !== null || x.biteUm !== null || x.measureScore !== null || x.conditionScore !== null);

  return (
    <article
      className="w-full overflow-hidden border shadow-[0_12px_32px_rgba(0,0,0,0.10)]"
      style={{ background: c.sheet, borderColor: c.edge, color: c.text }}
      aria-label={es ? `Informe de gradeo del certificado ${card.certNumber}` : `Grading report for certificate ${card.certNumber}`}
    >
      {/* Cabecera del informe: identidad del laboratorio y número de certificado */}
      <header className="flex items-center justify-between gap-4 px-5 sm:px-8 py-4" style={{ background: '#0B0E0B', borderBottom: '3px solid #48C765' }}>
        <div className="flex items-center gap-3 min-w-0">
          <img src="/brand/logo-green.png" alt="" aria-hidden="true" className="h-10 w-auto object-contain shrink-0" />
          <div className="leading-none">
            <div className="font-['Nunito',sans-serif] font-[900] text-lg sm:text-xl tracking-wide text-white">GORILLA</div>
            <div className="mt-1 text-[9px] sm:text-[10px] font-bold tracking-[0.34em]" style={{ color: '#48C765' }}>GRADING</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase" style={{ color: '#9AA79A' }}>
            {es ? 'Informe de gradeo' : 'Grading report'}
          </div>
          <div className="mt-0.5 font-mono tabular-nums text-xl sm:text-2xl font-bold tracking-wide text-white">{groupDigits(card.certNumber)}</div>
        </div>
      </header>

      <div className="px-5 sm:px-8 py-7 sm:py-9 space-y-10 sm:space-y-12">
        {/* Identidad de la carta */}
        <section>
          <h1 className="font-['Nunito',sans-serif] font-[900] text-3xl sm:text-4xl leading-tight break-words" style={{ color: c.text }}>
            {card.name || (es ? 'Carta sin nombre' : 'Unnamed card')}
          </h1>
          {meta.length > 0 && (
            <p className="mt-1.5 text-sm" style={{ color: c.muted }}>
              {meta.join('  ·  ')}
            </p>
          )}
          <p className="mt-1 text-xs tabular-nums" style={{ color: c.muted }}>
            {specs.join('  ·  ')}
            {card.verifier ? `  ·  ${es ? 'verificado por' : 'verified by'} ${card.verifier}` : ''}
          </p>
        </section>

        {/* Resumen: escaneo, centrado y nota */}
        <section className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] xl:grid-cols-[170px_minmax(220px,260px)_minmax(0,1fr)] gap-6 xl:gap-9 items-start">
          <figure className="w-[160px] sm:w-[170px]">
            <div className="border p-1" style={{ borderColor: c.edge, background: c.soft }}>
              {card.frontImage ? (
                <img src={card.frontImage} alt={card.name} className="block w-full h-auto" draggable={false} />
              ) : (
                <div className="aspect-[5/7] flex items-center justify-center text-[11px] text-center px-2" style={{ color: c.muted }}>
                  {es ? 'Sin foto' : 'No photo'}
                </div>
              )}
            </div>
            <figcaption className="mt-1.5 text-center text-[11px]" style={{ color: c.muted }}>
              {es ? 'Anverso' : 'Front'}
            </figcaption>
          </figure>

          <CenteringDiagram
            ratios={ratios}
            margins={frontMargins}
            corners={corners}
            text={card.subgrades.centering.frontRatio}
            es={es}
            c={c}
            mm={mm}
          />

          {/* Nota final y subnotas */}
          <div className="border md:col-span-2 xl:col-span-1" style={{ borderColor: c.edge }}>
            <div className="flex items-end justify-between gap-4 px-5 py-4" style={{ background: c.band }}>
              <div>
                <div className="text-sm font-bold" style={{ color: c.text }}>{es ? 'Nota final' : 'Final grade'}</div>
                <div className="text-xs" style={{ color: c.muted }}>{card.gradeLabel}</div>
              </div>
              <div className="font-['Nunito',sans-serif] font-[900] leading-none tabular-nums text-6xl" style={{ color: c.green }}>
                {card.grade % 1 === 0 ? card.grade : fmt(card.grade)}
              </div>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {ledger.map(({ key, score }) => (
                  <tr key={key} className="border-t" style={{ borderColor: c.rule }}>
                    <th scope="row" className="px-5 py-3 text-left font-normal" style={{ color: c.muted }}>
                      <span className="block" style={{ color: c.text }}>{CATEGORY_LABEL[key][lang]}</span>
                      <span className="block text-[11px]">{countText(key)}</span>
                    </th>
                    <td className="px-5 py-3 text-right font-['Nunito',sans-serif] font-[900] text-2xl tabular-nums" style={{ color: c.text }}>
                      {fmt(score)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t text-xs" style={{ borderColor: c.rule }}>
              <button type="button" onClick={() => onNavigate('/grading-scale')} className="underline underline-offset-4 cursor-pointer font-semibold" style={{ color: c.green }}>
                {es ? 'Cómo se calcula la nota' : 'How the grade is calculated'}
              </button>
            </div>
          </div>
        </section>

        {/* Una sección por cara: mapa de defectos y su lista */}
        {sides.map((side) => {
          const list = defectsBySide[side];
          const image = side === 'front' ? card.frontImage : card.backImage;
          const faceScores = sideSubgrades(side);
          const groups = CATEGORY_ORDER.map((category) => ({ category, items: list.filter((x) => x.defect.category === category) })).filter((g) => g.items.length > 0);
          return (
            <section key={side} aria-label={side === 'front' ? (es ? 'Anverso' : 'Front') : (es ? 'Reverso' : 'Back')}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pb-2 border-b" style={{ borderColor: c.rule }}>
                <h2 className={sectionTitle} style={{ color: c.text }}>
                  {side === 'front' ? (es ? 'Anverso' : 'Front') : (es ? 'Reverso' : 'Back')}
                </h2>
                {faceScores.length > 0 && (
                  <p className="text-xs tabular-nums" style={{ color: c.muted }}>
                    {faceScores.map(({ area, value }) => `${CATEGORY_LABEL[area === 'corners' ? 'Corners' : area === 'edges' ? 'Edges' : 'Surface'][lang]} ${fmt(value)}`).join('  ·  ')}
                  </p>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] gap-6 md:gap-9 items-start">
                <div className="w-[210px] sm:w-[240px] border p-1.5 mx-auto md:mx-0" style={{ borderColor: c.edge, background: c.soft }}>
                  {image ? (
                    <div className="relative">
                      <img src={image} alt={card.name} className="block w-full h-auto select-none" draggable={false} />
                      {list.map(({ defect, n }) => {
                        const on = active === defect.id;
                        return (
                          <button
                            key={defect.id}
                            type="button"
                            onMouseEnter={() => setActive(defect.id)}
                            onMouseLeave={() => setActive(null)}
                            onFocus={() => setActive(defect.id)}
                            onBlur={() => setActive(null)}
                            aria-label={`${n}. ${defect.title}`}
                            className="absolute flex items-center justify-center rounded-full text-white font-bold tabular-nums cursor-pointer transition-transform"
                            style={{
                              left: `${defect.x}%`,
                              top: `${defect.y}%`,
                              width: 20,
                              height: 20,
                              fontSize: 10,
                              background: '#DC2626',
                              border: '1.5px solid #FFFFFF',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.45)',
                              transform: `translate(-50%, -50%) scale(${on ? 1.3 : 1})`,
                            }}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="aspect-[5/7] flex items-center justify-center text-[11px]" style={{ color: c.muted }}>{es ? 'Sin foto' : 'No photo'}</div>
                  )}
                </div>

                {groups.length > 0 ? (
                  <div className="lg:columns-2 lg:gap-10">
                    {groups.map(({ category, items }) => (
                      <div key={category} className="break-inside-avoid mb-5">
                        <h3 className="text-xs font-bold mb-2" style={{ color: c.text }}>{CATEGORY_LABEL[category][lang]}</h3>
                        <ol className="space-y-2.5">
                          {items.map(({ defect, n }) => {
                            const on = active === defect.id;
                            return (
                              <li
                                key={defect.id}
                                onMouseEnter={() => setActive(defect.id)}
                                onMouseLeave={() => setActive(null)}
                                className="flex gap-2.5 text-[13px] leading-snug -mx-1.5 px-1.5 py-1 transition-colors"
                                style={{ background: on ? c.soft : 'transparent' }}
                              >
                                <span className="mt-px w-[18px] h-[18px] shrink-0 rounded-full text-white text-[10px] font-bold tabular-nums flex items-center justify-center" style={{ background: '#DC2626' }}>
                                  {n}
                                </span>
                                <span className="min-w-0">
                                  <span className="font-semibold" style={{ color: c.text }}>{defect.title}</span>
                                  <span className="block text-[11px]" style={{ color: c.muted }}>
                                    {SEVERITY_LABEL[defect.severity][lang]}
                                    {defect.deduction > 0 ? ` · −${fmt(defect.deduction)}` : ''}
                                  </span>
                                  {defect.description && <span className="block text-[12px] mt-0.5" style={{ color: c.muted }}>{defect.description}</span>}
                                </span>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="flex items-start gap-2 text-sm" style={{ color: c.muted }}>
                    <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: c.green }} aria-hidden="true" />
                    {es
                      ? `El laboratorio revisó ${side === 'front' ? 'el anverso' : 'el reverso'} y no marcó ningún defecto.`
                      : `The laboratory reviewed the ${side === 'front' ? 'front' : 'back'} and marked no defects.`}
                  </p>
                )}
              </div>
            </section>
          );
        })}

        {/* Centrado medido */}
        {frontMargins && (
          <section>
            <div className="flex items-baseline justify-between gap-4 pb-2 border-b" style={{ borderColor: c.rule }}>
              <h2 className={sectionTitle}>{CATEGORY_LABEL.Centering[lang]}</h2>
              <p className="text-xs tabular-nums" style={{ color: c.muted }}>{es ? 'nota' : 'grade'} {fmt(card.subgrades.centering.score)}</p>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-[13px] min-w-[640px] tabular-nums">
                <thead style={{ background: c.head, color: c.muted }}>
                  <tr>
                    <th className={th}>{es ? 'Izquierda' : 'Left'}</th>
                    <th className={th}>{es ? 'Derecha' : 'Right'}</th>
                    <th className={th}>{es ? 'Izq. / dcha.' : 'L / R'}</th>
                    <th className={th}>{es ? 'Arriba' : 'Top'}</th>
                    <th className={th}>{es ? 'Abajo' : 'Bottom'}</th>
                    <th className={th}>{es ? 'Arriba / abajo' : 'T / B'}</th>
                    <th className={`${th} text-right`}>{es ? 'Nota' : 'Grade'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b" style={{ borderColor: c.rule }}>
                    <td className={td}>{mm(frontMargins.left)}</td>
                    <td className={td}>{mm(frontMargins.right)}</td>
                    <td className={`${td} font-bold`}>{ratios.lr ? `${ratios.lr[0]}/${ratios.lr[1]}` : '—'}</td>
                    <td className={td}>{mm(frontMargins.top)}</td>
                    <td className={td}>{mm(frontMargins.bottom)}</td>
                    <td className={`${td} font-bold`}>{ratios.tb ? `${ratios.tb[0]}/${ratios.tb[1]}` : '—'}</td>
                    <td className={`${td} text-right font-bold`}>{fmt(card.subgrades.centering.score)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Esquinas ampliadas y medidas */}
        {corners.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between gap-4 pb-2 border-b" style={{ borderColor: c.rule }}>
              <h2 className={sectionTitle}>{CATEGORY_LABEL.Corners[lang]}</h2>
              <p className="text-xs tabular-nums" style={{ color: c.muted }}>{es ? 'nota' : 'grade'} {fmt(card.subgrades.corners.score)}</p>
            </div>

            {corners.some((x) => x.image) && (
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {corners.map((x) => (
                  <figure key={x.position}>
                    <div className="aspect-square overflow-hidden border" style={{ borderColor: c.edge, background: c.soft }}>
                      {x.image ? (
                        <img src={x.image} alt={CORNER_LABEL[x.position][lang]} className="w-full h-full object-cover" draggable={false} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px]" style={{ color: c.muted }}>{es ? 'Sin recorte' : 'No crop'}</div>
                      )}
                    </div>
                    <figcaption className="mt-1.5 flex items-baseline justify-between gap-2 text-[12px]">
                      <span style={{ color: c.muted }}>{CORNER_LABEL[x.position][lang]}</span>
                      <span className="font-['Nunito',sans-serif] font-[900] text-lg tabular-nums" style={{ color: c.text }}>{fmt(x.score)}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-[13px] min-w-[520px] tabular-nums">
                <thead style={{ background: c.head, color: c.muted }}>
                  <tr>
                    <th className={th}>{es ? 'Esquina' : 'Corner'}</th>
                    {cornerHasMeasures && <th className={th}>{es ? 'Radio' : 'Radius'}</th>}
                    {cornerHasMeasures && <th className={th}>{es ? 'Mordisco' : 'Bite'}</th>}
                    {cornerHasMeasures && <th className={th}>{es ? 'Medida' : 'Measure'}</th>}
                    {cornerHasMeasures && <th className={th}>{es ? 'Estado' : 'Condition'}</th>}
                    <th className={`${th} text-right`}>{es ? 'Nota' : 'Grade'}</th>
                  </tr>
                </thead>
                <tbody>
                  {corners.map((x) => (
                    <tr key={x.position} className="border-b" style={{ borderColor: c.rule }}>
                      <th scope="row" className={`${td} text-left font-semibold`}>{CORNER_LABEL[x.position][lang]}</th>
                      {cornerHasMeasures && <td className={td}>{x.radiusMm !== null ? mm(x.radiusMm) : '—'}</td>}
                      {cornerHasMeasures && <td className={td}>{x.biteUm !== null ? um(x.biteUm) : '—'}</td>}
                      {cornerHasMeasures && <td className={td}>{x.measureScore !== null ? fmt(x.measureScore) : '—'}</td>}
                      {cornerHasMeasures && <td className={td}>{x.conditionScore !== null ? fmt(x.conditionScore) : '—'}</td>}
                      <td className={`${td} text-right font-bold`}>{fmt(x.score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Detalle de las subnotas */}
        <section>
          <h2 className={`${sectionTitle} pb-2 border-b`} style={{ color: c.text, borderColor: c.rule }}>
            {es ? 'Detalle de las subnotas' : 'Subgrade detail'}
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[13px] min-w-[560px]">
              <thead style={{ background: c.head, color: c.muted }}>
                <tr>
                  <th className={th}>{es ? 'Área' : 'Area'}</th>
                  <th className={th}>{es ? 'Anverso' : 'Front'}</th>
                  <th className={th}>{es ? 'Reverso' : 'Back'}</th>
                  <th className={`${th} text-right`}>{es ? 'Nota' : 'Grade'}</th>
                  <th className={th}>{es ? 'Observaciones' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                <tr className="border-b" style={{ borderColor: c.rule }}>
                  <th scope="row" className={`${td} text-left font-semibold`}>{CATEGORY_LABEL.Centering[lang]}</th>
                  <td className={td}>{card.subgrades.centering.frontRatio || '—'}</td>
                  <td className={td}>{card.subgrades.centering.backRatio || '—'}</td>
                  <td className={`${td} text-right font-bold`}>{fmt(card.subgrades.centering.score)}</td>
                  <td className={td} style={{ color: c.muted }}>{card.subgrades.centering.description || '—'}</td>
                </tr>
                {(['corners', 'edges', 'surface'] as const).map((area) => {
                  const s = card.subgrades[area];
                  const label = CATEGORY_LABEL[area === 'corners' ? 'Corners' : area === 'edges' ? 'Edges' : 'Surface'][lang];
                  return (
                    <tr key={area} className="border-b" style={{ borderColor: c.rule }}>
                      <th scope="row" className={`${td} text-left font-semibold`}>{label}</th>
                      <td className={td}>{s.frontScore > 0 ? fmt(s.frontScore) : '—'}</td>
                      <td className={td}>{s.backScore > 0 ? fmt(s.backScore) : '—'}</td>
                      <td className={`${td} text-right font-bold`}>{fmt(s.score)}</td>
                      <td className={td} style={{ color: c.muted }}>{s.description || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Observaciones y cómo leer el informe */}
        <section className="space-y-3 text-[12px] leading-relaxed max-w-3xl" style={{ color: c.muted }}>
          {scan?.notes && (
            <div>
              <h2 className="text-sm font-bold" style={{ color: c.text }}>{es ? 'Observaciones del laboratorio' : 'Laboratory notes'}</h2>
              <p className="mt-1">{scan.notes}</p>
            </div>
          )}
          <p>
            {es
              ? 'Cómo leer este informe: el dibujo del centrado muestra cómo cae la imagen dentro del marco de la carta, y las cifras son la distancia a cada borde. En la carta, cada círculo rojo marca un defecto con el número de su lista. La nota final se calcula con la regla publicada en «Cómo se calcula la nota».'
              : 'How to read this report: the centering drawing shows how the image sits inside the card frame, and the figures are the distance to each edge. On the card, each red circle marks a defect with the number from its list. The final grade follows the rule published in “How the grade is calculated”.'}
          </p>
        </section>

        {/* Firma del registro */}
        <section className="pt-5 border-t text-xs leading-relaxed" style={{ borderColor: c.rule, color: c.muted }}>
          <h2 className="text-sm font-bold" style={{ color: c.text }}>
            {card.signature ? (es ? 'Firma digital del registro' : 'Digital signature of the record') : (es ? 'Registro de certificación' : 'Certification record')}
          </h2>
          <p className="mt-1 max-w-3xl">
            {card.signature
              ? (es
                  ? 'El registro de este certificado está firmado con Ed25519. Cualquiera puede comprobar la firma con la clave pública del laboratorio.'
                  : 'The record of this certificate is signed with Ed25519. Anyone can check the signature with the laboratory public key.')
              : (es
                  ? 'Este certificado figura en el registro público de Gorilla Grading. Todavía no incluye firma digital.'
                  : 'This certificate is listed in the Gorilla Grading public registry. It does not include a digital signature yet.')}
          </p>
          {card.signature && (
            <p className="mt-2 p-3 font-mono text-[10px] break-all" style={{ background: c.soft }}>
              ED25519: {card.signature}
              {card.keyId && <span className="block mt-1 opacity-75">KEY: {card.keyId}</span>}
            </p>
          )}
          <p className="mt-4 tabular-nums">
            {es ? 'Certificado' : 'Certificate'} {groupDigits(card.certNumber)} · {es ? 'notas emitidas el' : 'grades issued'} {card.certDate}
            {scan?.criteriaVersion ? ` ${es ? 'con los criterios' : 'under criteria'} ${scan.criteriaVersion}` : ''}. {es ? 'Son definitivas.' : 'They are final.'}
          </p>
        </section>
      </div>
    </article>
  );
};

/**
 * Dibujo del centrado: el marco de la carta y dónde cae la imagen dentro de él. Con medidas en milímetros
 * se rotula cada lado y se marca la nota de cada esquina; sin ellas solo se dibuja el reparto.
 */
const CenteringDiagram: React.FC<{
  ratios: { lr: [number, number] | null; tb: [number, number] | null };
  margins: MarginsMm | null;
  corners: ScanCornerDto[];
  text: string | undefined;
  es: boolean;
  c: { edge: string; text: string; muted: string; green: string; soft: string };
  mm: (n: number) => string;
}> = ({ ratios, margins, corners, text, es, c, mm }) => {
  if (!ratios.lr && !ratios.tb) {
    return text ? (
      <div className="min-w-0 text-sm">
        <div className="font-bold" style={{ color: c.text }}>{es ? 'Centrado' : 'Centering'}</div>
        <p className="mt-1" style={{ color: c.muted }}>{text}</p>
      </div>
    ) : null;
  }

  const W = 210;
  const H = 280;
  const pad = 30; // espacio fuera del marco para las cifras y las notas de las esquinas
  const cardW = W - pad * 2;
  const cardH = H - pad * 2;
  const margin = 24; // reparto del margen total entre los dos lados
  const [l, r] = ratios.lr ?? [50, 50];
  const [t, b] = ratios.tb ?? [50, 50];
  const left = pad + (margin * 2 * l) / (l + r);
  const top = pad + (margin * 2 * t) / (t + b);
  const innerW = cardW - margin * 2;
  const innerH = cardH - margin * 2;
  const cornerAt: Record<string, { x: number; y: number }> = {
    topLeft: { x: pad, y: pad },
    topRight: { x: pad + cardW, y: pad },
    bottomLeft: { x: pad, y: pad + cardH },
    bottomRight: { x: pad + cardW, y: pad + cardH },
  };

  return (
    <div className="min-w-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full max-w-[260px]" role="img" aria-label={es ? 'Dibujo del centrado' : 'Centering diagram'} fontFamily="'Nunito', sans-serif">
        <rect x={pad} y={pad} width={cardW} height={cardH} rx="5" fill="none" stroke={c.edge} strokeWidth="1.2" />
        <rect x={left} y={top} width={innerW} height={innerH} fill={c.soft} stroke={c.green} strokeWidth="1.6" />
        <line x1={left + innerW / 2} y1={top} x2={left + innerW / 2} y2={top + innerH} stroke={c.edge} strokeDasharray="3 3" />
        <line x1={left} y1={top + innerH / 2} x2={left + innerW} y2={top + innerH / 2} stroke={c.edge} strokeDasharray="3 3" />

        {margins && (
          <g fontSize="9.5" fontWeight="700" fill={c.text} textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <text x={W / 2} y={pad - 9}>{mm(margins.top).replace(' mm', '')}</text>
            <text x={W / 2} y={H - pad + 17}>{mm(margins.bottom).replace(' mm', '')}</text>
            <text x={pad - 6} y={H / 2 + 3} textAnchor="end">{mm(margins.left).replace(' mm', '')}</text>
            <text x={W - pad + 6} y={H / 2 + 3} textAnchor="start">{mm(margins.right).replace(' mm', '')}</text>
          </g>
        )}

        {corners.map((x) => {
          const at = cornerAt[x.position];
          const label = String(x.score % 1 === 0 ? x.score : x.score.toFixed(1));
          return (
            <g key={x.position}>
              <rect x={at.x - 10} y={at.y - 8} width="20" height="16" rx="2" fill={c.soft} stroke={c.edge} strokeWidth="1" />
              <text x={at.x} y={at.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="800" fill={c.text}>{label}</text>
            </g>
          );
        })}
      </svg>
      <dl className="mt-1 text-[11px] tabular-nums space-y-0.5" style={{ color: c.muted }}>
        {ratios.lr && (
          <div className="flex gap-2">
            <dt>{es ? 'Izq. / dcha.' : 'Left / right'}</dt>
            <dd className="font-bold" style={{ color: c.text }}>{ratios.lr[0]}/{ratios.lr[1]}</dd>
          </div>
        )}
        {ratios.tb && (
          <div className="flex gap-2">
            <dt>{es ? 'Arriba / abajo' : 'Top / bottom'}</dt>
            <dd className="font-bold" style={{ color: c.text }}>{ratios.tb[0]}/{ratios.tb[1]}</dd>
          </div>
        )}
      </dl>
    </div>
  );
};
