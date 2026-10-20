/**
 * Esquema de base de datos de Gorilla Grading (PostgreSQL en Supabase).
 *
 * Reglas generales (docs/engineering/PLAN_BACKEND.pdf, sección 4):
 * - Importes en céntimos enteros.
 * - La población no se almacena: se calcula por consulta.
 * - Certificados y eventos de custodia son inmutables (se revocan, no se borran).
 * - Todas las tablas tienen RLS activado y sin políticas: Supabase expone el
 *   esquema public a través de su Data API, y así solo el backend (rol postgres,
 *   que ignora RLS) puede leer o escribir.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { CERTIFICATE_NUMBER, ORDER_CODE, SLAB_SERIAL, TICKET_CODE } from '../shared/codes';
import { GRADE_LABELS } from '../shared/grading';
import {
  CERTIFICATE_STATUSES,
  ORDER_STATUSES,
  SHIPPING_METHODS,
  USER_ROLES,
} from '../shared/domain';

/** Condición CHECK: la columna cumple el formato de código. */
const matches = (column: AnyPgColumn, pattern: RegExp) => sql`${column} ~ ${sql.raw(`'${pattern.source}'`)}`;

/** Valor de la escala de notas: de 1 a 10 en pasos de 0,5. */
const onGradeScale = (column: AnyPgColumn) =>
  sql`(${column} is null or (${column} between 1 and 10 and ${column} * 2 = floor(${column} * 2)))`;

/** Cada nota admite solo sus etiquetas (shared/grading.ts). */
const labelMatchesGrade = (grade: AnyPgColumn, label: AnyPgColumn) =>
  sql.join(
    Object.entries(GRADE_LABELS).map(
      ([value, labels]) =>
        sql`(${grade} = ${sql.raw(value)} and ${label} in (${sql.raw(labels.map((l) => `'${l}'`).join(', '))}))`,
    ),
    sql` or `,
  );

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
const tstz = (name: string) => timestamp(name, { withTimezone: true });
/** Notas de 0 a 10 con un decimal (9.5, 10.0...). */
const grade = (name: string) => numeric(name, { precision: 3, scale: 1, mode: 'number' });

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRole = pgEnum('user_role', USER_ROLES);
export const orderStatus = pgEnum('order_status', ORDER_STATUSES);
export const shippingMethod = pgEnum('shipping_method', SHIPPING_METHODS);
export const paymentStatus = pgEnum('payment_status', [
  'unpaid',
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
]);
export const imageKind = pgEnum('image_kind', ['front', 'back', 'extra']);
export const shipmentDirection = pgEnum('shipment_direction', ['inbound', 'outbound']);
export const gradingResultStatus = pgEnum('grading_result_status', [
  'draft',
  'pending_qa',
  'approved',
  'superseded',
]);
export const cardSide = pgEnum('card_side', ['front', 'back']);
export const defectCategory = pgEnum('defect_category', ['centering', 'corners', 'edges', 'surface']);
export const defectSeverity = pgEnum('defect_severity', ['flawless', 'minor', 'moderate', 'critical']);
export const certificateStatus = pgEnum('certificate_status', CERTIFICATE_STATUSES);
export const checkChannel = pgEnum('check_channel', ['web', 'qr', 'nfc', 'api']);
export const eventKind = pgEnum('event_kind', ['fair', 'hub']);
export const contactStatus = pgEnum('contact_status', ['open', 'answered', 'closed']);
export const newsletterStatus = pgEnum('newsletter_status', ['pending', 'confirmed', 'unsubscribed']);
export const consentKind = pgEnum('consent_kind', ['terms', 'privacy', 'cookies', 'marketing']);
export const outboxStatus = pgEnum('outbox_status', ['pending', 'sending', 'sent', 'failed']);

// ---------------------------------------------------------------------------
// Cuentas y sesiones
// ---------------------------------------------------------------------------

export const users = pgTable(
  'users',
  {
    id: id(),
    // Se guarda en minúsculas; el índice único sobre lower() lo garantiza.
    email: text('email').notNull(),
    fullName: text('full_name'),
    locale: text('locale').notNull().default('es'),
    role: userRole('role').notNull().default('customer'),
    emailVerifiedAt: tstz('email_verified_at'),
    deletedAt: tstz('deleted_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('users_email_lower_uq').on(sql`lower(${t.email})`)],
).enableRLS();

export const otpChallenges = pgTable(
  'otp_challenges',
  {
    id: id(),
    email: text('email').notNull(),
    codeHash: text('code_hash').notNull(),
    attempts: smallint('attempts').notNull().default(0),
    maxAttempts: smallint('max_attempts').notNull().default(5),
    expiresAt: tstz('expires_at').notNull(),
    consumedAt: tstz('consumed_at'),
    ipHash: text('ip_hash'),
    createdAt: createdAt(),
  },
  (t) => [index('otp_challenges_email_created_idx').on(sql`lower(${t.email})`, t.createdAt)],
).enableRLS();

export const sessions = pgTable(
  'sessions',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: tstz('expires_at').notNull(),
    revokedAt: tstz('revoked_at'),
    userAgent: text('user_agent'),
    ipHash: text('ip_hash'),
    createdAt: createdAt(),
    lastSeenAt: tstz('last_seen_at'),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
).enableRLS();

export const addresses = pgTable(
  'addresses',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    line1: text('line1').notNull(),
    line2: text('line2'),
    city: text('city').notNull(),
    postalCode: text('postal_code').notNull(),
    region: text('region'),
    // ISO 3166-1 alpha-2
    countryCode: text('country_code').notNull(),
    phone: text('phone'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('addresses_user_idx').on(t.userId)],
).enableRLS();

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

/**
 * Niveles de servicio versionados: un cambio de precio crea una fila nueva con
 * la misma `code` y una `version` mayor. Los pedidos apuntan a la versión exacta.
 */
export const serviceTiers = pgTable(
  'service_tiers',
  {
    id: id(),
    code: text('code').notNull(),
    version: integer('version').notNull().default(1),
    name: text('name').notNull(),
    tagline: text('tagline'),
    priceCents: integer('price_cents').notNull(),
    turnaroundBusinessDays: smallint('turnaround_business_days').notNull(),
    maxDeclaredValueCents: integer('max_declared_value_cents').notNull(),
    subgradesIncluded: boolean('subgrades_included').notNull(),
    highResScans: boolean('high_res_scans').notNull(),
    priorityQueue: boolean('priority_queue').notNull(),
    eventOnly: boolean('event_only').notNull().default(false),
    badge: text('badge'),
    sortOrder: smallint('sort_order').notNull().default(0),
    validFrom: tstz('valid_from').notNull().defaultNow(),
    validTo: tstz('valid_to'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('service_tiers_code_version_uq').on(t.code, t.version),
    check('service_tiers_price_positive', sql`${t.priceCents} >= 0`),
  ],
).enableRLS();

/** Carta canónica: base para la población y las estadísticas. */
export const cardIdentities = pgTable(
  'card_identities',
  {
    id: id(),
    game: text('game').notNull(),
    setName: text('set_name').notNull(),
    cardNumber: text('card_number').notNull(),
    name: text('name').notNull(),
    language: text('language').notNull(),
    year: smallint('year'),
    rarity: text('rarity'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('card_identities_natural_uq').on(t.game, t.setName, t.cardNumber, t.language, t.name),
  ],
).enableRLS();

export const events = pgTable(
  'events',
  {
    id: id(),
    kind: eventKind('kind').notNull(),
    name: text('name').notNull(),
    city: text('city').notNull(),
    countryCode: text('country_code').notNull(),
    venue: text('venue'),
    startsAt: tstz('starts_at').notNull(),
    endsAt: tstz('ends_at').notNull(),
    acceptsSubmissions: boolean('accepts_submissions').notNull().default(true),
    published: boolean('published').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('events_starts_idx').on(t.startsAt)],
).enableRLS();

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

export const orders = pgTable(
  'orders',
  {
    id: id(),
    // GGI-ORD-xxxxxx
    code: text('code').notNull().unique(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    status: orderStatus('status').notNull().default('DRAFT'),
    // Estado al que vuelve el pedido al salir de ON_HOLD.
    statusBeforeHold: orderStatus('status_before_hold'),
    shippingMethod: shippingMethod('shipping_method'),
    eventId: uuid('event_id').references(() => events.id),
    // Copia de la dirección en el momento del envío (no cambia si el usuario edita la suya).
    shippingAddress: jsonb('shipping_address').$type<AddressSnapshot>(),
    currency: text('currency').notNull().default('EUR'),
    // Totales congelados al enviar el pedido.
    subtotalCents: integer('subtotal_cents'),
    insuranceCents: integer('insurance_cents'),
    shippingCents: integer('shipping_cents'),
    taxCents: integer('tax_cents'),
    totalCents: integer('total_cents'),
    paymentStatus: paymentStatus('payment_status').notNull().default('unpaid'),
    submittedAt: tstz('submitted_at'),
    estimatedCompletionAt: date('estimated_completion_at'),
    // Lo genera el navegador una vez por pedido. Si el envío se repite no se crea otro pedido.
    clientToken: text('client_token'),
    // Reloj del avance automático: se fija al confirmar la recepción del paquete y se retrasa
    // el tiempo que el pedido esté en pausa. Sin él, el pedido solo avanza a mano.
    autoAnchorAt: tstz('auto_anchor_at'),
    autoTurnaroundDays: smallint('auto_turnaround_days'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('orders_user_idx').on(t.userId),
    index('orders_status_idx').on(t.status),
    check('orders_code_format', matches(t.code, ORDER_CODE)),
    uniqueIndex('orders_user_client_token_uq').on(t.userId, t.clientToken),
  ],
).enableRLS();

export type AddressSnapshot = {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  region?: string;
  countryCode: string;
  phone?: string;
};

export const orderItems = pgTable(
  'order_items',
  {
    id: id(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    position: smallint('position').notNull(),
    cardIdentityId: uuid('card_identity_id').references(() => cardIdentities.id),
    // Datos declarados por el cliente; la identidad canónica se asigna en pre-inspección.
    cardName: text('card_name').notNull(),
    game: text('game').notNull(),
    setName: text('set_name'),
    cardNumber: text('card_number'),
    year: smallint('year'),
    language: text('language'),
    declaredValueCents: integer('declared_value_cents').notNull(),
    serviceTierId: uuid('service_tier_id')
      .notNull()
      .references(() => serviceTiers.id),
    // Congelados al crear el pedido.
    unitPriceCents: integer('unit_price_cents').notNull(),
    maxDeclaredValueCents: integer('max_declared_value_cents').notNull(),
    notes: text('notes'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('order_items_order_position_uq').on(t.orderId, t.position),
    check('order_items_declared_value_positive', sql`${t.declaredValueCents} >= 0`),
  ],
).enableRLS();

export const itemImages = pgTable(
  'item_images',
  {
    id: id(),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id, { onDelete: 'cascade' }),
    kind: imageKind('kind').notNull(),
    storageKey: text('storage_key').notNull().unique(),
    contentType: text('content_type').notNull(),
    byteSize: integer('byte_size'),
    sha256: text('sha256'),
    uploadedAt: tstz('uploaded_at'),
    createdAt: createdAt(),
  },
  (t) => [index('item_images_item_idx').on(t.orderItemId)],
).enableRLS();

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------

export const payments = pgTable(
  'payments',
  {
    id: id(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    provider: text('provider').notNull().default('stripe'),
    checkoutSessionId: text('checkout_session_id').unique(),
    paymentIntentId: text('payment_intent_id').unique(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('EUR'),
    status: paymentStatus('status').notNull().default('pending'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('payments_order_idx').on(t.orderId)],
).enableRLS();

/** El event_id único garantiza que un webhook repetido se procese una sola vez. */
export const webhookEvents = pgTable('webhook_events', {
  id: id(),
  provider: text('provider').notNull().default('stripe'),
  eventId: text('event_id').notNull().unique(),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull(),
  receivedAt: createdAt(),
  processedAt: tstz('processed_at'),
  error: text('error'),
}).enableRLS();

// ---------------------------------------------------------------------------
// Logística y custodia
// ---------------------------------------------------------------------------

export const shipments = pgTable(
  'shipments',
  {
    id: id(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    direction: shipmentDirection('direction').notNull(),
    carrier: text('carrier').notNull(),
    trackingNumber: text('tracking_number'),
    labelStorageKey: text('label_storage_key'),
    insuredValueCents: integer('insured_value_cents'),
    shippedAt: tstz('shipped_at'),
    deliveredAt: tstz('delivered_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('shipments_order_idx').on(t.orderId)],
).enableRLS();

/**
 * Historial de custodia, solo inserción. El seguimiento público se deriva de
 * aquí y solo muestra `publicLabel` y `publicDescription`, nunca `internalNote`.
 */
export const custodyEvents = pgTable(
  'custody_events',
  {
    id: id(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    fromStatus: orderStatus('from_status'),
    toStatus: orderStatus('to_status').notNull(),
    publicLabel: text('public_label').notNull(),
    publicDescription: text('public_description'),
    internalNote: text('internal_note'),
    location: text('location'),
    actorId: uuid('actor_id').references(() => users.id),
    occurredAt: tstz('occurred_at').notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [index('custody_events_order_idx').on(t.orderId, t.occurredAt)],
).enableRLS();

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

/**
 * Resultado de grading versionado: nunca se sobrescribe. Una corrección crea
 * una versión nueva y marca la anterior como `superseded`.
 * Doble firma: quien gradúa (`gradedBy`) no puede ser quien aprueba en QA.
 */
export const gradingResults = pgTable(
  'grading_results',
  {
    id: id(),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id),
    version: smallint('version').notNull().default(1),
    status: gradingResultStatus('status').notNull().default('draft'),
    isAuthentic: boolean('is_authentic').notNull(),
    finalGrade: grade('final_grade'),
    gradeLabel: text('grade_label'),
    centeringScore: grade('centering_score'),
    centeringFrontRatio: text('centering_front_ratio'),
    centeringBackRatio: text('centering_back_ratio'),
    centeringNotes: text('centering_notes'),
    cornersScore: grade('corners_score'),
    cornersFrontScore: grade('corners_front_score'),
    cornersBackScore: grade('corners_back_score'),
    cornersNotes: text('corners_notes'),
    edgesScore: grade('edges_score'),
    edgesFrontScore: grade('edges_front_score'),
    edgesBackScore: grade('edges_back_score'),
    edgesNotes: text('edges_notes'),
    surfaceScore: grade('surface_score'),
    surfaceFrontScore: grade('surface_front_score'),
    surfaceBackScore: grade('surface_back_score'),
    surfaceNotes: text('surface_notes'),
    station: text('station'),
    gradedBy: uuid('graded_by')
      .notNull()
      .references(() => users.id),
    gradedAt: tstz('graded_at').notNull().defaultNow(),
    qaApprovedBy: uuid('qa_approved_by').references(() => users.id),
    qaApprovedAt: tstz('qa_approved_at'),
    supersededById: uuid('superseded_by_id').references((): AnyPgColumn => gradingResults.id),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('grading_results_item_version_uq').on(t.orderItemId, t.version),
    // Solo una versión vigente por carta.
    uniqueIndex('grading_results_item_current_uq')
      .on(t.orderItemId)
      .where(sql`${t.status} <> 'superseded'`),
    // Regla de la nota (shared/grading.ts): la base de datos no deja guardar una nota que la incumpla.
    check(
      'grading_results_scale',
      sql`${onGradeScale(t.centeringScore)} and ${onGradeScale(t.cornersScore)} and ${onGradeScale(t.edgesScore)} and ${onGradeScale(t.surfaceScore)} and ${onGradeScale(t.finalGrade)}`,
    ),
    check(
      'grading_results_grade_rule',
      sql`(
        ${t.finalGrade} is null or ${t.centeringScore} is null or ${t.cornersScore} is null or ${t.edgesScore} is null or ${t.surfaceScore} is null
        or (
          ${t.finalGrade} <= least(${t.centeringScore}, ${t.cornersScore}, ${t.edgesScore}, ${t.surfaceScore}) + 0.5
          and ${t.finalGrade} <= ceil((${t.centeringScore} + ${t.cornersScore} + ${t.edgesScore} + ${t.surfaceScore} - 1) / 2) / 2
          and (${t.finalGrade} < 10 or (
            least(${t.centeringScore}, ${t.cornersScore}, ${t.edgesScore}, ${t.surfaceScore}) >= 9.5
            and (${t.centeringScore} = 10)::int + (${t.cornersScore} = 10)::int + (${t.edgesScore} = 10)::int + (${t.surfaceScore} = 10)::int >= 3))
          and (${t.finalGrade} < 9.5 or (
            (${t.centeringScore} >= 9.5)::int + (${t.cornersScore} >= 9.5)::int + (${t.edgesScore} >= 9.5)::int + (${t.surfaceScore} >= 9.5)::int >= 3
            and least(${t.centeringScore}, ${t.cornersScore}, ${t.edgesScore}, ${t.surfaceScore}) >= 9))
        )
      )`,
    ),
    check(
      'grading_results_label',
      sql`(
        ${t.finalGrade} is null or ${t.gradeLabel} is null
        or ((${labelMatchesGrade(t.finalGrade, t.gradeLabel)})
          and (${t.gradeLabel} <> 'Pristine 10' or (${t.centeringScore} = 10 and ${t.cornersScore} = 10 and ${t.edgesScore} = 10 and ${t.surfaceScore} = 10)))
      )`,
    ),
    check('grading_results_double_signature', sql`${t.qaApprovedBy} is null or ${t.qaApprovedBy} <> ${t.gradedBy}`),
    check(
      'grading_results_approved_has_qa',
      sql`${t.status} <> 'approved' or (${t.qaApprovedBy} is not null and ${t.finalGrade} is not null)`,
    ),
  ],
).enableRLS();

export const gradingDefects = pgTable(
  'grading_defects',
  {
    id: id(),
    gradingResultId: uuid('grading_result_id')
      .notNull()
      .references(() => gradingResults.id, { onDelete: 'cascade' }),
    side: cardSide('side').notNull(),
    category: defectCategory('category').notNull(),
    severity: defectSeverity('severity').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    // Coordenadas en porcentaje (0-100) sobre la imagen de la carta.
    x: numeric('x', { precision: 5, scale: 2, mode: 'number' }).notNull(),
    y: numeric('y', { precision: 5, scale: 2, mode: 'number' }).notNull(),
    deduction: numeric('deduction', { precision: 3, scale: 2, mode: 'number' }).notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index('grading_defects_result_idx').on(t.gradingResultId),
    check('grading_defects_coords', sql`${t.x} between 0 and 100 and ${t.y} between 0 and 100`),
  ],
).enableRLS();

export const slabs = pgTable('slabs', {
  id: id(),
  orderItemId: uuid('order_item_id')
    .notNull()
    .unique()
    .references(() => orderItems.id),
  gradingResultId: uuid('grading_result_id')
    .notNull()
    .references(() => gradingResults.id),
  // GGI-SLB-xxxxxx
  serial: text('serial').notNull().unique(),
  nfcUid: text('nfc_uid').unique(),
  qrPayload: text('qr_payload'),
  encapsulatedAt: tstz('encapsulated_at').notNull().defaultNow(),
  encapsulatedBy: uuid('encapsulated_by').references(() => users.id),
  createdAt: createdAt(),
}, (t) => [check('slabs_serial_format', matches(t.serial, SLAB_SERIAL))]).enableRLS();

// ---------------------------------------------------------------------------
// Certificados
// ---------------------------------------------------------------------------

/**
 * Certificados: nunca se borran. `payload` es el registro canónico que se firma
 * con Ed25519; `keyId` identifica la clave pública con la que verificarlo.
 * La firma la emite el back-office (Fase 7); los datos de ejemplo no la llevan.
 */
export const certificates = pgTable(
  'certificates',
  {
    id: id(),
    // GGI-xxxxxx
    number: text('number').notNull().unique(),
    slabId: uuid('slab_id')
      .notNull()
      .references(() => slabs.id),
    gradingResultId: uuid('grading_result_id')
      .notNull()
      .references(() => gradingResults.id),
    cardIdentityId: uuid('card_identity_id')
      .notNull()
      .references(() => cardIdentities.id),
    status: certificateStatus('status').notNull().default('active'),
    payload: jsonb('payload').notNull(),
    signature: text('signature'),
    keyId: text('key_id'),
    issuedAt: tstz('issued_at').notNull().defaultNow(),
    issuedBy: uuid('issued_by').references(() => users.id),
    revokedAt: tstz('revoked_at'),
    revokedReason: text('revoked_reason'),
    supersededById: uuid('superseded_by_id').references((): AnyPgColumn => certificates.id),
    createdAt: createdAt(),
  },
  (t) => [
    index('certificates_card_identity_idx').on(t.cardIdentityId),
    check('certificates_number_format', matches(t.number, CERTIFICATE_NUMBER)),
    check(
      'certificates_revoked_has_reason',
      sql`${t.status} <> 'revoked' or (${t.revokedAt} is not null and ${t.revokedReason} is not null)`,
    ),
  ],
).enableRLS();

export const certificateChecks = pgTable(
  'certificate_checks',
  {
    id: id(),
    // Se guarda el número consultado aunque no exista, para detectar abuso.
    certificateNumber: text('certificate_number').notNull(),
    certificateId: uuid('certificate_id').references(() => certificates.id),
    channel: checkChannel('channel').notNull(),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    checkedAt: createdAt(),
  },
  (t) => [
    index('certificate_checks_number_idx').on(t.certificateNumber, t.checkedAt),
    index('certificate_checks_ip_idx').on(t.ipHash, t.checkedAt),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Web pública
// ---------------------------------------------------------------------------

export const contactMessages = pgTable('contact_messages', {
  id: id(),
  // GGI-TKT-xxxxxx
  ticket: text('ticket').notNull().unique(),
  userId: uuid('user_id').references(() => users.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  orderCode: text('order_code'),
  status: contactStatus('status').notNull().default('open'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [check('contact_messages_ticket_format', matches(t.ticket, TICKET_CODE))]).enableRLS();

export const newsletterSubscriptions = pgTable(
  'newsletter_subscriptions',
  {
    id: id(),
    email: text('email').notNull(),
    locale: text('locale').notNull().default('es'),
    status: newsletterStatus('status').notNull().default('pending'),
    confirmTokenHash: text('confirm_token_hash'),
    consentVersion: text('consent_version').notNull(),
    consentedAt: tstz('consented_at').notNull().defaultNow(),
    confirmedAt: tstz('confirmed_at'),
    unsubscribedAt: tstz('unsubscribed_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('newsletter_email_lower_uq').on(sql`lower(${t.email})`)],
).enableRLS();

export const consents = pgTable(
  'consents',
  {
    id: id(),
    userId: uuid('user_id').references(() => users.id),
    email: text('email'),
    kind: consentKind('kind').notNull(),
    version: text('version').notNull(),
    granted: boolean('granted').notNull(),
    ipHash: text('ip_hash'),
    createdAt: createdAt(),
  },
  (t) => [
    index('consents_user_idx').on(t.userId),
    check('consents_subject', sql`${t.userId} is not null or ${t.email} is not null`),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Infraestructura
// ---------------------------------------------------------------------------

export const emailOutbox = pgTable(
  'email_outbox',
  {
    id: id(),
    // Evita encolar dos veces el mismo email (por ejemplo, `order:<id>:SHIPPED`).
    dedupeKey: text('dedupe_key').unique(),
    toEmail: text('to_email').notNull(),
    template: text('template').notNull(),
    locale: text('locale').notNull().default('es'),
    data: jsonb('data').notNull().default({}),
    status: outboxStatus('status').notNull().default('pending'),
    attempts: smallint('attempts').notNull().default(0),
    nextAttemptAt: tstz('next_attempt_at').notNull().defaultNow(),
    providerMessageId: text('provider_message_id'),
    lastError: text('last_error'),
    sentAt: tstz('sent_at'),
    createdAt: createdAt(),
  },
  (t) => [index('email_outbox_pending_idx').on(t.status, t.nextAttemptAt)],
).enableRLS();

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: id(),
    actorId: uuid('actor_id').references(() => users.id),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    before: jsonb('before'),
    after: jsonb('after'),
    ipHash: text('ip_hash'),
    createdAt: createdAt(),
  },
  (t) => [
    index('audit_logs_entity_idx').on(t.entityType, t.entityId),
    index('audit_logs_actor_idx').on(t.actorId, t.createdAt),
  ],
).enableRLS();

/**
 * Peticiones registradas para limitar el uso de los endpoints públicos (seguimiento,
 * verificación). Guarda solo el hash de la IP. Las filas antiguas se pueden borrar.
 */
export const rateLimitEvents = pgTable(
  'rate_limit_events',
  {
    id: id(),
    bucket: text('bucket').notNull(),
    keyHash: text('key_hash').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('rate_limit_events_lookup_idx').on(t.bucket, t.keyHash, t.createdAt)],
).enableRLS();
