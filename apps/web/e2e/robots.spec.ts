import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("robots.txt", () => {
  test("web is indexable with a sitemap and has a single source", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/Allow: \//);
    expect(body).toMatch(/Sitemap: https:\/\/omdala\.com\/sitemap\.xml/);
    expect(existsSync(path.join(__dirname, "..", "public", "robots.txt"))).toBe(false);
  });
});
