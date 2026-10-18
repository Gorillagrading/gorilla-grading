import React, { useState } from 'react';
import { MOCK_GRADED_CARDS } from '../data/mockCards';
import { SlabCard } from '../components/common/SlabCard';
import { DefectInspector } from '../components/common/DefectInspector';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShieldCheck, 
  Printer, 
  Share2, 
  ArrowLeft, 
  Award,
  CheckCircle2,
  Calendar,
  Lock
} from 'lucide-react';

interface CertificateDetailPageProps {
  onNavigate: (path: string) => void;
  certId?: string;
}

export const CertificateDetailPage: React.FC<CertificateDetailPageProps> = ({ 
  onNavigate, 
  certId = 'GGI-892401' 
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const card = MOCK_GRADED_CARDS.find(c => c.certNumber === certId) || MOCK_GRADED_CARDS[0];

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-10 ${
      isLight ? 'text-gray-900' : 'text-slate-100'
    }`}>
      
      {/* Top Bar Navigation */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b ${
        isLight ? 'border-gray-200' : 'border-white/10'
      }`}>
        <button
          type="button"
          onClick={() => {
            if (onNavigate) {
              onNavigate(`/verify?cert=${card.certNumber}`);
            } else {
              window.location.href = `/verify?cert=${card.certNumber}`;
            }
          }}
          className={`inline-flex items-center gap-2 text-xs font-mono transition-colors cursor-pointer ${
            isLight ? 'text-gray-600 hover:text-emerald-600' : 'text-gray-400 hover:text-emerald-400'
          }`}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="truncate">{language === 'es' ? 'Volver al Registro de Certificados' : 'Back to Certificate Registry Search'}</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleCopyLink}
            className={`flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isLight 
                ? 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50 shadow-xs' 
                : 'bg-[#151A15] border-white/15 text-gray-200 hover:bg-white/10'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{copied ? (language === 'es' ? '¡Enlace Copiado!' : 'Link Copied!') : (language === 'es' ? 'Compartir Certificado' : 'Share Cert')}</span>
          </button>

          <button
            onClick={() => window.print()}
            className={`flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isLight 
                ? 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50 shadow-xs' 
                : 'bg-[#151A15] border-white/15 text-gray-200 hover:bg-white/10'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{language === 'es' ? 'Imprimir Dossier' : 'Print Dossier'}</span>
          </button>
        </div>
      </div>

      {/* Official Certificate Header Plaque — Solid High-Contrast Luxury Design */}
      <div 
        className={`p-5 sm:p-7 lg:p-9 border shadow-xl relative overflow-hidden ${
          isLight 
            ? 'border-gray-300/80 shadow-[0_15px_35px_rgba(0,0,0,0.06)]' 
            : 'border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)]'
        }`}
        style={{ backgroundColor: isLight ? '#FFFFFF' : '#0D110D' }}
      >
        {/* Subtle Architectural Corner Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 relative z-10">
          
          <div className="space-y-3 sm:space-y-4 max-w-3xl">
            {/* Editorial Kicker — Clean typography, zero boxes, zero blinking dots */}
            <div className={`flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.16em] sm:tracking-[0.2em] ${
              isLight ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <span className={`font-black ${isLight ? 'text-gray-950' : 'text-white'}`}>
                {language === 'es' ? 'DOSSIER OFICIAL DE CERTIFICACIÓN' : 'OFFICIAL LABORATORY DOSSIER'}
              </span>
              <span className={isLight ? 'text-gray-300' : 'text-white/20'}>/</span>
              <span>
                CERT: <strong className={`font-mono font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{card.certNumber}</strong>
              </span>
              <span className={isLight ? 'text-gray-300' : 'text-white/20'}>/</span>
              <span>
                {language === 'es' ? 'EMISIÓN' : 'ISSUED'}: <strong className={`font-mono font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{card.certDate}</strong>
              </span>
            </div>

            {/* Specimen Main Name */}
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight leading-tight title-3d break-words ${
              isLight ? 'text-gray-950' : 'text-white'
            }`}>
              {card.name}
            </h1>

            {/* Card Metadata — Clean, sharp, high contrast */}
            <p className={`text-xs sm:text-sm font-mono tracking-wide leading-relaxed ${
              isLight ? 'text-gray-700' : 'text-gray-300'
            }`}>
              <strong className={isLight ? 'text-gray-950 font-black' : 'text-white'}>{card.year}</strong>
              <span className={`mx-2 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>•</span>
              <strong className={isLight ? 'text-gray-950 font-black' : 'text-white'}>{card.set}</strong>
              <span className={`mx-2 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>•</span>
              <strong className={isLight ? 'text-gray-950 font-black' : 'text-white'}>#{card.cardNumber}</strong>
              <span className={`mx-2 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>•</span>
              <span>{card.game} ({card.language})</span>
            </p>

            {/* Clear Metrology Laboratory Authority Row */}
            <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono pt-1 leading-normal ${
              isLight ? 'text-gray-700' : 'text-gray-400'
            }`}>
              <span>{language === 'es' ? 'Autoridad de Laboratorio:' : 'Laboratory Authority:'}</span>
              <strong className={`font-bold underline decoration-emerald-500/50 underline-offset-4 ${
                isLight ? 'text-gray-950' : 'text-slate-100'
              }`}>
                {card.verifier}
              </strong>
            </div>
          </div>

          {/* Solid Sculpted Grade Emblem Plaque */}
          <div 
            className={`p-4 sm:p-6 border-2 shadow-xl flex items-center justify-between sm:justify-start gap-4 sm:gap-6 w-full lg:w-auto shrink-0 ${
              isLight 
                ? 'border-emerald-600/30 text-gray-950 shadow-md' 
                : 'border-emerald-500/40 text-white shadow-[0_15px_35px_rgba(0,0,0,0.6)]'
            }`}
            style={{ backgroundColor: isLight ? '#F8FAF8' : '#070A07' }}
          >
            <div className="text-center font-mono">
              <div className={`text-[10px] uppercase tracking-[0.16em] font-extrabold ${
                isLight ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {language === 'es' ? 'CALIFICACIÓN' : 'FINAL GRADE'}
              </div>
              <div className="text-4xl sm:text-5xl font-display font-black text-emerald-600 dark:text-emerald-400 leading-none my-2 drop-shadow-sm">
                {card.grade.toFixed(1)}
              </div>
              <div className={`text-xs font-black uppercase tracking-wider ${
                isLight ? 'text-gray-950' : 'text-white'
              }`}>
                {card.gradeLabel}
              </div>
            </div>

            <div className={`border-l pl-4 sm:pl-5 text-right font-mono text-[11px] sm:text-xs space-y-1.5 ${
              isLight ? 'border-gray-300 text-gray-700' : 'border-white/15 text-gray-300'
            }`}>
              <div>Centering: <strong className="text-emerald-600 dark:text-emerald-400 font-black ml-1">{card.subgrades.centering.score.toFixed(1)}</strong></div>
              <div>Corners: <strong className="text-emerald-600 dark:text-emerald-400 font-black ml-1">{card.subgrades.corners.score.toFixed(1)}</strong></div>
              <div>Edges: <strong className="text-emerald-600 dark:text-emerald-400 font-black ml-1">{card.subgrades.edges.score.toFixed(1)}</strong></div>
              <div>Surface: <strong className="text-emerald-600 dark:text-emerald-400 font-black ml-1">{card.subgrades.surface.score.toFixed(1)}</strong></div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: 3D Slab + Optical Defect Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* On mobile: relative positioning in normal flow. On desktop: sticky top-24 alongside the inspector */}
        <div className="lg:col-span-5 flex justify-center relative lg:sticky lg:top-24 z-10">
          <SlabCard card={card} size="md" />
        </div>

        <div className="lg:col-span-7 space-y-8 relative z-0">
          <DefectInspector card={card} />

          {/* Tamper Proof Security & NFC Record */}
          <div 
            className={`p-6 border space-y-3 font-mono text-xs shadow-md ${
              isLight ? 'border-gray-200' : 'border-white/10'
            }`}
            style={{ backgroundColor: isLight ? '#FFFFFF' : '#0E120E' }}
          >
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              <span>{language === 'es' ? 'INTEGRIDAD DE REGISTRO CRIPTOGRÁFICO' : 'CRYPTOGRAPHIC LEDGER INTEGRITY'}</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
              {language === 'es' 
                ? 'Esta carta fue autenticada mediante análisis de longitud de onda espectral no destructivo y encapsulada en acrílico hermético por ultrasonido. El hash criptográfico coincide con el registro central internacional.'
                : 'This card was authenticated using non-destructive spectral wavelength analysis and encapsulated in an ultrasonic hermetic acrylic case. The unique security hash matches the international central vault ledger.'}
            </p>
            <div 
              className={`p-3 border text-[10px] break-all font-mono ${
                isLight ? 'border-gray-200 text-gray-700' : 'border-white/10 text-gray-400'
              }`}
              style={{ backgroundColor: isLight ? '#F9FAF9' : '#070907' }}
            >
              SHA256: {card.securityHash}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

