import { sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { contactMessages } from '../db/schema.js';
import { TICKET_CODE } from '../shared/codes.js';
import { createTestApp, createTestDb, type TestDb } from './testing.js';

const read = (res: Response) => res.json() as Promise<any>;

let db: TestDb;
let t: ReturnType<typeof createTestApp>;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(sql`truncate users, contact_messages, email_outbox, rate_limit_events restart identity cascade`);
  t = createTestApp(db);
});

const message = (over: Record<string, unknown> = {}) => ({
  name: 'Carla Cliente',
  email: 'Carla@Example.com',
  subject: 'order',
  orderCode: '284 719 365',
  message: 'Hola,\n¿cuándo llega mi pedido? <b>gracias</b>',
  locale: 'es',
  ...over,
});

const send = (body: unknown, ip = '203.0.113.20') =>
  t.app.request('/api/v1/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

describe('formulario de contacto', () => {
  it('guarda el mensaje con un ticket de 7 cifras y avisa al equipo y al cliente', async () => {
    const res = await send(message());
    expect(res.status).toBe(201);
    const { ticket } = await read(res);
    expect(ticket).toMatch(TICKET_CODE);

    const [row] = await db.select().from(contactMessages);
    expect(row).toMatchObject({ ticket, name: 'Carla Cliente', email: 'carla@example.com', subject: 'order', orderCode: '284719365', status: 'open' });

    const team = t.mails.find((m) => m.to === 'info@gorillagrading.com')!;
    expect(team.replyTo).toBe('carla@example.com');
    expect(team.subject).toContain(ticket);
    expect(team.subject).toContain('Estado de un pedido');
    expect(team.text).toContain('¿cuándo llega mi pedido?');
    expect(team.text).toContain('284719365');
    // El texto del cliente se escapa en el HTML.
    expect(team.html).toContain('&lt;b&gt;gracias&lt;/b&gt;');
    expect(team.html).not.toContain('<b>gracias</b>');

    const customer = t.mails.find((m) => m.to === 'carla@example.com')!;
    expect(customer.subject).toBe(`Hemos recibido tu mensaje · ticket ${ticket}`);
    expect(customer.replyTo).toBeUndefined();
  });

  it('la confirmación sale en el idioma del cliente', async () => {
    await send(message({ locale: 'en', orderCode: undefined }));
    const customer = t.mails.find((m) => m.to === 'carla@example.com')!;
    expect(customer.subject).toMatch(/^We received your message · ticket \d{7}$/);
  });

  it('el buzón del equipo se puede cambiar con CONTACT_INBOX', async () => {
    process.env.CONTACT_INBOX = 'soporte@gorillagrading.com';
    try {
      await send(message());
      expect(t.mails.map((m) => m.to)).toContain('soporte@gorillagrading.com');
    } finally {
      delete process.env.CONTACT_INBOX;
    }
  });

  it('rechaza mensajes incompletos o con un correo que no es válido', async () => {
    for (const bad of [message({ name: '' }), message({ message: '   ' }), message({ email: 'no-es-un-correo' }), message({ subject: 'spam' })]) {
      expect((await send(bad)).status).toBe(422);
    }
    expect(await db.select().from(contactMessages)).toHaveLength(0);
    expect(t.mails).toHaveLength(0);
  });

  it('un robot que rellena el campo trampa no guarda nada ni envía correos', async () => {
    const res = await send(message({ website: 'http://spam.example' }));
    expect(res.status).toBe(201);
    expect(await db.select().from(contactMessages)).toHaveLength(0);
    expect(t.mails).toHaveLength(0);
  });

  it('permite 5 mensajes por hora desde la misma IP', async () => {
    for (let i = 0; i < 5; i++) expect((await send(message())).status).toBe(201);
    expect((await send(message())).status).toBe(429);
    expect((await send(message(), '203.0.113.21')).status).toBe(201);
  });
});
