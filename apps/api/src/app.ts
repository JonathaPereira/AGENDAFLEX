import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthResponseSchema } from '@agendaflex/shared';
export function buildApp(
  options: { logger?: boolean; webOrigin?: string } = {},
) {
  const app = Fastify({ logger: options.logger ?? false });
  app.register(cors, { origin: options.webOrigin ?? 'http://localhost:5173' });
  app.get('/health', async () =>
    healthResponseSchema.parse({
      status: 'ok',
      service: 'agendaflex-api',
      version: '0.1.0',
    }),
  );
  return app;
}
