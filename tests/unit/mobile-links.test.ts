import { it, expect } from 'vitest';
import { mobileAuthTarget } from '../../apps/web/src/mobile/links';
it('accepts only the app callback and recovery routes, without trusting redirect or token hints', () => {
  expect(
    mobileAuthTarget(
      'com.agendaflex.ross://auth/callback?code=abc&next=https://evil.example',
    ),
  ).toBe('/auth/callback?code=abc');
  expect(
    mobileAuthTarget('com.agendaflex.ross://redefinir-senha?code=a%2Bb'),
  ).toBe('/redefinir-senha?code=a%2Bb');
  for (const url of [
    'javascript:alert(1)',
    'https://evil.example/auth/callback',
    'com.other://auth/callback',
    'com.agendaflex.ross://user@auth/callback',
    'com.agendaflex.ross://auth/admin',
    'com.agendaflex.ross://auth:123/callback',
  ])
    expect(mobileAuthTarget(url)).toBeNull();
  expect(
    mobileAuthTarget('com.agendaflex.ross://auth/callback#access_token=fake'),
  ).toBe('/auth/callback');
});
