import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { parseApiEnv } from './config/env.js';
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
import { createIdentityGateway } from './infrastructure/supabase.js';
const env = parseApiEnv(process.env);
const app = buildApp({
  logger: true,
  webOrigin: env.WEB_ORIGIN,
  ...(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY
    ? {
        identity: createIdentityGateway(
          env.SUPABASE_URL,
          env.SUPABASE_PUBLISHABLE_KEY,
        ),
      }
    : {}),
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close();
  });
}
try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
