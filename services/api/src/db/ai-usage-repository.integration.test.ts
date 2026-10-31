// PREP_UNDER_ASSUMPTION(AI cost cap, fail closed when unset)
//
// Real-SQL checks for the per-tenant AI cost ledger: atomic reservation under
// concurrency, idempotency, settle/release, tenant and day separation, and the
// migration's rollback. Skipped unless OMDALA_TEST_DATABASE_URL names a disposable
// server (see auth-repository.integration.test.ts). Migration 0005 is applied from
// infra/postgres/migrations/proposed until it is promoted.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ApiBindings } from "../contracts";
import { releaseAiUsage, reserveAiUsage, settleAiUsage } from "./ai-usage-repository";

const adminUrl = process.env.OMDALA_TEST_DATABASE_URL;
const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../infra/postgres/migrations");
const sqlFiles = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).sort().map((n) => resolve(dir, n))
    : [];
const appliedOrder = [...sqlFiles(root), ...sqlFiles(resolve(root, "proposed"))].sort((a, b) =>
  a.split("/").pop()!.localeCompare(b.split("/").pop()!),
);
const downFile = resolve(root, "rollback/0005_ai_usage_ledger.down.sql");
const DAY = "2026-10-30";

describe.skipIf(!adminUrl)("AI usage ledger on real PostgreSQL", () => {
  const dbName = `omdala_aiusage_${randomBytes(6).toString("hex")}`;
  let admin: Client;
  let pg: Client;
  let env: ApiBindings;
  let seq = 0;

  const applyAll = async () => {
    for (const file of appliedOrder) await pg.query(readFileSync(file, "utf8"));
  };
  const owner = () => `owner-${(seq += 1)}-${randomBytes(3).toString("hex")}@example.test`;
  const reserve = (ownerEmail: string, requestId: string, capUsd: number, estimateUsd = 0.25, usageDay = DAY) =>
    reserveAiUsage(env, { ownerEmail, requestId, usageDay, estimateUsd, capUsd });
  const committed = async (ownerEmail: string, usageDay = DAY) =>
    Number(
      (await pg.query("SELECT committed_usd FROM omdala.ai_usage_days WHERE owner_email=$1 AND usage_day=$2", [ownerEmail, usageDay]))
        .rows[0]?.committed_usd ?? 0,
    );
  // The counter must equal what the ledger rows say was reserved or spent.
  const derived = async (ownerEmail: string, usageDay = DAY) =>
    Number(
      (
        await pg.query(
          `SELECT COALESCE(SUM(CASE status WHEN 'reserved' THEN reserved_usd WHEN 'settled' THEN settled_usd ELSE 0 END), 0) AS t
           FROM omdala.ai_usage_ledger WHERE owner_email=$1 AND usage_day=$2`,
          [ownerEmail, usageDay],
        )
      ).rows[0].t,
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

  it("reserves up to the cap and then refuses, exactly at the boundary", async () => {
    const who = owner();
    for (let i = 1; i <= 4; i++) expect(await reserve(who, `r${i}`, 1)).toEqual({ outcome: "reserved" });
    const refused = await reserve(who, "r5", 1);
    expect(refused).toMatchObject({ outcome: "cap_exceeded" });
    expect((refused as { committedUsd: number }).committedUsd).toBeCloseTo(1, 6);
    expect(await committed(who)).toBeCloseTo(1, 6);
    expect(await derived(who)).toBeCloseTo(1, 6);
  });

  it("never exceeds the cap with 40 parallel reservations", async () => {
    const who = owner();
    const results = await Promise.all(Array.from({ length: 40 }, (_, i) => reserve(who, `p${i}`, 1)));
    expect(results.filter((r) => r.outcome === "reserved")).toHaveLength(4);
    expect(results.filter((r) => r.outcome === "cap_exceeded")).toHaveLength(36);
    expect(await committed(who)).toBeCloseTo(1, 6);
    expect(await derived(who)).toBeCloseTo(1, 6);
    const rows = await pg.query("SELECT count(*)::int AS n FROM omdala.ai_usage_ledger WHERE owner_email=$1", [who]);
    expect(rows.rows[0].n).toBe(4); // refused requests leave no ledger row
  });

  it("charges one reservation for 12 parallel replays of the same request id", async () => {
    const who = owner();
    const results = await Promise.all(Array.from({ length: 12 }, () => reserve(who, "same-request", 5)));
    expect(results.filter((r) => r.outcome === "reserved")).toHaveLength(1);
    expect(results.filter((r) => r.outcome === "duplicate")).toHaveLength(11);
    expect(await committed(who)).toBeCloseTo(0.25, 6);
    expect(await derived(who)).toBeCloseTo(0.25, 6);
  });

  it("reports a replay as duplicate with its current status, without charging", async () => {
    const who = owner();
    await reserve(who, "once", 5);
    expect(await reserve(who, "once", 5)).toEqual({ outcome: "duplicate", status: "reserved" });
    await settleAiUsage(env, { ownerEmail: who, requestId: "once", spentUsd: 0.001 });
    expect(await reserve(who, "once", 5)).toEqual({ outcome: "duplicate", status: "settled" });
    await releaseAiUsage(env, { ownerEmail: who, requestId: "other" });
    expect(await committed(who)).toBeCloseTo(0.001, 6);
  });

  it("settling returns the unused part of the reservation", async () => {
    const who = owner();
    for (let i = 1; i <= 4; i++) await reserve(who, `s${i}`, 1);
    expect(await reserve(who, "blocked", 1)).toMatchObject({ outcome: "cap_exceeded" });
    expect(await settleAiUsage(env, { ownerEmail: who, requestId: "s1", spentUsd: 0.001 })).toBe(true);
    expect(await committed(who)).toBeCloseTo(0.751, 6);
    // 0.249 was given back: a full 0.25 reservation still does not fit, a smaller one does
    expect(await reserve(who, "still-too-big", 1)).toMatchObject({ outcome: "cap_exceeded" });
    expect(await reserve(who, "now-fits", 1, 0.2)).toEqual({ outcome: "reserved" });
    expect(await committed(who)).toBeCloseTo(0.951, 6);
  });

  it("settle and release are idempotent and only act on a reserved row", async () => {
    const who = owner();
    await reserve(who, "a", 5);
    await reserve(who, "b", 5);
    expect(await settleAiUsage(env, { ownerEmail: who, requestId: "a", spentUsd: 0.01 })).toBe(true);
    expect(await settleAiUsage(env, { ownerEmail: who, requestId: "a", spentUsd: 0.2 })).toBe(false);
    expect(await releaseAiUsage(env, { ownerEmail: who, requestId: "a" })).toBe(false);
    expect(await releaseAiUsage(env, { ownerEmail: who, requestId: "b" })).toBe(true);
    expect(await releaseAiUsage(env, { ownerEmail: who, requestId: "b" })).toBe(false);
    expect(await settleAiUsage(env, { ownerEmail: who, requestId: "b", spentUsd: 0.2 })).toBe(false);
    expect(await settleAiUsage(env, { ownerEmail: who, requestId: "never-reserved", spentUsd: 0.2 })).toBe(false);
    expect(await committed(who)).toBeCloseTo(0.01, 6);
    expect(await derived(who)).toBeCloseTo(0.01, 6);
  });

  it("keeps accounts separate, each with its own cap", async () => {
    const a = owner();
    const b = owner();
    for (let i = 1; i <= 4; i++) await reserve(a, `a${i}`, 1);
    expect(await reserve(a, "a5", 1)).toMatchObject({ outcome: "cap_exceeded" });
    expect(await reserve(b, "b1", 1)).toEqual({ outcome: "reserved" });
    expect(await committed(b)).toBeCloseTo(0.25, 6);
  });

  it("starts a fresh budget each UTC day", async () => {
    const who = owner();
    for (let i = 1; i <= 4; i++) await reserve(who, `d${i}`, 1, 0.25, "2026-10-30");
    expect(await reserve(who, "d5", 1, 0.25, "2026-10-30")).toMatchObject({ outcome: "cap_exceeded" });
    expect(await reserve(who, "d6", 1, 0.25, "2026-10-31")).toEqual({ outcome: "reserved" });
    expect(await committed(who, "2026-10-30")).toBeCloseTo(1, 6);
    expect(await committed(who, "2026-10-31")).toBeCloseTo(0.25, 6);
  });

  it("serializes a cap smaller than one call: one reservation at a time", async () => {
    const who = owner();
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) => reserve(who, `t${i}`, 0.1, 0.1)));
    expect(results.filter((r) => r.outcome === "reserved")).toHaveLength(1);
    expect(await committed(who)).toBeCloseTo(0.1, 6);
  });

  it("keeps counter and ledger consistent under a randomized parallel storm", async () => {
    const who = owner();
    const cap = 2;
    const ids = Array.from({ length: 60 }, (_, i) => `storm-${i}`);
    await Promise.all(
      ids.map(async (id, i) => {
        const result = await reserve(who, id, cap);
        if (result.outcome !== "reserved") return;
        if (i % 3 === 0) await releaseAiUsage(env, { ownerEmail: who, requestId: id });
        else await settleAiUsage(env, { ownerEmail: who, requestId: id, spentUsd: (i % 5) / 100 });
      }),
    );
    const total = await committed(who);
    expect(total).toBeLessThanOrEqual(cap + 1e-9);
    expect(total).toBeCloseTo(await derived(who), 6);
    const stuck = await pg.query("SELECT count(*)::int AS n FROM omdala.ai_usage_ledger WHERE owner_email=$1 AND status='reserved'", [who]);
    expect(stuck.rows[0].n).toBe(0);
  });

  it("rejects negative amounts and unknown statuses at the database", async () => {
    const who = owner();
    await reserve(who, "ok", 5);
    await expect(
      pg.query("UPDATE omdala.ai_usage_ledger SET status='weird' WHERE owner_email=$1", [who]),
    ).rejects.toThrow(/check constraint/);
    await expect(
      pg.query("UPDATE omdala.ai_usage_days SET committed_usd = -1 WHERE owner_email=$1", [who]),
    ).rejects.toThrow(/check constraint/);
  });

  it("rolls back and re-applies cleanly", async () => {
    const before = (await pg.query("SELECT tablename FROM pg_tables WHERE schemaname='omdala' ORDER BY 1")).rows.map((r) => r.tablename as string);
    expect(before).toEqual(expect.arrayContaining(["ai_usage_days", "ai_usage_ledger"]));
    await pg.query(readFileSync(downFile, "utf8"));
    const after = (await pg.query("SELECT tablename FROM pg_tables WHERE schemaname='omdala' ORDER BY 1")).rows.map((r) => r.tablename as string);
    expect(after).not.toContain("ai_usage_days");
    expect(after).not.toContain("ai_usage_ledger");
    expect(after).toHaveLength(before.length - 2);
    expect(after).toEqual(expect.arrayContaining(["nodes", "auth_sessions", "reality_runs"]));
    await applyAll();
    expect((await pg.query("SELECT tablename FROM pg_tables WHERE schemaname='omdala' ORDER BY 1")).rows.map((r) => r.tablename as string)).toEqual(before);
    expect(await reserve(owner(), "fresh", 1)).toEqual({ outcome: "reserved" });
  });
});
