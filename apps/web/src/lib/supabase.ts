import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
const configSchema = z.object({
  url: z.string().url(),
  key: z.string().min(1),
});
// This module is intentionally lazy. No login or fake session is created in this phase.
export function createBrowserSupabaseClient() {
  const result = configSchema.safeParse({
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!result.success)
    throw new Error('Configure the public Supabase URL and publishable key');
  return createClient(result.data.url, result.data.key);
}
