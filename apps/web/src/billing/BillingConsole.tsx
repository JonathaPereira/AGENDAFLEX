import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { AuthFrame } from '../auth/AuthPages';
import { useBilling } from './useBilling';
import { AppointmentList } from './Appointments';
import { Invoices } from './Invoices';
import { Finance } from './Finance';
import { Settings } from './Settings';
import { CustomerArea } from './CustomerArea';
export function BillingConsole() {
  const { slug = 'ross-barbearia' } = useParams();
  const auth = useAuth();
  const { data, error, message, busy, refresh, execute } = useBilling(slug);
  const [tab, setTab] = useState('home');
  if (auth.loading)
    return (
      <AuthFrame>
        <p role="status">Verificando seu acesso…</p>
      </AuthFrame>
    );
  if (!auth.session) return <Navigate to="/login" replace />;
  const owner = data?.role === 'owner';
  const team = owner || data?.role === 'staff' || data?.role === 'manager';
  return (
    <main className="billing-shell">
      <a className="skip-link" href="#billing-main">
        Ir para o conteúdo
      </a>
      <header className="billing-header">
        <Link to="/conta">
          <img
            src="/ross-logo.png"
            width="64"
            height="64"
            alt="Ross Barbearia"
          />
        </Link>
        <div>
          <strong>{data?.shop.name || 'Ross Barbearia'}</strong>
          <small>
            {owner
              ? 'Área do empresário'
              : team
                ? 'Área da equipe'
                : 'Seu espaço na Ross'}
          </small>
        </div>
        <Link to="/conta">Minha conta</Link>
        <button onClick={() => void auth.signOut()}>Sair</button>
      </header>
      <aside className="billing-test-banner">
        <strong>Ambiente de teste</strong> · Pagamentos e reembolsos são
        simulados. Nenhum dinheiro é movimentado.
      </aside>
      {data && (
        <nav className="billing-tabs" aria-label="Menus da barbearia">
          <button aria-pressed={tab === 'home'} onClick={() => setTab('home')}>
            {owner ? 'Dashboard' : team ? 'Minha agenda' : 'Agendar e planos'}
          </button>
          {owner && (
            <>
              <button
                aria-pressed={tab === 'invoices'}
                onClick={() => setTab('invoices')}
              >
                Mensalidades e pagamentos
              </button>
              <button
                aria-pressed={tab === 'settings'}
                onClick={() => setTab('settings')}
              >
                Configurar negócio
              </button>
              <button
                aria-pressed={tab === 'myagenda'}
                onClick={() => setTab('myagenda')}
              >
                Minha agenda como barbeiro
              </button>
            </>
          )}
          <button disabled={busy} onClick={refresh}>
            Atualizar dados
          </button>
          <small>
            Atualiza a cada 15 segundos enquanto esta tela está visível.
          </small>
        </nav>
      )}
      <div id="billing-main" className="billing-content">
        {error && (
          <div className="billing-error" role="alert">
            <p>{error}</p>
            {data && (
              <small>Os dados exibidos podem estar desatualizados.</small>
            )}
            <button onClick={refresh}>Tentar novamente</button>
          </div>
        )}
        {busy && <p role="status">Registrando operação de teste…</p>}
        {!busy && message && (
          <p role="status" className="billing-success">
            {message}
          </p>
        )}
        {!data && !error && <p role="status">Carregando seu espaço…</p>}
        {data &&
          (owner ? (
            <>
              {tab === 'home' && (
                <>
                  {(!data.plans.length ||
                    !data.services.length ||
                    !data.barbers.length) && (
                    <aside className="billing-card">
                      <h2>Vamos preparar sua barbearia.</h2>
                      <p>
                        Cadastre planos, serviços e profissionais em Configurar
                        negócio. Você também pode vincular sua própria conta
                        como barbeiro.
                      </p>
                      <button onClick={() => setTab('settings')}>
                        Configurar agora
                      </button>
                    </aside>
                  )}
                  <Finance data={data} />
                  <AppointmentList data={data} execute={execute} busy={busy} />
                </>
              )}
              {tab === 'invoices' && (
                <Invoices data={data} execute={execute} busy={busy} owner />
              )}
              {tab === 'settings' && (
                <Settings data={data} execute={execute} busy={busy} />
              )}
              {tab === 'myagenda' && (
                <AppointmentList
                  data={{
                    ...data,
                    appointments: data.appointments.filter((a) =>
                      data.barbers.some(
                        (b) =>
                          b.id === a.barberId &&
                          b.userId === auth.account?.user.id,
                      ),
                    ),
                  }}
                  execute={execute}
                  busy={busy}
                  title="Minha agenda como barbeiro"
                />
              )}
            </>
          ) : team ? (
            <>
              <AppointmentList data={data} execute={execute} busy={busy} />
              {data.role === 'staff' && (
                <Invoices data={data} execute={execute} busy={busy} />
              )}
            </>
          ) : (
            <CustomerArea
              data={data}
              slug={slug}
              execute={execute}
              busy={busy}
            />
          ))}
      </div>
      <footer className="billing-footer">
        Ross Barbearia · AgendaFlex · Sem transações reais
      </footer>
    </main>
  );
}
