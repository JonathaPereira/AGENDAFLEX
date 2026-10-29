# Ross Barbearia — experiência de demonstração

A marca e a referência de logo foram fornecidas pelo usuário. **Pessoas, clientes, serviços, preços, salários, receitas e históricos são fictícios**, inclusive o empresário usado no exemplo. Não são informações comerciais reais da Ross.

O arquivo `apps/web/public/demo.html` contém o site de demonstração, abre sozinho e também é servido em `/demo.html` pelo Vite. Logo e retratos estão incorporados; nenhuma API, fonte externa ou Supabase é necessária. A logo do anexo foi preparada para web com auxílio de IA, removendo a moldura branca e preservando a referência visual. É uma adaptação raster, não o arquivo vetorial original.

## Identidade e navegação

Tema inicial escuro, carvão/preto, laranja da marca e tons de madeira/couro. Cabeçalho com logo, navegação discreta e botões compactos. Há alternância para tema claro, foco de teclado, movimento reduzido, tabelas com rolagem horizontal e formulários/listas que se reorganizam em telas pequenas.

A saudação do cliente é curta e os serviços aparecem antes da escolha de barbeiro e horário. A seleção de serviço é seguida por **Avulso** ou **Usar meu plano**, com legenda. A cobertura e a validade são verificadas novamente ao confirmar a reserva simulada. Serviço novo começa como avulso.

## Janela de quinze dias e faturamento

A referência fixa é 28/10/2026 às 11h. O calendário mostra **28/10 a 11/11**, inclusive: quinze dias, atravessando o mês. A jornada inicial é 09h–21h, pausa 12h–14h, sessões de 60 minutos. Configurações do questionário continuam alterando dias, pausas e duração-base.

Horário passado não volta a ficar disponível por causa de cancelamento. Reservas são verificadas pelo intervalo de duração do serviço: sem cruzar almoço, fechamento, folga ou outra reserva do mesmo profissional. A grade de inícios segue os slots-base da jornada; o protótipo não otimiza automaticamente intervalos restantes quando um serviço tem duração menor.

**Planos mensais** mostra o plano do perfil selecionado, validade, ciclo de referência 01/10–31/10 e próximo ciclo previsto 01/11–30/11. Uma assinatura em dia permite reservar antecipadamente em novembro dentro da janela de quinze dias, mesmo que a validade confirmada seja 31/10. A reserva fica marcada como **Renovação pendente** até a baixa do próximo ciclo. Isso não confirma receita nem autoriza iniciar serviço sem renovação. A cobrança de novembro fica prevista para **28/10**, antecipando o início do mês; depois da renovação, a próxima data é **28/11** para dezembro. Perfis já vencidos na data de referência permanecem bloqueados conforme a política fictícia da demo.

Não existe gateway, renovação ou confirmação automática de pagamento ativa. A integração futura deverá receber eventos autenticados/idempotentes do provedor e validar acesso no servidor. Os controles **Simular regularização/vencimento** continuam explicitamente fictícios.

## Equipe, catálogo e gastos

- **Minha equipe:** adicionar até vinte profissionais e remover mediante confirmação. Um profissional com reservas ativas não pode ser removido até os compromissos serem resolvidos. Se há registros, a remoção arquiva o profissional e preserva histórico e custo salarial do período, evitando apagar despesas já assumidas. Um cadastro novo sem nenhum registro é desfeito integralmente, inclusive seu salário estimado. O salário não é proporcionalizado automaticamente pela data de saída nesta demo.
- **Configurar negócio → Equipe:** botões explícitos de adicionar/remover no rascunho. Gerar um novo cenário substitui os dados sintéticos, como já indicado na revisão.
- **Serviços:** cadastrar serviço avulso com nome, preço, duração, insumos e referência de comissão fixa. Avulsos usam a porcentagem de comissão de avulsos; o campo fixo não é somado a essa porcentagem. O botão com lápis permite editar nome e duração dos serviços existentes. Reservas antigas preservam a duração já reservada. O questionário também permite adicionar serviços. As etapas numeradas do questionário são clicáveis e preservam os dados válidos da etapa atual ao navegar diretamente para outra.
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

## Cadastro, perfis por e-mail e recebimentos

Empresário e barbeiro têm **Cadastrar cliente**, com nome, CPF, RG, endereço, celular e e-mail. E-mail normalizado e CPF não podem se repetir nos cadastros da sessão; o e-mail também não pode conflitar com os perfis da equipe/proprietário. As validações de documentos são somente de formato; não há consulta ou verificação de identidade. Use dados fictícios. Campos não são salvos no navegador nem enviados a serviços externos. Plano inicial é opcional e começa pendente, sem conceder pagamento fictício automaticamente.

**Simular login por e-mail** abre a prévia do perfil: `proprietario@ross.example` (único empresário), `barbeiro2@ross.example` até `barbeiro5@ross.example` (o profissional 1 é o empresário), `joao@cliente.ross.example`, `carlos@cliente.ross.example`, ou um novo e-mail cadastrado. A prévia esconde o seletor de papéis e o seletor de outros profissionais/clientes. Cliente vê sua área, barbeiro sua agenda/ganhos e as operações de cadastro e recebimento, empresário a gestão completa. **Não é autenticação**, nem proteção de dados: não usa senha, Auth ou servidor. Sair retorna ao seletor livre da demonstração.

Em **Planos mensais**, o cliente escolhe crédito, débito, Pix ou dinheiro. Isso altera a preferência, sem confirmar recebimento. Crédito mostra o dia previsto de débito no cartão; o vencimento da fatura depende do emissor. Débito é presencial, não um mandato automático. Não há captura de cartão ou CVV.

Empresário usa **Recebimentos e renovações**; barbeiro usa **Receber no salão**. Busque o e-mail do assinante e confirme valor, ciclo e forma recebida. Voltar não altera nada. Inadimplente recebe baixa de outubro primeiro; assinante em dia pode antecipar novembro. O mesmo ciclo não recebe baixa duplicada. A confirmação registra profissional/papel, valor, meio e ciclo, atualiza a validade e elimina a pendência das reservas cobertas. Cartões e Pix também são simulações manuais até a futura integração.

O dashboard do empresário separa quantidade e valor recebido em outubro por crédito, débito, Pix e dinheiro. Os recebidos iniciais são registros sintéticos distribuídos entre os meios; mudar a preferência de pagamento não reescreve esse histórico. Renovação de novembro fica registrada separadamente e não duplica receita no resultado de outubro. Regerar o cenário apaga cadastros e baixas manuais; recarregar também. Falhas futuras de cobrança, notificações, prazo de tolerância e liberação automática de reservas dependerão do backend e de uma política comercial antes do produto real.

## Empresário que também corta e atendimento avulso

O proprietário fictício inicial agora é Rafael Lima, um dos cinco profissionais existentes. A conta `proprietario@ross.example` alterna entre **Modo gestão** e **Modo barbeiro**. Gestão mantém os relatórios; barbeiro mostra a agenda, resumo e ganhos do profissional vinculado, com o seletor de outros barbeiros oculto. Vincule o proprietário a uma entrada da equipe em **Meu profissional na equipe**: não se cria outro funcionário, salário ou repasse. Um profissional vinculado ao proprietário deve ser desvinculado antes de removê-lo. O proprietário tem um único e-mail de acesso; sua entrada profissional não cria outro login de barbeiro. A associação é apenas ilustrativa no HTML; no produto será validada e persistida pelo servidor.

Todos os clientes de exemplo, inclusive avulsos, possuem telefone, e-mail, CPF/RG e endereço sintéticos. Telefones com DDD 00 e documentos de demonstração não representam pessoas reais nem validam identidade. Cadastros digitados prevalecem sobre os exemplos. O perfil exibe **Senha: Não consultável** e uma redefinição simulada, sem revelar, gerar ou armazenar senha e sem enviar e-mail. **Completar cadastro** permite preencher contatos/documentos faltantes.

**Atendimento avulso** aparece para empresário e barbeiro. Busque por nome, celular ou e-mail e selecione um cliente existente, ou use cadastro rápido com nome e celular; e-mail é opcional nessa entrada, sendo necessário completar depois para a prévia de acesso. A busca aceita nome, celular ou e-mail; celular/e-mail duplicado no cadastro rápido direciona ao registro existente. Não se exige digitar novamente CPF/RG/endereço no balcão. Escolha serviço, data disponível em quinze dias, horário e meio de pagamento, revise e confirme. Cancelar a revisão não cadastra cliente nem lança pagamento. A disponibilidade é reconferida na confirmação; a agenda inicial lotada não permite encaixe silencioso.

O recebimento cria uma única reserva confirmada e um único registro financeiro ligado ao cliente/profissional/serviço. A conclusão é separada: só serviço concluído gera comissão e insumos. Os recebimentos avulsos desta sessão entram uma vez no financeiro; concluir depois não soma novamente o valor já recebido. O preço cobrado é preservado no registro. Profissionais veem seus recebimentos, enquanto o modo de gestão vê todos.

Na agenda individual, **Receber avulso** permite dar baixa diretamente em um atendimento existente, inclusive concluído, sem criar outra reserva ou duplicar receita já considerada no histórico fictício. Serviços de plano não oferecem esse botão. Um atendimento pago passa a mostrar **Pagamento confirmado** e não oferece nova baixa. Ausência/cancelamento não gera estorno automático: qualquer devolução precisa de política e fluxo futuros. Gateway, recibo fiscal e conciliação continuam fora desta demonstração.
