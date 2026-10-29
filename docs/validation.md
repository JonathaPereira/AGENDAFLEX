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

## Modo escuro, inadimplência, escala e salário base

A versão seguinte da demonstração passou em **32 testes E2E** (22 da demo e 10 da fundação), em desktop e mobile. Foram executados novos cenários para:

- alternar tema sem perder a escolha ao navegar e abrir/fechar explicações pelo teclado;
- partir de 300 assinaturas (100 por plano), 270 em dia e 30 vencidas, com R$ 32.400 considerados recebidos;
- bloquear o perfil vencido, simular regularização e liberar o agendamento;
- editar clientes, preço e vencidas por plano e rejeitar vencidas maiores que a quantidade cadastrada;
- confirmar dez horários por barbeiro, sem sessões às 12h/13h, com último início às 20h e término às 21h;
- deduzir salário base uma única vez no financeiro, refletir a mudança nos ganhos do profissional, paginar seu extrato e trocar para somente comissão.

Com cabelo passando para 80 clientes, cinco vencidos e R$ 150, as mensalidades consideradas recebidas passaram a R$ 32.850. Aumentar o salário de Rafael em R$ 300 reduziu o resultado da empresa em R$ 300. Desligar os salários iniciais melhorou o resultado em R$ 7.500, sem remover as comissões.

A primeira execução com quatro navegadores paralelos teve dois timeouts em testes longos de mobile, com as demais 30 verificações passando. A concorrência padrão foi alinhada aos dois workers usados no CI e o extrato foi paginado; a suíte completa terminou com 32 passes. Nenhuma asserção foi removida ou desativada.

Build, lint e typecheck foram executados com sucesso após a ampliação. A inspeção visual incluiu modo escuro no financeiro, lista de assinaturas, remuneração e tela mobile de 390 px, sem overflow horizontal observado. Estes resultados não validam pagamentos, cobrança, autorização no servidor ou Supabase: todos continuam fora do escopo deste HTML.

## Questionário e dashboard personalizado

A suíte integrada passou com **38 testes E2E** em desktop e mobile (32 existentes e seis execuções de três novos cenários do assistente). O questionário foi percorrido de ponta a ponta com equipe, remuneração, gastos, planos, preços e jornada diferentes do cenário inicial.

No cenário de três profissionais, foram conferidos nome do negócio, paleta, três profissionais visíveis, três opções no seletor do barbeiro, R$ 2.230 em mensalidades em dia, R$ 3.500 em salários, preço avulso de R$ 70, jornada terminando às 18h e três reservas diárias por profissional a 50% de ocupação de seis sessões.

Também foram executados retorno com rascunho preservado, cancelamento sem alterar o negócio, rejeição de vencidas maiores que clientes, rejeição de almoço inválido e configuração de oito profissionais atendendo somente aos sábados com sessões de 30 minutos. Nesse último caso, a revisão mostrou capacidade de 160 sessões no mês e alertou que a demanda dos planos era maior. A agenda respeitou as folgas, aceitou a sessão das 10h30 terminando às 11h e voltou a cinco profissionais/dez horários após reiniciar.

A inspeção visual cobriu a entrada do questionário, a etapa exclusiva de gastos em mobile escuro, a revisão e o dashboard gerado. Build, lint e typecheck foram executados com sucesso. O fluxo foi servido também como HTML isolado por servidor estático, sem API ou Supabase. Respostas e cenários não são persistidos após recarregar a página.

## Ross Barbearia — identidade e novos fluxos

A experiência foi adaptada à Ross, com versão web da logo fornecida, tema carvão/laranja, cabeçalho minimalista e serviços no início do fluxo do cliente. Os registros continuam fictícios, sem pagamentos reais ou autenticação.

A suíte integrada executou **54 testes E2E com sucesso** em desktop e mobile Chromium: 38 verificações anteriores atualizadas para a nova identidade e 16 execuções de oito cenários específicos da Ross. Foram verificados:

- quinze datas de 28/10 a 11/11, serviço de plano em novembro bloqueado pela validade de outubro e reserva avulsa aceita no mesmo período;
- exibição de plano atual, ciclo e aviso explícito de integração de pagamentos futura;
- cadastro de barbeiro/serviço, remoção confirmada de profissional sem reservas e bloqueio de remoção com compromissos ativos;
- gasto adicional fixo de R$ 100 e variável de R$ 2 por atendimento, com resultado financeiro alterado exatamente pelo custo correspondente e sem duplicação ao remover o variável;
- folga bloqueando o profissional original, transferência confirmada preservando cliente/serviço/horário e recusa quando não existe outro barbeiro disponível;
- ausência com confirmação, cancelamento sem geração de comissão, reabertura do horário das 11h ainda válido e manutenção do bloqueio das 09h já passadas;
- perfil de cliente com reservas futuras e realizados no ano; indicadores de recorrência aumentando automaticamente ao concluir atendimento;
- adição/remoção no questionário, incluindo novos gastos e serviços sem a pergunta manual de visitas estimadas;
- oito profissionais, sete serviços e três gastos adicionais mantendo a largura do documento dentro dos viewports de 360, 768 e 1440 px.

A inspeção visual também cobriu o cliente Ross em desktop/mobile, a página de folgas e a lista de clientes, com HTML servido isoladamente sem API. Uma falha inicial de teste identificou que o seletor de tipo de gasto precisava de nome acessível explícito; isso foi corrigido e as verificações financeira e integrada passaram. A escolha de plano também foi ajustada para selecionar expressamente a modalidade de plano no agendamento.

Build, typecheck e lint foram executados após a ampliação. CI remoto, gateway, persistência, autorização, RLS, notificações e concorrência entre sessões não foram validados nem implementados nesta entrega de demonstração.

Uma checagem adicional de equipe/quadro de configuração passou em quatro execuções (desktop/mobile), incluindo desfazer o salário de um cadastro novo sem qualquer registro e manter identificadores únicos ao remover e adicionar profissionais no questionário. Custos e histórico são preservados na remoção quando há registros anteriores; um cadastro sem registros é desfeito integralmente.

## Ross — cadastro, prévia por e-mail e renovação antecipada

Foram adicionados seis cenários E2E em `tests/e2e/accounts.spec.ts`, executados com sucesso em desktop e mobile (doze execuções): cadastro por empresário/barbeiro com CPF, RG, endereço, celular e e-mail, rejeição de e-mail duplicado, perfil com dados cadastrais, menus por e-mail ilustrativo, navegação direta entre tópicos preservando respostas, edição de nome/duração do serviço e indisponibilidade quando não cabe antes do fechamento, reserva de plano no próximo ciclo, escolha de crédito sem confirmar pagamento, baixa de dinheiro confirmada/cancelada, bloqueio de segunda baixa do mesmo ciclo e liberação de cliente novo inicialmente sem pagamento.

A regra anterior que bloqueava qualquer reserva de plano após 31/10 foi substituída por reserva antecipada com renovação pendente, mantendo o bloqueio para quem já está vencido. O teste da janela de quinze dias foi atualizado para essa regra. A reserva continua sujeita à confirmação de renovação antes do atendimento. A data de débito ilustrativa é dia 28 para o mês seguinte; escolher forma de pagamento não altera validade. A baixa registra ciclo, valor, meio e operador, separando o próximo ciclo do resultado de outubro.

Build, typecheck, lint, verificação de formatação e sete testes Vitest (quatro unitários e três de integração do health) foram executados com sucesso. Também houve inspeção visual do cadastro em 360 px e dos recebimentos em desktop. O cabeçalho foi ajustado para acomodar os novos controles em telas pequenas e o seletor de pagamento ganhou nome acessível explícito. Execuções iniciais simultâneas da suíte disputaram servidor/artefatos; a execução final foi realizada isoladamente. Um teste de baixa foi corrigido para preencher novamente a busca após a atualização da tela.

Esta validação cobre o protótipo. Login real, confirmação de e-mail, documentos reais, autorização por tenant, gateway, débito em cartão, Pix e armazenamento definitivo não foram implementados ou validados.

Resultado final da suíte integrada: **66 testes E2E passaram** em Chromium desktop/mobile (54 cenários anteriores atualizados e doze execuções dos seis cenários novos). Comando: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm test:e2e`.

## Empresário barbeiro, contatos e balcão avulso

A suíte integrada passou com **76 testes E2E em desktop/mobile Chromium**: os 66 anteriores e dez execuções de cinco novos cenários em `tests/e2e/counter.spec.ts`. A conta do empresário alterna gestão/atendimento sem outro login, funcionário ou alteração do resultado financeiro; os testes de funcionários foram ajustados para usar Bruno (`barbeiro2@ross.example`), pois Rafael agora usa a conta única do proprietário.

Foram executados: perfil de João com contatos/documentos fictícios e redefinição sem envio de e-mail ou exposição de senha; cancelamento da revisão sem cadastrar/receber; cadastro rápido com recebimento em dinheiro e reserva confirmada; serviço concluído posteriormente mantendo a receita avulsa uma única vez; busca de cliente existente, seleção de data livre e profissional limitado à própria sessão; baixa Pix de serviço já concluído sem outra reserva nem alteração duplicada do resultado. O incremento de um avulso de R$ 55 foi R$ 51,70 no resultado antes da conclusão (6% de taxas/tributos estimados), com comissão/insumos reconhecidos ao concluir.

Na primeira execução específica, seletores de nome do cliente e rótulo da lista precisaram ser corrigidos. O cenário de balcão também expôs a agenda inicial cheia: foi acrescentada seleção de data e recebimento direto de reserva existente, mantendo a proibição de encaixe sem disponibilidade. O teste de conclusão abre uma vaga por ausência confirmada antes de cadastrar o novo atendimento.

Build, typecheck, lint e sete testes Vitest passaram. Houve inspeção por capturas do modo barbeiro do proprietário em 360 px, balcão em 360 px e contatos em desktop; nenhuma exceção JavaScript no percurso inspecionado e largura do documento de 360 px no viewport de 360 px. Os E2E cobriram o balcão também em 768 e 1440 px.

Continuam fora do escopo: autenticação real, mensagens/e-mails, senhas reais, persistência, gateway, estorno e documento fiscal. Os documentos e telefones dos perfis iniciais são sintéticos; o HTML não verifica identidade.

Uma checagem adicional do perfil passou em duas execuções (desktop/mobile), incluindo completar e-mail e celular e preservar os dois atendimentos do histórico. `pnpm format:check` e `git diff --check` também passaram.
