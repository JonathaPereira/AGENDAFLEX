# Banco e migrações

O schema inicial contém somente empresas e associações. Não há tabelas de agendamentos, pagamentos ou credenciais. Use PostgreSQL local ou Supabase local para validar persistência.

A partir da raiz:

```sh
pnpm db:generate
# Configurar DATABASE_URL no .env com uma conexão local real
pnpm db:migrate
```

A geração lê `database/src/schema.ts`, produz SQL e metadados em `database/migrations` e não precisa de credenciais. A aplicação de migrações exige conexão; revise SQL antes de executar. Não use `push` como substituto de migrações versionadas e não aplique automaticamente em produção.

RLS está habilitada sem políticas: papéis comuns não podem ler/gravar dados. Papéis de proprietário, serviço e BYPASSRLS podem ignorar essa proteção. As políticas e testes de isolamento devem acompanhar a implementação de autenticação antes de disponibilizar dados. `DATABASE_URL` é exclusiva do backend e de ferramentas. A conexão direta usa `prepare: false` para compatibilidade com poolers em modo transação; a fábrica fornece fechamento explícito com `close()`.
