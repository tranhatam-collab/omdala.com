import { expect, test, type APIResponse } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { validateProductionE2EEnvironment } from "../../../scripts/production-e2e-config.mjs";

const production = validateProductionE2EEnvironment();

async function requireDirectResponse(response: APIResponse, expectedUrl: string) {
  expect(response.status()).toBe(200);
  expect(response.url()).toBe(expectedUrl);
}

function requireSecureHostOnlyCookie(rawCookie: string, name: string) {
  expect(rawCookie).toMatch(new RegExp(`^${name}=[^;]+;`, "i"));
  expect(rawCookie).toMatch(/;\s*Path=\//i);
  expect(rawCookie).toMatch(/;\s*HttpOnly(?:;|$)/i);
  expect(rawCookie).toMatch(/;\s*Secure(?:;|$)/i);
  expect(rawCookie).toMatch(/;\s*SameSite=Lax(?:;|$)/i);
  expect(rawCookie).not.toMatch(/;\s*Domain=/i);
}

function setCookieHeaders(response: APIResponse) {
  return response
    .headersArray()
    .filter(({ name }) => name.toLowerCase() === "set-cookie")
    .map(({ value }) => value);
}

test.describe.serial("OMDALA merged-main production acceptance", () => {
  test("production API health and deep-health bind exact runtime identity", async ({ request }) => {
    const healthUrl = `${production.apiUrl}/health`;
    const shallow = await request.get(healthUrl, { maxRedirects: 0 });
    await requireDirectResponse(shallow, healthUrl);
    await expect(shallow.json()).resolves.toMatchObject({
      ok: true,
      environment: "production",
      release_sha: production.releaseSha,
      version_id: production.apiVersionId,
      deployment_id: production.apiVersionId,
    });

    const deepUrl = `${production.apiUrl}/health/deep`;
    const deep = await request.get(deepUrl, { maxRedirects: 0 });
    await requireDirectResponse(deep, deepUrl);
    await expect(deep.json()).resolves.toMatchObject({
      ok: true,
      status: "ok",
      environment: "production",
      release_sha: production.releaseSha,
      version_id: production.apiVersionId,
      deployment_id: production.apiVersionId,
      checks: { identity: "ok", database: "ok", schema: "ok" },
    });
  });

  test("all four production release manifests bind the exact release", async ({ request }) => {
    for (const [surface, baseUrl] of [
      ["web", production.webUrl],
      ["app", production.appUrl],
      ["auth", production.authUrl],
      ["brand", production.brandUrl],
    ] as const) {
      const releaseUrl = `${baseUrl}/release.json`;
      const response = await request.get(releaseUrl, { maxRedirects: 0 });
      await requireDirectResponse(response, releaseUrl);
      await expect(response.json()).resolves.toMatchObject({
        schema_version: 1,
        surface,
        environment: "production",
        release_sha: production.releaseSha,
        release_id: production.surfaceReleaseId,
        asset_manifest_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        asset_file_count: expect.any(Number),
      });
    }
  });

  test("public production navigation remains canonical", async ({ page }) => {
    const web = await page.goto(production.webUrl, { waitUntil: "domcontentloaded" });
    expect(web?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("OMDALA");
    const appHref = await page
      .locator(`a[href^="${production.appUrl}"]`)
      .first()
      .getAttribute("href");
    expect(appHref).toBeTruthy();
    expect(new URL(appHref!).origin).toBe(production.appUrl);

    const appLogin = await page.goto(`${production.appUrl}/login/`, {
      waitUntil: "domcontentloaded",
    });
    expect(appLogin?.status()).toBe(200);
    const authHref = await page
      .locator(`a[href^="${production.authUrl}"]`)
      .first()
      .getAttribute("href");
    expect(authHref).toBeTruthy();
    expect(new URL(authHref!).origin).toBe(production.authUrl);

    const auth = await page.goto(`${production.authUrl}/login/`, {
      waitUntil: "domcontentloaded",
    });
    expect(auth?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("OMDALA");

    const googleStart = await page.request.get(
      `${production.apiUrl}/v1/auth/google/start`,
      { maxRedirects: 0 },
    );
    expect(googleStart.status()).toBe(302);
    const googleLocation = new URL(googleStart.headers().location);
    expect(googleLocation.origin).toBe("https://accounts.google.com");
    expect(googleLocation.searchParams.get("code_challenge_method")).toBe("S256");
    const googleCookies = setCookieHeaders(googleStart);
    expect(googleCookies.some((value) => value.startsWith("__Host-omdala_google_state="))).toBe(true);
    expect(googleCookies.some((value) => value.startsWith("__Host-omdala_google_pkce="))).toBe(true);

    const brand = await page.goto(
      `${production.brandUrl}/en/brands/omcode/inquiry?intent=submit_offer`,
      { waitUntil: "domcontentloaded" },
    );
    expect(brand?.status()).toBe(200);
    const handoffHref = await page
      .locator(`a[href^="${production.appUrl}/brands/"]`)
      .first()
      .getAttribute("href");
    expect(handoffHref).toBeTruthy();
    expect(new URL(handoffHref!).origin).toBe(production.appUrl);
  });

  test("magic-link exchange verifies session, zero model egress, and logout", async ({
    context,
    page,
  }) => {
    let modelOrSpendRequestsObserved = 0;
    await context.route(
      `${new URL("/v1/ai/chat", production.apiUrl).href}*`,
      async (route) => {
        modelOrSpendRequestsObserved += 1;
        await route.abort("blockedbyclient");
      },
    );
    const exchange = await context.request.post(
      `${production.apiUrl}/v1/auth/session/exchange`,
      {
        data: {
          token: production.magicLinkToken,
          next: "/dashboard?lang=en",
        },
      },
    );
    expect(exchange.status()).toBe(200);
    const exchangeBody = await exchange.json();
    expect(exchangeBody).toMatchObject({
      ok: true,
      data: {
        authenticated: true,
        email: expect.any(String),
        redirectTo: "/dashboard?lang=en",
        appBaseUrl: production.appUrl,
        authBaseUrl: production.authUrl,
        webBaseUrl: production.webUrl,
        apiBaseUrl: production.apiUrl,
      },
    });

    const exchangeCookies = setCookieHeaders(exchange);
    expect(exchangeCookies).toHaveLength(2);
    requireSecureHostOnlyCookie(
      exchangeCookies.find((cookie) => /^omdala_access_token=/i.test(cookie)) ?? "",
      "omdala_access_token",
    );
    requireSecureHostOnlyCookie(
      exchangeCookies.find((cookie) => /^omdala_refresh_token=/i.test(cookie)) ?? "",
      "omdala_refresh_token",
    );
    const preLogoutRefreshCookie = exchangeCookies
      .find((cookie) => /^omdala_refresh_token=/i.test(cookie))!
      .split(";", 1)[0]!;

    const replayedMagicLink = await context.request.post(
      `${production.apiUrl}/v1/auth/session/exchange`,
      { data: { token: production.magicLinkToken, next: "/dashboard?lang=en" } },
    );
    expect(replayedMagicLink.status()).toBe(401);

    const session = await context.request.get(`${production.apiUrl}/v1/auth/session`);
    expect(session.status()).toBe(200);
    await expect(session.json()).resolves.toMatchObject({
      ok: true,
      data: {
        authenticated: true,
        email: exchangeBody.data.email,
      },
    });

    const dashboard = await page.goto(`${production.appUrl}/dashboard?lang=en`, {
      waitUntil: "domcontentloaded",
    });
    expect(dashboard?.status()).toBe(200);
    await expect(page.getByText(exchangeBody.data.email).first()).toBeVisible();

    const configurationHealth = await context.request.get(
      `${production.apiUrl}/v1/ai/health`,
    );
    expect(configurationHealth.status()).toBe(200);
    const configurationHealthBody = await configurationHealth.json();
    expect(configurationHealthBody).toMatchObject({
      ok: true,
      data: {
        modelCallExecuted: false,
        total: 1,
        providers: [
          {
            provider: "aiagent",
            configured: true,
            origin: "https://api.aiagent.iai.one",
            contractVersion: "1.0.0",
            tenant: "omdala-com",
            probe: "configuration-only",
            directUpstreamAllowed: false,
          },
        ],
      },
    });
    for (const provider of configurationHealthBody.data.providers) {
      expect(provider).toMatchObject({
        configured: true,
        probe: "configuration-only",
      });
      expect(provider).not.toHaveProperty("ok");
    }
    expect(modelOrSpendRequestsObserved).toBe(0);

    const logout = await context.request.post(`${production.apiUrl}/v1/auth/logout`);
    expect(logout.status()).toBe(200);
    const clearCookies = setCookieHeaders(logout);
    expect(clearCookies).toHaveLength(2);
    for (const name of ["omdala_access_token", "omdala_refresh_token"]) {
      const cookie = clearCookies.find((value) =>
        new RegExp(`^${name}=`, "i").test(value),
      );
      expect(cookie).toBeTruthy();
      requireSecureHostOnlyCookie(cookie!, name);
      expect(cookie).toMatch(/;\s*Max-Age=0(?:;|$)/i);
    }

    const afterLogout = await context.request.get(
      `${production.apiUrl}/v1/auth/session`,
    );
    expect(afterLogout.status()).toBe(401);
    const remainingSessionCookies = (await context.cookies(production.apiUrl)).filter(
      ({ name }) =>
        name === "omdala_access_token" || name === "omdala_refresh_token",
    );
    expect(remainingSessionCookies).toHaveLength(0);

    const staleRefresh = await context.request.post(
      `${production.apiUrl}/v1/auth/refresh`,
      { headers: { cookie: preLogoutRefreshCookie } },
    );
    expect(staleRefresh.status()).toBe(401);

    writeFileSync(
      process.env.E2E_PRODUCTION_NO_SPEND_RECEIPT ??
        "production-no-spend-runtime.json",
      `${JSON.stringify(
        {
          schema_version: 1,
          verdict: "PRODUCTION_NO_SPEND_RUNTIME_VERIFIED",
          release_sha: production.releaseSha,
          checked_endpoint: `${production.apiUrl}/v1/ai/health`,
          model_or_spend_requests_observed: modelOrSpendRequestsObserved,
          health_model_call_executed: configurationHealthBody.data.modelCallExecuted,
          configuration_only: configurationHealthBody.data.providers.every(
            (provider: { configured?: boolean; probe?: string }) =>
              provider.configured === true && provider.probe === "configuration-only",
          ),
          checked_at: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  });
});
