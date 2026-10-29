import { createClient } from '@supabase/supabase-js';
// Request-scoped client: caller must supply a server-verified user JWT in future protected routes.
// Do not use a service-role key to execute tenant requests.
export function createUserSupabaseClient(
  url: string,
  publishableKey: string,
  accessToken: string,
) {
  return createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

import { accountResponseSchema } from '@agendaflex/shared';
import type { IdentityGateway } from '../application/identity.js';
export function createIdentityGateway(
  url: string,
  key: string,
): IdentityGateway {
  return {
    async accountForToken(token) {
      const client = createUserSupabaseClient(url, key, token);
      // getUser validates the token with Auth; user metadata never grants roles.
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user?.email) return null;
      const result = await client
        .from('memberships')
        .select('tenant_id, role, tenants(name,slug)')
        .eq('user_id', data.user.id);
      if (result.error) throw new Error('Membership lookup unavailable');
      return accountResponseSchema.parse({
        user: { id: data.user.id, email: data.user.email },
        memberships: (result.data || []).map((row) => {
          const tenant = row.tenants as unknown as {
            name: string;
            slug?: string;
          } | null;
          if (!tenant) throw new Error('Tenant unavailable');
          return {
            tenantId: row.tenant_id,
            tenantName: tenant.name,
            ...(tenant.slug ? { tenantSlug: tenant.slug } : {}),
            role: row.role,
          };
        }),
      });
    },
  };
}
