import { cardYear, orDash, sideScores as formatSideScores } from '../utils/cardDisplay';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ApiError } from '../api/client';
import { channelFromUrl, fetchCertificate, type PublicCertificate } from '../api/certificates';
import { SlabCard } from '../components/common/SlabCard';
import { DefectInspector } from '../components/common/DefectInspector';
import { CertificateStatusBanner } from '../components/common/CertificateStatusBanner';
import { Search, ShieldCheck, ArrowRight } from 'lucide-react';
import { VerifyLogo } from '../components/luxury/VerifyLogo';

interface VerificationPageProps {
  onNavigate: (path: string) => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const es = language === 'es';

  // El buscador del menú envía ?id=; los enlaces de los certificados, ?cert=.
  const initialQuery = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('cert') || params.get('id') || '';
  };

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeCard, setActiveCard] = useState<PublicCertificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ kind: 'not_found' | 'rate_limited' | 'other'; query: string } | null>(null);

  const errorMsg = !error
    ? ''
    : error.kind === 'not_found'
      ? (es ? `No existe ningún certificado con el código "${error.query}".` : `No certificate exists with code "${error.query}".`)
      : error.kind === 'rate_limited'
        ? (es ? 'Demasiadas consultas seguidas. Espera unos minutos.' : 'Too many lookups in a row. Please wait a few minutes.')
        : (es ? 'No se pudo consultar el registro. Inténtalo de nuevo.' : 'Could not check the registry. Please try again.');

  const lookup = async (raw: string, via: 'web' | 'qr' | 'nfc') => {
    const query = raw.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const found = await fetchCertificate(query, via);
      setActiveCard(found);
      setSearchInput(found.certNumber);
      window.history.replaceState({}, '', `/verify?cert=${found.certNumber}`);
    } catch (err) {
      setActiveCard(null);
      setError({
        kind: err instanceof ApiError && err.status === 404 ? 'not_found' : err instanceof ApiError && err.status === 429 ? 'rate_limited' : 'other',
        query: query.toUpperCase(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Un QR, un chip NFC o un enlace traen el número en la dirección: se verifica al abrir.
  useEffect(() => {
    const initial = initialQuery();
    if (initial) void lookup(initial, channelFromUrl());
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void lookup(searchInput, 'web');
  };

  const sideScores = (s: { frontScore: number; backScore: number }) => formatSideScores(s, es);

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
              placeholder={language === 'es' ? 'INGRESE ID DE CERTIFICADO (EJ. GGI-XXXXXX)' : 'ENTER CERTIFICATE ID (E.G. GGI-XXXXXX)'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`w-full bg-transparent py-2 text-sm sm:text-base font-mono uppercase tracking-widest focus:outline-none placeholder:font-mono placeholder:text-xs sm:placeholder:text-sm ${
                isLight ? 'text-gray-950 placeholder:text-gray-400' : 'text-white placeholder:text-gray-500'
              }`}
            />

            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setError(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs px-2 py-1 font-mono uppercase mr-1 cursor-pointer"
                title={language === 'es' ? 'Limpiar búsqueda' : 'Clear search'}
              >
                ✕
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
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
                <SlabCard card={activeCard} size="md" variant="card-only" onInspect={() => onNavigate(`/certificates/${activeCard.certNumber}`)} />
              </div>
            </div>
            
            <button 
              onClick={() => onNavigate(`/certificates/${activeCard.certNumber}`)}
              className="btn-gorilla-square mx-auto mt-2 px-6 py-2.5 text-xs font-extrabold tracking-normal gap-2 shadow-md cursor-pointer"
            >
              <span>{language === 'es' ? 'Ver Dossier con Slab 3D' : 'View Dossier with 3D Slab'}</span>
              <span>→</span>
            </button>
          </div>

          {/* Right Column: Editorial Data Sheet */}
          <div className="lg:col-span-7 flex flex-col">
            
            <div className="mb-5 empty:hidden"><CertificateStatusBanner certificate={activeCard} onNavigate={onNavigate} /></div>

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
                  <span className={`text-xs font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{orDash(cardYear(activeCard.year))}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={isLight ? 'text-gray-400 text-[9px]' : 'text-white/30 text-[9px]'}>Set</span>
                  <span className={`text-xs font-semibold truncate ${isLight ? 'text-gray-900' : 'text-white'}`} title={activeCard.set}>{orDash(activeCard.set)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={isLight ? 'text-gray-400 text-[9px]' : 'text-white/30 text-[9px]'}>Card No.</span>
                  <span className={`text-xs font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{orDash(activeCard.cardNumber)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={isLight ? 'text-gray-400 text-[9px]' : 'text-white/30 text-[9px]'}>Rarity</span>
                  <div>
                    {activeCard.rarity ? (
                      <span className="badge-rarity-gold text-[9px] px-2 py-0.5">{activeCard.rarity}</span>
                    ) : (
                      <span className={`text-xs font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>—</span>
                    )}
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
                <button
                  type="button"
                  onClick={() => onNavigate('/grading-scale')}
                  className="font-mono text-[10px] tracking-[0.1em] underline underline-offset-4 cursor-pointer text-[#16A34A] dark:text-[#48C765]"
                >
                  {es ? 'Cómo se calcula la nota' : 'How the grade is calculated'}
                </button>
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
                  { label: t('verify.subCentering'), score: activeCard.subgrades.centering.score, desc: activeCard.subgrades.centering.frontRatio.split(',')[0] || '' },
                  { label: t('verify.subCorners'), score: activeCard.subgrades.corners.score, desc: sideScores(activeCard.subgrades.corners) },
                  { label: t('verify.subEdges'), score: activeCard.subgrades.edges.score, desc: sideScores(activeCard.subgrades.edges) },
                  { label: t('verify.subSurface'), score: activeCard.subgrades.surface.score, desc: sideScores(activeCard.subgrades.surface) }
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
