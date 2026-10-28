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

## Demonstração visual da barbearia

Abra `apps/web/public/demo.html` diretamente no navegador (duplo clique) ou, com `pnpm dev` ligado, visite `http://localhost:5173/demo.html`. O HTML é autocontido e não precisa de instalação, API, internet, Supabase ou login.

A Barbearia Vértice possui cinco profissionais fictícios. Alterne entre Cliente, Empresário e Barbeiro no topo. Simule uma reserva como cliente e consulte o resultado na agenda do empresário; inicie/conclua um atendimento como barbeiro e veja o status atualizado. Há filtros por dia e profissional, busca de cliente, catálogo e equipe.

Os dados vivem apenas na memória desta página e desaparecem ao recarregar ou clicar em **Reiniciar demo**. As datas são um cenário fixo de outubro de 2026. Os horários são ilustrativos: não há cálculo de disponibilidade por duração, autenticação, pagamentos ou reserva real. A troca entre visões serve apenas para apresentar a experiência e não representa controle de acesso. As três visões compartilham dados somente dentro da mesma aba.

A demo inclui planos mensais, retratos fictícios dos cinco barbeiros, comparador de repasses fixos e percentuais, financeiro do empresário com custos editáveis e extrato de ganhos do profissional. Veja as [hipóteses e fórmulas da demonstração](docs/demo-finance.md). A separação das visões é ilustrativa e não protege dados reais.
