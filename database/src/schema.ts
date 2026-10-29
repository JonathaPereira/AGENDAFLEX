import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  pgEnum,
  pgPolicy,
  uniqueIndex,
  integer,
  boolean,
  date,
  check,
  unique,
  foreignKey,
} from 'drizzle-orm/pg-core';
export const tenantRole = pgEnum('tenant_role', ['owner', 'manager', 'staff']);
export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  () => [
    pgPolicy('tenants_read_member', {
      for: 'select',
      to: 'authenticated',
      using: sql`exists (select 1 from public.memberships m where m.tenant_id = tenants.id and m.user_id = (select auth.uid()))`,
    }),
  ],
).enableRLS();

export const memberships = pgTable(
  'memberships',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    // Supabase Auth user ID; never accept it from a request body as identity.
    userId: uuid('user_id').notNull(),
    role: tenantRole('role').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.userId] }),
    uniqueIndex('one_owner_per_tenant')
      .on(table.tenantId)
      .where(sql`${table.role} = 'owner'`),
    pgPolicy('memberships_read_own', {
      for: 'select',
      to: 'authenticated',
      using: sql`${table.userId} = (select auth.uid())`,
    }),
  ],
).enableRLS();

// Billing starts in an isolated test environment. There is deliberately no live mode.
// Writes use authenticated RPCs with explicit tenant/ownership checks (migration 0003).
// Composite keys prevent relations from crossing establishments, including in admin tools.
const billingColumns = () => ({
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
});
export const billingCustomers = pgTable(
  'billing_customers',
  {
    ...billingColumns(),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
  },
  (t) => [unique().on(t.tenantId, t.id), unique().on(t.tenantId, t.userId)],
).enableRLS();
export const billingPlans = pgTable(
  'billing_plans',
  {
    ...billingColumns(),
    name: text('name').notNull(),
    priceCents: integer('price_cents').notNull(),
    coverage: text('coverage').notNull(),
    active: boolean('active').default(true).notNull(),
  },
  (t) => [
    unique().on(t.tenantId, t.id),
    check('billing_plan_price', sql`${t.priceCents} between 1 and 100000000`),
    check(
      'billing_plan_coverage',
      sql`${t.coverage} in ('hair','beard','combo')`,
    ),
  ],
).enableRLS();
export const billingServices = pgTable(
  'billing_services',
  {
    ...billingColumns(),
    name: text('name').notNull(),
    priceCents: integer('price_cents').notNull(),
    category: text('category').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    active: boolean('active').default(true).notNull(),
  },
  (t) => [
    unique().on(t.tenantId, t.id),
    check(
      'billing_service_price',
      sql`${t.priceCents} between 1 and 100000000`,
    ),
    check(
      'billing_service_category',
      sql`${t.category} in ('hair','beard','combo','other')`,
    ),
    check(
      'billing_service_duration',
      sql`${t.durationMinutes} between 15 and 180 and ${t.durationMinutes} % 15 = 0`,
    ),
  ],
).enableRLS();
export const billingBarbers = pgTable(
  'billing_barbers',
  {
    ...billingColumns(),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    active: boolean('active').default(true).notNull(),
  },
  (t) => [
    unique().on(t.tenantId, t.id),
    unique().on(t.tenantId, t.userId),
    foreignKey({
      columns: [t.tenantId, t.userId],
      foreignColumns: [memberships.tenantId, memberships.userId],
    }).onDelete('cascade'),
  ],
).enableRLS();
export const billingSubscriptions = pgTable(
  'billing_subscriptions',
  {
    ...billingColumns(),
    customerId: uuid('customer_id').notNull(),
    planId: uuid('plan_id').notNull(),
  },
  (t) => [
    unique().on(t.tenantId, t.id),
    unique().on(t.customerId),
    foreignKey({
      columns: [t.tenantId, t.customerId],
      foreignColumns: [billingCustomers.tenantId, billingCustomers.id],
    }),
    foreignKey({
      columns: [t.tenantId, t.planId],
      foreignColumns: [billingPlans.tenantId, billingPlans.id],
    }),
  ],
).enableRLS();
export const billingInvoices = pgTable(
  'billing_invoices',
  {
    ...billingColumns(),
    subscriptionId: uuid('subscription_id').notNull(),
    customerId: uuid('customer_id').notNull(),
    planName: text('plan_name').notNull(),
    coverage: text('coverage').notNull(),
    amountCents: integer('amount_cents').notNull(),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    dueOn: date('due_on').notNull(),
    status: text('status').default('pending').notNull(),
    paidVia: text('paid_via'),
    environment: text('environment').default('test').notNull(),
  },
  (t) => [
    unique().on(t.tenantId, t.id),
    unique().on(t.subscriptionId, t.periodStart),
    foreignKey({
      columns: [t.tenantId, t.customerId],
      foreignColumns: [billingCustomers.tenantId, billingCustomers.id],
    }),
    foreignKey({
      columns: [t.tenantId, t.subscriptionId],
      foreignColumns: [billingSubscriptions.tenantId, billingSubscriptions.id],
    }),
    check(
      'billing_invoice_price',
      sql`${t.amountCents} between 1 and 100000000`,
    ),
    check('billing_invoice_dates', sql`${t.periodEnd} > ${t.periodStart}`),
    check(
      'billing_invoice_status',
      sql`${t.status} in ('pending','paid','refunded')`,
    ),
    check('billing_invoice_test_only', sql`${t.environment} = 'test'`),
    check(
      'billing_invoice_method',
      sql`${t.paidVia} in ('pix','credit','debit','cash')`,
    ),
  ],
).enableRLS();
export const billingPayments = pgTable(
  'billing_payments',
  {
    ...billingColumns(),
    invoiceId: uuid('invoice_id').notNull(),
    amountCents: integer('amount_cents').notNull(),
    method: text('method').notNull(),
    status: text('status').notNull(),
    reference: text('reference').notNull().unique(),
    receivedAt: timestamp('received_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    actorId: uuid('actor_id').notNull(),
  },
  (t) => [
    unique().on(t.tenantId, t.id),
    foreignKey({
      columns: [t.tenantId, t.invoiceId],
      foreignColumns: [billingInvoices.tenantId, billingInvoices.id],
    }),
    uniqueIndex('one_approved_payment_per_invoice')
      .on(t.invoiceId)
      .where(sql`${t.status} = 'approved'`),
    check(
      'billing_payment_price',
      sql`${t.amountCents} between 1 and 100000000`,
    ),
    check(
      'billing_payment_method',
      sql`${t.method} in ('pix','credit','debit','cash')`,
    ),
    check(
      'billing_payment_status',
      sql`${t.status} in ('approved','pending','declined')`,
    ),
  ],
).enableRLS();
export const billingRefunds = pgTable(
  'billing_refunds',
  {
    ...billingColumns(),
    invoiceId: uuid('invoice_id').notNull().unique(),
    paymentId: uuid('payment_id').notNull().unique(),
    amountCents: integer('amount_cents').notNull(),
    reason: text('reason').notNull(),
    actorId: uuid('actor_id').notNull(),
    refundedAt: timestamp('refunded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.tenantId, t.invoiceId],
      foreignColumns: [billingInvoices.tenantId, billingInvoices.id],
    }),
    foreignKey({
      columns: [t.tenantId, t.paymentId],
      foreignColumns: [billingPayments.tenantId, billingPayments.id],
    }),
    check(
      'billing_refund_price',
      sql`${t.amountCents} between 1 and 100000000`,
    ),
  ],
).enableRLS();
export const billingAppointments = pgTable(
  'billing_appointments',
  {
    ...billingColumns(),
    customerId: uuid('customer_id').notNull(),
    barberId: uuid('barber_id').notNull(),
    serviceId: uuid('service_id').notNull(),
    serviceName: text('service_name').notNull(),
    serviceCategory: text('service_category').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    mode: text('mode').notNull(),
    priceCents: integer('price_cents').notNull(),
    status: text('status').notNull(),
    requestId: uuid('request_id').notNull(),
  },
  (t) => [
    unique().on(t.customerId, t.requestId),
    foreignKey({
      columns: [t.tenantId, t.customerId],
      foreignColumns: [billingCustomers.tenantId, billingCustomers.id],
    }),
    foreignKey({
      columns: [t.tenantId, t.barberId],
      foreignColumns: [billingBarbers.tenantId, billingBarbers.id],
    }),
    foreignKey({
      columns: [t.tenantId, t.serviceId],
      foreignColumns: [billingServices.tenantId, billingServices.id],
    }),
    check('billing_appointment_dates', sql`${t.endsAt} > ${t.startsAt}`),
    check('billing_appointment_mode', sql`${t.mode} in ('plan','one_off')`),
    check(
      'billing_appointment_status',
      sql`${t.status} in ('confirmed','awaiting_renewal','in_service','cancelled')`,
    ),
    check('billing_appointment_price', sql`${t.priceCents} >= 0`),
  ],
).enableRLS();
