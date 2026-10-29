# Faturamento e agendamentos — ambiente de teste

Este módulo usa sessão Supabase e dados persistidos no PostgreSQL. A rota React é `/barbearia/ross-barbearia`, acessível por `/conta`. Ele é diferente do protótipo offline `demo.html`: não importa pessoas, preços, usuários ou permissões fictícias do HTML.

**Nenhuma transação real é criada.** Pix, crédito, débito, recebimento em dinheiro e reembolso são simulações internas, identificadas nas telas. Não existe integração com um sandbox externo de adquirente. Não são solicitados números de cartão, CVV, chaves privadas ou transferências. O modo `test` é obrigatório no banco e no contrato da API; não há chave de configuração para habilitar cobranças reais.

## Aplicar no projeto Supabase que já tem login

1. Abra **SQL Editor → New query** no seu projeto Supabase de desenvolvimento.
2. Copie o conteúdo completo de [`database/supabase/billing-update.sql`](../database/supabase/billing-update.sql) e execute. É uma atualização incremental: não apaga contas, empresas ou vínculos anteriores.
3. A transação confere os hashes das duas migrações anteriores. Se o histórico for diferente ou a atualização já tiver sido aplicada, recusa tudo. Não tente remover essa conferência para forçar a execução.
4. Para uma instalação inteiramente nova, use `setup-dev.sql`, que já inclui todas as migrações. **Não repita o setup inicial em um projeto existente.**

A chave pública do aplicativo não pode executar migrações. O SQL precisa ser aplicado pelo administrador no SQL Editor, ou por `pnpm db:migrate` com conexão administrativa configurada fora do frontend. Esta alteração não foi aplicada automaticamente ao projeto remoto do usuário.

## Primeiro ensaio com contas separadas

1. Configure URL/chaves públicas do Supabase e a API conforme [Supabase](supabase-setup.md). Não compartilhe senha ou chave privilegiada no chat.
2. Quando decidir criar as contas, crie e confirme uma conta de teste pelo login. Atribua o empresário pelo script administrativo `database/supabase/link-owner.sql`. Criar conta por si só nunca concede gestão. Contas de funcionários continuam dependendo de vínculo administrativo explícito; este módulo não promove usuários.
3. No computador, execute `pnpm install --frozen-lockfile` e `pnpm dev`. Acesse `http://localhost:5173/login`; depois, em Minha conta, **Abrir operação de teste**.
4. Como empresário, abra **Configurar negócio** e cadastre plano, serviço e barbeiro. Pode selecionar sua própria conta como barbeiro. Não há contas inventadas como alternativa à autenticação.
5. Em outro navegador/perfil, crie e confirme a conta de cliente. Em **Acessar a Ross Barbearia**, complete o nome, escolha um plano e gere a mensalidade.
6. Escolha Pix/crédito/débito e simule resultado aprovado, pendente ou não aprovado. Só a aprovação marca a mensalidade como paga. Não aparece QR Code nem há débito automático.
7. Reserve um horário. O painel do empresário atualiza ao receber foco, ao clicar em Atualizar dados, ou a cada 15 segundos enquanto estiver visível. O pagamento e a liberação são gravados atomicamente na mesma transação; a atualização entre telas usa polling, não WebSocket.
8. No empresário, abra **Mensalidades e pagamentos → Reembolsar mensalidade**, informe o motivo e confirme. O cliente/barbeiro não tem esse comando autorizado. A tentativa direta pela API/RPC também é negada.

## Regras do primeiro fluxo

- Valores são inteiros em centavos, moeda BRL. Preço e cobertura ficam congelados na mensalidade emitida. Nome, tipo e duração do serviço ficam preservados no agendamento; editar o catálogo não altera atendimentos anteriores.
- Ciclos mensais de calendário, em `America/Fortaleza`: primeiro dia do mês até o primeiro dia do mês seguinte, exclusivo no banco. A tela mostra o último dia incluído. Nesta versão não há pró-rata, troca automática de plano ou aniversário de cobrança individual.
- A data prevista de renovação é três dias antes do próximo ciclo. A primeira mensalidade emitida depois disso vence no próprio dia da emissão. Essa data não significa débito em cartão: não existe débito automático configurado.
- Ao abrir/atualizar o portal, assinaturas que já tiveram pagamento aprovado geram de forma idempotente o ciclo atual faltante. Nos últimos sete dias do mês, também é emitido o próximo ciclo para quem está em dia. O cliente pode gerar o próximo ciclo manualmente após pagar o atual. Não há tarefa externa contratada, cobrança em background ou lembrete automático.
- Pagamento pendente ou não aprovado não libera a assinatura. Aprovar duas vezes não duplica recebimento. Alterar método/valor/cliente no navegador não muda o valor confiável do banco.
- Uma mensalidade atual paga permite reservar no ciclo seguinte dentro da janela de 15 dias, com estado **Vaga reservada · aguarda renovação**. Isso evita perder uma vaga antes da virada do mês. A aprovação da mensalidade correspondente confirma a reserva. O início do atendimento confere novamente pagamento e cobertura para aquela data.
- Sem ciclo atual pago, uma reserva pelo plano é negada com: **“Não foi possível agendar neste momento. Por favor, entre em contato com a recepção.”** Login e consulta da própria conta continuam disponíveis.
- Um serviço avulso é escolhido explicitamente e mantém seu preço; não converte automaticamente uma tentativa pelo plano em cobrança. O pagamento de avulsos continua na recepção e não entra no saldo de mensalidades desta entrega.
- Dinheiro: o empresário pode registrar recebimento de mensalidade. O barbeiro só pode dar baixa de um cliente com atendimento atribuído a ele naquele dia e no ciclo correspondente. São registros de teste, não comprovantes de dinheiro real recebido.
- Reembolso: somente empresário, valor integral, com motivo e confirmação. Registro preserva pagamento original, autor, valor e horário. Repetir não duplica devolução. A mensalidade fica reembolsada, cessa a emissão de novas mensalidades dessa assinatura e reservas futuras sem outra cobertura paga são canceladas, liberando os horários. Ciclos pagos diferentes não são automaticamente reembolsados. Uma nova contratação após reembolso exige ajuste administrativo em etapa posterior; não há reativação silenciosa.
- Recebido bruto, reembolsado e saldo são distintos. O saldo é **recebimentos menos reembolsos**, sem despesas, comissões, impostos ou taxas; não é apresentado como lucro. A separação por Pix/crédito/débito/dinheiro considera os reembolsos e agrupa pelo mês de cobertura, não pela data do caixa.

## Agendamento conectado inicial

A consulta de horários devolve apenas vagas, sem expor clientes de terceiros. O servidor usa a duração do serviço, impede sobreposição do cliente/profissional e serializa as gravações por estabelecimento. A janela cobre hoje e os 14 dias seguintes, das 09h às 21h, com almoço 13h–15h. O empresário cadastra as contas de profissionais já vinculadas à empresa; a conta do empresário também pode atender.

Este é um fluxo inicial vinculado ao faturamento. Folgas, jornadas individuais, transferência, comissão, ausência, conclusão, perfil completo de cliente, custos e fotos do protótipo ainda não foram migrados para esse módulo. Não há promessa de toda a demonstração estar conectada.

## Segurança e arquitetura

- Fastify valida JWT com Supabase Auth; Zod rejeita campos extras, valor enviado como suposto pagamento, papel ou identificação arbitrária do cliente.
- A API usa somente cliente Supabase com chave pública e o JWT daquele usuário. Não há `service_role` no frontend ou na rota de faturamento.
- `public.billing_command` é uma RPC transacional com `SECURITY DEFINER`, `search_path` vazio e autorização repetida com `auth.uid()` e vínculos persistidos. Nenhuma permissão é tirada de `user_metadata`.
- Nove tabelas de domínio têm RLS habilitada, sem grants de leitura/escrita direta para `anon` ou `authenticated`. A RPC tem execução revogada de PUBLIC/anon e escopo explícito para cada ação/consulta. Dono do banco e papéis BYPASSRLS continuam sendo administrativos.
- Chaves estrangeiras compostas incluem tenant; IDs de outro estabelecimento não bastam para ler ou alterar dados. Os dados financeiros gerais e os motivos internos de reembolso são do empresário. Cliente consulta seus próprios registros; barbeiro consulta agenda atribuída e mensalidade necessária à baixa do atendimento do dia.
- As regras que precisam ocorrer atomicamente (valor emitido, recebimento, liberação, reembolso e ocupação) ficam na transação PostgreSQL. A interface não toma decisões financeiras. A camada de aplicação define a porta tipada; infraestrutura Supabase e rotas HTTP são separadas.
- O lock por tenant prioriza consistência neste primeiro volume de operação. Antes de alta escala: paginação de históricos, índices/range constraints adicionais, rate limiting e revisão de contenção.

## Testes locais com PostgreSQL descartável

Use um PostgreSQL local com banco **`agendaflex_test`**. `TEST_DATABASE_URL` deve apontar exclusivamente para esse banco em localhost/loopback. As suítes recriam schemas e dados nele; **nunca use um banco de trabalho ou produção**. Há guarda de hostname/nome para impedir uso acidental de `DATABASE_URL` ou projeto remoto.

```sh
# Exemplo: PostgreSQL local configurado pelo desenvolvedor
TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55432/agendaflex_test pnpm test:db
TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55432/agendaflex_test pnpm test:e2e:billing
```

No PowerShell, defina `$env:TEST_DATABASE_URL` e use `pnpm.cmd`. Não rode as duas suítes ao mesmo tempo: ambas usam o banco descartável. O CI fornece PostgreSQL 17 local.

A suíte de navegador atravessa React → Fastify → PostgreSQL e troca entre contas de teste; apenas Auth é uma fixture local. Essa fixture é separada do runtime, exige flag explícita, aceita banco local descartável e escuta somente em loopback. Ela não autentica ninguém no produto e não comprova login ou pagamento em provedores reais.

## Antes de transações reais

Ainda é preciso escolher o provedor e aprovar suas taxas. A integração real deve criar cobranças no servidor, verificar assinatura e consultar o evento no provedor, conferir valor/moeda/conta do estabelecimento, tratar duplicações/reordenação e separar rigorosamente teste/produção. Reembolso deve ser solicitado ao provedor, com estado pendente/confirmado/falha, e só confirmar a devolução após evidência confiável. Não reutilizar a aprovação interna de teste como confirmação de uma transação real.

Checkout, Pix dinâmico, tokenização de cartão, débito automático, chargeback, reembolso parcial, fiscal/contábil e recuperação de assinatura cancelada ficam pendentes. O aplicativo Android/iOS conectado também exige API HTTPS acessível, migração aplicada e contas confirmadas; o APK de prévia já instalado não é atualizado automaticamente. Veja [mobile](mobile.md).
