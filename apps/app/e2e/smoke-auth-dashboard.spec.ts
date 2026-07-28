import { test, expect, type Page } from "@playwright/test";

// Mock the auth session API so DashboardAuthGate lets pages render.
// Without this, all (dashboard) routes redirect to auth.omdala.com.
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

test("dashboard renders with mock session data", async ({ page }) => {
  await mockAuthedSession(page);
  await page.goto("/dashboard?lang=en");
  await page.waitForLoadState("networkidle");

  // Dashboard shows welcome message with operator name
  await expect(
    page.getByRole("heading", { name: /Welcome back.*OMDALA Operator/i }),
  ).toBeVisible();
});

test("profile renders identity and trust sections from mock session", async ({ page }) => {
  await mockAuthedSession(page);
  await page.goto("/profile?lang=en");
  await page.waitForLoadState("networkidle");

  // Profile page shows the mock session user
  await expect(
    page.getByRole("heading", { name: "OMDALA Operator" }),
  ).toBeVisible();

  // Identity section with email
  await expect(page.getByText(/operator@omdala\.com/)).toBeVisible();

  // Trust section
  await expect(page.getByText("Primary trust")).toBeVisible({ timeout: 15000 });
});

test("settings renders runtime panels with active app state", async ({ page }) => {
  await mockAuthedSession(page);
  await page.goto("/settings?lang=en");
  await page.waitForLoadState("networkidle");

  // Settings heading
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Settings Runtime")).toBeVisible();

  // Dashboard stat cards
  await expect(page.getByText("Language mode")).toBeVisible();
  await expect(page.getByText("Unread notifications")).toBeVisible();
  await expect(page.getByText("Proof queue pressure")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("AI assist cadence")).toBeVisible();
});
