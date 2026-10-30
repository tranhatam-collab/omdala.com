import { expect, test } from "@playwright/test";
import { collectA11yFindings, formatFindings } from "../../../packages/ui/testing/a11y";

for (const [lang, path] of [["en", "/login/"], ["vi", "/login/?lang=vi"]] as const) {
  test(`auth ${path} passes the accessibility checks (${lang})`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    const findings = await collectA11yFindings(page, { lang });
    expect(formatFindings(findings), "accessibility findings").toBe("");
  });
}

test("the checker itself flags the common failures", async ({ page }) => {
  await page.setContent(`<!doctype html><html lang="fr"><body>
    <h1>One</h1><h1>Two</h1><h4>Skipped</h4>
    <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">
    <input type="text"><button></button>
    <nav><a href="#a">A</a></nav><nav><a href="#b">B</a></nav>
    <a href="#c" style="outline:none">NoRing</a>
  </body></html>`);
  const rules = new Set((await collectA11yFindings(page, { lang: "en", focusStops: 6 })).map((f) => f.rule));
  for (const rule of ["lang", "one-h1", "heading-order", "landmark-main", "landmark-nav-name", "img-alt", "form-label", "control-name", "focus-visible"]) {
    expect(rules.has(rule), rule).toBe(true);
  }
});
