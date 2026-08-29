import { test, expect, type Page } from "@playwright/test";

// ─── Helpers ────────────────────────────────────────────────────────────

async function mockAuthedSession(page: Page) {
  await page.route("**/v1/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          authenticated: true,
          email: "operator@omdala.com",
          expiresAt: "2026-12-31T23:59:59.000Z",
        },
      }),
    });
  });
}

async function mockAccountRuntime(page: Page) {
  let profile = {
    id: "user_operator",
    email: "operator@omdala.com",
    displayName: "Omdala Operator",
    bio: "Runtime profile",
    timezone: "Asia/Ho_Chi_Minh",
    locale: "en",
  };
  let preferences = {
    language: "en",
    theme: "system",
    notifications: { email: true, push: true },
  };

  await page.route("**/v1/account/profile", async (route) => {
    if (route.request().method() === "PUT") {
      profile = { ...profile, ...route.request().postDataJSON() };
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: profile }),
    });
  });
  await page.route("**/v1/account/preferences", async (route) => {
    if (route.request().method() === "PUT") {
      preferences = { ...preferences, ...route.request().postDataJSON() };
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: preferences }),
    });
  });
  await page.route("**/v1/billing/subscriptions", async (route) => {
    const subscription = {
      id: "sub_operator",
      appId: "om-ai",
      planId: "om-ai-free",
      status: "active",
      billingCycle: "monthly",
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: { items: [subscription], total: 1, primary: subscription },
      }),
    });
  });
  await page.route("**/v1/billing/usage", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          appId: "om-ai",
          quota: { callMinutesDaily: 30 },
          used: { callMinutesToday: 4 },
          remaining: { callMinutesToday: 26 },
          eventNames: ["om-ai.call.started", "om-ai.call.ended"],
        },
      }),
    });
  });
  await page.route("**/v1/providers", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          appId: "om-ai",
          source: "memory-store",
          lastSyncedAt: "2026-08-29T00:00:00.000Z",
          items: [],
          total: 0,
        },
      }),
    });
  });
  await page.route("**/v1/providers/route?**", async (route) => {
    const capability = new URL(route.request().url()).searchParams.get("capability");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          appId: "om-ai",
          capability,
          providerId: "openai-responses",
          providerName: "OpenAI Responses",
          reason: "healthy primary",
          fallbackProviderId: "fallback-mock",
          score: 0.95,
        },
      }),
    });
  });
  await page.route("**/v2/reality/nodes", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          nodes: [{ id: "node_operator", status: "active" }],
          total: 1,
        },
      }),
    });
  });
  await page.route("**/v2/reality/trust", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          trust: [{ id: "trust_operator", score: 0.9 }],
          total: 1,
        },
      }),
    });
  });
  await page.route("**/v2/reality/proofs", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          proofs: [
            {
              id: "proof_operator",
              verificationStatus: "pending",
            },
          ],
          total: 1,
        },
      }),
    });
  });
  await page.route("**/v1/ai/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          providers: [{ provider: "openai", ok: true, latencyMs: 42 }],
          total: 1,
        },
      }),
    });
  });
}

// Mock the API to return 401 Unauthorized. This is a deterministic UI contract
// test only; staging acceptance covers the real signed-cookie session flow.
// The DashboardAuthGate calls hasValidServerSession() which fetches /v1/auth/session.
// With a 401 response, the gate redirects to auth.omdala.com/login.
// This tests redirect rendering without depending on a live API.
async function mockUnauthedSession(page: Page) {
  await page.route("**/v1/auth/session", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: { code: "unauthorized" } }),
    });
  });
}

// ─── Login page ─────────────────────────────────────────────────────────

test("login screen renders auth redirect link", async ({ page }) => {
  await page.goto("/login?lang=en");
  await page.waitForLoadState("networkidle");

  await expect(page.locator("h1")).toContainText(
    "Continue to the dedicated OMDALA auth surface.",
  );
  await expect(
    page.locator('a[href*="auth.omdala.com"]'),
  ).toBeVisible();
});

// ─── Mocked unauthenticated redirect contract ──────────────────────────

test("dashboard redirects when the mocked session endpoint returns 401", async ({ page }) => {
  await mockUnauthedSession(page);
  await page.context().clearCookies();
  await page.goto("/dashboard?lang=en");

  // DashboardAuthGate calls hasValidServerSession() which fetches
  // /v1/auth/session. With a 401 response, the gate redirects to auth.omdala.com/login.
  await expect(page).toHaveURL(/auth\.omdala\.com\/login/, { timeout: 15000 });

  const url = new URL(page.url());
  expect(url.searchParams.get("lang")).toBe("en");
  expect(url.searchParams.get("next")).toContain("/dashboard");
});

test("profile redirects when the mocked session endpoint returns 401", async ({ page }) => {
  await mockUnauthedSession(page);
  await page.context().clearCookies();
  await page.goto("/profile?lang=en");

  await expect(page).toHaveURL(/auth\.omdala\.com\/login/, { timeout: 15000 });
  const url = new URL(page.url());
  expect(url.searchParams.get("next")).toContain("/profile");
});

test("settings redirects when the mocked session endpoint returns 401", async ({ page }) => {
  await mockUnauthedSession(page);
  await page.context().clearCookies();
  await page.goto("/settings?lang=en");

  await expect(page).toHaveURL(/auth\.omdala\.com\/login/, { timeout: 15000 });
  const url = new URL(page.url());
  expect(url.searchParams.get("next")).toContain("/settings");
});

test("dashboard renders persisted account, reality, and AI health contracts", async ({ page }) => {
  await mockAuthedSession(page);
  await mockAccountRuntime(page);
  await page.goto("/dashboard?lang=en");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "Welcome back, Omdala Operator." })).toBeVisible();
  await expect(page.getByText("operator@omdala.com")).toBeVisible();
  await expect(page.getByText("om-ai-free")).toBeVisible();
  await expect(page.getByText("Connected")).toBeVisible();
  await expect(page.getByText("1/1")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open profile" })).toHaveAttribute(
    "href",
    "/profile/",
  );
  await expect(page.getByRole("link", { name: "Open OMCODE" })).toHaveAttribute(
    "href",
    "/workspace/",
  );
});

test("unreleased runtime routes never expose fixture records as live data", async ({ page }) => {
  await mockAuthedSession(page);

  for (const surface of ["nodes", "resources", "offers", "requests", "trust"] as const) {
    await page.goto(`/${surface}?lang=en`);
    const boundary = page.locator(
      `[data-release-state="unreleased"][data-runtime-surface="${surface}"]`,
    );
    await expect(boundary).toBeVisible();
    await expect(boundary).toContainText("is not released yet");
    await expect(boundary).toContainText("No fixture records are shown as live data.");
  }
});

// ─── Authenticated profile (Team 1 contract markers) ────────────────────

test("profile renders Team 1 account identity contract when session is valid", async ({ page }) => {
  await mockAuthedSession(page);
  await mockAccountRuntime(page);
  await page.goto("/profile?lang=en");
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByText("Manage the identity and preferences connected to your OMDALA account."),
  ).toBeVisible();

  // Account identity section
  await expect(page.getByRole("heading", { name: "Account identity" })).toBeVisible();
  await expect(page.getByText(/operator@omdala\.com/)).toBeVisible();
  await expect(page.getByText("Timezone: Asia/Ho_Chi_Minh")).toBeVisible();

  // Preferences section
  await expect(page.getByRole("heading", { name: "Profile and preference boundary" })).toBeVisible();
  await expect(page.getByText("Theme: system")).toBeVisible();

  // Profile update flow
  await expect(page.getByRole("heading", { name: "Profile update flow" })).toBeVisible();
  await page.getByLabel("Display name").fill("Updated Operator");
  await page.getByRole("button", { name: "Save profile contract" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Profile contract update completed.",
  );
  await expect(page.getByRole("heading", { name: "Updated Operator" })).toBeVisible();
});

// ─── Authenticated settings (Team 1 billing + provider routing) ─────────

test("settings renders Team 1 billing contract and provider routing when session is valid", async ({ page }) => {
  await mockAuthedSession(page);
  await mockAccountRuntime(page);
  await page.goto("/settings?lang=en");
  await page.waitForLoadState("networkidle");

  // Settings is the Team 1 entry point
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(
    page.getByText("Manage language, notifications, plan visibility, usage, and AI provider routing."),
  ).toBeVisible();

  // Billing contract summary
  await expect(page.getByRole("heading", { name: "Billing contract summary" })).toBeVisible();
  await expect(page.getByText(`App ID: ${'om-ai'}`)).toBeVisible();
  await expect(page.getByText("Billing cycle: monthly")).toBeVisible();
  await expect(page.getByText("Subscription visibility: limited visibility")).toBeVisible();
  await expect(page.getByText(/call minutes used today/i)).toBeVisible();
  await expect(page.getByText(/billing-aware provider events are now locked/i)).toBeVisible();

  // Beta gate
  await expect(page.getByRole("heading", { name: "Beta gate" })).toBeVisible();
  await expect(page.getByText("plan_not_eligible")).toBeVisible();

  // Provider routing snapshot
  await expect(page.getByRole("heading", { name: "Provider routing snapshot" })).toBeVisible();
  await expect(page.getByText(/Provider source: memory-store/i)).toBeVisible();
  // Each capability route should be listed with provider, fallback, and score
  const routeRows = page.locator("li", { hasText: /score/i });
  await expect(routeRows.first()).toBeVisible();
  expect(await routeRows.count()).toBeGreaterThanOrEqual(1);

  await page.getByLabel("Theme").selectOption("dark");
  await page.getByRole("button", { name: "Save preferences contract" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Preferences contract update completed.",
  );
});
