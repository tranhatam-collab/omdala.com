import { defineConfig, devices } from '@playwright/test';

// Hermetic: the app is served locally in `--mode e2e` and every /v2 and /v1 call is mocked with
// page.route, so no test reaches api.omdala.com. Browsers are never downloaded here; set
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH (for example /opt/pw-browsers/chromium) to use an installed one.
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const port = Number(process.env.OM_AI_E2E_PORT || 4173);

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    ...devices['Desktop Chrome'],
    launchOptions: chromiumPath ? { executablePath: chromiumPath, args: ['--no-sandbox'] } : {},
  },
  webServer: {
    command: `npx vite --mode e2e --host 127.0.0.1 --port ${port} --strictPort`,
    cwd: '..',
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
