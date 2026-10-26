import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { PublicGradedCard, CardDefect } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface DefectInspectorProps {
  card: PublicGradedCard;
  large?: boolean;
}

type TabType = 'Global' | 'Centering' | 'Corners' | 'Edges' | 'Surface';
type Side = 'front' | 'back';

const TAB_LABEL: Record<TabType, { es: string; en: string }> = {
  Global: { es: 'Global', en: 'Global' },
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

/** Cada área con su artículo, para las frases en español. */
const AREA_ES: Record<TabType, string> = {
  Global: 'la carta',
  Centering: 'el centrado',
  Corners: 'las esquinas',
  Edges: 'los bordes',
  Surface: 'la superficie',
};

/** Los datos antiguos no indican la cara: se toma el anverso. */
const sideOf = (d: CardDefect): Side => d.side ?? 'front';

export const DefectInspector: React.FC<DefectInspectorProps> = ({ card, large = false }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const lang = language === 'es' ? 'es' : 'en';
  const es = lang === 'es';
  const [activeTab, setActiveTab] = useState<TabType>('Global');
  const [side, setSide] = useState<Side>('front');
  const [selectedDefect, setSelectedDefect] = useState<CardDefect | null>(null);

  const hasBack = !!card.backImage;
  const image = side === 'back' && hasBack ? card.backImage : card.frontImage;

  const tabs: { id: TabType; score: number }[] = [
    { id: 'Global', score: card.grade },
    { id: 'Centering', score: card.subgrades.centering.score },
    { id: 'Corners', score: card.subgrades.corners.score },
    { id: 'Edges', score: card.subgrades.edges.score },
    { id: 'Surface', score: card.subgrades.surface.score },
  ];

  const inTab = (d: CardDefect) => activeTab === 'Global' || d.category === activeTab;
  // Las cruces se pintan solo sobre la cara que se está viendo: sus coordenadas son de esa foto.
  const visibleDefects = card.defects.filter((d) => inTab(d) && sideOf(d) === side);
  const otherSideCount = card.defects.filter((d) => inTab(d) && sideOf(d) !== side).length;

  const muted = isLight ? 'text-gray-600' : 'text-gray-400';
  const strong = isLight ? 'text-gray-950' : 'text-white';
  const rule = isLight ? 'border-gray-200' : 'border-white/10';

  /** Detalle de la subnota de la pestaña activa: lo que mide el laboratorio aunque no haya defectos. */
  const subgradeDetail = () => {
    if (activeTab === 'Global') return null;
    const rows: [string, string][] = [];
    let notes = '';
    if (activeTab === 'Centering') {
      const c = card.subgrades.centering;
      if (c.frontRatio) rows.push([es ? 'Anverso' : 'Front', c.frontRatio]);
      if (c.backRatio) rows.push([es ? 'Reverso' : 'Back', c.backRatio]);
      notes = c.description;
    } else {
      const s = card.subgrades[activeTab.toLowerCase() as 'corners' | 'edges' | 'surface'];
      if (s.frontScore > 0) rows.push([es ? 'Anverso' : 'Front', s.frontScore.toFixed(1)]);
      if (s.backScore > 0) rows.push([es ? 'Reverso' : 'Back', s.backScore.toFixed(1)]);
      notes = s.description;
    }
    if (rows.length === 0 && !notes) return null;
    return (
      <div className={`pb-4 mb-4 border-b space-y-2 ${rule}`}>
        {rows.length > 0 && (
          <dl className="grid grid-cols-2 gap-3">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className={`font-mono text-[9px] uppercase tracking-[0.16em] ${muted}`}>{label}</dt>
                <dd className={`font-mono text-sm font-bold ${strong}`}>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {notes && <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{notes}</p>}
      </div>
    );
  };

  return (
    <div className={`w-full flex flex-col border-t pt-5 ${rule}`}>
      {/* Cabecera */}
      <div className="flex flex-col mb-3">
        <span className={`font-mono text-[9px] tracking-[0.2em] uppercase font-bold mb-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
          {es ? 'Informe de defectos' : 'Defect report'}
        </span>
        <h3 className={`font-['Space_Grotesk',sans-serif] font-bold uppercase tracking-wide ${large ? 'text-xl sm:text-3xl' : 'text-base sm:text-lg'} ${strong}`}>
          {es ? 'Mapa de defectos' : 'Defect map'}
        </h3>
      </div>

      {/* Pestañas */}
      <div className="flex flex-wrap gap-3 mb-4" role="tablist">
        {tabs.map(({ id, score }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveTab(id);
                setSelectedDefect(null);
              }}
              className={`pb-1 font-mono text-[10.5px] tracking-[0.12em] uppercase border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? (isLight ? 'border-emerald-600 text-gray-950 font-black' : 'border-emerald-500 text-white font-bold')
                  : (isLight ? 'border-transparent text-gray-500 hover:text-gray-900 font-semibold' : 'border-transparent text-gray-400 hover:text-white')
              }`}
            >
              {TAB_LABEL[id][lang]} ({score.toFixed(1)})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
        {/* Foto de la carta con los defectos marcados */}
        <div className="flex flex-col items-center md:items-start gap-3">
          {hasBack && (
            <div className={`inline-flex border ${rule}`} role="group" aria-label={es ? 'Cara de la carta' : 'Card side'}>
              {(['front', 'back'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={side === s}
                  onClick={() => {
                    setSide(s);
                    setSelectedDefect(null);
                  }}
                  className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] cursor-pointer ${
                    side === s
                      ? (isLight ? 'bg-gray-900 text-white' : 'bg-white text-gray-950')
                      : muted
                  }`}
                >
                  {s === 'front' ? (es ? 'Anverso' : 'Front') : (es ? 'Reverso' : 'Back')}
                </button>
              ))}
            </div>
          )}

          <div className={`relative border p-2 ${large ? 'w-[230px] sm:w-[260px] md:w-[280px]' : 'w-[200px]'} ${
            isLight ? 'border-gray-300 bg-white shadow-sm' : 'border-white/10 bg-[#0E120E]'
          }`}>
            <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${isLight ? 'border-gray-500' : 'border-white/40'}`} />
            <div className={`absolute top-0 right-0 w-3 h-3 border-t border-r ${isLight ? 'border-gray-500' : 'border-white/40'}`} />
            <div className={`absolute bottom-0 left-0 w-3 h-3 border-b border-l ${isLight ? 'border-gray-500' : 'border-white/40'}`} />
            <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${isLight ? 'border-gray-500' : 'border-white/40'}`} />

            {image ? (
              // El contenedor tiene exactamente el tamaño de la foto: así los porcentajes de los defectos caen en su sitio.
              <div className="relative">
                <img src={image} alt={card.name} className="block w-full h-auto select-none" draggable={false} />
                {visibleDefects.map((defect) => {
                  const isSelected = selectedDefect?.id === defect.id;
                  return (
                    <button
                      key={defect.id}
                      type="button"
                      onClick={() => setSelectedDefect(defect)}
                      aria-label={defect.title}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                      style={{ left: `${defect.x}%`, top: `${defect.y}%` }}
                    >
                      <div className={`relative flex items-center justify-center w-6 h-6 transition-transform ${isSelected ? 'scale-125' : ''}`}>
                        <div className={`absolute w-full h-[1px] ${isSelected ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`} />
                        <div className={`absolute h-full w-[1px] ${isSelected ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`} />
                        <div className={`w-1.5 h-1.5 z-10 ${isSelected ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={`aspect-[2.5/3.5] flex items-center justify-center p-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] ${
                isLight ? 'bg-gray-100 text-gray-500' : 'bg-[#2A2E2A] text-gray-400'
              }`}>
                {es ? 'Sin foto' : 'No photo'}
              </div>
            )}
          </div>
        </div>

        {/* Detalle */}
        <div className="flex flex-col min-w-0">
          {subgradeDetail()}

          {selectedDefect ? (
            <div className="flex flex-col gap-4">
              <div className={`pb-3 border-b flex items-center justify-between gap-3 ${rule}`}>
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-red-600 dark:text-red-400">
                  {es ? 'Defecto' : 'Defect'} // {TAB_LABEL[selectedDefect.category][lang]} · {SEVERITY_LABEL[selectedDefect.severity][lang]}
                </span>
                <span className={`font-mono text-[10px] tracking-widest font-semibold ${muted}`}>
                  X:{selectedDefect.x}% Y:{selectedDefect.y}%
                </span>
              </div>
              <h4 className={`font-['Space_Grotesk',sans-serif] text-lg font-bold uppercase leading-tight ${strong}`}>{selectedDefect.title}</h4>
              {selectedDefect.description && (
                <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{selectedDefect.description}</p>
              )}
              {selectedDefect.deduction > 0 && (
                <div className={`mt-2 flex items-center justify-between p-4 border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.03] border-white/10'}`}>
                  <span className={`font-mono text-[11px] tracking-widest uppercase font-semibold ${muted}`}>
                    {es ? 'Impacto en la nota' : 'Score Impact'}
                  </span>
                  <span className="font-display text-xl font-bold text-red-600 dark:text-red-400">-{selectedDefect.deduction.toFixed(1)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center gap-2 min-h-[140px] p-4 sm:p-6 border border-dashed text-center ${
              isLight ? 'border-gray-200 bg-gray-50/50' : 'border-white/10 bg-white/[0.01]'
            }`}>
              {visibleDefects.length > 0 ? (
                <p className={`font-mono text-[11px] uppercase tracking-[0.16em] max-w-[280px] leading-relaxed font-medium ${muted}`}>
                  {es ? 'Selecciona una cruz en la foto para ver el defecto.' : 'Select a crosshair on the photo to view the defect.'}
                </p>
              ) : (
                // Sin defectos: se dice qué se revisó, para que quede claro que la carta sí se estudió.
                <div className="w-full max-w-[320px] space-y-3">
                  <ul className="space-y-1.5">
                    {tabs.filter((tab) => tab.id !== 'Global' && (activeTab === 'Global' || tab.id === activeTab)).map((tab) => (
                      <li key={tab.id} className={`flex items-center justify-between gap-3 text-sm ${strong}`}>
                        <span className="inline-flex items-center gap-2">
                          <Check className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} aria-hidden="true" />
                          {TAB_LABEL[tab.id][lang]}
                        </span>
                        <span className="font-bold tabular-nums">{tab.score.toFixed(1)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className={`text-xs leading-relaxed ${muted}`}>
                    {activeTab === 'Global'
                      ? (es
                        ? `El laboratorio revisó estas cuatro áreas en el ${side === 'front' ? 'anverso' : 'reverso'} y no marcó ningún defecto.`
                        : `The lab reviewed these four areas on the ${side} and marked no defects.`)
                      : (es
                        ? `El laboratorio revisó ${AREA_ES[activeTab]} en el ${side === 'front' ? 'anverso' : 'reverso'} y no marcó ningún defecto.`
                        : `The lab reviewed the ${TAB_LABEL[activeTab].en.toLowerCase()} on the ${side} and marked no defects.`)}
                  </p>
                </div>
              )}
              {otherSideCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSide(side === 'front' ? 'back' : 'front')}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] underline underline-offset-4 cursor-pointer text-emerald-600 dark:text-emerald-400"
                >
                  {es
                    ? `Ver ${otherSideCount} en el ${side === 'front' ? 'reverso' : 'anverso'}`
                    : `See ${otherSideCount} on the ${side === 'front' ? 'back' : 'front'}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
