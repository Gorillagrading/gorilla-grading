import type { PublicCertificateDto, VerificationChannel } from '../../shared/certificate';
import type { PublicGradedCard } from '../types';
import { api } from './client';

/** Certificado público: la misma carta que ven los componentes, más su estado y firma. */
export type PublicCertificate = PublicGradedCard &
  Pick<PublicCertificateDto, 'status' | 'issuedAt' | 'revokedAt' | 'supersededBy' | 'signature' | 'keyId'>;

/** Verifica un certificado. Lanza `ApiError` con estado 404 si no existe. */
export const fetchCertificate = (query: string, via: VerificationChannel = 'web') =>
  api<{ certificate: PublicCertificateDto }>(`/certificates/${encodeURIComponent(query.trim())}?via=${via}`).then(
    (r) => r.certificate as PublicCertificate,
  );

/** Canal con el que se abrió la página: el QR y el chip NFC del slab añaden ?via=qr o ?via=nfc. */
export function channelFromUrl(): VerificationChannel {
  const via = new URLSearchParams(window.location.search).get('via');
  return via === 'qr' || via === 'nfc' ? via : 'web';
}
