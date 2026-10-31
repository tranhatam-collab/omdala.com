import { expect, test } from "@playwright/test";

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
