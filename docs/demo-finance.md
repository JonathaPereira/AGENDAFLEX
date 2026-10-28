# Demonstração de planos, assinaturas e finanças

O HTML `apps/web/public/demo.html` é autocontido e usa somente dados fictícios. Pode ser aberto sozinho ou em `/demo.html` no Vite. Não cobra, contrata planos, autentica ou reserva horários reais. Retratos gerados por IA e marca Vértice são fictícios e estão incorporados no arquivo.

## Cenário inicial editável

- Três planos: cabelo, barba e combo. Cada um começa com **100 clientes e mensalidade de R$ 120**: 300 contratos e ticket médio de R$ 120. Estes preços são parâmetros de simulação, não uma recomendação comercial. O combo não soma automaticamente os outros planos.
- Em cada plano, 90 assinaturas estão em dia e 10 estão vencidas. Receita potencial de planos: R$ 36.000; considerada recebida: R$ 32.400; vencida/não recebida: R$ 3.600.
- O empresário pode editar clientes, vencidas e mensalidade de cada plano. Vencidas não podem superar clientes; preços vão de R$ 1 a R$ 10.000 e quantidade de zero a 1.000 por plano.
- Aplicar um novo cenário regenera os clientes e o histórico fictício e apaga as reservas e regularizações manuais da aba. Reiniciar demo restaura os parâmetros iniciais. Nenhum dado é salvo em servidor.
- O histórico representa usos concluídos no mês, limitado à capacidade física dos dias simulados. Se a demanda exceder a capacidade, não se inventam atendimentos sobrepostos para absorvê-la.
- Planos sem limite de uso neste exemplo, exceto a capacidade da agenda. Sobrancelha é extra avulso. O produto real precisará de limites, carência, cobertura, estornos e regras de cancelamento definidos por estabelecimento.

## Situação de pagamento e bloqueio

A referência é **28/10/2026**, sem depender do relógio do computador. Em dia significa válido até 31/10; vencido significa validade até 30/09. A demo usa validade atual como indicador simplificado de recebimento do mês: não existe conciliação contábil, data de pagamento ou gateway.

O perfil de demonstração inclui Hugo Figueiredo, com assinatura vencida. Não é possível confirmar novos agendamentos nesse perfil, inclusive por chamada direta ao manipulador de confirmação. A validade também precisa cobrir a data escolhida. O empresário pode buscar Hugo e usar **Simular regularização**; isso libera a reserva e atualiza os indicadores, sem processar pagamento. Simular vencimento faz o inverso. Reservas existentes não são automaticamente canceladas; essa política exigirá definição no produto.

Trocar o perfil no HTML não autentica ninguém. No produto real, pagamento confirmado pelo provedor, direito de uso e autorização deverão ser verificados no servidor, com tratamento de eventos idempotentes. Não colocar dados reais neste protótipo.

## Jornada e duração

A pedido do usuário, foi adotada a opção **09h–21h**, com almoço **12h–14h** e **10 sessões de uma hora** por profissional:

`09h, 10h, 11h, 14h, 15h, 16h, 17h, 18h, 19h e 20h`.

O último atendimento termina às 21h. Todos os serviços ocupam uma sessão de 60 minutos nesta versão. Os cinco barbeiros têm 50 atendimentos fictícios no dia 28. Dias 29 a 31 permitem experimentar reservas, respeitando slots ocupados. Não há atendimento durante o almoço nem sobreposição para o mesmo profissional. O histórico do mês também usa esses slots, de segunda a sábado. Isso é validação local do protótipo, não um motor de disponibilidade em produção.

A jornada anterior solicitada, 09h–20h com duas horas de almoço, comportaria apenas nove sessões; ela foi substituída pela opção escolhida pelo usuário.

## Duas regras de comissão

**Fixa por atendimento de plano:** corte R$ 25, barba R$ 15, combo R$ 40, sobrancelha R$ 8. Cada atendimento concluído adiciona o valor correspondente. São parâmetros editáveis, não regras do setor.

**Percentual da mensalidade:** inicialmente 40%, dividido igualmente entre usos concluídos do assinante e atribuído a quem atendeu. Com mensalidade de R$ 120, o montante é R$ 48: duas visitas dão R$ 24 por uso; quatro dão R$ 12. Sem uso, sem repasse. Depois do primeiro uso, o total reservado não cresce com cada visita; a distribuição e os valores unitários podem mudar até fechar o mês.

**Avulsos:** regra separada, inicialmente 45% do preço do serviço concluído. Uma reserva futura ou cancelada não gera comissão.

A regra vale para toda a equipe na demo e recalcula o mês ao mudar. O produto exigirá acordos por profissional, vigência, arredondamento em centavos e fechamentos imutáveis. A demo usa números JavaScript e exibição monetária, sem livro contábil ou pagamentos reais.

## Salário base mais comissão

O empresário escolhe **Somente comissão** ou **Salário base + comissão** em Custos e repasses. O segundo é o padrão, com R$ 1.500 por barbeiro, editável individualmente.

- Custo mensal de salários = soma dos cinco salários, uma única vez. Não se multiplica por dias, serviços ou clientes.
- Remuneração estimada do barbeiro = seu salário base + suas comissões de serviços concluídos.
- No modo somente comissão, o salário considerado é zero, embora o campo mantenha o valor para uma futura troca de modo.
- A agenda diária mostra comissões do dia; o salário é exibido no resumo mensal, evitando repeti-lo a cada atendimento.

Encargos trabalhistas, férias e benefícios não foram modelados. Os valores não são folha de pagamento nem cálculo trabalhista. A classificação legal da relação profissional não é definida pela demonstração.

## Entender os números

Os botões **?** abrem explicações flutuantes por mouse, foco de teclado ou toque. Escape fecha a explicação. Há textos para receitas, custos fixos, insumos, taxas, comissões, salário e situação de assinatura.

Receita recebida = mensalidades em dia + serviços avulsos concluídos. Mensalidades vencidas ficam fora; um serviço coberto tem R$ 0 adicional e não soma o preço de tabela de novo à receita.

Contribuição por assinatura = mensalidade recebida − comissões − insumos/café − taxas/tributos. O resultado individual estimado desconta ainda um rateio dos custos fixos e salários proporcional à receita. É uma escolha gerencial, não medição exata do custo de cada cliente. Extras avulsos entram no consolidado, não no uso do plano.

No plano de R$ 120, João usa duas vezes e Antônio quatro: receita média de R$ 60 e R$ 30 por uso. Com repasse fixo de R$ 25, insumos/café de R$ 5 por visita e 6% de taxas/tributos, a contribuição é R$ 52,80 e **−R$ 7,20**, antes dos fixos e salários. Na regra percentual de 40%, seria R$ 54,80 e R$ 44,80. O simulador acompanha o preço editável do plano de cabelo.

Resultado da empresa = receita recebida − comissões − insumos/café − taxas/tributos − despesas fixas − salários base.

O cenário inicial gera R$ 32.660 recebidos, incluindo R$ 260 em avulsos concluídos, e resultado estimado de **−R$ 4.891,60**. Aumentar o salário de Rafael em R$ 300 reduz o resultado em R$ 300; desativar os cinco salários iniciais melhora-o em R$ 7.500. Não há garantia de lucro, e os parâmetros podem ser ajustados pelo empresário.

Aluguel, energia, água, internet, software, maquinário/depreciação, pró-labore e outros gastos são orçados mensalmente. Insumos e café variam por serviço concluído. Taxas e tributos são estimativas percentuais sobre o recebido, sem orientação tributária. Resultado não significa saldo bancário ou valor disponível para retirada.

## Acesso, tema e navegação

O modo escuro mantém a escolha ao navegar entre visões durante a sessão. Navegação agrupada, tabelas paginadas de assinantes e atendimentos, foco visível e suporte a `prefers-reduced-motion`. As fotografias têm nomes acessíveis.

O barbeiro vê apenas sua remuneração na interface; cliente e profissional não têm menus financeiros do dono. **Isso não protege informações reais:** o arquivo inteiro contém dados fictícios acessíveis a quem o baixar. Proteção efetiva depende de autenticação, autorização no servidor e RLS na etapa seguinte.

## Assistente de configuração por perguntas

O botão **Monte sua barbearia** e o menu **Empresário → Configurar negócio** abrem um questionário de oito etapas:

1. Negócio: nome, empresário, cidade e paleta visual.
2. Equipe: de 1 a 10 profissionais com nomes editáveis.
3. Remuneração: somente comissão ou base + comissão, salário individual, repasses fixos, percentual do plano e comissão de avulsos.
4. Gastos estimados: uma etapa própria para despesas fixas, insumos, café, taxas e tributos.
5. Planos: nome, preço, quantidade de clientes, vencidas e frequência mensal estimada por assinante. Zero clientes remove o plano do volume simulado.
6. Serviços: preços dos quatro serviços avulsos.
7. Jornada: abertura, fechamento, pausa opcional, duração uniforme de sessão, dias da semana e percentual de preenchimento fictício da agenda do dia.
8. Revisão: salários, custos fixos, receita prevista/recebida, capacidade e demanda antes de aplicar.

Voltar preserva respostas válidas; sair sem aplicar descarta o rascunho e mantém o cenário atual. Só **Gerar meu dashboard** muda a demonstração. As respostas atualizam efetivamente os clientes, os valores dos planos, o catálogo, a equipe, os salários, a identidade visual, as sessões e os cálculos financeiros. **Revisar respostas** abre o assistente preenchido com a configuração aplicada. Recarregar ou reiniciar volta ao cenário base; nada é salvo no servidor.

As despesas e os salários não são receitas. O resumo não promete lucro: mostra a conta resultante das regras e do histórico sintético gerado. A capacidade de outubro considera os dias da semana marcados, o número de profissionais e as sessões que cabem antes/depois do almoço. Quando a demanda mensal de assinantes em dia ultrapassa essa capacidade, aparece um aviso; a geração de histórico não cria horários sobrepostos para absorver o excesso. O histórico financeiro continua limitado aos dias até a referência 28/10, enquanto a capacidade da revisão considera o mês inteiro.

O preenchimento percentual controla somente a agenda sintética do dia 28; não é uma taxa histórica comprovada. A frequência dos planos controla a geração de visitas do mês e não muda o direito real de um assinante. Todos os serviços usam a duração uniforme de sessão escolhida. O protótipo não resolve feriados, férias, pausas individuais ou distribuição real de demanda. Os cinco retratos são reutilizados quando há mais de cinco profissionais.

Caso validado: equipe de três pessoas, salários de R$ 1.000/R$ 1.200/R$ 1.300, planos de 10/5/8 clientes, 1/0/2 vencidos e preços de R$ 100/R$ 50/R$ 180. O resumo mostrou R$ 2.230 em mensalidades em dia e R$ 3.500 em salários. A jornada 10h–18h com pausa 12h–14h gerou seis sessões por profissional, e 50% de preenchimento gerou três reservas por profissional no dia.
