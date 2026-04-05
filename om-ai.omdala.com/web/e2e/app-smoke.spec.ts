import { test, expect } from '@playwright/test';

test('app MVP smoke: sign in flow placeholder', async ({ page }) => {
  await page.goto('/');
  const title = await page.title();
  expect(/Om AI|OMDALA App|AI Om/i.test(title)).toBeTruthy();

  // API smoke from browser context (magic-link + reality health)
  const magicLinkResp = await page.request.post('https://api.omdala.com/v1/auth/magic-link/request', {
    data: { email: 'verify@app.omdala.com', redirectTo: '/dashboard' },
  });
  expect(magicLinkResp.status()).toBeGreaterThanOrEqual(200);
  expect(magicLinkResp.status()).toBeLessThan(300);

  const healthResp = await page.request.get('https://api.omdala.com/v2/reality/health');
  expect(healthResp.status()).toBe(200);
});
