# Estratégia de autenticação e isolamento

Esta é uma estratégia de implementação futura, não uma alegação de autenticação pronta. As telas atuais não exibem dados privados e a API não oferece endpoints de tenant.

## Identidade

1. Usar Supabase Auth para login, renovação e encerramento de sessão. Nenhum usuário mockado ou flag local concede acesso.
2. No servidor, validar cada access token com o Supabase Auth (`getUser(token)`) ou validação criptográfica via JWKS, com assinatura, emissor, audiência e expiração. Apenas decodificar o JWT é insuficiente.
3. Construir um contexto de requisição imutável a partir do usuário verificado. Nunca aceitar `userId`, `role`, e-mail ou `tenantId` enviados pelo cliente como prova de identidade ou permissão.
4. Responder 401 para identidade ausente/inválida e 403 para falta de permissão, sem revelar recursos de outro tenant.

## Tenant e autorização

`tenants` representa uma empresa; `memberships` associa o ID do Supabase Auth ao tenant com papel owner, manager ou staff. A seleção de tenant por rota, domínio ou cabeçalho é apenas um candidato: o servidor verifica associação ativa e permissão da operação antes de acessar dados. A atribuição de papéis será feita por operações autorizadas no servidor, nunca por metadados editáveis do usuário.

Todo recurso privado futuro terá `tenant_id` obrigatório. Consultas exigirão contexto verificado e filtro por tenant; chaves/constraints compostas deverão impedir referências entre empresas. Não haverá método genérico de consulta privada sem escopo. Um ID válido de recurso ou empresa nunca é autorização.

## Defesa no banco

O schema inicial e a migração habilitam RLS nas duas tabelas. Não existem políticas de acesso nesta fase: acesso de papéis comuns permanece negado. Não há seeds de usuários/empresas. A associação não cria ainda uma FK para `auth.users`, permitindo gerar o schema em PostgreSQL independente; sua integridade e remoção devem ser tratadas antes do fluxo real de Auth.

Para requisições privadas futuras, preferir Supabase com JWT do usuário, chave pública e políticas RLS baseadas em `auth.uid()` e associação verificada. A fábrica de cliente por requisição mantém a sessão separada e não persiste tokens. Implementar políticas com cuidado para evitar recursão em memberships e elevação de privilégios.

A conexão direta Drizzle **não herda** o usuário de Supabase Auth e pode usar um papel que ignora RLS. Nesta fase ela está preparada para migrações/futuros repositórios, não é usada por rotas privadas. Antes de usar SQL direto em requests, definir papel restrito sem BYPASSRLS, transações e contexto seguro; criar testes negativos de isolamento. Nunca assumir que habilitar RLS protege uma conexão de proprietário/superusuário.

## Painel central

Ser dono de uma empresa não concede administração SaaS. Permissões da plataforma serão um mecanismo separado, atribuído de forma controlada no backend, com auditoria. O painel `/saas` atual é somente layout, não possui acesso administrativo.

## Antes de expor dados reais

Implementar e testar login/logout, expiração/revogação, políticas RLS, isolamento entre dois tenants, usuários com múltiplas associações, tentativas de alterar tenant/IDs/papéis e administração central independente. Adicionar autorização por caso de uso, gestão de convites segura, auditoria sem tokens e proteção contra abuso. Definir persistência de sessão e mitigações XSS/CSRF de acordo com o transporte escolhido. Não colocar chaves service-role no navegador nem usar a chave privilegiada para contornar RLS.

## Contrato da experiência Ross (a implementar)

Login por e-mail verificado no Supabase Auth. Um único proprietário ativo por estabelecimento, com um e-mail principal ligado ao seu `auth.users.id`; alterações exigem confirmação do novo e-mail e revogação de sessões conforme política. Cada barbeiro possui identidade própria e associação staff. Clientes possuem identidade customer vinculada ao seu cadastro no tenant; a leitura fica limitada ao próprio cadastro, assinatura e agendamentos. O cliente não recebe membership administrativa. E-mail não substitui o subject verificado nem o tenant na autorização.

Cadastro por owner/staff cria somente registro do cliente e convite seguro. Não cria senha conhecida pela equipe, não confirma endereço de e-mail automaticamente e não concede sessão por CPF/RG. Vincular uma identidade existente exige prova de posse do e-mail/fluxo verificado; nunca aceitar ID ou e-mail arbitrário como autorização. Aplicar unicidade do e-mail normalizado conforme escopo de identidade, minimização de documentos, retenção e controles de acesso aos dados pessoais. A demonstração valida somente formato e usa dados fictícios.

Owner acessa gestão; staff acessa agenda própria, cadastro de clientes e baixa presencial autorizada, sem dashboards financeiros globais. Recebimentos exigirão permissão específica, comprovante/registro de operador, ciclo, valor e chave idempotente; conciliação e estornos terão trilha de auditoria. Reservas antecipadas e direito ao atendimento são estados diferentes: reservar o próximo ciclo não deve marcar fatura como paga nem autorizar o serviço sem a política de renovação satisfeita no servidor. Webhooks autenticados atualizam pagamentos independentemente da preferência escolhida na interface. A prévia de e-mail no HTML não implementa nenhum desses controles.

## Proprietário prestador de serviço e senha do cliente

O papel owner pode também ter perfil profissional vinculado no mesmo tenant e ao mesmo `auth.users.id`. Alternar o modo de interface não cria identidade ou vínculo salarial novo, nem revoga/concede permissões. A agenda pessoal deve ser filtrada pelo profissional associado à identidade verificada. A atribuição/reassociação de profissional exigirá autorização e auditoria; o seletor do protótipo não é prova de identidade. Recebimentos avulsos exigirão operação idempotente transacional, vínculo ao atendimento, valor e operador, protegida de dupla cobrança e duplicidade ao concluir o serviço.

Senha não será armazenada em cadastro de cliente, retornada pela API ou consultável pela equipe. Usar os fluxos de definição/redefinição do Supabase Auth com comprovação de posse do e-mail. O cadastro rápido sem e-mail representa um cliente de balcão sem acesso; posterior associação ao usuário autenticado exige verificação segura. Documentos e contatos de exemplo no HTML são fictícios e não demonstram autorização ou validação de identidade.
