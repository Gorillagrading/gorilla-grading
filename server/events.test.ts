import { sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { events, orders } from '../db/schema.js';
import { createTestApp, createTestDb, insertAllTiers, insertEvent, insertUser, type TestDb } from './testing.js';

const read = (res: Response) => res.json() as Promise<any>;
const DAY = 86_400_000;

let db: TestDb;
let t: ReturnType<typeof createTestApp>;
const cookies = new Map<string, string>();

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(sql`truncate users, orders, events, service_tiers, otp_challenges, sessions, rate_limit_events, email_outbox restart identity cascade`);
  await insertAllTiers(db);
  cookies.clear();
  t = createTestApp(db);
  await insertUser(db, 'admin@lab.test', 'admin');
  await insertUser(db, 'staff@lab.test', 'staff');
  for (const email of ['admin@lab.test', 'staff@lab.test', 'cliente@example.com']) await loginAs(email);
});

async function loginAs(email: string) {
  await t.json('/api/v1/auth/otp', { email });
  const res = await t.json('/api/v1/auth/otp/verify', { email, code: t.sent.at(-1)!.code });
  cookies.set(email, res.headers.get('set-cookie')!.split(';')[0]);
}

const api = (path: string, email: string | null, init: { method?: string; body?: unknown } = {}) =>
  t.app.request(`/api/v1${path}`, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers: { ...(email ? { cookie: cookies.get(email)! } : {}), ...(init.body ? { 'content-type': 'application/json' } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

const inDays = (n: number, hour = 10) => {
  const d = new Date(Date.now() + n * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

const eventBody = (over: Record<string, unknown> = {}) => ({
  kind: 'fair', name: 'Salón del Cómic', city: 'Madrid', countryCode: 'ES', venue: 'IFEMA', address: 'Av. del Partenón 5',
  details: 'Stand 14', startsAt: inDays(10, 9), endsAt: inDays(10, 18), ...over,
});

const order = (over: Record<string, unknown> = {}) =>
  api('/orders', 'cliente@example.com', {
    body: {
      items: [{ tier: 'standard' }],
      shippingMethod: 'CARD_SHOW_DROPOFF',
      fullName: 'Carla Cliente',
      locale: 'es',
      clientToken: `token-${Math.random().toString(36).slice(2)}-0000`,
      acceptedTerms: true,
      ...over,
    },
  });

describe('calendario de eventos de la dirección', () => {
  it('la dirección crea, cambia y borra eventos; nadie más puede', async () => {
    const created = await api('/admin/events', 'admin@lab.test', { body: eventBody() });
    expect(created.status).toBe(201);
    const { id } = await read(created);

    expect((await api('/admin/events', 'staff@lab.test', { body: eventBody() })).status).toBe(403);
    expect((await api('/admin/events', 'cliente@example.com')).status).toBe(403);
    expect((await api('/admin/events', null)).status).toBe(401);

    expect((await api(`/admin/events/${id}`, 'admin@lab.test', { method: 'PUT', body: eventBody({ name: 'Salón del Cómic 2026' }) })).status).toBe(204);
    const list = await read(await api('/admin/events', 'admin@lab.test'));
    expect(list.events).toHaveLength(1);
    expect(list.events[0]).toMatchObject({ id, name: 'Salón del Cómic 2026', published: true, acceptsSubmissions: true, orderCount: 0 });

    expect((await api(`/admin/events/${id}`, 'admin@lab.test', { method: 'DELETE' })).status).toBe(204);
    expect(await db.select().from(events)).toHaveLength(0);
    expect((await api('/admin/events/no-existe', 'admin@lab.test', { method: 'DELETE' })).status).toBe(404);
  });

  it('rechaza un evento sin nombre o que termina antes de empezar', async () => {
    expect((await api('/admin/events', 'admin@lab.test', { body: eventBody({ name: ' ' }) })).status).toBe(422);
    expect((await api('/admin/events', 'admin@lab.test', { body: eventBody({ endsAt: inDays(9) }) })).status).toBe(422);
  });

  it('un evento que ya eligió algún pedido no se borra: se despublica', async () => {
    const event = await insertEvent(db);
    expect((await order({ eventId: event.id })).status).toBe(201);
    const res = await api(`/admin/events/${event.id}`, 'admin@lab.test', { method: 'DELETE' });
    expect(res.status).toBe(409);
    expect(await read(res)).toMatchObject({ code: 'event_has_orders' });
    expect((await read(await api('/admin/events', 'admin@lab.test'))).events[0].orderCount).toBe(1);
  });
});

describe('el cliente elige el evento antes de pagar', () => {
  it('solo ve los eventos publicados, que aceptan entregas y no han terminado, por fecha', async () => {
    const later = await insertEvent(db, { name: 'Feria de Lisboa', startsAt: new Date(inDays(20)), endsAt: new Date(inDays(20, 18)) });
    const soon = await insertEvent(db, { name: 'Salón de Madrid' });
    await insertEvent(db, { name: 'Borrador', published: false });
    await insertEvent(db, { name: 'Sin entregas', acceptsSubmissions: false });
    await insertEvent(db, { name: 'Pasado', startsAt: new Date(inDays(-3)), endsAt: new Date(inDays(-3, 18)) });

    const res = await t.app.request('/api/v1/events');
    expect(res.status).toBe(200);
    const { events: list } = await read(res);
    expect(list.map((e: any) => e.id)).toEqual([soon.id, later.id]);
    expect(list[0]).toMatchObject({ name: 'Salón de Madrid', venue: 'IFEMA, pabellón 3', address: 'Av. del Partenón 5' });
    expect(list[0]).not.toHaveProperty('published');
  });

  it('la entrega en mano exige un evento que siga abierto', async () => {
    expect((await order()).status).toBe(422);
    const closed = await insertEvent(db, { acceptsSubmissions: false });
    const res = await order({ eventId: closed.id });
    expect(res.status).toBe(422);
    expect(await read(res)).toMatchObject({ code: 'event_unavailable' });
    expect(await db.select().from(orders)).toHaveLength(0);

    const open = await insertEvent(db);
    const ok = await order({ eventId: open.id });
    expect(ok.status).toBe(201);
    const [row] = await db.select().from(orders);
    expect(row.eventId).toBe(open.id);
  });

  it('el correo de confirmación y el seguimiento le dicen dónde entregar las cartas', async () => {
    const event = await insertEvent(db);
    const { order: created } = await read(await order({ eventId: event.id }));

    const mail = t.mails.find((m) => m.subject.includes(created.code))!;
    expect(mail.text).toContain('Siguiente paso: entrega tus cartas en el evento');
    expect(mail.text).toContain('Salón del Cómic de Madrid');
    expect(mail.text).toContain('IFEMA, pabellón 3');
    expect(mail.text).toContain('Stand 14');
    expect(mail.text).toContain(`dile al equipo tu número de pedido ${created.code}`);

    const mine = await read(await api(`/tracking/${created.code}`, 'cliente@example.com'));
    expect(mine.tracking.handover).toMatchObject({ kind: 'dropoff', event: { id: event.id, name: 'Salón del Cómic de Madrid' } });
    // Quien no es el dueño no ve adónde va el pedido.
    expect((await read(await api(`/tracking/${created.code}`, null))).tracking.handover).toBeNull();
  });

  it('con mensajería, mientras no haya dirección del laboratorio, se le dice que se la enviaremos', async () => {
    const res = await order({
      shippingMethod: 'COURIER_INSURED',
      shippingAddress: { line1: 'Calle 1', city: 'Madrid', postalCode: '28001', countryCode: 'ES' },
    });
    const { order: created } = await read(res);
    const mail = t.mails.find((m) => m.subject.includes(created.code))!;
    expect(mail.text).toContain('Siguiente paso: envía tus cartas al laboratorio');
    expect(mail.text).toContain('Te enviaremos por correo la dirección exacta del laboratorio');
    const mine = await read(await api(`/tracking/${created.code}`, 'cliente@example.com'));
    expect(mine.tracking.handover).toEqual({ kind: 'ship', address: null });
  });
});
