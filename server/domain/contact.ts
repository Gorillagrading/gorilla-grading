import type { Db } from '../../db/client.js';
import { contactMessages, emailOutbox } from '../../db/schema.js';
import { normalizeCode } from '../../shared/codes.js';
import type { ContactBody } from '../../shared/contact.js';
import { newTicketCode } from '../codes.js';

const MAX_TICKET_ATTEMPTS = 10;

/** Buzón del equipo que recibe los mensajes. Por defecto, info@gorillagrading.com. */
export const contactInbox = () => process.env.CONTACT_INBOX?.trim() || 'info@gorillagrading.com';

/**
 * Guarda el mensaje con un número de ticket y encola dos correos: el aviso al equipo (con
 * "responder a" el cliente) y la confirmación al cliente con su número de ticket.
 */
export async function submitContactMessage(db: Db, body: ContactBody, userId: string | null): Promise<{ ticket: string }> {
  const orderCode = body.orderCode ? normalizeCode(body.orderCode) || null : null;

  return db.transaction(async (tx) => {
    // El ticket es aleatorio; si choca con uno existente, se prueba otro.
    let row: { ticket: string } | undefined;
    for (let attempt = 0; attempt < MAX_TICKET_ATTEMPTS && !row; attempt++) {
      [row] = await tx
        .insert(contactMessages)
        .values({ ticket: newTicketCode(), userId, name: body.name, email: body.email, subject: body.subject, message: body.message, orderCode })
        .onConflictDoNothing({ target: contactMessages.ticket })
        .returning({ ticket: contactMessages.ticket });
    }
    if (!row) throw new Error('No se pudo generar un número de ticket libre');

    const data = { ticket: row.ticket, name: body.name, email: body.email, subject: body.subject, orderCode, message: body.message };
    await tx.insert(emailOutbox).values([
      { dedupeKey: `contact:${row.ticket}:team`, toEmail: contactInbox(), template: 'contact_received', locale: 'es', data },
      { dedupeKey: `contact:${row.ticket}:customer`, toEmail: body.email, template: 'contact_confirmation', locale: body.locale, data },
    ]);
    return { ticket: row.ticket };
  });
}
