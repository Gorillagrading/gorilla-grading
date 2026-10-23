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
    // Con ~1.000 millones de códigos posibles, 5.000 al azar chocan por casualidad una de cada ~170 veces.
    expect(codes.size).toBeGreaterThanOrEqual(4995);
  });

  it('los certificados tienen 8 dígitos, con ceros a la izquierda cuando toca, y no se repiten', () => {
    const numbers = Array.from({ length: 3000 }, newCertificateNumber);
    expect(numbers.every((n) => /^GGI-[0-9]{8}$/.test(n))).toBe(true);
    // Con 100 millones de combinaciones, 3.000 al azar chocan una de cada ~20 veces: se tolera un choque.
    expect(new Set(numbers).size).toBeGreaterThanOrEqual(2999);
    // Un número de 8 dígitos al azar empieza por 0 una de cada diez veces: no se pierden esos ceros.
    expect(numbers.some((n) => n.startsWith('GGI-0'))).toBe(true);
  });

  it('el serial del slab lleva los dígitos de su certificado', () => {
    expect(slabSerialFor('GGI-77410200')).toBe('GGI-SLB-77410200');
    expect(slabSerialFor('GGI-00000007')).toBe('GGI-SLB-00000007');
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
    await expect(insertGradedOrder(db, { ...common, orderCode: 'GGI-ORD-AAAAA3', certNumber: 'GGI-12AB5600', cardName: 'Carta B' })).rejects.toThrow();
    // El formato de 6 dígitos ya no vale: la base de datos solo admite 8.
    await expect(insertGradedOrder(db, { ...common, orderCode: 'GGI-ORD-AAAAA5', certNumber: 'GGI-123456', cardName: 'Carta D' })).rejects.toThrow();
    await expect(insertGradedOrder(db, { ...common, orderCode: 'GGI-ORD-AAAAA6', certNumber: 'GGI-123456789', cardName: 'Carta E' })).rejects.toThrow();
    await expect(insertGradedOrder(db, { ...common, orderCode: 'GGI-ORD-AAAAA4', certNumber: 'GGI-12345600', cardName: 'Carta C' })).resolves.toBeDefined();

    const [slab] = await db.select().from(slabs);
    expect(slab.serial).toBe('GGI-SLB-12345600');
    await expect(db.execute(sql`update slabs set serial = 'GG-12345600'`)).rejects.toThrow();
    await expect(db.execute(sql`update slabs set serial = 'GGI-SLB-123456'`)).rejects.toThrow();
  });
});
