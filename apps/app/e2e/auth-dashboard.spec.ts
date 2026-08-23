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

// Mock the API to return 401 Unauthorized — simulates a real invalid session.
// The DashboardAuthGate calls hasValidServerSession() which fetches /v1/auth/session.
// With a 401 response, the gate redirects to auth.omdala.com/login.
// This tests the real unauthenticated redirect contract without a network hang.
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

// ─── Real unauthenticated redirect (no mock) ────────────────────────────

test("dashboard redirects to auth.omdala.com when session is missing", async ({ page }) => {
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

test("profile redirects to auth.omdala.com when session is missing", async ({ page }) => {
  await mockUnauthedSession(page);
  await page.context().clearCookies();
  await page.goto("/profile?lang=en");

  await expect(page).toHaveURL(/auth\.omdala\.com\/login/, { timeout: 15000 });
  const url = new URL(page.url());
  expect(url.searchParams.get("next")).toContain("/profile");
});

test("settings redirects to auth.omdala.com when session is missing", async ({ page }) => {
  await mockUnauthedSession(page);
  await page.context().clearCookies();
  await page.goto("/settings?lang=en");

  await expect(page).toHaveURL(/auth\.omdala\.com\/login/, { timeout: 15000 });
  const url = new URL(page.url());
  expect(url.searchParams.get("next")).toContain("/settings");
});

// ─── Authenticated profile (Team 1 contract markers) ────────────────────

test("profile renders Team 1 account identity contract when session is valid", async ({ page }) => {
  await mockAuthedSession(page);
  await page.goto("/profile?lang=en");
  await page.waitForLoadState("networkidle");

  // Profile is the Team 1 entry point
  await expect(page.getByText("Profile is now the Team 1 entry point")).toBeVisible();

  // Account identity section
  await expect(page.getByRole("heading", { name: "Account identity" })).toBeVisible();
  await expect(page.getByText(/operator@omdala\.com/)).toBeVisible();
  await expect(page.getByText("Timezone: Asia/Ho_Chi_Minh")).toBeVisible();

  // Preferences section
  await expect(page.getByRole("heading", { name: "Preferences" })).toBeVisible();
  await expect(page.getByText("Theme: system")).toBeVisible();

  // Profile update flow
  await expect(page.getByRole("heading", { name: "Profile update flow" })).toBeVisible();
  await expect(page.getByText("Save profile contract")).toBeVisible();
});

// ─── Authenticated settings (Team 1 billing + provider routing) ─────────

test("settings renders Team 1 billing contract and provider routing when session is valid", async ({ page }) => {
  await mockAuthedSession(page);
  await page.goto("/settings?lang=en");
  await page.waitForLoadState("networkidle");

  // Settings is the Team 1 entry point
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Settings is the Team 1 entry point")).toBeVisible();

  // Billing contract summary
  await expect(page.getByRole("heading", { name: "Billing contract summary" })).toBeVisible();
  await expect(page.getByText(`App ID: ${'om-ai'}`)).toBeVisible();
  await expect(page.getByText("Billing cycle: monthly")).toBeVisible();
  await expect(page.getByText("Subscription visibility: full")).toBeVisible();
  await expect(page.getByText(/call minutes used today/i)).toBeVisible();
  await expect(page.getByText(/billing-aware Om AI events are now locked/i)).toBeVisible();

  // Beta gate
  await expect(page.getByRole("heading", { name: "Beta gate" })).toBeVisible();
  await expect(page.locator(".dashboard-stat strong", { hasText: "Beta gate" })).toBeVisible();

  // Provider routing snapshot
  await expect(page.getByRole("heading", { name: "Provider routing snapshot" })).toBeVisible();
  await expect(page.getByText(/Provider source: API live/i)).toBeVisible();
  // Each capability route should be listed with provider, fallback, and score
  const routeRows = page.locator("li", { hasText: /điểm số/i });
  await expect(routeRows.first()).toBeVisible();
  expect(await routeRows.count()).toBeGreaterThanOrEqual(1);
});
