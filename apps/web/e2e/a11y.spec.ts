import { expect, test } from "@playwright/test";
import { collectA11yFindings, formatFindings } from "../../../packages/ui/testing/a11y";

const PAGES = ["/", "/what-is-omdala/", "/how-it-works/", "/for-experts/", "/trust/", "/faq/", "/contact/"];

for (const route of PAGES) {
  for (const lang of ["en", "vi"] as const) {
    const path = lang === "en" ? route : route === "/" ? "/vi/" : `/vi${route}`;
    test(`web ${path} passes the accessibility checks (${lang})`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      const findings = await collectA11yFindings(page, { lang });
      expect(formatFindings(findings), "accessibility findings").toBe("");
    });
  }
}
