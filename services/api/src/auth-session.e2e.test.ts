import { describe, expect, it, vi } from "vitest";

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

const stagingEnv = {
  ENVIRONMENT: "staging",
  MAGIC_LINK_SECRET: "test_magic_link_secret_at_least_32_chars",
  E2E_TEST_SECRET: "test_e2e_bootstrap_secret_at_least_32_chars",
  APP_BASE_URL: "https://app-staging.omdala.com",
  AUTH_BASE_URL: "https://auth-staging.omdala.com",
  WEB_BASE_URL: "https://staging.omdala.com",
  MAIL_API_WORKSPACE_ID: "omdala.com-staging",
  MAIL_DELIVERY_MODE: "sink",
  MAIL_STAGING_SINK_ADDRESS: "staging-sink@omdala.com",
};

function accessCookie(response: Response): string {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/omdala_access_token=([^;,]+)/);
  if (!match?.[1]) throw new Error("Session exchange did not set an access cookie");
  return `omdala_access_token=${match[1]}`;
}

function sessionCookieHeader(response: Response): string {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const matches = [
    ...setCookie.matchAll(/(omdala_(?:access|refresh)_token)=([^;,]+)/g),
  ];
  const cookies = new Map(matches.map((match) => [match[1], `${match[1]}=${match[2]}`]));
  if (cookies.size !== 2) throw new Error("Session response did not set both cookies");
  return [...cookies.values()].join("; ");
}

function refreshCookie(cookieHeader: string): string {
  const match = cookieHeader.match(/omdala_refresh_token=([^;]+)/);
  if (!match?.[1]) throw new Error("Refresh cookie is missing");
  return `omdala_refresh_token=${match[1]}`;
}

async function bootstrapSession(email: string) {
  const bootstrap = await app.request(
    "http://localhost/v1/_e2e/magic-link",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-e2e-test-secret": stagingEnv.E2E_TEST_SECRET,
      },
      body: JSON.stringify({ email, redirectTo: "/profile" }),
    },
    stagingEnv,
  );
  const bootstrapPayload = (await bootstrap.json()) as { data: { token: string } };
  const exchange = await app.request(
    "http://localhost/v1/auth/session/exchange",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: bootstrapPayload.data.token }),
    },
    stagingEnv,
  );
  return { token: bootstrapPayload.data.token, exchange };
}

describe("staging auth acceptance contract", () => {
  it("keeps the E2E bootstrap undiscoverable in production", async () => {
    const response = await app.request(
      "http://localhost/v1/_e2e/magic-link",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-e2e-test-secret": stagingEnv.E2E_TEST_SECRET,
        },
        body: JSON.stringify({ email: "e2e@omdala.com", redirectTo: "/profile" }),
      },
      { ...stagingEnv, ENVIRONMENT: "production" },
    );
    expect(response.status).toBe(404);
  });

  it("rejects a staging bootstrap request with the wrong secret", async () => {
    const response = await app.request(
      "http://localhost/v1/_e2e/magic-link",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-e2e-test-secret": "wrong-secret",
        },
        body: JSON.stringify({ email: "e2e@omdala.com", redirectTo: "/profile" }),
      },
      stagingEnv,
    );
    expect(response.status).toBe(401);
  });

  it("fails closed when staging mail delivery is not configured", async () => {
    const response = await app.request(
      "http://localhost/v1/contact",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Staging E2E",
          email: "mail-missing@omdala.com",
          message: "Verify staging mail is fail-closed.",
        }),
      },
      stagingEnv,
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "mail_delivery_failed" },
    });
  });

  it("hands staging contact mail to the configured transport", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        new Response(
          JSON.stringify({ id: "mail-provider-test-001", status: "accepted" }),
          {
            status: 202,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    try {
      const response = await app.request(
        "http://localhost/v1/contact",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: "Staging E2E",
            email: "mail-ready@omdala.com",
            message: "Verify the configured staging mail transport.",
          }),
        },
        { ...stagingEnv, MAIL_API_KEY: "test-mail-api-key" },
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        ok: true,
        data: {
          received: true,
          deliveryReceipts: [
            {
              transport: "mail-api",
              providerMessageId: "mail-provider-test-001",
              providerStatus: "accepted",
              deliveryMode: "sink",
              sinkEnforced: true,
              workspaceId: "omdala.com-staging",
              originalRecipientCount: 1,
              deliveredRecipientCount: 1,
              recipientSetSha256:
                "9cc13bd965f524bd1701d0f4f5df06c479185e18723da23aab1f37dcaa95d260",
            },
            {
              transport: "mail-api",
              providerMessageId: "mail-provider-test-001",
              providerStatus: "accepted",
              deliveryMode: "sink",
              sinkEnforced: true,
              workspaceId: "omdala.com-staging",
              originalRecipientCount: 1,
              deliveredRecipientCount: 1,
              recipientSetSha256:
                "9cc13bd965f524bd1701d0f4f5df06c479185e18723da23aab1f37dcaa95d260",
            },
          ],
        },
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      for (const [, init] of fetchMock.mock.calls) {
        expect(init?.headers).toMatchObject({
          Authorization: "Bearer test-mail-api-key",
          "X-Workspace-Id": "omdala.com-staging",
        });
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        expect(body).toMatchObject({
          to: "staging-sink@omdala.com",
          workspace_id: "omdala.com-staging",
        });
      }
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("fails closed before provider egress when the staging sink is absent", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    try {
      const { MAIL_STAGING_SINK_ADDRESS: _sink, ...missingSinkEnv } = stagingEnv;
      const response = await app.request(
        "http://localhost/v1/auth/magic-link/request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: "must-not-leave@example.com",
            redirectTo: "/profile",
          }),
        },
        { ...missingSinkEnv, MAIL_API_KEY: "test-mail-api-key" },
      );

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toMatchObject({
        ok: false,
        error: { code: "magic_link_failed" },
      });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("fails closed when the configured mail transport omits its provider receipt", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(null, { status: 202 }));

    try {
      const response = await app.request(
        "http://localhost/v1/contact",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: "Staging receipt gate",
            email: "mail-no-receipt@omdala.com",
            message: "The provider must return a traceable message ID.",
          }),
        },
        { ...stagingEnv, MAIL_API_KEY: "test-mail-api-key" },
      );

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toMatchObject({
        ok: false,
        error: {
          code: "mail_delivery_failed",
          message: expect.stringMatching(/provider message ID/i),
        },
      });
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2);
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("boots a signed session and exercises protected account APIs", async () => {
    const email = "e2e-session@omdala.com";
    const bootstrap = await app.request(
      "http://localhost/v1/_e2e/magic-link",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-e2e-test-secret": stagingEnv.E2E_TEST_SECRET,
        },
        body: JSON.stringify({ email, redirectTo: "/profile?lang=en" }),
      },
      stagingEnv,
    );
    expect(bootstrap.status).toBe(201);
    const bootstrapPayload = (await bootstrap.json()) as {
      ok: boolean;
      data: { token: string };
    };

    const exchange = await app.request(
      "http://localhost/v1/auth/session/exchange",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: bootstrapPayload.data.token, next: "/profile?lang=en" }),
      },
      stagingEnv,
    );
    expect(exchange.status).toBe(200);
    await expect(exchange.clone().json()).resolves.toMatchObject({
      ok: true,
      data: {
        appBaseUrl: "https://app-staging.omdala.com",
        authBaseUrl: "https://auth-staging.omdala.com",
        webBaseUrl: "https://staging.omdala.com",
        apiBaseUrl: "https://api-staging.omdala.com",
      },
    });
    const cookie = accessCookie(exchange);

    const session = await app.request(
      "http://localhost/v1/auth/session",
      { headers: { cookie } },
      stagingEnv,
    );
    expect(session.status).toBe(200);
    await expect(session.json()).resolves.toMatchObject({
      ok: true,
      data: { authenticated: true, email },
    });

    const update = await app.request(
      "http://localhost/v1/account/profile",
      {
        method: "PUT",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ displayName: "E2E Session Operator", locale: "en" }),
      },
      stagingEnv,
    );
    expect(update.status).toBe(200);

    const invalidProfile = await app.request(
      "http://localhost/v1/account/profile",
      {
        method: "PUT",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ displayName: 42 }),
      },
      stagingEnv,
    );
    expect(invalidProfile.status).toBe(422);
    await expect(invalidProfile.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid_account_profile" },
    });

    const invalidPreferences = await app.request(
      "http://localhost/v1/account/preferences",
      {
        method: "PUT",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ theme: "automatic", notifications: { email: "yes" } }),
      },
      stagingEnv,
    );
    expect(invalidPreferences.status).toBe(422);
    await expect(invalidPreferences.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid_account_preferences" },
    });

    const profile = await app.request(
      "http://localhost/v1/account/profile",
      { headers: { cookie } },
      stagingEnv,
    );
    expect(profile.status).toBe(200);
    await expect(profile.json()).resolves.toMatchObject({
      ok: true,
      data: { email, displayName: "E2E Session Operator", locale: "en" },
    });
  });

  it("consumes magic links once and revokes a refresh family on token reuse", async () => {
    const { token, exchange } = await bootstrapSession("rotation@omdala.com");
    expect(exchange.status).toBe(200);
    const firstCookies = sessionCookieHeader(exchange);

    const replay = await app.request(
      "http://localhost/v1/auth/session/exchange",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      },
      stagingEnv,
    );
    expect(replay.status).toBe(401);

    const rotated = await app.request(
      "http://localhost/v1/auth/refresh",
      { method: "POST", headers: { cookie: firstCookies } },
      stagingEnv,
    );
    expect(rotated.status).toBe(200);
    const rotatedPayload = (await rotated.clone().json()) as { data: Record<string, unknown> };
    expect(rotatedPayload.data).toMatchObject({ authenticated: true });
    expect(rotatedPayload.data).not.toHaveProperty("access_token");
    expect(rotatedPayload.data).not.toHaveProperty("refresh_token");
    const rotatedCookies = sessionCookieHeader(rotated);

    const reused = await app.request(
      "http://localhost/v1/auth/refresh",
      { method: "POST", headers: { cookie: refreshCookie(firstCookies) } },
      stagingEnv,
    );
    expect(reused.status).toBe(401);

    const revokedAccess = await app.request(
      "http://localhost/v1/auth/session",
      { headers: { cookie: accessCookie(new Response(null, { headers: { "set-cookie": rotatedCookies } })) } },
      stagingEnv,
    );
    expect(revokedAccess.status).toBe(401);
  });

  it("revokes the server-side session on logout", async () => {
    const { exchange } = await bootstrapSession("logout@omdala.com");
    expect(exchange.status).toBe(200);
    const cookies = sessionCookieHeader(exchange);

    const logout = await app.request(
      "http://localhost/v1/auth/logout",
      { method: "POST", headers: { cookie: cookies } },
      stagingEnv,
    );
    expect(logout.status).toBe(200);
    await expect(logout.json()).resolves.toMatchObject({
      ok: true,
      data: { revoked: true },
    });

    const staleRefresh = await app.request(
      "http://localhost/v1/auth/refresh",
      { method: "POST", headers: { cookie: refreshCookie(cookies) } },
      stagingEnv,
    );
    expect(staleRefresh.status).toBe(401);
  });
});
