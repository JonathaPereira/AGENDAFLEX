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

COMMIT;
