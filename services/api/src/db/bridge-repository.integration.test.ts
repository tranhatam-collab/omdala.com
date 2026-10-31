// PREP_UNDER_ASSUMPTION(AI-01, bridge as drafted)
//
// Real-SQL checks for the Om AI bridge credential rows (migration 0006, applied from
// infra/postgres/migrations/proposed until promoted). Skipped unless
// OMDALA_TEST_DATABASE_URL names a disposable server.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ApiBindings } from "../contracts";
import {
  countLiveBridgeCredentialsForSession,
  getOrCreateAccountId,
  insertBridgeCredential,
  readAccountId,
  readBridgeCredential,
  revokeBridgeCredential,
  revokeBridgeCredentialsForSession,
} from "./bridge-repository";

const adminUrl = process.env.OMDALA_TEST_DATABASE_URL;
const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../infra/postgres/migrations");
const sqlFiles = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).sort().map((n) => resolve(dir, n))
    : [];
const appliedOrder = [...sqlFiles(root), ...sqlFiles(resolve(root, "proposed"))].sort((a, b) =>
  a.split("/").pop()!.localeCompare(b.split("/").pop()!),
);
const downFile = resolve(root, "rollback/0006_om_ai_bridge_credentials.down.sql");
const downAccountIds = resolve(root, "rollback/0007_account_ids.down.sql");

describe.skipIf(!adminUrl)("Om AI bridge credentials on real PostgreSQL", () => {
  const dbName = `omdala_bridge_${randomBytes(6).toString("hex")}`;
  let admin: Client;
  let pg: Client;
  let env: ApiBindings;
  const row = (parentSid = crypto.randomUUID(), expiresAt = Date.now() + 900_000) => ({
    jti: crypto.randomUUID(),
    parentSid,
    ownerEmail: "owner@example.test",
    workspaceId: "ws_1",
    scopes: ["profile:read", "session:read"],
    expiresAt,
  });

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

  it("stores and reads back exactly what was minted", async () => {
    const input = row();
    await insertBridgeCredential(env, input);
    const read = await readBridgeCredential(env, input.jti);
    expect(read).toMatchObject({ ...input, revoked: false });
    expect(Math.abs(read!.expiresAt - input.expiresAt)).toBeLessThan(1000);
    expect(await readBridgeCredential(env, crypto.randomUUID())).toBeNull();
  });

  it("revokes one credential once", async () => {
    const input = row();
    await insertBridgeCredential(env, input);
    expect(await revokeBridgeCredential(env, input.jti)).toBe(true);
    expect(await revokeBridgeCredential(env, input.jti)).toBe(false);
    expect((await readBridgeCredential(env, input.jti))!.revoked).toBe(true);
  });

  it("revokes every credential of a parent session and no other", async () => {
    const sid = crypto.randomUUID();
    const mine = [row(sid), row(sid)];
    const other = row();
    for (const item of [...mine, other]) await insertBridgeCredential(env, item);
    expect(await revokeBridgeCredentialsForSession(env, sid)).toBe(2);
    expect(await revokeBridgeCredentialsForSession(env, sid)).toBe(0);
    for (const item of mine) expect((await readBridgeCredential(env, item.jti))!.revoked).toBe(true);
    expect((await readBridgeCredential(env, other.jti))!.revoked).toBe(false);
  });

  it("counts only live credentials of one session", async () => {
    const sid = crypto.randomUUID();
    const live = [row(sid), row(sid), row(sid)];
    for (const item of live) await insertBridgeCredential(env, item);
    await insertBridgeCredential(env, row());
    expect(await countLiveBridgeCredentialsForSession(env, sid)).toBe(3);
    await revokeBridgeCredential(env, live[0].jti);
    expect(await countLiveBridgeCredentialsForSession(env, sid)).toBe(2);
    await pg.query("UPDATE omdala.om_ai_bridge_credentials SET issued_at = NOW() - interval '2 hours', expires_at = NOW() - interval '1 hour' WHERE jti = $1::uuid", [live[1].jti]);
    expect(await countLiveBridgeCredentialsForSession(env, sid)).toBe(1);
  });

  it("stores one stable account id per email, race-free", async () => {
    const email = `acct-${crypto.randomUUID().slice(0, 8)}@example.test`;
    expect(await readAccountId(env, email)).toBeNull();
    const ids = await Promise.all(Array.from({ length: 12 }, () => getOrCreateAccountId(env, email)));
    expect(new Set(ids).size).toBe(1);
    expect(ids[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(await readAccountId(env, email)).toBe(ids[0]);
    expect(await getOrCreateAccountId(env, `${email}.other`)).not.toBe(ids[0]);
  });

  it("refuses a duplicate jti and an already-expired row", async () => {
    const input = row();
    await insertBridgeCredential(env, input);
    await expect(insertBridgeCredential(env, input)).rejects.toThrow();
    await expect(insertBridgeCredential(env, row(undefined, Date.now() - 1000))).rejects.toThrow();
  });

  it("rolls back and re-applies cleanly", async () => {
    await pg.query(readFileSync(downFile, "utf8"));
    expect((await pg.query("SELECT to_regclass('omdala.om_ai_bridge_credentials') AS t")).rows[0].t).toBeNull();
    const migration = appliedOrder.find((file) => file.endsWith("0006_om_ai_bridge_credentials.sql"))!;
    await pg.query(readFileSync(migration, "utf8"));
    await pg.query(readFileSync(migration, "utf8")); // idempotent
    expect((await pg.query("SELECT to_regclass('omdala.om_ai_bridge_credentials') AS t")).rows[0].t).not.toBeNull();
    await pg.query(readFileSync(downAccountIds, "utf8"));
    expect((await pg.query("SELECT to_regclass('omdala.account_ids') AS t")).rows[0].t).toBeNull();
    const accounts = appliedOrder.find((file) => file.endsWith("0007_account_ids.sql"))!;
    await pg.query(readFileSync(accounts, "utf8"));
    await pg.query(readFileSync(accounts, "utf8"));
    expect((await pg.query("SELECT to_regclass('omdala.account_ids') AS t")).rows[0].t).not.toBeNull();
  });
});
