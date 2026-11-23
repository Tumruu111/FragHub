// Helpers for the *.db.test.ts files, which run against a real Postgres.
// Run them with `npx nx run @org/api:test:db` and TEST_DATABASE_URL pointing
// at a database you don't mind tests writing to. Each test file works in its
// own schema, which is dropped and recreated at the start.
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const MIGRATIONS_DIR = fileURLToPath(
  new URL('../../prisma/migrations', import.meta.url)
);

export const testDatabaseUrl = (): string => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url)
    throw new Error(
      'Set TEST_DATABASE_URL to a Postgres database the tests may write to'
    );
  return url;
};

// The test database URL, pointed at one schema
export const schemaUrl = (schema: string): string => {
  const url = new URL(testDatabaseUrl());
  url.searchParams.set('schema', schema);
  return url.toString();
};

// Migration folder names in the order Prisma applies them
export const migrationNames = (): string[] =>
  readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

const migrationSql = (name: string): string =>
  readFileSync(join(MIGRATIONS_DIR, name, 'migration.sql'), 'utf8');

// A pg client whose queries run in a fresh, empty schema
export const connectToFreshSchema = async (schema: string): Promise<Client> => {
  const client = new Client({ connectionString: testDatabaseUrl() });
  await client.connect();
  await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await client.query(`CREATE SCHEMA "${schema}"`);
  await client.query(`SET search_path TO "${schema}"`);
  return client;
};

// Apply migrations in order. `before` runs ahead of each one, so a test can
// put data in the shape an older migration left it.
export const applyMigrations = async (
  client: Client,
  before?: (name: string) => Promise<void>
): Promise<void> => {
  for (const name of migrationNames()) {
    await before?.(name);
    await client.query(migrationSql(name));
  }
};
