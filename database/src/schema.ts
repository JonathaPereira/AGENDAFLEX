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
