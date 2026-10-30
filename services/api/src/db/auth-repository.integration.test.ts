// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// Runs the real auth-repository SQL against a throwaway database on the server
// named by OMDALA_TEST_DATABASE_URL (skipped when it is unset). The server must
// accept TLS; the repository's TLS policy is exercised with the local/test-only
// OMDALA_DB_TLS_INSECURE=1 flag because the scratch server has a self-signed cert.
import { randomBytes, randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ApiBindings } from "../contracts";
import {
  consumeMagicLink,
  createAuthSession,
  isAuthSessionActive,
  registerMagicLink,
  revokeAuthSession,
  rotateAuthSession,
} from "./auth-repository";

const adminUrl = process.env.OMDALA_TEST_DATABASE_URL;
const migrationsDir = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../../infra/postgres/migrations",
);

function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

describe.skipIf(!adminUrl)("auth repository against real PostgreSQL", () => {
  const dbName = `omdala_auth_${randomBytes(6).toString("hex")}`;
  let admin: Client;
  let env: ApiBindings;
  let pg: Client;

  beforeAll(async () => {
    admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${dbName}`);
    const url = withDatabase(adminUrl!, dbName);
    pg = new Client({ connectionString: url });
    await pg.connect();
    for (const name of readdirSync(migrationsDir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).sort()) {
      await pg.query(readFileSync(resolve(migrationsDir, name), "utf8"));
    }
    env = {
      ENVIRONMENT: "test",
      OMDALA_DB_TLS_INSECURE: "1",
      DATABASE_URL: url,
    } as ApiBindings;
  });

  afterAll(async () => {
    await pg?.end().catch(() => undefined);
    await admin?.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`).catch(() => undefined);
    await admin?.end().catch(() => undefined);
  });

  const future = () => Date.now() + 60 * 60 * 1000;

  it("consumes a magic link exactly once", async () => {
    const jti = randomUUID();
    await registerMagicLink(env, { jti, email: "a@example.com", redirectTo: "/x", expiresAt: future() });
    expect(await consumeMagicLink(env, { jti, email: "a@example.com" })).toBe(true);
    expect(await consumeMagicLink(env, { jti, email: "a@example.com" })).toBe(false);
  });

  it("refuses a magic link for another email, an unknown jti, or after expiry", async () => {
    const jti = randomUUID();
    await registerMagicLink(env, { jti, email: "owner@example.com", redirectTo: "/x", expiresAt: future() });
    expect(await consumeMagicLink(env, { jti, email: "other@example.com" })).toBe(false);
    expect(await consumeMagicLink(env, { jti: randomUUID(), email: "owner@example.com" })).toBe(false);

    const expired = randomUUID();
    await registerMagicLink(env, { jti: expired, email: "owner@example.com", redirectTo: "/x", expiresAt: Date.now() - 1000 });
    expect(await consumeMagicLink(env, { jti: expired, email: "owner@example.com" })).toBe(false);
    // the legitimate link is still usable after the failed attempts
    expect(await consumeMagicLink(env, { jti, email: "owner@example.com" })).toBe(true);
  });

  it("rejects the same magic-link jti twice at the database", async () => {
    const jti = randomUUID();
    await registerMagicLink(env, { jti, email: "a@example.com", redirectTo: "/x", expiresAt: future() });
    await expect(
      registerMagicLink(env, { jti, email: "a@example.com", redirectTo: "/x", expiresAt: future() }),
    ).rejects.toThrow();
  });

  it("rotates a refresh token once and rejects replay of the previous one", async () => {
    const id = randomUUID();
    const first = randomUUID();
    const second = randomUUID();
    await createAuthSession(env, { id, email: "s@example.com", currentRefreshJti: first, refreshExpiresAt: future() });
    expect(await isAuthSessionActive(env, { id, email: "s@example.com" })).toBe(true);
    const rotate = (previous: string, next: string, email = "s@example.com") =>
      rotateAuthSession(env, { id, email, previousRefreshJti: previous, nextRefreshJti: next, refreshExpiresAt: future() });
    expect(await rotate(first, second)).toBe(true);
    expect(await rotate(first, randomUUID())).toBe(false); // replay
    expect(await rotate(second, randomUUID(), "wrong@example.com")).toBe(false); // wrong tenant
    expect(await rotate(second, randomUUID())).toBe(true);
  });

  it("denies a revoked session everywhere and keeps revocation idempotent", async () => {
    const id = randomUUID();
    const jti = randomUUID();
    await createAuthSession(env, { id, email: "r@example.com", currentRefreshJti: jti, refreshExpiresAt: future() });
    await revokeAuthSession(env, id);
    await revokeAuthSession(env, id);
    expect(await isAuthSessionActive(env, { id, email: "r@example.com" })).toBe(false);
    expect(
      await rotateAuthSession(env, {
        id, email: "r@example.com", previousRefreshJti: jti, nextRefreshJti: randomUUID(), refreshExpiresAt: future(),
      }),
    ).toBe(false);
  });

  it("denies an expired session and a session checked with another email", async () => {
    const id = randomUUID();
    const jti = randomUUID();
    await createAuthSession(env, { id, email: "e@example.com", currentRefreshJti: jti, refreshExpiresAt: Date.now() - 1000 });
    expect(await isAuthSessionActive(env, { id, email: "e@example.com" })).toBe(false);
    expect(
      await rotateAuthSession(env, {
        id, email: "e@example.com", previousRefreshJti: jti, nextRefreshJti: randomUUID(), refreshExpiresAt: future(),
      }),
    ).toBe(false);

    const live = randomUUID();
    await createAuthSession(env, { id: live, email: "l@example.com", currentRefreshJti: randomUUID(), refreshExpiresAt: future() });
    expect(await isAuthSessionActive(env, { id: live, email: "other@example.com" })).toBe(false);
  });
});
