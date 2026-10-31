import { expect, test } from "@playwright/test";

test.describe("sign out", () => {
  test("posts the logout and lands on the auth login page", async ({ page }) => {
    await page.route("https://auth.omdala.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>auth stub</title>" }),
    );
    await page.route("**/v1/auth/session", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: { authenticated: true, email: "operator@omdala.com", expiresAt: "2026-12-31T23:59:59.000Z" },
        }),
      }),
    );
    const logouts: string[] = [];
    await page.route("**/v1/auth/logout", (route) => {
      const cors = {
        "access-control-allow-origin": route.request().headers()["origin"] ?? "*",
        "access-control-allow-credentials": "true",
        "access-control-allow-headers": "content-type",
        "access-control-allow-methods": "POST, OPTIONS",
      };
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      logouts.push(route.request().method());
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: cors,
        body: JSON.stringify({ ok: true, data: { revoked: true } }),
      });
    });
    await page.route("**/v1/account/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: {} }) }));

    await page.goto("/dashboard?lang=en");
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(/auth\.omdala\.com\/login/);
    expect(logouts).toEqual(["POST"]);
    const url = new URL(page.url());
    expect(url.searchParams.get("lang")).toBe("en");
    expect(url.searchParams.get("next")).toBe("/dashboard");
  });

  test("the VI label is Đăng xuất", async ({ page }) => {
    await page.route("**/v1/auth/session", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: { authenticated: true, email: "operator@omdala.com", expiresAt: "2026-12-31T23:59:59.000Z" },
        }),
      }),
    );
    await page.goto("/dashboard?lang=vi");
    await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
  });
});
