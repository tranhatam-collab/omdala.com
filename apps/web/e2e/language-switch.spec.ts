import { test, expect } from "@playwright/test";

test("language switch updates nav text EN -> VI", async ({ page }) => {
  await page.goto("/?lang=en");

  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator(".site-nav")).toContainText("How it works");

  await page.locator(".language-dropdown__toggle").click();
  await page.getByRole("link", { name: "Tiếng Việt" }).click();

  await page.waitForURL((url) => url.searchParams.get("lang") === "vi");
  await expect(page.locator(".language-dropdown__toggle")).toContainText("VI");
  await expect(page.locator(".site-nav")).toContainText("OMDALA là gì");
  await expect(page.locator(".site-nav")).toContainText("Cách vận hành");
});
