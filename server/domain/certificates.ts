import type { Db } from '../../db/client.js';
import { certificateChecks } from '../../db/schema.js';
import { hashIp } from '../auth/crypto.js';
import { CERTIFICATE_NUMBER, normalizeCode } from '../../shared/codes.js';
import type { PublicCertificateDto, VerificationChannel } from '../../shared/certificate.js';
import type { ObjectStorage } from '../storage.js';
import { loadCards } from './vault.js';

/**
 * Entiende lo que la persona escribe o lo que trae el QR: 48271936, "4827 1936" o "4827-1936".
 * La funda lleva el mismo número que el certificado. También acepta el formato antiguo con
 * prefijo (GGI-48271936, GGI-SLB-48271936). Devuelve null si no puede ser un certificado.
 */
export function parseCertificateQuery(raw: string): string | null {
  const s = normalizeCode(raw.toUpperCase()).replace(/^GGI(SLB)?/, '');
  return CERTIFICATE_NUMBER.test(s) ? s : null;
}

/**
 * Datos públicos de un certificado, o null si no existe. Cada consulta con un número válido
 * se registra (aunque no exista) para poder detectar abusos o intentos de adivinar números.
 */
export async function findPublicCertificate(
  db: Db,
  rawQuery: string,
  visit: { channel: VerificationChannel; ip: string | null; userAgent: string | null },
  storage?: ObjectStorage,
): Promise<PublicCertificateDto | null> {
  const number = parseCertificateQuery(rawQuery);
  if (!number) return null;

  const [found] = await loadCards(db, { number, activeOnly: false }, storage);
  await logCheck(db, number, found?.certificate.id ?? null, visit);
  if (!found) return null;

  const { declaredValueEur: _owner, ...card } = found.card;
  const cert = found.certificate;
  // El registro firmado es el payload sin las rutas privadas de las fotos.
  const { images: _images, ...signedRecord } = (cert.payload ?? {}) as Record<string, unknown>;
  return {
    ...card,
    status: cert.status,
    issuedAt: cert.issuedAt.toISOString(),
    revokedAt: cert.revokedAt?.toISOString() ?? null,
    supersededBy: found.supersededByNumber,
    signature: cert.signature,
    keyId: cert.keyId,
    signedRecord: cert.signature ? signedRecord : null,
  };
}

async function logCheck(
  db: Db,
  queried: string,
  certificateId: string | null,
  visit: { channel: VerificationChannel; ip: string | null; userAgent: string | null },
) {
  // Solo se guardan números de certificado válidos: nunca texto libre del visitante.
  if (!CERTIFICATE_NUMBER.test(queried)) return;
  await db.insert(certificateChecks).values({
    certificateNumber: queried,
    certificateId,
    channel: visit.channel,
    ipHash: visit.ip ? hashIp(visit.ip) : null,
    userAgent: visit.userAgent?.slice(0, 255) ?? null,
  });
}
