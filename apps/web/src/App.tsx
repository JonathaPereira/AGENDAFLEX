import { useEffect, useState } from 'react';
import { NavLink, Outlet, Route, Routes, Link } from 'react-router-dom';
import { Badge, Card, ThemeToggle } from '@agendaflex/ui';
import { healthResponseSchema } from '@agendaflex/shared';

import {
  AuthPage,
  CallbackPage,
  AccountPage,
  RequireManagement,
} from './auth/AuthPages';
function ApiStatus() {
  const [status, setStatus] = useState('Verificando API…');
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/health`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error('Health check failed');
        healthResponseSchema.parse(await response.json());
        setStatus('API disponível');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('API indisponível');
      });
    return () => controller.abort();
  }, []);
  return <span role="status">{status}</span>;
}
function Layout({ area, panel = false }: { area: string; panel?: boolean }) {
  return (
    <div className={panel ? 'shell panel-shell' : 'shell'}>
      <a className="skip-link" href="#main">
        Ir para o conteúdo
      </a>
      <header className="topbar">
        <Link className="brand" to="/" aria-label="AgendaFlex início">
          <span className="brand-mark" aria-hidden="true">
            a
          </span>
          Agenda<span>Flex</span>
        </Link>
        <ThemeToggle />
      </header>
      <nav aria-label="Áreas da plataforma" className="area-nav">
        <NavLink to="/" end>
          Portal público
        </NavLink>
        <NavLink to="/painel">Estabelecimento</NavLink>
        <NavLink to="/saas">Gestão SaaS</NavLink>
        <NavLink to="/login">Entrar na Ross</NavLink>
        <a href="/demo.html">Ross Barbearia ↗</a>
      </nav>
      <main id="main" className="content" tabIndex={-1}>
        <div className="eyebrow">
          {area} <span aria-hidden="true">/</span> Etapa 1
        </div>
        <Outlet />
      </main>
      <footer>
        <span>AgendaFlex · Fundação técnica</span>
        <ApiStatus />
      </footer>
    </div>
  );
}
function Portal() {
  return (
    <>
      <div className="hero">
        <Badge>Seu tempo, bem cuidado</Badge>
        <h1>
          Mais espaço para
          <br />
          <em>o que importa.</em>
        </h1>
        <p>
          Uma nova experiência para conectar pessoas e estabelecimentos.
          Simples, flexível e com a sua identidade.
        </p>
        <div className="hero-note">
          <span className="status-dot" />
          Plataforma em construção
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Card title="Uma experiência sua">
          <p>
            Base visual preparada para a identidade de cada estabelecimento.
          </p>
        </Card>
        <Card title="Tudo no seu lugar">
          <p>Áreas próprias para clientes, estabelecimentos e administração.</p>
        </Card>
        <Card title="Construído com cuidado">
          <p>
            Acessibilidade, privacidade e isolamento como princípios da
            plataforma.
          </p>
        </Card>
      </div>
      <aside className="notice">
        Os agendamentos estarão disponíveis em uma próxima etapa. Nenhum dado de
        cliente é coletado nesta versão.
      </aside>
    </>
  );
}
function Panel({ central = false }: { central?: boolean }) {
  return (
    <>
      <div className="page-heading">
        <Badge>
          {central ? 'Administração da plataforma' : 'Seu espaço de gestão'}
        </Badge>
        <h1>{central ? 'Gestão SaaS' : 'Painel do estabelecimento'}</h1>
        <p>
          {central
            ? 'A base para acompanhar empresas e planos em um só lugar.'
            : 'A base para organizar a operação do seu negócio.'}
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {(central
          ? ['Empresas', 'Planos', 'Administração']
          : ['Serviços e profissionais', 'Clientes', 'Agenda']
        ).map((title) => (
          <Card key={title} title={title}>
            <Badge>Em breve</Badge>
            <p>Este módulo será desenvolvido nas próximas etapas.</p>
          </Card>
        ))}
      </div>
      <aside className="notice">
        <strong>Sessão verificada; módulos em construção.</strong> Os serviços,
        clientes e agendamentos da demonstração ainda não foram migrados para
        este painel.
      </aside>
    </>
  );
}
export function App() {
  return (
    <Routes>
      <Route path="login" element={<AuthPage />} />
      <Route path="criar-conta" element={<AuthPage mode="signup" />} />
      <Route path="recuperar-senha" element={<AuthPage mode="forgot" />} />
      <Route path="auth/callback" element={<CallbackPage />} />
      <Route path="redefinir-senha" element={<CallbackPage recovery />} />
      <Route path="conta" element={<AccountPage />} />
      <Route element={<Layout area="Portal público" />}>
        <Route index element={<Portal />} />
      </Route>
      <Route
        path="painel"
        element={
          <RequireManagement>
            <Layout area="Estabelecimento" panel />
          </RequireManagement>
        }
      >
        <Route index element={<Panel />} />
      </Route>
      <Route
        path="saas"
        element={
          <RequireManagement central>
            <Layout area="Gestão SaaS" panel />
          </RequireManagement>
        }
      >
        <Route index element={<Panel central />} />
      </Route>
      <Route path="*" element={<Layout area="Página não encontrada" />}>
        <Route
          path="*"
          element={
            <>
              <h1>Página não encontrada</h1>
              <Link to="/">Voltar ao início</Link>
            </>
          }
        />
      </Route>
    </Routes>
  );
}
