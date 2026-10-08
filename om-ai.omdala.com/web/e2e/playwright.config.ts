import { devices } from '@playwright/test';

/** Basic Playwright config for app smoke tests (web portion) */
export default {
  testDir: '.',
  timeout: 60000,
  use: {
    baseURL: process.env.BASE_URL || 'https://app.omdala.com',
  },
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
  ],
};
