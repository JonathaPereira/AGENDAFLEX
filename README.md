# AgendaFlex · Ross Barbearia

Monorepo da fundação do AgendaFlex e demonstração interativa da Ross Barbearia. A marca de referência é real; **profissionais, clientes, preços, salários e históricos são fictícios**. Não há pagamentos, autenticação ou reservas reais no HTML de demonstração. O projeto React agora tem uma etapa separada de login via Supabase, pendente de conexão e validação com seu projeto.

## Etapa em andamento: login Supabase

Acesse `/login` no React para a tela Ross com entrada, criação de conta e recuperação de senha. Sem projeto configurado, os botões ficam desabilitados. `/conta` verifica a sessão pela API; `/painel` exige vínculo retornado pelo servidor e `/saas` ainda não possui liberação. Criar conta não concede administração.

Siga [o passo a passo do Supabase](docs/supabase-setup.md). O SQL inicial para um projeto de desenvolvimento vazio está em `database/supabase/setup-dev.sql`; `link-owner.sql` atribui o primeiro proprietário após confirmação de e-mail. Nenhum script foi aplicado no seu projeto automaticamente.

## Abrir a demonstração sem instalação

Abra `apps/web/public/demo.html` no navegador, com dois cliques. O HTML contém logo, retratos, estilos e interações e não precisa de internet, API ou Supabase.

Alterne no cabeçalho entre **Cliente**, **Empresário** e **Barbeiro**. As ações ficam somente na memória da mesma aba; recarregar ou **Reiniciar demo** restaura o cenário inicial.

- Cliente: serviços primeiro, escolha avulso/plano, agenda de quinze dias e plano/ciclo de faturamento.
- Empresário: questionário de configuração, equipe, serviços, gastos fixos/variáveis, assinaturas, financeiro, perfis de clientes, folgas e transferência confirmada de reservas.
- Barbeiro: agenda e ganhos individuais, início/conclusão, ausência com confirmação e transferência das próprias reservas.

Empresário e barbeiro podem cadastrar clientes e simular baixa de mensalidades no salão. Serviços existentes têm edição por lápis. Crédito, débito, Pix e dinheiro aparecem no faturamento; clientes em dia podem reservar o próximo ciclo com renovação pendente. A cobrança ilustrativa acontece no dia 28, antecipando o mês seguinte.

**Simular login por e-mail** permite conferir os menus de `proprietario@ross.example`, `barbeiro2@ross.example` e `joao@cliente.ross.example`, além dos novos clientes cadastrados. É somente uma prévia, sem senha ou autenticação.

O empresário também atende: **Modo gestão** e **Modo barbeiro** compartilham sua conta e seu profissional na equipe (Rafael no cenário inicial). **Atendimento avulso** reúne cadastro rápido, reserva e recebimento confirmado; na agenda, **Receber avulso** registra o pagamento de um atendimento existente. Os perfis dos clientes têm contatos fictícios e redefinição simulada de acesso, sem exibição de senha.

O botão **Monte sua barbearia** abre o assistente de oito etapas, agora com navegação direta pelos tópicos. Gerar o dashboard aplica as respostas e substitui o cenário fictício. A recorrência é calculada dos atendimentos, sem pergunta manual de visitas estimadas.

Veja [fluxos e limites da Ross](docs/ross-demo.md), [modelo financeiro](docs/demo-finance.md) e [validações executadas](docs/validation.md).

## Executar o monorepo localmente

Requisitos: Node.js 24 e pnpm 10.11.0. Com Corepack disponível: `corepack enable` e `corepack prepare pnpm@10.11.0 --activate`.

```sh
pnpm install
cp .env.example .env
pnpm dev
```

Frontend da fundação: `http://localhost:5173`. Demonstração Ross: `http://localhost:5173/demo.html`. API: `http://localhost:3001/health`.

Nenhuma credencial externa é necessária para iniciar a fundação, o health ou a demo. `.env.example` documenta as integrações opcionais. As rotas `/`, `/painel` e `/saas` continuam como base técnica do SaaS, sem dados privados.

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
```

Quando houver Chromium instalado no sistema, os E2E podem usar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/caminho/para/chromium pnpm test:e2e`.

Documentação: [desenvolvimento](docs/development.md), [arquitetura](docs/architecture.md), [autenticação e isolamento](docs/auth-and-tenancy.md) e [banco/migrações](database/README.md).

O produto real ainda exige conectar e validar Supabase Auth/RLS no projeto, migrar os módulos operacionais para persistência, integrar pagamentos, notificações e controle de concorrência. Os seletores de visão/perfil do HTML servem para apresentação e não protegem dados reais.
