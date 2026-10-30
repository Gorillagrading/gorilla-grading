import { and, isNotNull, lt, or } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { certificateChecks, otpChallenges, rateLimitEvents, sessions } from '../../db/schema.js';

const DAY = 86_400_000;

/**
 * Plazos de conservación de los registros técnicos (propuestos a la asesoría legal el 2026-10-30).
 * La aceptación de términos y el registro de acciones del equipo no se borran aquí: se conservan
 * mientras dure la relación con el cliente y el plazo de prescripción que fije la asesoría.
 */
export const RETENTION = {
  /** Límites de uso: las ventanas son de 1 hora como mucho. */
  rateLimitDays: 7,
  /** Códigos de acceso: valen 10 minutos. */
  loginCodeDays: 30,
  /** Sesiones: desde que caducan o se cierran. */
  sessionDays: 90,
  /** Consultas de certificados: para detectar abusos y ver el uso del verificador. */
  certificateCheckDays: 365,
} as const;

/** Borra los registros técnicos que ya pasaron su plazo. Se ejecuta en la tarea diaria. */
export async function purgeExpiredRecords(db: Db, now = new Date()) {
  const before = (days: number) => new Date(now.getTime() - days * DAY);
  const count = async (q: Promise<unknown[]>) => (await q).length;

  return {
    rateLimitEvents: await count(
      db.delete(rateLimitEvents).where(lt(rateLimitEvents.createdAt, before(RETENTION.rateLimitDays))).returning({ id: rateLimitEvents.id }),
    ),
    loginCodes: await count(
      db.delete(otpChallenges).where(lt(otpChallenges.createdAt, before(RETENTION.loginCodeDays))).returning({ id: otpChallenges.id }),
    ),
    sessions: await count(
      db
        .delete(sessions)
        .where(
          or(
            lt(sessions.expiresAt, before(RETENTION.sessionDays)),
            and(isNotNull(sessions.revokedAt), lt(sessions.revokedAt, before(RETENTION.sessionDays))),
          ),
        )
        .returning({ id: sessions.id }),
    ),
    certificateChecks: await count(
      db.delete(certificateChecks).where(lt(certificateChecks.checkedAt, before(RETENTION.certificateCheckDays))).returning({ id: certificateChecks.id }),
    ),
  };
}
