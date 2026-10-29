import { afterEach, expect, it, vi } from 'vitest';
import { buildApp } from '../../apps/api/src/app';
import {
  BillingError,
  type BillingGateway,
} from '../../apps/api/src/application/billing';
import { createBillingGateway } from '../../apps/api/src/infrastructure/billing';
import { bookingUnavailableMessage } from '@agendaflex/shared';
const id = '11111111-1111-4111-8111-111111111111';
const account = {
  user: { id, email: 'cliente@example.test' },
  memberships: [],
};
const identity = { accountForToken: vi.fn(async () => account) };
const gateway = (): BillingGateway => ({
  snapshot: vi.fn(),
  execute: vi.fn(),
  slots: vi.fn(async () => []),
});
afterEach(() => vi.unstubAllGlobals());
it('billing and availability require verified identity before persistence', async () => {
  const billing = gateway(),
    app = buildApp({
      billing,
      identity: { accountForToken: async () => null },
    });
  try {
    for (const path of [
      '/shops/ross-barbearia/billing',
      '/shops/ross-barbearia/slots?date=2026-10-29&barberId=' +
        id +
        '&serviceId=' +
        id,
    ]) {
      expect((await app.inject({ url: path })).statusCode).toBe(401);
      const response = await app.inject({
        url: path,
        headers: { authorization: 'Bearer invalid' },
      });
      expect(response.statusCode).toBe(401);
      expect(response.headers['cache-control']).toBe('no-store');
    }
    expect(billing.snapshot).not.toHaveBeenCalled();
    expect(billing.slots).not.toHaveBeenCalled();
  } finally {
    await app.close();
  }
});
it('strict command contracts reject forged amount, role, customer identity and gateway status', async () => {
  const billing = gateway(),
    app = buildApp({ identity, billing });
  try {
    for (const payload of [
      {
        action: 'pay_test',
        invoiceId: id,
        method: 'pix',
        result: 'approved',
        amountCents: 1,
      },
      {
        action: 'refund',
        invoiceId: id,
        reason: 'Cancelamento',
        role: 'owner',
      },
      { action: 'pay_test', invoiceId: id, method: 'cash', result: 'approved' },
      {
        action: 'book',
        serviceId: id,
        barberId: id,
        startsAt: '2026-10-29T12:00:00Z',
        mode: 'plan',
        requestId: id,
        customerId: id,
      },
      { action: 'pay_test', invoiceId: id, method: 'credit', result: 'paid' },
      { action: 'refund', invoiceId: id, reason: 'a' },
    ])
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/shops/ross-barbearia/billing',
            headers: { authorization: 'Bearer token' },
            payload,
          })
        ).statusCode,
      ).toBe(400);
    expect(billing.execute).not.toHaveBeenCalled();
  } finally {
    await app.close();
  }
});
it('passes the same token and selected slug to authorization-aware persistence and preserves discreet errors', async () => {
  const billing = gateway();
  vi.mocked(billing.execute).mockRejectedValue(
    new BillingError(409, bookingUnavailableMessage),
  );
  const app = buildApp({ identity, billing });
  const command = {
    action: 'book',
    serviceId: id,
    barberId: id,
    startsAt: '2026-10-29T12:00:00Z',
    mode: 'plan',
    requestId: id,
  };
  try {
    const response = await app.inject({
      method: 'POST',
      url: '/shops/ross-barbearia/billing',
      headers: { authorization: 'Bearer verified' },
      payload: command,
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ message: bookingUnavailableMessage });
    expect(billing.execute).toHaveBeenCalledWith(
      'verified',
      'ross-barbearia',
      command,
    );
  } finally {
    await app.close();
  }
});
it('does not leak database errors, tokens or refund failure details', async () => {
  const billing = gateway();
  vi.mocked(billing.execute).mockRejectedValue(
    new Error('secret-database-details'),
  );
  const app = buildApp({ identity, billing });
  try {
    const response = await app.inject({
      method: 'POST',
      url: '/shops/ross-barbearia/billing',
      headers: { authorization: 'Bearer token' },
      payload: { action: 'refund', invoiceId: id, reason: 'Cliente cancelou' },
    });
    expect(response.statusCode).toBe(503);
    expect(response.body).not.toContain('secret-database-details');
  } finally {
    await app.close();
  }
});
it('Supabase RPC uses the user JWT and never a privileged client; upstream errors are sanitized', async () => {
  const calls: Record<string, unknown>[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({
        url: String(input),
        authorization: new Headers(init?.headers).get('authorization'),
        body: JSON.parse(String(init?.body)),
      });
      return new Response(
        JSON.stringify({
          code: '42501',
          message: 'internal-permission-context',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }),
  );
  const billing = createBillingGateway(
    'https://fixture.supabase.co',
    'sb_publishable_fixture',
  );
  await expect(
    billing.execute('verified-user-jwt', 'ross-barbearia', {
      action: 'refund',
      invoiceId: id,
      reason: 'Cancelamento',
    }),
  ).rejects.toMatchObject({
    status: 403,
    message: 'Esta operação não está disponível para sua conta.',
  });
  expect(calls).toEqual([
    {
      url: 'https://fixture.supabase.co/rest/v1/rpc/billing_command',
      authorization: 'Bearer verified-user-jwt',
      body: {
        p_slug: 'ross-barbearia',
        p_action: 'refund',
        p_payload: { invoiceId: id, reason: 'Cancelamento' },
      },
    },
  ]);
});
