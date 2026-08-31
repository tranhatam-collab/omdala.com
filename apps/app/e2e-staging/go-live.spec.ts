import { expect, test } from "@playwright/test";

const appUrl = process.env.E2E_STAGING_APP_URL!.replace(/\/+$/g, "");
const apiUrl = process.env.E2E_STAGING_API_URL!.replace(/\/+$/g, "");
const brandUrl = process.env.E2E_STAGING_BRAND_URL!.replace(/\/+$/g, "");
const webUrl = process.env.E2E_STAGING_WEB_URL!.replace(/\/+$/g, "");
const e2eSecret = process.env.E2E_TEST_SECRET!;
const releaseSha = process.env.E2E_RELEASE_SHA!;
const apiDeploymentId = process.env.E2E_API_DEPLOYMENT_ID!;
const surfaceReleaseId = process.env.E2E_SURFACE_RELEASE_ID!;

test.describe.serial("OMDALA exact-candidate staging acceptance", () => {
  test("API health binds the deployed runtime to the candidate SHA and database", async ({ request }) => {
    const shallow = await request.get(`${apiUrl}/health`);
    expect(shallow.status()).toBe(200);
    const shallowBody = await shallow.json();
    expect(shallowBody).toMatchObject({
      ok: true,
      environment: "staging",
      release_sha: releaseSha,
      deployment_id: apiDeploymentId,
    });

    const deep = await request.get(`${apiUrl}/health/deep`);
    expect(deep.status()).toBe(200);
    await expect(deep.json()).resolves.toMatchObject({
      ok: true,
      status: "ok",
      release_sha: releaseSha,
      deployment_id: apiDeploymentId,
      checks: { identity: "ok", database: "ok", schema: "ok" },
    });
  });

  test("Web, App workspace, and Brand Exchange render from staging", async ({ page }) => {
    for (const [surface, baseUrl] of [
      ["web", webUrl],
      ["app", appUrl],
      ["brand", brandUrl],
    ] as const) {
      const release = await page.request.get(`${baseUrl}/release.json`);
      expect(release.status()).toBe(200);
      await expect(release.json()).resolves.toMatchObject({
        surface,
        environment: "staging",
        release_sha: releaseSha,
        release_id: surfaceReleaseId,
      });
    }

    const webResponse = await page.goto(webUrl);
    expect(webResponse?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("OMDALA");

    const workspaceResponse = await page.goto(`${appUrl}/workspace/`);
    expect(workspaceResponse?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "OMCODE", exact: true })).toBeVisible();

    const brandResponse = await page.goto(`${brandUrl}/en`);
    expect(brandResponse?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Acquire a digital brand with the evidence attached." }),
    ).toBeVisible();
  });

  test("contact, access request, and magic-link mail flows reach the configured transport", async ({ request }) => {
    const email = `e2e-mail+${releaseSha.slice(0, 8)}-${Date.now()}@omdala.com`;

    const contact = await request.post(`${apiUrl}/v1/contact`, {
      data: {
        name: "OMDALA staging acceptance",
        email,
        organization: "OMDALA",
        topic: "platform",
        message: `Exact-candidate contact canary for ${releaseSha}.`,
        source: "staging-go-live-e2e",
      },
    });
    expect(contact.status()).toBe(200);
    await expect(contact.json()).resolves.toMatchObject({
      ok: true,
      data: {
        received: true,
        deliveryReceipts: [
          {
            transport: "mail-api",
            providerMessageId: expect.any(String),
            providerStatus: expect.any(String),
          },
          {
            transport: "mail-api",
            providerMessageId: expect.any(String),
            providerStatus: expect.any(String),
          },
        ],
      },
    });

    const accessRequest = await request.post(`${apiUrl}/v1/auth/access-request`, {
      data: {
        email,
        role: "staging_e2e",
        nodeName: "Exact candidate acceptance",
        note: `Access-request canary for ${releaseSha}.`,
      },
    });
    expect(accessRequest.status()).toBe(201);
    await expect(accessRequest.json()).resolves.toMatchObject({
      ok: true,
      data: {
        received: true,
        deliveryReceipts: [
          {
            transport: "mail-api",
            providerMessageId: expect.any(String),
            providerStatus: expect.any(String),
          },
          {
            transport: "mail-api",
            providerMessageId: expect.any(String),
            providerStatus: expect.any(String),
          },
        ],
      },
    });

    const magicLink = await request.post(`${apiUrl}/v1/auth/magic-link/request`, {
      data: { email, redirectTo: "/profile?lang=en" },
    });
    expect(magicLink.status()).toBe(201);
    await expect(magicLink.json()).resolves.toMatchObject({
      ok: true,
      data: {
        sent: true,
        deliveryReceipt: {
          transport: "mail-api",
          providerMessageId: expect.any(String),
          providerStatus: expect.any(String),
        },
      },
    });
  });

  test("signed session, account readback, AI provider, Brand handoff, protected App, and logout work end to end", async ({ context, page }) => {
    const email = `e2e+${releaseSha.slice(0, 12)}@omdala.com`;
    const bootstrap = await context.request.post(`${apiUrl}/v1/_e2e/magic-link`, {
      headers: { "x-e2e-test-secret": e2eSecret },
      data: { email, redirectTo: "/profile?lang=en" },
    });
    expect(bootstrap.status()).toBe(201);
    const bootstrapBody = await bootstrap.json();

    const exchange = await context.request.post(`${apiUrl}/v1/auth/session/exchange`, {
      data: { token: bootstrapBody.data.token, next: "/profile?lang=en" },
    });
    expect(exchange.status()).toBe(200);

    const session = await context.request.get(`${apiUrl}/v1/auth/session`);
    expect(session.status()).toBe(200);
    await expect(session.json()).resolves.toMatchObject({
      ok: true,
      data: { authenticated: true, email },
    });

    const displayName = `E2E ${releaseSha.slice(0, 8)}`;
    const profileUpdate = await context.request.put(`${apiUrl}/v1/account/profile`, {
      data: {
        displayName,
        timezone: "UTC",
        locale: "en",
      },
    });
    expect(profileUpdate.status()).toBe(200);
    const profileReadback = await context.request.get(`${apiUrl}/v1/account/profile`);
    expect(profileReadback.status()).toBe(200);
    await expect(profileReadback.json()).resolves.toMatchObject({
      ok: true,
      data: { email, displayName, timezone: "UTC", locale: "en" },
    });

    const preferenceUpdate = await context.request.put(`${apiUrl}/v1/account/preferences`, {
      data: {
        language: "en",
        theme: "dark",
        notifications: { email: false, push: true },
      },
    });
    expect(preferenceUpdate.status()).toBe(200);
    const preferenceReadback = await context.request.get(`${apiUrl}/v1/account/preferences`);
    await expect(preferenceReadback.json()).resolves.toMatchObject({
      ok: true,
      data: {
        language: "en",
        theme: "dark",
        notifications: { email: false, push: true },
      },
    });

    for (const path of [
      "/v2/reality/nodes",
      "/v2/reality/proofs",
      "/v2/reality/trust",
    ]) {
      const realityResponse = await context.request.get(`${apiUrl}${path}`);
      expect(realityResponse.status()).toBe(200);
      await expect(realityResponse.json()).resolves.toMatchObject({
        ok: true,
        data: { total: expect.any(Number) },
      });
    }

    const unreleasedRealityRoute = await context.request.get(
      `${apiUrl}/v2/reality/states`,
    );
    expect(unreleasedRealityRoute.status()).toBe(501);
    await expect(unreleasedRealityRoute.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "REALITY_ROUTE_NOT_RELEASED" },
    });

    const connectors = await context.request.get(`${apiUrl}/v1/ai/connectors`);
    expect(connectors.status()).toBe(200);
    const connectorBody = await connectors.json();
    expect(connectorBody.data.total).toBeGreaterThan(0);

    const providerHealth = await context.request.get(`${apiUrl}/v1/ai/health`);
    expect(providerHealth.status()).toBe(200);
    const providerHealthBody = await providerHealth.json();
    expect(
      providerHealthBody.data.providers.some(
        (provider: { ok?: boolean }) => provider.ok === true,
      ),
    ).toBe(true);

    const completion = await context.request.post(`${apiUrl}/v1/ai/complete`, {
      data: {
        messages: [
          {
            role: "user",
            content: "Reply with the single word OMDALA_READY.",
          },
        ],
        maxTokens: 16,
        temperature: 0,
      },
    });
    expect(completion.status()).toBe(200);
    await expect(completion.json()).resolves.toMatchObject({
      ok: true,
      data: {
        content: expect.stringMatching(/OMDALA_READY/i),
        provider: expect.any(String),
        model: expect.any(String),
      },
    });

    await page.goto(`${appUrl}/profile?lang=en`);
    await expect(page).toHaveURL(/\/profile\/?\?lang=en$/);
    await expect(page.getByRole("heading", { name: "Account identity" })).toBeVisible();

    await page.goto(`${appUrl}/dashboard?lang=en`);
    await expect(
      page.getByRole("heading", { name: `Welcome back, ${displayName}.` }),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText("Connected")).toBeVisible();

    await page.goto(`${brandUrl}/en/brands/omcode/inquiry?intent=submit_offer`);
    const handoff = page.getByRole("link", { name: "Continue to app.omdala.com" });
    const href = await handoff.getAttribute("href");
    expect(href).toBeTruthy();
    expect(new URL(href!).origin).toBe(new URL(appUrl).origin);

    await page.goto(href!);
    await expect(page).toHaveURL(/\/brands\/omcode\/?\?intent=submit_offer$/);
    await expect(page.getByRole("heading", { name: "omcode", exact: false })).toBeVisible();

    const logout = await context.request.post(`${apiUrl}/v1/auth/logout`);
    expect(logout.status()).toBe(200);
    const afterLogout = await context.request.get(`${apiUrl}/v1/auth/session`);
    expect(afterLogout.status()).toBe(401);
    const realityAfterLogout = await context.request.get(
      `${apiUrl}/v2/reality/nodes`,
    );
    expect(realityAfterLogout.status()).toBe(401);
  });
});
