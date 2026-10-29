import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

// This suite destroys ONLY a dedicated local test database, never DATABASE_URL/Supabase.
const connection = process.env.TEST_DATABASE_URL;
if (!connection)
  throw new Error(
    'Defina TEST_DATABASE_URL apontando para PostgreSQL local e banco agendaflex_test.',
  );
const url = new URL(connection);
if (
  !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
  url.pathname !== '/agendaflex_test'
) {
  throw new Error('Os testes aceitam somente o banco local agendaflex_test.');
}
const sql = postgres(connection, { max: 8, onnotice: () => {} });
const owner = randomUUID(),
  client = randomUUID(),
  other = randomUUID(),
  staff = randomUUID(),
  stranger = randomUUID(),
  manager = randomUUID();
let n = 0;
before(async () => {
  await sql.unsafe(`DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS auth CASCADE; CREATE SCHEMA auth; DROP SCHEMA IF EXISTS drizzle CASCADE;
    DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text NOT NULL,email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA public,auth TO authenticated,anon; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`);
  const reserved = await sql.reserve();
  try {
    const full = readFileSync(
      new URL('../supabase/setup-dev.sql', import.meta.url),
      'utf8',
    );
    await reserved.unsafe(full.split('-- Migração 0002_')[0] + '\nCOMMIT;');
    await reserved.unsafe(
      readFileSync(
        new URL('../supabase/billing-update.sql', import.meta.url),
        'utf8',
      ),
    );
  } finally {
    reserved.release();
  }
  for (const id of [owner, client, other, staff, stranger, manager])
    await sql`INSERT INTO auth.users VALUES(${id},${`${id}@example.test`},now())`;
});
after(() => sql.end());
const call = (uid, slug, action, payload = {}) =>
  sql.begin(async (tx) => {
    await tx.unsafe('SET LOCAL ROLE authenticated');
    await tx`SELECT set_config('request.jwt.claim.sub',${uid},true)`;
    const rows =
      await tx`SELECT public.billing_command(${slug},${action},${tx.json(payload)}) result`;
    return rows[0].result;
  });
const snapshot = (uid, slug) => call(uid, slug, 'snapshot');
async function fixture() {
  const slug = `billing-test-${++n}`;
  const [tenant] =
    await sql`INSERT INTO tenants(name,slug) VALUES('Ross de teste',${slug}) RETURNING id`;
  for (const [uid, role] of [
    [owner, 'owner'],
    [staff, 'staff'],
    [manager, 'manager'],
  ])
    await sql`INSERT INTO memberships VALUES(${tenant.id},${uid},${role})`;
  await call(owner, slug, 'save_plan', {
    name: 'Cabelo + barba',
    priceCents: 12000,
    coverage: 'combo',
    active: true,
  });
  await call(owner, slug, 'save_service', {
    name: 'Corte',
    priceCents: 5000,
    category: 'hair',
    durationMinutes: 60,
    active: true,
  });
  await call(owner, slug, 'save_barber', {
    name: 'Barbeiro Ross',
    userId: staff,
    active: true,
  });
  await call(client, slug, 'join', { name: 'João de teste' });
  const data = await snapshot(client, slug);
  await call(client, slug, 'subscribe', { planId: data.plans[0].id });
  const mine = await snapshot(client, slug);
  const [date] =
    await sql`SELECT (((statement_timestamp() AT TIME ZONE 'America/Fortaleza')::date+1+time '09:00') AT TIME ZONE 'America/Fortaleza') starts`;
  const booking = {
    serviceId: mine.services[0].id,
    barberId: mine.barbers[0].id,
    startsAt: date.starts.toISOString(),
    mode: 'plan',
    requestId: randomUUID(),
  };
  return {
    slug,
    tenant: tenant.id,
    mine,
    invoiceId: mine.invoices[0].id,
    booking,
  };
}
const approve = (uid, f, method = 'pix') =>
  call(uid, f.slug, 'pay_test', {
    invoiceId: f.invoiceId,
    method,
    result: 'approved',
  });
const neutral =
  /Não foi possível agendar neste momento\. Por favor, entre em contato com a recepção\./;

test('pending/declined do not unlock, approved does; duplicate and simultaneous deliveries count once', async () => {
  const f = await fixture();
  await assert.rejects(call(client, f.slug, 'book', f.booking), neutral);
  for (const result of ['pending', 'declined']) {
    await call(client, f.slug, 'pay_test', {
      invoiceId: f.invoiceId,
      method: 'credit',
      result,
    });
    await assert.rejects(call(client, f.slug, 'book', f.booking), neutral);
  }
  await Promise.all([
    approve(client, f, 'debit'),
    approve(client, f, 'pix'),
    approve(client, f, 'credit'),
  ]);
  await call(client, f.slug, 'book', f.booking);
  await call(client, f.slug, 'book', f.booking);
  const data = await snapshot(client, f.slug);
  assert.equal(data.invoices.find((i) => i.id === f.invoiceId).status, 'paid');
  assert.equal(data.payments.filter((p) => p.status === 'approved').length, 1);
  assert.equal(
    data.payments.find((p) => p.status === 'approved').amountCents,
    12000,
  );
  assert.equal(data.appointments.length, 1);
  assert.equal(data.appointments[0].priceCents, 0);
  const company = await snapshot(owner, f.slug);
  assert.equal(
    company.invoices.find((i) => i.id === f.invoiceId).status,
    'paid',
  );
});
test('only owner can refund, full refund is audited and idempotent and revokes plan access', async () => {
  const f = await fixture();
  await approve(client, f);
  await call(client, f.slug, 'book', f.booking);
  for (const uid of [client, staff, manager, stranger])
    await assert.rejects(
      call(uid, f.slug, 'refund', {
        invoiceId: f.invoiceId,
        reason: 'Solicitação do cliente',
      }),
      (e) => e.code === '42501',
    );
  await Promise.all([
    call(owner, f.slug, 'refund', {
      invoiceId: f.invoiceId,
      reason: 'Cliente cancelou',
    }),
    call(owner, f.slug, 'refund', {
      invoiceId: f.invoiceId,
      reason: 'Repetição',
    }),
  ]);
  const data = await snapshot(owner, f.slug);
  assert.equal(data.refunds.length, 1);
  assert.equal(data.refunds[0].amountCents, 12000);
  assert.equal(data.invoices[0].status, 'refunded');
  assert.equal(data.appointments[0].status, 'cancelled');
  const [audit] =
    await sql`SELECT actor_id FROM billing_refunds WHERE invoice_id=${f.invoiceId}`;
  assert.equal(audit.actor_id, owner);
  await assert.rejects(
    call(client, f.slug, 'book', { ...f.booking, requestId: randomUUID() }),
    neutral,
  );
  await assert.rejects(approve(client, f), /já reembolsada/);
  await assert.rejects(
    call(owner, f.slug, 'refund', {
      invoiceId: randomUUID(),
      reason: 'Não existe',
    }),
    (e) => e.code === '42501',
  );
});
test('tenant and customer boundaries survive direct RPC calls; direct table access is forbidden', async () => {
  const a = await fixture(),
    b = await fixture();
  await approve(client, a);
  await assert.rejects(
    call(other, a.slug, 'pay_test', {
      invoiceId: a.invoiceId,
      method: 'pix',
      result: 'approved',
    }),
    (e) => e.code === '42501',
  );
  // Same owner identity is deliberately used in both fixtures; remove its role from B.
  await sql`DELETE FROM memberships WHERE tenant_id=${b.tenant} AND user_id=${owner}`;
  await assert.rejects(
    call(owner, b.slug, 'refund', {
      invoiceId: b.invoiceId,
      reason: 'Tentativa externa',
    }),
    (e) => e.code === '42501',
  );
  await assert.rejects(
    call(owner, a.slug, 'save_plan', {
      id: b.mine.plans[0].id,
      name: 'Ataque',
      priceCents: 1,
      coverage: 'combo',
      active: true,
    }),
    (e) => e.code === '42501',
  );
  const alien = await snapshot(stranger, a.slug);
  assert.equal(alien.invoices.length, 0);
  assert.equal(alien.payments.length, 0);
  assert.equal(alien.refunds.length, 0);
  assert.equal(alien.appointments.length, 0);
  assert.equal(alien.team.length, 0);
  await assert.rejects(
    sql.begin(async (tx) => {
      await tx.unsafe('SET LOCAL ROLE authenticated');
      return tx`SELECT * FROM billing_invoices`;
    }),
    (e) => e.code === '42501',
  );
  await assert.rejects(
    sql.begin(async (tx) => {
      await tx.unsafe('SET LOCAL ROLE anon');
      return tx`SELECT billing_command(${a.slug},'snapshot','{}')`;
    }),
    (e) => e.code === '42501',
  );
});
test('slots exclude lunch and occupied times; simultaneous reservations cannot double book', async () => {
  const f = await fixture();
  await approve(client, f);
  await call(other, f.slug, 'join', { name: 'Outro cliente' });
  await call(other, f.slug, 'subscribe', { planId: f.mine.plans[0].id });
  const second = await snapshot(other, f.slug);
  await call(other, f.slug, 'pay_test', {
    invoiceId: second.invoices[0].id,
    method: 'pix',
    result: 'approved',
  });
  const date = f.booking.startsAt.slice(0, 10);
  const slots = await call(client, f.slug, 'slots', {
    date,
    serviceId: f.booking.serviceId,
    barberId: f.booking.barberId,
  });
  assert.ok(slots.length > 0);
  assert.ok(
    slots.every((s) => {
      const hour = (new Date(s).getUTCHours() + 21) % 24;
      return hour < 13 || hour >= 15;
    }),
  );
  const results = await Promise.allSettled([
    call(client, f.slug, 'book', f.booking),
    call(other, f.slug, 'book', { ...f.booking, requestId: randomUUID() }),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter((r) => r.status === 'rejected').length, 1);
  const after = await call(client, f.slug, 'slots', {
    date,
    serviceId: f.booking.serviceId,
    barberId: f.booking.barberId,
  });
  assert.ok(
    !after.some(
      (s) => new Date(s).getTime() === new Date(f.booking.startsAt).getTime(),
    ),
  );
  const noon = new Date(f.booking.startsAt);
  noon.setUTCHours(16); // 13:00 Fortaleza
  await assert.rejects(
    call(client, f.slug, 'book', {
      ...f.booking,
      startsAt: noon.toISOString(),
      requestId: randomUUID(),
    }),
    /horário válido/,
  );
});
test('upcoming-cycle reservation is held before renewal; approval confirms it and refund cancels only that cycle', async () => {
  const f = await fixture();
  await approve(client, f);
  const [row] =
    await sql`SELECT (statement_timestamp() AT TIME ZONE 'America/Fortaleza')::date today`;
  const [cycle] =
    await sql`UPDATE billing_invoices SET period_end=${row.today}::date+1 WHERE id=${f.invoiceId} RETURNING period_end`;
  const [next] =
    await sql`INSERT INTO billing_invoices(tenant_id,subscription_id,customer_id,plan_name,coverage,amount_cents,period_start,period_end,due_on)
    SELECT tenant_id,subscription_id,customer_id,plan_name,coverage,amount_cents,${cycle.period_end},${cycle.period_end}::date+30,${row.today}::date-1 FROM billing_invoices WHERE id=${f.invoiceId} RETURNING id`;
  await call(client, f.slug, 'book', f.booking);
  assert.equal(
    (await snapshot(client, f.slug)).appointments[0].status,
    'awaiting_renewal',
  );
  await call(client, f.slug, 'pay_test', {
    invoiceId: next.id,
    method: 'credit',
    result: 'approved',
  });
  assert.equal(
    (await snapshot(client, f.slug)).appointments[0].status,
    'confirmed',
  );
  await call(owner, f.slug, 'refund', {
    invoiceId: next.id,
    reason: 'Cancelar próximo ciclo',
  });
  const data = await snapshot(client, f.slug);
  assert.equal(data.appointments[0].status, 'cancelled');
  assert.equal(data.invoices.find((i) => i.id === f.invoiceId).status, 'paid');
  await assert.rejects(
    call(client, f.slug, 'book', { ...f.booking, requestId: randomUUID() }),
    neutral,
  );
});
test('overdue cycle gets a discreet booking message; an explicit avulso remains available', async () => {
  const f = await fixture();
  await sql`UPDATE billing_invoices SET due_on=(statement_timestamp() AT TIME ZONE 'America/Fortaleza')::date-1 WHERE id=${f.invoiceId}`;
  assert.equal((await snapshot(client, f.slug)).invoices[0].status, 'overdue');
  await assert.rejects(call(client, f.slug, 'book', f.booking), neutral);
  await call(client, f.slug, 'book', { ...f.booking, mode: 'one_off' });
  const data = await snapshot(client, f.slug);
  assert.equal(data.appointments[0].priceCents, 5000);
  assert.equal(data.payments.length, 0);
});
test('cash is scoped to owner or assigned barber today; manager and arbitrary customer cannot mark paid', async () => {
  const f = await fixture();
  for (const uid of [client, other, staff, manager])
    await assert.rejects(
      call(uid, f.slug, 'receive_cash', { invoiceId: f.invoiceId }),
      (e) => e.code === '42501',
    );
  await sql`INSERT INTO billing_appointments(tenant_id,customer_id,barber_id,service_id,service_name,service_category,starts_at,ends_at,mode,price_cents,status,request_id)
    VALUES(${f.tenant},${f.mine.customer.id},${f.mine.barbers[0].id},${f.mine.services[0].id},'Corte','hair',(statement_timestamp() AT TIME ZONE 'America/Fortaleza')::date+time '09:00' AT TIME ZONE 'America/Fortaleza',(statement_timestamp() AT TIME ZONE 'America/Fortaleza')::date+time '10:00' AT TIME ZONE 'America/Fortaleza','one_off',5000,'confirmed',${randomUUID()})`;
  await call(staff, f.slug, 'receive_cash', { invoiceId: f.invoiceId });
  const data = await snapshot(owner, f.slug);
  assert.equal(data.invoices.find((i) => i.id === f.invoiceId).paidVia, 'cash');
  assert.equal(data.payments[0].amountCents, 12000);
});
test('issued amount and coverage are immutable snapshots when the owner edits the catalog', async () => {
  const f = await fixture();
  await call(owner, f.slug, 'save_plan', {
    id: f.mine.plans[0].id,
    name: 'Novo nome',
    priceCents: 15000,
    coverage: 'hair',
    active: true,
  });
  await approve(client, f);
  const data = await snapshot(client, f.slug);
  assert.equal(
    data.invoices.find((i) => i.id === f.invoiceId).amountCents,
    12000,
  );
  assert.equal(
    data.invoices.find((i) => i.id === f.invoiceId).planName,
    'Cabelo + barba',
  );
  assert.equal(data.payments[0].amountCents, 12000);
  await call(client, f.slug, 'subscribe', { planId: f.mine.plans[0].id });
  await call(client, f.slug, 'subscribe', { planId: f.mine.plans[0].id });
  const next = await snapshot(client, f.slug);
  assert.equal(next.invoices.length, 2);
  assert.equal(
    next.invoices.find((i) => i.status === 'pending').amountCents,
    15000,
  );
});
test('check-in verifies paid coverage again; a held booking never permits unpaid service', async () => {
  const f = await fixture();
  const [a] =
    await sql`INSERT INTO billing_appointments(tenant_id,customer_id,barber_id,service_id,service_name,service_category,starts_at,ends_at,mode,price_cents,status,request_id)
    VALUES(${f.tenant},${f.mine.customer.id},${f.mine.barbers[0].id},${f.mine.services[0].id},'Corte','hair',(statement_timestamp() AT TIME ZONE 'America/Fortaleza')::date+time '09:00' AT TIME ZONE 'America/Fortaleza',(statement_timestamp() AT TIME ZONE 'America/Fortaleza')::date+time '10:00' AT TIME ZONE 'America/Fortaleza','plan',0,'awaiting_renewal',${randomUUID()}) RETURNING id`;
  await assert.rejects(
    call(staff, f.slug, 'check_in', { appointmentId: a.id }),
    neutral,
  );
  await approve(client, f);
  await assert.rejects(
    call(client, f.slug, 'check_in', { appointmentId: a.id }),
    (e) => e.code === '42501',
  );
  await call(staff, f.slug, 'check_in', { appointmentId: a.id });
  assert.equal(
    (await snapshot(staff, f.slug)).appointments[0].status,
    'in_service',
  );
});
test('rollover issues current unpaid cycles automatically without duplicating them or reviving refunded subscriptions', async () => {
  const f = await fixture();
  await approve(client, f);
  await sql`UPDATE billing_invoices SET period_start=(period_start-interval '1 month')::date,period_end=(period_end-interval '1 month')::date WHERE id=${f.invoiceId}`;
  const data = await snapshot(owner, f.slug);
  const current = data.invoices.find((i) => i.id !== f.invoiceId);
  assert.ok(current);
  assert.equal(current.status, 'overdue');
  await snapshot(owner, f.slug);
  assert.equal((await snapshot(owner, f.slug)).invoices.length, 2);
  await call(owner, f.slug, 'refund', {
    invoiceId: f.invoiceId,
    reason: 'Encerrar assinatura',
  });
  await assert.rejects(
    call(client, f.slug, 'subscribe', { planId: f.mine.plans[0].id }),
    /ajustar sua assinatura/,
  );
});
test('migration update refuses reapplication and all billing tables retain RLS without direct client grants', async () => {
  const reserved = await sql.reserve();
  try {
    await assert.rejects(
      reserved.unsafe(
        readFileSync(
          new URL('../supabase/billing-update.sql', import.meta.url),
          'utf8',
        ),
      ),
      /Histórico diferente/,
    );
    await reserved.unsafe('ROLLBACK');
  } finally {
    reserved.release();
  }
  const tables =
    await sql`SELECT relname,relrowsecurity,has_table_privilege('authenticated',oid,'SELECT') can_read,has_table_privilege('authenticated',oid,'INSERT') can_write FROM pg_class WHERE relnamespace='public'::regnamespace AND relname LIKE 'billing_%' AND relkind='r'`;
  assert.equal(tables.length, 9);
  assert.ok(
    tables.every((t) => t.relrowsecurity && !t.can_read && !t.can_write),
  );
});
