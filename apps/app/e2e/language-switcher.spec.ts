import { expect, test } from "@playwright/test";

test.describe("language switcher", () => {
  test("is styled as a pill group with a visibly active item", async ({ page }) => {
    await page.goto("/login?lang=en");
    const switcher = page.locator(".language-switcher");
    await expect(switcher).toBeVisible();
    const radius = await switcher.evaluate((node) => getComputedStyle(node).borderTopLeftRadius);
    expect(parseFloat(radius)).toBeGreaterThan(8);

    const active = switcher.locator(".language-switcher__item--active");
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText("EN");
    const inactive = switcher.locator("a.language-switcher__item:not(.language-switcher__item--active)").first();
    const [activeColor, inactiveColor] = await Promise.all([
      active.evaluate((node) => getComputedStyle(node).color),
      inactive.evaluate((node) => getComputedStyle(node).color),
    ]);
    expect(activeColor).not.toBe(inactiveColor);
  });

  test("switching to VI keeps the page and updates lang", async ({ page }) => {
    await page.goto("/login?lang=en");
    await page.locator(".language-switcher a", { hasText: "VI" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    expect(new URL(page.url()).searchParams.get("lang")).toBe("vi");
  });
});
