import { describe, expect, it } from "vitest";
import app from "./index";

const stagingEnv = {
  ENVIRONMENT: "staging",
  MAGIC_LINK_SECRET: "test_magic_link_secret_at_least_32_chars",
  E2E_TEST_SECRET: "test_e2e_bootstrap_secret_at_least_32_chars",
  APP_BASE_URL: "https://app.staging.omdala.com",
};

function accessCookie(response: Response): string {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/omdala_access_token=([^;,]+)/);
  if (!match?.[1]) throw new Error("Session exchange did not set an access cookie");
  return `omdala_access_token=${match[1]}`;
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
});
