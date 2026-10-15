import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { MOCK_GRADED_CARDS } from '../../data/mockCards';
import { GradedCard } from '../../types';
import { VerifyLogo } from './VerifyLogo';
import { 
  ShieldCheck, 
  Search, 
  QrCode, 
  Radio, 
  ExternalLink, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  Cpu,
  Maximize2
} from 'lucide-react';

interface HomeVerificationModuleProps {
  onNavigate: (path: string) => void;
}

export const HomeVerificationModule: React.FC<HomeVerificationModuleProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [inputVal, setInputVal] = useState('');
  const [selectedCard, setSelectedCard] = useState<GradedCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const demoCodes = [
    { code: 'GG-892401', label: 'Charizard 1st Ed (10 GEM MINT)' },
    { code: 'GG-774102', label: 'Pikachu Illustrator (10 PRISTINE)' },
    { code: 'GG-652901', label: 'Umbreon VMAX (9.5 GEM MINT)' },
  ];

  const handleVerify = (codeToVerify?: string) => {
    const query = (codeToVerify || inputVal).trim().toUpperCase();
    if (!query) {
      setErrorMsg(language === 'es' ? 'Introduce un código de certificado.' : 'Enter a certificate ID.');
      return;
    }

    setIsSearching(true);
    setErrorMsg('');

    setTimeout(() => {
      const found = MOCK_GRADED_CARDS.find(
        c => c.certNumber.toUpperCase() === query || 
             c.certNumber.toUpperCase().replace('-', '') === query.replace('-', '') ||
             c.name.toUpperCase().includes(query)
      );

      if (found) {
        setSelectedCard(found);
        setInputVal(found.certNumber);
        setIsFlipped(false);
      } else {
        setErrorMsg(
          language === 'es'
            ? `No se encontró ningún registro para "${query}". Prueba con un código de demostración.`
            : `No certificate found matching "${query}". Try a demo code.`
        );
      }
      setIsSearching(false);
    }, 280);
  };

  const handleQuickDemo = (code: string) => {
    setInputVal(code);
    handleVerify(code);
  };

  const simulateScan = (type: 'QR' | 'NFC') => {
    setIsSearching(true);
    setErrorMsg('');
    setTimeout(() => {
      const card = type === 'NFC' ? MOCK_GRADED_CARDS[1] : MOCK_GRADED_CARDS[0];
      setSelectedCard(card);
      setInputVal(card.certNumber);
      setIsSearching(false);
    }, 400);
  };

  return (
    <section 
      id="verify-module"
      className={`relative w-full py-16 lg:py-24 px-5 lg:px-10 border-b select-none transition-colors duration-300 ${
        isLight 
          ? 'bg-white/40 backdrop-blur-md text-[#111827] border-[#E5E7EB]' 
          : 'bg-[#181B18]/40 backdrop-blur-md text-white border-white/[0.08]'
      }`}
    >
      {/* Background Subtle Precision Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(${isLight ? '#000000' : '#48C765'} 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto">
        
        {/* Module Header: Technical Lab Console Aesthetic */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          {/* Main Dedicated Gorilla Verify Sub-Brand Logo (Forensic Floating Shield) */}
          <div className="mb-6 sm:mb-8">
            <VerifyLogo size="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96" />
          </div>

          <h2 className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-gray-500 mb-4 sm:mb-5">
            <span>
              {language === 'es' 
                ? '[ EXPEDIENTE PÚBLICO DE VERIFICACIÓN · SERIE AUDITORÍA 2026 ]' 
                : '[ PUBLIC VERIFICATION REGISTRY · 2026 AUDIT SERIES ]'}
            </span>
          </h2>

          {/* Verification Features with Green Check Icon (Including Verify Certificate item) */}
          <div className="inline-flex flex-col items-start gap-2.5 sm:gap-3 text-left">
            {(language === 'es' ? [
              'Verificar Certificado.',
              'Consulta instantánea para compradores y vendedores del mercado secundario.',
              'Acceso al historial criptográfico.',
              'Datos de auditoría láser y escaneos master a 1200 DPI.'
            ] : [
              'Verify Certificate.',
              'Instant consultation for secondary market buyers and sellers.',
              'Access cryptographic history.',
              'Laser Audit data and 1200 DPI master scan.'
            ]).map((text, idx) => (
              <div key={idx} className="flex items-center gap-2.5 sm:gap-3">
                <img 
                  src="/images/verified-check.svg" 
                  alt="Verified" 
                  className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 object-contain" 
                />
                <span className={`font-sans text-xs sm:text-sm font-medium leading-relaxed ${
                  isLight ? 'text-gray-800' : 'text-neutral-100'
                }`}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Forensic Search Console */}
        <div className="max-w-3xl mx-auto mb-10">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleVerify(); }}
            className={`relative flex flex-col sm:flex-row items-stretch p-2 border shadow-lg transition-all duration-300 ${
              isLight 
                ? 'bg-white border-[#D1D5DB] focus-within:border-[#16A34A] focus-within:ring-2 focus-within:ring-[#16A34A]/20' 
                : 'bg-[#121512] border-white/15 focus-within:border-[#48C765] focus-within:ring-2 focus-within:ring-[#48C765]/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            }`}
          >
            {/* Input Icon */}
            <div className="hidden sm:flex items-center pl-3.5 pr-2">
              <Search className={`w-5 h-5 ${isLight ? 'text-gray-400' : 'text-[#48C765]'}`} />
            </div>

            {/* Central Forensic Input */}
            <input 
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="E.G. GG-892401"
              className={`flex-1 w-full bg-transparent px-3 py-3.5 sm:py-3 font-mono text-sm sm:text-base tracking-[0.18em] uppercase font-bold outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:font-normal ${
                isLight 
                  ? 'text-[#111827] placeholder-gray-400' 
                  : 'text-white placeholder-white/30'
              }`}
            />

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSearching}
              className="btn-gorilla-pill mt-2 sm:mt-0 px-6 sm:px-8 py-3.5 sm:py-3 text-xs font-bold tracking-normal uppercase flex items-center justify-center gap-2 shrink-0 shadow-lg"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'es' ? 'CONSULTANDO...' : 'VERIFYING...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>{language === 'es' ? 'CONSULTAR REGISTRO PÚBLICO' : 'VERIFY CERTIFICATE'}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Access Badges (QR, NFC & Demo Seeds) */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-mono text-[10px] uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                {language === 'es' ? 'Códigos demo:' : 'Demo codes:'}
              </span>
              {demoCodes.map(d => (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => handleQuickDemo(d.code)}
                  className={`chip-forensic ${inputVal === d.code ? 'active' : ''}`}
                >
                  {d.code}
                </button>
              ))}
            </div>

            {/* Direct QR & NFC Access Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => simulateScan('QR')}
                className="chip-forensic"
                title={language === 'es' ? 'Simular escaneo de código QR' : 'Simulate QR code scan'}
              >
                <QrCode className="w-3.5 h-3.5 text-[#48C765]" />
                <span>QR SCAN</span>
              </button>

              <button
                type="button"
                onClick={() => simulateScan('NFC')}
                className="chip-forensic"
                title={language === 'es' ? 'Simular lectura de chip NFC' : 'Simulate NFC chip reading'}
              >
                <Cpu className="w-3.5 h-3.5 text-[#48C765]" />
                <span>CHIP NFC</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-3 p-3 border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Live Interactive Technical Sheet Mockup (Previsualización de resultado en tiempo real) */}
        {selectedCard && (
          <div className={`mt-8 border shadow-xl overflow-hidden transition-all duration-300 ${
            isLight 
              ? 'bg-white border-[#E5E7EB]' 
              : 'bg-[#141714] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
          }`}>
            
            {/* Spec Sheet Top Console Bar */}
            <div className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-4 font-mono text-xs ${
              isLight ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-white/[0.03] border-white/10 text-white/70'
            }`}>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#16A34A] tracking-wider text-[11px]">
                  {language === 'es' ? '[REGISTRO ACTIVO]' : '[ACTIVE REGISTRY]'}
                </span>
                <span className="font-bold tracking-wider text-current">
                  CERT // {selectedCard.certNumber}
                </span>
                <span className="hidden sm:inline opacity-40">|</span>
                <span className="hidden sm:inline text-[11px] opacity-80">
                  {selectedCard.verifier}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Clean, normal, non-generic forensic authenticity indicator */}
                <div className="flex items-center gap-1.5 text-[#16A34A] dark:text-[#4ADE80] font-mono text-xs font-bold tracking-wider select-none">
                  <img src="/images/verified-check.svg" alt="Verified" className="w-4 h-4 shrink-0" />
                  <span>{language === 'es' ? 'AUTENTICIDAD VERIFICADA' : 'AUTHENTICITY VERIFIED'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 border text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                    isLight 
                      ? 'border-gray-300 hover:border-[#16A34A] hover:text-[#16A34A] text-gray-700 bg-white' 
                      : 'border-white/15 hover:border-[#4ADE80] hover:text-[#4ADE80] text-gray-300 bg-transparent'
                  }`}
                >
                  <RotateCw className="w-3 h-3" />
                  <span>{isFlipped ? (language === 'es' ? 'Ver Anverso' : 'View Front') : (language === 'es' ? 'Ver Reverso' : 'View Back')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedCard(null); setInputVal(''); }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 border text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                    isLight 
                      ? 'border-gray-300 hover:border-red-400 hover:text-red-500 text-gray-500 bg-white' 
                      : 'border-white/15 hover:border-red-400 hover:text-red-400 text-gray-400 bg-transparent'
                  }`}
                  title={language === 'es' ? 'Cerrar resultado' : 'Close result'}
                >
                  <span>✕ {language === 'es' ? 'Cerrar' : 'Close'}</span>
                </button>
              </div>
            </div>

            {/* Spec Sheet Main Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              
              {/* Left Column: Slab / Card High-Res Visualizer */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center">
                <div className="relative group w-full max-w-[280px] sm:max-w-[320px] aspect-[2.5/3.5] flex items-center justify-center p-3 rounded-xl border border-white/20 bg-gradient-to-b from-white/10 via-white/5 to-transparent backdrop-blur-md shadow-2xl">
                  
                  {/* Acrylic Gloss Reflection */}
                  <div className="absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.12] to-transparent" />
                  
                  {/* Card Visual Content */}
                  <div className={`relative w-full h-full rounded-lg overflow-hidden flex flex-col items-center justify-between p-2.5 transition-colors ${
                    isLight ? 'bg-gray-100 border border-gray-300' : 'bg-black/40 border border-white/10'
                  }`}>
                    
                    {/* Slab Top Label Preview */}
                    <div className="w-full bg-white text-black p-2 rounded-t flex items-center justify-between shadow-md">
                      <div>
                        <div className="font-['Nunito',sans-serif] font-[900] text-xs tracking-wider uppercase text-black leading-tight">
                          GORILLA GRADING
                        </div>
                        <div className="font-mono text-[9px] text-gray-600 font-bold truncate max-w-[130px]">
                          {selectedCard.name}
                        </div>
                        <div className="font-mono text-[8px] text-gray-500">
                          {selectedCard.set} ({selectedCard.year})
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-['Nunito',sans-serif] font-[900] text-xl text-black leading-none">
                          {selectedCard.grade}
                        </div>
                        <div className="font-mono text-[8px] uppercase tracking-wider font-extrabold text-[#16A34A]">
                          {selectedCard.gradeLabel}
                        </div>
                      </div>
                    </div>

                    {/* Card Scan Image */}
                    <div className={`relative flex-1 w-full my-2 overflow-hidden rounded flex items-center justify-center transition-colors ${
                      isLight ? 'bg-white border border-gray-200' : 'bg-black/60'
                    }`}>
                      <img 
                        src={isFlipped ? selectedCard.backImage : selectedCard.frontImage}
                        alt={selectedCard.name}
                        className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] transition-all duration-300 group-hover:scale-105"
                      />

                      {/* Forensic Overlay Reticle */}
                      <div className="absolute inset-0 pointer-events-none border border-[#48C765]/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#48C765]/30" />
                        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#48C765]/30" />
                        <span className="absolute bottom-1 right-1 font-mono text-[8px] text-[#48C765] bg-black/80 px-1">
                          0.01mm OPTICAL GRID
                        </span>
                      </div>
                    </div>

                    {/* Ultrasonic Sealing Bar & NFC Emblem */}
                    <div className="w-full flex items-center justify-between font-mono text-[8px] text-white/60 px-1">
                      <span>35 kHz HERMETIC SEAL</span>
                      <span>NFC PROTECTED</span>
                    </div>

                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 font-mono text-[10px] text-gray-400">
                  <Maximize2 className="w-3 h-3 text-[#48C765]" />
                  <span>{language === 'es' ? 'Escaneo maestro óptico a 1200 DPI' : '1200 DPI Master Optical Scan'}</span>
                </div>
              </div>

              {/* Right Column: Detailed Forensic Dossier */}
              <div className="lg:col-span-8 flex flex-col justify-between">
                
                {/* 1. Header Information */}
                <div className="pb-5 border-b border-gray-200 dark:border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#48C765] uppercase">
                      {selectedCard.game} · {selectedCard.language}
                    </span>
                  </div>

                  <h3 className="font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] uppercase tracking-normal leading-tight">
                    {selectedCard.name}
                  </h3>
                  
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-gray-500 dark:text-gray-400">
                    <span><strong>Set:</strong> {selectedCard.set}</span>
                    <span>•</span>
                    <span><strong>{language === 'es' ? 'Año:' : 'Year:'}</strong> {selectedCard.year}</span>
                    <span>•</span>
                    <span><strong>{language === 'es' ? 'Número:' : 'Card #:'}</strong> {selectedCard.cardNumber}</span>
                    <span>•</span>
                    <span><strong>{language === 'es' ? 'Rareza:' : 'Rarity:'}</strong> {selectedCard.rarity}</span>
                    <span>•</span>
                    <span><strong>{language === 'es' ? 'Valor Declarado:' : 'Declared Value:'}</strong> {selectedCard.declaredValueEur.toLocaleString()} €</span>
                  </div>
                </div>

                {/* 2. Official Grade Banner */}
                <div className={`my-5 p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.02] border-white/10'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-none bg-[#48C765] text-[#0A0D0B] font-['Nunito',sans-serif] font-[900] text-3xl sm:text-4xl flex items-center justify-center shrink-0 shadow-lg">
                      {selectedCard.grade}
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-[#48C765] font-bold">
                        {language === 'es' ? 'GRADO OFICIAL GORILLA' : 'OFFICIAL GORILLA GRADE'}
                      </div>
                      <div className="font-['Nunito',sans-serif] text-xl sm:text-2xl font-[900] uppercase tracking-normal">
                        {selectedCard.gradeLabel}
                      </div>
                      <div className="font-sans text-xs text-gray-500 dark:text-gray-400">
                        {language === 'es' ? 'Escala forense de 10 puntos con subgrados métricos' : '10-point forensic scale with metric subgrades'}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right font-mono text-xs">
                    <div className="text-gray-400 text-[10px] uppercase tracking-wider">{language === 'es' ? 'INFORME DE POBLACIÓN' : 'POPULATION REPORT'}</div>
                    <div className="font-bold text-sm">POP {selectedCard.population.equalCount} / {selectedCard.population.higherCount} HIGHER</div>
                    <div className="text-gray-500 text-[11px]">{selectedCard.population.totalGraded} {language === 'es' ? 'totales en base de datos' : 'total in database'}</div>
                  </div>
                </div>

                {/* 3. Subgrades Breakdown Matrix */}
                <div className="mb-6">
                  <div className="font-mono text-[11px] uppercase tracking-widest font-bold mb-3 flex items-center justify-between">
                    <span className="text-gray-400">{language === 'es' ? 'DESGLOSE DE SUBNOTAS (SUBGRADES)' : 'SUBGRADES BREAKDOWN'}</span>
                    <span className="text-[#48C765]">{language === 'es' ? 'TOLERANCIA 0.01 mm' : '0.01 mm TOLERANCE'}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Centering */}
                    <div className={`p-3 border flex flex-col justify-between ${
                      isLight ? 'bg-white border-gray-200' : 'bg-white/[0.02] border-white/10'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] uppercase text-gray-400">CENTERING</span>
                        <span className="font-mono text-sm font-bold text-[#48C765]">
                          {selectedCard.subgrades.centering.score}
                        </span>
                      </div>
                      <div className="font-mono text-[9px] text-gray-500 truncate" title={selectedCard.subgrades.centering.frontRatio}>
                        {selectedCard.subgrades.centering.frontRatio}
                      </div>
                    </div>

                    {/* Corners */}
                    <div className={`p-3 border flex flex-col justify-between ${
                      isLight ? 'bg-white border-gray-200' : 'bg-white/[0.02] border-white/10'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] uppercase text-gray-400">CORNERS</span>
                        <span className="font-mono text-sm font-bold text-[#48C765]">
                          {selectedCard.subgrades.corners.score}
                        </span>
                      </div>
                      <div className="font-mono text-[9px] text-gray-500">
                        90° Micro-Die Cut
                      </div>
                    </div>

                    {/* Edges */}
                    <div className={`p-3 border flex flex-col justify-between ${
                      isLight ? 'bg-white border-gray-200' : 'bg-white/[0.02] border-white/10'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] uppercase text-gray-400">EDGES</span>
                        <span className="font-mono text-sm font-bold text-[#48C765]">
                          {selectedCard.subgrades.edges.score}
                        </span>
                      </div>
                      <div className="font-mono text-[9px] text-gray-500">
                        Zero Silvering
                      </div>
                    </div>

                    {/* Surface */}
                    <div className={`p-3 border flex flex-col justify-between ${
                      isLight ? 'bg-white border-gray-200' : 'bg-white/[0.02] border-white/10'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] uppercase text-gray-400">SURFACE</span>
                        <span className="font-mono text-sm font-bold text-[#48C765]">
                          {selectedCard.subgrades.surface.score}
                        </span>
                      </div>
                      <div className="font-mono text-[9px] text-gray-500">
                        Holo Foil Pristine
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Action Row & Public Registry Direct Link */}
                <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-gray-400">
                    <Hash className="w-3.5 h-3.5 text-[#48C765]" />
                    <span className="truncate max-w-[280px]" title={selectedCard.securityHash}>
                      SHA-256: {selectedCard.securityHash.slice(0, 24)}...
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => onNavigate(`/certificates/${selectedCard.certNumber}`)}
                      className="btn-gorilla-square w-full sm:w-auto px-6 py-3.5 text-xs font-bold tracking-normal uppercase inline-flex items-center justify-center gap-2.5 shadow-lg group cursor-pointer"
                    >
                      <span>{language === 'es' ? 'ESCANEO ALTA RESOLUCIÓN EN REGISTRO' : 'HIGH-RES SCAN IN REGISTRY'}</span>
                      <ExternalLink className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </section>
  );
};
