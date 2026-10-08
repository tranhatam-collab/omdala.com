import { test, expect } from "@playwright/test";

// Welcome Screen Smoke — static assertions for /workspace when no folder is opened.
// This is a separate suite from workspace-critical.spec.ts which tests IDE flows
// with a project fixture.

test.describe("OMCODE Welcome Screen — /workspace (no folder)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/workspace/");
  });

  test("01 — Welcome screen renders OMCODE title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "OMCODE", exact: true })).toBeVisible();
  });

  test("02 — Welcome screen shows open-folder button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Mở dự án/ })).toBeVisible();
  });

  test("03 — Welcome screen shows AI Code OS subtitle", async ({ page }) => {
    await expect(page.getByText("AI Code OS")).toBeVisible();
    await expect(page.getByText("Không cần đăng nhập")).toBeVisible();
  });

  test("04 — Welcome screen shows keyboard shortcut tips", async ({ page }) => {
    await expect(page.getByText("Phím tắt nhanh")).toBeVisible();
    await expect(page.getByText("AI Command Palette")).toBeVisible();
    await expect(page.getByText("Slash commands")).toBeVisible();
  });

  test("05 — /workspace/ returns 200", async ({ page }) => {
    const response = await page.goto("/workspace/");
    expect(response?.status()).toBe(200);
  });
});
