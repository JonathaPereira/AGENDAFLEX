import { defineConfig, loadEnv } from 'vite';
import { validatePublicAuthConfig } from './build-env';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig(({ mode }) => {
  const envDir = fileURLToPath(new URL('../..', import.meta.url));
  validatePublicAuthConfig(loadEnv(mode, envDir, 'VITE_'));
  return {
    plugins: [react(), tailwindcss()],
    envDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: { port: 5173, strictPort: true },
  };
});
