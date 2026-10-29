import { it, expect } from 'vitest';
import { buildApp } from '../../apps/api/src/app';
import { healthResponseSchema } from '@agendaflex/shared';
it('serves the health contract without a database', async () => {
  const app = buildApp();
  try {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.parse(response.json()).status).toBe('ok');
  } finally {
    await app.close();
  }
});
it('does not expose private business routes', async () => {
  const app = buildApp();
  try {
    expect((await app.inject({ url: '/tenants' })).statusCode).toBe(404);
  } finally {
    await app.close();
  }
});
it('allows the configured web origin', async () => {
  const app = buildApp({ webOrigin: 'http://localhost:5173' });
  try {
    const response = await app.inject({
      url: '/health',
      headers: { origin: 'http://localhost:5173' },
    });
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
  } finally {
    await app.close();
  }
});

it('allows bundled mobile origins without treating CORS as an authenticated session', async () => {
  const app = buildApp();
  try {
    for (const origin of ['capacitor://localhost', 'https://localhost']) {
      const r = await app.inject({ url: '/me', headers: { origin } });
      expect(r.headers['access-control-allow-origin']).toBe(origin);
      expect(r.statusCode).toBe(401);
    }
    const other = await app.inject({
      url: '/health',
      headers: { origin: 'https://unrelated.example' },
    });
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  } finally {
    await app.close();
  }
});
