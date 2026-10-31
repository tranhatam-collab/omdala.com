import { expect, test } from "@playwright/test";

test.describe("legacy routes", () => {
  test("/sign-in no longer ships the skeleton form; it leads to /login", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForURL(/\/login\/?(\?.*)?$/);
    await expect(page.locator("body")).not.toContainText("127.0.0.1:8789");
    await expect(page.locator("body")).not.toContainText("does not send email yet");
  });
});
