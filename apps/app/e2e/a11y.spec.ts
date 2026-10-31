import { expect, test } from "@playwright/test";
import { collectA11yFindings, formatFindings } from "../../../packages/ui/testing/a11y";

for (const lang of ["en", "vi"] as const) {
  test(`app dashboard passes the accessibility checks (${lang})`, async ({ page }) => {
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
    await page.route(/\/v[12]\/(account|billing|ai|reality)\//, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: {} }) }),
    );
    await page.goto(`/dashboard?lang=${lang}`);
    await expect(page.getByRole("button", { name: lang === "en" ? "Sign out" : "Đăng xuất" })).toBeVisible();
    const findings = await collectA11yFindings(page, { lang });
    expect(formatFindings(findings), "accessibility findings").toBe("");
  });
}
