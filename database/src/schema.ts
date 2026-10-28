import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core';
export const tenantRole = pgEnum('tenant_role', ['owner', 'manager', 'staff']);
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();
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
  (table) => [primaryKey({ columns: [table.tenantId, table.userId] })],
).enableRLS();
