import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import type { CardDefect } from '../../types';
import type { PublicCertificate } from '../../api/certificates';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { cardYear } from '../../utils/cardDisplay';

/**
 * Informe de gradeo: la hoja con el resultado de una carta. Sigue el orden de un informe de laboratorio
 * (identidad, nota y subnotas, defectos por cara, detalle) y solo muestra lo que el laboratorio registró:
 * lo que no se midió se deja en blanco o con un guion, nunca se inventa.
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

/** Los datos antiguos no indican la cara: se toma el anverso. */
const sideOf = (d: CardDefect): Side => d.side ?? 'front';

/** "199157603" → "199 157 603". */
const groupDigits = (value: string) => (/^\d{9}$/.test(value) ? value.replace(/(\d{3})(?=\d)/g, '$1 ') : value);

/** Saca los dos reparto "52/48" de un texto como "52/48 L/R, 50/50 T/B". */
function parseRatios(text: string | undefined): { lr: [number, number] | null; tb: [number, number] | null } {
  const pairs = [...(text ?? '').matchAll(/(\d{1,3}(?:[.,]\d)?)\s*\/\s*(\d{1,3}(?:[.,]\d)?)/g)]
    .map((m) => [parseFloat(m[1].replace(',', '.')), parseFloat(m[2].replace(',', '.'))] as [number, number])
    .filter(([a, b]) => a + b > 95 && a + b < 105);
  return { lr: pairs[0] ?? null, tb: pairs[1] ?? null };
}

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

  // Colores de la hoja. Van en línea porque el modo claro de la web redefine varias clases de color.
  const c = isLight
    ? { sheet: '#FFFFFF', edge: '#E2DBD0', text: '#14170F', muted: '#5B6258', rule: '#E6E0D3', band: '#EAF4EC', green: '#15803D', soft: '#F6F3EC', red: '#DC2626' }
    : { sheet: '#0F130F', edge: 'rgba(255,255,255,0.12)', text: '#FFFFFF', muted: '#A4ACA1', rule: 'rgba(255,255,255,0.12)', band: '#14231A', green: '#4ADE80', soft: '#161B16', red: '#F87171' };

  const ratios = parseRatios(card.subgrades.centering.frontRatio);
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

  const sideSubgrades = (side: Side) => {
    const key = side === 'front' ? 'frontScore' : 'backScore';
    return (['corners', 'edges', 'surface'] as const)
      .map((area) => ({ area, value: card.subgrades[area][key] }))
      .filter((x) => x.value > 0);
  };

  const th = 'px-3 py-2 text-left font-bold text-[11px] uppercase tracking-wide';
  const td = 'px-3 py-2.5 align-top';

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

      <div className="px-5 sm:px-8 py-7 sm:py-9 space-y-9 sm:space-y-11">
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
            {es ? 'Emitido el' : 'Issued'} {card.certDate}
            {card.verifier ? ` · ${es ? 'Verificado por' : 'Verified by'} ${card.verifier}` : ''}
          </p>
        </section>

        {/* Resumen: foto, centrado y nota */}
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-7 lg:gap-10 items-start">
          <div className="flex flex-wrap sm:flex-nowrap items-start gap-5 sm:gap-6">
            <figure className="w-[150px] sm:w-[170px] shrink-0">
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

            <CenteringDiagram ratios={ratios} text={card.subgrades.centering.frontRatio} es={es} c={c} />
          </div>

          {/* Nota final y subnotas */}
          <div className="border" style={{ borderColor: c.edge }}>
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
                <h2 className="font-['Nunito',sans-serif] font-[900] text-xl" style={{ color: c.text }}>
                  {side === 'front' ? (es ? 'Anverso' : 'Front') : (es ? 'Reverso' : 'Back')}
                </h2>
                {faceScores.length > 0 && (
                  <p className="text-xs tabular-nums" style={{ color: c.muted }}>
                    {faceScores.map(({ area, value }) => `${CATEGORY_LABEL[area === 'corners' ? 'Corners' : area === 'edges' ? 'Edges' : 'Surface'][lang]} ${fmt(value)}`).join('  ·  ')}
                  </p>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] gap-6 md:gap-9 items-start">
                {/* Mapa */}
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
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full text-white font-bold tabular-nums cursor-pointer transition-transform"
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

                {/* Lista de defectos */}
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

        {/* Detalle de las subnotas */}
        <section>
          <h2 className="font-['Nunito',sans-serif] font-[900] text-xl pb-2 border-b" style={{ color: c.text, borderColor: c.rule }}>
            {es ? 'Detalle de las subnotas' : 'Subgrade detail'}
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[13px] min-w-[560px]">
              <thead>
                <tr style={{ color: c.muted }}>
                  <th className={th}>{es ? 'Área' : 'Area'}</th>
                  <th className={th}>{es ? 'Anverso' : 'Front'}</th>
                  <th className={th}>{es ? 'Reverso' : 'Back'}</th>
                  <th className={`${th} text-right`}>{es ? 'Nota' : 'Grade'}</th>
                  <th className={th}>{es ? 'Observaciones' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                <tr className="border-t" style={{ borderColor: c.rule }}>
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
                    <tr key={area} className="border-t" style={{ borderColor: c.rule }}>
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
        </section>
      </div>
    </article>
  );
};

/** Dibujo del centrado: el marco de la carta y dónde cae la imagen dentro de él, según los repartos medidos. */
const CenteringDiagram: React.FC<{
  ratios: { lr: [number, number] | null; tb: [number, number] | null };
  text: string | undefined;
  es: boolean;
  c: { edge: string; text: string; muted: string; green: string; soft: string };
}> = ({ ratios, text, es, c }) => {
  if (!ratios.lr && !ratios.tb) {
    // Sin repartos legibles se muestra el texto tal cual, si lo hay.
    return text ? (
      <div className="min-w-0 text-sm">
        <div className="font-bold" style={{ color: c.text }}>{es ? 'Centrado' : 'Centering'}</div>
        <p className="mt-1" style={{ color: c.muted }}>{text}</p>
      </div>
    ) : null;
  }

  const W = 150;
  const H = 210;
  const margin = 26; // reparto del margen total entre los dos lados
  const [l, r] = ratios.lr ?? [50, 50];
  const [t, b] = ratios.tb ?? [50, 50];
  const left = (margin * 2 * l) / (l + r);
  const top = (margin * 2 * t) / (t + b);
  const innerW = W - margin * 2;
  const innerH = H - margin * 2;

  return (
    <div className="min-w-0">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={es ? 'Dibujo del centrado' : 'Centering diagram'} className="block max-w-full">
        <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="5" fill="none" stroke={c.edge} strokeWidth="1" />
        <rect x={left} y={top} width={innerW} height={innerH} fill={c.soft} stroke={c.green} strokeWidth="1.5" />
        <line x1={left + innerW / 2} y1={top} x2={left + innerW / 2} y2={top + innerH} stroke={c.edge} strokeDasharray="3 3" />
        <line x1={left} y1={top + innerH / 2} x2={left + innerW} y2={top + innerH / 2} stroke={c.edge} strokeDasharray="3 3" />
      </svg>
      <dl className="mt-2 text-[11px] tabular-nums space-y-0.5" style={{ color: c.muted }}>
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
