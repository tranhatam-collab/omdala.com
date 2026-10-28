import { expect, test, type Page, type Request } from "@playwright/test";

const EXCHANGE = "**/v1/auth/session/exchange";

function trackExchange(page: Page) {
  const calls: Request[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/v1/auth/session/exchange")) calls.push(request);
  });
  return calls;
}

async function mockExchange(page: Page, status: number, code: string, message: string) {
  await page.route(EXCHANGE, (route) => {
    const cors = {
      "access-control-allow-origin": route.request().headers()["origin"] ?? "*",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    };
    if (route.request().method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: cors });
    }
    return route.fulfill({
      status,
      contentType: "application/json",
      headers: cors,
      body: JSON.stringify({ ok: false, error: { code, message } }),
    });
  });
}

test.describe("login page", () => {
  test("renders EN by default with sign-in controls", async ({ page }) => {
    await page.goto("/login/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /send/i })).toBeVisible();
  });

  test("renders VI with ?lang=vi", async ({ page }) => {
    await page.goto("/login/?lang=vi");
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(page.getByRole("link", { name: "Tiếp tục bằng Google" })).toBeVisible();
    await expect(page.getByText("hoặc", { exact: true })).toBeVisible();
  });
});

test.describe("root", () => {
  test("/ lands on /login/", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/login\/?$/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});

test.describe("noindex", () => {
  for (const path of ["/login/", "/"]) {
    test(`meta robots noindex on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    });
  }

  test("robots.txt disallows everything", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    expect(await response.text()).toMatch(/User-agent: \*\s+Disallow: \//);
  });
});

test.describe("magic-link landing", () => {
  test("no token: no exchange call and no error shown", async ({ page }) => {
    const calls = trackExchange(page);
    await page.goto("/login/");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await page.waitForTimeout(500);
    expect(calls).toHaveLength(0);
    await expect(page.locator(".auth-status")).toHaveCount(0);
  });

  test("empty token is treated as missing, not sent to the API", async ({ page }) => {
    const calls = trackExchange(page);
    await page.goto("/login/?token=");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await page.waitForTimeout(500);
    expect(calls).toHaveLength(0);
    await expect(page.locator(".auth-status")).toHaveCount(0);
  });

  test("invalid token shows the API error honestly", async ({ page }) => {
    await mockExchange(page, 401, "INVALID_TOKEN", "This sign-in link is invalid.");
    await page.goto("/login/?token=not-a-real-token");
    const status = page.locator(".auth-status--error");
    await expect(status).toHaveText("This sign-in link is invalid.");
    await expect(page.locator(".auth-status--success")).toHaveCount(0);
  });

  test("expired token shows the API error honestly", async ({ page }) => {
    await mockExchange(page, 410, "TOKEN_EXPIRED", "This sign-in link has expired. Request a new one.");
    await page.goto("/login/?token=expired-token");
    await expect(page.locator(".auth-status--error")).toHaveText(
      "This sign-in link has expired. Request a new one.",
    );
  });

  test("unreachable API shows an error, never success", async ({ page }) => {
    await page.route(EXCHANGE, (route) => route.abort("failed"));
    await page.goto("/login/?token=any-token");
    await expect(page.locator(".auth-status--error")).toBeVisible();
    await expect(page.locator(".auth-status--success")).toHaveCount(0);
  });

  test("token is sent once in the POST body, not in the URL", async ({ page }) => {
    const calls = trackExchange(page);
    await mockExchange(page, 401, "INVALID_TOKEN", "invalid");
    await page.goto("/login/?token=secret-token-123&next=/dashboard");
    await expect(page.locator(".auth-status--error")).toBeVisible();
    expect(calls).toHaveLength(1);
    expect(calls[0].method()).toBe("POST");
    expect(calls[0].url()).not.toContain("secret-token-123");
    expect(calls[0].postDataJSON()).toMatchObject({ token: "secret-token-123" });
  });

  test("token is not kept in the address bar after landing", async ({ page }) => {
    await mockExchange(page, 401, "INVALID_TOKEN", "invalid");
    await page.goto("/login/?token=secret-token-123");
    await expect(page.locator(".auth-status--error")).toBeVisible();
    expect(page.url()).not.toContain("secret-token-123");
    expect(page.url()).not.toContain("token=");
  });

  test("VI landing keeps the language but drops the token", async ({ page }) => {
    await mockExchange(page, 401, "INVALID_TOKEN", "invalid");
    await page.goto("/login/?lang=vi&token=secret-token-123");
    await expect(page.locator(".auth-status--error")).toBeVisible();
    expect(page.url()).toContain("lang=vi");
    expect(page.url()).not.toContain("token=");
  });
});

test.describe("404", () => {
  test("unknown route returns HTTP 404 with a not-found page", async ({ page }) => {
    const response = await page.goto("/does-not-exist/");
    expect(response?.status()).toBe(404);
    await expect(page.locator("body")).toContainText(/404|not found/i);
  });

  test("404 page is also noindex", async ({ page }) => {
    await page.goto("/does-not-exist/");
    const robots = await page
      .locator('meta[name="robots"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("content") ?? ""));
    expect(robots.length).toBeGreaterThan(0);
    for (const content of robots) expect(content).toMatch(/noindex/);
  });
});
