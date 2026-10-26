import { and, asc, eq, inArray, lte, sql } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { emailOutbox } from '../../db/schema.js';
import { renderContactEmail } from '../email/contact-notice.js';
import { renderOrderEmail } from '../email/order-notice.js';
import { mailAvailable, type SendMail } from '../email/transport.js';

const MAX_ATTEMPTS = 5;
/** Tiempo que se reserva una fila mientras se envía; si la función muere, otra pasada la recupera. */
const CLAIM_MS = 5 * 60_000;
const RETRY_BASE_MS = 5 * 60_000;

export type DeliveryResult = { sent: number; failed: number };

/**
 * Envía los emails pendientes de la cola. Es seguro llamarla desde varios sitios a la vez:
 * cada fila se reserva antes de enviarla. Los fallos se reintentan con espera creciente.
 */
export async function deliverPendingEmails(
  db: Db,
  send: SendMail,
  opts: { now?: Date; limit?: number } = {},
): Promise<DeliveryResult> {
  const now = opts.now ?? new Date();
  const limit = opts.limit ?? 20;

  const due = db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(and(inArray(emailOutbox.status, ['pending', 'sending']), lte(emailOutbox.nextAttemptAt, now)))
    .orderBy(asc(emailOutbox.createdAt))
    .limit(limit)
    .for('update', { skipLocked: true });

  const claimed = await db
    .update(emailOutbox)
    .set({
      status: 'sending',
      attempts: sql`${emailOutbox.attempts} + 1`,
      nextAttemptAt: new Date(now.getTime() + CLAIM_MS),
    })
    .where(inArray(emailOutbox.id, due))
    .returning();

  const result: DeliveryResult = { sent: 0, failed: 0 };
  for (const row of claimed) {
    try {
      const render = row.template.startsWith('contact_') ? renderContactEmail : renderOrderEmail;
      await send(render(row.template, row.locale, row.toEmail, row.data as Record<string, unknown>));
      await db.update(emailOutbox).set({ status: 'sent', sentAt: new Date(), lastError: null }).where(eq(emailOutbox.id, row.id));
      result.sent += 1;
    } catch (error) {
      const message = (error instanceof Error ? error.message : String(error)).slice(0, 500);
      const giveUp = row.attempts >= MAX_ATTEMPTS;
      await db
        .update(emailOutbox)
        .set({
          status: giveUp ? 'failed' : 'pending',
          lastError: message,
          nextAttemptAt: new Date(now.getTime() + RETRY_BASE_MS * row.attempts ** 2),
        })
        .where(eq(emailOutbox.id, row.id));
      result.failed += 1;
    }
  }
  return result;
}

/** Intenta enviar la cola justo después de una acción. Nunca rompe la petición: lo que falle se reintenta luego. */
export async function flushOutbox(deps: { getDb: () => Db; sendMail: SendMail }): Promise<void> {
  if (!mailAvailable()) return;
  try {
    await deliverPendingEmails(deps.getDb(), deps.sendMail);
  } catch (error) {
    console.error('[email] no se pudo vaciar la cola', error);
  }
}
