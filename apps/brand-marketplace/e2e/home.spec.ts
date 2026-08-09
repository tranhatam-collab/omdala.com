import { test, expect } from "@playwright/test";

test.describe("Brand Exchange - public navigation", () => {
  test("renders the English home page with a Phase 1 boundary", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Acquire a digital brand with the evidence attached." })).toBeVisible();
    await expect(page.getByText("No online checkout is available in Phase 1.")).toBeVisible();
    await expect(page.getByRole("link", { name: "OMCode" }).first()).toBeVisible();
  });

  test("navigates to the approved brand index", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Brand Exchange navigation" }).getByRole("link", { name: "All brands" }).click();
    await expect(page).toHaveURL(/\/en\/brands$/);
    await expect(page.getByRole("heading", { name: "Brand packages with explicit handoff boundaries." })).toBeVisible();
  });

  test("navigates to a real category route", async ({ page }) => {
    await page.goto("/");
    const categoryLink = page.locator('a[href="/en/categories/ai"]').first();
    await expect(categoryLink).toHaveAttribute("href", "/en/categories/ai");
    // Load the asserted route directly to avoid a Next dev-mode navigation race.
    await page.goto("/en/categories/ai");
    await expect(page).toHaveURL(/\/en\/categories\/ai$/);
    await expect(page.getByRole("heading", { name: "AI brand packages" })).toBeVisible();
    await expect(page.getByRole("link", { name: "OMCode" })).toBeVisible();
  });

  test("renders the English locale root", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "Acquire a digital brand with the evidence attached." })).toBeVisible();
  });

  test("renders a Phase 1 buyer guide", async ({ page }) => {
    await page.goto("/en/buy");
    await expect(page.getByRole("heading", { name: "Buy a verified digital brand with a clearer boundary." })).toBeVisible();
    await expect(page.getByText("High-value assets never use an instant checkout.")).toBeVisible();
  });
});
