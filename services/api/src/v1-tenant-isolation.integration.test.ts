/* eslint-disable @typescript-eslint/no-explicit-any -- loosely typed JSON fixtures and response bodies; the assertions check values, not shapes */
// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// The real app against a real database, two (and three) signed-in tenants.
// Skipped unless OMDALA_TEST_DATABASE_URL names a disposable server; runs on a
// throwaway database. ENVIRONMENT=test accepts any validly signed session token,
// which lets the test act as several accounts without a mail round trip.
import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "./index";

const adminUrl = process.env.OMDALA_TEST_DATABASE_URL;
const migrationsDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../infra/postgres/migrations");
const SECRET = "integration_v1_isolation_secret_value_012345";
type Json = Record<string, any>;

async function cookieFor(email: string) {
  const part = Buffer.from(
    JSON.stringify({ jti: crypto.randomUUID(), sid: crypto.randomUUID(), email, type: "access", exp: Date.now() + 60_000 }),
  ).toString("base64url");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(part));
  return `omdala_access_token=${part}.${Buffer.from(new Uint8Array(sig)).toString("base64url")}`;
}

describe.skipIf(!adminUrl)("/v1 tenant isolation on real PostgreSQL", () => {
  const dbName = `omdala_v1iso_${randomBytes(6).toString("hex")}`;
  let admin: Client;
  let pg: Client;
  let env: Record<string, string>;

  const call = async (method: string, path: string, email: string, body?: unknown) => {
    const response = await app.request(
      `http://localhost${path}`,
      {
        method,
        headers: { cookie: await cookieFor(email), ...(body === undefined ? {} : { "content-type": "application/json" }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
      env,
    );
    return { status: response.status, text: await response.text() };
  };
  const json = (text: string) => JSON.parse(text) as Json;

  beforeAll(async () => {
    admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${dbName}`);
    const url = new URL(adminUrl!);
    url.pathname = `/${dbName}`;
    pg = new Client({ connectionString: url.toString() });
    await pg.connect();
    for (const name of readdirSync(migrationsDir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).sort()) {
      await pg.query(readFileSync(resolve(migrationsDir, name), "utf8"));
    }
    env = { ENVIRONMENT: "test", OMDALA_DB_TLS_INSECURE: "1", DATABASE_URL: url.toString(), MAGIC_LINK_SECRET: SECRET };
  });

  afterAll(async () => {
    await pg?.end().catch(() => undefined);
    await admin?.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`).catch(() => undefined);
    await admin?.end().catch(() => undefined);
  });

  it("gives lookalike addresses their own workspaces (regression: shared default id)", async () => {
    const pairs = [
      ["john.doe@example.com", "john_doe@example.com"],
      ["a-b@example.com", "a.b@example.com"],
      ["x.y@example.com", "x_y@example.com"],
    ];
    for (const [first, second] of pairs) {
      const one = await call("GET", "/v1/workspaces", first);
      const two = await call("GET", "/v1/workspaces", second);
      expect(one.status, `${first}: ${one.text}`).toBe(200);
      expect(two.status, `${second}: ${two.text}`).toBe(200);
      const idOne = json(one.text).data.workspaces[0].id as string;
      const idTwo = json(two.text).data.workspaces[0].id as string;
      expect(idOne).not.toBe(idTwo);
      expect(idOne).toMatch(/^wsd_[a-z0-9_]+$/);
      // the other account can neither read nor see the workspace
      expect((await call("GET", `/v1/workspaces/${idOne}`, second)).status).toBe(404);
      expect((await call("GET", `/v1/workspaces/${idTwo}`, first)).status).toBe(404);
    }
    // notifications and analytics depend on the workspace list: they work for both
    expect((await call("GET", "/v1/notifications", "john_doe@example.com")).status).toBe(200);
    expect((await call("GET", "/v1/analytics/dashboard", "john_doe@example.com")).status).toBe(200);
  });

  it("keeps profiles, preferences and billing separate per account", async () => {
    const a = "iso-a@tenant-a.test";
    const b = "iso-b@tenant-b.test";
    expect((await call("PUT", "/v1/account/profile", a, { displayName: "Alice Alpha" })).status).toBe(200);
    const bProfile = json((await call("GET", "/v1/account/profile", b)).text).data;
    expect(bProfile.email).toBe(b);
    expect(bProfile.displayName).not.toBe("Alice Alpha");
    // a body that names A cannot change A from B's session
    await call("PUT", "/v1/account/profile", b, { displayName: "Bob Beta", email: a });
    expect(json((await call("GET", "/v1/account/profile", a)).text).data.displayName).toBe("Alice Alpha");
    expect(json((await call("GET", "/v1/account/profile", b)).text).data.displayName).toBe("Bob Beta");

    await call("PUT", "/v1/account/preferences", a, { language: "en", theme: "dark" });
    const bPrefs = json((await call("GET", "/v1/account/preferences", b)).text).data;
    expect(bPrefs.theme).not.toBe("dark");

    const subA = json((await call("GET", "/v1/billing/subscriptions", a)).text).data.primary;
    const subB = json((await call("GET", "/v1/billing/subscriptions", b)).text).data.primary;
    expect(subA.id).not.toBe(subB.id);
    const rows = await pg.query("SELECT owner_email FROM omdala.billing_subscriptions WHERE owner_email = ANY($1) ORDER BY 1", [[a, b]]);
    expect(rows.rows.map((r) => r.owner_email)).toEqual([a, b]);
  });

  it("keeps workspaces separate: B cannot read, list or reference A's", async () => {
    const a = "ws-a@tenant-a.test";
    const b = "ws-b@tenant-b.test";
    const created = await call("POST", "/v1/workspaces", a, { name: "Alpha Team", ownerEmail: b, owner_email: b });
    expect(created.status).toBe(201);
    const alphaId = json(created.text).data.workspace.id as string;
    const owner = await pg.query("SELECT owner_email FROM omdala.workspaces WHERE id = $1", [alphaId]);
    expect(owner.rows[0].owner_email).toBe(a);

    expect((await call("GET", `/v1/workspaces/${alphaId}`, a)).status).toBe(200);
    const crossRead = await call("GET", `/v1/workspaces/${alphaId}`, b);
    expect(crossRead.status).toBe(404);
    expect(crossRead.text).not.toContain("Alpha Team");
    const bList = await call("GET", "/v1/workspaces", b);
    expect(bList.text).not.toContain("Alpha Team");
  });

  it("keeps notifications separate even when default ids repeat across accounts", async () => {
    const a = "nt-a@tenant-a.test";
    const b = "nt-b@tenant-b.test";
    await call("GET", "/v1/notifications", a);
    await call("GET", "/v1/notifications", b);
    await pg.query(
      `INSERT INTO omdala.shared_notifications (id, owner_email, user_id, notification_type, title, body, app_id, deeplink)
       VALUES ('notif_a_only', $1, 'u', 'system', 'A only', 'private', 'omdala-platform', '/x')`,
      [a],
    );
    // A's private notification: B gets 404 and A's row stays unread
    expect((await call("POST", "/v1/notifications/mark-read/notif_a_only", b, {})).status).toBe(404);
    let row = await pg.query("SELECT read_at FROM omdala.shared_notifications WHERE owner_email = $1 AND id = 'notif_a_only'", [a]);
    expect(row.rows[0].read_at).toBeNull();
    // a repeated default id acts on the caller's own row only
    expect((await call("POST", "/v1/notifications/mark-read/notif_shared_schema_ready", b, {})).status).toBe(200);
    row = await pg.query("SELECT read_at FROM omdala.shared_notifications WHERE owner_email = $1 AND id = 'notif_shared_schema_ready'", [a]);
    expect(row.rows[0].read_at).toBeNull();
    const bList = await call("GET", "/v1/notifications", b);
    expect(bList.text).not.toContain("A only");
  });

  it("keeps analytics separate and refuses a foreign workspace id", async () => {
    const a = "an-a@tenant-a.test";
    const b = "an-b@tenant-b.test";
    const aWorkspace = json((await call("GET", "/v1/workspaces", a)).text).data.workspaces[0].id as string;
    expect((await call("POST", "/v1/analytics/track", a, { eventName: "alpha.only.event", workspaceId: aWorkspace })).status).toBe(201);

    const foreign = await call("POST", "/v1/analytics/track", b, { eventName: "beta.claims.alpha", workspaceId: aWorkspace });
    expect(foreign.status).toBe(404);
    const stored = await pg.query("SELECT count(*)::int AS n FROM omdala.analytics_events WHERE owner_email = $1 AND event_name = 'beta.claims.alpha'", [b]);
    expect(stored.rows[0].n).toBe(0);

    const bDashboard = await call("GET", "/v1/analytics/dashboard", b);
    expect(bDashboard.status).toBe(200);
    expect(bDashboard.text).not.toContain("alpha.only.event");
    const aDashboard = await call("GET", "/v1/analytics/dashboard", a);
    expect(aDashboard.text).toContain("alpha.only.event");
  });
});
