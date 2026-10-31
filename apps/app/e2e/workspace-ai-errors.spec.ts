import { expect, test, type Page } from "@playwright/test";
import { injectWorkspaceFixture } from "./fixtures/workspace-fixture";

const CATALOG = {
  ok: true,
  data: {
    authority: {
      provider: "aiagent",
      configured: true,
      ready: true,
      origin: "https://api.aiagent.iai.one",
      contractVersion: "1.0.0",
      tenant: "omdala-com",
      workspace: "omdala-com-production",
      probe: "configuration-only",
      directUpstreamAllowed: false,
    },
    models: [{ id: "iai-one/test-model", capabilities: ["chat"], status: "available" }],
    total: 1,
  },
};

async function openWorkspace(page: Page, lang: "en" | "vi", chat: { status: number; code: string; message: string; retryAfter?: string }) {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem("omcode:terms:accepted:v1", "true");
      localStorage.setItem("omcode:lang", value);
    } catch {}
  }, lang);
  await page.route("**/v1/ai/models", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": route.request().headers()["origin"] ?? "*", "access-control-allow-credentials": "true" },
      body: JSON.stringify(CATALOG),
    }),
  );
  await page.route("**/v1/ai/chat", (route) => {
    const cors: Record<string, string> = {
      "access-control-allow-origin": route.request().headers()["origin"] ?? "*",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type, idempotency-key",
      "access-control-allow-methods": "POST, OPTIONS",
    };
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    if (chat.retryAfter) {
      cors["retry-after"] = chat.retryAfter;
      cors["access-control-expose-headers"] = "Retry-After";
    }
    return route.fulfill({
      status: chat.status,
      contentType: "application/json",
      headers: cors,
      body: JSON.stringify({ ok: false, error: { code: chat.code, message: chat.message } }),
    });
  });
  await injectWorkspaceFixture(page);
  await page.goto("/workspace/?fixture=1");
  await expect(page.getByText(lang === "en" ? "OMDALA Workspace" : "OMDALA Workspace")).toBeVisible({ timeout: 20000 });
}

async function sendChat(page: Page) {
  const box = page.locator("textarea[placeholder*='Hỏi AI']");
  await box.fill("hello");
  await box.press("Enter");
}

const CAP = { status: 429, code: "ai_tenant_cap_exceeded", message: "The daily AI usage limit for this account was reached." };
const INACTIVE = { status: 402, code: "subscription_inactive", message: "An active subscription is required to use AI." };

test.describe("AI chat error messages", () => {
  test("daily cap in EN names the limit and the reset time", async ({ page }) => {
    await openWorkspace(page, "en", CAP);
    await sendChat(page);
    await expect(page.getByText(/This account has used its daily AI limit\. The limit resets at .*20\d\d/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Lỗi:/)).toHaveCount(0);
  });

  test("daily cap in VI", async ({ page }) => {
    await openWorkspace(page, "vi", CAP);
    await sendChat(page);
    await expect(page.getByText(/Tài khoản đã dùng hết hạn mức AI trong ngày\. Hạn mức được làm mới lúc .*20\d\d/)).toBeVisible({ timeout: 15000 });
  });

  test("a readable Retry-After sets the reset time", async ({ page }) => {
    await openWorkspace(page, "en", { ...CAP, retryAfter: "120" });
    await sendChat(page);
    const message = page.getByText(/The limit resets at/);
    await expect(message).toBeVisible({ timeout: 15000 });
    // Two minutes from now, not the next UTC midnight: the minute shown is within a few of now.
    const text = await message.innerText();
    const time = /(\d{2}):(\d{2})/.exec(text);
    expect(time).not.toBeNull();
    const shown = Number(time![1]) * 60 + Number(time![2]);
    const now = new Date();
    const local = now.getHours() * 60 + now.getMinutes();
    const delta = (shown - local + 1440) % 1440;
    expect(delta).toBeGreaterThanOrEqual(1);
    expect(delta).toBeLessThanOrEqual(4);
  });

  test("inactive subscription in EN and VI", async ({ page }) => {
    await openWorkspace(page, "en", INACTIVE);
    await sendChat(page);
    await expect(page.getByText("An active subscription is required to use AI. Check your plan in Account.")).toBeVisible({ timeout: 15000 });
  });

  test("inactive subscription in VI", async ({ page }) => {
    await openWorkspace(page, "vi", INACTIVE);
    await sendChat(page);
    await expect(page.getByText(/Cần có gói đăng ký đang hoạt động để dùng AI/)).toBeVisible({ timeout: 15000 });
  });
});
