import { describe, expect, it } from 'vitest';
import { addBusinessDays, publicCopy, rulesFrom } from './order-flow';

const day = (iso: string) => new Date(`${iso}T10:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('addBusinessDays', () => {
  it('salta los fines de semana', () => {
    expect(iso(addBusinessDays(day('2026-10-16'), 1))).toBe('2026-10-19'); // viernes -> lunes
    expect(iso(addBusinessDays(day('2026-10-17'), 1))).toBe('2026-10-19'); // sábado -> lunes
    expect(iso(addBusinessDays(day('2026-10-18'), 1))).toBe('2026-10-19'); // domingo -> lunes
    expect(iso(addBusinessDays(day('2026-10-19'), 5))).toBe('2026-10-26'); // una semana laboral
    expect(iso(addBusinessDays(day('2026-10-19'), 10))).toBe('2026-11-02');
  });

  it('con 0 días no cambia la fecha', () => {
    expect(iso(addBusinessDays(day('2026-10-20'), 0))).toBe('2026-10-20');
  });
});

describe('rulesFrom', () => {
  const targets = (status: Parameters<typeof rulesFrom>[0], before: Parameters<typeof rulesFrom>[1] = null) =>
    rulesFrom(status, before).map((r) => r.to);

  it('cada estado avanza solo al siguiente, o se pausa o se cancela', () => {
    expect(targets('SUBMITTED')).toEqual(['PACKAGE_RECEIVED', 'ON_HOLD', 'CANCELLED']);
    expect(targets('OPTICAL_GRADING')).toEqual(['ENCAPSULATION', 'ON_HOLD', 'CANCELLED']);
    expect(targets('QUALITY_ASSURANCE')).toEqual(['SHIPPED', 'ON_HOLD', 'CANCELLED']);
  });

  it('un pedido enviado no se puede cancelar, solo pausar o entregar', () => {
    expect(targets('SHIPPED')).toEqual(['DELIVERED', 'ON_HOLD']);
  });

  it('un pedido en pausa solo vuelve al estado donde estaba o se cancela', () => {
    expect(targets('ON_HOLD', 'PRE_INSPECTION')).toEqual(['PRE_INSPECTION', 'CANCELLED']);
  });

  it('los estados terminados no tienen salida', () => {
    for (const s of ['DELIVERED', 'CANCELLED', 'RETURNED', 'DRAFT'] as const) expect(targets(s)).toEqual([]);
  });

  it('pausar y cancelar exigen motivo; avanzar no', () => {
    const rules = rulesFrom('SUBMITTED', null);
    expect(rules.find((r) => r.to === 'PACKAGE_RECEIVED')?.requiresNote).toBeFalsy();
    expect(rules.find((r) => r.to === 'ON_HOLD')?.requiresNote).toBe(true);
    expect(rules.find((r) => r.to === 'CANCELLED')?.requiresNote).toBe(true);
  });

  it('cancelar es solo de admin y salir de control de calidad es de qa o admin', () => {
    expect(rulesFrom('SUBMITTED', null).find((r) => r.to === 'CANCELLED')?.roles).toEqual(['admin']);
    expect(rulesFrom('QUALITY_ASSURANCE', null).find((r) => r.to === 'SHIPPED')?.roles).toEqual(['qa', 'admin']);
  });
});

describe('publicCopy', () => {
  it('usa el idioma del cliente', () => {
    expect(publicCopy('SUBMITTED', 'PACKAGE_RECEIVED', 'es', 'COURIER_INSURED').label).toBe('Paquete recibido en la bóveda');
    expect(publicCopy('SUBMITTED', 'PACKAGE_RECEIVED', 'en', 'COURIER_INSURED').label).toBe('Package received in the vault');
    expect(publicCopy('SUBMITTED', 'PACKAGE_RECEIVED', 'fr', 'COURIER_INSURED').label).toBe('Paquete recibido en la bóveda');
  });

  it('al reanudar un pedido dice que se ha reanudado', () => {
    expect(publicCopy('ON_HOLD', 'PRE_INSPECTION', 'es', null).label).toBe('Pedido reanudado');
    expect(publicCopy('ON_HOLD', 'CANCELLED', 'es', null).label).toBe('Pedido cancelado');
  });

  it('la entrega en mano no habla de mensajería', () => {
    expect(publicCopy('QUALITY_ASSURANCE', 'SHIPPED', 'es', 'CARD_SHOW_DROPOFF').label).toBe('Listo para entrega en mano');
    expect(publicCopy('QUALITY_ASSURANCE', 'SHIPPED', 'es', 'COURIER_INSURED').label).toBe('Devolución en camino');
  });
});
