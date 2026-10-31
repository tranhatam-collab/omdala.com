import { existsSync, readFileSync } from "node:fs";
import { watchCsp } from "../../../packages/ui/testing/csp";
import path from "node:path";
import { expect, test } from "@playwright/test";

const ORIGIN = "https://docs.omdala.com";
const OUT = path.join(__dirname, "..", "out");

// EN at /, VI under /vi (ADR-002/003, static export).
const ROUTES = [
  { path: "/", enTitle: "OMDALA Documentation", viTitle: "Tài liệu OMDALA", file: "index.html", viFile: "vi/index.html" },
  { path: "/platform/", enTitle: "OMDALA Platform Overview", viTitle: "Tổng quan nền tảng OMDALA", file: "platform/index.html", viFile: "vi/platform/index.html" },
  { path: "/api/", enTitle: "OMDALA API Reference", viTitle: "Tham chiếu API OMDALA", file: "api/index.html", viFile: "vi/api/index.html" },
  { path: "/trust/", enTitle: "OMDALA Trust System", viTitle: "Hệ thống niềm tin OMDALA", file: "trust/index.html", viFile: "vi/trust/index.html" },
];
const viPath = (p: string) => (p === "/" ? "/vi/" : `/vi${p}`);

test.describe("routes", () => {
  for (const route of ROUTES) {
    test(`${route.path} renders EN`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.enTitle);
    });

    test(`${viPath(route.path)} renders VI`, async ({ page }) => {
      const response = await page.goto(viPath(route.path));
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "vi");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.viTitle);
    });
  }

  test("home links stay inside the current locale", async ({ page }) => {
    await page.goto("/");
    for (const target of ["platform", "api", "trust"]) {
      await expect(page.locator(`main nav a[href="/${target}/"]`)).toBeVisible();
    }
    await page.goto("/vi/");
    for (const target of ["platform", "api", "trust"]) {
      await expect(page.locator(`main nav a[href="/vi/${target}/"]`)).toBeVisible();
    }
  });

  test("language switcher moves between /x/ and /vi/x/ and keeps query and hash", async ({ page }) => {
    await page.goto("/platform/?ref=nav#top");
    await page.getByRole("link", { name: "VI", exact: true }).click();
    await page.waitForURL(/\/vi\/platform\/\?ref=nav#top$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await page.getByRole("link", { name: "EN", exact: true }).click();
    await page.waitForURL(/\/platform\/\?ref=nav#top$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("built HTML is localized without JavaScript", () => {
  test("the export contains every locale page", () => {
    for (const route of ROUTES) {
      expect(existsSync(path.join(OUT, route.file)), route.file).toBe(true);
      expect(existsSync(path.join(OUT, route.viFile)), route.viFile).toBe(true);
    }
  });

  for (const route of ROUTES) {
    test(`${route.path}: static HTML carries the right lang and text`, () => {
      const en = readFileSync(path.join(OUT, route.file), "utf8");
      const vi = readFileSync(path.join(OUT, route.viFile), "utf8");
      expect(en).toContain('<html lang="en"');
      expect(en).toContain(route.enTitle);
      expect(en).not.toContain(route.viTitle);
      expect(vi).toContain('<html lang="vi"');
      expect(vi).toContain(route.viTitle);
      expect(vi).not.toContain(`>${route.enTitle}<`);
    });
  }
});

test.describe("api reference", () => {
  test("lists only implemented route groups", async ({ page }) => {
    await page.goto("/api/");
    const groups = await page.locator('ul[aria-label="API route groups"] code').allTextContents();
    expect(groups).toContain("/v1/auth");
    expect(groups).toContain("/v2/reality");
    for (const removed of ["/v1/offers", "/v1/requests", "/v1/matches", "/v1/bookings", "/v1/payments", "/v1/proofs"]) {
      expect(groups).not.toContain(removed);
    }
  });
});

test.describe("canonical and hreflang", () => {
  for (const route of ROUTES) {
    for (const locale of ["en", "vi"] as const) {
      const pagePath = locale === "en" ? route.path : viPath(route.path);
      test(`${pagePath} has a self canonical and EN/VI/x-default alternates`, async ({ page }) => {
        await page.goto(pagePath);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${ORIGIN}${pagePath}`);
        const alternates = await page
          .locator('link[rel="alternate"][hreflang]')
          .evaluateAll((nodes) => Object.fromEntries(nodes.map((n) => [n.getAttribute("hreflang"), n.getAttribute("href")])));
        expect(alternates).toEqual({
          en: `${ORIGIN}${route.path}`,
          vi: `${ORIGIN}${viPath(route.path)}`,
          "x-default": `${ORIGIN}${route.path}`,
        });
      });

      test(`${pagePath} has its own title and description`, async ({ page }) => {
        await page.goto(pagePath);
        await expect(page).toHaveTitle(/OMDALA/);
        const description = await page.locator('meta[name="description"]').getAttribute("content");
        expect((description ?? "").length).toBeGreaterThan(20);
      });
    }
  }

  test("pages do not share a title", async ({ page }) => {
    const titles = new Set<string>();
    for (const route of ROUTES) {
      for (const p of [route.path, viPath(route.path)]) {
        await page.goto(p);
        titles.add(await page.title());
      }
    }
    expect(titles.size).toBe(ROUTES.length * 2);
  });
});

test.describe("robots and sitemap", () => {
  test("robots.txt allows crawling and points to the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/Allow: \//);
    expect(body).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  test("sitemap.xml lists every route in both locales with alternates", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    for (const route of ROUTES) {
      expect(body).toContain(`<loc>${ORIGIN}${route.path}</loc>`);
      expect(body).toContain(`<loc>${ORIGIN}${viPath(route.path)}</loc>`);
      expect(body).toContain(`hreflang="vi" href="${ORIGIN}${viPath(route.path)}"`);
    }
  });
});

test.describe("single robots source", () => {
  test("public/robots.txt is gone; app/robots.ts is the only source", () => {
    expect(existsSync(path.join(__dirname, "..", "public", "robots.txt"))).toBe(false);
  });
});

test.describe("404", () => {
  test("unknown route returns HTTP 404 with a not-found page", async ({ page }) => {
    const response = await page.goto("/does-not-exist/");
    expect(response?.status()).toBe(404);
    await expect(page.locator("body")).toContainText(/404|not found/i);
  });

  test("the 404 page declares its language in the static HTML", () => {
    const html = readFileSync(path.join(OUT, "404.html"), "utf8");
    expect(html).toMatch(/<html[^>]*\slang="en"/);
  });

  test("unknown VI route returns HTTP 404", async ({ page }) => {
    const response = await page.goto("/vi/does-not-exist/");
    expect(response?.status()).toBe(404);
  });
});

test.describe("self-hosted fonts", () => {
  test("Inter loads from this origin and no Google Fonts request is made", async ({ page, baseURL }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const fontRequests = requests.filter((url) => /\.woff2?(\?|$)/.test(url));
    expect(fontRequests.length).toBeGreaterThan(0);
    for (const url of fontRequests) expect(new URL(url).origin).toBe(new URL(baseURL!).origin);
    expect(fontRequests.some((url) => /inter-latin-\d{3}-normal/.test(url))).toBe(true);
    expect(requests.filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))).toEqual([]);
    expect(await page.evaluate(() => document.fonts.check("400 16px Inter"))).toBe(true);
  });
});

test.describe("content security policy", () => {
  test("pages load under the shipped CSP with their self-hosted fonts and no violation", async ({ page }) => {
    const violations = await watchCsp(page);
    for (const path of ["/", "/vi/", "/platform/"]) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
    }
    expect(await page.evaluate(() => document.fonts.check("400 16px Inter"))).toBe(true);
    expect(await violations()).toEqual([]);
  });
});
