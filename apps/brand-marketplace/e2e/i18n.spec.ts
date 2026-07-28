import { test, expect } from "@playwright/test";

test.describe("Brand Exchange - Vietnamese surface", () => {
  test("switches from English to Vietnamese", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("navigation", { name: "Brand Exchange navigation" }).getByRole("link", { name: "VI", exact: true }).click();
    await expect(page).toHaveURL(/\/vi$/);
    await expect(page.getByRole("heading", { name: "Sở hữu thương hiệu số với hồ sơ bằng chứng rõ ràng." })).toBeVisible();
  });

  test("keeps Vietnamese listing links in the Vietnamese route tree", async ({ page }) => {
    await page.goto("/vi/brands");
    const listing = page.getByRole("link", { name: "OMCode" }).first();
    await expect(listing).toHaveAttribute("href", "/vi/brands/omcode");
    // Assert the rendered locale path, then load it directly to avoid a dev-mode navigation race.
    await page.goto("/vi/brands/omcode");
    await expect(page).toHaveURL(/\/vi\/brands\/omcode$/);
    await expect(page.getByText("Tóm tắt thương hiệu")).toBeVisible();
  });

  test("renders Vietnamese category and information pages", async ({ page }) => {
    await page.goto("/vi/categories/education");
    await expect(page.getByRole("heading", { name: "Gói thương hiệu Education" })).toBeVisible();
    await expect(page.getByRole("link", { name: "AI Academy" })).toBeVisible();
    await page.goto("/vi/mua-ban-thuong-hieu");
    await expect(page.getByRole("heading", { name: "Mua thương hiệu số với ranh giới tài sản rõ ràng." })).toBeVisible();
  });

  test("renders Vietnamese inquiry handoff", async ({ page }) => {
    await page.goto("/vi/brands/omcode/inquiry?intent=request_proof_access");
    await expect(page.getByRole("heading", { name: "Yêu cầu quyền xem proof" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tiếp tục tới app.omdala.com" })).toBeVisible();
  });
});
