// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// Local DR rehearsal (E2E-5): dump a populated scratch database, restore it
// into a second scratch database, and prove parity table by table. Runs only
// when OMDALA_TEST_DATABASE_URL names a disposable local server and pg_dump /
// pg_restore are on PATH. It creates and drops its own databases and never
// touches the named one. Set OMDALA_DR_RECEIPT_PATH to write the receipt JSON.
import { execFile } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const run = promisify(execFile);
const adminUrl = process.env.OMDALA_TEST_DATABASE_URL;
const migrationsDir = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../infra/postgres/migrations",
);

async function haveTool(name: string): Promise<boolean> {
  try {
    await run(name, ["--version"]);
    return true;
  } catch {
    return false;
  }
}
const toolsPresent = adminUrl ? await haveTool("pg_dump") && await haveTool("pg_restore") : false;

function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

type TableReceipt = { rows: number; sha256: string };

async function receipt(client: Client) {
  const tables = (
    await client.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'omdala' ORDER BY 1",
    )
  ).rows.map((r) => r.tablename);
  const perTable: Record<string, TableReceipt> = {};
  for (const table of tables) {
    const { rows } = await client.query<{ line: string }>(
      `SELECT t::text AS line FROM omdala.${table} t ORDER BY t::text`,
    );
    perTable[table] = {
      rows: rows.length,
      sha256: createHash("sha256").update(rows.map((r) => r.line).join("\n")).digest("hex"),
    };
  }
  const catalog = async (sql: string) => (await client.query(sql)).rows.map((r) => Object.values(r).join(":"));
  return {
    tables: perTable,
    indexes: await catalog("SELECT indexname FROM pg_indexes WHERE schemaname='omdala' ORDER BY 1"),
    constraints: await catalog(
      `SELECT c.conname, c.contype, pg_get_constraintdef(c.oid) FROM pg_constraint c
         JOIN pg_namespace s ON s.oid = c.connamespace WHERE s.nspname='omdala' ORDER BY 1`,
    ),
    // read without consuming: sequences must continue where the source left off
    trustHistorySequence: (
      await client.query(
        "SELECT last_value::int AS last_value, is_called FROM omdala.trust_score_history_id_seq",
      )
    ).rows[0] as { last_value: number; is_called: boolean },
    migrations: await catalog("SELECT version FROM omdala.schema_migrations ORDER BY 1"),
  };
}

describe.skipIf(!adminUrl || !toolsPresent)("local DR rehearsal: dump, restore, compare", () => {
  const suffix = randomBytes(5).toString("hex");
  const sourceName = `omdala_dr_src_${suffix}`;
  const targetName = `omdala_dr_dst_${suffix}`;
  const workDir = mkdtempSync(join(tmpdir(), "omdala-dr-"));
  const dumpPath = join(workDir, "source.dump");
  let admin: Client;
  let source: Client;
  let target: Client;
  let sourceReceipt: Awaited<ReturnType<typeof receipt>>;

  beforeAll(async () => {
    admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${sourceName}`);
    source = new Client({ connectionString: withDatabase(adminUrl!, sourceName) });
    await source.connect();
    for (const name of readdirSync(migrationsDir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).sort()) {
      await source.query(readFileSync(resolve(migrationsDir, name), "utf8"));
    }
    await source.query(`
      INSERT INTO omdala.nodes (id, owner_email, slug, node_type, name, summary) VALUES
        ('n1', 'a@example.com', 'n1', 'business', 'Ünïcode Node ✓', 'multi
line summary'),
        ('n2', 'a@example.com', 'n2', 'person', 'Two', '');
      INSERT INTO omdala.states (id, node_id, label) VALUES ('s1', 'n1', 'current');
      INSERT INTO omdala.commitments (id, from_node_id, to_node_id, title, amount, currency, due_at)
        VALUES ('c1', 'n1', 'n2', 'Deal', 1234.56, 'USD', '2026-12-31T00:00:00Z');
      INSERT INTO omdala.transitions (id, commitment_id, node_id, from_state_label, to_state_label)
        VALUES ('t1', 'c1', 'n1', 'draft', 'active');
      INSERT INTO omdala.proofs (id, owner_email, commitment_id, transition_id, proof_type, summary)
        VALUES ('p1', 'a@example.com', 'c1', 't1', 'document', 'proof');
      INSERT INTO omdala.trust_scores (node_id, score, level, explanation)
        VALUES ('n1', 71.25, 'verified', '["a","b"]'::jsonb);
      INSERT INTO omdala.trust_score_history (node_id, previous_score, new_score, reason_code, reason_detail)
        VALUES ('n1', 60, 71.25, 'proof', 'x'), ('n1', 71.25, 72, 'proof', 'y');
      INSERT INTO omdala.account_profiles (email, id, display_name, bio) VALUES ('a@example.com', 'acc1', 'A', NULL);
      INSERT INTO omdala.account_preferences (email, theme) VALUES ('a@example.com', 'dark');
      INSERT INTO omdala.auth_magic_links (jti, email, redirect_to, expires_at)
        VALUES ('11111111-1111-4111-8111-111111111111', 'a@example.com', '/x', NOW() + interval '1 hour');
      INSERT INTO omdala.auth_sessions (id, email, current_refresh_jti, refresh_expires_at)
        VALUES ('22222222-2222-4222-8222-222222222222', 'a@example.com', '33333333-3333-4333-8333-333333333333', NOW() + interval '1 day');
      INSERT INTO omdala.billing_subscriptions (id, owner_email, app_id, plan_id, status, billing_cycle)
        VALUES ('b1', 'a@example.com', 'om-ai', 'pro', 'active', 'monthly');
      INSERT INTO omdala.workspaces (id, owner_email, slug, name, workspace_type, timezone, locale, owner_id, members)
        VALUES ('w1', 'a@example.com', 'home', 'Home', 'family', 'UTC', 'vi', 'acc1', '[{"id":"acc1"}]'::jsonb);
      INSERT INTO omdala.shared_notifications (id, owner_email, user_id, notification_type, title, body, app_id, deeplink)
        VALUES ('nt1', 'a@example.com', 'acc1', 'system', 'T', 'B', 'om-ai', '/x');
      INSERT INTO omdala.analytics_events (id, owner_email, app_id, event_name, event_source, occurred_at, properties)
        VALUES ('e1', 'a@example.com', 'om-ai', 'open', 'web', NOW(), '{"k":1}'::jsonb);
    `);
    sourceReceipt = await receipt(source);

    await run("pg_dump", ["--format=custom", "--no-owner", `--file=${dumpPath}`, `--dbname=${withDatabase(adminUrl!, sourceName)}`]);
    await admin.query(`CREATE DATABASE ${targetName}`);
    target = new Client({ connectionString: withDatabase(adminUrl!, targetName) });
    await target.connect();
    await run("pg_restore", ["--no-owner", "--exit-on-error", `--dbname=${withDatabase(adminUrl!, targetName)}`, dumpPath]);
  }, 120_000);

  afterAll(async () => {
    await source?.end().catch(() => undefined);
    await target?.end().catch(() => undefined);
    for (const name of [sourceName, targetName]) {
      await admin?.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`).catch(() => undefined);
    }
    await admin?.end().catch(() => undefined);
    rmSync(workDir, { recursive: true, force: true });
  });

  it("populates every table before the dump", () => {
    for (const [table, info] of Object.entries(sourceReceipt.tables)) {
      expect(info.rows, `${table} must have rows so parity is meaningful`).toBeGreaterThan(0);
    }
    expect(Object.keys(sourceReceipt.tables)).toHaveLength(16);
  });

  it("restores a database with identical per-table rows and content hashes", async () => {
    const restored = await receipt(target);
    expect(restored.tables).toEqual(sourceReceipt.tables);
  });

  it("restores identical indexes, constraints (with definitions) and migration versions", async () => {
    const restored = await receipt(target);
    expect(restored.indexes).toEqual(sourceReceipt.indexes);
    expect(restored.constraints).toEqual(sourceReceipt.constraints);
    expect(restored.migrations).toEqual(sourceReceipt.migrations);
  });

  it("restores sequence state so new history rows continue after the source's", async () => {
    const restored = await receipt(target);
    expect(sourceReceipt.trustHistorySequence).toEqual({ last_value: 2, is_called: true });
    expect(restored.trustHistorySequence).toEqual(sourceReceipt.trustHistorySequence);
    const next = await target.query(
      `INSERT INTO omdala.trust_score_history (node_id, new_score, reason_code, reason_detail)
       VALUES ('n1', 1, 'x', 'y') RETURNING id::int AS id`,
    );
    expect(next.rows[0].id).toBe(3);
    await target.query("DELETE FROM omdala.trust_score_history WHERE id = 3");
  });

  it("detects drift: a changed byte in the restored copy fails the comparison", async () => {
    await target.query("UPDATE omdala.nodes SET summary = summary || '!' WHERE id = 'n2'");
    const drifted = await receipt(target);
    expect(drifted.tables.nodes).not.toEqual(sourceReceipt.tables.nodes);
    await target.query("UPDATE omdala.nodes SET summary = '' WHERE id = 'n2'");
    expect((await receipt(target)).tables.nodes).toEqual(sourceReceipt.tables.nodes);
  });

  it("writes the receipt when OMDALA_DR_RECEIPT_PATH is set", () => {
    const path = process.env.OMDALA_DR_RECEIPT_PATH;
    if (!path) return;
    writeFileSync(
      path,
      JSON.stringify(
        {
          kind: "local-dr-rehearsal",
          source: "scratch (dropped after run)",
          target: "scratch (dropped after run)",
          tool: "pg_dump --format=custom / pg_restore --exit-on-error",
          tables: sourceReceipt.tables,
          indexCount: sourceReceipt.indexes.length,
          constraintCount: sourceReceipt.constraints.length,
          migrations: sourceReceipt.migrations,
        },
        null,
        2,
      ),
    );
  });
});
