import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url),
  journal = JSON.parse(
    readFileSync(new URL('migrations/meta/_journal.json', root), 'utf8'),
  );
const chunks = [
  `-- AgendaFlex: configuração inicial de um projeto Supabase de DESENVOLVIMENTO vazio.
-- Gerado por pnpm db:setup-sql. Não editar nem executar em produção.
-- Registra as mesmas migrações do Drizzle, permitindo usar db:migrate depois.
BEGIN;
CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id serial PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations) THEN
    RAISE EXCEPTION 'Já existem migrações aplicadas. Use pnpm db:migrate; não repita este setup.';
  END IF;
END $$;`,
];
for (const entry of journal.entries) {
  const sql = readFileSync(
      new URL(`migrations/${entry.tag}.sql`, root),
      'utf8',
    ),
    hash = createHash('sha256').update(sql).digest('hex');
  chunks.push(
    `\n-- Migração ${entry.tag}\n${sql}\nINSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('${hash}', ${entry.when});`,
  );
}
chunks.push('\nCOMMIT;\n');
const contents = chunks.join('\n'),
  target = new URL('supabase/setup-dev.sql', root);
const prior = journal.entries.slice(0, 2);
const delta = journal.entries.slice(2);
const migrationHash = (entry) =>
  createHash('sha256')
    .update(readFileSync(new URL(`migrations/${entry.tag}.sql`, root)))
    .digest('hex');
const update = [
  `-- Atualização incremental do faturamento de TESTE para o projeto já configurado.
-- Não repita setup-dev.sql. Este arquivo preserva contas e vínculos existentes.
-- Gerado por pnpm db:setup-sql. Execute inteiro no SQL Editor do projeto de desenvolvimento.
BEGIN;
DO $$ BEGIN
  IF (SELECT count(*) FROM drizzle.__drizzle_migrations) <> ${prior.length}
    OR NOT (${prior.map((entry) => `EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '${migrationHash(entry)}' AND created_at = ${entry.when})`).join(' AND ')}) THEN
    RAISE EXCEPTION 'Histórico diferente do esperado ou atualização já aplicada. Nenhuma alteração foi feita. Revise as migrações.';
  END IF;
END $$;`,
  ...delta.map(
    (entry) =>
      `-- Migração ${entry.tag}\n${readFileSync(new URL(`migrations/${entry.tag}.sql`, root), 'utf8')}\nINSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES ('${migrationHash(entry)}',${entry.when});`,
  ),
  "NOTIFY pgrst, 'reload schema';\nCOMMIT;\n",
].join('\n');
const updateTarget = new URL('supabase/billing-update.sql', root);
if (process.argv.includes('--check')) {
  if (
    readFileSync(target, 'utf8') !== contents ||
    readFileSync(updateTarget, 'utf8') !== update
  ) {
    process.stderr.write(
      'setup-dev.sql desatualizado. Execute pnpm db:setup-sql.\n',
    );
    process.exitCode = 1;
  }
} else {
  writeFileSync(target, contents);
  writeFileSync(updateTarget, update);
  process.stdout.write(
    'Criado database/supabase/setup-dev.sql (somente desenvolvimento vazio).\n',
  );
}
