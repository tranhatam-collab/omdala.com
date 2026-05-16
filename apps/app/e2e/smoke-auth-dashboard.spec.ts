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
    "Continue on the dedicated OMDALA auth surface.",
  );
  await expect(
    page.locator('a[href^="https://auth.omdala.com/login?next="]'),
  ).toBeVisible();
});

test("dashboard redirects to login when session missing", async ({ page }) => {
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
        const current = new URL(page.url());
        return {
          origin: current.origin,
          pathname: current.pathname,
          lang: current.searchParams.get("lang"),
          next: current.searchParams.get("next"),
        };
      },
      { timeout: 12000 },
    )
    .toMatchObject({
      origin: "https://auth.omdala.com",
      pathname: "/login/",
      lang: "en",
      next: "/dashboard/",
    });

  await expect(page.locator("h1")).toContainText(
    "Secure login for OMDALA operator surfaces.",
  );
});

test("profile renders Team 1 account/profile contract markers when session is valid", async ({
  page,
}) => {
  await mockAuthedSession(page);

  await page.goto("/profile?lang=en");

  await expect(
    page.getByRole("heading", { name: "OMDALA Operator" }),
  ).toBeVisible();
  await expect(page.getByText("Profile is now the Team 1 entry point")).toBeVisible();
  await expect(page.getByText("Account identity")).toBeVisible();
  await expect(page.getByText("Email: operator@omdala.com")).toBeVisible();
  await expect(page.getByText("Timezone: Asia/Ho_Chi_Minh")).toBeVisible();
  await expect(page.getByText("Theme: system")).toBeVisible();
  await expect(page.getByText("Profile update flow")).toBeVisible();
  await expect(page.getByText("Save profile contract")).toBeVisible();
});

test("settings renders Team 1 billing/usage markers when session is valid", async ({
  page,
}) => {
  await mockAuthedSession(page);
  await mockProviderRouting(page);

  await page.goto("/settings?lang=en");

  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Settings is the Team 1 entry point")).toBeVisible();
  await expect(page.getByText("Billing contract summary")).toBeVisible();
  await expect(page.getByText("App ID: om-ai")).toBeVisible();
  await expect(page.getByText("Billing cycle: monthly")).toBeVisible();
  await expect(
    page.getByText("Subscription visibility: full"),
  ).toBeVisible();
  await expect(
    page.getByText("12/30 call minutes used today."),
  ).toBeVisible();
  await expect(
    page.getByText("5 billing-aware Om AI events are now locked."),
  ).toBeVisible();
  await expect(page.getByText("Preferences update flow")).toBeVisible();
  await expect(
    page.locator(".dashboard-stat strong", { hasText: "Beta gate" }),
  ).toBeVisible();
  await expect(page.getByText("Provider routing snapshot")).toBeVisible();
  await expect(page.getByText(/Provider source: API live\./)).toBeVisible();
  await expect(
    page.getByText("live-call: openai-realtime (dự phòng: fallback-mock) — điểm số 0.944"),
  ).toBeVisible();
  await expect(
    page.getByText("persona-response: none (dự phòng: none) — điểm số 0.000"),
  ).toBeVisible();
});
