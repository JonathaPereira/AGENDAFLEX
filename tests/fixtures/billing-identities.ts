import { createHmac, timingSafeEqual } from 'node:crypto';
export const fixtureIds = {
  owner: '11111111-1111-4111-8111-111111111111',
  customer: '22222222-2222-4222-8222-222222222222',
  staff: '33333333-3333-4333-8333-333333333333',
} as const;
// A fixture signing key, never imported by application runtime or used by Supabase.
const key = 'agendaflex-local-browser-fixture-only';
export function fixtureToken(id: string) {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: id,
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url');
  const data = `${header}.${payload}`;
  return `${data}.${createHmac('sha256', key).update(data).digest('base64url')}`;
}
export function fixtureSubject(token: string) {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    const expected = createHmac('sha256', key)
      .update(`${header}.${payload}`)
      .digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      sub: string;
      exp: number;
    };
    return Object.values(fixtureIds).some((id) => id === claims.sub) &&
      claims.exp > Date.now() / 1000
      ? claims.sub
      : null;
  } catch {
    return null;
  }
}
