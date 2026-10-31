// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// Local DR rehearsal (E2E-5): dump a populated scratch database, restore it
// into a second scratch database, and prove parity table by table. Runs only
// when OMDALA_TEST_DATABASE_URL names a disposable local server and pg_dump /
// pg_restore are on PATH. It creates and drops its own databases and never
// touches the named one. Set OMDALA_DR_RECEIPT_PATH to write the receipt JSON.
// Covers the applied migrations and the proposed ones (0004 to 0007: reality scenes
// and runs, the AI cost-cap ledger, bridge credentials, stored account ids), so a
// restore is proven to keep the cap counters and the revocation state.
import { execFile } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ApiBindings } from "./contracts";
import { reserveAiUsage } from "./db/ai-usage-repository";

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

const proposedDir = resolve(migrationsDir, "proposed");
const sqlIn = (dir: string) => readdirSync(dir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).map((n) => resolve(dir, n));
const allMigrations = [...sqlIn(migrationsDir), ...sqlIn(proposedDir)].sort((a, b) =>
  a.split("/").pop()!.localeCompare(b.split("/").pop()!),
);

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
    for (const file of allMigrations) {
      await source.query(readFileSync(file, "utf8"));
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
      -- proposed 0004: scenes and runs
      INSERT INTO omdala.reality_scenes (owner_email, scene_id, display_name, safety_class, actions)
        VALUES ('a@example.com', 'sc1', 'Evening ✓', 'low', '[{"k":"lights"}]'::jsonb);
      INSERT INTO omdala.reality_runs (owner_email, run_id, source, source_id, actor_id, status, policy_decision, proof_id)
        VALUES ('a@example.com', 'r1', 'scene', 'sc1', 'acc1', 'succeeded', 'allow', 'p1');
      -- proposed 0005: cap counter and ledger (one settled, one held, one released)
      INSERT INTO omdala.ai_usage_days (owner_email, usage_day, committed_usd) VALUES ('a@example.com', '2026-10-30', 0.251);
      INSERT INTO omdala.ai_usage_ledger (owner_email, request_id, usage_day, reserved_usd, settled_usd, status) VALUES
        ('a@example.com', 'req-settled', '2026-10-30', 0.25, 0.001, 'settled'),
        ('a@example.com', 'req-held', '2026-10-30', 0.25, NULL, 'reserved'),
        ('a@example.com', 'req-released', '2026-10-30', 0.25, NULL, 'released');
      -- proposed 0006: one live and one revoked bridge credential
      INSERT INTO omdala.om_ai_bridge_credentials (jti, parent_sid, owner_email, workspace_id, scopes, expires_at, revoked_at) VALUES
        ('44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222', 'a@example.com', 'w1', 'profile:read session:read', NOW() + interval '15 minutes', NULL),
        ('55555555-5555-4555-8555-555555555555', '22222222-2222-4222-8222-222222222222', 'a@example.com', 'w1', 'session:read', NOW() + interval '15 minutes', NOW());
      -- proposed 0007: stored account ids
      INSERT INTO omdala.account_ids (email, account_id) VALUES
        ('a@example.com', '66666666-6666-4666-8666-666666666666'), ('b@example.com', '77777777-7777-4777-8777-777777777777');
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
    expect(Object.keys(sourceReceipt.tables)).toHaveLength(22);
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

  it("keeps the cost-cap state: counters equal the ledger and the cap still holds after a restore", async () => {
    const q = async (client: Client) =>
      (
        await client.query(
          `SELECT d.committed_usd::text AS committed,
                  COALESCE(SUM(CASE l.status WHEN 'reserved' THEN l.reserved_usd WHEN 'settled' THEN l.settled_usd ELSE 0 END), 0)::text AS derived,
                  COUNT(*) FILTER (WHERE l.status = 'released')::int AS released
             FROM omdala.ai_usage_days d JOIN omdala.ai_usage_ledger l USING (owner_email, usage_day)
            GROUP BY d.committed_usd`,
        )
      ).rows[0];
    const before = await q(source);
    const after = await q(target);
    expect(after).toEqual(before);
    expect(Number(after.committed)).toBeCloseTo(Number(after.derived), 6);
    // the restored counter is what the atomic reservation reads: 0.251 + 0.25 > 0.4, so it refuses
    const env = { ENVIRONMENT: "test", OMDALA_DB_TLS_INSECURE: "1", DATABASE_URL: withDatabase(adminUrl!, targetName) } as ApiBindings;
    const refused = await reserveAiUsage(env, { ownerEmail: "a@example.com", requestId: "req-new", usageDay: "2026-10-30", estimateUsd: 0.25, capUsd: 0.4 });
    expect(refused).toMatchObject({ outcome: "cap_exceeded" });
    // a replayed key is still a duplicate in its original state
    expect(await reserveAiUsage(env, { ownerEmail: "a@example.com", requestId: "req-released", usageDay: "2026-10-30", estimateUsd: 0.25, capUsd: 5 })).toEqual({ outcome: "duplicate", status: "released" });
    expect(Number((await target.query("SELECT committed_usd FROM omdala.ai_usage_days")).rows[0].committed_usd)).toBeCloseTo(0.251, 6);
  });

  it("keeps bridge credential revocation state and stored account ids", async () => {
    const state = async (client: Client) =>
      (await client.query("SELECT jti::text, (revoked_at IS NOT NULL) AS revoked, scopes FROM omdala.om_ai_bridge_credentials ORDER BY jti")).rows;
    const restored = await state(target);
    expect(restored).toEqual(await state(source));
    expect(restored.map((r) => r.revoked)).toEqual([false, true]);
    const ids = async (client: Client) => (await client.query("SELECT email, account_id::text FROM omdala.account_ids ORDER BY email")).rows;
    expect(await ids(target)).toEqual(await ids(source));
    // uniqueness still enforced on the restored copy
    await expect(target.query("INSERT INTO omdala.account_ids (email, account_id) VALUES ('c@example.com', '66666666-6666-4666-8666-666666666666')")).rejects.toThrow();
  });

  it("detects drift: a changed byte in the restored copy fails the comparison", async () => {
    await target.query("UPDATE omdala.nodes SET summary = summary || '!' WHERE id = 'n2'");
    const drifted = await receipt(target);
    expect(drifted.tables.nodes).not.toEqual(sourceReceipt.tables.nodes);
    await target.query("UPDATE omdala.nodes SET summary = '' WHERE id = 'n2'");
    expect((await receipt(target)).tables.nodes).toEqual(sourceReceipt.tables.nodes);
  });

  it("detects drift in the new tables: an un-revoked credential or a lowered counter fails parity", async () => {
    await target.query("BEGIN");
    try {
      await target.query("UPDATE omdala.om_ai_bridge_credentials SET revoked_at = NULL WHERE jti = '55555555-5555-4555-8555-555555555555'");
      expect((await receipt(target)).tables.om_ai_bridge_credentials).not.toEqual(sourceReceipt.tables.om_ai_bridge_credentials);
      await target.query("UPDATE omdala.ai_usage_days SET committed_usd = 0");
      expect((await receipt(target)).tables.ai_usage_days).not.toEqual(sourceReceipt.tables.ai_usage_days);
    } finally {
      await target.query("ROLLBACK");
    }
    const back = await receipt(target);
    expect(back.tables.om_ai_bridge_credentials).toEqual(sourceReceipt.tables.om_ai_bridge_credentials);
    expect(back.tables.ai_usage_days).toEqual(sourceReceipt.tables.ai_usage_days);
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
