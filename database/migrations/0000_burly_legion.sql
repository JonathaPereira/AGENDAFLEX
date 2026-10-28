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