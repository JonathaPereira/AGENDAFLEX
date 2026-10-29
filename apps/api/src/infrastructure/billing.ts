import {
  billingSnapshotSchema,
  bookingUnavailableMessage,
  billingSlotsSchema,
} from '@agendaflex/shared';
import { BillingError, type BillingGateway } from '../application/billing.js';
import { createUserSupabaseClient } from './supabase.js';

// Only known, public business messages may cross the persistence boundary.
const safeMessages = new Set([
  bookingUnavailableMessage,
  'Este horário acabou de ficar indisponível. Escolha outro horário.',
  'Complete seu cadastro primeiro.',
  'Plano indisponível.',
  'Para trocar de plano, entre em contato com a recepção.',
  'Para ajustar sua assinatura, entre em contato com a recepção.',
  'Mensalidade já reembolsada.',
  'Selecione uma mensalidade paga e informe o motivo.',
  'Este serviço não está incluído no seu plano. Consulte a recepção ou escolha avulso.',
  'Escolha um horário válido nos próximos 15 dias, das 09h às 21h, com pausa das 13h às 15h.',
  'Selecione um atendimento de hoje ainda não iniciado.',
]);
export function createBillingGateway(url: string, key: string): BillingGateway {
  async function call(
    token: string,
    slug: string,
    action: string,
    payload: Record<string, unknown>,
  ) {
    const client = createUserSupabaseClient(url, key, token);
    const { data, error } = await client.rpc('billing_command', {
      p_slug: slug,
      p_action: action,
      p_payload: payload,
    });
    if (error) {
      if (error.code === '42501')
        throw new BillingError(
          403,
          'Esta operação não está disponível para sua conta.',
        );
      if (safeMessages.has(error.message))
        throw new BillingError(
          error.code === 'P0001' ? 409 : 422,
          error.message,
        );
      if (['22023', '23505', '23514', '23503', '22P02'].includes(error.code))
        throw new BillingError(
          422,
          'Confira os dados informados. Se necessário, consulte a recepção.',
        );
      throw new BillingError(
        503,
        'Não foi possível acessar o faturamento. Tente novamente em instantes.',
      );
    }
    return data;
  }
  return {
    async snapshot(token, slug) {
      return billingSnapshotSchema.parse(
        await call(token, slug, 'snapshot', {}),
      );
    },
    async execute(token, slug, command) {
      const { action, ...payload } = command;
      await call(token, slug, action, payload);
    },
    async slots(token, slug, query) {
      return billingSlotsSchema.parse(await call(token, slug, 'slots', query));
    },
  };
}
