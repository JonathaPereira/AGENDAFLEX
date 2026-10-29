CREATE UNIQUE INDEX "one_owner_per_tenant" ON "memberships" USING btree ("tenant_id") WHERE "memberships"."role" = 'owner';--> statement-breakpoint
CREATE POLICY "memberships_read_own" ON "memberships" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("memberships"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "tenants_read_member" ON "tenants" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from public.memberships m where m.tenant_id = tenants.id and m.user_id = (select auth.uid())));--> statement-breakpoint
REVOKE ALL ON TABLE public.tenants, public.memberships FROM anon, authenticated;
--> statement-breakpoint
GRANT SELECT ON TABLE public.tenants, public.memberships TO authenticated;
