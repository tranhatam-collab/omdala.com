import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const ORIGIN = "https://docs.omdala.com";
const ROUTES = [
  { path: "/", enTitle: "OMDALA Documentation", viTitle: "Tài liệu OMDALA", canonical: `${ORIGIN}/` },
  { path: "/platform/", enTitle: "OMDALA Platform Overview", viTitle: "Tổng quan nền tảng OMDALA", canonical: `${ORIGIN}/platform/` },
  { path: "/api/", enTitle: "API reference", viTitle: "Tham chiếu API", canonical: `${ORIGIN}/api/` },
  { path: "/trust/", enTitle: "Trust", viTitle: "niềm tin", canonical: `${ORIGIN}/trust/` },
];

test.describe("routes", () => {
  for (const route of ROUTES) {
    test(`${route.path} renders EN`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(route.enTitle, { ignoreCase: true });
    });

    test(`${route.path} renders VI with ?lang=vi`, async ({ page }) => {
      await page.goto(`${route.path}?lang=vi`);
      await expect(page.locator("html")).toHaveAttribute("lang", "vi");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(route.viTitle, { ignoreCase: true });
    });
  }

  test("home links reach platform, api and trust", async ({ page }) => {
    await page.goto("/");
    for (const target of ["platform", "api", "trust"]) {
      await expect(page.locator(`main nav a[href^="/${target}"]`)).toBeVisible();
    }
  });

  test("language is preserved on in-site links", async ({ page }) => {
    await page.goto("/?lang=vi");
    await expect(page.locator('main nav a[href^="/platform"]')).toHaveAttribute("href", /lang=vi/);
  });
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
    test(`${route.path} has a self canonical and EN/VI/x-default alternates`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", route.canonical);
      const alternates = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((nodes) => Object.fromEntries(nodes.map((n) => [n.getAttribute("hreflang"), n.getAttribute("href")])));
      expect(alternates).toEqual({
        en: route.canonical,
        vi: `${route.canonical}?lang=vi`,
        "x-default": route.canonical,
      });
    });

    test(`${route.path} has its own title and description`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveTitle(/OMDALA/);
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect((description ?? "").length).toBeGreaterThan(20);
    });
  }

  test("sub-pages do not share the home title", async ({ page }) => {
    const titles = new Set<string>();
    for (const route of ROUTES) {
      await page.goto(route.path);
      titles.add(await page.title());
    }
    expect(titles.size).toBe(ROUTES.length);
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

  test("sitemap.xml lists every route with EN/VI alternates", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    for (const route of ROUTES) {
      expect(body).toContain(`<loc>${route.canonical}</loc>`);
      expect(body).toContain(`hreflang="vi" href="${route.canonical}?lang=vi"`);
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
});
