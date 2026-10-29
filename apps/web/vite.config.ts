import { rm } from 'node:fs/promises';
import { defineConfig, loadEnv } from 'vite';
import { validatePublicAuthConfig } from './build-env';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig(({ mode }) => {
  const envDir = fileURLToPath(new URL('../..', import.meta.url));
  validatePublicAuthConfig(loadEnv(mode, envDir, 'VITE_'));
  const preview = mode === 'mobile-preview';
  let api: string | undefined;
  if (mode === 'mobile') {
    api = loadEnv(mode, envDir, 'VITE_').VITE_MOBILE_API_URL;
    let valid = false;
    try {
      const url = new URL(api || '');
      valid =
        url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        !['localhost', '[::1]'].includes(url.hostname) &&
        !url.hostname.endsWith('.localhost') &&
        !/^127\./.test(url.hostname);
    } catch {
      valid = false;
    }
    if (!valid)
      throw new Error(
        'Defina VITE_MOBILE_API_URL com uma API HTTPS acessível pelo celular.',
      );
    if (!loadEnv(mode, envDir, 'VITE_').VITE_SUPABASE_URL)
      throw new Error('Configure o Supabase antes do build mobile conectado.');
  }
  return {
    define: {
      'import.meta.env.VITE_MOBILE_CONNECTED': JSON.stringify(
        mode === 'mobile' ? 'true' : 'false',
      ),
      'import.meta.env.VITE_MOBILE_PREVIEW': JSON.stringify(
        preview ? 'true' : 'false',
      ),
      ...(preview
        ? {
            'import.meta.env.VITE_SUPABASE_URL': 'undefined',
            'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': 'undefined',
          }
        : {}),
      ...(api ? { 'import.meta.env.VITE_API_URL': JSON.stringify(api) } : {}),
    },
    plugins: [
      react(),
      tailwindcss(),
      ...(mode === 'mobile'
        ? [
            {
              name: 'omit-demo-in-connected-mobile',
              async closeBundle() {
                await rm(
                  fileURLToPath(new URL('./dist/demo.html', import.meta.url)),
                  { force: true },
                );
              },
            },
          ]
        : []),
    ],
    envDir: fileURLToPath(new URL('../..', import.meta.url)),
    build: {
      rollupOptions: {
        output: { manualChunks: { supabase: ['@supabase/supabase-js'] } },
      },
    },
    server: { port: 5173, strictPort: true },
  };
});
