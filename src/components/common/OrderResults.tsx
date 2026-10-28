import React, { useEffect, useState } from 'react';
import type { OrderResultsDto } from '../../../shared/photos';
import { cardTitle } from '../../../shared/cards';
import { api } from '../../api/client';

type Result = OrderResultsDto['items'][number];

const SUBGRADES = [
  ['centering', { es: 'Centrado', en: 'Centering' }],
  ['corners', { es: 'Esquinas', en: 'Corners' }],
  ['edges', { es: 'Bordes', en: 'Edges' }],
  ['surface', { es: 'Superficie', en: 'Surface' }],
] as const;

const SEVERITY = {
  flawless: { es: 'Sin defecto', en: 'Flawless' },
  minor: { es: 'Leve', en: 'Minor' },
  moderate: { es: 'Moderado', en: 'Moderate' },
  critical: { es: 'Grave', en: 'Critical' },
} as const;

const KIND = { front: { es: 'Anverso', en: 'Front' }, back: { es: 'Reverso', en: 'Back' }, extra: { es: 'Detalle', en: 'Detail' } } as const;

const num = (n: number, lang: 'es' | 'en') => n.toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB', { maximumFractionDigits: 1 });

/**
 * Resultado de graduación de un pedido propio. El servidor solo lo entrega cuando el pedido ya ha salido
 * del laboratorio; hasta entonces no se muestra nada.
 */
export const OrderResults: React.FC<{ code: string; lang: 'es' | 'en'; isLight: boolean }> = ({ code, lang, isLight }) => {
  const [results, setResults] = useState<OrderResultsDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ results: OrderResultsDto }>(`/orders/${encodeURIComponent(code)}/results`)
      .then((r) => !cancelled && setResults(r.results))
      .catch(() => !cancelled && setResults(null));
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!results?.released) return null;

  const text = isLight ? 'text-[#1C201D]' : 'text-white';
  const muted = isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]';
  const rule = isLight ? 'border-black/10' : 'border-white/10';
  const accent = isLight ? 'text-[#2D9A46]' : 'text-[#48C765]';
  const es = lang === 'es';

  return (
    <section className={`w-full py-8 px-6 lg:px-12 ${isLight ? 'bg-[#ECE5D8]' : 'bg-[#383838]'}`} aria-label={es ? 'Resultados de graduación' : 'Grading results'}>
      <div className="w-full max-w-[1400px] mx-auto">
        <h3 className={`font-mono text-[10px] tracking-[0.2em] uppercase font-bold mb-6 ${accent}`}>
          {es ? 'Resultados de graduación' : 'Grading results'}
        </h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {results.items.map((item) => (
            <Card key={item.position} item={item} lang={lang} text={text} muted={muted} rule={rule} accent={accent} isLight={isLight} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Card: React.FC<{ item: Result; lang: 'es' | 'en'; text: string; muted: string; rule: string; accent: string; isLight: boolean }> = ({
  item, lang, text, muted, rule, accent, isLight,
}) => {
  const es = lang === 'es';
  const g = item.grading;
  const [open, setOpen] = useState<string | null>(null);

  return (
    <article className={`border p-5 ${rule} ${isLight ? 'bg-white/50' : 'bg-black/20'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className={`font-mono text-[9px] ${muted}`}>{String(item.position).padStart(2, '0')}</span>
          <h4 className={`font-mono text-xs uppercase tracking-widest font-semibold truncate ${text}`}>{cardTitle(item.cardName, item.position, lang)}</h4>
          <p className={`font-mono text-[9px] uppercase tracking-widest ${muted}`}>
            {item.game ? `${item.game}${item.setName ? ` • ${item.setName}` : ''}` : es ? 'La identifica el laboratorio' : 'Identified by the lab'}
          </p>
        </div>
        {g && g.isAuthentic && g.finalGrade !== null && (
          <div className="text-right shrink-0">
            <div className={`text-3xl font-[900] leading-none ${accent}`}>{num(g.finalGrade, lang)}</div>
            <div className={`font-mono text-[9px] uppercase tracking-widest mt-1 ${text}`}>{g.gradeLabel}</div>
          </div>
        )}
      </div>

      {!g && <p className={`text-xs mt-4 ${muted}`}>{es ? 'El resultado de esta carta todavía no está disponible.' : 'The result for this card is not available yet.'}</p>}
      {g && !g.isAuthentic && (
        <p className="text-sm font-bold mt-4 text-red-600 dark:text-red-400">
          {es ? 'No hemos podido autenticar esta carta.' : 'We could not authenticate this card.'}
        </p>
      )}

      {g && g.isAuthentic && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {SUBGRADES.map(([key, name]) => {
            const sub = g[key];
            return (
              <div key={key} className={`border-t pt-2 ${rule}`}>
                <dt className={`font-mono text-[9px] uppercase tracking-widest ${muted}`}>{name[lang]}</dt>
                <dd className={`text-lg font-bold ${text}`}>{sub ? num(sub.score, lang) : '—'}</dd>
                {key === 'centering' && g.centering?.frontRatio && (
                  <dd className={`font-mono text-[9px] ${muted}`}>{g.centering.frontRatio}</dd>
                )}
              </div>
            );
          })}
        </dl>
      )}

      {g && g.isAuthentic && SUBGRADES.some(([key]) => g[key]?.notes) && (
        <ul className="mt-4 space-y-1.5">
          {SUBGRADES.filter(([key]) => g[key]?.notes).map(([key, name]) => (
            <li key={key} className={`text-xs leading-relaxed ${muted}`}>
              <strong className={text}>{name[lang]}:</strong> {g[key]!.notes}
            </li>
          ))}
        </ul>
      )}

      {g && g.defects.length > 0 && (
        <ul className="mt-4 space-y-1">
          {g.defects.map((d, i) => (
            <li key={i} className={`text-xs ${muted}`}>
              <span className={`font-mono text-[9px] uppercase mr-2 ${text}`}>{SEVERITY[d.severity][lang]}</span>
              {d.title}
            </li>
          ))}
        </ul>
      )}

      {item.images.length > 0 && (
        <div className="mt-5">
          <div className="flex flex-wrap gap-3">
            {item.images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setOpen(open === img.id ? null : img.id)}
                className={`border cursor-pointer ${rule}`}
                aria-label={`${KIND[img.kind][lang]}`}
              >
                <img src={img.url} alt={KIND[img.kind][lang]} className="h-28 w-auto object-contain" loading="lazy" />
              </button>
            ))}
          </div>
          {open && (
            <div className="mt-3">
              <img
                src={item.images.find((i) => i.id === open)?.url}
                alt={es ? 'Foto ampliada' : 'Enlarged photo'}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
          )}
        </div>
      )}
    </article>
  );
};
