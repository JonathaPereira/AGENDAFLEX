import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  accountResponseSchema,
  type AccountResponse,
} from '@agendaflex/shared';
import {
  createBrowserSupabaseClient,
  supabaseConfigured,
} from '../lib/supabase';
const configured = supabaseConfigured();
const client = configured ? createBrowserSupabaseClient() : null;
const Context = createContext<{
  session: Session | null;
  account: AccountResponse | null;
  loading: boolean;
  error: string;
  refresh: () => void;
  signOut: () => Promise<void>;
}>({
  session: null,
  account: null,
  loading: false,
  error: '',
  refresh: () => {},
  signOut: async () => {},
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null),
    [account, setAccount] = useState<AccountResponse | null>(null),
    [loading, setLoading] = useState(false),
    [restoring, setRestoring] = useState(Boolean(client)),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => setAttempt((v) => v + 1), []);
  useEffect(() => {
    if (!client) return;
    let active = true,
      revision = 0;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, next) => {
      revision++;
      if (active) {
        setRestoring(false);
        setAttempt((v) => v + 1);
        setSession(next);
        setLoading(Boolean(next));
        setAccount(null);
      }
    });
    const initial = revision;
    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && revision === initial) {
          setRestoring(false);
          setSession(data.session);
          setLoading(Boolean(data.session));
          if (error) setError('Não foi possível restaurar sua sessão.');
        }
      })
      .catch(() => {
        if (active) {
          setRestoring(false);
          setError('Não foi possível restaurar sua sessão.');
        }
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!session) {
      setAccount(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/me`,
      {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? 'Sessão inválida. Saia e entre novamente.'
              : 'Não foi possível verificar o acesso pela API.',
          );
        const result = accountResponseSchema.parse(await response.json());
        if (!controller.signal.aborted) setAccount(result);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : 'Erro ao verificar acesso.',
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [session, attempt]);
  const signOut = async () => {
    if (client) {
      const { error } = await client.auth.signOut();
      if (error) {
        setError('Não foi possível sair. Tente novamente.');
        return;
      }
    }
    setSession(null);
    setAccount(null);
  };
  return (
    <Context.Provider
      value={{
        session,
        account,
        loading: loading || restoring,
        error,
        refresh,
        signOut,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
