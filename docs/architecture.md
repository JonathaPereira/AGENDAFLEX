# Arquitetura — Etapa 1

## Organização

| Caminho           | Responsabilidade                                                                 |
| ----------------- | -------------------------------------------------------------------------------- |
| `apps/web`        | React, Vite, rotas e composição dos layouts; sem acesso direto ao PostgreSQL     |
| `apps/api`        | Transporte HTTP Fastify, validação de ambiente e adaptadores de infraestrutura   |
| `packages/shared` | Contratos Zod e vocabulário tipado compartilhado; sem dependência de UI ou banco |
| `packages/ui`     | Componentes React reutilizáveis com semântica nativa e alternância de tema       |
| `database`        | Schema Drizzle, fábrica de conexão e migrações versionadas                       |
| `tests`           | Unitários, integração HTTP e E2E                                                 |
| `docs`            | Decisões e operação local                                                        |

Não há domínio de agendamento implementado. Futuras regras de negócio devem viver em módulos de domínio sem dependência de React, Fastify ou clientes SQL. Adaptadores HTTP chamam casos de uso e passam contexto autenticado; repositórios implementam persistência. Evite colocar regras em componentes ou rotas.

## Interfaces

Três entradas de rota usam um shell responsivo compartilhado, com variantes para o portal e os painéis. Há navegação semântica, link para pular ao conteúdo, foco visível, botões nativos, feedback de saúde e página de rota desconhecida. Os módulos exibem estado de construção; não há números ou usuários de demonstração passando por dados reais.

Tailwind CSS 4 fornece utilitários; tokens CSS definem superfícies, cores, bordas e foco. `data-theme` permite alternar claro/escuro durante a sessão. Esta base admite futuros tokens White Label, mas não resolve marcas por domínio nem carrega temas por tenant. A autorização jamais depende de cores, URLs ou estado visual.

## Integrações

O Supabase Auth foi escolhido como provedor, com fábricas de clientes sem conexão automática obrigatória. Drizzle mantém o schema PostgreSQL. A API inicial é independente desses serviços: somente `/health` está disponível, sem rota de leitura/gravação privada. Não há pagamento, WhatsApp, tarefa em background ou agenda.

Os pacotes internos exportam fontes TypeScript para simplificar o workspace privado. O Vite e o tsup empacotam essas fontes; `tsc` valida e emite artefatos dos pacotes. Não são pacotes publicados no npm. A API compilada deve ser distribuída junto com suas dependências de runtime.

## Qualidade e CI

TypeScript strict, ESLint, Prettier, Vitest e Playwright compõem o fluxo. CI reproduz instalação com lockfile, formatação, análise estática, testes, build e E2E. Testes de banco e Auth reais dependem de uma instância local e serão adicionados com a implementação dessas integrações; não são simulados como integração pronta nesta etapa.
