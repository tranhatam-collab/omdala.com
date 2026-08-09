import { test, expect } from "@playwright/test";

test.describe("Brand Exchange - brand detail and inquiry", () => {
  test("renders the full public detail boundary for OMCode", async ({ page }) => {
    await page.goto("/en/brands/omcode");
    await expect(page.getByRole("heading", { name: "OMCode" })).toBeVisible();
    await expect(page.getByText("A package, not just a name.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Included assets" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Verification summary" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /\$10,000 - \$50,000/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Request proof access" })).toBeVisible();
  });

  test("keeps Phase 1 checkout disabled even for a low-value package", async ({ page }) => {
    await page.goto("/en/brands/omdala-docs");
    await expect(page.getByText("Inquiry required in Phase 1")).toBeVisible();
    await expect(page.getByRole("link", { name: /Buy Now/i })).toHaveCount(0);
  });

  test("opens a functional inquiry handoff route", async ({ page }) => {
    await page.goto("/en/brands/omcode");
    await page.getByRole("link", { name: "Submit offer" }).click();
    await expect(page).toHaveURL(/\/en\/brands\/omcode\/inquiry\?intent=submit_offer/);
    await expect(page.getByRole("heading", { name: "Submit offer" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue to app.omdala.com" })).toHaveAttribute("href", /app\.omdala\.com\/brands\/omcode\?intent=submit_offer/);
  });

  test("returns 404 for a brand outside public inventory", async ({ page }) => {
    const response = await page.goto("/en/brands/nonexistent-brand-xyz");
    expect(response?.status()).toBe(404);
  });
});
