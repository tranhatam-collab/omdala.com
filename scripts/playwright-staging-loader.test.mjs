import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const app = join(root, "apps/app");
const playwright = join(app, "node_modules/@playwright/test/cli.js");
const base = {
  E2E_STAGING_APP_URL: "https://app-staging.omdala.com",
  E2E_STAGING_AUTH_URL: "https://auth-staging.omdala.com",
  E2E_STAGING_API_URL: "https://api-staging.omdala.com",
  E2E_STAGING_BRAND_URL: "https://brand-staging.omdala.com",
  E2E_STAGING_WEB_URL: "https://staging.omdala.com",
  E2E_TEST_SECRET: "non-secret-loader-fixture",
  E2E_STAGING_MAIL_SINK_ADDRESS: "sink@example.invalid",
  E2E_RELEASE_SHA: "0".repeat(40),
  E2E_API_DEPLOYMENT_ID: "loader-fixture",
  E2E_SURFACE_RELEASE_ID: "loader-fixture",
};

function run(extra) {
  return spawnSync(
    process.execPath,
    [playwright, "test", "--config", "playwright.staging.config.ts", "--list"],
    {
      cwd: app,
      encoding: "utf8",
      env: { ...process.env, ...base, ...extra },
      timeout: 30000,
    },
  );
}

describe("staging Playwright config under the real loader", () => {
  it("lists four scenarios without executing them and rejects output inside the candidate", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "omdala-pw-loader-")));
    const paths = {
      E2E_STAGING_OUTPUT_DIR: directory,
      E2E_STAGING_JSON_REPORT: join(directory, "report.json"),
    };
    try {
      const loaded = run(paths);
      assert.ifError(loaded.error);
      assert.equal(loaded.status, 0, loaded.stdout + loaded.stderr);
      assert.match(loaded.stdout, /Total: 4 tests in 1 file/);
      const rejected = run({ ...paths, E2E_STAGING_OUTPUT_DIR: app });
      assert.ifError(rejected.error);
      assert.notEqual(rejected.status, 0);
      assert.match(rejected.stdout + rejected.stderr, /outside the candidate checkout/);
      const missingOrigin = run({ ...paths, E2E_STAGING_APP_URL: "" });
      assert.ifError(missingOrigin.error);
      assert.notEqual(missingOrigin.status, 0);
      assert.match(missingOrigin.stdout + missingOrigin.stderr, /Missing required staging acceptance variable: E2E_STAGING_APP_URL/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
