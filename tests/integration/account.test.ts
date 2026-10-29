import { it, expect, vi } from 'vitest';
import { buildApp } from '../../apps/api/src/app';
import type { IdentityGateway } from '../../apps/api/src/application/identity';
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'cliente@example.com',
};
it('requires a bearer token and fails closed without Supabase configuration', async () => {
  const app = buildApp();
  try {
    for (const authorization of [
      undefined,
      'Basic abc',
      'Bearer',
      'Bearer a b',
    ]) {
      const response = await app.inject({
        url: '/me',
        headers: authorization ? { authorization } : {},
      });
      expect(response.statusCode).toBe(401);
      expect(response.headers['cache-control']).toBe('no-store');
    }
    expect(
      (
        await app.inject({
          url: '/me',
          headers: { authorization: 'Bearer token' },
        })
      ).statusCode,
    ).toBe(503);
  } finally {
    await app.close();
  }
});
it('rejects invalid sessions before returning account data', async () => {
  const accountForToken = vi.fn().mockResolvedValue(null),
    app = buildApp({ identity: { accountForToken } });
  try {
    expect(
      (
        await app.inject({
          url: '/me',
          headers: { authorization: 'Bearer invalid' },
        })
      ).statusCode,
    ).toBe(401);
    expect(accountForToken).toHaveBeenCalledWith('invalid');
  } finally {
    await app.close();
  }
});
it('uses only verified gateway identity and memberships, never client role or tenant hints', async () => {
  const accountForToken = vi.fn().mockResolvedValue({ user, memberships: [] }),
    app = buildApp({ identity: { accountForToken } });
  try {
    const response = await app.inject({
      url: '/me?role=owner&tenantId=other',
      headers: { authorization: 'Bearer verified', 'x-user-id': 'other' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ user, memberships: [] });
    expect(accountForToken).toHaveBeenCalledWith('verified');
  } finally {
    await app.close();
  }
});
it('does not expose upstream secrets or accept malformed roles on provider failure', async () => {
  for (const identity of [
    {
      accountForToken: async () => {
        throw new Error('secret-upstream-details');
      },
    },
    {
      accountForToken: async () => ({
        user,
        memberships: [
          { tenantId: user.id, tenantName: 'Other', role: 'superadmin' },
        ],
      }),
    },
  ]) {
    const app = buildApp({ identity: identity as IdentityGateway });
    try {
      const response = await app.inject({
        url: '/me',
        headers: { authorization: 'Bearer token' },
      });
      expect(response.statusCode).toBe(503);
      expect(response.body).not.toContain('secret-upstream-details');
    } finally {
      await app.close();
    }
  }
});
