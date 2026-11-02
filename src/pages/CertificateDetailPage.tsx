import React, { useEffect, useState } from 'react';
import { GradingReport } from '../components/common/GradingReport';
import { CertificateStatusBanner } from '../components/common/CertificateStatusBanner';
import { CertificatePrint } from '../components/common/CertificatePrint';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ApiError } from '../api/client';
import { channelFromUrl, fetchCertificate, type PublicCertificate } from '../api/certificates';
import { Printer, Share2, ArrowLeft } from 'lucide-react';

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
    <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 ${
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
          aria-label={language === 'es' ? 'Volver al certificado' : 'Back to the certificate'}
          className="btn-gorilla-square group inline-flex w-full sm:w-auto items-center justify-center gap-2.5 px-5 py-3 text-xs sm:text-[13px] font-extrabold tracking-normal cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-1" strokeWidth={3} />
          <span className="truncate">{language === 'es' ? 'Volver al certificado' : 'Back to certificate'}</span>
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

      {/* Informe de gradeo: la hoja con el resultado de la carta */}
      <GradingReport card={card} onNavigate={onNavigate} />

    </div>
  );
};

