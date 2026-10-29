import { it, expect } from 'vitest';
import { publicSupabaseKeySchema } from '@agendaflex/shared';
const key = (role: string) =>
  `header.${btoa(JSON.stringify({ role }))}.signature`;
it('accepts publishable and legacy anon keys while rejecting privileged keys', () => {
  expect(
    publicSupabaseKeySchema.safeParse('sb_publishable_example-only').success,
  ).toBe(true);
  expect(publicSupabaseKeySchema.safeParse(key('anon')).success).toBe(true);
  for (const value of [
    'sb_secret_example',
    key('service_role'),
    key('authenticated'),
    'invalid',
  ])
    expect(publicSupabaseKeySchema.safeParse(value).success).toBe(false);
});

import { validatePublicAuthConfig } from '../../apps/web/build-env';
it('stops Vite before a privileged key can be embedded in the frontend bundle', () => {
  expect(() =>
    validatePublicAuthConfig({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_never-embed',
    }),
  ).toThrow('somente chave pública');
  expect(() =>
    validatePublicAuthConfig({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
    }),
  ).toThrow('juntas');
  expect(() => validatePublicAuthConfig({})).not.toThrow();
});
