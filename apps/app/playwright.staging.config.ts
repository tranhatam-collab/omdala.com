import { defineConfig } from "@playwright/test";

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required staging acceptance variable: ${name}`);
  return value.replace(/\/+$/g, "");
}

const appBaseURL = requiredEnvironment("E2E_STAGING_APP_URL");
requiredEnvironment("E2E_STAGING_API_URL");
requiredEnvironment("E2E_STAGING_BRAND_URL");
requiredEnvironment("E2E_STAGING_WEB_URL");
requiredEnvironment("E2E_TEST_SECRET");
requiredEnvironment("E2E_RELEASE_SHA");
requiredEnvironment("E2E_API_DEPLOYMENT_ID");
requiredEnvironment("E2E_SURFACE_RELEASE_ID");

export default defineConfig({
  testDir: "./e2e-staging",
  fullyParallel: false,
  timeout: 120000,
  retries: 0,
  workers: 1,
  reporter: process.env.E2E_STAGING_JSON_REPORT
    ? [
        ["line"],
        ["json", { outputFile: process.env.E2E_STAGING_JSON_REPORT }],
      ]
    : [["list"]],
  expect: { timeout: 15000 },
  use: {
    baseURL: appBaseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
