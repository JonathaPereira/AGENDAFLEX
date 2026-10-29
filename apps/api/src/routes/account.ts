import type { FastifyInstance } from 'fastify';
import { accountResponseSchema } from '@agendaflex/shared';
import type { IdentityGateway } from '../application/identity.js';
export function registerAccountRoute(
  app: FastifyInstance,
  identity?: IdentityGateway,
) {
  app.get('/me', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer ([^\s]+)$/i);
    if (!match?.[1])
      return reply.code(401).send({ message: 'Autenticação necessária.' });
    if (!identity)
      return reply
        .code(503)
        .send({ message: 'Supabase ainda não configurado na API.' });
    try {
      const account = await identity.accountForToken(match[1]);
      if (!account)
        return reply
          .code(401)
          .send({ message: 'Sessão inválida ou expirada.' });
      return accountResponseSchema.parse(account);
    } catch {
      return reply.code(503).send({
        message: 'Não foi possível verificar seu acesso. Tente novamente.',
      });
    }
  });
}
