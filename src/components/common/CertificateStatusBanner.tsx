import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { PublicCertificate } from '../../api/certificates';

/**
 * Aviso para certificados que ya no son válidos. Verificar significa decir la verdad:
 * un certificado revocado o sustituido se sigue mostrando, pero con este aviso encima.
 * Un certificado activo no muestra nada.
 */
export const CertificateStatusBanner: React.FC<{
  certificate: Pick<PublicCertificate, 'status' | 'revokedAt' | 'supersededBy'>;
  onNavigate?: (path: string) => void;
}> = ({ certificate, onNavigate }) => {
  const { language } = useLanguage();
  const es = language === 'es';
  if (certificate.status === 'active') return null;

  const date = certificate.revokedAt
    ? new Date(certificate.revokedAt).toLocaleDateString(es ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-4 border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 font-mono text-xs leading-relaxed"
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1">
        <strong className="tracking-[0.15em] uppercase">
          {certificate.status === 'revoked'
            ? (es ? 'Certificado revocado' : 'Certificate revoked')
            : (es ? 'Certificado sustituido' : 'Certificate superseded')}
        </strong>
        <span>
          {certificate.status === 'revoked'
            ? (es
                ? `Este certificado ya no es válido${date ? ` desde el ${date}` : ''}. No debe usarse para comprar ni vender esta carta.`
                : `This certificate is no longer valid${date ? ` since ${date}` : ''}. Do not rely on it to buy or sell this card.`)
            : (es ? 'Este certificado fue reemplazado por uno nuevo.' : 'This certificate has been replaced by a newer one.')}
        </span>
        {certificate.supersededBy && (
          <button
            type="button"
            onClick={() => onNavigate?.(`/certificates/${certificate.supersededBy}`)}
            className="self-start underline underline-offset-4 cursor-pointer font-bold"
          >
            {es ? 'Ver el certificado vigente' : 'View the current certificate'}: {certificate.supersededBy}
          </button>
        )}
      </div>
    </div>
  );
};
