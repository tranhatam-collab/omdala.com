import { test, expect } from "@playwright/test";
import { injectWorkspaceFixture } from "./fixtures/workspace-fixture";

// OMCODE Critical IDE Flows — tests AI Chat, Terminal, Language toggle,
// and Account panel. Uses a mock FileSystemDirectoryHandle fixture so
// the workspace opens in CI without the native folder picker.
// The fixture is auto-opened via ?fixture=1 query param (see useFileSystem.ts).

test.describe("OMCODE Critical Flows — IDE with project fixture", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/v1/ai/models", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: { code: "aiagent_catalog_unavailable", message: "AIAGENT catalog unavailable" },
        }),
      });
    });
    await injectWorkspaceFixture(page);
    // Pre-accept terms via localStorage to skip the Terms modal
    await page.addInitScript(() => {
      try { localStorage.setItem("omcode:terms:accepted:v1", "true"); } catch {}
    });
    await page.goto("/workspace/?fixture=1");
    // Wait for workspace to load (top bar shows "OMDALA Workspace")
    await expect(page.getByText("OMDALA Workspace")).toBeVisible({ timeout: 20000 });
  });

  test("01 — IDE renders with file explorer and project name", async ({ page }) => {
    await expect(page.getByText("test-project", { exact: true })).toBeVisible();
    await expect(page.getByText("src", { exact: true })).toBeVisible();
    await expect(page.getByText("package.json", { exact: true })).toBeVisible();
  });

  test("02 — AI Chat accepts input and fails closed without a verified AIAGENT catalog", async ({ page }) => {
    // Chat panel is open by default (chatOpen = true)
    // The chat input is a textarea with placeholder containing "Hỏi AI"
    const input = page.locator('textarea[placeholder*="Hỏi AI"]');
    await expect(input).toBeVisible({ timeout: 15000 });
    await input.fill("Hello AI");
    await input.press("Enter");
    // The user message should appear in the chat
    await expect(page.getByText("Hello AI").first()).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText(/Lỗi: AIAGENT_VERIFIED_CATALOG_REQUIRED/),
    ).toBeVisible({ timeout: 10000 });
  });

  test("03 — Language toggle switches EN/VI", async ({ page }) => {
    const langBtn = page.locator("button").filter({ hasText: /VI 🇻🇳|EN 🇺🇸/ });
    const initialText = await langBtn.textContent();
    await langBtn.click({ noWaitAfter: true });
    await expect(langBtn).not.toHaveText(initialText ?? "", { timeout: 10000 });
  });

  test("04 — Terminal panel opens and accepts command", async ({ page }) => {
    const termBtn = page.locator("button").filter({ hasText: /^Terminal$/ }).first();
    await termBtn.click({ noWaitAfter: true });
    const termInput = page.locator('input[placeholder*="Nhập lệnh"]');
    await expect(termInput).toBeVisible({ timeout: 10000 });
    await termInput.fill("help");
    await termInput.press("Enter");
    // The help output should list available commands
    await expect(page.getByText(/Lệnh có sẵn/)).toBeVisible({ timeout: 10000 });
  });

  test("05 — Account panel exposes the session-bound AIAGENT authority and fails closed", async ({ page }) => {
    const accountBtn = page.locator("button[title*='Plans'], button[title*='Gói dịch vụ']").first();
    await accountBtn.click({ noWaitAfter: true });
    await expect(
      page.getByText("OMDALA session → AIAGENT contract 1.0.0"),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText(/Browser chỉ gọi API OMDALA đã khóa theo môi trường/),
    ).toBeVisible();
    await expect(page.getByText("AIAGENT catalog unavailable")).toBeVisible();
  });
});
