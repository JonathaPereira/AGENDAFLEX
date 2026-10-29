import { it, expect, vi, afterEach } from 'vitest';
import { createIdentityGateway } from '../../apps/api/src/infrastructure/supabase';
const id = '11111111-1111-4111-8111-111111111111';
afterEach(() => vi.unstubAllGlobals());
it('checks Auth before reading memberships using the same user JWT and verified subject', async () => {
  const calls: { url: string; authorization: string | null }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push({
        url,
        authorization: new Headers(init?.headers).get('authorization'),
      });
      if (url.includes('/auth/v1/user'))
        return new Response(
          JSON.stringify({
            id,
            email: 'owner@example.com',
            user_metadata: { role: 'superadmin' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      return new Response(
        JSON.stringify([
          { tenant_id: id, role: 'staff', tenants: { name: 'Ross' } },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }),
  );
  const result = await createIdentityGateway(
    'https://example.supabase.co',
    'sb_publishable_test',
  ).accountForToken('test-token');
  expect(calls).toHaveLength(2);
  expect(calls[0]?.url).toContain('/auth/v1/user');
  expect(calls.every((c) => c.authorization === 'Bearer test-token')).toBe(
    true,
  );
  expect(new URL(calls[1]!.url).searchParams.get('user_id')).toBe(`eq.${id}`);
  expect(result?.memberships[0]?.role).toBe('staff');
});
it('does not query memberships when Auth rejects the token', async () => {
  const request = vi.fn(
    async () =>
      new Response(JSON.stringify({ code: 'bad_jwt', msg: 'invalid' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
  vi.stubGlobal('fetch', request);
  expect(
    await createIdentityGateway(
      'https://example.supabase.co',
      'sb_publishable_test',
    ).accountForToken('invalid-token'),
  ).toBeNull();
  expect(request).toHaveBeenCalledTimes(1);
});
