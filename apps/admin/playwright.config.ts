import { defineConfig } from "@playwright/test";

declare const process:
  | {
      env?: {
        E2E_BASE_URL?: string;
        PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?: string;
      };
    }
  | undefined;

const baseURL = process?.env?.E2E_BASE_URL || "http://127.0.0.1:3016";
const useExternalBaseUrl = Boolean(process?.env?.E2E_BASE_URL);
const chromiumExecutablePath = process?.env?.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 60000,
  retries: 0,
  workers: 1,
  expect: { timeout: 10000 },
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
        // Tests run against the static export (ADR-002), not next dev.
        webServer: {
          command: "pnpm --filter @omdala/admin run build && node e2e/serve-static.mjs",
          cwd: "../admin",
          url: baseURL,
          reuseExistingServer: false,
          timeout: 240000,
        },
      }),
});
