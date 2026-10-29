import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthResponseSchema } from '@agendaflex/shared';
import type { IdentityGateway } from './application/identity.js';
import { registerAccountRoute } from './routes/account.js';
export function buildApp(
  options: {
    logger?: boolean;
    webOrigin?: string;
    identity?: IdentityGateway;
  } = {},
) {
  const app = Fastify({
    logger: options.logger
      ? {
          redact: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers.set-cookie',
          ],
        }
      : false,
  });
  app.register(cors, {
    origin: [
      options.webOrigin ?? 'http://localhost:5173',
      'capacitor://localhost',
      'https://localhost',
    ],
  });
  app.get('/health', async () =>
    healthResponseSchema.parse({
      status: 'ok',
      service: 'agendaflex-api',
      version: '0.1.0',
    }),
  );
  registerAccountRoute(app, options.identity);
  return app;
}
