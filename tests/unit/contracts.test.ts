import { describe, it, expect } from 'vitest';
import { healthResponseSchema, tenantRoleSchema } from '@agendaflex/shared';
import { parseApiEnv } from '../../apps/api/src/config/env';
describe('contracts and environment', () => {
  it('rejects invalid health payloads', () => {
    expect(healthResponseSchema.safeParse({ status: 'down' }).success).toBe(
      false,
    );
  });
  it('rejects unknown tenant roles', () => {
    expect(tenantRoleSchema.safeParse('superadmin').success).toBe(false);
  });
  it('starts without external credentials', () => {
    expect(parseApiEnv({}).PORT).toBe(3001);
    expect(
      parseApiEnv({ SUPABASE_URL: '', SUPABASE_PUBLISHABLE_KEY: '' })
        .SUPABASE_URL,
    ).toBeUndefined();
  });
  it('rejects invalid ports and incomplete Supabase configuration', () => {
    expect(() => parseApiEnv({ PORT: 'invalid' })).toThrow();
    expect(() =>
      parseApiEnv({ SUPABASE_URL: 'http://localhost:54321' }),
    ).toThrow();
  });
});
