import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("robots.txt", () => {
  test("app is noindex and has a single source", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/Disallow: \//);
    expect(body).not.toMatch(/Allow: \//);
    expect(existsSync(path.join(__dirname, "..", "public", "robots.txt"))).toBe(false);
  });
});
