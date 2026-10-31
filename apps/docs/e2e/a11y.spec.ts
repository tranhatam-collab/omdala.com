import { expect, test } from "@playwright/test";
import { collectA11yFindings, formatFindings } from "../../../packages/ui/testing/a11y";

for (const route of ["/", "/platform/", "/api/", "/trust/"]) {
  for (const lang of ["en", "vi"] as const) {
    const path = lang === "en" ? route : route === "/" ? "/vi/" : `/vi${route}`;
    test(`docs ${path} passes the accessibility checks (${lang})`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const findings = await collectA11yFindings(page, { lang });
      expect(formatFindings(findings), "accessibility findings").toBe("");
    });
  }
}
