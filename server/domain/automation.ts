/**
 * Avance automático de los pedidos por el laboratorio.
 *
 * Una persona confirma que llegó el paquete (eso arranca el reloj) y otra aprueba la salida al
 * final. Entre medias, el sistema pasa el pedido por pre-inspección, graduación, encapsulado y
 * control de calidad repartiendo el plazo del servicio. Nunca envía ni entrega por su cuenta:
 * se detiene en control de calidad hasta que una persona lo aprueba.
 */
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { auditLogs, custodyEvents, orders, users } from '../../db/schema.js';
import type { OrderStatus } from '../../shared/domain.js';
import { addBusinessDays, publicCopy } from './order-flow.js';

/** En qué punto del plazo (0 = llegada del paquete, 1 = plazo completo) entra el pedido en cada fase. */
export const AUTO_STAGES: readonly { to: OrderStatus; at: number }[] = [
  { to: 'PRE_INSPECTION', at: 0.1 },
  { to: 'OPTICAL_GRADING', at: 0.25 },
  { to: 'ENCAPSULATION', at: 0.65 },
  { to: 'QUALITY_ASSURANCE', at: 0.85 },
];

/** Estados desde los que el sistema puede mover un pedido. */
export const AUTO_FROM: OrderStatus[] = ['PACKAGE_RECEIVED', ...AUTO_STAGES.slice(0, -1).map((s) => s.to)];

export const AUTO_NOTE = 'Avance automático según el plazo del servicio.';

/** Suma días hábiles con fracción (2,5 = dos días y medio) saltando fines de semana. */
export function addBusinessTime(from: Date, days: number): Date {
  const whole = Math.floor(days);
  const result = new Date(addBusinessDays(from, whole).getTime() + (days - whole) * 86_400_000);
  // Si cae en sábado o domingo, pasa al lunes a la misma hora.
  while (result.getUTCDay() === 0 || result.getUTCDay() === 6) result.setUTCDate(result.getUTCDate() + 1);
  return result;
}

/** Cuándo le toca a un pedido entrar en cada fase automática. */
export function scheduleFor(anchor: Date, turnaroundDays: number): { to: OrderStatus; at: Date }[] {
  return AUTO_STAGES.map((stage) => ({ to: stage.to, at: addBusinessTime(anchor, turnaroundDays * stage.at) }));
}

/** Fases automáticas que todavía no ha alcanzado un pedido en `status`. */
export function remainingSteps(status: OrderStatus, anchor: Date, turnaroundDays: number) {
  const reached = AUTO_STAGES.findIndex((s) => s.to === status);
  return scheduleFor(anchor, turnaroundDays).slice(reached + 1);
}

export interface AdvancedOrder {
  code: string;
  from: OrderStatus;
  to: OrderStatus;
}

/**
 * Mueve todos los pedidos cuyas fases ya les tocan. Es seguro ejecutarlo a menudo y a la vez:
 * cada paso solo se aplica si el pedido sigue en el estado esperado, y si el proceso estuvo
 * parado se ponen al día todas las fases pendientes con la hora que les correspondía.
 */
export async function advanceDueOrders(db: Db, now = new Date()): Promise<AdvancedOrder[]> {
  const rows = await db
    .select({ order: orders, customer: users })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .where(
      and(inArray(orders.status, AUTO_FROM), isNotNull(orders.autoAnchorAt), isNotNull(orders.autoTurnaroundDays)),
    );

  const advanced: AdvancedOrder[] = [];
  for (const { order, customer } of rows) {
    const due = remainingSteps(order.status, order.autoAnchorAt!, order.autoTurnaroundDays!).filter((s) => s.at <= now);
    if (due.length === 0) continue;

    await db.transaction(async (tx) => {
      let current = order.status;
      for (const step of due) {
        const [moved] = await tx
          .update(orders)
          .set({ status: step.to })
          .where(and(eq(orders.id, order.id), eq(orders.status, current)))
          .returning({ id: orders.id });
        // Otra persona o proceso movió el pedido a la vez: se deja como está.
        if (!moved) return;

        const copy = publicCopy(current, step.to, customer.locale, order.shippingMethod);
        await tx.insert(custodyEvents).values({
          orderId: order.id,
          fromStatus: current,
          toStatus: step.to,
          publicLabel: copy.label,
          publicDescription: copy.description,
          internalNote: AUTO_NOTE,
          actorId: null,
          occurredAt: step.at,
        });
        await tx.insert(auditLogs).values({
          actorId: null,
          action: 'order.auto_advance',
          entityType: 'order',
          entityId: order.code,
          before: { status: current },
          after: { status: step.to },
        });
        advanced.push({ code: order.code, from: current, to: step.to });
        current = step.to;
      }
    });
  }
  return advanced;
}
