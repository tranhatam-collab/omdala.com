import { test, expect } from '@playwright/test';

test('app MVP smoke: sign in flow placeholder', async ({ page }) => {
  await page.goto('/');
  // Expect sign-in UI present on web app
  await expect(page.locator('text=Send magic link')).toBeVisible();
  await page.fill('input[placeholder="you@domain.com"]', 'verify@app.omdala.com');
  // Intercept magic-link request
  const [response] = await Promise.all([
    page.waitForResponse((resp) => resp.url().includes('/v1/auth/magic-link/request') && resp.status() === 201),
    page.click('text=Send magic link'),
  ]);
  // Ensure response ok
  expect(response.ok()).toBeTruthy();
});
