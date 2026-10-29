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
