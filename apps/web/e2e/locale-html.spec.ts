import { expect, test } from "@playwright/test";
import { getNotFoundCopy } from "../app/lib/bilingual-source";

// The server-rendered HTML (no JavaScript) of each locale route must already be localized.
const PAGES = ["/", "/how-it-works/", "/what-is-omdala/", "/trust/"];
const vi = (p: string) => (p === "/" ? "/vi/" : `/vi${p}`);

test.describe("server-rendered locale HTML", () => {
  for (const p of PAGES) {
    test(`${p} and ${vi(p)} differ in text and declare EN/VI/x-default alternates`, async ({ request }) => {
      const enHtml = await (await request.get(p)).text();
      const viHtml = await (await request.get(vi(p))).text();

      const textOf = (html: string) =>
        html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
      // Vietnamese diacritics only appear in the VI page's server-rendered text.
      const diacritics = /[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/;
      expect(diacritics.test(textOf(viHtml))).toBe(true);
      expect(textOf(enHtml).match(new RegExp(diacritics.source, "g"))?.length ?? 0).toBeLessThan(
        (textOf(viHtml).match(new RegExp(diacritics.source, "g"))?.length ?? 0) / 4,
      );

      // The static HTML itself must declare the page language (not just after hydration).
      expect(enHtml).toMatch(/<html[^>]*\slang="en"/)
      expect(viHtml).toMatch(/<html[^>]*\slang="vi"/)

      for (const html of [enHtml, viHtml]) {
        expect(html).toMatch(/hrefLang="en"|hreflang="en"/i);
        expect(html).toMatch(/hrefLang="vi"|hreflang="vi"/i);
        expect(html).toMatch(/hrefLang="x-default"|hreflang="x-default"/i);
      }
    });
  }
});

test.describe("sitemap and 404", () => {
  test("sitemap.xml lists every page in both locales", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();
    for (const p of [...PAGES, "/faq/", "/vision/"]) {
      const path = p === "/" ? "" : p.replace(/\/$/, "");
      expect(body).toContain(`<loc>https://omdala.com${path}`);
      expect(body).toContain(`<loc>https://omdala.com/vi${path}`);
    }
    expect(body).toContain("<loc>https://omdala.com/vi</loc>");
  });

  test("an unknown URL returns a bilingual, noindex 404", async ({ request }) => {
    // The dev server answers an unknown first segment (/x/) with a 500 because [lang] matches it;
    // the static host serves the same global 404 for it. /vi/x/ exercises that 404 in dev.
    for (const path of ["/vi/does-not-exist/"]) {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
      const html = await response.text();
      expect(html).toMatch(/<html[^>]*\slang="en"/);
      // Both languages on one page, each block tagged with its own lang.
      expect(html).toMatch(/<section[^>]*\slang="en"/);
      expect(html).toMatch(/<section[^>]*\slang="vi"/);
      expect(html).toContain(getNotFoundCopy("en").title);
      expect(html).toContain(getNotFoundCopy("vi").title);
      expect(html).toMatch(/<meta name="robots" content="noindex/);
    }
  });
});
