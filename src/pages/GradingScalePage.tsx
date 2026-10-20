import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  GRADE_LABELS, SUBGRADE_KEYS, deriveGradeLabel, traceGrade,
  type GradeReason, type SubgradeKey, type SubgradeScores,
} from '../../shared/grading';

interface PageProps {
  onNavigate: (path: string) => void;
}

const COPY = {
  es: {
    eyebrow: 'Transparencia',
    title: 'Cómo calculamos la nota',
    lead: 'Cada carta recibe cuatro subnotas. De ellas sale la nota final con una regla que publicamos completa. Es la misma que aplica nuestro sistema a cada certificado: no puede guardarse una nota que la incumpla.',
    subgradesTitle: 'Las cuatro subnotas',
    subgrades: {
      centering: ['Centrado', 'Cuánto de bien centrada está la imagen dentro del borde, por delante y por detrás.'],
      corners: ['Esquinas', 'El estado de las cuatro esquinas: filo, desgaste, golpes.'],
      edges: ['Bordes', 'Blanqueo, melladuras o desgaste a lo largo de los cantos.'],
      surface: ['Superficie', 'Arañazos, marcas de impresión, huellas y brillo original.'],
    } as Record<SubgradeKey, [string, string]>,
    rulesTitle: 'La regla',
    rules: [
      'Cada subnota va de 1 a 10, de medio en medio punto.',
      'Hacemos la media de las cuatro y la redondeamos al 0,5 más cercano. Si queda justo en medio, redondeamos hacia abajo.',
      'La nota final no puede superar en más de 0,5 a la peor subnota. Un solo defecto serio limita la carta entera.',
      'Para un 9,5 o un 10 hacen falta al menos tres subnotas de 9,5 o más.',
      '«Pristine 10» es un 10 con las cuatro subnotas en 10. Un 10 con una subnota de 9,5 es «Gem Mint 10».',
      'El graduador puede poner una nota más baja que la calculada, nunca más alta.',
    ],
    rulesNote: 'Con estas reglas, un 10 solo sale con cuatro subnotas de 10 o con tres 10 y un 9,5. De las 130.321 combinaciones posibles de subnotas, solo 5 dan un 10.',
    calcTitle: 'Pruébalo tú',
    calcLead: 'Elige las cuatro subnotas y mira qué nota sale y por qué.',
    examplesLabel: 'Ejemplos',
    examples: [
      ['Carta perfecta', [10, 10, 10, 10]],
      ['Un 9,5 en bordes', [10, 10, 9.5, 10]],
      ['Una subnota floja', [10, 10, 10, 8]],
      ['Dos subnotas altas', [9, 9, 10, 10]],
    ] as [string, number[]][],
    finalGrade: 'Nota final',
    why: 'Cómo se calcula',
    average: (avg: string, rounded: string) => `Media de las cuatro subnotas: ${avg}. Redondeada al 0,5: ${rounded}.`,
    reasons: {
      weakest_caps: (lowest: string, cap: string) => `La peor subnota (${lowest}) limita la nota: como mucho ${cap}.`,
      top_needs_three_half: () => 'Para un 9,5 o un 10 hacen falta al menos tres subnotas de 9,5 o más. Aquí no las hay, así que la nota baja a 9.',
    },
    noReason: 'Ninguna otra regla la rebaja: la nota es la media redondeada.',
    labelsTitle: 'Las notas y sus nombres',
    guaranteeTitle: 'Lo que garantizamos',
    guarantees: [
      'La nota nunca es más alta de lo que permiten las subnotas.',
      'La peor subnota siempre cuenta: un defecto no se compensa con otras tres subnotas perfectas.',
      'Cada certificado se puede verificar con su número, y su nota cumple esta regla.',
    ],
    cta: 'Verificar un certificado',
    version: 'Regla de la nota · versión 1',
  },
  en: {
    eyebrow: 'Transparency',
    title: 'How we calculate the grade',
    lead: 'Every card receives four subgrades. The final grade comes from them using a rule we publish in full. It is the same rule our system applies to every certificate: a grade that breaks it cannot be saved.',
    subgradesTitle: 'The four subgrades',
    subgrades: {
      centering: ['Centering', 'How well the image sits within the border, front and back.'],
      corners: ['Corners', 'The condition of the four corners: sharpness, wear, dings.'],
      edges: ['Edges', 'Whitening, chipping or wear along the sides.'],
      surface: ['Surface', 'Scratches, print marks, fingerprints and original gloss.'],
    } as Record<SubgradeKey, [string, string]>,
    rulesTitle: 'The rule',
    rules: [
      'Each subgrade runs from 1 to 10 in half-point steps.',
      'We average the four and round to the nearest 0.5. If it falls exactly halfway, we round down.',
      'The final grade cannot be more than 0.5 above the lowest subgrade. One serious flaw limits the whole card.',
      'A 9.5 or a 10 needs at least three subgrades of 9.5 or higher.',
      '"Pristine 10" is a 10 with all four subgrades at 10. A 10 with one 9.5 subgrade is "Gem Mint 10".',
      'The grader may give a lower grade than the calculated one, never a higher one.',
    ],
    rulesNote: 'Under these rules, a 10 only happens with four 10s or with three 10s and one 9.5. Of the 130,321 possible subgrade combinations, only 5 give a 10.',
    calcTitle: 'Try it yourself',
    calcLead: 'Pick the four subgrades and see which grade comes out and why.',
    examplesLabel: 'Examples',
    examples: [
      ['Perfect card', [10, 10, 10, 10]],
      ['A 9.5 on edges', [10, 10, 9.5, 10]],
      ['One weak subgrade', [10, 10, 10, 8]],
      ['Two high subgrades', [9, 9, 10, 10]],
    ] as [string, number[]][],
    finalGrade: 'Final grade',
    why: 'How it is calculated',
    average: (avg: string, rounded: string) => `Average of the four subgrades: ${avg}. Rounded to 0.5: ${rounded}.`,
    reasons: {
      weakest_caps: (lowest: string, cap: string) => `The lowest subgrade (${lowest}) limits the grade: at most ${cap}.`,
      top_needs_three_half: () => 'A 9.5 or a 10 needs at least three subgrades of 9.5 or higher. There are not enough here, so the grade drops to 9.',
    },
    noReason: 'No other rule lowers it: the grade is the rounded average.',
    labelsTitle: 'The grades and their names',
    guaranteeTitle: 'What we guarantee',
    guarantees: [
      'The grade is never higher than the subgrades allow.',
      'The lowest subgrade always counts: a flaw is not offset by three perfect subgrades.',
      'Every certificate can be verified by its number, and its grade follows this rule.',
    ],
    cta: 'Verify a certificate',
    version: 'Grading rule · version 1',
  },
};

const SCORE_OPTIONS = Array.from({ length: 19 }, (_, i) => 10 - i * 0.5);
const DEFAULT_SCORES: SubgradeScores = { centering: 10, corners: 10, edges: 9.5, surface: 10 };

export const GradingScalePage: React.FC<PageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const isLight = useTheme().theme === 'light';
  const lang = language === 'es' ? 'es' : 'en';
  const c = COPY[lang];
  const [scores, setScores] = useState<SubgradeScores>(DEFAULT_SCORES);

  const num = (n: number, digits = 1) =>
    n.toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB', { minimumFractionDigits: digits, maximumFractionDigits: 3 });
  const trace = traceGrade(scores);
  const label = deriveGradeLabel(trace.final, scores);

  const accent = isLight ? 'text-[#15803D]' : 'text-[#48C765]';
  const muted = isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]';
  const panel = isLight ? 'bg-[#F2ECE1] border-black/[0.08]' : 'bg-[#1A1E1C] border-white/[0.06]';
  const field = isLight
    ? 'bg-white border-[#D8D2C5] text-[#14170F] focus:border-[#15803D]'
    : 'bg-[#232823] border-white/10 text-white focus:border-[#48C765]';
  const heading = "font-['Nunito',sans-serif] font-[900] uppercase tracking-normal";

  const reasonText = (reason: GradeReason) =>
    reason === 'weakest_caps'
      ? c.reasons.weakest_caps(num(trace.lowest), num(trace.lowest + 0.5))
      : c.reasons.top_needs_three_half();

  return (
    <div className={`w-full min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-12 transition-colors duration-300 ${
      isLight ? 'bg-[#ECE5D8] text-[#14170F]' : 'bg-[#14170F] text-white'
    }`}>
      <div className="max-w-[1100px] mx-auto space-y-16">
        {/* Cabecera */}
        <header className="max-w-3xl space-y-4">
          <div className={`font-mono text-[11px] font-bold tracking-[0.3em] uppercase ${accent}`}>{c.eyebrow}</div>
          <h1 className={`${heading} text-4xl sm:text-5xl leading-[1.05]`}>{c.title}</h1>
          <p className={`text-base leading-relaxed ${muted}`}>{c.lead}</p>
        </header>

        {/* Subnotas */}
        <section aria-labelledby="subgrades-title" className="space-y-5">
          <h2 id="subgrades-title" className={`${heading} text-xl`}>{c.subgradesTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBGRADE_KEYS.map((key) => (
              <div key={key} className={`p-5 border ${panel}`}>
                <div className={`font-['Nunito',sans-serif] font-[900] text-lg ${accent}`}>{c.subgrades[key][0]}</div>
                <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{c.subgrades[key][1]}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Regla */}
        <section aria-labelledby="rules-title" className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-5">
            <h2 id="rules-title" className={`${heading} text-xl`}>{c.rulesTitle}</h2>
            <ol className="space-y-3.5">
              {c.rules.map((rule, i) => (
                <li key={i} className="flex gap-4">
                  <span className={`shrink-0 w-7 h-7 border flex items-center justify-center font-mono text-xs font-bold ${panel} ${accent}`}>{i + 1}</span>
                  <span className="text-sm sm:text-base leading-relaxed pt-0.5">{rule}</span>
                </li>
              ))}
            </ol>
            <p className={`text-sm leading-relaxed ${muted}`}>{c.rulesNote}</p>
          </div>

          {/* Calculadora */}
          <div className={`lg:col-span-2 p-5 sm:p-6 border space-y-5 self-start ${panel}`}>
            <div>
              <h2 className={`${heading} text-lg`}>{c.calcTitle}</h2>
              <p className={`mt-1 text-sm ${muted}`}>{c.calcLead}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SUBGRADE_KEYS.map((key) => (
                <label key={key} className="block">
                  <span className={`block font-mono text-[10px] uppercase tracking-wider mb-1 ${muted}`}>{c.subgrades[key][0]}</span>
                  <select
                    id={`calc-${key}`}
                    value={scores[key]}
                    onChange={(e) => setScores({ ...scores, [key]: Number(e.target.value) })}
                    className={`w-full px-3 py-2.5 text-sm border focus:outline-none ${field}`}
                  >
                    {SCORE_OPTIONS.map((v) => (
                      <option key={v} value={v}>{num(v)}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={c.examplesLabel}>
              <span className={`font-mono text-[10px] uppercase tracking-wider ${muted}`}>{c.examplesLabel}</span>
              {c.examples.map(([name, v]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setScores({ centering: v[0], corners: v[1], edges: v[2], surface: v[3] })}
                  className={`px-2.5 py-1 border text-xs cursor-pointer transition-colors ${
                    isLight ? 'border-black/15 hover:border-[#15803D] hover:text-[#15803D]' : 'border-white/15 hover:border-[#48C765] hover:text-[#48C765]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            <div className={`pt-5 border-t space-y-3 ${isLight ? 'border-black/10' : 'border-white/10'}`} aria-live="polite">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className={`font-mono text-[10px] uppercase tracking-wider ${muted}`}>{c.finalGrade}</div>
                  <div id="calc-result" className={`${heading} text-5xl leading-none mt-1`}>{num(trace.final)}</div>
                </div>
                <div id="calc-label" className={`font-mono text-xs font-bold tracking-wider uppercase text-right ${accent}`}>{label}</div>
              </div>
              <div className={`font-mono text-[10px] uppercase tracking-wider ${muted}`}>{c.why}</div>
              <ul className="space-y-1.5 text-sm leading-relaxed">
                <li>{c.average(num(trace.average, 1), num(trace.rounded))}</li>
                {trace.reasons.length === 0 ? (
                  <li className={muted}>{c.noReason}</li>
                ) : (
                  trace.reasons.map((reason) => <li key={reason}>{reasonText(reason)}</li>)
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* Etiquetas */}
        <section aria-labelledby="labels-title" className="space-y-5">
          <h2 id="labels-title" className={`${heading} text-xl`}>{c.labelsTitle}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            {Object.keys(GRADE_LABELS)
              .map(Number)
              .sort((a, b) => b - a)
              .map((grade) => (
                <li key={grade} className={`flex items-baseline gap-4 py-2 border-b ${isLight ? 'border-black/10' : 'border-white/10'}`}>
                  <span className={`w-10 shrink-0 font-['Nunito',sans-serif] font-[900] text-lg ${accent}`}>{num(grade)}</span>
                  <span className="text-sm">{GRADE_LABELS[grade].join(' / ')}</span>
                </li>
              ))}
          </ul>
        </section>

        {/* Garantías */}
        <section aria-labelledby="guarantee-title" className={`p-6 sm:p-8 border space-y-4 ${panel}`}>
          <h2 id="guarantee-title" className={`${heading} text-xl`}>{c.guaranteeTitle}</h2>
          <ul className="space-y-2.5">
            {c.guarantees.map((g) => (
              <li key={g} className="flex gap-3 text-sm sm:text-base leading-relaxed">
                <span className={`mt-2 w-1.5 h-1.5 shrink-0 ${isLight ? 'bg-[#15803D]' : 'bg-[#48C765]'}`} aria-hidden="true" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={() => onNavigate('/verify')} className="btn-gorilla-square px-6 py-3 text-xs font-extrabold tracking-normal cursor-pointer">
              {c.cta} →
            </button>
            <span className={`font-mono text-[10px] uppercase tracking-wider ${muted}`}>{c.version}</span>
          </div>
        </section>
      </div>
    </div>
  );
};
