import { describe, expect, it, vi } from "vitest";

// The repository seam mirrors the guards in db/auth-repository.ts (jti+email
// match, single consumption, revoked_at, refresh_expires_at); the HTTP
// handlers, token signing and cookie handling under test are the real ones.
const authState = vi.hoisted(() => ({
  magicLinks: new Set<string>(),
  sessions: new Map<
    string,
    { email: string; currentRefreshJti: string; refreshExpiresAt: number; revoked: boolean }
  >(),
}));

vi.mock("./db/auth-repository", () => ({
  registerMagicLink: vi.fn(async (_env, input) => {
    authState.magicLinks.add(`${input.jti}:${input.email}`);
  }),
  consumeMagicLink: vi.fn(async (_env, input) => {
    const key = `${input.jti}:${input.email}`;
    if (!authState.magicLinks.has(key)) return false;
    authState.magicLinks.delete(key);
    return true;
  }),
  createAuthSession: vi.fn(async (_env, input) => {
    authState.sessions.set(input.id, {
      email: input.email,
      currentRefreshJti: input.currentRefreshJti,
      refreshExpiresAt: input.refreshExpiresAt,
      revoked: false,
    });
  }),
  rotateAuthSession: vi.fn(async (_env, input) => {
    const session = authState.sessions.get(input.id);
    if (
      !session ||
      session.revoked ||
      session.email !== input.email ||
      session.currentRefreshJti !== input.previousRefreshJti ||
      session.refreshExpiresAt <= Date.now()
    ) return false;
    session.currentRefreshJti = input.nextRefreshJti;
    session.refreshExpiresAt = input.refreshExpiresAt;
    return true;
  }),
  revokeAuthSession: vi.fn(async (_env, id) => {
    const session = authState.sessions.get(id);
    if (session) session.revoked = true;
  }),
  isAuthSessionActive: vi.fn(async (_env, input) => {
    const session = authState.sessions.get(input.id);
    return Boolean(
      session &&
        !session.revoked &&
        session.email === input.email &&
        session.refreshExpiresAt > Date.now(),
    );
  }),
}));

import app from "./index";
import { createApiContractStub } from "./stub";

const SECRET = "test_magic_link_secret_at_least_32_chars";
const env = {
  ENVIRONMENT: "staging",
  MAGIC_LINK_SECRET: SECRET,
  E2E_TEST_SECRET: "test_e2e_bootstrap_secret_at_least_32_chars",
  APP_BASE_URL: "https://app-staging.omdala.com",
  AUTH_BASE_URL: "https://auth-staging.omdala.com",
  WEB_BASE_URL: "https://staging.omdala.com",
};

const json = (body: unknown, method = "POST") => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

async function sign(payload: object, secret = SECRET): Promise<string> {
  const part = b64url(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(part));
  return `${part}.${b64url(new Uint8Array(signature))}`;
}

async function bootstrap(email: string, redirectTo = "/profile") {
  const response = await app.request(
    "http://localhost/v1/_e2e/magic-link",
    {
      ...json({ email, redirectTo }),
      headers: {
        "content-type": "application/json",
        "x-e2e-test-secret": env.E2E_TEST_SECRET,
      },
    },
    env,
  );
  return (await response.json()) as { data: { token: string; redirectTo: string } };
}

async function login(email: string) {
  const { data } = await bootstrap(email);
  const exchange = await app.request(
    "http://localhost/v1/auth/session/exchange",
    json({ token: data.token }),
    env,
  );
  const setCookie = exchange.headers.get("set-cookie") ?? "";
  const cookie = (name: string) => {
    const match = setCookie.match(new RegExp(`${name}=([^;,]+)`));
    if (!match?.[1]) throw new Error(`${name} cookie missing`);
    return `${name}=${match[1]}`;
  };
  return {
    exchange,
    token: data.token,
    access: cookie("omdala_access_token"),
    refresh: cookie("omdala_refresh_token"),
  };
}

async function errorCode(response: Response): Promise<string | undefined> {
  const body = (await response.json()) as { error?: { code?: string } };
  return body.error?.code;
}

const get = (path: string, cookie?: string, headers: Record<string, string> = {}) =>
  app.request(
    `http://localhost${path}`,
    { headers: { ...(cookie ? { cookie } : {}), ...headers } },
    env,
  );

describe("session lifecycle negatives", () => {
  it("rejects a correctly signed but expired access token", async () => {
    const live = await login("expired-token@omdala.com");
    const sid = [...authState.sessions.entries()].find(
      ([, s]) => s.email === "expired-token@omdala.com",
    )![0];
    const expired = await sign({
      jti: crypto.randomUUID(),
      sid,
      email: "expired-token@omdala.com",
      type: "access",
      exp: Date.now() - 1000,
    });
    expect(live.exchange.status).toBe(200);
    const response = await get("/v1/auth/session", `omdala_access_token=${expired}`);
    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe("invalid_or_expired_token");
  });

  it("rejects a valid token once the server-side session has expired", async () => {
    const { access } = await login("expired-session@omdala.com");
    const entry = [...authState.sessions.values()].find(
      (s) => s.email === "expired-session@omdala.com",
    )!;
    expect((await get("/v1/auth/session", access)).status).toBe(200);
    entry.refreshExpiresAt = Date.now() - 1;
    const response = await get("/v1/auth/session", access);
    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe("session_revoked");
  });

  it("rejects access and refresh after the session is revoked by logout", async () => {
    const { access, refresh } = await login("revoked@omdala.com");
    const logout = await app.request(
      "http://localhost/v1/auth/logout",
      { method: "POST", headers: { cookie: `${access}; ${refresh}` } },
      env,
    );
    expect(logout.status).toBe(200);

    const protectedRoute = await get("/v1/account/profile", access);
    expect(protectedRoute.status).toBe(401);
    expect(await errorCode(protectedRoute)).toBe("session_revoked");

    const refreshed = await app.request(
      "http://localhost/v1/auth/refresh",
      { method: "POST", headers: { cookie: refresh } },
      env,
    );
    expect(refreshed.status).toBe(401);
    expect(await errorCode(refreshed)).toBe("refresh_token_reused_or_revoked");
  });

  it("refuses a refresh token presented as an access token and vice versa", async () => {
    const { access, refresh } = await login("token-type@omdala.com");
    const refreshAsAccess = await get(
      "/v1/auth/session",
      `omdala_access_token=${refresh.split("=")[1]}`,
    );
    expect(refreshAsAccess.status).toBe(401);
    const accessAsRefresh = await app.request(
      "http://localhost/v1/auth/refresh",
      { method: "POST", headers: { cookie: `omdala_refresh_token=${access.split("=")[1]}` } },
      env,
    );
    expect(accessAsRefresh.status).toBe(401);
  });
});

describe("magic-link negatives", () => {
  it("rejects a replayed magic-link token with the consumed-token error", async () => {
    const { token, exchange } = await login("replay@omdala.com");
    expect(exchange.status).toBe(200);
    const replay = await app.request(
      "http://localhost/v1/auth/session/exchange",
      json({ token }),
      env,
    );
    expect(replay.status).toBe(401);
    expect(await errorCode(replay)).toBe("invalid_or_consumed_token");
    expect(replay.headers.get("set-cookie") ?? "").not.toContain("omdala_access_token=ey");
  });

  it("rejects expired, tampered, foreign-secret and malformed tokens without creating a session", async () => {
    const sessionsBefore = authState.sessions.size;
    const payload = {
      jti: crypto.randomUUID(),
      email: "magic@omdala.com",
      redirectTo: "/profile",
      exp: Date.now() + 60_000,
    };
    authState.magicLinks.add(`${payload.jti}:${payload.email}`);
    const valid = await sign(payload);
    const expired = await sign({ ...payload, exp: Date.now() - 1000 });
    const foreign = await sign(payload, "another_secret_that_is_32_chars_long!!");
    const [part, sig] = valid.split(".");
    const tampered = `${b64url(JSON.stringify({ ...payload, email: "victim@omdala.com" }))}.${sig}`;

    for (const token of [expired, foreign, tampered, part!, "", "a.b.c", "not-a-token"]) {
      const response = await app.request(
        "http://localhost/v1/auth/session/exchange",
        json({ token }),
        env,
      );
      expect([400, 401]).toContain(response.status);
      expect(response.headers.get("set-cookie")).toBeNull();
    }
    expect(authState.sessions.size).toBe(sessionsBefore);
    // the unconsumed link was never burned by the failed attempts
    const ok = await app.request(
      "http://localhost/v1/auth/session/exchange",
      json({ token: valid }),
      env,
    );
    expect(ok.status).toBe(200);
  });

  it("rejects a token whose email does not match the registered link", async () => {
    const jti = crypto.randomUUID();
    authState.magicLinks.add(`${jti}:owner@omdala.com`);
    const forged = await sign({
      jti,
      email: "attacker@omdala.com",
      redirectTo: "/profile",
      exp: Date.now() + 60_000,
    });
    const response = await app.request(
      "http://localhost/v1/auth/session/exchange",
      json({ token: forged }),
      env,
    );
    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe("invalid_or_consumed_token");
  });
});

const testEnv = { ...env, ENVIRONMENT: "test" };

async function mintSession(email: string) {
  const sid = crypto.randomUUID();
  authState.sessions.set(sid, {
    email,
    currentRefreshJti: crypto.randomUUID(),
    refreshExpiresAt: Date.now() + 60_000,
    revoked: false,
  });
  const token = await sign({
    jti: crypto.randomUUID(),
    sid,
    email,
    type: "access",
    exp: Date.now() + 60_000,
  });
  return { access: `omdala_access_token=${token}` };
}

describe("tenant and workspace isolation", () => {
  it("does not expose another account's workspace or notifications", async () => {
    const a = await mintSession("tenant-a@omdala.com");
    const b = await mintSession("tenant-b@omdala.com");
    const get = (path: string, cookie: string) =>
      app.request(`http://localhost${path}`, { headers: { cookie } }, testEnv);

    const created = await app.request(
      "http://localhost/v1/workspaces",
      {
        ...json({ name: "Tenant A Family", type: "family", timezone: "UTC", locale: "en" }),
        headers: { "content-type": "application/json", cookie: a.access },
      },
      testEnv,
    );
    expect(created.status).toBe(201);
    const workspaceId = ((await created.json()) as { data: { workspace: { id: string } } })
      .data.workspace.id;

    expect((await get(`/v1/workspaces/${workspaceId}`, a.access)).status).toBe(200);

    const crossRead = await get(`/v1/workspaces/${workspaceId}`, b.access);
    expect(crossRead.status).toBe(404);
    expect(await errorCode(crossRead)).toBe("workspace_not_found");

    const listB = (await (await get("/v1/workspaces", b.access)).json()) as {
      data: { workspaces: Array<{ id: string }> };
    };
    expect(listB.data.workspaces.map((w) => w.id)).not.toContain(workspaceId);

    const notificationsA = (await (await get("/v1/notifications", a.access)).json()) as {
      data: { items: Array<{ id: string }> };
    };
    for (const item of notificationsA.data.items) {
      const cross = await app.request(
        `http://localhost/v1/notifications/mark-read/${encodeURIComponent(item.id)}`,
        { method: "POST", headers: { cookie: b.access } },
        testEnv,
      );
      expect([200, 404]).toContain(cross.status);
      if (cross.status === 200) {
        const body = (await cross.json()) as { data: { notification: { userId?: string } } };
        expect(JSON.stringify(body)).not.toContain("tenant-a@omdala.com");
      }
    }
  });

  it("rejects a token that pairs another account's session id with a different email", async () => {
    await login("owner-sid@omdala.com");
    const sid = [...authState.sessions.entries()].find(
      ([, s]) => s.email === "owner-sid@omdala.com",
    )![0];
    const forged = await sign({
      jti: crypto.randomUUID(),
      sid,
      email: "other-sid@omdala.com",
      type: "access",
      exp: Date.now() + 60_000,
    });
    const response = await get("/v1/auth/session", `omdala_access_token=${forged}`);
    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe("session_revoked");
  });
});

describe("protected routes without a session", () => {
  const routes: Array<[string, string]> = [
    ["GET", "/v1/auth/session"],
    ["GET", "/v1/account/profile"],
    ["PUT", "/v1/account/profile"],
    ["GET", "/v1/account/preferences"],
    ["PUT", "/v1/account/preferences"],
    ["GET", "/v1/billing/subscriptions"],
    ["GET", "/v1/billing/usage"],
    ["GET", "/v1/workspaces"],
    ["GET", "/v1/workspaces/ws_1"],
    ["POST", "/v1/workspaces"],
    ["GET", "/v1/notifications"],
    ["POST", "/v1/notifications/mark-read/n_1"],
    ["POST", "/v1/analytics/track"],
    ["GET", "/v1/analytics/dashboard"],
  ];

  it.each(routes)("%s %s answers 401 unauthenticated", async (method, path) => {
    const response = await app.request(
      `http://localhost${path}`,
      method === "GET" ? {} : json({}, method),
      env,
    );
    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe("unauthenticated");
  });

  it("rejects garbage bearer and cookie credentials", async () => {
    const inits: RequestInit[] = [
      { headers: { authorization: "Bearer not.a.token" } },
      { headers: { authorization: "Bearer " } },
      { headers: { cookie: "omdala_access_token=garbage" } },
    ];
    for (const init of inits) {
      const response = await app.request("http://localhost/v1/account/profile", init as never, env);
      expect(response.status).toBe(401);
    }
  });
});

describe("redirect target validation", () => {
  const hostile = [
    "//evil.example",
    "//evil.example/path",
    "/\\evil.example",
    "\\\\evil.example",
    "\\/evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "/%2f/evil.example/..;/",
    "https://evil.example",
    "http://evil.example/login",
    "javascript:alert(1)",
    "data:text/html,x",
    "evil.example",
    "/ //evil.example",
    "/%5cevil.example",
  ];

  it.each(hostile)("falls back to /dashboard for %j when requesting a magic link", async (redirectTo) => {
    const { data } = await bootstrap("redirect@omdala.com", redirectTo);
    expect(data.redirectTo).toBe("/dashboard");
  });

  it.each(hostile)("ignores hostile exchange next=%j", async (next) => {
    const { data } = await bootstrap("redirect-next@omdala.com", "/profile");
    const response = await app.request(
      "http://localhost/v1/auth/session/exchange",
      json({ token: data.token, next }),
      env,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { redirectTo: string } };
    expect(body.data.redirectTo).toBe("/profile");
  });

  it("keeps legitimate same-origin paths", () => {
    const contract = createApiContractStub({ allowedOrigins: [] });
    for (const path of ["/", "/profile", "/profile?lang=en", "/a/b#frag", "/a%20b"]) {
      expect(contract.normalizePath(path, "/dashboard")).toBe(path);
    }
    expect(contract.normalizePath(undefined, "/dashboard")).toBe("/dashboard");
    expect(contract.normalizePath("", "/dashboard")).toBe("/dashboard");
  });
});
