import { expect, test } from '@playwright/test';
import { failWith, mockApi, ok } from './support/mockApi';

const liveCard = (page: import('@playwright/test').Page) =>
  page.locator('section.card').filter({ has: page.getByRole('heading', { name: /Om AI Live Execution/ }) });
const warning = (page: import('@playwright/test').Page) => liveCard(page).locator('p.warning-line');

test('backend down shows the unavailable message, not a blank screen or a raw code', async ({ page }) => {
  await page.route(/\/(v1|v2)\//, (route) => route.abort('connectionrefused'));
  await page.goto('/');
  await expect(page.getByText('Om AI Live Execution')).toBeVisible();
  await expect(warning(page)).toContainText('Om AI is not reachable right now');
  await expect(warning(page)).toContainText('nothing was charged');
  await expect(page.locator('body')).not.toContainText('network_error');
});

test('quota exhausted shows the free-time message', async ({ page }) => {
  await mockApi(page, {
    'GET /v2/live/usage/today': (route) =>
      ok(route, {
        usage: { user_id: 'u', date_key: '2026-10-30', free_seconds_limit: 1800, free_seconds_used: 1800, premium_seconds_used: 0, free_seconds_remaining: 0, plan_id: 'free' },
      }),
  });
  await page.goto('/');
  await expect(warning(page)).toContainText("used today's free practice time");
  await expect(warning(page)).toContainText('resets tomorrow');
  await expect(page.locator('body')).not.toContainText('quota_exhausted');
});

test('provider 429 on session create shows the busy message', async ({ page }) => {
  await mockApi(page, { 'POST /v2/live/sessions/create': (route) => failWith(route, 429) });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create session' }).click();
  await expect(warning(page)).toContainText('The AI teacher is busy right now');
  await expect(page.locator('body')).not.toContainText('http_429');
});

test('plan change refusal shows the billing message', async ({ page }) => {
  await mockApi(page, {
    'POST /v2/live/plans/upgrade': (route) => failWith(route, 403, 'PLAN_CHANGE_REQUIRES_BILLING'),
  });
  await page.goto('/');
  await liveCard(page).locator('select').last().selectOption('personal_pro');
  await page.getByRole('button', { name: 'Upgrade plan' }).click();
  await expect(warning(page)).toContainText('handled through billing');
  await expect(page.locator('body')).not.toContainText('PLAN_CHANGE_REQUIRES_BILLING');
});

test('provider unavailable (503 from the authority) shows the unavailable message', async ({ page }) => {
  await mockApi(page, {
    'POST /v2/live/sessions/create': (route) => failWith(route, 503, 'ai_authority_unavailable'),
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create session' }).click();
  await expect(warning(page)).toContainText('not reachable right now');
});
