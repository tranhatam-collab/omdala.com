import { test, expect } from "@playwright/test";

test.describe("OMCODE Critical Flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/workspace");
    // Accept terms if modal appears
    const acceptBtn = page.locator('button:has-text("Tôi Hiểu Rủi ro")');
    if (await acceptBtn.isVisible().catch(() => false)) {
      await acceptBtn.click();
    }
  });

  test("01 — Welcome screen renders and can open project picker", async ({ page }) => {
    await expect(page.locator('text=OMCODE Workspace')).toBeVisible();
    await expect(page.locator('text=Mở dự án')).toBeVisible();
  });

  test("02 — AI Chat panel sends message and shows response UI", async ({ page }) => {
    const chatBtn = page.locator('button:has-text("Chat AI")');
    await chatBtn.click();
    const input = page.locator('input[placeholder*="Hỏi AI"]').or(page.locator('input[placeholder*="Ask AI"]'));
    await expect(input).toBeVisible();
    await input.fill("Hello AI");
    await input.press("Enter");
    // Wait for either user message or thinking state
    await expect(page.locator('text=Bạn').or(page.locator('text=You'))).toBeVisible();
  });

  test("03 — Language toggle switches EN/VI", async ({ page }) => {
    const enBtn = page.locator('button[title*="English"]').or(page.locator('button:has-text("EN")'));
    const viBtn = page.locator('button[title*="Tiếng Việt"]').or(page.locator('button:has-text("VI")'));
    if (await viBtn.isVisible().catch(() => false)) {
      await viBtn.click();
      await expect(page.locator('text=Workspace')).toBeVisible();
      await enBtn.click();
      await expect(page.locator('text=Workspace')).not.toBeVisible();
    } else {
      await enBtn.click();
      await expect(page.locator('text=Workspace')).not.toBeVisible();
    }
  });

  test("04 — Terminal panel opens and accepts command", async ({ page }) => {
    const termBtn = page.locator('button:has-text("Terminal")');
    await termBtn.click();
    // Find terminal input
    const termInput = page.locator('input').filter({ has: page.locator(':visible') }).last();
    await termInput.fill("help");
    await termInput.press("Enter");
    await expect(page.locator('text=ls')).toBeVisible();
  });

  test("05 — Account panel opens with login/register UI", async ({ page }) => {
    // Account button is usually in the top bar; look for an account/settings icon or text
    const accountBtn = page.locator('button[title*="Account"]').or(page.locator('button:has-text("Account")'));
    if (await accountBtn.isVisible().catch(() => false)) {
      await accountBtn.click();
    } else {
      // Fallback: try Settings panel which may contain account link
      const settingsBtn = page.locator('button[title*="settings"]').or(page.locator('button:has-text("Cấu hình")'));
      await settingsBtn.click();
    }
    await expect(page.locator('text=Account & Subscription').or(page.locator('text=Tài khoản'))).toBeVisible();
  });
});
