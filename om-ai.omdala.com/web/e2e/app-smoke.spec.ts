import { test, expect } from '@playwright/test';

const API_ORIGIN = process.env.OM_AI_SMOKE_API_ORIGIN || 'https://api.omdala.com';
const SMOKE_USER_ID = process.env.OM_AI_SMOKE_USER_ID || 'playwright_om_ai_web_smoke';
const TARGET_PERSONA_ID = process.env.OM_AI_SMOKE_PERSONA_ID || 'teacher_english_01';

test('app MVP smoke: auth placeholder and Om AI live web bridge flow', async ({ page }) => {
  await page.goto('/');
  const title = await page.title();
  expect(/Om AI|OMDALA App|AI Om/i.test(title)).toBeTruthy();

  const bodyText = ((await page.locator('body').textContent()) ?? '').trim();
  expect(bodyText.length).toBeGreaterThan(0);

  const magicLinkResp = await page.request.post(`${API_ORIGIN}/v1/auth/magic-link/request`, {
    data: { email: 'verify@app.omdala.com', redirectTo: '/dashboard' },
  });
  expect(magicLinkResp.status()).toBeGreaterThanOrEqual(200);
  expect(magicLinkResp.status()).toBeLessThan(300);

  const healthResp = await page.request.get(`${API_ORIGIN}/v2/reality/health`);
  expect(healthResp.status()).toBe(200);

  const personaResp = await page.request.get(`${API_ORIGIN}/v2/live/personas/${TARGET_PERSONA_ID}`);
  expect(personaResp.status()).toBe(200);
  const personaBody = await personaResp.json();
  expect(personaBody.data.persona_id).toBe(TARGET_PERSONA_ID);
  expect(Array.isArray(personaBody.data.supported_modes)).toBeTruthy();
  expect(personaBody.data.supported_modes).toContain('voice_call');

  const memorySaveResp = await page.request.patch(`${API_ORIGIN}/v2/live/memory/profile`, {
    data: {
      user_id: SMOKE_USER_ID,
      display_name: 'Playwright Om AI Smoke',
      timezone: 'Asia/Ho_Chi_Minh',
      target_language: 'en',
      correction_style: 'gentle',
    },
  });
  expect(memorySaveResp.status()).toBe(200);
  const memorySaveBody = await memorySaveResp.json();
  expect(memorySaveBody.data.profile.user_id).toBe(SMOKE_USER_ID);
  expect(memorySaveBody.data.profile.timezone).toBe('Asia/Ho_Chi_Minh');
  expect(memorySaveBody.data.profile.target_language).toBe('en');
  expect(memorySaveBody.data.profile.correction_style).toBe('gentle');

  const memoryRefreshResp = await page.request.get(`${API_ORIGIN}/v2/live/memory/profile?user_id=${encodeURIComponent(SMOKE_USER_ID)}`);
  expect(memoryRefreshResp.status()).toBe(200);
  const memoryRefreshBody = await memoryRefreshResp.json();
  expect(memoryRefreshBody.data.profile.user_id).toBe(SMOKE_USER_ID);
  expect(memoryRefreshBody.data.profile.target_language).toBe('en');

  const plansResp = await page.request.get(`${API_ORIGIN}/v2/live/plans`);
  expect(plansResp.status()).toBe(200);
  const plansBody = await plansResp.json();
  expect(Array.isArray(plansBody.data.plans)).toBeTruthy();
  expect(plansBody.data.plans.some((plan: { plan_id: string }) => plan.plan_id === 'personal_pro')).toBeTruthy();

  const upgradeResp = await page.request.post(`${API_ORIGIN}/v2/live/plans/upgrade`, {
    data: {
      user_id: SMOKE_USER_ID,
      plan_id: 'personal_pro',
    },
  });
  expect(upgradeResp.status()).toBe(200);
  const upgradeBody = await upgradeResp.json();
  expect(upgradeBody.data.subscription.user_id).toBe(SMOKE_USER_ID);
  expect(upgradeBody.data.subscription.plan_id).toBe('personal_pro');

  const usageResp = await page.request.get(`${API_ORIGIN}/v2/live/usage/today?user_id=${encodeURIComponent(SMOKE_USER_ID)}`);
  expect(usageResp.status()).toBe(200);
  const usageBody = await usageResp.json();
  expect(usageBody.data.usage.plan_id).toBe('personal_pro');
});
