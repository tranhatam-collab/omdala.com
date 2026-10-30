/* eslint-disable @typescript-eslint/no-explicit-any -- loosely typed JSON fixtures and response bodies; the assertions check values, not shapes */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Per-owner in-memory fakes. Each repository function records which owner it was
// called for, so the tests prove the routes pass the caller's identity from the
// verified session and never take it from the request body. (The SQL itself is
// covered by v1-tenant-isolation.integration.test.ts.)
type Json = Record<string, any>;
const db = vi.hoisted(() => {
  const state = {
    owners: [] as string[],
    profiles: new Map<string, any>(),
    preferences: new Map<string, any>(),
    subscriptions: new Map<string, any>(),
    workspaces: new Map<string, any[]>(),
    notifications: new Map<string, any[]>(),
    events: new Map<string, any[]>(),
  };
  const seen = (owner: string) => {
    state.owners.push(owner);
  };
  return { state, seen };
});

vi.mock("./db/account-repository", () => ({
  readOrCreateAccountProfile: vi.fn(async (_env: unknown, fallback: Json) => {
    db.seen(fallback.email);
    if (!db.state.profiles.has(fallback.email)) db.state.profiles.set(fallback.email, fallback);
    return db.state.profiles.get(fallback.email);
  }),
  writeAccountProfile: vi.fn(async (_env: unknown, profile: Json) => {
    db.seen(profile.email);
    db.state.profiles.set(profile.email, profile);
    return profile;
  }),
  readOrCreateAccountPreferences: vi.fn(async (_env: unknown, email: string, _p: Json, fallback: Json) => {
    db.seen(email);
    if (!db.state.preferences.has(email)) db.state.preferences.set(email, fallback);
    return db.state.preferences.get(email);
  }),
  writeAccountPreferences: vi.fn(async (_env: unknown, email: string, _p: Json, preferences: Json) => {
    db.seen(email);
    db.state.preferences.set(email, preferences);
    return preferences;
  }),
}));

vi.mock("./db/runtime-repository", () => ({
  readOrCreateBillingSubscription: vi.fn(async (_env: unknown, owner: string, fallback: Json) => {
    db.seen(owner);
    if (!db.state.subscriptions.has(owner)) db.state.subscriptions.set(owner, fallback);
    return db.state.subscriptions.get(owner);
  }),
  readBillingUsageMinutesToday: vi.fn(async (_env: unknown, owner: string) => {
    db.seen(owner);
    return 0;
  }),
  listOrCreateWorkspaces: vi.fn(async (_env: unknown, owner: string, defaults: Json[]) => {
    db.seen(owner);
    if (!db.state.workspaces.has(owner)) db.state.workspaces.set(owner, defaults);
    return db.state.workspaces.get(owner);
  }),
  createWorkspace: vi.fn(async (_env: unknown, owner: string, workspace: Json) => {
    db.seen(owner);
    db.state.workspaces.set(owner, [...(db.state.workspaces.get(owner) ?? []), workspace]);
    return workspace;
  }),
  listOrCreateNotifications: vi.fn(async (_env: unknown, owner: string, defaults: Json[]) => {
    db.seen(owner);
    if (!db.state.notifications.has(owner)) db.state.notifications.set(owner, defaults);
    return db.state.notifications.get(owner);
  }),
  markNotificationRead: vi.fn(async (_env: unknown, owner: string, id: string) => {
    db.seen(owner);
    const found = (db.state.notifications.get(owner) ?? []).find((n: Json) => n.id === id);
    if (!found) return null;
    found.readAt = found.readAt ?? "2026-10-30T00:00:00.000Z";
    return found;
  }),
  listOrCreateAnalyticsEvents: vi.fn(async (_env: unknown, owner: string, defaults: Json[]) => {
    db.seen(owner);
    if (!db.state.events.has(owner)) db.state.events.set(owner, defaults);
    return db.state.events.get(owner);
  }),
  createAnalyticsEvent: vi.fn(async (_env: unknown, owner: string, event: Json) => {
    db.seen(owner);
    db.state.events.set(owner, [...(db.state.events.get(owner) ?? []), event]);
    return event;
  }),
}));

vi.mock("./db/auth-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/auth-repository")>()),
  isAuthSessionActive: vi.fn(async () => true),
}));

import app from "./index";
import * as accountRepo from "./db/account-repository";
import * as runtimeRepo from "./db/runtime-repository";

const SECRET = "test_v1_tenant_isolation_secret_value_0123";
const env = {
  ENVIRONMENT: "production",
  DATABASE_URL: "postgres://example.local/db",
  MAGIC_LINK_SECRET: SECRET,
};
const A = "tenant-a@tenant-a.test";
const B = "tenant-b@tenant-b.test";

async function cookieFor(email: string) {
  const part = Buffer.from(
    JSON.stringify({
      jti: crypto.randomUUID(),
      sid: crypto.randomUUID(),
      email,
      type: "access",
      exp: Date.now() + 60_000,
    }),
  ).toString("base64url");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(part));
  return `omdala_access_token=${part}.${Buffer.from(new Uint8Array(sig)).toString("base64url")}`;
}

const request = async (method: string, path: string, email: string | null, body?: unknown) =>
  app.request(
    `http://localhost${path}`,
    {
      method,
      headers: {
        ...(email ? { cookie: await cookieFor(email) } : {}),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    env,
  );

const A_WORKSPACE = "wsd_tenant_a_private";
const A_NOTIFICATION = "notif_a_private";

beforeEach(() => {
  const s = db.state;
  s.owners.length = 0;
  for (const map of [s.profiles, s.preferences, s.subscriptions, s.workspaces, s.notifications, s.events]) map.clear();
  // Tenant A already has private data in every store.
  s.profiles.set(A, { id: "user_a", email: A, displayName: "A Secret Person", timezone: "UTC", locale: "en" });
  s.preferences.set(A, { language: "en", theme: "dark", notifications: { email: false, push: false } });
  s.subscriptions.set(A, { id: "sub_a", appId: "om-ai", planId: "pro", status: "active", billingCycle: "yearly" });
  s.workspaces.set(A, [{ id: A_WORKSPACE, slug: "a-secret", name: "A Secret Workspace", type: "organization", timezone: "UTC", locale: "en", ownerId: "user_a", members: [{ userId: "user_a", role: "owner", status: "active", joinedAt: "2026-01-01T00:00:00.000Z" }], createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }]);
  s.notifications.set(A, [{ id: A_NOTIFICATION, userId: "user_a", workspaceId: A_WORKSPACE, type: "system", title: "A Secret Notice", body: "private", appId: "omdala-platform", deeplink: "/x", createdAt: "2026-01-01T00:00:00.000Z" }]);
  s.events.set(A, [{ id: "evt_a_private", appId: "om-ai", eventName: "a.secret.event", userId: "user_a", workspaceId: A_WORKSPACE, source: "api", occurredAt: "2026-01-01T00:00:00.000Z", properties: {} }]);
  for (const mod of [accountRepo, runtimeRepo]) for (const fn of Object.values(mod)) (fn as any).mockClear?.();
});

const LEAKS = [A, "A Secret", "a.secret.event", A_WORKSPACE, A_NOTIFICATION, "user_a"];
const expectNoLeak = (text: string) => {
  for (const leak of LEAKS) expect(text, `response must not contain ${leak}`).not.toContain(leak);
};
const expectOnlyCaller = () => {
  expect(db.state.owners.length).toBeGreaterThan(0);
  for (const owner of db.state.owners) expect(owner).toBe(B);
};

const routes: Array<[string, string, unknown?]> = [
  ["GET", "/v1/account/profile"],
  ["PUT", "/v1/account/profile", { displayName: "X" }],
  ["GET", "/v1/account/preferences"],
  ["PUT", "/v1/account/preferences", { language: "en" }],
  ["GET", "/v1/billing/subscriptions"],
  ["GET", "/v1/billing/usage"],
  ["GET", "/v1/workspaces"],
  ["GET", `/v1/workspaces/${A_WORKSPACE}`],
  ["POST", "/v1/workspaces", { name: "W" }],
  ["GET", "/v1/notifications"],
  ["POST", `/v1/notifications/mark-read/${A_NOTIFICATION}`, {}],
  ["POST", "/v1/analytics/track", { eventName: "e" }],
  ["GET", "/v1/analytics/dashboard"],
  ["POST", "/v1/security/api-keys", { name: "k" }],
  ["POST", "/v1/security/service-token", { serviceId: "svc" }],
];

describe("every account- and workspace-scoped /v1 route requires a session", () => {
  it.each(routes)("%s %s answers 401 and touches no repository", async (method, path, body) => {
    const response = await request(method, path, null, body);
    expect(response.status).toBe(401);
    expect(db.state.owners).toHaveLength(0);
  });
});

describe("a caller from another account (tenant B) never reaches tenant A's data", () => {
  it("GET /v1/account/profile returns only B's own profile", async () => {
    const response = await request("GET", "/v1/account/profile", B);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain(B);
    expectNoLeak(text);
    expectOnlyCaller();
  });

  it("PUT /v1/account/profile ignores an email or id in the body and leaves A's profile untouched", async () => {
    const response = await request("PUT", "/v1/account/profile", B, {
      displayName: "B Name",
      email: A,
      id: "user_a",
      owner_email: A,
    });
    expect([200, 422]).toContain(response.status);
    expectOnlyCaller();
    expect(db.state.profiles.get(A).displayName).toBe("A Secret Person");
    expect(db.state.profiles.get(A).email).toBe(A);
    if (response.status === 200) expectNoLeak(await response.text());
  });

  it("GET /v1/account/preferences returns only B's preferences", async () => {
    const response = await request("GET", "/v1/account/preferences", B);
    expect(response.status).toBe(200);
    expect(JSON.stringify(((await response.json()) as Json).data)).not.toContain('"dark"');
    expectOnlyCaller();
  });

  it("PUT /v1/account/preferences writes only B's preferences", async () => {
    const response = await request("PUT", "/v1/account/preferences", B, {
      language: "vi",
      theme: "light",
      email: A,
      owner_email: A,
    });
    expect([200, 422]).toContain(response.status);
    expectOnlyCaller();
    expect(db.state.preferences.get(A)).toEqual({ language: "en", theme: "dark", notifications: { email: false, push: false } });
  });

  it("GET /v1/billing/subscriptions returns only B's subscription", async () => {
    const response = await request("GET", "/v1/billing/subscriptions", B);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain("sub_a");
    expect(text).not.toContain('"pro"');
    expectOnlyCaller();
  });

  it("GET /v1/billing/usage reads B's usage", async () => {
    const response = await request("GET", "/v1/billing/usage", B);
    expect(response.status).toBe(200);
    expectOnlyCaller();
  });

  it("GET /v1/workspaces lists only B's workspaces", async () => {
    const response = await request("GET", "/v1/workspaces", B);
    expect(response.status).toBe(200);
    expectNoLeak(await response.text());
    expectOnlyCaller();
  });

  it("GET /v1/workspaces/:id answers 404 for A's workspace id", async () => {
    const response = await request("GET", `/v1/workspaces/${A_WORKSPACE}`, B);
    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).toContain("workspace_not_found");
    expectNoLeak(text.replace(A_WORKSPACE, ""));
    expectOnlyCaller();
  });

  it("POST /v1/workspaces creates the workspace for B whatever the body claims", async () => {
    const response = await request("POST", "/v1/workspaces", B, {
      name: "B Team",
      ownerEmail: A,
      owner_email: A,
      ownerId: "user_a",
      members: [{ userId: "user_a", role: "owner" }],
    });
    expect(response.status).toBe(201);
    const created = ((await response.json()) as Json).data.workspace as Json;
    expect(created.ownerId).toBe(db.state.profiles.get(B).id);
    expect(created.members).toHaveLength(1);
    expect(created.members[0].userId).toBe(db.state.profiles.get(B).id);
    expectOnlyCaller();
    expect(db.state.workspaces.get(A)!.map((w: Json) => w.id)).toEqual([A_WORKSPACE]);
  });

  it("GET /v1/notifications lists only B's notifications", async () => {
    const response = await request("GET", "/v1/notifications", B);
    expect(response.status).toBe(200);
    expectNoLeak(await response.text());
    expectOnlyCaller();
  });

  it("POST /v1/notifications/mark-read/:id answers 404 for A's notification and leaves it unread", async () => {
    const response = await request("POST", `/v1/notifications/mark-read/${A_NOTIFICATION}`, B, {});
    expect(response.status).toBe(404);
    expectOnlyCaller();
    expect(db.state.notifications.get(A)![0].readAt).toBeUndefined();
  });

  it("POST /v1/analytics/track refuses a workspace id that belongs to A, before any write", async () => {
    const response = await request("POST", "/v1/analytics/track", B, {
      eventName: "b.event",
      workspaceId: A_WORKSPACE,
    });
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("workspace_not_found");
    expect(runtimeRepo.createAnalyticsEvent).not.toHaveBeenCalled();
    expectOnlyCaller();
  });

  it("POST /v1/analytics/track still records an event for B's own workspace", async () => {
    const own = ((await (await request("GET", "/v1/workspaces", B)).json()) as Json).data.workspaces[0].id as string;
    const response = await request("POST", "/v1/analytics/track", B, { eventName: "b.event", workspaceId: own });
    expect(response.status).toBe(201);
    expect(runtimeRepo.createAnalyticsEvent).toHaveBeenCalledTimes(1);
    expectOnlyCaller();
    expect(db.state.events.get(A)).toHaveLength(1);
  });

  it("GET /v1/analytics/dashboard summarizes only B's events", async () => {
    const response = await request("GET", "/v1/analytics/dashboard", B);
    expect(response.status).toBe(200);
    expectNoLeak(await response.text());
    expectOnlyCaller();
  });
});

describe("security routes", () => {
  it("POST /v1/security/api-keys and /service-token work for a signed-in caller and touch no tenant data", async () => {
    const key = await request("POST", "/v1/security/api-keys", B, { name: "k" });
    expect(key.status).toBe(201);
    const token = await request("POST", "/v1/security/service-token", B, { serviceId: "svc" });
    expect(token.status).toBe(201);
    expect(db.state.owners).toHaveLength(0);
  });

  it("GET /v1/security/csrf and POST /v1/security/webhooks/verify are stateless and touch no tenant data", async () => {
    expect((await request("GET", "/v1/security/csrf", null)).status).toBe(200);
    const verify = await request("POST", "/v1/security/webhooks/verify", null, {
      payload: "{}",
      signature: "00",
      secret: "caller-supplied-secret",
    });
    expect([200, 400, 500]).toContain(verify.status);
    expect(db.state.owners).toHaveLength(0);
  });
});
