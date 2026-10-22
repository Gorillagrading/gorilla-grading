import React, { useEffect, useState } from 'react';
import { DefectInspector } from '../components/common/DefectInspector';
import { CertificateStatusBanner } from '../components/common/CertificateStatusBanner';
import { CertificatePrint } from '../components/common/CertificatePrint';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ApiError } from '../api/client';
import { channelFromUrl, fetchCertificate, type PublicCertificate } from '../api/certificates';
import { cardYear } from '../utils/cardDisplay';
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
  certId: string;
}

export const CertificateDetailPage: React.FC<CertificateDetailPageProps> = ({ 
  onNavigate, 
  certId 
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { language } = useLanguage();
  const es = language === 'es';
  const [copied, setCopied] = useState(false);
  const [card, setCard] = useState<PublicCertificate | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    fetchCertificate(certId, channelFromUrl())
      .then((found) => {
        if (cancelled) return;
        setCard(found);
        setState('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setCard(null);
        setState(err instanceof ApiError && err.status === 404 ? 'not_found' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [certId]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (state !== 'ready' || !card) {
    const title =
      state === 'loading' ? (es ? 'Consultando el registro…' : 'Checking the registry…')
      : state === 'not_found' ? (es ? 'Certificado no encontrado' : 'Certificate not found')
      : (es ? 'No se pudo consultar el registro' : 'Could not check the registry');
    const text =
      state === 'loading' ? ''
      : state === 'not_found'
        ? (es ? `No existe ningún certificado con el número ${certId.toUpperCase()}. Comprueba que lo has escrito bien.` : `There is no certificate with number ${certId.toUpperCase()}. Check that you typed it correctly.`)
        : (es ? 'Inténtalo de nuevo en unos minutos.' : 'Please try again in a few minutes.');
    return (
      <div className={`max-w-xl mx-auto px-4 py-24 text-center flex flex-col items-center gap-4 ${isLight ? 'text-gray-900' : 'text-slate-100'}`} aria-busy={state === 'loading'}>
        <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
        {text && <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{text}</p>}
        {state !== 'loading' && (
          <button type="button" onClick={() => onNavigate('/verify')} className="btn-gorilla-square px-6 py-3 text-xs font-extrabold tracking-normal cursor-pointer">
            {es ? 'Ir al verificador de certificados' : 'Go to the certificate verifier'}
          </button>
        )}
      </div>
    );
  }

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

      <CertificateStatusBanner certificate={card} onNavigate={onNavigate} />

      {/* Versión para imprimir: una hoja A4 propia, solo visible en papel. */}
      <CertificatePrint card={card} lang={es ? 'es' : 'en'} />

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
              {/* Solo los datos que se conocen: un año 0 o un número vacío no se muestran. */}
              {[
                cardYear(card.year),
                card.set || null,
                card.cardNumber ? `#${card.cardNumber}` : null,
                card.language ? `${card.game} (${card.language})` : card.game,
              ]
                .filter((part): part is string => !!part)
                .map((part, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className={`mx-2 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>•</span>}
                    <strong className={isLight ? 'text-gray-950 font-black' : 'text-white'}>{part}</strong>
                  </React.Fragment>
                ))}
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
              <button
                type="button"
                onClick={() => onNavigate('/grading-scale')}
                className="mt-2 text-[10px] underline underline-offset-4 cursor-pointer text-emerald-600 dark:text-emerald-400"
              >
                {es ? 'Cómo se calcula la nota' : 'How the grade is calculated'}
              </button>
            </div>

            <div className={`border-l pl-4 sm:pl-5 text-right font-mono text-[11px] sm:text-xs space-y-1.5 ${
              isLight ? 'border-gray-300 text-gray-700' : 'border-white/15 text-gray-300'
            }`}>
              <div>{es ? 'Centrado' : 'Centering'}: <strong className="text-emerald-600 dark:text-emerald-400 font-black ml-1">{card.subgrades.centering.score.toFixed(1)}</strong></div>
              <div>{es ? 'Esquinas' : 'Corners'}: <strong className="text-emerald-600 dark:text-emerald-400 font-black ml-1">{card.subgrades.corners.score.toFixed(1)}</strong></div>
              <div>{es ? 'Bordes' : 'Edges'}: <strong className="text-emerald-600 dark:text-emerald-400 font-black ml-1">{card.subgrades.edges.score.toFixed(1)}</strong></div>
              <div>{es ? 'Superficie' : 'Surface'}: <strong className="text-emerald-600 dark:text-emerald-400 font-black ml-1">{card.subgrades.surface.score.toFixed(1)}</strong></div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: 3D Slab + Optical Defect Inspector */}
      <div className="grid grid-cols-1 gap-8 items-start">
        <div className="space-y-8 relative z-0">
          <DefectInspector card={card} large />

          {/* Firma del registro */}
          <div 
            className={`p-6 border space-y-3 font-mono text-xs shadow-md ${
              isLight ? 'border-gray-200' : 'border-white/10'
            }`}
            style={{ backgroundColor: isLight ? '#FFFFFF' : '#0E120E' }}
          >
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              <span>{card.signature ? (es ? 'FIRMA DIGITAL DEL REGISTRO' : 'DIGITAL SIGNATURE OF THE RECORD') : (es ? 'REGISTRO DE CERTIFICACIÓN' : 'CERTIFICATION RECORD')}</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
              {card.signature
                ? (es
                    ? 'El registro de este certificado está firmado con Ed25519. Cualquiera puede comprobar la firma con la clave pública del laboratorio.'
                    : 'The record of this certificate is signed with Ed25519. Anyone can check the signature with the laboratory public key.')
                : (es
                    ? 'Este certificado figura en el registro público de Gorilla Grading. Todavía no incluye firma digital.'
                    : 'This certificate is listed in the Gorilla Grading public registry. It does not include a digital signature yet.')}
            </p>
            {card.signature && (
              <div 
                className={`p-3 border text-[10px] break-all font-mono ${
                  isLight ? 'border-gray-200 text-gray-700' : 'border-white/10 text-gray-400'
                }`}
                style={{ backgroundColor: isLight ? '#F9FAF9' : '#070907' }}
              >
                ED25519: {card.signature}
                {card.keyId && <div className="mt-1 opacity-70">KEY: {card.keyId}</div>}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

