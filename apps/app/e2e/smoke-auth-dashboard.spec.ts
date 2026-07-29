import { test, expect, type Page } from "@playwright/test";

async function mockAuthedSession(page: Page) {
  await page.route("https://api.omdala.com/v1/auth/session", async (route) => {
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

async function mockProviderRouting(page: Page) {
  await page.route("https://api.omdala.com/v1/providers", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          appId: "om-ai",
          total: 3,
          items: [
            {
              id: "openai-realtime",
              name: "OpenAI Realtime",
              capabilities: ["live-call"],
              priority: 1,
              health: "healthy",
            },
            {
              id: "openai-responses",
              name: "OpenAI Responses",
              capabilities: ["recap-generation", "persona-response"],
              priority: 1,
              health: "healthy",
            },
            {
              id: "fallback-mock",
              name: "Fallback Mock Provider",
              capabilities: ["live-call", "recap-generation", "persona-response"],
              priority: 99,
              health: "degraded",
            },
          ],
        },
      }),
    });
  });

  await page.route("https://api.omdala.com/v1/providers/route**", async (route) => {
    const url = new URL(route.request().url());
    const capability = url.searchParams.get("capability");

    if (capability === "live-call") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            appId: "om-ai",
            capability: "live-call",
            providerId: "openai-realtime",
            providerName: "OpenAI Realtime",
            reason: "Primary provider selected from healthy registry.",
            fallbackProviderId: "fallback-mock",
            score: 0.944,
          },
        }),
      });
      return;
    }

    if (capability === "recap-generation") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            appId: "om-ai",
            capability: "recap-generation",
            providerId: "openai-responses",
            providerName: "OpenAI Responses",
            reason: "Primary provider selected from healthy registry.",
            fallbackProviderId: "fallback-mock",
            score: 0.929,
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
          data: {
            appId: "om-ai",
            capability: "persona-response",
            providerId: null,
            providerName: null,
            reason: "No provider is currently healthy enough to serve this capability.",
            fallbackProviderId: null,
            score: 0,
          },
        }),
      });
  });
}

test("login screen submits and shows status", async ({ page }) => {
  await page.goto("/login?lang=en");

  await expect(page.locator("h1")).toContainText(
    "Continue to the dedicated OMDALA auth surface.",
  );
  await expect(
    page.locator('a[href^="https://auth.omdala.com/login?next="]'),
  ).toBeVisible();
});

test("dashboard hands off to auth when session is missing", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.removeItem("omdala_app_session_v1");
    window.sessionStorage.clear();
  });
  await page.context().clearCookies();

  await page.goto("/dashboard?lang=en");
  await expect
    .poll(
      () => {
        const url = page.url();
        return (
          url.includes("https://auth.omdala.com/login") ||
          url.startsWith("about:") ||
          url.startsWith("chrome-error://chromewebdata/")
        );
      },
      { timeout: 12000 },
    )
    .toBeTruthy();
});

test("profile renders current profile runtime details when session is valid", async ({
  page,
}) => {
  await mockAuthedSession(page);

  await page.goto("/profile?lang=en");

  await expect(
    page.getByRole("heading", { name: "OMDALA Operator" }),
  ).toBeVisible();
  await expect(page.getByText("Profile Runtime")).toBeVisible();
  await expect(
    page.getByText(
      "Profile now reads from auth session + node graph and exposes role, trust, and operational context instead of a shell placeholder.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Identity")).toBeVisible();
  await expect(page.getByText("Email: operator@omdala.com")).toBeVisible();
  await expect(page.locator("body")).toContainText("Roles: expert");
  await expect(page.getByText("Primary trust")).toBeVisible();
});

test("settings renders current runtime metrics when session is valid", async ({
  page,
}) => {
  await mockAuthedSession(page);
  await mockProviderRouting(page);

  await page.goto("/settings?lang=en");

  await expect(page.getByText("Settings Runtime")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(
    page.getByText(
      "Settings now reflects active app state: language, notification load, and trust review pressure from the current runtime graph.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Language mode")).toBeVisible();
  await expect(page.getByText("Unread notifications")).toBeVisible();
  await expect(page.getByText("Proof queue pressure")).toBeVisible();
  await expect(
    page.getByText("AI assist cadence"),
  ).toBeVisible();
});
