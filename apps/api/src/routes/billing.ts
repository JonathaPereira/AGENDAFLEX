import type { FastifyInstance } from 'fastify';
import {
  billingCommandSchema,
  shopSlugSchema,
  accountResponseSchema,
  billingSlotsQuerySchema,
} from '@agendaflex/shared';
import type { IdentityGateway } from '../application/identity.js';
import { BillingError, type BillingGateway } from '../application/billing.js';

export function registerBillingRoutes(
  app: FastifyInstance,
  identity?: IdentityGateway,
  billing?: BillingGateway,
) {
  app.get<{ Params: { slug: string } }>(
    '/shops/:slug/slots',
    async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      const token =
        request.headers.authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
      if (!token)
        return reply.code(401).send({ message: 'Autenticação necessária.' });
      if (!identity || !billing)
        return reply
          .code(503)
          .send({ message: 'Agenda ainda não configurada.' });
      const slug = shopSlugSchema.safeParse(request.params.slug),
        query = billingSlotsQuerySchema.safeParse(request.query);
      if (!slug.success || !query.success)
        return reply
          .code(400)
          .send({ message: 'Confira a data, serviço e profissional.' });
      try {
        const account = await identity.accountForToken(token);
        if (!account)
          return reply
            .code(401)
            .send({ message: 'Sessão inválida ou expirada.' });
        accountResponseSchema.parse(account);
        return { slots: await billing.slots(token, slug.data, query.data) };
      } catch (error) {
        if (error instanceof BillingError)
          return reply.code(error.status).send({ message: error.message });
        return reply
          .code(503)
          .send({ message: 'Não foi possível consultar os horários.' });
      }
    },
  );
  app.route<{ Params: { slug: string } }>({
    method: ['GET', 'POST'],
    url: '/shops/:slug/billing',
    bodyLimit: 8192,
    async handler(request, reply) {
      reply.header('Cache-Control', 'no-store');
      const token =
        request.headers.authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
      if (!token)
        return reply.code(401).send({ message: 'Autenticação necessária.' });
      if (!identity || !billing)
        return reply
          .code(503)
          .send({ message: 'Faturamento ainda não configurado.' });
      const slug = shopSlugSchema.safeParse(request.params.slug);
      if (!slug.success)
        return reply.code(400).send({ message: 'Estabelecimento inválido.' });
      const command =
        request.method === 'POST'
          ? billingCommandSchema.safeParse(request.body)
          : undefined;
      if (command && !command.success)
        return reply
          .code(400)
          .send({ message: 'Confira os dados informados.' });
      try {
        const account = await identity.accountForToken(token);
        if (!account)
          return reply
            .code(401)
            .send({ message: 'Sessão inválida ou expirada.' });
        accountResponseSchema.parse(account);
        // The RPC repeats authorization with auth.uid() and persisted memberships.
        // Never trust a role, amount, customer ID, or payment status supplied outside this contract.
        if (command?.success) {
          await billing.execute(token, slug.data, command.data);
          return { ok: true };
        }
        return await billing.snapshot(token, slug.data);
      } catch (error) {
        if (error instanceof BillingError)
          return reply.code(error.status).send({ message: error.message });
        return reply.code(503).send({
          message:
            'Não foi possível acessar o faturamento. Tente novamente em instantes.',
        });
      }
    },
  });
}
