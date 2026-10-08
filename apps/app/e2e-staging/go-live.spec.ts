import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const appUrl = process.env.E2E_STAGING_APP_URL!.replace(/\/+$/g, "");
const authUrl = process.env.E2E_STAGING_AUTH_URL!.replace(/\/+$/g, "");
const apiUrl = process.env.E2E_STAGING_API_URL!.replace(/\/+$/g, "");
const brandUrl = process.env.E2E_STAGING_BRAND_URL!.replace(/\/+$/g, "");
const webUrl = process.env.E2E_STAGING_WEB_URL!.replace(/\/+$/g, "");
const e2eSecret = process.env.E2E_TEST_SECRET!;
const releaseSha = process.env.E2E_RELEASE_SHA!;
const apiDeploymentId = process.env.E2E_API_DEPLOYMENT_ID!;
const surfaceReleaseId = process.env.E2E_SURFACE_RELEASE_ID!;
const aiCallEvidencePath =
  process.env.E2E_STAGING_AI_CALL_EVIDENCE ?? "staging-ai-call-evidence.json";
const mailSinkAddress = process.env.E2E_STAGING_MAIL_SINK_ADDRESS?.trim().toLowerCase() ?? "";
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailSinkAddress)) {
  throw new Error("E2E_STAGING_MAIL_SINK_ADDRESS must be a valid protected sink address");
}
const mailSinkAddressSha256 = createHash("sha256")
  .update(mailSinkAddress)
  .digest("hex");
const mailSinkEvidencePath =
  process.env.E2E_STAGING_MAIL_SINK_EVIDENCE ??
  "staging-mail-sink-evidence.json";

type StagingMailReceipt = {
  transport: string;
  providerMessageId: string;
  providerStatus: string;
  deliveryMode: string;
  sinkEnforced: boolean;
  workspaceId: string;
  originalRecipientCount: number;
  deliveredRecipientCount: number;
  recipientSetSha256: string;
};

function assertStagingSinkReceipt(receipt: StagingMailReceipt): void {
  expect(receipt).toMatchObject({
    transport: "mail-api",
    providerMessageId: expect.any(String),
    providerStatus: expect.any(String),
    deliveryMode: "sink",
    sinkEnforced: true,
    workspaceId: "omdala.com-staging",
    originalRecipientCount: 1,
    deliveredRecipientCount: 1,
    recipientSetSha256: mailSinkAddressSha256,
  });
  expect(receipt.providerMessageId.trim().length).toBeGreaterThan(0);
}

test.describe.serial("OMDALA exact-candidate staging acceptance", () => {
  test("API health binds the deployed runtime to the candidate SHA and database", async ({ request }) => {
    const shallow = await request.get(`${apiUrl}/health`);
    expect(shallow.status()).toBe(200);
    const shallowBody = await shallow.json();
    expect(shallowBody).toMatchObject({
      ok: true,
      environment: "staging",
      release_sha: releaseSha,
      version_id: apiDeploymentId,
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

  test("Web, App, Auth, and Brand render from staging", async ({ page }) => {
    for (const [surface, baseUrl] of [
      ["web", webUrl],
      ["app", appUrl],
      ["auth", authUrl],
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

    const authResponse = await page.goto(`${authUrl}/login/`);
    expect(authResponse?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("OMDALA");

    const googleStart = await page.request.get(`${apiUrl}/v1/auth/google/start`, {
      maxRedirects: 0,
    });
    expect(googleStart.status()).toBe(302);
    const googleLocation = new URL(googleStart.headers().location);
    expect(googleLocation.origin).toBe("https://accounts.google.com");
    expect(googleLocation.searchParams.get("code_challenge_method")).toBe("S256");
    const googleCookies = googleStart
      .headersArray()
      .filter(({ name }) => name.toLowerCase() === "set-cookie")
      .map(({ value }) => value);
    expect(googleCookies.some((value) => value.startsWith("__Host-omdala_google_state="))).toBe(true);
    expect(googleCookies.some((value) => value.startsWith("__Host-omdala_google_pkce="))).toBe(true);

    const brandResponse = await page.goto(`${brandUrl}/en`);
    expect(brandResponse?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Acquire a digital brand with the evidence attached." }),
    ).toBeVisible();
  });

  test("contact, access request, and magic-link mail flows reach the configured transport", async ({ request }) => {
    const email = `e2e-mail+${releaseSha.slice(0, 8)}-${Date.now()}@example.net`;

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
    const contactBody = await contact.json();
    expect(contactBody).toMatchObject({
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
    const accessRequestBody = await accessRequest.json();
    expect(accessRequestBody).toMatchObject({
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
    const magicLinkBody = await magicLink.json();
    expect(magicLinkBody).toMatchObject({
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

    const receipts = [
      ...contactBody.data.deliveryReceipts,
      ...accessRequestBody.data.deliveryReceipts,
      magicLinkBody.data.deliveryReceipt,
    ] as StagingMailReceipt[];
    expect(receipts).toHaveLength(5);
    for (const receipt of receipts) assertStagingSinkReceipt(receipt);

    writeFileSync(
      mailSinkEvidencePath,
      `${JSON.stringify(
        {
          schema_version: 1,
          verdict: "STAGING_MAIL_SINK_ACCEPTED",
          candidate_sha: releaseSha,
          consumer_version_id: apiDeploymentId,
          api_origin: apiUrl,
          workspace_id: "omdala.com-staging",
          delivery_mode: "sink",
          sink_enforced: true,
          sink_address_sha256: mailSinkAddressSha256,
          provider_message_count: receipts.length,
          provider_message_ids: receipts.map((receipt) => receipt.providerMessageId),
          provider_statuses: receipts.map((receipt) => receipt.providerStatus),
          original_recipient_count: receipts.reduce(
            (total, receipt) => total + receipt.originalRecipientCount,
            0,
          ),
          delivered_recipient_count: receipts.reduce(
            (total, receipt) => total + receipt.deliveredRecipientCount,
            0,
          ),
          sink_address_persisted: false,
          created_at: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
  });

  test("signed session, account readback, AIAGENT boundary, Brand handoff, protected App, and logout work end to end", async ({ context, page }) => {
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
    expect(connectorBody.data).toMatchObject({
      providers: ["aiagent"],
      total: 1,
      authority: {
        provider: "aiagent",
        configured: true,
        origin: "https://staging-api.aiagent.iai.one",
        contractVersion: "1.0.0",
        tenant: "omdala-com",
        probe: "configuration-only",
        directUpstreamAllowed: false,
      },
    });

    const providerHealth = await context.request.get(`${apiUrl}/v1/ai/health`);
    expect(providerHealth.status()).toBe(200);
    const providerHealthBody = await providerHealth.json();
    expect(providerHealthBody.data).toMatchObject({
      total: 1,
      modelCallExecuted: false,
      providers: [
        {
          provider: "aiagent",
          configured: true,
          origin: "https://staging-api.aiagent.iai.one",
          contractVersion: "1.0.0",
          tenant: "omdala-com",
          probe: "configuration-only",
          directUpstreamAllowed: false,
        },
      ],
    });

    const modelCatalog = await context.request.get(`${apiUrl}/v1/ai/models`);
    expect(modelCatalog.status()).toBe(200);
    const modelCatalogBody = await modelCatalog.json();
    expect(modelCatalogBody).toMatchObject({
      ok: true,
      data: {
        authority: {
          provider: "aiagent",
          configured: true,
          ready: true,
          origin: "https://staging-api.aiagent.iai.one",
          contractVersion: "1.0.0",
          tenant: "omdala-com",
          workspace: "omdala-com-staging",
          directUpstreamAllowed: false,
        },
        models: expect.any(Array),
        total: expect.any(Number),
      },
    });
    expect(modelCatalogBody.data.models.length).toBeGreaterThan(0);
    expect(modelCatalogBody.data.total).toBe(modelCatalogBody.data.models.length);
    const chatModels = modelCatalogBody.data.models.filter(
      (model: { id?: unknown; capabilities?: unknown }) =>
        typeof model.id === "string" &&
        /^iai-one\/[a-z0-9][a-z0-9-]{1,63}$/.test(model.id) &&
        Array.isArray(model.capabilities) &&
        model.capabilities.includes("chat"),
    );
    const chatModel =
      chatModels.find((model: { id: string }) => model.id === "iai-one/iris-3") ??
      chatModels[0];
    if (!chatModel) throw new Error("The authenticated AIAGENT catalog has no chat model.");

    const aiChat = await context.request.post(`${apiUrl}/v1/ai/chat`, {
      headers: {
        "Idempotency-Key": `staging-e2e:${releaseSha}:${Date.now()}`,
      },
      data: {
        model: chatModel.id,
        messages: [
          {
            role: "user",
            content: "Reply only with OMDALA_STAGING_AI_OK.",
          },
        ],
        maxTokens: 16,
      },
    });
    expect(aiChat.status()).toBe(200);
    const aiChatBody = await aiChat.json();
    expect(aiChatBody).toMatchObject({
      ok: true,
      data: {
        response: expect.any(String),
        model: chatModel.id,
        request_id: expect.any(String),
        tenant_id: "omdala-com",
        workspace_id: "omdala-com-staging",
        run_id: expect.any(String),
        receipt_id: expect.any(String),
        ledger_entry_id: expect.any(String),
        usage: {
          input_tokens: expect.any(Number),
          output_tokens: expect.any(Number),
          total_tokens: expect.any(Number),
        },
        cost_usd: expect.any(Number),
        billing_eligible: true,
        cost_ledger_status: "reconciled",
      },
    });
    const aiEvidence = aiChatBody.data;
    expect(aiEvidence.response.trim().length).toBeGreaterThan(0);
    expect(Number.isSafeInteger(aiEvidence.usage.input_tokens)).toBe(true);
    expect(Number.isSafeInteger(aiEvidence.usage.output_tokens)).toBe(true);
    expect(aiEvidence.usage.input_tokens).toBeGreaterThanOrEqual(0);
    expect(aiEvidence.usage.output_tokens).toBeGreaterThanOrEqual(0);
    expect(aiEvidence.usage.total_tokens).toBe(
      aiEvidence.usage.input_tokens + aiEvidence.usage.output_tokens,
    );
    expect(Number.isFinite(aiEvidence.cost_usd)).toBe(true);
    expect(aiEvidence.cost_usd).toBeGreaterThanOrEqual(0);
    expect(aiEvidence.cost_usd).toBeLessThanOrEqual(0.25);

    writeFileSync(
      aiCallEvidencePath,
      `${JSON.stringify(
        {
          schema_version: 1,
          verdict: "STAGING_AI_CALL_ACCEPTED",
          candidate_sha: releaseSha,
          consumer_version_id: apiDeploymentId,
          api_origin: apiUrl,
          provider_origin: modelCatalogBody.data.authority.origin,
          tenant_id: aiEvidence.tenant_id,
          workspace_id: aiEvidence.workspace_id,
          catalog_selected: true,
          catalog_model_count: modelCatalogBody.data.total,
          model: aiEvidence.model,
          request_id: aiEvidence.request_id,
          run_id: aiEvidence.run_id,
          receipt_id: aiEvidence.receipt_id,
          ledger_entry_id: aiEvidence.ledger_entry_id,
          usage: aiEvidence.usage,
          authoritative_reconciled_cost_usd: aiEvidence.cost_usd,
          billing_eligible: aiEvidence.billing_eligible,
          cost_ledger_status: aiEvidence.cost_ledger_status,
          server_run_and_receipt_reconciliation_required: true,
          response_body_persisted: false,
          secret_values_logged: false,
          created_at: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      { encoding: "utf8", mode: 0o600 },
    );

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
    expect(completion.status()).toBe(501);
    await expect(completion.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "direct_ai_disabled" },
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

    await page.goto(`${appUrl}/brands`);
    const browseBrands = page.getByRole("link", { name: "Browse public brand packages" });
    const browseBrandsHref = await browseBrands.getAttribute("href");
    expect(browseBrandsHref).toBeTruthy();
    expect(new URL(browseBrandsHref!).origin).toBe(new URL(brandUrl).origin);

    await page.goto(`${brandUrl}/en/brands/omcode/inquiry?intent=submit_offer`);
    const handoff = page.getByRole("link", { name: "Continue to app-staging.omdala.com" });
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
