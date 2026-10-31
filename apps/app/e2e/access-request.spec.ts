import { expect, test, type Page } from "@playwright/test";

const ACCESS = "**/v1/auth/access-request";

async function stubAccess(page: Page, status: number, body: object) {
  const posts: unknown[] = [];
  await page.route(ACCESS, (route) => {
    const cors = {
      "access-control-allow-origin": route.request().headers()["origin"] ?? "*",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    };
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    posts.push(route.request().postDataJSON());
    return route.fulfill({ status, contentType: "application/json", headers: cors, body: JSON.stringify(body) });
  });
  return posts;
}

async function fillAndSubmit(page: Page) {
  await page.locator('input[name="email"]').fill("builder@example.com");
  await page.locator('input[name="node-name"]').fill("Test Node");
  await page.locator('button[type="submit"]').click();
}

test.describe("access request form (API stubbed locally)", () => {
  test("success shows the received message and posts the form once", async ({ page }) => {
    const posts = await stubAccess(page, 200, { ok: true, data: {} });
    await page.goto("/signup?lang=en");
    await fillAndSubmit(page);
    await expect(page.locator(".auth-status--success")).toContainText(/Request received/);
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ email: "builder@example.com", nodeName: "Test Node" });
  });

  test("success in VI", async ({ page }) => {
    await stubAccess(page, 200, { ok: true, data: {} });
    await page.goto("/signup?lang=vi");
    await fillAndSubmit(page);
    await expect(page.locator(".auth-status--success")).toContainText(/Đã gửi yêu cầu/);
  });

  test("a 4xx shows the API's own message", async ({ page }) => {
    await stubAccess(page, 422, { ok: false, error: { code: "INVALID", message: "Email looks invalid." } });
    await page.goto("/signup?lang=en");
    await fillAndSubmit(page);
    await expect(page.locator(".auth-status--error")).toHaveText("Email looks invalid.");
  });

  for (const [status, code] of [[503, "DATABASE_UNAVAILABLE"], [504, "UPSTREAM_TIMEOUT"]] as const) {
    test(`a ${status} shows a friendly message (EN)`, async ({ page }) => {
      await stubAccess(page, status, { ok: false, error: { code, message: "internal detail" } });
      await page.goto("/signup?lang=en");
      await fillAndSubmit(page);
      await expect(page.locator(".auth-status--error")).toHaveText("The service is temporarily unavailable. Please retry shortly.");
    });
  }

  test("a 503 shows the friendly message in VI", async ({ page }) => {
    await stubAccess(page, 503, { ok: false, error: { code: "DATABASE_UNAVAILABLE", message: "internal detail" } });
    await page.goto("/signup?lang=vi");
    await fillAndSubmit(page);
    await expect(page.locator(".auth-status--error")).toHaveText("Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.");
  });
});
