import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
export { schema };
// Lazy factory: boot and /health require no database credentials or network.
// Direct SQL does not inherit Supabase Auth RLS context. No tenant routes use this factory yet.
export function createDatabase(connectionString: string) {
  const sql = postgres(connectionString, { prepare: false, max: 5 });
  return { db: drizzle(sql, { schema }), close: () => sql.end() };
}
