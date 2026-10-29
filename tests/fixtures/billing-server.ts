import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { billingSnapshotSchema, billingSlotsSchema } from '@agendaflex/shared';
import { buildApp } from '../../apps/api/src/app';
import { BillingError } from '../../apps/api/src/application/billing';
import { fixtureIds, fixtureSubject } from './billing-identities';
if (process.env.BILLING_BROWSER_FIXTURE !== '1')
  throw new Error('Local test fixture disabled.');
const connection = process.env.TEST_DATABASE_URL;
if (!connection) throw new Error('TEST_DATABASE_URL is required.');
const url = new URL(connection);
if (
  !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
  url.pathname !== '/agendaflex_test'
)
  throw new Error(
    'Only a dedicated local agendaflex_test database is allowed.',
  );
const sql = postgres(connection, { max: 8, onnotice: () => {} });
await sql.unsafe(`DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS auth CASCADE; CREATE SCHEMA auth; DROP SCHEMA IF EXISTS drizzle CASCADE;
  DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$;
  CREATE TABLE auth.users(id uuid PRIMARY KEY,email text NOT NULL,email_confirmed_at timestamptz);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  GRANT USAGE ON SCHEMA public,auth TO authenticated,anon; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`);
const reserved = await sql.reserve();
try {
  await reserved.unsafe(
    readFileSync(
      new URL('../../database/supabase/setup-dev.sql', import.meta.url),
      'utf8',
    ),
  );
} finally {
  reserved.release();
}
async function rpc(
  token: string,
  slug: string,
  action: string,
  payload: postgres.JSONValue,
) {
  const subject = fixtureSubject(token);
  if (!subject) throw new BillingError(403, 'Acesso restrito.');
  try {
    return await sql.begin(async (tx) => {
      await tx.unsafe('SET LOCAL ROLE authenticated');
      await tx`SELECT set_config('request.jwt.claim.sub',${subject},true)`;
      const [result] =
        await tx`SELECT billing_command(${slug},${action},${tx.json(payload)}) result`;
      return result!.result as unknown;
    });
  } catch (error) {
    const db = error as { code?: string; message: string };
    throw new BillingError(
      db.code === '42501' ? 403 : 409,
      db.code === '42501' ? 'Acesso restrito.' : db.message,
    );
  }
}
const app = buildApp({
  webOrigin: 'http://localhost:5178',
  identity: {
    async accountForToken(token) {
      const id = fixtureSubject(token);
      if (!id) return null;
      const rows =
        await sql`SELECT m.tenant_id,t.name,t.slug,m.role FROM memberships m JOIN tenants t ON t.id=m.tenant_id WHERE m.user_id=${id}`;
      return {
        user: {
          id,
          email: `${Object.entries(fixtureIds).find(([, uid]) => uid === id)![0]}@example.test`,
        },
        memberships: rows.map((r) => ({
          tenantId: r.tenant_id,
          tenantName: r.name,
          tenantSlug: r.slug,
          role: r.role,
        })),
      };
    },
  },
  billing: {
    async snapshot(token, slug) {
      return billingSnapshotSchema.parse(
        await rpc(token, slug, 'snapshot', {}),
      );
    },
    async execute(token, slug, command) {
      const { action, ...payload } = command;
      await rpc(token, slug, action, payload);
    },
    async slots(token, slug, query) {
      return billingSlotsSchema.parse(await rpc(token, slug, 'slots', query));
    },
  },
});
async function reset() {
  await sql.unsafe('TRUNCATE tenants CASCADE; DELETE FROM auth.users;');
  for (const [role, id] of Object.entries(fixtureIds))
    await sql`INSERT INTO auth.users VALUES(${id},${`${role}@example.test`},now())`;
  const [tenant] =
    await sql`INSERT INTO tenants(name,slug) VALUES('Ross Barbearia','ross-barbearia') RETURNING id`;
  await sql`INSERT INTO memberships VALUES(${tenant!.id},${fixtureIds.owner},'owner'),(${tenant!.id},${fixtureIds.staff},'staff')`;
  const { fixtureToken } = await import('./billing-identities');
  const token = fixtureToken(fixtureIds.owner);
  await rpc(token, 'ross-barbearia', 'save_plan', {
    name: 'Ross completo',
    priceCents: 12000,
    coverage: 'combo',
    active: true,
  });
  await rpc(token, 'ross-barbearia', 'save_service', {
    name: 'Corte Ross',
    priceCents: 5000,
    category: 'hair',
    durationMinutes: 60,
    active: true,
  });
  await rpc(token, 'ross-barbearia', 'save_barber', {
    name: 'Barbeiro Ross',
    userId: fixtureIds.staff,
    active: true,
  });
  return { ok: true };
}
app.post('/__fixture/reset', reset);
app.post('/__fixture/overdue', async () => {
  await sql`UPDATE billing_invoices SET due_on=(statement_timestamp() AT TIME ZONE 'America/Fortaleza')::date-1 WHERE status='pending'`;
  return { ok: true };
});
await reset();
await app.listen({ host: '127.0.0.1', port: 3003 });
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    void app.close().then(() => sql.end());
  });
