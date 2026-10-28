# AgendaFlex

Fundação de um SaaS multi-tenant e White Label para agendamentos. Esta Etapa 1 contém infraestrutura, layouts e contratos; **não contém motor de agendamentos, login funcional ou dados de empresas**.

## Execução rápida

Requisitos: Node.js 24 e pnpm 10.11.0 (`corepack enable` e `corepack prepare pnpm@10.11.0 --activate`, se necessário).

```sh
pnpm install
cp .env.example .env
pnpm dev
```

Frontend: `http://localhost:5173`. API: `http://localhost:3001/health`.

Nenhuma credencial ou serviço externo é necessário para iniciar a interface e o health check. Rotas: `/` (portal), `/painel` (estabelecimento), `/saas` (administração). Os painéis são estruturas públicas sem sessão ou informações privadas, não áreas protegidas prontas para produção.

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
```

Veja [instalação e configuração](docs/development.md), [arquitetura](docs/architecture.md), [segurança e tenants](docs/auth-and-tenancy.md) e [banco e migrações](database/README.md).
