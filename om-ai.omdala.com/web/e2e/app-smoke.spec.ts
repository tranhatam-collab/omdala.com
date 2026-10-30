import { expect, test } from '@playwright/test';
import { mockApi } from './support/mockApi';

test('app MVP smoke: page loads, magic link request, and live card flow with a mocked API', async ({ page }) => {
  const hosts = await mockApi(page);

  await page.goto('/');
  expect(await page.title()).toMatch(/Om AI/);
  expect(((await page.locator('body').textContent()) ?? '').trim().length).toBeGreaterThan(0);

  await page.getByPlaceholder(/you@domain.com/).fill('verify@app.omdala.com');
  await page.getByRole('button', { name: /Send magic link/ }).click();
  await expect(page.getByText(/Check your email: verify@app.omdala.com/)).toBeVisible();

  await expect(page.getByText(/plan=free \/ free=0\/1800 \/ remaining=1800/)).toBeVisible();
  await page.getByRole('button', { name: 'Create session' }).click();
  await expect(page.getByText(/created=live_session_e2e_01 \/ status=blocked/)).toBeVisible();

  await page.getByRole('button', { name: /Save memory/i }).click();
  await expect(page.getByText(/saved=2026-10-30/)).toBeVisible();

  // Hermetic: nothing left the local server.
  expect([...hosts].every((host) => host.startsWith('127.0.0.1'))).toBeTruthy();
});
