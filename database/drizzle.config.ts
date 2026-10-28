import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { fileURLToPath } from 'node:url';
config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  ...(process.env.DATABASE_URL
    ? { dbCredentials: { url: process.env.DATABASE_URL } }
    : {}),
  strict: true,
});
