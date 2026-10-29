# Arquitetura

| Caminho           | Responsabilidade                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| `apps/web`        | React/Vite, Auth, layouts, protótipo e operação conectada de teste; sem PostgreSQL direto                 |
| `apps/api`        | Fastify, validação de JWT, contratos de transporte, porta de faturamento e adaptador Supabase por usuário |
| `packages/shared` | Contratos Zod e vocabulário, sem dependência de interface/banco                                           |
| `packages/ui`     | Componentes acessíveis e temas da fundação                                                                |
| `database`        | Schema Drizzle, migrações e transações de domínio/autorização                                             |
| `tests`           | Testes de contratos, API, Auth e navegador                                                                |
| `database/tests`  | Regras financeiras, isolamento, concorrência e migrações em PostgreSQL local                              |
| `docs`            | Instalação, decisões, limites e evidência de verificação                                                  |

O HTML `demo.html` continua um protótipo independente, fictício e em memória. O módulo React `/barbearia/:slug` usa Supabase Auth e PostgreSQL para planos, serviços, profissionais vinculados, mensalidades, recebimentos/reembolsos de teste e agendamento inicial. Não há promoção de usuários fictícios do protótipo para identidades reais.

A API valida sessão e chama a porta de faturamento tipada. O adaptador chama RPCs com o JWT do próprio usuário e chave pública. Regras que precisam de atomicidade ficam em `billing_command`: autorização com vínculos persistidos, preço imutável da fatura, recebimento, renovação, liberação e ocupação do horário. A RPC usa `SECURITY DEFINER` com search path vazio; tabelas têm RLS e leitura/gravação direta revogadas. A interface apenas apresenta o resultado. O motivo dessa escolha é impedir que falhas ou concorrência entre chamadas separem pagamento, liberação e reserva.

Há isolamento por tenant em consultas, decisões e chaves estrangeiras. Papéis enviados pelo cliente ou em `user_metadata` não concedem acesso. Reembolso e finanças gerais são exclusivos do empresário; a conta dele também pode ser vinculada como profissional. `/saas` permanece restrita até existir autorização própria da plataforma.

A API não precisa de banco para `/health`. O restante depende de Supabase configurado e migrações aplicadas. `createDatabase` é uma fábrica administrativa/lazy; conexão SQL direta não herda automaticamente o contexto RLS do Auth e não é usada nas requisições de clientes.

As aplicações Android/iOS usam Capacitor com assets empacotados. A prévia desliga Auth e mantém dados fictícios; o build conectado exige API HTTPS e remove o HTML de demonstração. Android Studio e Xcode compilam projetos nativos separadamente do build TypeScript.

Tailwind 4 fornece utilitários; CSS usa tokens, foco visível, semântica nativa e layouts responsivos. A base admite White Label, mas resolução por domínio e temas por tenant ainda não existem. A operação conectada usa a marca Ross; o protótipo mantém suas próprias interações e temas.

TypeScript strict, ESLint, Prettier, Vitest e Playwright compõem o CI, com PostgreSQL 17 descartável para integração. Fixtures de Auth são explicitamente limitadas a testes; testes em navegador móvel Chromium não equivalem a iPhone/Safari. Gateway financeiro, integração de pagamentos reais, fotos e funcionalidades operacionais restantes estão pendentes. [Faturamento](billing.md) detalha os limites e o caminho até um provedor real.
