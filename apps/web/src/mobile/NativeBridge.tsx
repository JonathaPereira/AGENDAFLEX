import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { mobileAuthTarget } from './links';
export function NativeBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    if (
      !Capacitor.isNativePlatform() ||
      import.meta.env.VITE_MOBILE_PREVIEW === 'true'
    )
      return;
    let active = true,
      last = '';
    const open = (url: string) => {
      const target = mobileAuthTarget(url);
      if (active && target && url !== last) {
        last = url;
        navigate(target, { replace: true });
      }
    };
    const listener = App.addListener('appUrlOpen', (e) => open(e.url));
    void listener
      .then((handle) => {
        if (!active) void handle.remove();
      })
      .catch(() => {});
    void App.getLaunchUrl()
      .then((result) => {
        if (result) open(result.url);
      })
      .catch(() => {});
    return () => {
      active = false;
      void listener.then((h) => h.remove()).catch(() => {});
    };
  }, [navigate]);
  return null;
}
