# Banco e migrações

O schema inicial contém somente empresas e associações. Não há tabelas de agendamentos, pagamentos ou credenciais. A migração inicial suporta PostgreSQL; a nova migração de acesso exige Supabase (local ou projeto de desenvolvimento), pois usa `auth.uid()` e os papéis `anon`/`authenticated`.

A partir da raiz:

```sh
pnpm db:generate
# Configurar DATABASE_URL no .env com uma conexão local real
pnpm db:migrate
```

A geração lê `database/src/schema.ts`, produz SQL e metadados em `database/migrations` e não precisa de credenciais. A aplicação de migrações exige conexão; revise SQL antes de executar. Não use `push` como substituto de migrações versionadas e não aplique automaticamente em produção.

RLS está habilitada. A migração 0001 permite SELECT dos vínculos próprios e dos tenants associados para authenticated, mantendo escrita e acesso anônimo bloqueados. Um índice parcial limita a um owner por tenant. Papéis de proprietário do banco, serviço e BYPASSRLS podem ignorar essa proteção. As políticas e testes de isolamento devem acompanhar a implementação de autenticação antes de disponibilizar dados. `DATABASE_URL` é exclusiva do backend e de ferramentas. A conexão direta usa `prepare: false` para compatibilidade com poolers em modo transação; a fábrica fornece fechamento explícito com `close()`.

Para a configuração guiada no SQL Editor do Supabase, siga [Supabase e login](../docs/supabase-setup.md). O setup de desenvolvimento gerado registra o journal do Drizzle e recusa reaplicação. As políticas ainda precisam ser validadas contra o projeto real.
