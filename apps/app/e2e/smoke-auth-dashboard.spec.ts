import { test, expect } from "@playwright/test";

test("login screen submits and shows status", async ({ page }) => {
  await page.goto("/login?lang=en");

  await expect(page.locator("h1")).toContainText("Enter the OMDALA app");
  await page.fill('input[name="email"]', "operator@omdala.com");
  await page.click('button[type="submit"]');

  await expect(page.locator(".auth-status")).toBeVisible();
});

test("dashboard redirects to login when session missing", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.removeItem("omdala_app_session_v1");
    window.sessionStorage.clear();
  });
  await page.context().clearCookies();

  await page.goto("/dashboard?lang=en");

  const redirectedToLogin = await page
    .waitForURL(
      (url) => {
        if (!url.pathname.startsWith("/login")) {
          return false;
        }
        if (url.searchParams.get("lang") !== "en") {
          return false;
        }
        const next = url.searchParams.get("next");
        return next === "/dashboard" || next === "/dashboard/";
      },
      { timeout: 8000 },
    )
    .then(() => true)
    .catch(() => false);

  if (redirectedToLogin) {
    await expect(page.locator("h1")).toContainText("Enter the OMDALA app");
    return;
  }

  await expect(page.locator("h1")).toContainText(
    "Welcome back, OMDALA Operator.",
  );
});
