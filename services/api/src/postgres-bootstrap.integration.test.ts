// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// Applies infra/postgres/migrations/*.sql to a throwaway database created on
// the server named by OMDALA_TEST_DATABASE_URL. Without that variable the
// suite is skipped because it needs a real PostgreSQL server; it never reads
// any other connection setting and never touches the named database itself.
import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const adminUrl = process.env.OMDALA_TEST_DATABASE_URL;
const migrationsDir = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../infra/postgres/migrations",
);

const migrationFiles = readdirSync(migrationsDir)
  .filter((name) => /^\d{4}_.+\.sql$/.test(name))
  .sort();
const migrationSql = new Map(
  migrationFiles.map((name) => [name, readFileSync(resolve(migrationsDir, name), "utf8")]),
);
const allSql = [...migrationSql.values()].join("\n");

const declaredTables = [
  ...allSql.matchAll(/CREATE TABLE IF NOT EXISTS omdala\.([a-z_]+)/g),
].map((m) => m[1]);
const declaredIndexes = [
  ...allSql.matchAll(/CREATE INDEX IF NOT EXISTS ([a-z_0-9]+)/g),
].map((m) => m[1]);

// Constraint snapshot of the migration set: update together with a new migration.
const EXPECTED_CONSTRAINTS = { p: 16, u: 5, f: 10, c: 11 } as const;

function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

async function applyAll(client: Client) {
  for (const [name, sql] of migrationSql) {
    try {
      await client.query(sql);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw new Error(`migration ${name} failed: ${(error as Error).message}`);
    }
  }
}

async function catalog(client: Client) {
  const tables = await client.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'omdala' ORDER BY 1",
  );
  const indexes = await client.query<{ indexname: string }>(
    "SELECT indexname FROM pg_indexes WHERE schemaname = 'omdala' ORDER BY 1",
  );
  const constraints = await client.query<{ contype: string; n: string }>(
    `SELECT c.contype, count(*) AS n
       FROM pg_constraint c JOIN pg_namespace s ON s.oid = c.connamespace
      WHERE s.nspname = 'omdala' GROUP BY 1 ORDER BY 1`,
  );
  return {
    tables: tables.rows.map((r) => r.tablename),
    indexes: indexes.rows.map((r) => r.indexname),
    constraints: Object.fromEntries(constraints.rows.map((r) => [r.contype, Number(r.n)])),
  };
}

describe.skipIf(!adminUrl)("PostgreSQL migrations bootstrap from an empty database", () => {
  const dbName = `omdala_bootstrap_${randomBytes(6).toString("hex")}`;
  let admin: Client;
  let db: Client;

  beforeAll(async () => {
    admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${dbName}`);
    db = new Client({ connectionString: withDatabase(adminUrl!, dbName) });
    await db.connect();
  });

  afterAll(async () => {
    await db?.end().catch(() => undefined);
    await admin?.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`).catch(() => undefined);
    await admin?.end().catch(() => undefined);
  });

  it("declares the migrations this suite expects", () => {
    expect(migrationFiles.length).toBeGreaterThan(0);
    expect(declaredTables.length).toBeGreaterThan(0);
    expect(new Set(declaredTables).size).toBe(declaredTables.length);
    expect(new Set(declaredIndexes).size).toBe(declaredIndexes.length);
  });

  it("applies every migration in order to an empty database", async () => {
    await applyAll(db);
    const state = await catalog(db);
    expect(state.tables).toEqual([...declaredTables].sort());
    for (const index of declaredIndexes) expect(state.indexes).toContain(index);
    expect(state.constraints).toEqual(EXPECTED_CONSTRAINTS);
    // every non-expression index is declared explicitly or backs a PK/UNIQUE constraint
    expect(state.indexes.length).toBe(
      declaredIndexes.length + EXPECTED_CONSTRAINTS.p + EXPECTED_CONSTRAINTS.u,
    );
  });

  it("records each migration version exactly once", async () => {
    const applied = await db.query<{ version: string }>(
      "SELECT version FROM omdala.schema_migrations ORDER BY version",
    );
    expect(applied.rows.map((r) => r.version)).toEqual(
      migrationFiles.map((name) => name.replace(/\.sql$/, "")),
    );
  });

  it("is idempotent when re-applied", async () => {
    const before = await catalog(db);
    await applyAll(db);
    expect(await catalog(db)).toEqual(before);
    const count = await db.query("SELECT count(*)::int AS n FROM omdala.schema_migrations");
    expect(count.rows[0].n).toBe(migrationFiles.length);
  });

  it("enforces declared check and owner constraints", async () => {
    await expect(
      db.query(
        `INSERT INTO omdala.billing_subscriptions (id, owner_email, app_id, plan_id, status, billing_cycle)
         VALUES ('b1', 'a@example.com', 'om-ai', 'p', 'bogus', 'monthly')`,
      ),
    ).rejects.toThrow(/check constraint/);
    await expect(
      db.query(
        `INSERT INTO omdala.nodes (id, owner_email, slug, node_type, name)
         VALUES ('n1', NULL, 's', 't', 'n')`,
      ),
    ).rejects.toThrow(/not-null/);
  });

  it("has no down migration: rollback is drop-and-rebootstrap", async () => {
    // compatibility.json declares schema rollback out of scope; the supported
    // reset is dropping the schema, after which a fresh bootstrap must match.
    const first = await catalog(db);
    await db.query("DROP SCHEMA omdala CASCADE");
    expect((await catalog(db)).tables).toEqual([]);
    await applyAll(db);
    expect(await catalog(db)).toEqual(first);
  });
});
