import { expect, test } from "@playwright/test";
import { collectA11yFindings, formatFindings } from "../../../packages/ui/testing/a11y";

const ORIGIN = "https://brand.omdala.com";
const PAIRED = ["/", "/brands/", "/categories/", "/brands/omcode/", "/categories/ai/"];
const path = (locale: "en" | "vi", p: string) => `/${locale}${p === "/" ? "/" : p}`;

test.describe("static HTML per locale", () => {
  for (const locale of ["en", "vi"] as const) {
    for (const p of PAIRED) {
      test(`${path(locale, p)} declares lang, canonical and EN/VI/x-default alternates`, async ({ request }) => {
        const html = await (await request.get(path(locale, p))).text();
        expect(html).toMatch(new RegExp(`<html[^>]*\\slang="${locale}"`));
        const route = p === "/" ? "" : p.replace(/\/$/, "");
        expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/${locale}${route}/"`);
        for (const [lang, target] of [["en", "en"], ["vi", "vi"], ["x-default", "en"]] as const) {
          expect(html).toMatch(new RegExp(`<link rel="alternate" hrefLang="${lang}" href="${ORIGIN}/${target}${route}/"`, "i"));
        }
      });
    }
  }

  test("an information page has a self canonical and no alternate for a slug that does not exist in the other language", async ({ request }) => {
    const html = await (await request.get("/vi/cach-hoat-dong/")).text();
    expect(html).toMatch(/<html[^>]*\slang="vi"/);
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/vi/cach-hoat-dong/"`);
    expect(html).not.toMatch(/rel="alternate" hrefLang="en"/i);
  });

  test("the inquiry handoff stays noindex", async ({ request }) => {
    const html = await (await request.get("/en/brands/omcode/inquiry/")).text();
    expect(html).toMatch(/<meta name="robots" content="noindex/);
  });
});

test.describe("root, robots, sitemap, 404", () => {
  test("the bare origin is a real page that refreshes to English and links both languages", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toMatch(/http-equiv="refresh" content="0; url=\/en\/"/i);
    expect(html).toContain('href="/en/"');
    expect(html).toContain('href="/vi/"');
  });

  test("robots.txt is the single source and matches the page-level rule (noindex build: disallow)", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toMatch(/Disallow: \//);
    expect(body).not.toMatch(/Allow: \//);
  });

  test("sitemap.xml lists both locales with alternates", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    for (const p of PAIRED) {
      const route = p === "/" ? "" : p.replace(/\/$/, "");
      expect(body).toContain(`<loc>${ORIGIN}/en${route}/</loc>`);
      expect(body).toContain(`<loc>${ORIGIN}/vi${route}/</loc>`);
    }
    expect(body).toContain('hreflang="vi" href="https://brand.omdala.com/vi/"');
  });

  test("an unknown URL returns a bilingual, noindex 404", async ({ request }) => {
    // /x/ (not /en/x/): the dev server answers an unknown segment under [page] with a 500 because
    // output: export has no static params for it; the static host serves this same global 404.
    const response = await request.get("/does-not-exist/");
    expect(response.status()).toBe(404);
    const html = await response.text();
    expect(html).toMatch(/<meta name="robots" content="noindex/);
    expect(html).toMatch(/<html[^>]*\slang="en"/);
  });
});

test.describe("accessibility checks", () => {
  for (const locale of ["en", "vi"] as const) {
    for (const p of PAIRED) {
      test(`${path(locale, p)} passes (${locale})`, async ({ page }) => {
        await page.goto(path(locale, p));
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
        const findings = await collectA11yFindings(page, { lang: locale });
        expect(formatFindings(findings), "accessibility findings").toBe("");
      });
    }
  }
});
