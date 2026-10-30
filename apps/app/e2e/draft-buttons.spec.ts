import { expect, test, type Page } from "@playwright/test";

async function mockAuthedSession(page: Page) {
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
}

// The create-form pages sit under section layouts that render the release boundary
// instead of their children, so no dead "Save draft" button can be reached.
for (const route of ["nodes", "requests", "offers", "resources"]) {
  test(`${route}/new shows the release boundary, no Save draft button and no fixture form`, async ({ page }) => {
    await mockAuthedSession(page);
    await page.goto(`/${route}/new?lang=en`);
    const boundary = page.locator('[data-release-state="unreleased"]');
    await expect(boundary).toBeVisible();
    await expect(boundary).toHaveAttribute("data-runtime-surface", route);
    await expect(boundary).toContainText(/not released yet/i);
    await expect(page.getByRole("button", { name: /save draft/i })).toHaveCount(0);
    await expect(page.locator("main form, main input[type=text]")).toHaveCount(0);
  });
}
