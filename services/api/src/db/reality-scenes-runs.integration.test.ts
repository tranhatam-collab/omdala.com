// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// Real-SQL tenant isolation, migration and rollback checks for persisted scenes
// and runs. Skipped unless OMDALA_TEST_DATABASE_URL names a disposable server
// (see auth-repository.integration.test.ts); runs on a throwaway database.
// Migration 0004 is applied from infra/postgres/migrations/proposed until it is
// promoted into the applied set (see the README next to it).
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ApiBindings } from "../contracts";
import { DEFAULT_REALITY_SCENES } from "../reality-scene-defaults";
import { listRuns, listScenes, runScene } from "./reality-repository";

const adminUrl = process.env.OMDALA_TEST_DATABASE_URL;
const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../infra/postgres/migrations");
const sqlFiles = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).sort().map((n) => resolve(dir, n))
    : [];
// top-level files plus the proposed folder; once 0004 is promoted the second list is empty
const appliedOrder = [...sqlFiles(root), ...sqlFiles(resolve(root, "proposed"))].sort((a, b) =>
  a.split("/").pop()!.localeCompare(b.split("/").pop()!),
);
const downFile = resolve(root, "rollback/0004_reality_scenes_runs.down.sql");
const A = "tenant-a@example.com";
const B = "tenant-b@example.com";

describe.skipIf(!adminUrl)("scenes and runs on real PostgreSQL", () => {
  const dbName = `omdala_scenes_${randomBytes(6).toString("hex")}`;
  let admin: Client;
  let pg: Client;
  let env: ApiBindings;

  const applyAll = async () => {
    for (const file of appliedOrder) await pg.query(readFileSync(file, "utf8"));
  };
  const tables = async () =>
    (await pg.query("SELECT tablename FROM pg_tables WHERE schemaname='omdala' ORDER BY 1")).rows.map(
      (r) => r.tablename as string,
    );

  beforeAll(async () => {
    admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${dbName}`);
    const url = new URL(adminUrl!);
    url.pathname = `/${dbName}`;
    pg = new Client({ connectionString: url.toString() });
    await pg.connect();
    await applyAll();
    env = { ENVIRONMENT: "test", OMDALA_DB_TLS_INSECURE: "1", DATABASE_URL: url.toString() } as ApiBindings;
  });

  afterAll(async () => {
    await pg?.end().catch(() => undefined);
    await admin?.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`).catch(() => undefined);
    await admin?.end().catch(() => undefined);
  });

  it("seeds the default catalog per tenant, idempotently", async () => {
    const first = await listScenes(env, A);
    expect(first.map((s) => s.scene_id)).toEqual(DEFAULT_REALITY_SCENES.map((s) => s.scene_id));
    expect(first[0].actions).toEqual(DEFAULT_REALITY_SCENES[0].actions);
    await listScenes(env, A);
    await Promise.all([listScenes(env, A), listScenes(env, A)]);
    const count = await pg.query("SELECT count(*)::int AS n FROM omdala.reality_scenes WHERE owner_email=$1", [A]);
    expect(count.rows[0].n).toBe(DEFAULT_REALITY_SCENES.length);
  });

  it("keeps each tenant's scenes separate", async () => {
    await listScenes(env, B);
    await pg.query(
      `INSERT INTO omdala.reality_scenes (owner_email, scene_id, display_name, safety_class)
       VALUES ($1, 'scene_only_a', 'Only A', 'safe')`,
      [A],
    );
    expect((await listScenes(env, A)).map((s) => s.scene_id)).toContain("scene_only_a");
    expect((await listScenes(env, B)).map((s) => s.scene_id)).not.toContain("scene_only_a");
  });

  it("runs a scene for its owner and records the run under that owner", async () => {
    const run = await runScene(env, A, "scene_sleep_child");
    expect(run).toMatchObject({
      source: "scene",
      source_id: "scene_sleep_child",
      actor_id: A,
      status: "succeeded",
      policy_decision: "allow_with_logging",
    });
    expect(run!.run_id).toMatch(/^run_scene_/);
    expect(run!.proof_id).toMatch(/^proof_/);
    expect(new Date(run!.created_at).toString()).not.toBe("Invalid Date");
  });

  it("refuses to run another tenant's scene or an unknown scene (null, no row written)", async () => {
    const before = (await pg.query("SELECT count(*)::int AS n FROM omdala.reality_runs")).rows[0].n;
    expect(await runScene(env, B, "scene_only_a")).toBeNull();
    expect(await runScene(env, B, "does_not_exist")).toBeNull();
    expect((await pg.query("SELECT count(*)::int AS n FROM omdala.reality_runs")).rows[0].n).toBe(before);
    expect(await runScene(env, A, "scene_only_a")).not.toBeNull();
  });

  it("shows each tenant only its own runs, newest first, with correct paging", async () => {
    for (let i = 0; i < 4; i++) await runScene(env, B, "scene_sleep_child");
    const a = await listRuns(env, A, { page: 1, limit: 100 });
    const b = await listRuns(env, B, { page: 1, limit: 100 });
    expect(a.total).toBe(2);
    expect(b.total).toBe(4);
    expect(a.runs.every((r) => r.actor_id === A)).toBe(true);
    expect(b.runs.every((r) => r.actor_id === B)).toBe(true);
    const ids = new Set([...a.runs, ...b.runs].map((r) => r.run_id));
    expect(ids.size).toBe(6);

    const page1 = await listRuns(env, B, { page: 1, limit: 3 });
    const page2 = await listRuns(env, B, { page: 2, limit: 3 });
    expect(page1.runs).toHaveLength(3);
    expect(page2.runs).toHaveLength(1);
    expect(page1.total).toBe(4);
    const times = page1.runs.map((r) => r.created_at);
    expect([...times].sort().reverse()).toEqual(times);
    expect(new Set([...page1.runs, ...page2.runs].map((r) => r.run_id)).size).toBe(4);
    expect((await listRuns(env, B, { page: 9, limit: 3 })).runs).toEqual([]);
  });

  it("returns nothing for an unknown caller", async () => {
    expect((await listRuns(env, "nobody@example.com", { page: 1, limit: 10 })).total).toBe(0);
  });

  it("rejects malformed rows at the database (actions must be an array)", async () => {
    await expect(
      pg.query(
        `INSERT INTO omdala.reality_scenes (owner_email, scene_id, display_name, safety_class, actions)
         VALUES ($1, 'bad', 'Bad', 'safe', '{"a":1}'::jsonb)`,
        [A],
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it("rolls back and re-applies cleanly", async () => {
    const withMigration = await tables();
    expect(withMigration).toEqual(expect.arrayContaining(["reality_scenes", "reality_runs"]));

    await pg.query(readFileSync(downFile, "utf8"));
    const afterDown = await tables();
    expect(afterDown).not.toContain("reality_scenes");
    expect(afterDown).not.toContain("reality_runs");
    expect(afterDown).toHaveLength(withMigration.length - 2);
    const ledger = await pg.query("SELECT version FROM omdala.schema_migrations ORDER BY 1");
    expect(ledger.rows.map((r) => r.version)).not.toContain("0004_reality_scenes_runs");
    // the earlier migrations and their data are untouched
    expect(afterDown).toEqual(expect.arrayContaining(["nodes", "auth_sessions", "workspaces"]));

    await applyAll();
    expect(await tables()).toEqual(withMigration);
    const rerun = await pg.query("SELECT version FROM omdala.schema_migrations ORDER BY 1");
    expect(rerun.rows.map((r) => r.version)).toContain("0004_reality_scenes_runs");
    expect(await listScenes(env, A)).not.toHaveLength(0);
    expect((await listRuns(env, A, { page: 1, limit: 10 })).total).toBe(0);
  });
});
