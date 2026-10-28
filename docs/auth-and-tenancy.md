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
