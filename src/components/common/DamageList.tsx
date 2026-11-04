import React from 'react';
import type { PublicScanReport, ScanSide } from '../../../shared/scan-report';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { AREA_LABEL, KIND_EN, LOCATION_EN, SIZE_LABEL, mm, translate } from './ScanReportPanel';

/**
 * Lista de daños del informe del escáner, numerada como en la carta. El daño resaltado (al pasar por su número
 * en la carta, o por la propia lista) se amplía.
 */
export const DamageList: React.FC<{
  scan: PublicScanReport;
  highlighted: number | null;
  onHover: (n: number | null) => void;
}> = ({ scan, highlighted, onHover }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const lang = language === 'es' ? 'es' : 'en';
  const es = lang === 'es';
  const faces = scan.faces.filter((f) => f.damages.length > 0);
  if (faces.length === 0) return null;

  const muted = isLight ? 'text-gray-500' : 'text-gray-400';
  const strong = isLight ? 'text-gray-950' : 'text-white';
  const sideName = (s: ScanSide) => (s === 'front' ? (es ? 'Anverso' : 'Front') : (es ? 'Reverso' : 'Back'));

  return (
    <div className="w-full max-w-[340px] mx-auto text-left">
      <span className={`block font-mono text-[9px] tracking-[0.2em] uppercase font-bold mb-3 ${muted}`}>
        {es ? `Daños encontrados por el escáner (${faces.reduce((n, f) => n + f.damages.length, 0)})` : `Damage found by the scanner (${faces.reduce((n, f) => n + f.damages.length, 0)})`}
      </span>
      {faces.map((face) => (
        <div key={face.side} className="space-y-3">
          {faces.length > 1 && <p className={`font-mono text-[10px] uppercase tracking-[0.14em] font-bold ${strong}`}>{sideName(face.side)}</p>}
          {(['edges', 'surface', 'corners'] as const)
            .map((area) => ({ area, items: face.damages.filter((d) => d.area === area) }))
            .filter((g) => g.items.length > 0)
            .map(({ area, items }) => (
              <div key={area}>
                <h4 className={`text-xs font-bold mb-1 ${muted}`}>{AREA_LABEL[area][lang]}</h4>
                <ol className="space-y-0.5">
                  {items.map((d) => {
                    const active = highlighted === d.n;
                    return (
                      <li
                        key={d.n}
                        onMouseEnter={() => onHover(d.n)}
                        onMouseLeave={() => onHover(null)}
                        className={`flex items-start gap-2.5 px-2 py-1 -mx-2 rounded origin-left transition-all duration-150 ${
                          active ? `scale-[1.06] ${isLight ? 'bg-red-50' : 'bg-red-500/10'}` : ''
                        }`}
                      >
                        <span className={`shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold transition-transform ${active ? 'scale-125' : ''}`}>
                          {d.n}
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-sm ${strong} ${active ? 'font-bold' : ''}`}>
                            {translate(d.kind, KIND_EN, lang)}
                            {d.size && `, ${SIZE_LABEL[d.size][lang]}`}
                          </span>
                          {(d.location || d.lengthMm !== null) && (
                            <span className={`block text-xs ${muted}`}>
                              {[d.location ? translate(d.location, LOCATION_EN, lang) : null, d.lengthMm !== null ? `${mm(d.lengthMm, lang, 1)} mm` : null]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
};
