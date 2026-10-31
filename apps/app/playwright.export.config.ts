import { defineConfig } from "@playwright/test";

declare const process:
  | { env?: { E2E_BASE_URL?: string; PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?: string } }
  | undefined;

const baseURL = process?.env?.E2E_BASE_URL || "http://127.0.0.1:3018";
const useExternalBaseUrl = Boolean(process?.env?.E2E_BASE_URL);
const chromiumExecutablePath = process?.env?.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

// Specs that need the real response headers (CSP) run against the static export (ADR-002),
// served with the export's own `_headers`; `next dev` sends none of them.
export default defineConfig({
  testDir: "./e2e-export",
  timeout: 90000,
  retries: 0,
  workers: 1,
  expect: { timeout: 15000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: {
      args: ["--disable-features=UseMachPortRendezvousServer"],
      ...(chromiumExecutablePath ? { executablePath: chromiumExecutablePath } : {}),
    },
  },
  ...(useExternalBaseUrl
    ? {}
    : {
        webServer: {
          command: "pnpm --filter @omdala/app run build && PORT=3018 node e2e/serve-static.mjs",
          cwd: "../app",
          url: baseURL,
          reuseExistingServer: false,
          timeout: 300000,
        },
      }),
});
