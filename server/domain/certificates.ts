import { eq } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { certificateChecks, certificates, slabs } from '../../db/schema';
import { hashIp } from '../auth/crypto';
import { CERTIFICATE_NUMBER, SLAB_SERIAL } from '../../shared/codes';
import type { PublicCertificateDto, VerificationChannel } from '../../shared/certificate';
import { loadCards } from './vault';

type Lookup = { kind: 'number' | 'serial'; value: string };

/**
 * Entiende lo que la persona escribe o lo que trae el QR: GGI-892401, ggi-892401, GGI892401,
 * 892401 o el serial del slab (GGI-SLB-892401). Devuelve null si no puede ser un certificado.
 */
export function parseCertificateQuery(raw: string): Lookup | null {
  const s = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (/^\d{6}$/.test(s)) return { kind: 'number', value: `GGI-${s}` };
  const serial = /^GGI-?SLB-?(\d{6})$/.exec(s);
  if (serial) return { kind: 'serial', value: `GGI-SLB-${serial[1]}` };
  const number = /^GGI-?(\d{6})$/.exec(s);
  if (number) return { kind: 'number', value: `GGI-${number[1]}` };
  return null;
}

/**
 * Datos públicos de un certificado, o null si no existe. Cada consulta con un número válido
 * se registra (aunque no exista) para poder detectar abusos o intentos de adivinar números.
 */
export async function findPublicCertificate(
  db: Db,
  rawQuery: string,
  visit: { channel: VerificationChannel; ip: string | null; userAgent: string | null },
): Promise<PublicCertificateDto | null> {
  const lookup = parseCertificateQuery(rawQuery);
  if (!lookup) return null;

  let number = lookup.value;
  if (lookup.kind === 'serial') {
    const [row] = await db
      .select({ number: certificates.number })
      .from(slabs)
      .innerJoin(certificates, eq(certificates.slabId, slabs.id))
      .where(eq(slabs.serial, lookup.value))
      .limit(1);
    if (!row) {
      await logCheck(db, lookup.value, null, visit);
      return null;
    }
    number = row.number;
  }

  const [found] = await loadCards(db, { number, activeOnly: false });
  await logCheck(db, lookup.value, found?.certificate.id ?? null, visit);
  if (!found) return null;

  const { declaredValueEur: _owner, ...card } = found.card;
  const cert = found.certificate;
  return {
    ...card,
    status: cert.status,
    issuedAt: cert.issuedAt.toISOString(),
    revokedAt: cert.revokedAt?.toISOString() ?? null,
    supersededBy: found.supersededByNumber,
    signature: cert.signature,
    keyId: cert.keyId,
  };
}

async function logCheck(
  db: Db,
  queried: string,
  certificateId: string | null,
  visit: { channel: VerificationChannel; ip: string | null; userAgent: string | null },
) {
  // Los dos formatos válidos son los únicos que se guardan: nunca texto libre del visitante.
  if (!CERTIFICATE_NUMBER.test(queried) && !SLAB_SERIAL.test(queried)) return;
  await db.insert(certificateChecks).values({
    certificateNumber: queried,
    certificateId,
    channel: visit.channel,
    ipHash: visit.ip ? hashIp(visit.ip) : null,
    userAgent: visit.userAgent?.slice(0, 255) ?? null,
  });
}
