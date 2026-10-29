-- AgendaFlex: configuração inicial de um projeto Supabase de DESENVOLVIMENTO vazio.
-- Gerado por pnpm db:setup-sql. Não editar nem executar em produção.
-- Registra as mesmas migrações do Drizzle, permitindo usar db:migrate depois.
BEGIN;
CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id serial PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations) THEN
    RAISE EXCEPTION 'Já existem migrações aplicadas. Use pnpm db:migrate; não repita este setup.';
  END IF;
END $$;

-- Migração 0000_burly_legion
CREATE TYPE "public"."tenant_role" AS ENUM('owner', 'manager', 'staff');--> statement-breakpoint
CREATE TABLE "memberships" (
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "tenant_role" NOT NULL,
	CONSTRAINT "memberships_tenant_id_user_id_pk" PRIMARY KEY("tenant_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('2b3ef18644506a6211df534f8999fa71571d66ab107d839625034df52c6eecc6', 1793209658859);

-- Migração 0001_legal_unicorn
CREATE UNIQUE INDEX "one_owner_per_tenant" ON "memberships" USING btree ("tenant_id") WHERE "memberships"."role" = 'owner';--> statement-breakpoint
CREATE POLICY "memberships_read_own" ON "memberships" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("memberships"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "tenants_read_member" ON "tenants" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from public.memberships m where m.tenant_id = tenants.id and m.user_id = (select auth.uid())));--> statement-breakpoint
REVOKE ALL ON TABLE public.tenants, public.memberships FROM anon, authenticated;
--> statement-breakpoint
GRANT SELECT ON TABLE public.tenants, public.memberships TO authenticated;

INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('c04d93297dce746ddd7264fe5050c2f5fbb1297fdba65dc91b70ff49cd389c1f', 1793293754037);

-- Migração 0002_polite_yellowjacket
CREATE TABLE "billing_appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"barber_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"service_name" text NOT NULL,
	"service_category" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"mode" text NOT NULL,
	"price_cents" integer NOT NULL,
	"status" text NOT NULL,
	"request_id" uuid NOT NULL,
	CONSTRAINT "billing_appointments_customer_id_request_id_unique" UNIQUE("customer_id","request_id"),
	CONSTRAINT "billing_appointment_dates" CHECK ("billing_appointments"."ends_at" > "billing_appointments"."starts_at"),
	CONSTRAINT "billing_appointment_mode" CHECK ("billing_appointments"."mode" in ('plan','one_off')),
	CONSTRAINT "billing_appointment_status" CHECK ("billing_appointments"."status" in ('confirmed','awaiting_renewal','in_service','cancelled')),
	CONSTRAINT "billing_appointment_price" CHECK ("billing_appointments"."price_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "billing_appointments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing_barbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "billing_barbers_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "billing_barbers_tenant_id_user_id_unique" UNIQUE("tenant_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "billing_barbers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "billing_customers_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "billing_customers_tenant_id_user_id_unique" UNIQUE("tenant_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "billing_customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"plan_name" text NOT NULL,
	"coverage" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"due_on" date NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_via" text,
	"environment" text DEFAULT 'test' NOT NULL,
	CONSTRAINT "billing_invoices_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "billing_invoices_subscription_id_period_start_unique" UNIQUE("subscription_id","period_start"),
	CONSTRAINT "billing_invoice_price" CHECK ("billing_invoices"."amount_cents" between 1 and 100000000),
	CONSTRAINT "billing_invoice_dates" CHECK ("billing_invoices"."period_end" > "billing_invoices"."period_start"),
	CONSTRAINT "billing_invoice_status" CHECK ("billing_invoices"."status" in ('pending','paid','refunded')),
	CONSTRAINT "billing_invoice_test_only" CHECK ("billing_invoices"."environment" = 'test'),
	CONSTRAINT "billing_invoice_method" CHECK ("billing_invoices"."paid_via" in ('pix','credit','debit','cash'))
);
--> statement-breakpoint
ALTER TABLE "billing_invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"method" text NOT NULL,
	"status" text NOT NULL,
	"reference" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" uuid NOT NULL,
	CONSTRAINT "billing_payments_reference_unique" UNIQUE("reference"),
	CONSTRAINT "billing_payments_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "billing_payment_price" CHECK ("billing_payments"."amount_cents" between 1 and 100000000),
	CONSTRAINT "billing_payment_method" CHECK ("billing_payments"."method" in ('pix','credit','debit','cash')),
	CONSTRAINT "billing_payment_status" CHECK ("billing_payments"."status" in ('approved','pending','declined'))
);
--> statement-breakpoint
ALTER TABLE "billing_payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer NOT NULL,
	"coverage" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "billing_plans_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "billing_plan_price" CHECK ("billing_plans"."price_cents" between 1 and 100000000),
	CONSTRAINT "billing_plan_coverage" CHECK ("billing_plans"."coverage" in ('hair','beard','combo'))
);
--> statement-breakpoint
ALTER TABLE "billing_plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"reason" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"refunded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_refunds_invoice_id_unique" UNIQUE("invoice_id"),
	CONSTRAINT "billing_refunds_payment_id_unique" UNIQUE("payment_id"),
	CONSTRAINT "billing_refund_price" CHECK ("billing_refunds"."amount_cents" between 1 and 100000000)
);
--> statement-breakpoint
ALTER TABLE "billing_refunds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer NOT NULL,
	"category" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "billing_services_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "billing_service_price" CHECK ("billing_services"."price_cents" between 1 and 100000000),
	CONSTRAINT "billing_service_category" CHECK ("billing_services"."category" in ('hair','beard','combo','other')),
	CONSTRAINT "billing_service_duration" CHECK ("billing_services"."duration_minutes" between 15 and 180 and "billing_services"."duration_minutes" % 15 = 0)
);
--> statement-breakpoint
ALTER TABLE "billing_services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	CONSTRAINT "billing_subscriptions_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "billing_subscriptions_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "billing_appointments" ADD CONSTRAINT "billing_appointments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_appointments" ADD CONSTRAINT "billing_appointments_tenant_id_customer_id_billing_customers_tenant_id_id_fk" FOREIGN KEY ("tenant_id","customer_id") REFERENCES "public"."billing_customers"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_appointments" ADD CONSTRAINT "billing_appointments_tenant_id_barber_id_billing_barbers_tenant_id_id_fk" FOREIGN KEY ("tenant_id","barber_id") REFERENCES "public"."billing_barbers"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_appointments" ADD CONSTRAINT "billing_appointments_tenant_id_service_id_billing_services_tenant_id_id_fk" FOREIGN KEY ("tenant_id","service_id") REFERENCES "public"."billing_services"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_barbers" ADD CONSTRAINT "billing_barbers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_barbers" ADD CONSTRAINT "billing_barbers_tenant_id_user_id_memberships_tenant_id_user_id_fk" FOREIGN KEY ("tenant_id","user_id") REFERENCES "public"."memberships"("tenant_id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_tenant_id_customer_id_billing_customers_tenant_id_id_fk" FOREIGN KEY ("tenant_id","customer_id") REFERENCES "public"."billing_customers"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_tenant_id_subscription_id_billing_subscriptions_tenant_id_id_fk" FOREIGN KEY ("tenant_id","subscription_id") REFERENCES "public"."billing_subscriptions"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_tenant_id_invoice_id_billing_invoices_tenant_id_id_fk" FOREIGN KEY ("tenant_id","invoice_id") REFERENCES "public"."billing_invoices"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_plans" ADD CONSTRAINT "billing_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_refunds" ADD CONSTRAINT "billing_refunds_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_refunds" ADD CONSTRAINT "billing_refunds_tenant_id_invoice_id_billing_invoices_tenant_id_id_fk" FOREIGN KEY ("tenant_id","invoice_id") REFERENCES "public"."billing_invoices"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_refunds" ADD CONSTRAINT "billing_refunds_tenant_id_payment_id_billing_payments_tenant_id_id_fk" FOREIGN KEY ("tenant_id","payment_id") REFERENCES "public"."billing_payments"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_services" ADD CONSTRAINT "billing_services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_tenant_id_customer_id_billing_customers_tenant_id_id_fk" FOREIGN KEY ("tenant_id","customer_id") REFERENCES "public"."billing_customers"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_tenant_id_plan_id_billing_plans_tenant_id_id_fk" FOREIGN KEY ("tenant_id","plan_id") REFERENCES "public"."billing_plans"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_approved_payment_per_invoice" ON "billing_payments" USING btree ("invoice_id") WHERE "billing_payments"."status" = 'approved';

INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('b80dbf2df98af046bf4fb12bc0f49e1cbdd4ba79f9f755c64ae4f2719d594d23', 1793300065702);

-- Migração 0003_billing-commands
-- Test-only billing. No gateway credentials, live charges, or card details are stored.
-- RLS is enabled on every table; all browser writes (and direct reads) are revoked.
REVOKE ALL ON public.billing_customers, public.billing_plans, public.billing_services,
  public.billing_barbers, public.billing_subscriptions, public.billing_invoices,
  public.billing_payments, public.billing_refunds, public.billing_appointments
  FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE FUNCTION public.billing_command(p_slug text, p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_shop public.tenants%ROWTYPE;
  v_role text;
  v_customer public.billing_customers%ROWTYPE;
  v_plan public.billing_plans%ROWTYPE;
  v_service public.billing_services%ROWTYPE;
  v_barber public.billing_barbers%ROWTYPE;
  v_sub public.billing_subscriptions%ROWTYPE;
  v_invoice public.billing_invoices%ROWTYPE;
  v_payment public.billing_payments%ROWTYPE;
  v_appointment public.billing_appointments%ROWTYPE;
  v_id uuid;
  v_date date := (statement_timestamp() AT TIME ZONE 'America/Fortaleza')::date;
  v_month date := date_trunc('month', statement_timestamp() AT TIME ZONE 'America/Fortaleza')::date;
  v_period date;
  v_start timestamptz;
  v_end timestamptz;
  v_local timestamp;
  v_status text;
  v_method text;
  v_message constant text := 'Não foi possível agendar neste momento. Por favor, entre em contato com a recepção.';
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid AND email_confirmed_at IS NOT NULL;
  IF v_uid IS NULL OR v_email IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Autenticação necessária.';
  END IF;
  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Solicitação inválida.';
  END IF;
  SELECT * INTO v_shop FROM public.tenants WHERE slug = p_slug;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Estabelecimento indisponível.'; END IF;
  SELECT role::text INTO v_role FROM public.memberships WHERE tenant_id = v_shop.id AND user_id = v_uid;
  v_role := coalesce(v_role, 'customer');
  IF p_action NOT IN ('snapshot','slots','join','save_plan','save_service','save_barber','subscribe','pay_test','receive_cash','refund','book','cancel','check_in') OR p_action IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Solicitação inválida.';
  END IF;
  -- One transaction lock per tenant serializes financial transitions and slot allocation.
  -- It also prevents concurrent payment/refund/booking commands from observing partial changes.
  IF p_action <> 'slots' THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(v_shop.id::text, 0));
  END IF;
  SELECT * INTO v_customer FROM public.billing_customers WHERE tenant_id = v_shop.id AND user_id = v_uid;

  -- Lazy, idempotent rollover: opening/refreshing a portal issues current cycles
  -- and the next cycle within 7 days of month-end for previously paying subscribers.
  -- There is no background charge, card debit, or paid scheduling service.
  IF p_action='snapshot' THEN
    INSERT INTO public.billing_invoices(tenant_id,subscription_id,customer_id,plan_name,coverage,amount_cents,period_start,period_end,due_on)
      SELECT v_shop.id,s.id,s.customer_id,p.name,p.coverage,p.price_cents,v_month,(v_month+interval '1 month')::date,v_month-3
      FROM public.billing_subscriptions s JOIN public.billing_plans p ON p.id=s.plan_id
      JOIN public.billing_customers c ON c.id=s.customer_id
      WHERE s.tenant_id=v_shop.id AND (v_role='owner' OR c.user_id=v_uid)
        AND EXISTS(SELECT 1 FROM public.billing_invoices i WHERE i.subscription_id=s.id AND i.status='paid')
        AND NOT EXISTS(SELECT 1 FROM public.billing_invoices i WHERE i.subscription_id=s.id AND i.status='refunded')
      ON CONFLICT(subscription_id,period_start) DO NOTHING;
    IF v_date >= (v_month+interval '1 month')::date-7 THEN
      INSERT INTO public.billing_invoices(tenant_id,subscription_id,customer_id,plan_name,coverage,amount_cents,period_start,period_end,due_on)
        SELECT v_shop.id,s.id,s.customer_id,p.name,p.coverage,p.price_cents,(v_month+interval '1 month')::date,(v_month+interval '2 months')::date,(v_month+interval '1 month')::date-3
        FROM public.billing_subscriptions s JOIN public.billing_plans p ON p.id=s.plan_id
        JOIN public.billing_customers c ON c.id=s.customer_id
        WHERE s.tenant_id=v_shop.id AND (v_role='owner' OR c.user_id=v_uid)
          AND EXISTS(SELECT 1 FROM public.billing_invoices i WHERE i.subscription_id=s.id AND i.status='paid' AND i.period_start=v_month)
          AND NOT EXISTS(SELECT 1 FROM public.billing_invoices i WHERE i.subscription_id=s.id AND i.status='refunded')
        ON CONFLICT(subscription_id,period_start) DO NOTHING;
    END IF;
  END IF;

  IF p_action='slots' THEN
    SELECT * INTO v_barber FROM public.billing_barbers WHERE id=(p_payload->>'barberId')::uuid AND tenant_id=v_shop.id AND active;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Profissional indisponível.'; END IF;
    SELECT * INTO v_service FROM public.billing_services WHERE id=(p_payload->>'serviceId')::uuid AND tenant_id=v_shop.id AND active;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Serviço indisponível.'; END IF;
    IF (p_payload->>'date')::date NOT BETWEEN v_date AND v_date+14 OR p_payload->>'date' IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Data indisponível.';
    END IF;
    RETURN (SELECT coalesce(jsonb_agg(s.starts_at ORDER BY s.starts_at),'[]'::jsonb)
      FROM (SELECT t AT TIME ZONE 'America/Fortaleza' AS starts_at,
        (t+make_interval(mins=>v_service.duration_minutes)) AT TIME ZONE 'America/Fortaleza' AS ends_at
        FROM generate_series((p_payload->>'date')::date+time '09:00',(p_payload->>'date')::date+time '21:00',interval '15 minutes') t
        WHERE t::time+make_interval(mins=>v_service.duration_minutes)<=time '21:00'
          AND NOT (t::time<time '15:00' AND t::time+make_interval(mins=>v_service.duration_minutes)>time '13:00')) s
      WHERE s.starts_at>statement_timestamp() AND NOT EXISTS(SELECT 1 FROM public.billing_appointments a
        WHERE a.tenant_id=v_shop.id AND (a.barber_id=v_barber.id OR a.customer_id=v_customer.id)
          AND a.status<>'cancelled' AND a.starts_at<s.ends_at AND a.ends_at>s.starts_at));
  END IF;

  IF p_action IN ('save_plan','save_service','save_barber','refund') AND v_role <> 'owner' THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Acesso restrito ao empresário.';
  END IF;

  IF p_action = 'join' THEN
    IF length(trim(p_payload->>'name')) NOT BETWEEN 2 AND 100 OR p_payload->>'name' IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Informe seu nome.';
    END IF;
    INSERT INTO public.billing_customers (tenant_id,user_id,name,email)
      VALUES (v_shop.id,v_uid,trim(p_payload->>'name'),v_email)
      ON CONFLICT (tenant_id,user_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

  ELSIF p_action IN ('save_plan','save_service','save_barber') THEN
    v_id := coalesce((p_payload->>'id')::uuid, gen_random_uuid());
    IF length(trim(p_payload->>'name')) NOT BETWEEN 2 AND 100 OR p_payload->>'name' IS NULL OR jsonb_typeof(p_payload->'active') IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Cadastro inválido.';
    END IF;
    IF p_action = 'save_plan' THEN
      IF EXISTS (SELECT 1 FROM public.billing_plans WHERE id = v_id AND tenant_id <> v_shop.id) THEN RAISE insufficient_privilege; END IF;
      INSERT INTO public.billing_plans(id,tenant_id,name,price_cents,coverage,active)
        VALUES(v_id,v_shop.id,trim(p_payload->>'name'),(p_payload->>'priceCents')::integer,p_payload->>'coverage',(p_payload->>'active')::boolean)
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,price_cents=EXCLUDED.price_cents,coverage=EXCLUDED.coverage,active=EXCLUDED.active;
    ELSIF p_action = 'save_service' THEN
      IF EXISTS (SELECT 1 FROM public.billing_services WHERE id = v_id AND tenant_id <> v_shop.id) THEN RAISE insufficient_privilege; END IF;
      INSERT INTO public.billing_services(id,tenant_id,name,price_cents,category,duration_minutes,active)
        VALUES(v_id,v_shop.id,trim(p_payload->>'name'),(p_payload->>'priceCents')::integer,p_payload->>'category',(p_payload->>'durationMinutes')::integer,(p_payload->>'active')::boolean)
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,price_cents=EXCLUDED.price_cents,category=EXCLUDED.category,duration_minutes=EXCLUDED.duration_minutes,active=EXCLUDED.active;
    ELSE
      IF EXISTS (SELECT 1 FROM public.billing_barbers WHERE id = v_id AND tenant_id <> v_shop.id) OR NOT EXISTS (
        SELECT 1 FROM public.memberships WHERE tenant_id=v_shop.id AND user_id=(p_payload->>'userId')::uuid AND role IN ('owner','staff')
      ) THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Selecione uma conta de barbeiro vinculada ao estabelecimento.'; END IF;
      INSERT INTO public.billing_barbers(id,tenant_id,user_id,name,active)
        VALUES(v_id,v_shop.id,(p_payload->>'userId')::uuid,trim(p_payload->>'name'),(p_payload->>'active')::boolean)
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,active=EXCLUDED.active;
      -- Identity is immutable after creation: editing a name never reassigns appointments.
    END IF;

  ELSIF p_action = 'subscribe' THEN
    IF v_customer.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Complete seu cadastro primeiro.'; END IF;
    SELECT * INTO v_plan FROM public.billing_plans WHERE id=(p_payload->>'planId')::uuid AND tenant_id=v_shop.id AND active;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Plano indisponível.'; END IF;
    SELECT * INTO v_sub FROM public.billing_subscriptions WHERE customer_id=v_customer.id;
    IF FOUND AND EXISTS(SELECT 1 FROM public.billing_invoices WHERE subscription_id=v_sub.id AND status='refunded') THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Para ajustar sua assinatura, entre em contato com a recepção.';
    END IF;
    IF FOUND AND v_sub.plan_id <> v_plan.id THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Para trocar de plano, entre em contato com a recepção.';
    END IF;
    INSERT INTO public.billing_subscriptions(tenant_id,customer_id,plan_id) VALUES(v_shop.id,v_customer.id,v_plan.id)
      ON CONFLICT(customer_id) DO NOTHING;
    SELECT * INTO v_sub FROM public.billing_subscriptions WHERE customer_id=v_customer.id;
    v_period := v_month;
    IF EXISTS(SELECT 1 FROM public.billing_invoices WHERE subscription_id=v_sub.id AND period_start=v_month AND status='paid') THEN
      v_period := (v_month + interval '1 month')::date;
    END IF;
    IF EXISTS(SELECT 1 FROM public.billing_invoices WHERE subscription_id=v_sub.id AND period_start=v_period AND status='refunded') THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Para ajustar sua assinatura, entre em contato com a recepção.';
    END IF;
    INSERT INTO public.billing_invoices(tenant_id,subscription_id,customer_id,plan_name,coverage,amount_cents,period_start,period_end,due_on)
      VALUES(v_shop.id,v_sub.id,v_customer.id,v_plan.name,v_plan.coverage,v_plan.price_cents,v_period,(v_period+interval '1 month')::date,greatest(v_date,v_period-3))
      ON CONFLICT(subscription_id,period_start) DO NOTHING;

  ELSIF p_action IN ('pay_test','receive_cash','refund') THEN
    SELECT * INTO v_invoice FROM public.billing_invoices WHERE id=(p_payload->>'invoiceId')::uuid AND tenant_id=v_shop.id;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Mensalidade indisponível.'; END IF;
    IF v_invoice.environment <> 'test' THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Operação disponível apenas no ambiente de teste.'; END IF;
    IF p_action = 'pay_test' THEN
      IF v_invoice.customer_id IS DISTINCT FROM v_customer.id AND v_role <> 'owner' THEN RAISE insufficient_privilege; END IF;
      v_method := p_payload->>'method';
      v_status := p_payload->>'result';
      IF v_method IS NULL OR v_method NOT IN ('pix','credit','debit') OR v_status IS NULL OR v_status NOT IN ('approved','pending','declined') THEN
        RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Pagamento de teste inválido.';
      END IF;
    ELSIF p_action = 'receive_cash' THEN
      IF v_role <> 'owner' AND NOT (v_role = 'staff' AND EXISTS(
        SELECT 1 FROM public.billing_appointments a JOIN public.billing_barbers b ON b.id=a.barber_id
        WHERE a.customer_id=v_invoice.customer_id AND a.tenant_id=v_shop.id AND b.user_id=v_uid AND a.status <> 'cancelled'
          AND (a.starts_at AT TIME ZONE 'America/Fortaleza')::date=v_date
          AND v_date >= v_invoice.period_start AND v_date < v_invoice.period_end
      )) THEN RAISE insufficient_privilege; END IF;
      v_method := 'cash'; v_status := 'approved';
    END IF;
    IF p_action = 'refund' THEN
      IF v_invoice.status = 'refunded' THEN RETURN jsonb_build_object('ok',true); END IF;
      IF v_invoice.status <> 'paid' OR length(trim(p_payload->>'reason')) NOT BETWEEN 3 AND 300 OR p_payload->>'reason' IS NULL THEN
        RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Selecione uma mensalidade paga e informe o motivo.';
      END IF;
      SELECT * INTO STRICT v_payment FROM public.billing_payments WHERE invoice_id=v_invoice.id AND status='approved';
      INSERT INTO public.billing_refunds(tenant_id,invoice_id,payment_id,amount_cents,reason,actor_id)
        VALUES(v_shop.id,v_invoice.id,v_payment.id,v_payment.amount_cents,trim(p_payload->>'reason'),v_uid);
      UPDATE public.billing_invoices SET status='refunded' WHERE id=v_invoice.id;
      UPDATE public.billing_appointments a SET status='cancelled'
        WHERE a.tenant_id=v_shop.id AND a.customer_id=v_invoice.customer_id AND a.mode='plan'
          AND a.status IN ('confirmed','awaiting_renewal') AND a.starts_at > statement_timestamp()
          AND NOT EXISTS(SELECT 1 FROM public.billing_invoices paid WHERE paid.customer_id=a.customer_id AND paid.status='paid'
            AND (a.starts_at AT TIME ZONE 'America/Fortaleza')::date>=paid.period_start
            AND (a.starts_at AT TIME ZONE 'America/Fortaleza')::date<paid.period_end);
    ELSE
      IF v_invoice.status='refunded' THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Mensalidade já reembolsada.'; END IF;
      IF v_invoice.status='paid' THEN RETURN jsonb_build_object('ok',true); END IF;
      INSERT INTO public.billing_payments(tenant_id,invoice_id,amount_cents,method,status,reference,actor_id)
        VALUES(v_shop.id,v_invoice.id,v_invoice.amount_cents,v_method,v_status,'test:'||v_invoice.id::text||':'||v_method||':'||v_status,v_uid)
        ON CONFLICT(reference) DO NOTHING;
      IF v_status='approved' THEN
        UPDATE public.billing_invoices SET status='paid',paid_via=v_method WHERE id=v_invoice.id;
        UPDATE public.billing_appointments SET status='confirmed'
          WHERE tenant_id=v_shop.id AND customer_id=v_invoice.customer_id AND mode='plan' AND status='awaiting_renewal'
            AND (service_category=v_invoice.coverage OR (v_invoice.coverage='combo' AND service_category IN ('hair','beard','combo')))
            AND (starts_at AT TIME ZONE 'America/Fortaleza')::date >= v_invoice.period_start
            AND (starts_at AT TIME ZONE 'America/Fortaleza')::date < v_invoice.period_end;
      END IF;
    END IF;

  ELSIF p_action = 'book' THEN
    IF v_customer.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Complete seu cadastro primeiro.'; END IF;
    IF EXISTS(SELECT 1 FROM public.billing_appointments WHERE customer_id=v_customer.id AND request_id=(p_payload->>'requestId')::uuid) THEN
      RETURN jsonb_build_object('ok',true);
    END IF;
    SELECT * INTO v_service FROM public.billing_services WHERE id=(p_payload->>'serviceId')::uuid AND tenant_id=v_shop.id AND active;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Serviço indisponível.'; END IF;
    SELECT * INTO v_barber FROM public.billing_barbers WHERE id=(p_payload->>'barberId')::uuid AND tenant_id=v_shop.id AND active;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Profissional indisponível.'; END IF;
    v_start := (p_payload->>'startsAt')::timestamptz;
    v_end := v_start + make_interval(mins=>v_service.duration_minutes);
    v_local := v_start AT TIME ZONE 'America/Fortaleza';
    IF v_start IS NULL OR v_start <= statement_timestamp() OR v_local::date NOT BETWEEN v_date AND v_date+14
      OR v_local::time < time '09:00' OR (v_end AT TIME ZONE 'America/Fortaleza')::date <> v_local::date
      OR (v_end AT TIME ZONE 'America/Fortaleza')::time > time '21:00'
      OR (v_local::time < time '15:00' AND (v_end AT TIME ZONE 'America/Fortaleza')::time > time '13:00')
      OR extract(minute FROM v_local)::integer % 15 <> 0 OR extract(second FROM v_local) <> 0 THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Escolha um horário válido nos próximos 15 dias, das 09h às 21h, com pausa das 13h às 15h.';
    END IF;
    v_status := 'confirmed';
    IF p_payload->>'mode' = 'plan' THEN
      -- Current-cycle payment permits reserving next-cycle appointments before renewal.
      -- A refunded target cycle never grants this advance-reservation exception.
      IF NOT EXISTS(SELECT 1 FROM public.billing_invoices WHERE customer_id=v_customer.id AND status='paid' AND v_date>=period_start AND v_date<period_end) THEN
        RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE=v_message;
      END IF;
      SELECT * INTO v_invoice FROM public.billing_invoices WHERE customer_id=v_customer.id
        AND v_local::date>=period_start AND v_local::date<period_end;
      IF FOUND AND v_invoice.status='refunded' THEN RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE=v_message; END IF;
      IF FOUND AND NOT (v_invoice.coverage=v_service.category OR (v_invoice.coverage='combo' AND v_service.category IN ('hair','beard','combo'))) THEN
        RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Este serviço não está incluído no seu plano. Consulte a recepção ou escolha avulso.';
      END IF;
      IF NOT FOUND OR v_invoice.status <> 'paid' THEN
        v_status := 'awaiting_renewal';
        SELECT * INTO v_invoice FROM public.billing_invoices WHERE customer_id=v_customer.id AND status='paid' AND v_date>=period_start AND v_date<period_end;
      END IF;
      IF NOT (v_invoice.coverage=v_service.category OR (v_invoice.coverage='combo' AND v_service.category IN ('hair','beard','combo'))) THEN
        RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Este serviço não está incluído no seu plano. Consulte a recepção ou escolha avulso.';
      END IF;
    ELSIF p_payload->>'mode' IS DISTINCT FROM 'one_off' THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Escolha plano ou avulso.'; END IF;
    IF EXISTS(SELECT 1 FROM public.billing_appointments WHERE tenant_id=v_shop.id AND status<>'cancelled'
      AND (barber_id=v_barber.id OR customer_id=v_customer.id) AND starts_at<v_end AND ends_at>v_start) THEN
      RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='Este horário acabou de ficar indisponível. Escolha outro horário.';
    END IF;
    INSERT INTO public.billing_appointments(tenant_id,customer_id,barber_id,service_id,service_name,service_category,starts_at,ends_at,mode,price_cents,status,request_id)
      VALUES(v_shop.id,v_customer.id,v_barber.id,v_service.id,v_service.name,v_service.category,v_start,v_end,p_payload->>'mode',CASE WHEN p_payload->>'mode'='plan' THEN 0 ELSE v_service.price_cents END,v_status,(p_payload->>'requestId')::uuid);

  ELSIF p_action IN ('cancel','check_in') THEN
    SELECT * INTO v_appointment FROM public.billing_appointments WHERE id=(p_payload->>'appointmentId')::uuid AND tenant_id=v_shop.id;
    IF NOT FOUND THEN RAISE insufficient_privilege; END IF;
    SELECT * INTO v_barber FROM public.billing_barbers WHERE id=v_appointment.barber_id;
    IF p_action='cancel' THEN
      IF v_role <> 'owner' AND NOT (v_role='staff' AND v_barber.user_id=v_uid) AND v_appointment.customer_id IS DISTINCT FROM v_customer.id THEN RAISE insufficient_privilege; END IF;
      IF v_appointment.status='in_service' THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Atendimento já iniciado. Consulte a recepção.'; END IF;
      UPDATE public.billing_appointments SET status='cancelled' WHERE id=v_appointment.id;
    ELSE
      IF v_role <> 'owner' AND NOT (v_role='staff' AND v_barber.user_id=v_uid) THEN RAISE insufficient_privilege; END IF;
      IF v_appointment.status NOT IN ('confirmed','awaiting_renewal') OR (v_appointment.starts_at AT TIME ZONE 'America/Fortaleza')::date <> v_date THEN
        RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Selecione um atendimento de hoje ainda não iniciado.';
      END IF;
      IF v_appointment.mode='plan' AND NOT EXISTS(SELECT 1 FROM public.billing_invoices WHERE customer_id=v_appointment.customer_id AND status='paid' AND v_date>=period_start AND v_date<period_end
        AND (coverage=v_appointment.service_category OR (coverage='combo' AND v_appointment.service_category IN ('hair','beard','combo')))) THEN
        RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE=v_message;
      END IF;
      UPDATE public.billing_appointments SET status='in_service' WHERE id=v_appointment.id;
    END IF;
  END IF;

  IF p_action <> 'snapshot' THEN RETURN jsonb_build_object('ok',true); END IF;
  RETURN jsonb_build_object(
    'mode','test', 'shop',jsonb_build_object('id',v_shop.id,'name',v_shop.name,'slug',v_shop.slug), 'role',v_role,
    'customer', CASE WHEN v_customer.id IS NULL THEN NULL ELSE jsonb_build_object('id',v_customer.id,'name',v_customer.name,'email',v_customer.email) END,
    'team', CASE WHEN v_role='owner' THEN (SELECT coalesce(jsonb_agg(jsonb_build_object('userId',m.user_id,'email',u.email) ORDER BY u.email),'[]'::jsonb) FROM public.memberships m JOIN auth.users u ON u.id=m.user_id WHERE m.tenant_id=v_shop.id AND m.role IN ('owner','staff')) ELSE '[]'::jsonb END,
    'plans',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'priceCents',price_cents,'coverage',coverage,'active',active) ORDER BY name),'[]'::jsonb) FROM public.billing_plans WHERE tenant_id=v_shop.id AND (active OR v_role='owner')),
    'services',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'priceCents',price_cents,'category',category,'durationMinutes',duration_minutes,'active',active) ORDER BY name),'[]'::jsonb) FROM public.billing_services WHERE tenant_id=v_shop.id AND (active OR v_role='owner')),
    'barbers',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'userId',user_id,'name',name,'active',active) ORDER BY name),'[]'::jsonb) FROM public.billing_barbers WHERE tenant_id=v_shop.id AND (active OR v_role='owner')),
    'subscription',(SELECT jsonb_build_object('id',id,'planId',plan_id) FROM public.billing_subscriptions WHERE customer_id=v_customer.id),
    'invoices',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',i.id,'customerId',i.customer_id,'customerName',c.name,'planName',i.plan_name,'amountCents',i.amount_cents,'periodStart',i.period_start,'periodEnd',i.period_end,'dueOn',i.due_on,'status',CASE WHEN i.status='pending' AND i.due_on<v_date AND i.period_start<=v_date THEN 'overdue' ELSE i.status END,'paidVia',i.paid_via) ORDER BY i.period_start DESC,c.name),'[]'::jsonb)
      FROM public.billing_invoices i JOIN public.billing_customers c ON c.id=i.customer_id WHERE i.tenant_id=v_shop.id AND (v_role='owner' OR i.customer_id=v_customer.id OR (v_role='staff' AND EXISTS(SELECT 1 FROM public.billing_appointments a JOIN public.billing_barbers b ON b.id=a.barber_id WHERE a.customer_id=i.customer_id AND b.user_id=v_uid AND a.status<>'cancelled' AND (a.starts_at AT TIME ZONE 'America/Fortaleza')::date=v_date AND v_date>=i.period_start AND v_date<i.period_end)))),
    'payments',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'invoiceId',p.invoice_id,'amountCents',p.amount_cents,'method',p.method,'status',p.status,'receivedAt',p.received_at) ORDER BY p.received_at DESC),'[]'::jsonb) FROM public.billing_payments p JOIN public.billing_invoices i ON i.id=p.invoice_id WHERE p.tenant_id=v_shop.id AND (v_role='owner' OR i.customer_id=v_customer.id)),
    'refunds',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',r.id,'invoiceId',r.invoice_id,'amountCents',r.amount_cents,'reason',CASE WHEN v_role='owner' THEN r.reason ELSE 'Reembolso registrado pela recepção' END,'refundedAt',r.refunded_at) ORDER BY r.refunded_at DESC),'[]'::jsonb) FROM public.billing_refunds r JOIN public.billing_invoices i ON i.id=r.invoice_id WHERE r.tenant_id=v_shop.id AND (v_role='owner' OR i.customer_id=v_customer.id)),
    'appointments',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',a.id,'customerName',c.name,'serviceName',a.service_name,'barberName',b.name,'barberId',b.id,'startsAt',a.starts_at,'endsAt',a.ends_at,'status',a.status,'mode',a.mode,'priceCents',a.price_cents) ORDER BY a.starts_at),'[]'::jsonb) FROM public.billing_appointments a JOIN public.billing_customers c ON c.id=a.customer_id JOIN public.billing_barbers b ON b.id=a.barber_id WHERE a.tenant_id=v_shop.id AND (v_role='owner' OR (v_role='staff' AND b.user_id=v_uid) OR a.customer_id=v_customer.id))
  );
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.billing_command(text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.billing_command(text,text,jsonb) TO authenticated;

INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('a50cf0a05bfd11dbce9513716f33d1185fa9ec3ff762d8c457015965cf1f8da4', 1793300079214);

COMMIT;
