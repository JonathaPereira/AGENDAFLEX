import { publicSupabaseKeySchema } from '../../packages/shared/src/index';
export function validatePublicAuthConfig(
  env: Record<string, string | undefined>,
) {
  const url = env.VITE_SUPABASE_URL,
    key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url && !key) return;
  if (!url || !key)
    throw new Error(
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY juntas.',
    );
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error();
  } catch {
    throw new Error('VITE_SUPABASE_URL deve ser uma URL HTTP(S) válida.');
  }
  if (!publicSupabaseKeySchema.safeParse(key).success)
    throw new Error(
      'Frontend aceita somente chave pública publishable/anon. Não use chave secreta/service_role.',
    );
}
