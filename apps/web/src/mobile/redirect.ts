import { Capacitor } from '@capacitor/core';
import { mobileScheme } from './links';
export function authRedirect(path: '/auth/callback' | '/redefinir-senha') {
  return Capacitor.isNativePlatform()
    ? `${mobileScheme}://${path.slice(1)}`
    : `${window.location.origin}${path}`;
}
