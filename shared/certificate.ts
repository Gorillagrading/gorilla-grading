/**
 * Contrato de la verificación pública de un certificado. Solo tipos.
 * Es público: no incluye el valor declarado, ni al dueño, ni el pedido, ni sus fotos privadas.
 */
import type { GradedCardDto } from './account.js';
import type { CertificateStatus } from './domain.js';

export type VerificationChannel = 'web' | 'qr' | 'nfc';

export type PublicCertificateDto = Omit<GradedCardDto, 'declaredValueEur'> & {
  /** Un certificado revocado o sustituido se sigue mostrando, con su estado. */
  status: CertificateStatus;
  issuedAt: string;
  revokedAt: string | null;
  /** Número del certificado que lo sustituye, si fue sustituido. */
  supersededBy: string | null;
  /** Firma Ed25519 del registro. Null hasta que se emitan certificados firmados (Fase 7). */
  signature: string | null;
  keyId: string | null;
  /** Registro exacto que se firmó. Con la clave pública de /certificates/keys cualquiera puede verificar la firma. Null en certificados sin firmar. */
  signedRecord: Record<string, unknown> | null;
};
