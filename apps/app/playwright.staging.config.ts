import { defineConfig } from "@playwright/test";
import { resolveStagingPlaywrightOutputPolicy } from "./playwright-staging-policy";

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required staging acceptance variable: ${name}`);
  return value.replace(/\/+$/g, "");
}

function requiredStagingOrigin(name: string, expected: string): string {
  const value = requiredEnvironment(name);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
  if (
    parsed.origin !== expected ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`${name} must be the canonical staging origin ${expected}`);
  }
  return parsed.origin;
}

const appBaseURL = requiredStagingOrigin(
  "E2E_STAGING_APP_URL",
  "https://app-staging.omdala.com",
);
requiredStagingOrigin("E2E_STAGING_AUTH_URL", "https://auth-staging.omdala.com");
requiredStagingOrigin("E2E_STAGING_API_URL", "https://api-staging.omdala.com");
requiredStagingOrigin("E2E_STAGING_BRAND_URL", "https://brand-staging.omdala.com");
requiredStagingOrigin("E2E_STAGING_WEB_URL", "https://staging.omdala.com");
requiredEnvironment("E2E_TEST_SECRET");
requiredEnvironment("E2E_STAGING_MAIL_SINK_ADDRESS");
if (!/^[a-f0-9]{40}$/.test(requiredEnvironment("E2E_RELEASE_SHA"))) {
  throw new Error("E2E_RELEASE_SHA must be a full lowercase Git SHA");
}
requiredEnvironment("E2E_API_DEPLOYMENT_ID");
requiredEnvironment("E2E_SURFACE_RELEASE_ID");
const { outputDirectory: stagingOutputDirectory, jsonReport: stagingJsonReport } =
  resolveStagingPlaywrightOutputPolicy(process.env, import.meta.url);

export default defineConfig({
  testDir: "./e2e-staging",
  outputDir: stagingOutputDirectory,
  fullyParallel: false,
  timeout: 120000,
  retries: 0,
  workers: 1,
  // The JSON reporter writes to a protected external file. Console reporters are
  // forbidden because assertion diffs can echo candidate-controlled response data.
  reporter: [["json", { outputFile: stagingJsonReport }]],
  expect: { timeout: 15000 },
  use: {
    baseURL: appBaseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
