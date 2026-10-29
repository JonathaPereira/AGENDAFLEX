# Etapa atual: Supabase e login Ross

A tela React `/login` usa a logo Ross, e-mail/senha, criação de conta, confirmação de e-mail, recuperação, troca de senha e saída via Supabase Auth. A API `/me` consulta Auth com `getUser(token)` e lê somente os vínculos do usuário verificado. Sem projeto configurado, o login fica desabilitado. O fluxo real precisa ser validado após conectar seu projeto.

O HTML `/demo.html` continua sendo um protótipo independente. Criar sessão real não transforma seus cadastros, agendamentos ou pagamentos fictícios em dados de banco. `/conta` informa essa separação; `/painel` exige vínculo verificado e `/saas` permanece bloqueado até haver autorização específica da plataforma.

## 1. Criar somente o projeto de desenvolvimento

1. Entre em <https://supabase.com/dashboard> e escolha **New project**.
2. Crie/selecione uma organização **Free**, se necessário.
3. Nome: `agendaflex-dev`. Selecione região São Paulo, se disponível.
4. Gere e guarde a senha do banco em seu gerenciador. Ela não será colocada no frontend, GitHub ou chat.
5. Confirme o plano gratuito. Aguarde o painel do projeto ficar pronto.

Não usar dados reais de clientes nesta fase. Não foi contratado serviço pago nem criado projeto de produção.

## 2. Conectar o projeto ao código

No painel, localize **Connect** ou **Settings → API / API Keys**. Copie a URL do projeto e a chave pública **publishable** (`sb_publishable_...`) ou a chave legada **anon**. As duas informações são públicas; a proteção dos dados vem de Auth e RLS. Não use `sb_secret_...`, `service_role`, JWT de sessão, senha de usuário ou senha do banco.

Crie `.env` na raiz do repositório, copiando `.env.example`, e preencha:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

Frontend e API precisam apontar para o mesmo projeto. `.env` é ignorado pelo Git. Nenhuma chave secreta é necessária para o login. Se a API rodar neste ambiente de nuvem com rede restrita, o host exato do projeto também precisará ser autorizado na configuração de rede; isso será verificado quando a URL estiver disponível. O código rejeita chaves `sb_secret_` e JWTs com papel diferente de anon nestas configurações, inclusive antes de gerar o build do frontend. Chaves públicas embutidas no build são esperadas; nunca embutir privilégios de serviço.

## 3. Configurar os links de acesso

Em **Authentication**, mantenha o provedor **Email** habilitado, confirmação de e-mail ligada e configure a política de senha com pelo menos 12 caracteres.

Em **URL Configuration**, para desenvolvimento no seu computador:

- **Site URL:** `http://localhost:5173`.
- **Redirect URLs:** `http://localhost:5173/auth/callback` e `http://localhost:5173/redefinir-senha`.

Se abrir o site com outro endereço, use esse endereço exato e as mesmas rotas. `localhost` é o computador em que o servidor está rodando; não é um endereço público para outras pessoas. Em uma prévia na nuvem, configure a URL HTTPS da prévia e ajuste `WEB_ORIGIN` e `VITE_API_URL`. Evite curingas amplos e não cadastre domínios de terceiros.

O fluxo usa PKCE. Inicie o cadastro/recuperação e abra o e-mail no mesmo navegador e origem. O envio padrão do Supabase tem limites e restrições; use seu próprio e-mail autorizado para o primeiro teste. A liberação de e-mails públicos/SMTP será tratada antes de abrir o produto para clientes. Esta etapa não configura nem contrata serviço de e-mail.

## 4. Criar as tabelas e políticas do projeto vazio

No **SQL Editor** do projeto `agendaflex-dev`, execute uma única vez o conteúdo de [setup-dev.sql](../database/supabase/setup-dev.sql). O arquivo aplica as migrações versionadas e registra seus hashes no journal do Drizzle. Não cria usuários ou atribui proprietário.

Esse setup é somente para um projeto de desenvolvimento vazio. Se já houver migrações/tabelas, não apague nada: use migrações incrementais e revise a situação. Uma segunda execução é recusada e a transação é revertida.

Para mudanças futuras, use `pnpm db:generate` e `pnpm db:migrate` com `DATABASE_URL` configurada localmente de forma privada; nunca envie a senha da conexão pelo chat. `pnpm db:setup-sql` regenera o arquivo inicial a partir das migrações; CI confere que está atualizado. Não misturar SQL manual sem journal com migrações rastreadas.

As políticas permitem ao usuário autenticado ler seus próprios vínculos e somente os estabelecimentos aos quais pertence. Não há políticas de escrita para o navegador, concessão de papel por formulário ou acesso anônimo. Existe índice que limita a um proprietário por estabelecimento. Estas políticas ainda exigem testes reais de isolamento no Supabase antes de disponibilizar dados operacionais.

## 5. Iniciar o site e criar sua conta

É preciso usar o projeto React/API, não abrir `demo.html` com dois cliques. No computador com Node.js 24 e pnpm 10.11.0, na pasta baixada do GitHub:

```sh
pnpm install
pnpm dev
```

Abra <http://localhost:5173/login>, escolha **Criar conta**, use seu e-mail e uma senha pessoal de pelo menos 12 caracteres, confirme o e-mail e entre. O navegador chama Supabase Auth; a API verifica a identidade sem receber sua senha. A senha não é armazenada em tabelas do AgendaFlex nem consultável pelo estabelecimento.

A conta começa sem poder administrar uma barbearia. `/conta` mostra o e-mail confirmado e o estado de vinculação. Logout e expiração limpam os dados de conta na interface; cada requisição privada deve continuar sendo validada no servidor.

## 6. Vincular o primeiro empresário

Somente no SQL Editor, abra [link-owner.sql](../database/supabase/link-owner.sql), substitua `SUBSTITUA_PELO_SEU_EMAIL` pelo e-mail da sua conta já confirmada e execute. O script busca o usuário no Auth, cria a Ross e atribui o vínculo owner. Ele recusa trocar um proprietário existente.

Atualize `/conta` ou entre novamente. Deve aparecer Ross Barbearia / Empresário e o acesso ao painel. A conta continua usando o mesmo e-mail; o vínculo de profissional e o modo barbeiro serão persistidos em uma etapa seguinte. Clientes cadastrados pelo formulário público nunca recebem owner automaticamente. Convites/atribuições de barbeiros ainda serão implementados; não use e-mails fictícios do HTML para autenticação.

## 7. Conferir juntos antes de avançar

Com o projeto conectado, verificar de verdade: criar/confirmar conta, entrar, restaurar sessão, sair, senha errada, recuperação, vínculo owner, outra conta sem gestão e tentativa de ler outro tenant. Até isso ser executado, os testes locais com respostas simuladas não comprovam login real, envio de e-mail ou RLS no seu projeto.

## Próximas etapas, uma por vez

1. Migrar as telas aprovadas do HTML para componentes React e persistir os dados/agenda com autorização por tenant. O login desta entrega é a entrada para essa migração, não um motor de agendamento pronto.
2. Preparar a experiência mobile e empacotamento Android/iOS com Capacitor, compartilhando a API. A página de login já é responsiva; ainda não existe APK/IPA, publicação ou integração nativa nesta etapa.
3. Fotos de perfil de empresário/barbeiro via Supabase Storage, com validação de arquivo e políticas que permitam alterar somente a própria foto.
4. Selecionar/configurar provedor de pagamentos em sandbox. Confirmar suporte efetivo a Pix, crédito e débito online; débito presencial em maquininha não equivale a débito online no app. Recebimento real exigirá webhooks verificados, idempotência, conciliação e políticas de renovação. Nenhum provedor foi contratado ou habilitado.

Não publicar a demo como painel de dados reais. A distribuição de produção deverá remover/separar o protótipo e passar pelas verificações de acesso, e-mail e banco antes do lançamento.

## Atualização: faturamento e agendamentos de teste

Para o projeto que já recebeu as duas migrações iniciais, execute somente `database/supabase/billing-update.sql`, inteiro, no SQL Editor. Ele verifica o histórico e preserva os vínculos anteriores; não repita `setup-dev.sql`. A atualização não cria contas, não atribui acesso de empresário e não ativa um provedor financeiro.

Depois de criar/confirmar as contas e vincular o empresário, abra **Abrir operação de teste** em `/conta`. O empresário cadastra catálogo/equipe e também pode cadastrar a própria conta como barbeiro. O [roteiro de faturamento](billing.md) cobre mensalidades, testes de pagamento, reserva antecipada e reembolso exclusivo do empresário. Pagamentos reais, fotos, validação iOS e demais funcionalidades ainda exigem etapas posteriores.
