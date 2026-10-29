# Desenvolvimento local

## Pré-requisitos e instalação

Use Node.js 24 (arquivo `.node-version`) e pnpm 10.11.0. Com Corepack disponível, execute `corepack enable` e `corepack prepare pnpm@10.11.0 --activate`. Sem Corepack, instale o pnpm indicado pelo gerenciador da sua máquina. Todos os comandos abaixo partem da raiz do checkout.

1. `pnpm install` (CI usa `pnpm install --frozen-lockfile`).
2. Copie `.env.example` para `.env`, preservando valores vazios opcionais.
3. `pnpm dev`: inicia API e Vite em paralelo. Ctrl+C encerra ambos.
4. Consulte `/health` na porta 3001: `{"status":"ok","service":"agendaflex-api","version":"0.1.0"}`.
5. Visite o frontend na porta 5173 e navegue entre as três áreas.

A API usa Fastify inject nos testes de integração; não depende de banco. O health check é de vida do processo, **não de prontidão do banco ou Supabase**. Não recebe segredos ou informações de infraestrutura na resposta.

## Variáveis

O Vite e o processo da API leem `.env` na raiz; variáveis do processo têm precedência. Reinicie os serviços após mudanças.

| Variável                                   | Uso                                                                               |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `HOST`, `PORT`                             | API local, padrão 127.0.0.1:3001                                                  |
| `WEB_ORIGIN`                               | Origem exata autorizada pelo CORS; padrão http://localhost:5173                   |
| `VITE_API_URL`                             | Endereço público da API usado pelo navegador                                      |
| `VITE_SUPABASE_URL`                        | URL pública do Supabase, opcional nesta etapa                                     |
| `VITE_SUPABASE_PUBLISHABLE_KEY`            | Chave pública publishable/anon; nunca service-role                                |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Configuração pública usada por futuros adaptadores da API; configurar em conjunto |
| `DATABASE_URL`                             | Conexão PostgreSQL apenas no servidor e ferramentas Drizzle                       |

Qualquer variável `VITE_*` é exposta no bundle. Não adicione tokens privados, senha de banco, JWT signing secrets ou chaves service-role. `.env` é ignorado pelo Git. Sem URL/chave pública configuradas, o cliente Auth não é criado e o login fica desabilitado. Com configuração válida, o SDK restaura a sessão e a API verifica o usuário e seus vínculos; não há sessão fictícia no React. O HTML demo continua separado.

## Comandos e verificações

- `pnpm build`: compila pacotes, banco, API e aplicação web; saída em `dist` de cada workspace.
- `pnpm --filter @agendaflex/api start`: executa a API compilada (rode build primeiro).
- `pnpm typecheck`: TypeScript strict dos pacotes, aplicações e testes/configuração.
- `pnpm lint`: ESLint com regras de hooks e acessibilidade JSX.
- `pnpm format` / `pnpm format:check`: formatação e validação Prettier.
- `pnpm test`: Vitest para contratos/variáveis e requisições reais ao roteador Fastify via inject.
- `pnpm test:e2e`: Playwright inicia os dois serviços e verifica rotas, health da API no navegador, tema por teclado e ausência de overflow em desktop e mobile Chromium. Instale os navegadores antes com `pnpm exec playwright install --with-deps chromium`.

Para um teste E2E isolado, encerre serviços antigos nas portas 3001 e 5173. Fora do CI, Playwright pode reutilizar serviços existentes; no CI exige serviços novos. Alterações de portas exigem ajustar também as URLs de Playwright.

## Supabase local opcional

O fluxo desta fase funciona sem Docker. Para testar persistência futuramente, instale a CLI oficial do Supabase e Docker, inicialize um projeto local fora deste checkout (`supabase init` e `supabase start`) e preencha `.env` com a URL, chave pública e conexão PostgreSQL fornecidas pela instância local. Não use produção para validar migrações. Não há serviço pago necessário.

`pnpm db:generate` gera migrações sem banco. `pnpm db:migrate` aplica as migrações e exige `DATABASE_URL`. A migração inicial habilita RLS; a migração 0001 permite leitura dos vínculos próprios e tenants associados, sem escrita pelo navegador. Ela exige Supabase local ou de desenvolvimento. Veja database/README.md antes de conectar dados.

## Solução de problemas

- Instalação bloqueada: confira acesso HTTPS a registry.npmjs.org e GitHub para ferramentas. Preserve TLS e não desative verificações.
- API indisponível na interface: verifique processos, `VITE_API_URL` e `WEB_ORIGIN`; CORS não substitui autenticação.
- Portas ocupadas: encerre processos da sua sessão ou ajuste configuração local; não finalize processos de terceiros.
- Erro de Supabase: não é necessário preencher valores fictícios. Deixe variáveis vazias até configurar uma instância real.
- Em produção, configure o host HTTP para encaminhar rotas SPA para `index.html`; não há configuração de deploy nesta fase.

Se um Chromium já estiver instalado, é possível usar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/caminho/para/chromium pnpm test:e2e`. O CI usa o navegador instalado pelo Playwright. A variável é apenas de ferramentas, nunca do frontend.

Para conectar o login real, siga [Supabase passo a passo](supabase-setup.md). `pnpm test:e2e:auth` usa serviços de Auth/API simulados em um servidor separado; não comprova login ou e-mail reais.
