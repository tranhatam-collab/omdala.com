import { defineConfig } from "@playwright/test";

declare const process:
  | {
      env?: {
        E2E_BASE_URL?: string;
        CI?: string;
        PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?: string;
      };
    }
  | undefined;

const baseURL = process?.env?.E2E_BASE_URL || "http://127.0.0.1:3010";
const useExternalBaseUrl = Boolean(process?.env?.E2E_BASE_URL);
const chromiumExecutablePath = process?.env?.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 90000,
  retries: 0,
  workers: 1,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: {
      args: ["--disable-features=UseMachPortRendezvousServer"],
      ...(chromiumExecutablePath
        ? { executablePath: chromiumExecutablePath }
        : {}),
    },
  },
  ...(useExternalBaseUrl
    ? {}
    : {
        webServer: {
          command: "pnpm exec next dev --port 3010",
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120000,
        },
      }),
});
