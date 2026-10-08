import { defineConfig } from "@playwright/test";
import { validateProductionE2EEnvironment } from "../../scripts/production-e2e-config.mjs";

const production = validateProductionE2EEnvironment();

export default defineConfig({
  testDir: "./e2e-production",
  fullyParallel: false,
  timeout: 120000,
  retries: 0,
  workers: 1,
  reporter: process.env.E2E_PRODUCTION_JSON_REPORT
    ? [
        ["line"],
        ["json", { outputFile: process.env.E2E_PRODUCTION_JSON_REPORT }],
      ]
    : [["list"]],
  expect: { timeout: 15000 },
  use: {
    baseURL: production.appUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
