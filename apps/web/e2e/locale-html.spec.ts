import { expect, test } from "@playwright/test";

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

      for (const html of [enHtml, viHtml]) {
        expect(html).toMatch(/hrefLang="en"|hreflang="en"/i);
        expect(html).toMatch(/hrefLang="vi"|hreflang="vi"/i);
        expect(html).toMatch(/hrefLang="x-default"|hreflang="x-default"/i);
      }
    });
  }
});
