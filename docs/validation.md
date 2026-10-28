# Validação da Etapa 1

Executada em 28/10/2026 no ambiente de desenvolvimento Linux, com Node.js 24.19.0 e pnpm 10.11.0 via Corepack.

| Verificação executada                                                 | Resultado                                                                    |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `corepack pnpm install`                                               | Dependências instaladas e lockfile gerado                                    |
| `pnpm install --frozen-lockfile --offline`                            | Passou; instalação reproduzida com cache e lockfile                          |
| `pnpm build`                                                          | Passou para os cinco workspaces                                              |
| `pnpm typecheck`                                                      | Passou; inclui testes e configurações TypeScript                             |
| `pnpm lint`                                                           | Passou sem warnings ESLint                                                   |
| `pnpm format:check`                                                   | Passou                                                                       |
| `pnpm test`                                                           | 7 testes Vitest passaram: 4 unitários e 3 de integração HTTP                 |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm test:e2e` | 10 testes passaram, desktop e mobile emulado em Chromium                     |
| `pnpm dev`                                                            | API e frontend iniciaram; health e três rotas responderam por HTTP           |
| `pnpm --filter @agendaflex/api start`                                 | API compilada iniciou e respondeu ao health; porta 3002 usada na verificação |
| `pnpm db:generate`                                                    | Migração gerada; segunda execução não encontrou diferenças                   |
| `git diff --check`                                                    | Passou                                                                       |

A API respondeu `{"status":"ok","service":"agendaflex-api","version":"0.1.0"}`. Os processos iniciados pelos checks foram encerrados após a validação.

O pnpm padrão da máquina era 11: foi usado um shim Corepack temporário no PATH para respeitar a versão fixada no projeto. Os comandos que iniciam processos HTTP/browser precisaram de execução autorizada fora das restrições de sockets do sandbox. Não foi necessário desabilitar TLS nem alterar as verificações das ferramentas.

A instalação emitiu avisos de depreciação do ESLint 9 e de dependências transitivas do Drizzle Kit. Esses avisos não são resultados de uma auditoria de vulnerabilidades; uma auditoria de segurança de dependências não foi executada nesta etapa.

Não executados: aplicação da migração em PostgreSQL/Supabase, login com Supabase Auth, testes de RLS com usuários reais e workflow no GitHub Actions. Não havia instância/credenciais de banco configuradas. Os clientes e o schema estão preparados, mas esses fluxos não são apresentados como funcionais ou validados. Não há deploy nem implementação da Etapa 2.

## Demonstração visual da barbearia

Adicionada posteriormente em `apps/web/public/demo.html`, como protótipo autocontido, sem integração com Auth ou banco. Build, typecheck e lint passaram após a adição. A suíte Playwright passou com **16 testes** em desktop e mobile (10 da fundação e 6 da demonstração), incluindo criação/cancelamento de reserva fictícia, sincronização entre visões, início/conclusão de atendimento, filtros, cinco profissionais e ausência de overflow.

O HTML também foi servido isoladamente por um servidor estático temporário, sem Vite ou API: nenhuma exceção JavaScript e apenas a requisição do próprio documento, sem dependências externas. As visões foram inspecionadas por capturas desktop e mobile. A navegação `file://` é bloqueada pela política do Chromium deste ambiente; a abertura direta por duplo clique não foi testada nesse navegador gerenciado.

## Planos mensais, retratos e financeiro

A ampliação da demo foi validada com **24 testes E2E passando** (14 da demo e 10 da fundação), em desktop e mobile Chromium. Foram executados cenários de combo incluído no plano com R$ 0 adicional, ausência de receita avulsa duplicada, comparação João/Antônio, uso zero no simulador, troca entre modelos de repasse, recálculo de aluguel, reinicialização de parâmetros e ausência dos menus financeiros nas outras visões. Os testes também decodificam o retrato incorporado, percorrem todos os menus sem exceções JavaScript e verificam ausência de overflow horizontal.

Lint, typecheck, build e verificação de formatação passaram. Os cálculos iniciais conferidos foram receita mensal de R$ 3.470 e resultado de −R$ 690,70; aluguel de R$ 800 em vez de R$ 900 melhora o resultado para −R$ 590,70. Com esse aluguel e repasse de 40% da mensalidade, o resultado é −R$ 230,70. Os parâmetros são fictícios e estão explicados em `docs/demo-finance.md`.

A inspeção visual cobriu os retratos de IA, símbolo fictício, seleção de profissional, dashboard financeiro, ganhos e menus em tela pequena. Não foi implementada autorização real: a separação entre empresário, cliente e barbeiro permanece somente de apresentação neste HTML.
