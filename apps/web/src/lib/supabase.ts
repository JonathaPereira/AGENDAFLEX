import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicSupabaseKeySchema } from '@agendaflex/shared';
import { z } from 'zod';
const configSchema = z.object({
  url: z.string().url(),
  key: publicSupabaseKeySchema,
});
let instance: SupabaseClient | undefined;
export function supabaseConfigured() {
  return configSchema.safeParse({
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  }).success;
}
export function createBrowserSupabaseClient() {
  if (instance) return instance;
  const config = configSchema.parse({
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  });
  instance = createClient(config.url, config.key, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return instance;
}
