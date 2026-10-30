import { createHash, randomBytes } from 'node:crypto';
import { asc, count, eq, sql } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { consents, emailOutbox, newsletterSubscriptions } from '../../db/schema.js';
import { NEWSLETTER_CONSENT_VERSION, type NewsletterBody, type NewsletterStatsDto } from '../../shared/newsletter.js';
import { ProblemError } from '../problem.js';

/** En la base solo se guarda el hash del enlace; el enlace completo solo va en el correo. */
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const invalidLink = () =>
  new ProblemError(404, 'Not Found', 'El enlace no es válido o ya se usó.', { code: 'newsletter_link_invalid' });

/**
 * Apunta un correo a la newsletter como pendiente y le envía el enlace de confirmación.
 * Si ya estaba confirmado no se hace nada, y la respuesta es la misma: así no se puede
 * averiguar quién está suscrito.
 */
export async function subscribe(db: Db, input: NewsletterBody, now = new Date()) {
  const token = randomBytes(24).toString('base64url');
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(newsletterSubscriptions)
      .where(sql`lower(${newsletterSubscriptions.email}) = ${input.email}`)
      .limit(1);
    if (existing?.status === 'confirmed') return;

    const values = {
      locale: input.locale,
      status: 'pending' as const,
      confirmTokenHash: hashToken(token),
      consentVersion: NEWSLETTER_CONSENT_VERSION,
      consentedAt: now,
      unsubscribedAt: null,
      updatedAt: now,
    };
    if (existing) await tx.update(newsletterSubscriptions).set(values).where(eq(newsletterSubscriptions.id, existing.id));
    else await tx.insert(newsletterSubscriptions).values({ email: input.email, ...values });

    await tx.insert(emailOutbox).values({
      dedupeKey: `newsletter:${input.email}:${now.getTime()}`,
      toEmail: input.email,
      template: 'newsletter_confirm',
      locale: input.locale,
      data: { token },
    });
  });
}

/** Confirma la suscripción desde el enlace del correo y deja constancia del consentimiento. */
export async function confirmSubscription(db: Db, token: string, now = new Date()) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.confirmTokenHash, hashToken(token)))
      .limit(1);
    if (!row || row.status === 'unsubscribed') throw invalidLink();
    if (row.status === 'confirmed') return;
    await tx
      .update(newsletterSubscriptions)
      .set({ status: 'confirmed', confirmedAt: now, updatedAt: now })
      .where(eq(newsletterSubscriptions.id, row.id));
    await tx.insert(consents).values({ email: row.email, kind: 'marketing', version: row.consentVersion, granted: true });
  });
}

/** Baja de la newsletter con el mismo enlace personal. */
export async function unsubscribe(db: Db, token: string, now = new Date()) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.confirmTokenHash, hashToken(token)))
      .limit(1);
    if (!row) throw invalidLink();
    if (row.status === 'unsubscribed') return;
    await tx
      .update(newsletterSubscriptions)
      .set({ status: 'unsubscribed', unsubscribedAt: now, updatedAt: now })
      .where(eq(newsletterSubscriptions.id, row.id));
    await tx.insert(consents).values({ email: row.email, kind: 'marketing', version: row.consentVersion, granted: false });
  });
}

/** Para la dirección: cuántos hay y la lista de confirmados, para exportarla a la herramienta de envíos. */
export async function newsletterStats(db: Db): Promise<NewsletterStatsDto> {
  const [counts, confirmed] = await Promise.all([
    db.select({ status: newsletterSubscriptions.status, n: count() }).from(newsletterSubscriptions).groupBy(newsletterSubscriptions.status),
    db
      .select({ email: newsletterSubscriptions.email, locale: newsletterSubscriptions.locale, confirmedAt: newsletterSubscriptions.confirmedAt })
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.status, 'confirmed'))
      .orderBy(asc(newsletterSubscriptions.confirmedAt)),
  ]);
  const n = (status: string) => counts.find((c) => c.status === status)?.n ?? 0;
  return {
    confirmed: n('confirmed'),
    pending: n('pending'),
    unsubscribed: n('unsubscribed'),
    subscribers: confirmed.map((s) => ({ email: s.email, locale: s.locale, confirmedAt: (s.confirmedAt ?? new Date(0)).toISOString() })),
  };
}
