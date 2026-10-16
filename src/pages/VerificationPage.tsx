import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { MOCK_GRADED_CARDS, MOCK_POPULAR_SEARCHES } from '../data/mockCards';
import { GradedCard } from '../types';
import { SlabCard } from '../components/common/SlabCard';
import { DefectInspector } from '../components/common/DefectInspector';
import { Search, ShieldCheck, ArrowRight } from 'lucide-react';
import { VerifyLogo } from '../components/luxury/VerifyLogo';

interface VerificationPageProps {
  onNavigate: (path: string) => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [searchInput, setSearchInput] = useState('');
  const [activeCard, setActiveCard] = useState<GradedCard | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const query = searchInput.trim().toUpperCase();

    if (!query) return;

    const found = MOCK_GRADED_CARDS.find(
      c => c.certNumber.toUpperCase() === query || c.name.toUpperCase().includes(query)
    );

    if (found) {
      setActiveCard(found);
    } else {
      setErrorMsg(
        language === 'es' 
          ? `No se encontró ningún certificado con el código "${query}".` 
          : `No certificate found matching "${query}".`
      );
    }
  };

  return (
    <div className={`w-full min-h-screen ${
      isLight ? 'bg-[#FAF9F6] text-gray-950' : 'bg-[#0E120E] text-white'
    } flex flex-col pt-24 sm:pt-32 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-12 font-sans selection:bg-[#48C765] selection:text-[#14170F]`}>
      
      {/* Central Forensic Search Console */}
      <div className={`w-full max-w-[1000px] mx-auto text-center flex flex-col items-center mb-12 sm:mb-16 ${
        activeCard ? 'border-b pb-10 sm:pb-14 ' + (isLight ? 'border-gray-200' : 'border-white/10') : ''
      }`}>
        
        {/* Gorilla Verify Sub-Brand Badge */}
        <div className="mb-5 sm:mb-6">
          <VerifyLogo size="w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[380px] h-[78px] sm:h-[94px] lg:h-[110px]" />
        </div>

        {/* Technical Eyebrow */}
        <div className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-[#16A34A] dark:text-[#4ADE80] mb-3">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            {language === 'es' 
              ? 'EXPEDIENTE PÚBLICO · AUTENTICACIÓN CRIPTOGRÁFICA' 
              : 'PUBLIC REGISTRY · CRYPTOGRAPHIC AUTHENTICATION'}
          </span>
        </div>

        {/* Headline */}
        <h1 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl md:text-4xl font-[900] uppercase tracking-normal mb-3 sm:mb-4 ${
          isLight ? 'text-gray-950' : 'text-white'
        }`}>
          {t('verify.title')}
        </h1>

        {/* Subtext description */}
        <p className={`text-xs sm:text-sm max-w-xl mx-auto mb-6 sm:mb-8 font-sans ${
          isLight ? 'text-gray-600' : 'text-gray-400'
        }`}>
          {language === 'es'
            ? 'Consulte instantáneamente los datos de auditoría óptica a 1200 DPI, historial de sub-grados y certificado criptográfico oficial registrado en el ledger de Gorilla.'
            : 'Instantly query 1200 DPI master optical audit scans, subgrade records, and official cryptographic certificates verified on the Gorilla ledger.'}
        </p>

        {/* Futuristic Search Form */}
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto mb-5 sm:mb-6">
          <div className={`relative flex items-center rounded-2xl border transition-all duration-300 ${
            isLight 
              ? 'bg-white/80 border-gray-200 focus-within:border-[#16A34A] focus-within:ring-4 focus-within:ring-[#16A34A]/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]' 
              : 'bg-[#141814]/80 border-white/10 focus-within:border-[#4ADE80] focus-within:ring-4 focus-within:ring-[#4ADE80]/15 shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
          } backdrop-blur-md px-4 py-2 sm:py-2.5`}>
            
            <Search className={`w-5 h-5 shrink-0 mr-3 transition-colors ${
              isLight ? 'text-gray-400' : 'text-gray-500'
            }`} />
            
            <input
              type="text"
              placeholder={language === 'es' ? 'INGRESE ID DE CERTIFICADO (EJ. GGI-892401)' : 'ENTER CERTIFICATE ID (E.G. GGI-892401)'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`w-full bg-transparent py-2 text-sm sm:text-base font-mono uppercase tracking-widest focus:outline-none placeholder:font-mono placeholder:text-xs sm:placeholder:text-sm ${
                isLight ? 'text-gray-950 placeholder:text-gray-400' : 'text-white placeholder:text-gray-500'
              }`}
            />

            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setErrorMsg(''); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs px-2 py-1 font-mono uppercase mr-1 cursor-pointer"
                title={language === 'es' ? 'Limpiar búsqueda' : 'Clear search'}
              >
                ✕
              </button>
            )}

            <button
              type="submit"
              className="btn-gorilla-square px-5 py-2 sm:py-2.5 text-xs font-bold tracking-normal shrink-0 gap-1.5 cursor-pointer shadow-sm"
            >
              <span>{language === 'es' ? 'Verificar' : 'Verify'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {errorMsg && (
            <div className="mt-3 py-2 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-mono text-[11px] tracking-wide text-center">
              {errorMsg}
            </div>
          )}
        </form>

        {/* Quick Searches Centered Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 font-mono">
          <span className={`text-[10px] tracking-[0.2em] uppercase mr-1 ${
            isLight ? 'text-gray-400' : 'text-white/40'
          }`}>
            {language === 'es' ? 'Búsquedas de ejemplo:' : 'Example searches:'}
          </span>
          {MOCK_POPULAR_SEARCHES.map((cert) => (
            <button
              key={cert}
              type="button"
              onClick={() => {
                setSearchInput(cert);
                setErrorMsg('');
                const found = MOCK_GRADED_CARDS.find(c => c.certNumber === cert);
                if (found) setActiveCard(found);
              }}
              className={`px-3 py-1 rounded-lg border font-mono text-[11px] tracking-wider transition-all duration-200 cursor-pointer ${
                activeCard?.certNumber === cert
                  ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-sm font-bold'
                  : isLight
                    ? 'bg-white/70 hover:bg-white text-gray-700 hover:text-[#16A34A] border-gray-200 hover:border-[#16A34A]/40 shadow-xs'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#4ADE80] border-white/10 hover:border-[#4ADE80]/40'
              }`}
            >
              {cert}
            </button>
          ))}
        </div>
      </div>

      {/* Results - Split Layout */}
      {activeCard && (
        <div className="w-full max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
          
          {/* Left Column: The Slab (Hero of the page) - En móvil relative (flujo normal sin congelarse), en desktop sticky */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4 relative lg:sticky lg:top-24 z-10 w-full">
            <div className="w-full max-w-[320px] sm:max-w-[340px] mx-auto relative group">
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-[#48C765]/5 blur-[80px] pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity" />
              <div className="relative z-10 flex justify-center">
                <SlabCard card={activeCard} size="md" variant="card-only" onInspect={() => onNavigate('/certificates/demo')} />
              </div>
            </div>
            
            <button 
              onClick={() => onNavigate('/certificates/demo')}
              className="btn-gorilla-square mx-auto mt-2 px-6 py-2.5 text-xs font-extrabold tracking-normal gap-2 shadow-md cursor-pointer"
            >
              <span>{language === 'es' ? 'Ver Dossier con Slab 3D' : 'View Dossier with 3D Slab'}</span>
              <span>→</span>
            </button>
          </div>

          {/* Right Column: Editorial Data Sheet */}
          <div className="lg:col-span-7 flex flex-col">
            
            {/* 1. Header Spec */}
            <div className={`pb-5 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
              <div className="flex items-center gap-3 mb-2 font-mono text-[10px] tracking-[0.2em] uppercase text-[#16A34A] dark:text-[#48C765]">
                <span>CERT // {activeCard.certNumber}</span>
                <span className="w-1 h-1 bg-current" />
                <span>{activeCard.game}</span>
              </div>
              
              <h2 className={`font-['Nunito',sans-serif] text-xl md:text-2xl font-[900] uppercase leading-tight mb-4 ${
                isLight ? 'text-gray-950' : 'text-white'
              }`}>
                {activeCard.name}
              </h2>

              <div className={`grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 font-mono text-[10px] tracking-[0.15em] uppercase ${
                isLight ? 'text-gray-600' : 'text-[#A4ACA1]'
              }`}>
                <div className="flex flex-col gap-0.5">
                  <span className={isLight ? 'text-gray-400 text-[9px]' : 'text-white/30 text-[9px]'}>Year</span>
                  <span className={`text-xs font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{activeCard.year}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={isLight ? 'text-gray-400 text-[9px]' : 'text-white/30 text-[9px]'}>Set</span>
                  <span className={`text-xs font-semibold truncate ${isLight ? 'text-gray-900' : 'text-white'}`} title={activeCard.set}>{activeCard.set}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={isLight ? 'text-gray-400 text-[9px]' : 'text-white/30 text-[9px]'}>Card No.</span>
                  <span className={`text-xs font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{activeCard.cardNumber}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={isLight ? 'text-gray-400 text-[9px]' : 'text-white/30 text-[9px]'}>Rarity</span>
                  <div>
                    <span className="badge-rarity-gold text-[9px] px-2 py-0.5">
                      {activeCard.rarity}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. The Grade (Harmonious Typography) */}
            <div className={`py-5 border-b flex flex-col md:flex-row md:items-end justify-between gap-4 ${
              isLight ? 'border-gray-200' : 'border-white/10'
            }`}>
              <div className="flex flex-col">
                <span className={`font-mono text-[10px] tracking-[0.2em] uppercase mb-1 ${
                  isLight ? 'text-gray-400' : 'text-white/30'
                }`}>
                  {t('verify.officialGrade')}
                </span>
                <div className={`font-['Nunito',sans-serif] text-5xl md:text-6xl lg:text-7xl leading-none font-[900] tracking-tight ${
                  isLight ? 'text-gray-950' : 'text-white'
                }`}>
                  {activeCard.grade.toFixed(1)}
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-1 pb-1">
                <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-[#16A34A] dark:text-[#48C765] font-bold">
                  {activeCard.gradeLabel}
                </span>
                <span className={`font-mono text-[10px] tracking-[0.1em] max-w-xs md:text-right ${
                  isLight ? 'text-gray-500' : 'text-[#A4ACA1]'
                }`}>
                  Authenticated by {activeCard.verifier}
                </span>
              </div>
            </div>

            {/* 3. Subgrades (Editorial List) */}
            <div className={`py-5 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
              <span className={`block font-mono text-[10px] tracking-[0.2em] uppercase mb-3 ${
                isLight ? 'text-gray-400' : 'text-white/30'
              }`}>
                {language === 'es' ? 'Análisis Óptico (Sub-Grados)' : 'Optical Analysis (Sub-Grades)'}
              </span>
              
              <div className="flex flex-col gap-2">
                {[
                  { label: t('verify.subCentering'), score: activeCard.subgrades.centering.score, desc: activeCard.subgrades.centering.frontRatio.split(',')[0] },
                  { label: t('verify.subCorners'), score: activeCard.subgrades.corners.score, desc: '90° DIE CUT' },
                  { label: t('verify.subEdges'), score: activeCard.subgrades.edges.score, desc: 'NO WHITENING' },
                  { label: t('verify.subSurface'), score: activeCard.subgrades.surface.score, desc: 'SPECULAR OK' }
                ].map((sub, i) => (
                  <div key={i} className="flex items-center justify-between py-1 group">
                    <div className="flex items-baseline gap-4 w-1/3">
                      <span className={`font-mono text-[11px] tracking-[0.2em] uppercase font-semibold ${
                        isLight ? 'text-gray-900' : 'text-white'
                      }`}>{sub.label}</span>
                    </div>
                    
                    <div className={`hidden sm:block flex-1 border-b mx-6 border-dashed transition-colors ${
                      isLight ? 'border-gray-200 group-hover:border-emerald-600/50' : 'border-white/10 group-hover:border-[#48C765]/50'
                    }`} />
                    
                    <div className="flex items-center justify-end gap-6 w-1/2 sm:w-1/3">
                      <span className={`font-mono text-[9px] tracking-widest uppercase truncate text-right ${
                        isLight ? 'text-gray-500' : 'text-[#A4ACA1]'
                      }`}>
                        {sub.desc}
                      </span>
                      <span className={`font-['Nunito',sans-serif] text-base font-[900] w-10 text-right ${
                        isLight ? 'text-gray-950' : 'text-white'
                      }`}>
                        {sub.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Population Census */}
            <div className={`py-5 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
              <div className="grid grid-cols-3 gap-6">
                <div className="flex flex-col gap-1">
                  <span className={`font-mono text-[9px] tracking-[0.2em] uppercase ${
                    isLight ? 'text-gray-400' : 'text-white/30'
                  }`}>Total Graded</span>
                  <span className={`font-['Nunito',sans-serif] text-base font-[900] ${
                    isLight ? 'text-gray-950' : 'text-white'
                  }`}>{activeCard.population.totalGraded}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`font-mono text-[9px] tracking-[0.2em] uppercase ${
                    isLight ? 'text-gray-400' : 'text-white/30'
                  }`}>Higher Grade</span>
                  <span className={`font-['Nunito',sans-serif] text-base font-[900] ${
                    isLight ? 'text-gray-950' : 'text-white'
                  }`}>{activeCard.population.higherCount}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`font-mono text-[9px] tracking-[0.2em] uppercase ${
                    isLight ? 'text-gray-400' : 'text-white/30'
                  }`}>Equal Grade</span>
                  <span className={`font-['Nunito',sans-serif] text-base font-[900] ${
                    isLight ? 'text-gray-950' : 'text-white'
                  }`}>{activeCard.population.equalCount}</span>
                </div>
              </div>
            </div>

            {/* 5. Defect Inspector (Full Width Module) */}
            <div className="mt-5">
              <DefectInspector card={activeCard} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
