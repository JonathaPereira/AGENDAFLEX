import { useCallback, useEffect, useState } from 'react';
import {
  billingSnapshotSchema,
  type BillingCommand,
  type BillingSnapshot,
} from '@agendaflex/shared';
import { useAuth } from '../auth/AuthProvider';
export const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export async function responseJson(response: Response): Promise<unknown> {
  const result: unknown = await response.json();
  if (!response.ok) {
    const message =
      result &&
      typeof result === 'object' &&
      'message' in result &&
      typeof result.message === 'string'
        ? result.message
        : 'Não foi possível concluir. Tente novamente.';
    throw new Error(message);
  }
  return result;
}
export function useBilling(slug: string) {
  const { session } = useAuth();
  const token = session?.access_token;
  const [received, setReceived] = useState<{
    snapshot: BillingSnapshot;
    token: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((v) => v + 1), []);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    let inFlight = false;
    const load = async () => {
      if (inFlight || controller.signal.aborted) return;
      inFlight = true;
      try {
        const response = await fetch(
          `${apiUrl}/shops/${encodeURIComponent(slug)}/billing`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
        const next = billingSnapshotSchema.parse(await responseJson(response));
        if (!controller.signal.aborted) {
          setReceived({ snapshot: next, token });
          setError('');
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : 'Não foi possível atualizar os dados.',
          );
      } finally {
        inFlight = false;
      }
    };
    void load();
    const update = () => {
      if (document.visibilityState === 'visible') void load();
    };
    const interval = window.setInterval(update, 15_000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      controller.abort();
      clearInterval(interval);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [slug, token, revision]);
  // Clear another shop's data immediately when navigating between tenants.
  const visible =
    received?.snapshot.shop.slug === slug && received.token === token
      ? received.snapshot
      : null;
  const execute = async (command: BillingCommand) => {
    if (busy || !token) return false;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await responseJson(
        await fetch(`${apiUrl}/shops/${encodeURIComponent(slug)}/billing`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(command),
        }),
      );
      setMessage(
        command.action === 'pay_test'
          ? command.result === 'approved'
            ? 'Pagamento de teste aprovado. Nenhum dinheiro foi movimentado.'
            : command.result === 'pending'
              ? 'Pagamento de teste pendente. A assinatura ainda aguarda confirmação.'
              : 'Pagamento de teste não aprovado. Você pode tentar outra forma de pagamento.'
          : command.action === 'refund'
            ? 'Reembolso de teste registrado. Nenhum dinheiro foi movimentado.'
            : command.action === 'book'
              ? 'Seu horário foi reservado. Confira os detalhes em Meus agendamentos.'
              : 'Operação registrada no ambiente de teste.',
      );
      refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível concluir.');
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { data: visible, error, message, busy, refresh, execute };
}
