import { authRedirect } from '../mobile/redirect';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  createBrowserSupabaseClient,
  supabaseConfigured,
} from '../lib/supabase';
import { useAuth } from './AuthProvider';
const emailSchema = z.string().trim().email();
const passwordSchema = z.string().min(12).max(128);
const exchanges = new Map<
  string,
  ReturnType<
    ReturnType<
      typeof createBrowserSupabaseClient
    >['auth']['exchangeCodeForSession']
  >
>();
function exchange(code: string) {
  let task = exchanges.get(code);
  if (!task) {
    task = createBrowserSupabaseClient().auth.exchangeCodeForSession(code);
    exchanges.clear();
    exchanges.set(code, task);
  }
  return task;
}
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="ross-auth">
      <a href="#auth-content" className="skip-link">
        Ir para o conteúdo
      </a>
      <div className="ross-auth-brand">
        <Link to="/login" aria-label="Ross Barbearia início">
          <img
            src="/ross-logo.png"
            width="132"
            height="132"
            alt="Ross Barbearia"
          />
        </Link>
        <span>Estilo, presença e tradição.</span>
      </div>
      {import.meta.env.VITE_MOBILE_PREVIEW === 'true' && (
        <p className="auth-preview-note">
          Prévia mobile · Acesso real desativado nesta compilação
        </p>
      )}
      <section id="auth-content" className="ross-auth-card">
        {children}
      </section>
      <p className="ross-auth-footer">Ross Barbearia · AgendaFlex</p>
    </main>
  );
}
export function AuthPage({
  mode = 'login',
}: {
  mode?: 'login' | 'signup' | 'forgot';
}) {
  const { account } = useAuth(),
    navigate = useNavigate();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [visible, setVisible] = useState(false);
  const configured = supabaseConfigured();
  if (account) return <Navigate to="/conta" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !configured) return;
    const form = new FormData(event.currentTarget),
      email = emailSchema.safeParse(form.get('email')),
      password = String(form.get('password') || '');
    setError('');
    setMessage('');
    if (!email.success) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (
      mode === 'signup' &&
      (!passwordSchema.safeParse(password).success ||
        password !== form.get('confirmation'))
    ) {
      setError('Use uma senha de 12 a 128 caracteres e repita a mesma senha.');
      return;
    }
    setBusy(true);
    try {
      const client = createBrowserSupabaseClient();
      if (mode === 'forgot') {
        const { error } = await client.auth.resetPasswordForEmail(email.data, {
          redirectTo: authRedirect('/redefinir-senha'),
        });
        if (error) throw error;
        setMessage(
          'Se houver uma conta para este e-mail, você receberá as instruções de recuperação. Abra o link neste mesmo navegador.',
        );
      } else if (mode === 'signup') {
        const { error } = await client.auth.signUp({
          email: email.data,
          password,
          options: {
            emailRedirectTo: authRedirect('/auth/callback'),
          },
        });
        if (error) throw error;
        setMessage(
          'Confira sua caixa de entrada para confirmar o e-mail. Abra o link neste mesmo navegador. Se já possui conta, use Entrar ou recuperar senha.',
        );
      } else {
        const { error } = await client.auth.signInWithPassword({
          email: email.data,
          password,
        });
        if (error) throw error;
        navigate('/conta', { replace: true });
      }
    } catch {
      setError(
        mode === 'login'
          ? 'Não foi possível entrar. Confira e-mail, senha e confirmação do e-mail. Se necessário, aguarde e tente novamente.'
          : 'Não foi possível concluir a solicitação. Aguarde e tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthFrame>
      <span className="ross-auth-eyebrow">Seu espaço na Ross</span>
      <h1>
        {mode === 'login'
          ? 'Bem-vindo de volta.'
          : mode === 'signup'
            ? 'Crie sua conta.'
            : 'Recupere seu acesso.'}
      </h1>
      <p>
        {mode === 'login'
          ? 'Entre com seu e-mail para continuar.'
          : mode === 'signup'
            ? 'Seu próximo cuidado começa aqui.'
            : 'Enviaremos as instruções para o seu e-mail.'}
      </p>
      {!configured && (
        <div className="auth-notice" role="status">
          {import.meta.env.VITE_MOBILE_PREVIEW === 'true'
            ? 'Esta prévia usa dados fictícios. Abra a demonstração abaixo para avaliar as telas.'
            : 'Conexão com o Supabase pendente. O responsável pelo sistema precisa concluir a configuração antes de liberar os acessos.'}
        </div>
      )}
      <form onSubmit={(e) => void submit(e)}>
        <label>
          E-mail
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            disabled={busy}
          />
        </label>
        {mode !== 'forgot' && (
          <>
            <label>
              Senha
              <input
                name="password"
                type={visible ? 'text' : 'password'}
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                minLength={mode === 'signup' ? 12 : 1}
                maxLength={128}
                required
                disabled={busy}
              />
            </label>
            <button
              type="button"
              className="auth-text-button"
              onClick={() => setVisible((v) => !v)}
              aria-pressed={visible}
            >
              {visible ? 'Ocultar senha' : 'Mostrar senha'}
            </button>
            {mode === 'signup' && (
              <>
                <label>
                  Repita a senha
                  <input
                    name="confirmation"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                    disabled={busy}
                  />
                </label>
                <small>
                  Use pelo menos 12 caracteres. A equipe nunca poderá consultar
                  sua senha.
                </small>
              </>
            )}
          </>
        )}
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="auth-notice" role="status">
            {message}
          </p>
        )}
        <button
          className="auth-primary"
          type="submit"
          disabled={busy || !configured}
        >
          {busy
            ? 'Aguarde…'
            : mode === 'login'
              ? 'Entrar'
              : mode === 'signup'
                ? 'Criar conta'
                : 'Enviar instruções'}
        </button>
      </form>
      <nav className="auth-links" aria-label="Opções de acesso">
        {mode !== 'login' && <Link to="/login">Voltar para entrar</Link>}
        {mode !== 'signup' && <Link to="/criar-conta">Criar conta</Link>}
        {mode === 'login' && (
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
        )}
      </nav>
      {import.meta.env.VITE_MOBILE_CONNECTED !== 'true' && (
        <Link className="auth-demo-link" to="/mobile">
          Ver demonstração para celular
        </Link>
      )}
      <Link className="auth-demo-link" to="/">
        Voltar ao portal
      </Link>
    </AuthFrame>
  );
}
export function CallbackPage({ recovery = false }: { recovery?: boolean }) {
  const location = useLocation(),
    navigate = useNavigate(),
    { session } = useAuth();
  const [checking, setChecking] = useState(true),
    [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    async function complete() {
      try {
        if (!supabaseConfigured()) throw new Error();
        const params = new URLSearchParams(location.search),
          code = params.get('code');
        if (params.has('error') || location.hash.includes('error='))
          throw new Error();
        if (code) {
          const result = await exchange(code);
          if (result.error) throw result.error;
        }
        const { data, error } =
          await createBrowserSupabaseClient().auth.getUser();
        if (error || !data.user) throw new Error();
        if (active) {
          window.history.replaceState(
            null,
            '',
            recovery ? '/redefinir-senha' : '/auth/callback',
          );
          setReady(true);
          if (!recovery) navigate('/conta', { replace: true });
        }
      } catch {
        if (active)
          setError(
            'Link inválido, expirado ou aberto em outro navegador. Solicite um novo link e abra no navegador onde iniciou.',
          );
      } finally {
        if (active) setChecking(false);
      }
    }
    void complete();
    return () => {
      active = false;
    };
  }, [location.search, location.hash, recovery, navigate]);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !ready || !session) return;
    const f = new FormData(e.currentTarget),
      password = String(f.get('password'));
    if (
      !passwordSchema.safeParse(password).success ||
      password !== f.get('confirmation')
    ) {
      setError('Use de 12 a 128 caracteres e repita a mesma senha.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const client = createBrowserSupabaseClient();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      const logout = await client.auth.signOut();
      if (logout.error) throw logout.error;
      navigate('/login', { replace: true });
    } catch {
      setError('Não foi possível atualizar sua senha. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthFrame>
      <h1>{recovery ? 'Defina sua nova senha.' : 'Confirmando seu acesso.'}</h1>
      {checking && <p role="status">Verificando link…</p>}
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      {ready && recovery && (
        <form onSubmit={(e) => void save(e)}>
          <label>
            Nova senha
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          <label>
            Repita a nova senha
            <input
              type="password"
              name="confirmation"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          <button className="auth-primary" disabled={busy || !session}>
            Salvar nova senha
          </button>
        </form>
      )}
      <Link to="/recuperar-senha">Solicitar novo link</Link>
      <Link className="auth-demo-link" to="/login">
        Voltar ao login
      </Link>
    </AuthFrame>
  );
}
export function AccountPage() {
  const auth = useAuth();
  if (auth.loading)
    return (
      <AuthFrame>
        <p role="status">Verificando seu acesso…</p>
      </AuthFrame>
    );
  if (!auth.session) return <Navigate to="/login" replace />;
  return (
    <AuthFrame>
      <h1>Seu espaço na Ross.</h1>
      {auth.error ? (
        <>
          <p role="alert" className="auth-error">
            {auth.error}
          </p>
          <button className="auth-primary" onClick={auth.refresh}>
            Tentar novamente
          </button>
        </>
      ) : (
        auth.account && (
          <>
            <p>
              Você entrou como <strong>{auth.account.user.email}</strong>.
            </p>
            {auth.account.memberships.length ? (
              <>
                <h2>Seus estabelecimentos</h2>
                <ul>
                  {auth.account.memberships.map((m) => (
                    <li key={m.tenantId}>
                      {m.tenantName} ·{' '}
                      {
                        {
                          owner: 'Empresário',
                          manager: 'Gerente',
                          staff: 'Barbeiro',
                        }[m.role]
                      }
                    </li>
                  ))}
                </ul>
                <Link to="/painel">Acessar painel</Link>
              </>
            ) : (
              <p className="auth-notice">
                Sua conta está ativa. A vinculação à barbearia e os agendamentos
                reais serão liberados na próxima etapa. Criar conta não concede
                acesso à gestão.
              </p>
            )}
            <p>
              Esta etapa valida o acesso. A agenda, fotos e pagamentos ainda
              serão conectados.
            </p>
          </>
        )
      )}
      <button className="auth-text-button" onClick={() => void auth.signOut()}>
        Sair da conta
      </button>
    </AuthFrame>
  );
}
export function RequireManagement({
  children,
  central = false,
}: {
  children: ReactNode;
  central?: boolean;
}) {
  const auth = useAuth();
  if (auth.loading)
    return (
      <AuthFrame>
        <p role="status">Verificando seu acesso…</p>
      </AuthFrame>
    );
  if (!auth.session) return <Navigate to="/login" replace />;
  if (auth.error) return <AccountPage />;
  if (central || !auth.account?.memberships.length)
    return (
      <AuthFrame>
        <h1>Acesso restrito.</h1>
        <p>Esta conta não possui permissão para esta área.</p>
        <Link to="/conta">Voltar à minha conta</Link>
      </AuthFrame>
    );
  return children;
}
