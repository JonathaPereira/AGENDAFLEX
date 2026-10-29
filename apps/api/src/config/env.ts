import { z } from 'zod';
import { publicSupabaseKeySchema } from '@agendaflex/shared';
const optionalUrl = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().url().optional(),
);
export const apiEnvSchema = z.object({
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: optionalUrl,
  SUPABASE_PUBLISHABLE_KEY: z.preprocess(
    (v) => (v === '' ? undefined : v),
    publicSupabaseKeySchema.optional(),
  ),
});
export function parseApiEnv(input: Record<string, unknown>) {
  const result = apiEnvSchema.safeParse(input);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
    );
  }
  if (
    Boolean(result.data.SUPABASE_URL) !==
    Boolean(result.data.SUPABASE_PUBLISHABLE_KEY)
  ) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured together',
    );
  }
  return result.data;
}
