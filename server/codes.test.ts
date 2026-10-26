import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { contactMessages, orders, slabs } from '../db/schema.js';
import { CERTIFICATE_NUMBER, ORDER_CODE, SLAB_SERIAL, TICKET_CODE, normalizeCode } from '../shared/codes.js';
import { newCertificateNumber, newOrderCode, newTicketCode, slabSerialFor } from './codes.js';
import { createTestDb, insertGradedOrder, insertTier, insertUser, type TestDb } from './testing.js';

describe('generadores de códigos', () => {
  it('todos son solo números, cada tipo con su longitud', () => {
    for (let i = 0; i < 200; i++) {
      expect(newOrderCode()).toMatch(ORDER_CODE);
      expect(newTicketCode()).toMatch(TICKET_CODE);
      expect(newCertificateNumber()).toMatch(CERTIFICATE_NUMBER);
    }
    expect(newOrderCode()).toHaveLength(9);
    expect(newTicketCode()).toHaveLength(7);
    expect(newCertificateNumber()).toHaveLength(8);
  });

  it('un pedido nunca tiene el formato de un certificado, ni al revés', () => {
    for (let i = 0; i < 200; i++) {
      expect(newOrderCode()).not.toMatch(CERTIFICATE_NUMBER);
      expect(newCertificateNumber()).not.toMatch(ORDER_CODE);
    }
  });

  it('los códigos de pedido no se repiten en una muestra grande', () => {
    const codes = new Set(Array.from({ length: 5000 }, newOrderCode));
    // Con 1.000 millones de códigos posibles, 5.000 al azar chocan por casualidad una de cada ~80 veces.
    expect(codes.size).toBeGreaterThanOrEqual(4995);
  });

  it('los certificados tienen 8 dígitos, con ceros a la izquierda cuando toca, y no se repiten', () => {
    const numbers = Array.from({ length: 3000 }, newCertificateNumber);
    expect(numbers.every((n) => /^[0-9]{8}$/.test(n))).toBe(true);
    // Con 100 millones de combinaciones, 3.000 al azar chocan una de cada ~20 veces: se tolera un choque.
    expect(new Set(numbers).size).toBeGreaterThanOrEqual(2999);
    // Un número de 8 dígitos al azar empieza por 0 una de cada diez veces: no se pierden esos ceros.
    expect(numbers.some((n) => n.startsWith('0'))).toBe(true);
  });

  it('el slab lleva el mismo número que su certificado', () => {
    expect(slabSerialFor('77410200')).toBe('77410200');
    expect(slabSerialFor(newCertificateNumber())).toMatch(SLAB_SERIAL);
  });

  it('entiende un código escrito con espacios, guiones o puntos', () => {
    expect(normalizeCode(' 284 719 365 ')).toBe('284719365');
    expect(normalizeCode('284-719-365')).toBe('284719365');
    expect(normalizeCode('4827.1936')).toBe('48271936');
  });
});

describe('la base de datos rechaza códigos con otro formato', () => {
  let db: TestDb;
  beforeAll(async () => {
    db = await createTestDb();
  });

  const owner = async () => insertUser(db, `u${Math.random().toString(36).slice(2)}@example.com`);

  it('pedidos', async () => {
    const { id } = await owner();
    for (const bad of ['GGI-ORD-7K4M9Q', '28471936', '2847193650', '28471936A', ' 284719365', 'ABCDEFGHJ']) {
      await expect(db.insert(orders).values({ code: bad, userId: id })).rejects.toThrow();
    }
    await expect(db.insert(orders).values({ code: '284719365', userId: id })).resolves.toBeDefined();
  });

  it('tickets de contacto', async () => {
    const row = { name: 'Ana', email: 'ana@example.com', subject: 'Hola', message: 'Hola' };
    await expect(db.insert(contactMessages).values({ ...row, ticket: 'GGI-TKT-3FX8RB' })).rejects.toThrow();
    await expect(db.insert(contactMessages).values({ ...row, ticket: '395820' })).rejects.toThrow();
    await expect(db.insert(contactMessages).values({ ...row, ticket: '3958201' })).resolves.toBeDefined();
  });

  it('certificados y número del slab', async () => {
    const ana = await owner();
    const grader = await insertUser(db, `g${Math.random().toString(36).slice(2)}@example.com`, 'grader');
    const qa = await insertUser(db, `q${Math.random().toString(36).slice(2)}@example.com`, 'qa');
    const tier = await insertTier(db);
    const common = { ownerId: ana.id, tierId: tier.id, graderId: grader.id, qaId: qa.id, grade: 10 };

    // Formato antiguo con prefijo, letras o una longitud distinta de 8: rechazado.
    await expect(insertGradedOrder(db, { ...common, orderCode: '100000002', certNumber: 'GGI-12345600', cardName: 'Carta A' })).rejects.toThrow();
    await expect(insertGradedOrder(db, { ...common, orderCode: '100000003', certNumber: '12AB5600', cardName: 'Carta B' })).rejects.toThrow();
    await expect(insertGradedOrder(db, { ...common, orderCode: '100000005', certNumber: '123456', cardName: 'Carta D' })).rejects.toThrow();
    await expect(insertGradedOrder(db, { ...common, orderCode: '100000006', certNumber: '123456789', cardName: 'Carta E' })).rejects.toThrow();
    await expect(insertGradedOrder(db, { ...common, orderCode: '100000004', certNumber: '12345600', cardName: 'Carta C' })).resolves.toBeDefined();

    const [slab] = await db.select().from(slabs);
    expect(slab.serial).toBe('12345600');
    await expect(db.execute(sql`update slabs set serial = 'GGI-SLB-12345600'`)).rejects.toThrow();
    await expect(db.execute(sql`update slabs set serial = '123456'`)).rejects.toThrow();
  });
});
