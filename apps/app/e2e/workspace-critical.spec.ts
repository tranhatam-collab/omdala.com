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

test.describe("Workspace chrome", () => {
  test("the global language switcher does not cover the IDE toolbar", async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem("omcode:terms:accepted:v1", "true"); } catch {}
    });
    await injectWorkspaceFixture(page);
    await page.goto("/workspace/?fixture=1");
    await expect(page.getByText("OMDALA Workspace")).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".language-switcher")).toHaveCount(0);
  });
});

// WO-T3-20: `next dev` has no CSP, so a CDN load would go unnoticed there; assert it directly.
test.describe("Monaco assets in development", () => {
  test("the editor loads from this origin, never from a CDN", async ({ page, baseURL }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.route("**/v1/ai/models", (route) => route.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await injectWorkspaceFixture(page);
    await page.addInitScript(() => {
      try { localStorage.setItem("omcode:terms:accepted:v1", "true"); } catch {}
    });
    await page.goto("/workspace/?fixture=1");
    await expect(page.getByText("OMDALA Workspace")).toBeVisible({ timeout: 20000 });
    await page.getByText("package.json", { exact: true }).click();
    await expect(page.locator(".monaco-editor").first()).toBeVisible({ timeout: 30000 });
    expect(requests.some((url) => url.includes("/monaco/vs/editor/editor.main.js"))).toBe(true);
    expect(requests.filter((url) => /jsdelivr|unpkg|cdnjs/.test(url))).toEqual([]);
    const origin = new URL(baseURL!).origin;
    expect(requests.filter((url) => /^https?:/.test(url) && ![origin, "https://api.omdala.com"].includes(new URL(url).origin))).toEqual([]);
  });
});
