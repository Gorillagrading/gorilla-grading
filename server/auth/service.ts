import { and, count, desc, eq, gt, gte, isNull, lt, max, sql } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { otpChallenges, sessions, users } from '../../db/schema';
import type { UserDto } from '../../shared/auth';
import { ProblemError, tooManyRequests } from '../problem';
import { hashIp, hashLoginCode, hashSessionToken, newLoginCode, newSessionToken, safeEqual } from './crypto';

export const CODE_TTL_MS = 10 * 60_000;
export const MAX_ATTEMPTS = 5;
export const SESSION_TTL_MS = 30 * 24 * 3600_000;
const RESEND_COOLDOWN_MS = 30_000;
const MAX_CODES_PER_EMAIL_PER_HOUR = 5;
const MAX_CODES_PER_IP_PER_HOUR = 20;
const LAST_SEEN_REFRESH_MS = 3600_000;

const emailIs = (email: string) => sql`lower(${otpChallenges.email}) = ${email}`;

const invalidCode = () =>
  new ProblemError(400, 'Invalid Code', 'El código no es válido o ha caducado.', { code: 'invalid_code' });

/**
 * Genera un código de acceso nuevo para un email y devuelve el código en claro para
 * enviarlo. En la base solo se guarda su HMAC. Los códigos anteriores sin usar dejan de valer.
 */
export async function issueLoginCode(
  db: Db,
  input: { email: string; ip: string | null },
  now = new Date(),
) {
  const ipHash = input.ip ? hashIp(input.ip) : null;
  const hourAgo = new Date(now.getTime() - 3600_000);

  const [byEmail] = await db
    .select({ n: count(), last: max(otpChallenges.createdAt) })
    .from(otpChallenges)
    .where(and(emailIs(input.email), gte(otpChallenges.createdAt, hourAgo)));

  if (byEmail.last) {
    const wait = byEmail.last.getTime() + RESEND_COOLDOWN_MS - now.getTime();
    if (wait > 0) throw tooManyRequests(Math.ceil(wait / 1000));
  }
  if (byEmail.n >= MAX_CODES_PER_EMAIL_PER_HOUR) throw tooManyRequests(15 * 60);

  if (ipHash) {
    const [byIp] = await db
      .select({ n: count() })
      .from(otpChallenges)
      .where(and(eq(otpChallenges.ipHash, ipHash), gte(otpChallenges.createdAt, hourAgo)));
    if (byIp.n >= MAX_CODES_PER_IP_PER_HOUR) throw tooManyRequests(15 * 60);
  }

  const code = newLoginCode();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);
  await db.transaction(async (tx) => {
    await tx
      .update(otpChallenges)
      .set({ consumedAt: now })
      .where(and(emailIs(input.email), isNull(otpChallenges.consumedAt)));
    await tx.insert(otpChallenges).values({
      email: input.email,
      codeHash: hashLoginCode(input.email, code),
      maxAttempts: MAX_ATTEMPTS,
      expiresAt,
      ipHash,
      createdAt: now,
    });
  });
  return { code, expiresAt };
}

/** Comprueba un código. Si es correcto crea la cuenta (si no existe) y una sesión nueva. */
export async function verifyLoginCode(
  db: Db,
  input: { email: string; code: string; ip: string | null; userAgent: string | null },
  now = new Date(),
) {
  const [challenge] = await db
    .select()
    .from(otpChallenges)
    .where(and(emailIs(input.email), isNull(otpChallenges.consumedAt), gt(otpChallenges.expiresAt, now)))
    .orderBy(desc(otpChallenges.createdAt))
    .limit(1);
  if (!challenge) throw invalidCode();

  // El intento se cuenta antes de comparar, en una sola operación, para que
  // peticiones simultáneas no puedan superar el máximo.
  const [attempt] = await db
    .update(otpChallenges)
    .set({ attempts: sql`${otpChallenges.attempts} + 1` })
    .where(
      and(
        eq(otpChallenges.id, challenge.id),
        isNull(otpChallenges.consumedAt),
        lt(otpChallenges.attempts, otpChallenges.maxAttempts),
      ),
    )
    .returning({ attempts: otpChallenges.attempts, maxAttempts: otpChallenges.maxAttempts });

  const lockedOut = () =>
    new ProblemError(429, 'Too Many Attempts', 'Demasiados intentos. Pide un código nuevo.', {
      code: 'too_many_attempts',
    });
  if (!attempt) throw lockedOut();

  if (!safeEqual(hashLoginCode(input.email, input.code), challenge.codeHash)) {
    const attemptsLeft = attempt.maxAttempts - attempt.attempts;
    if (attemptsLeft === 0) throw lockedOut();
    throw new ProblemError(400, 'Invalid Code', 'El código no es correcto.', {
      code: 'invalid_code',
      extensions: { attemptsLeft },
    });
  }

  const token = newSessionToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const user = await db.transaction(async (tx) => {
    const [used] = await tx
      .update(otpChallenges)
      .set({ consumedAt: now })
      .where(and(eq(otpChallenges.id, challenge.id), isNull(otpChallenges.consumedAt)))
      .returning({ id: otpChallenges.id });
    if (!used) throw invalidCode();

    const find = () =>
      tx
        .select()
        .from(users)
        .where(sql`lower(${users.email}) = ${input.email}`)
        .limit(1)
        .then((rows) => rows[0]);

    let found = await find();
    if (!found) {
      await tx.insert(users).values({ email: input.email, emailVerifiedAt: now }).onConflictDoNothing();
      found = await find();
    }
    if (found.deletedAt) throw invalidCode();
    if (!found.emailVerifiedAt) {
      await tx.update(users).set({ emailVerifiedAt: now }).where(eq(users.id, found.id));
    }

    await tx.insert(sessions).values({
      userId: found.id,
      tokenHash: hashSessionToken(token),
      expiresAt,
      userAgent: input.userAgent?.slice(0, 255) ?? null,
      ipHash: input.ip ? hashIp(input.ip) : null,
      createdAt: now,
      lastSeenAt: now,
    });
    return found;
  });

  return { user: toUserDto(user), token, expiresAt };
}

export function toUserDto(user: typeof users.$inferSelect): UserDto {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    locale: user.locale,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    customerCode: `GOR-${user.id.slice(0, 6).toUpperCase()}`,
  };
}

/** Usuario de una sesión válida (no caducada, no revocada) o null. */
export async function findSessionUser(db: Db, token: string, now = new Date()) {
  const [row] = await db
    .select({ user: users, sessionId: sessions.id, lastSeenAt: sessions.lastSeenAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, hashSessionToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);
  if (!row) return null;

  if (!row.lastSeenAt || now.getTime() - row.lastSeenAt.getTime() > LAST_SEEN_REFRESH_MS) {
    await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, row.sessionId));
  }
  return toUserDto(row.user);
}

export async function revokeSession(db: Db, token: string, now = new Date()) {
  await db
    .update(sessions)
    .set({ revokedAt: now })
    .where(and(eq(sessions.tokenHash, hashSessionToken(token)), isNull(sessions.revokedAt)));
}
