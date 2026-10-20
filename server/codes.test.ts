import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { contactMessages, orders, slabs } from '../db/schema.js';
import { CERTIFICATE_NUMBER, CODE_ALPHABET, ORDER_CODE, SLAB_SERIAL, TICKET_CODE } from '../shared/codes.js';
import { newCertificateNumber, newOrderCode, newTicketCode, slabSerialFor } from './codes.js';
import { createTestDb, insertGradedOrder, insertTier, insertUser, type TestDb } from './testing.js';

describe('generadores de códigos', () => {
  it('todos empiezan por GGI- y cumplen su formato', () => {
    for (let i = 0; i < 200; i++) {
      expect(newOrderCode()).toMatch(ORDER_CODE);
      expect(newTicketCode()).toMatch(TICKET_CODE);
      expect(newCertificateNumber()).toMatch(CERTIFICATE_NUMBER);
    }
    expect(newOrderCode().startsWith('GGI-ORD-')).toBe(true);
    expect(newTicketCode().startsWith('GGI-TKT-')).toBe(true);
    expect(newCertificateNumber().startsWith('GGI-')).toBe(true);
  });

  it('el alfabeto no tiene caracteres que se confundan (0, O, 1, I)', () => {
    for (const c of ['0', 'O', '1', 'I']) expect(CODE_ALPHABET).not.toContain(c);
    for (let i = 0; i < 500; i++) expect(newOrderCode().slice('GGI-ORD-'.length)).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });

  it('los códigos de pedido no se repiten en una muestra grande', () => {
    const codes = new Set(Array.from({ length: 5000 }, newOrderCode));
    expect(codes.size).toBe(5000);
  });

  it('el serial del slab lleva los dígitos de su certificado', () => {
    expect(slabSerialFor('GGI-774102')).toBe('GGI-SLB-774102');
    expect(slabSerialFor(newCertificateNumber())).toMatch(SLAB_SERIAL);
  });
});

describe('la base de datos rechaza códigos que no empiecen por GGI-', () => {
  let db: TestDb;
  beforeAll(async () => {
    db = await createTestDb();
  });

  const owner = async () => insertUser(db, `u${Math.random().toString(36).slice(2)}@example.com`);

  it('pedidos', async () => {
    const { id } = await owner();
    for (const bad of ['GG-ORD-7K4M9Q', 'ORD-7K4M9Q', 'GGI-ORD-7K4M9', 'GGI-ORD-7K4M9QX', 'ggi-ord-7k4m9q', 'GGI-XXX-7K4M9Q']) {
      await expect(db.insert(orders).values({ code: bad, userId: id })).rejects.toThrow();
    }
    await expect(db.insert(orders).values({ code: 'GGI-ORD-7K4M9Q', userId: id })).resolves.toBeDefined();
  });

  it('tickets de contacto', async () => {
    const row = { name: 'Ana', email: 'ana@example.com', subject: 'Hola', message: 'Hola' };
    await expect(db.insert(contactMessages).values({ ...row, ticket: 'GG-TKT-3FX8RB' })).rejects.toThrow();
    await expect(db.insert(contactMessages).values({ ...row, ticket: 'GGI-TKT-3FX8RB' })).resolves.toBeDefined();
  });

  it('certificados y serial del slab', async () => {
    const ana = await owner();
    const grader = await insertUser(db, `g${Math.random().toString(36).slice(2)}@example.com`, 'grader');
    const qa = await insertUser(db, `q${Math.random().toString(36).slice(2)}@example.com`, 'qa');
    const tier = await insertTier(db);
    const common = { ownerId: ana.id, tierId: tier.id, graderId: grader.id, qaId: qa.id, grade: 10 };

    // Número de certificado con formato antiguo o con letras: rechazado.
    await expect(insertGradedOrder(db, { ...common, orderCode: 'GGI-ORD-AAAAA2', certNumber: 'GG-123456', cardName: 'Carta A' })).rejects.toThrow();
    await expect(insertGradedOrder(db, { ...common, orderCode: 'GGI-ORD-AAAAA3', certNumber: 'GGI-12AB56', cardName: 'Carta B' })).rejects.toThrow();
    await expect(insertGradedOrder(db, { ...common, orderCode: 'GGI-ORD-AAAAA4', certNumber: 'GGI-123456', cardName: 'Carta C' })).resolves.toBeDefined();

    const [slab] = await db.select().from(slabs);
    expect(slab.serial).toBe('GGI-SLB-123456');
    await expect(db.execute(sql`update slabs set serial = 'GG-123456'`)).rejects.toThrow();
  });
});
