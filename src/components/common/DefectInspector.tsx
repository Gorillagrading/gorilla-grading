import React, { useState } from 'react';
import { GradedCard, CardDefect } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface DefectInspectorProps {
  card: GradedCard;
}

type TabType = 'Global' | 'Centering' | 'Corners' | 'Edges' | 'Surface';

export const DefectInspector: React.FC<DefectInspectorProps> = ({ card }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<TabType>('Global');
  const [selectedDefect, setSelectedDefect] = useState<CardDefect | null>(null);

  const tabs: { id: TabType; label: string; score: number }[] = [
    { id: 'Global', label: 'Global', score: card.grade },
    { id: 'Centering', label: 'Centering', score: card.subgrades.centering.score },
    { id: 'Corners', label: 'Corners', score: card.subgrades.corners.score },
    { id: 'Edges', label: 'Edges', score: card.subgrades.edges.score },
    { id: 'Surface', label: 'Surface', score: card.subgrades.surface.score },
  ];

  const visibleDefects = activeTab === 'Global'
    ? card.defects
    : card.defects.filter(d => d.category === activeTab);

  return (
    <div className={`w-full flex flex-col border-t pt-5 ${
      isLight ? 'border-gray-200' : 'border-white/10'
    }`}>
      
      {/* Header */}
      <div className="flex flex-col mb-3">
        <span className={`font-mono text-[9px] tracking-[0.2em] uppercase font-bold mb-1 ${
          isLight ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {language === 'es' ? 'Inspector de Defectos' : 'Defect Inspector'}
        </span>
        <h3 className={`font-['Space_Grotesk',sans-serif] text-base sm:text-lg font-bold uppercase tracking-wide ${
          isLight ? 'text-gray-900' : 'text-white'
        }`}>
          {language === 'es' ? 'Mapeo Óptico de Anomalías' : 'Optical Anomaly Mapping'}
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-4">
        {tabs.map(({ id, label, score }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
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
              {label} ({score.toFixed(1)})
            </button>
          );
        })}
      </div>

      {/* Main Layout: Map + Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* The Card Blueprint with Original Slab Label */}
        <div className={`relative w-full max-w-[280px] mx-auto md:mx-0 aspect-[2.5/3.5] border p-3 ${
          isLight ? 'border-gray-300 bg-white shadow-sm' : 'border-white/10 bg-[#0E120E]'
        }`}>
            {/* Corner brackets */}
            <div className={`absolute top-0 left-0 w-4 h-4 border-t border-l ${isLight ? 'border-gray-500' : 'border-white/40'}`} />
            <div className={`absolute top-0 right-0 w-4 h-4 border-t border-r ${isLight ? 'border-gray-500' : 'border-white/40'}`} />
            <div className={`absolute bottom-0 left-0 w-4 h-4 border-b border-l ${isLight ? 'border-gray-500' : 'border-white/40'}`} />
            <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r ${isLight ? 'border-gray-500' : 'border-white/40'}`} />

            {/* Grid lines */}
            <div className={`absolute top-1/2 left-0 right-0 border-t border-dashed ${isLight ? 'border-gray-200' : 'border-white/10'}`} />
            <div className={`absolute left-1/2 top-0 bottom-0 border-l border-dashed ${isLight ? 'border-gray-200' : 'border-white/10'}`} />

            {/* The Image (Desaturated) */}
            <div className={`relative w-full h-full overflow-hidden ${isLight ? 'bg-gray-100' : 'bg-[#2A2E2A]'}`}>
              <img
                src={card.frontImage}
                alt={card.name}
                className="w-full h-full object-cover"
              />

              {/* Defect Markers */}
              {visibleDefects.map((defect) => {
                const isSelected = selectedDefect?.id === defect.id;

                return (
                  <button
                    key={defect.id}
                    onClick={() => setSelectedDefect(defect)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
                    style={{ left: `${defect.x}%`, top: `${defect.y}%` }}
                  >
                    {/* Minimal Crosshair marker */}
                    <div className={`relative flex items-center justify-center w-6 h-6 transition-transform ${isSelected ? 'scale-125' : ''}`}>
                      <div className={`absolute w-full h-[1px] ${isSelected ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`} />
                      <div className={`absolute h-full w-[1px] ${isSelected ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`} />
                      <div className={`w-1.5 h-1.5 rounded-none z-10 ${isSelected ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        {/* Selected Defect Info (Editorial Style) */}
        <div className="flex flex-col">
          {selectedDefect ? (
            <div className="flex flex-col gap-5">
              <div className={`pb-3 border-b flex items-center justify-between ${
                isLight ? 'border-gray-200' : 'border-white/10'
              }`}>
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-red-600 dark:text-red-400">
                  Defect Found // {selectedDefect.category}
                </span>
                <span className={`font-mono text-[10px] tracking-widest font-semibold ${
                  isLight ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  X:{selectedDefect.x}% Y:{selectedDefect.y}%
                </span>
              </div>

              <h4 className={`font-['Space_Grotesk',sans-serif] text-lg font-bold uppercase leading-tight ${
                isLight ? 'text-gray-950' : 'text-white'
              }`}>
                {selectedDefect.title}
              </h4>

              <p className={`font-sans text-sm leading-relaxed ${
                isLight ? 'text-gray-700' : 'text-gray-300'
              }`}>
                {selectedDefect.description}
              </p>

              <div className={`mt-6 flex items-center justify-between p-4 border ${
                isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.03] border-white/10'
              }`}>
                <span className={`font-mono text-[11px] tracking-widest uppercase font-semibold ${
                  isLight ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  Score Impact
                </span>
                <span className="font-display text-xl font-bold text-red-600 dark:text-red-400">
                  -{selectedDefect.deduction.toFixed(1)}
                </span>
              </div>
            </div>
          ) : (
            <div className={`h-full flex items-center justify-center min-h-[160px] sm:min-h-[280px] p-4 sm:p-6 border border-dashed ${
              isLight ? 'border-gray-200 bg-gray-50/50' : 'border-white/10 bg-white/[0.01]'
            }`}>
              <p className={`font-mono text-[11px] uppercase tracking-[0.16em] max-w-[240px] text-center leading-relaxed font-medium ${
                isLight ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {visibleDefects.length > 0
                  ? (language === 'es'
                      ? 'Selecciona una cruz en el visor óptico para examinar la anomalía.'
                      : 'Select a crosshair marker on the blueprint to view anomaly details.')
                  : (language === 'es'
                      ? `No se detectaron anomalías en la categoría ${activeTab}.`
                      : `No anomalies detected in the ${activeTab} category.`)}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
