import { test, expect, type Page } from "@playwright/test";

// Mock the auth session API so DashboardAuthGate lets /workspace render.
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

// OMCODE Workspace E2E — tests the welcome screen and workspace shell.
// The File System Access API requires a user gesture to open a folder,
// so IDE panels (chat, terminal, editor) are tested via unit tests instead.
// These E2E tests verify the publicly reachable /workspace route renders.

test.describe("OMCODE Workspace — /workspace route", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthedSession(page);
    // trailingSlash: true → /workspace redirects to /workspace/
    await page.goto("/workspace/");
  });

  test("01 — Welcome screen renders OMCODE title and open-folder button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "OMCODE", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Mở dự án/ })).toBeVisible();
  });

  test("02 — Welcome screen shows AI Code OS subtitle", async ({ page }) => {
    await expect(page.getByText("AI Code OS")).toBeVisible();
    await expect(page.getByText("Không cần đăng nhập")).toBeVisible();
  });

  test("03 — Welcome screen shows keyboard shortcut tips", async ({ page }) => {
    await expect(page.getByText("Phím tắt nhanh")).toBeVisible();
    await expect(page.getByText("AI Command Palette")).toBeVisible();
    await expect(page.getByText("Slash commands")).toBeVisible();
  });

  test("04 — Welcome screen footer shows version info", async ({ page }) => {
    await expect(page.getByText(/OMCODE v0\.1/)).toBeVisible();
    await expect(page.getByText(/Monaco Editor/)).toBeVisible();
    await expect(page.getByText(/Git.*Terminal/)).toBeVisible();
  });

  test("05 — /workspace/ returns 200 and renders without client errors", async ({ page }) => {
    const response = await page.goto("/workspace/");
    expect(response?.status()).toBe(200);
  });
});
