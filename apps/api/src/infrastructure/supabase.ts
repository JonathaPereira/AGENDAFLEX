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
