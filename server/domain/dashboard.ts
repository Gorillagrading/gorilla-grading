import { and, desc, eq, gte, isNotNull, ne, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import {
  certificateChecks, certificates, gradingResults, orderItems, orders, payments, serviceTiers, users,
} from '../../db/schema.js';
import type {
  DashboardBucket, DashboardBucketUnit, DashboardData, DashboardMetric, DashboardRange,
} from '../../shared/dashboard.js';

/** Los días, semanas y meses se cuentan en hora de Madrid, como los vive el negocio. */
const TZ = 'Europe/Madrid';
const RECENT_PAYMENTS = 8;

// ---------------------------------------------------------------------------
// Fechas del calendario (AAAA-MM-DD), sin horas para no tropezar con los cambios de hora
// ---------------------------------------------------------------------------

const madridDate = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

const parts = (day: string) => day.split('-').map(Number) as [number, number, number];
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (day: string, n: number) => {
  const [y, m, d] = parts(day);
  return fmt(new Date(Date.UTC(y, m - 1, d + n)));
};
const addMonths = (day: string, n: number) => {
  const [y, m] = parts(day);
  return fmt(new Date(Date.UTC(y, m - 1 + n, 1)));
};
const monthStart = (day: string) => `${day.slice(0, 8)}01`;
const weekStart = (day: string) => {
  const [y, m, d] = parts(day);
  const weekday = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // lunes = 0
  return addDays(day, -weekday);
};

interface Period {
  unit: DashboardBucketUnit;
  /** Primer día del periodo y del periodo anterior (null en "todo"). */
  start: string;
  previousStart: string | null;
}

function periodFor(range: DashboardRange, today: string, firstDay: string): Period {
  switch (range) {
    case '30d':
      return { unit: 'day', start: addDays(today, -29), previousStart: addDays(today, -59) };
    case '90d': {
      const start = addDays(weekStart(today), -12 * 7);
      return { unit: 'week', start, previousStart: addDays(start, -13 * 7) };
    }
    case '12m': {
      const start = addMonths(monthStart(today), -11);
      return { unit: 'month', start, previousStart: addMonths(start, -12) };
    }
    case 'all':
      return { unit: 'month', start: monthStart(firstDay < today ? firstDay : today), previousStart: null };
  }
}

/** Inicio de cada barra, del primero al tramo actual. */
function bucketStarts(period: Period, today: string): string[] {
  const last = period.unit === 'day' ? today : period.unit === 'week' ? weekStart(today) : monthStart(today);
  const step = (d: string) => (period.unit === 'day' ? addDays(d, 1) : period.unit === 'week' ? addDays(d, 7) : addMonths(d, 1));
  const out: string[] = [];
  for (let d = period.start; d <= last; d = step(d)) out.push(d);
  return out;
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

/** Medianoche de Madrid de ese día, como instante. */
const midnight = (day: string) => sql`(${day}::timestamp at time zone ${sql.raw(`'${TZ}'`)})`;

/** Día de inicio del tramo al que pertenece un instante. `unit` sale de una lista cerrada. */
const bucketOf = (col: AnyColumn, unit: DashboardBucketUnit) =>
  sql<string>`to_char(date_trunc('${sql.raw(unit)}', ${col} at time zone '${sql.raw(TZ)}'), 'YYYY-MM-DD')`;

const num = (v: unknown) => Number(v ?? 0);

/**
 * Valor del periodo, del periodo anterior y de siempre en una sola consulta.
 * `value` es lo que se suma por fila (1 para contar, el importe para sumar dinero).
 */
async function metric(db: Db, opts: { table: any; col: AnyColumn; where: SQL | undefined; value?: SQL; from: SQL; previousFrom: SQL | null }) {
  const value = opts.value ?? sql`1`;
  const [row] = await db
    .select({
      current: sql`coalesce(sum(${value}) filter (where ${opts.col} >= ${opts.from}), 0)::float8`,
      previous: opts.previousFrom
        ? sql`coalesce(sum(${value}) filter (where ${opts.col} >= ${opts.previousFrom} and ${opts.col} < ${opts.from}), 0)::float8`
        : sql`null`,
      all: sql`coalesce(sum(${value}), 0)::float8`,
    })
    .from(opts.table)
    .where(and(isNotNull(opts.col), opts.where));
  return {
    metric: { current: num(row.current), previous: opts.previousFrom ? num(row.previous) : null } satisfies DashboardMetric,
    all: num(row.all),
  };
}

async function perBucket(db: Db, opts: { table: any; col: AnyColumn; where: SQL | undefined; value?: SQL; from: SQL; unit: DashboardBucketUnit }) {
  const key = bucketOf(opts.col, opts.unit);
  const rows = await db
    .select({ key, total: sql`coalesce(sum(${opts.value ?? sql`1`}), 0)::float8` })
    .from(opts.table)
    .where(and(gte(opts.col, opts.from), opts.where))
    .groupBy(sql`1`);
  return new Map(rows.map((r) => [r.key, num(r.total)]));
}

export async function getDashboard(db: Db, range: DashboardRange, now = new Date()): Promise<DashboardData> {
  const today = madridDate(now);
  const [{ first }] = await db.select({ first: sql<Date | string | null>`min(${users.createdAt})` }).from(users);
  const period = periodFor(range, today, first ? madridDate(new Date(first)) : today);
  const from = midnight(period.start);
  const previousFrom = period.previousStart ? midnight(period.previousStart) : null;
  const span = { from, previousFrom };

  const paid = eq(payments.status, 'paid');
  const customer = and(eq(users.role, 'customer'), sql`${users.deletedAt} is null`);
  const approved = eq(gradingResults.status, 'approved');
  const submitted = ne(orders.status, 'DRAFT');
  const verified = isNotNull(certificateChecks.certificateId);

  const sources = {
    revenueCents: { table: payments, col: payments.paidAt, where: paid, value: sql`${payments.amountCents}` },
    payments: { table: payments, col: payments.paidAt, where: paid },
    newCustomers: { table: users, col: users.createdAt, where: customer },
    cardsGraded: { table: gradingResults, col: gradingResults.qaApprovedAt, where: approved },
    orders: { table: orders, col: orders.submittedAt, where: submitted },
  };

  const [
    revenue, paymentCount, customers, graded, orderCount, certs, checks,
    revenueB, paymentsB, customersB, gradedB, ordersB,
    statusRows, gradeRows, [notAuthentic], serviceRows, recent, [awaiting],
  ] = await Promise.all([
    metric(db, { ...sources.revenueCents, ...span }),
    metric(db, { ...sources.payments, ...span }),
    metric(db, { ...sources.newCustomers, ...span }),
    metric(db, { ...sources.cardsGraded, ...span }),
    metric(db, { ...sources.orders, ...span }),
    metric(db, { table: certificates, col: certificates.issuedAt, where: undefined, ...span }),
    metric(db, { table: certificateChecks, col: certificateChecks.checkedAt, where: verified, ...span }),
    perBucket(db, { ...sources.revenueCents, from, unit: period.unit }),
    perBucket(db, { ...sources.payments, from, unit: period.unit }),
    perBucket(db, { ...sources.newCustomers, from, unit: period.unit }),
    perBucket(db, { ...sources.cardsGraded, from, unit: period.unit }),
    perBucket(db, { ...sources.orders, from, unit: period.unit }),
    db.select({ status: orders.status, n: sql`count(*)::int` }).from(orders).where(submitted).groupBy(orders.status),
    db
      .select({ grade: gradingResults.finalGrade, n: sql`count(*)::int` })
      .from(gradingResults)
      .where(and(approved, eq(gradingResults.isAuthentic, true), isNotNull(gradingResults.finalGrade), gte(gradingResults.qaApprovedAt, from)))
      .groupBy(gradingResults.finalGrade),
    db
      .select({ n: sql`count(*)::int` })
      .from(gradingResults)
      .where(and(approved, eq(gradingResults.isAuthentic, false), gte(gradingResults.qaApprovedAt, from))),
    db
      .select({
        code: serviceTiers.code,
        name: sql<string>`max(${serviceTiers.name})`,
        cards: sql`count(*)::int`,
        revenue: sql`coalesce(sum(${orderItems.unitPriceCents}), 0)::float8`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .innerJoin(serviceTiers, eq(serviceTiers.id, orderItems.serviceTierId))
      .where(and(submitted, gte(orders.submittedAt, from)))
      .groupBy(serviceTiers.code),
    db
      .select({ code: orders.code, email: users.email, name: users.fullName, amount: payments.amountCents, paidAt: payments.paidAt })
      .from(payments)
      .innerJoin(orders, eq(orders.id, payments.orderId))
      .innerJoin(users, eq(users.id, orders.userId))
      .where(and(paid, isNotNull(payments.paidAt)))
      .orderBy(desc(payments.paidAt))
      .limit(RECENT_PAYMENTS),
    db
      .select({ n: sql`count(*)::int`, total: sql`coalesce(sum(${orders.totalCents}), 0)::float8` })
      .from(orders)
      .where(eq(orders.status, 'PAYMENT_PENDING')),
  ]);

  const buckets: DashboardBucket[] = bucketStarts(period, today).map((start) => ({
    start,
    revenueCents: revenueB.get(start) ?? 0,
    payments: paymentsB.get(start) ?? 0,
    newCustomers: customersB.get(start) ?? 0,
    cardsGraded: gradedB.get(start) ?? 0,
    orders: ordersB.get(start) ?? 0,
  }));

  return {
    range,
    unit: period.unit,
    from: new Date(`${period.start}T00:00:00Z`).toISOString(),
    generatedAt: now.toISOString(),
    metrics: {
      revenueCents: revenue.metric,
      payments: paymentCount.metric,
      newCustomers: customers.metric,
      cardsGraded: graded.metric,
      orders: orderCount.metric,
      certificates: certs.metric,
      verifications: checks.metric,
    },
    totals: { revenueCents: revenue.all, customers: customers.all, cardsGraded: graded.all, certificates: certs.all },
    awaitingPayment: { orders: num(awaiting.n), totalCents: num(awaiting.total) },
    buckets,
    ordersByStatus: Object.fromEntries(statusRows.map((r) => [r.status, num(r.n)])),
    grades: gradeRows
      .map((r) => ({ grade: Number(r.grade), count: num(r.n) }))
      .sort((a, b) => b.grade - a.grade),
    notAuthentic: num(notAuthentic.n),
    services: serviceRows
      .map((r) => ({ code: r.code, name: r.name, cards: num(r.cards), revenueCents: num(r.revenue) }))
      .sort((a, b) => b.cards - a.cards),
    recentPayments: recent.map((r) => ({
      orderCode: r.code,
      customer: r.name ?? r.email,
      amountCents: r.amount,
      paidAt: r.paidAt!.toISOString(),
    })),
  };
}
