import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { watchCsp } from "../../../packages/ui/testing/csp";

const ROUTES = ["/", "/providers/", "/nodes/", "/offers/", "/requests/", "/proofs/", "/verifications/"];

test.describe("noindex", () => {
  for (const path of ROUTES) {
    test(`${path} has meta robots noindex,nofollow`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /nofollow/);
    });
  }

  test("robots.txt disallows everything and lists no sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/Disallow: \//);
    expect(body).not.toMatch(/Allow: \//);
    expect(body).not.toMatch(/Sitemap:/i);
  });

  test("no sitemap is published", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).status()).toBe(404);
  });

  test("_headers carries X-Robots-Tag noindex for all paths", () => {
    const headers = readFileSync(path.join(__dirname, "..", "public", "_headers"), "utf8");
    expect(headers).toMatch(/^\/\*\s+X-Robots-Tag: noindex, nofollow/m);
  });
});

test.describe("restricted state", () => {
  test("every page is labelled as a restricted surface", async ({ page }) => {
    for (const path of ROUTES) {
      await page.goto(path);
      await expect(page.locator(".admin-sidebar .admin-eyebrow")).toHaveText(/restricted surface/i);
    }
  });

  test("admin navigation exposes all sections", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav.admin-nav");
    await expect(nav.locator("a")).toHaveCount(7);
  });

  test("the access-restricted block is not shown for the admin session", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/access restricted/i)).toHaveCount(0);
    await expect(page.locator(".admin-main h1")).toBeVisible();
  });
});

test.describe("routes render", () => {
  for (const path of ROUTES) {
    test(`${path} renders content`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator(".admin-main h1")).toBeVisible();
    });
  }

  test("sidebar navigation reaches each section", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.locator("nav.admin-nav a").evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href") ?? ""),
    );
    for (const route of ROUTES.slice(1)) {
      expect(hrefs.some((href) => href.startsWith(route.replace(/\/$/, "")))).toBe(true);
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

test.describe("default build denies access", () => {
  // The default build (no OMDALA_ADMIN_PREVIEW) is served on the port after the preview one.
  const denyURL = "http://127.0.0.1:3017";
  test.skip(Boolean(process.env.E2E_BASE_URL), "needs the local default-build server");

  test("renders access-restricted and no admin data or navigation", async ({ page }) => {
    const response = await page.goto(`${denyURL}/`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/admin role required/i);
    await expect(page.getByText(/access restricted/i)).toBeVisible();
    await expect(page.locator("nav.admin-nav")).toHaveCount(0);
    await expect(page.locator(".admin-list-item")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("operator@omdala.com");
  });

  test("deny build still ships noindex", async ({ page }) => {
    await page.goto(`${denyURL}/providers/`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/admin role required/i);
  });
});

test.describe("content security policy", () => {
  test("pages load under the shipped CSP and the API health call is allowed", async ({ page }) => {
    await page.route("https://api.omdala.com/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ ok: true, data: { providers: [], total: 0, modelCallExecuted: false } }),
      }),
    );
    const violations = await watchCsp(page);
    for (const route of ["/", "/providers/", "/nodes/"]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
    }
    expect(await violations()).toEqual([]);
  });
});
