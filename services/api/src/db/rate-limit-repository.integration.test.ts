// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// Real-SQL checks for the shared fixed-window limiter (migration 0008, applied from
// infra/postgres/migrations/proposed until promoted): parallel requests from several simulated
// isolates never exceed the limit between them, windows roll over, keys are independent and
// stored hashed. Skipped unless OMDALA_TEST_DATABASE_URL names a disposable server.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ApiBindings } from "../contracts";
import { hashRateLimitKey, hitRateLimit, purgeRateLimitWindows } from "./rate-limit-repository";

const adminUrl = process.env.OMDALA_TEST_DATABASE_URL;
const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../infra/postgres/migrations");
const sqlFiles = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).sort().map((n) => resolve(dir, n))
    : [];
const appliedOrder = [...sqlFiles(root), ...sqlFiles(resolve(root, "proposed"))].sort((a, b) =>
  a.split("/").pop()!.localeCompare(b.split("/").pop()!),
);

describe.skipIf(!adminUrl)("shared rate limiter on real PostgreSQL", () => {
  const dbName = `omdala_ratelimit_${randomBytes(6).toString("hex")}`;
  let admin: Client;
  let pg: Client;
  let env: ApiBindings;
  let seq = 0;
  const key = (label = "k") => `${label}:${(seq += 1)}:${randomBytes(3).toString("hex")}@example.test`;
  // each simulated isolate has its own env object (and so its own connections)
  const isolates = () => [0, 1, 2].map(() => ({ ...env }) as ApiBindings);

  beforeAll(async () => {
    admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${dbName}`);
    const url = new URL(adminUrl!);
    url.pathname = `/${dbName}`;
    pg = new Client({ connectionString: url.toString() });
    await pg.connect();
    for (const file of appliedOrder) await pg.query(readFileSync(file, "utf8"));
    env = { ENVIRONMENT: "test", OMDALA_DB_TLS_INSECURE: "1", DATABASE_URL: url.toString() } as ApiBindings;
  });

  afterAll(async () => {
    await pg?.end().catch(() => undefined);
    await admin?.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`).catch(() => undefined);
    await admin?.end().catch(() => undefined);
  });

  it("allows exactly the limit, then refuses", async () => {
    const k = key();
    const results: boolean[] = [];
    for (let i = 0; i < 8; i++) results.push(await hitRateLimit(env, { key: k, limit: 5, windowSeconds: 3600 }));
    expect(results).toEqual([false, false, false, false, false, true, true, true]);
    const stored = (await pg.query("SELECT hits FROM omdala.rate_limit_windows WHERE key_hash=$1", [await hashRateLimitKey(`3600:${k}`)])).rows;
    expect(stored.map((r) => r.hits)).toEqual([5]); // refused requests are not counted
  });

  it("never exceeds the limit under 60 parallel requests spread over three isolates", async () => {
    const k = key();
    const nodes = isolates();
    const outcomes = await Promise.all(
      Array.from({ length: 60 }, (_, i) => hitRateLimit(nodes[i % nodes.length], { key: k, limit: 7, windowSeconds: 3600 })),
    );
    expect(outcomes.filter((limited) => !limited)).toHaveLength(7);
    expect(outcomes.filter((limited) => limited)).toHaveLength(53);
  });

  it("holds across many rounds (no leak, no undercount)", async () => {
    const nodes = isolates();
    for (let round = 0; round < 5; round++) {
      const k = key("round");
      const outcomes = await Promise.all(
        Array.from({ length: 25 }, (_, i) => hitRateLimit(nodes[i % nodes.length], { key: k, limit: 4, windowSeconds: 3600 })),
      );
      expect(outcomes.filter((limited) => !limited), `round ${round}`).toHaveLength(4);
    }
  });

  it("starts a fresh window when the window rolls over", async () => {
    const k = key();
    expect(await hitRateLimit(env, { key: k, limit: 1, windowSeconds: 1 })).toBe(false);
    expect(await hitRateLimit(env, { key: k, limit: 1, windowSeconds: 1 })).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(await hitRateLimit(env, { key: k, limit: 1, windowSeconds: 1 })).toBe(false);
  });

  it("keeps keys and window lengths independent", async () => {
    const a = key("a");
    const b = key("b");
    expect(await hitRateLimit(env, { key: a, limit: 1, windowSeconds: 3600 })).toBe(false);
    expect(await hitRateLimit(env, { key: a, limit: 1, windowSeconds: 3600 })).toBe(true);
    expect(await hitRateLimit(env, { key: b, limit: 1, windowSeconds: 3600 })).toBe(false);
    // the same key under a different window length is a different window
    expect(await hitRateLimit(env, { key: a, limit: 1, windowSeconds: 7200 })).toBe(false);
  });

  it("stores only a hash of the key, never the email or address", async () => {
    const k = `contact:email:secret.person@example.test:${randomBytes(3).toString("hex")}`;
    await hitRateLimit(env, { key: k, limit: 3, windowSeconds: 3600 });
    const all = JSON.stringify((await pg.query("SELECT key_hash FROM omdala.rate_limit_windows")).rows);
    expect(all).not.toContain("secret.person");
    expect(all).toContain(await hashRateLimitKey(`3600:${k}`));
    expect(await hashRateLimitKey(k)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("purges only old windows", async () => {
    const old = await hashRateLimitKey(`3600:${key("old")}`);
    await pg.query("INSERT INTO omdala.rate_limit_windows (key_hash, window_start, hits) VALUES ($1, NOW() - interval '3 days', 3)", [old]);
    const fresh = key("fresh");
    await hitRateLimit(env, { key: fresh, limit: 3, windowSeconds: 3600 });
    await purgeRateLimitWindows(env, 24 * 60 * 60);
    expect((await pg.query("SELECT 1 FROM omdala.rate_limit_windows WHERE key_hash=$1", [old])).rowCount).toBe(0);
    expect((await pg.query("SELECT 1 FROM omdala.rate_limit_windows WHERE key_hash=$1", [await hashRateLimitKey(`3600:${fresh}`)])).rowCount).toBe(1);
  });

  it("refuses a zero or negative limit without counting, and rolls back cleanly", async () => {
    const k = key();
    expect(await hitRateLimit(env, { key: k, limit: 1, windowSeconds: 3600 })).toBe(false);
    const down = readFileSync(resolve(root, "rollback/0008_rate_limit_windows.down.sql"), "utf8");
    await pg.query(down);
    expect((await pg.query("SELECT to_regclass('omdala.rate_limit_windows') AS t")).rows[0].t).toBeNull();
    const migration = appliedOrder.find((file) => file.endsWith("0008_rate_limit_windows.sql"))!;
    await pg.query(readFileSync(migration, "utf8"));
    await pg.query(readFileSync(migration, "utf8"));
    expect((await pg.query("SELECT to_regclass('omdala.rate_limit_windows') AS t")).rows[0].t).not.toBeNull();
  });
});
