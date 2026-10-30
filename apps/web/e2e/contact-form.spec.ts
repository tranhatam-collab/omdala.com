import { expect, test, type Page } from "@playwright/test";

const CONTACT = "**/v1/contact";

async function stubContact(page: Page, status: number, body: string, contentType = "application/json") {
  const posts: unknown[] = [];
  await page.route(CONTACT, (route) => {
    const cors = {
      "access-control-allow-origin": route.request().headers()["origin"] ?? "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    };
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    posts.push(route.request().postDataJSON());
    return route.fulfill({ status, contentType, headers: cors, body });
  });
  return posts;
}

async function fillAndSubmit(page: Page) {
  await page.locator('input[type="text"]').first().fill("Test Builder");
  await page.locator('input[type="email"]').fill("builder@example.com");
  await page.locator("textarea").fill("Hello from the e2e suite.");
  await page.locator('button[type="submit"]').click();
}

test.describe("contact form (API stubbed locally)", () => {
  test("success shows the sent message and posts the form once", async ({ page }) => {
    const posts = await stubContact(page, 200, JSON.stringify({ ok: true, data: {} }));
    await page.goto("/contact/");
    await fillAndSubmit(page);
    await expect(page.locator(".contact-status--success")).toContainText(/Sent\./);
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ name: "Test Builder", email: "builder@example.com", source: "web" });
  });

  test("success in VI", async ({ page }) => {
    await stubContact(page, 200, JSON.stringify({ ok: true, data: {} }));
    await page.goto("/vi/contact/");
    await fillAndSubmit(page);
    await expect(page.locator(".contact-status--success")).toContainText(/Đã gửi\./);
  });

  test("a 4xx shows the API's own message", async ({ page }) => {
    await stubContact(page, 422, JSON.stringify({ ok: false, error: { code: "INVALID", message: "Email looks invalid." } }));
    await page.goto("/contact/");
    await fillAndSubmit(page);
    await expect(page.locator(".contact-status--error")).toHaveText("Email looks invalid.");
  });

  for (const status of [502, 503, 504]) {
    test(`a ${status} shows a friendly message, not internals (EN)`, async ({ page }) => {
      await stubContact(page, status, JSON.stringify({ ok: false, error: { code: "DATABASE_UNAVAILABLE", message: "internal detail" } }));
      await page.goto("/contact/");
      await fillAndSubmit(page);
      await expect(page.locator(".contact-status--error")).toHaveText("The service is temporarily unavailable. Please retry shortly.");
    });
  }

  test("a 503 shows the friendly message in VI", async ({ page }) => {
    await stubContact(page, 503, JSON.stringify({ ok: false, error: { code: "DATABASE_UNAVAILABLE", message: "internal detail" } }));
    await page.goto("/vi/contact/");
    await fillAndSubmit(page);
    await expect(page.locator(".contact-status--error")).toHaveText("Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.");
  });

  test("a non-JSON gateway body never leaks a parse error", async ({ page }) => {
    await stubContact(page, 502, "<html>Bad gateway</html>", "text/html");
    await page.goto("/contact/");
    await fillAndSubmit(page);
    const text = await page.locator(".contact-status--error").innerText();
    expect(text).toBe("The service is temporarily unavailable. Please retry shortly.");
    expect(text).not.toMatch(/JSON|Unexpected token|<html/i);
  });
});
