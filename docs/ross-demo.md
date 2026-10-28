# Ross Barbearia — experiência de demonstração

A marca e a referência de logo foram fornecidas pelo usuário. **Pessoas, clientes, serviços, preços, salários, receitas e históricos são fictícios**, inclusive o empresário usado no exemplo. Não são informações comerciais reais da Ross.

O arquivo `apps/web/public/demo.html` contém o site de demonstração, abre sozinho e também é servido em `/demo.html` pelo Vite. Logo e retratos estão incorporados; nenhuma API, fonte externa ou Supabase é necessária. A logo do anexo foi preparada para web com auxílio de IA, removendo a moldura branca e preservando a referência visual. É uma adaptação raster, não o arquivo vetorial original.

## Identidade e navegação

Tema inicial escuro, carvão/preto, laranja da marca e tons de madeira/couro. Cabeçalho com logo, navegação discreta e botões compactos. Há alternância para tema claro, foco de teclado, movimento reduzido, tabelas com rolagem horizontal e formulários/listas que se reorganizam em telas pequenas.

A saudação do cliente é curta e os serviços aparecem antes da escolha de barbeiro e horário. A seleção de serviço é seguida por **Avulso** ou **Usar meu plano**, com legenda. A cobertura e a validade são verificadas novamente ao confirmar a reserva simulada. Serviço novo começa como avulso.

## Janela de quinze dias e faturamento

A referência fixa é 28/10/2026 às 11h. O calendário mostra **28/10 a 11/11**, inclusive: quinze dias, atravessando o mês. A jornada inicial é 09h–21h, pausa 12h–14h, sessões de 60 minutos. Configurações do questionário continuam alterando dias, pausas e duração-base.

Horário passado não volta a ficar disponível por causa de cancelamento. Reservas são verificadas pelo intervalo de duração do serviço: sem cruzar almoço, fechamento, folga ou outra reserva do mesmo profissional. A grade de inícios segue os slots-base da jornada; o protótipo não otimiza automaticamente intervalos restantes quando um serviço tem duração menor.

**Planos mensais** mostra o plano do perfil selecionado, validade, ciclo de referência 01/10–31/10 e próximo ciclo previsto 01/11–30/11. Uma assinatura válida só até 31/10 não autoriza serviço de plano em novembro. Um perfil em dia pode optar por serviço avulso em novembro. Perfis já vencidos na data de referência permanecem bloqueados conforme a política fictícia da demo.

Não existe gateway, renovação ou confirmação automática de pagamento ativa. A integração futura deverá receber eventos autenticados/idempotentes do provedor e validar acesso no servidor. Os controles **Simular regularização/vencimento** continuam explicitamente fictícios.

## Equipe, catálogo e gastos

- **Minha equipe:** adicionar até vinte profissionais e remover mediante confirmação. Um profissional com reservas ativas não pode ser removido até os compromissos serem resolvidos. Se há registros, a remoção arquiva o profissional e preserva histórico e custo salarial do período, evitando apagar despesas já assumidas. Um cadastro novo sem nenhum registro é desfeito integralmente, inclusive seu salário estimado. O salário não é proporcionalizado automaticamente pela data de saída nesta demo.
- **Configurar negócio → Equipe:** botões explícitos de adicionar/remover no rascunho. Gerar um novo cenário substitui os dados sintéticos, como já indicado na revisão.
- **Serviços:** cadastrar serviço avulso com nome, preço, duração, insumos e referência de comissão fixa. Avulsos usam a porcentagem de comissão de avulsos; o campo fixo não é somado a essa porcentagem. O questionário também permite adicionar serviços.
- **Custos e repasses / Gastos estimados do questionário:** adicionar/remover gastos nomeados. Fixo é mensal; variável é por atendimento concluído, além dos insumos específicos e do café já cadastrados. Os cálculos não somam novamente um gasto na mesma categoria. Duplicidades semânticas entre nomes diferentes ainda são responsabilidade de quem configura.

Novos retratos reais não foram fornecidos; os cinco retratos fictícios são reutilizados nas adições. Nomes digitados são escapados antes de compor a interface. Há limites de quantidade e valores para manter a simulação navegável.

## Folgas e transferências

O empresário registra profissional, primeiro/último dia e observação em **Folgas e transferências**. A folga bloqueia imediatamente novas reservas para aquele profissional, mantendo os demais disponíveis.

Reservas existentes ficam na lista **precisam de atenção**. A transferência exige escolha explícita e confirmação; só são listados profissionais disponíveis no mesmo intervalo. A disponibilidade é conferida novamente ao confirmar. Sem alternativa livre, a reserva fica intacta e a interface informa o motivo. Cliente, serviço, modalidade e horário permanecem iguais; muda apenas o barbeiro. O barbeiro também pode transferir suas próprias reservas na visão individual.

A demo não envia notificações ao cliente, não altera o horário da reserva e não resolve concorrência entre navegadores. Essas responsabilidades exigirão implementação no servidor.

## Ausência e vaga liberada

Cada barbeiro tem sua lista filtrada e seus ganhos. O seletor de profissional é apenas um recurso de demonstração de diferentes sessões, não autorização real.

**Cliente não vem/veio** abre confirmação. **Manter atendimento** não altera nada. Confirmar muda para **Não compareceu**, tira a reserva do conjunto ativo e não gera comissão ou receita de serviço. Mensalidades já recebidas não são estornadas automaticamente. O horário é liberado apenas se ainda estiver no futuro/instante de referência e respeitar jornada, duração, folga e outras reservas. Reservas de dias futuros não podem ser iniciadas como atendimento do dia atual.

## Clientes e recorrência automática

**Clientes e histórico** permite buscar e abrir o perfil, com atendimentos concluídos em 2026 e próximas reservas. O conjunto de exemplo está concentrado em outubro; não se inventou uma história real de janeiro a setembro. Há paginação, modalidade e situação da assinatura.

Volume de serviços de plano e repetições após a primeira visita são derivados dos registros concluídos. A média por assinatura cadastrada considera os contratos cadastrados no plano, incluindo os sem uso. Ao concluir um atendimento, esses indicadores e os repasses são recalculados. A pergunta manual de visitas estimadas foi removida do questionário; a comparação de demanda usa a frequência observada no histórico fictício atual. Essa extrapolação não é previsão garantida.

## Limites

Tudo vive somente na memória da aba e é reiniciado ao recarregar. Gerar novamente o cenário também limpa folgas e ações operacionais antigas. Os controles de papéis representam interfaces, não autenticação; dados privados reais nunca devem ser colocados neste HTML. Auth, RLS, banco, integração de pagamentos, auditoria persistida, notificações e concorrência continuam pendentes para implementação de produto.
