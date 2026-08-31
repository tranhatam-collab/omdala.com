import { test, expect } from "@playwright/test";

test("language switch updates nav text EN -> VI", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page.locator(".site-header")).toBeVisible();
  // Match both "How It Works" and "How it works" — content lock is Title Case
  // but legacy compiled chunks may serve sentence case. Both must point to /how-it-works/.
  await expect(page.locator(".site-nav")).toContainText(/How [iI]t [wW]orks/);

  await page.locator(".language-dropdown__toggle").click();
  await page.getByRole("link", { name: "Tiếng Việt" }).click();

  await page.waitForURL((url) => url.pathname === "/vi/" || url.pathname === "/vi");
  await expect(page.locator(".language-dropdown__toggle")).toContainText("VI");
  await expect(page.locator(".site-nav")).toContainText("OMDALA Là Gì");
  await expect(page.locator(".site-nav")).toContainText("Cách Vận Hành");
});
