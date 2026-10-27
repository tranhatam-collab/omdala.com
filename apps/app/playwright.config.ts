import { defineConfig } from "@playwright/test";

declare const process:
  | {
      env?: {
        E2E_BASE_URL?: string;
        CI?: string;
      };
    }
  | undefined;

const baseURL = process?.env?.E2E_BASE_URL || "http://127.0.0.1:3001";
const useExternalBaseUrl = Boolean(process?.env?.E2E_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  workers: 1,
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: {
      args: ["--disable-features=UseMachPortRendezvousServer"],
    },
  },
  ...(useExternalBaseUrl
    ? {}
    : {
        webServer: {
          command: "pnpm dev",
          url: baseURL,
          reuseExistingServer: process?.env?.CI !== "true",
          timeout: 120000,
        },
      }),
});
