import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { emailOutbox } from '../db/schema.js';
import { deliverPendingEmails, flushOutbox } from './domain/outbox.js';
import { renderOrderEmail } from './email/order-notice.js';
import type { Mail } from './email/transport.js';
import { createTestDb, type TestDb } from './testing.js';

let db: TestDb;
const T0 = new Date('2026-10-21T10:00:00Z');
const MIN = 60_000;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(sql`truncate email_outbox restart identity cascade`);
});

const enqueue = (over: Partial<typeof emailOutbox.$inferInsert> = {}) =>
  db
    .insert(emailOutbox)
    .values({
      toEmail: 'ana@example.com',
      template: 'order_shipped',
      locale: 'es',
      data: { orderCode: 'GGI-ORD-ABC123', label: 'Devolución en camino', description: 'Tus cartas salen hacia ti.' },
      nextAttemptAt: T0,
      ...over,
    })
    .returning()
    .then((rows) => rows[0]);

describe('cola de emails', () => {
  it('envía los pendientes y los marca como enviados', async () => {
    const row = await enqueue();
    const sent: Mail[] = [];
    const result = await deliverPendingEmails(db, async (m) => void sent.push(m), { now: T0 });

    expect(result).toEqual({ sent: 1, failed: 0 });
    expect(sent[0]).toMatchObject({ to: 'ana@example.com', subject: 'Devolución en camino · GGI-ORD-ABC123' });
    const [after] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, row.id));
    expect(after).toMatchObject({ status: 'sent', attempts: 1, lastError: null });
    expect(after.sentAt).not.toBeNull();
  });

  it('no envía dos veces lo ya enviado ni lo que todavía no toca', async () => {
    await enqueue();
    await enqueue({ nextAttemptAt: new Date(T0.getTime() + 10 * MIN) });
    const sent: Mail[] = [];
    const send = async (m: Mail) => void sent.push(m);

    await deliverPendingEmails(db, send, { now: T0 });
    await deliverPendingEmails(db, send, { now: T0 });
    expect(sent).toHaveLength(1);
  });

  it('si el envío falla, reintenta más tarde con espera creciente', async () => {
    const row = await enqueue();
    const fail = async () => {
      throw new Error('SMTP caído');
    };

    expect(await deliverPendingEmails(db, fail, { now: T0 })).toEqual({ sent: 0, failed: 1 });
    let [after] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, row.id));
    expect(after).toMatchObject({ status: 'pending', attempts: 1, lastError: 'SMTP caído' });
    expect(after.nextAttemptAt.getTime()).toBe(T0.getTime() + 5 * MIN);

    // Aún no toca reintentar.
    expect(await deliverPendingEmails(db, fail, { now: new Date(T0.getTime() + MIN) })).toEqual({ sent: 0, failed: 0 });

    // Segundo intento: espera de 20 minutos.
    const t1 = new Date(T0.getTime() + 6 * MIN);
    await deliverPendingEmails(db, fail, { now: t1 });
    [after] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, row.id));
    expect(after.attempts).toBe(2);
    expect(after.nextAttemptAt.getTime()).toBe(t1.getTime() + 20 * MIN);
  });

  it('tras cinco intentos fallidos lo da por fallido', async () => {
    const row = await enqueue({ attempts: 4 });
    await deliverPendingEmails(db, async () => Promise.reject(new Error('rechazado')), { now: T0 });
    const [after] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, row.id));
    expect(after).toMatchObject({ status: 'failed', attempts: 5, lastError: 'rechazado' });
  });

  it('recupera un email que quedó reservado porque la función se cortó', async () => {
    const row = await enqueue({ status: 'sending', attempts: 1, nextAttemptAt: new Date(T0.getTime() - MIN) });
    const sent: Mail[] = [];
    await deliverPendingEmails(db, async (m) => void sent.push(m), { now: T0 });
    expect(sent).toHaveLength(1);
    const [after] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, row.id));
    expect(after).toMatchObject({ status: 'sent', attempts: 2 });
  });

  it('flushOutbox nunca lanza error aunque el envío falle', async () => {
    const row = await enqueue();
    await expect(
      flushOutbox({
        getDb: () => db,
        sendMail: async () => {
          throw new Error('boom');
        },
      }),
    ).resolves.toBeUndefined();
    const [after] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, row.id));
    expect(after.status).toBe('pending');
  });
});

describe('textos de los emails', () => {
  it('pedido registrado, en español y en inglés', () => {
    const data = { orderCode: 'GGI-ORD-ABC123', itemCount: 3, totalCents: 3350 };
    const es = renderOrderEmail('order_submitted', 'es', 'a@b.c', data);
    expect(es.subject).toBe('Hemos registrado tu pedido GGI-ORD-ABC123');
    expect(es.text).toContain('3 cartas');
    expect(es.text).toMatch(/33,50\s€/);

    const en = renderOrderEmail('order_submitted', 'en', 'a@b.c', data);
    expect(en.subject).toBe('We registered your order GGI-ORD-ABC123');
    expect(en.text).toContain('3 cards');
  });

  it('los cambios de estado usan el título y la descripción ya traducidos', () => {
    const mail = renderOrderEmail('order_package_received', 'en', 'a@b.c', {
      orderCode: 'GGI-ORD-ABC123',
      label: 'Package received in the vault',
      description: 'We received your package.',
    });
    expect(mail.subject).toBe('Package received in the vault · GGI-ORD-ABC123');
    expect(mail.text).toContain('We received your package.');
    expect(mail.text).toContain('Order GGI-ORD-ABC123');
  });
});

describe('email de salida con certificados', () => {
  const shipped = (over: Record<string, unknown> = {}) =>
    renderOrderEmail('order_shipped', 'es', 'a@b.c', {
      orderCode: 'GGI-ORD-ABC123',
      label: 'Devolución en camino',
      description: 'Tus cartas salen hacia ti con envío asegurado y firma.',
      carrier: 'GLS',
      trackingNumber: 'ES-GLS-1',
      cards: [
        { position: 1, cardName: 'Charizard <Holo>', authentic: true, number: 'GGI-43713700', grade: 9.5, label: 'Mint+ 9.5' },
        { position: 2, cardName: 'Pikachu falso', authentic: false },
      ],
      ...over,
    });

  it('lleva cada certificado con su nota y un enlace directo, el seguimiento y las cartas sin certificado', () => {
    const mail = shipped();
    expect(mail.subject).toBe('Devolución en camino · GGI-ORD-ABC123');
    for (const body of [mail.text, mail.html!]) {
      expect(body).toContain('GGI-43713700');
      expect(body).toContain('https://gorilla-grading.vercel.app/certificates/GGI-43713700');
      expect(body).toContain('9,5');
      expect(body).toContain('Mint+ 9.5');
      expect(body).toContain('ES-GLS-1');
      expect(body).toContain('Pikachu falso');
      expect(body).toContain('https://gorilla-grading.vercel.app/track?code=GGI-ORD-ABC123');
    }
  });

  it('escapa los nombres de las cartas en el HTML', () => {
    const { html } = shipped();
    expect(html).toContain('Charizard &lt;Holo&gt;');
    expect(html).not.toContain('Charizard <Holo>');
  });

  it('usa el dominio que se configure', () => {
    process.env.PUBLIC_BASE_URL = 'gorillagrading.com/';
    try {
      expect(shipped().text).toContain('https://gorillagrading.com/certificates/GGI-43713700');
    } finally {
      delete process.env.PUBLIC_BASE_URL;
    }
  });

  it('sin certificados (otros estados) no añade esa sección', () => {
    const mail = renderOrderEmail('order_delivered', 'en', 'a@b.c', { orderCode: 'GGI-ORD-ABC123', label: 'Delivered', description: 'Order delivered.' });
    expect(mail.text).not.toContain('Your certificates');
    expect(mail.html).toContain('View my order');
  });
});
