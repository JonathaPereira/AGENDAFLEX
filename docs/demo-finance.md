# Demonstração de planos e finanças

O HTML em `apps/web/public/demo.html` é uma apresentação fictícia. Não contrata planos, não cobra, não autentica e não calcula disponibilidade real. É um arquivo autocontido; seus retratos fictícios gerados por IA estão incorporados e não dependem de sites de fotografias. A identidade visual e o símbolo Vértice também são fictícios.

## Hipóteses editáveis, não regras de todo o mercado

- Cabelo: R$ 150/mês; barba: R$ 100/mês; combo: R$ 250/mês.
- Planos sem limite de usos neste cenário. Sobrancelha é um extra avulso. Cada estabelecimento precisará definir limites, cobertura, vigência e cancelamento antes da implementação comercial.
- Vinte assinaturas consideradas pagas em outubro de 2026, com histórico fictício de atendimentos concluídos. Mensalidade é contada uma vez, mesmo sem uso; cada atendimento coberto tem adicional de R$ 0, sem duplicar receita.
- Serviços avulsos entram na receita somente quando concluídos. Reservas futuras e canceladas não geram repasses nem custos variáveis neste modelo. Não há multas, faltas, estornos ou contas a receber.
- O cliente pode trocar de perfil fictício e simular cabelo, barba ou combo. Não existe comprovação real de pagamento ou direito de uso.

## Duas regras de repasse

**Fixo por atendimento de plano:** corte R$ 25, barba R$ 15, combo R$ 40 e sobrancelha R$ 8. São parâmetros, não uma convenção do mercado. Um atendimento adicional concluído aumenta o repasse e o custo da barbearia.

**Percentual da mensalidade:** 40% da mensalidade dividido igualmente entre os usos concluídos do assinante; cada uso é atribuído ao profissional que atendeu. Sem uso, sem repasse. Com R$ 150 e 40%, o montante é R$ 60: dois usos significam R$ 30 por uso, quatro significam R$ 15. Novas visitas não aumentam esse montante após o primeiro uso; podem redistribuí-lo entre profissionais. Valores são provisórios até fechar o período.

**Avulsos:** regra separada, inicialmente 45% do preço do serviço.

A demo aplica uma regra única à equipe e recalcula o mês ao alterá-la. O produto real precisará de acordos por profissional, regras versionadas, política de arredondamento em centavos, vigência e fechamento, sem recalcular períodos já liquidados. Valores da demo usam números JavaScript e formatação monetária, sem pretensão de livro contábil.

## Receita média não é lucro

João paga R$ 150 e usa duas vezes: R$ 75 por uso. Antônio paga R$ 150 e usa quatro vezes: R$ 37,50. No modelo fixo inicial, considerando R$ 25 por corte, R$ 5 de insumos/café por visita e 6% de taxas/tributos sobre a receita:

| Assinante       | Receita | Repasse | Insumos/café | Taxas/tributos | Contribuição antes dos fixos |
| --------------- | ------- | ------- | ------------ | -------------- | ---------------------------- |
| João, 2 usos    | R$ 150  | R$ 50   | R$ 10        | R$ 9           | R$ 81                        |
| Antônio, 4 usos | R$ 150  | R$ 100  | R$ 20        | R$ 9           | R$ 21                        |

Na regra percentual de 40%, a contribuição seria R$ 71 e R$ 61, respectivamente. O simulador permite comparar de zero a doze usos sem alterar agendamentos.

## Dashboard do empresário

Resultado operacional estimado = mensalidades pagas + avulsos concluídos − repasses − insumos/café − taxas/tributos − custos fixos.

Os fixos incluem aluguel, energia, água, internet, software, depreciação de maquinário, pró-labore e outros custos. Energia e água foram tratadas como orçamento mensal fixo para simplificar; a classificação depende da operação real. Os variáveis incluem insumos por serviço, café/descartáveis por visita e taxas/tributos percentuais. Esses percentuais não representam uma recomendação tributária.

A tabela por assinatura mostra contribuição antes dos fixos e resultado estimado após rateio dos fixos proporcional à participação da mensalidade na receita total. Esse rateio é uma escolha gerencial explícita, não medição de um custo individual. Extras avulsos entram no consolidado, não na tabela de uso do plano.

O cenário inicial tem receita de R$ 3.470 e resultado negativo estimado de R$ 690,70. Reduzir aluguel de R$ 900 para R$ 800 melhora o resultado em R$ 100. Não se trata de falha: o modelo não garante lucro e torna visível o efeito de volume e custos. Resultado estimado não é saldo de caixa ou valor disponível para retirada.

## Visão do profissional e limites de acesso

O barbeiro vê seus atendimentos, repasses totais e unitários estimados, regra de remuneração e valores a liquidar. Ele não recebe os menus, dashboard ou formulário de custos da empresa nessa visão.

Essa separação é **somente de interface**: todo o HTML contém dados fictícios acessíveis a quem o baixar. A proteção real exige Supabase Auth, autorização no servidor e RLS. Nunca colocar números financeiros reais neste arquivo. Os retratos não representam funcionários reais. Recarregar ou reiniciar a página restaura dados e parâmetros originais.

## Acessibilidade e movimento

Menus agrupados por contexto, foco visível, controles nativos e transições curtas. `prefers-reduced-motion` desativa animações. As fotos acompanham seleção, agenda, equipe, ganhos e páginas financeiras, com nomes acessíveis e uma faixa de equipe comum às visões.
