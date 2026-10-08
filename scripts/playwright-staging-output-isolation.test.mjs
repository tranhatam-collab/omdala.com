import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { resolveStagingPlaywrightOutputPolicy } from "../apps/app/playwright-staging-policy.ts";

const configPath = resolve("apps/app/playwright.staging.config.ts");
const configUrl = pathToFileURL(configPath).href;

describe("staging Playwright output isolation", () => {
  it("fails closed without external canonical output and JSON report paths", () => {
    assert.throws(
      () => resolveStagingPlaywrightOutputPolicy({}, configUrl),
      /E2E_STAGING_OUTPUT_DIR/,
    );
    assert.throws(
      () => resolveStagingPlaywrightOutputPolicy({
        E2E_STAGING_OUTPUT_DIR: resolve("apps/app"),
        E2E_STAGING_JSON_REPORT: join(tmpdir(), "report.json"),
      }, configUrl),
      /outside the candidate checkout/,
    );
    assert.throws(
      () => resolveStagingPlaywrightOutputPolicy({
        E2E_STAGING_OUTPUT_DIR: tmpdir(),
        E2E_STAGING_JSON_REPORT: "",
      }, configUrl),
      /E2E_STAGING_JSON_REPORT/,
    );
  });

  it("accepts canonical paths outside the candidate checkout", () => {
    const sandbox = mkdtempSync(join(tmpdir(), "omdala-playwright-staging-"));
    try {
      const policy = resolveStagingPlaywrightOutputPolicy({
        E2E_STAGING_OUTPUT_DIR: sandbox,
        E2E_STAGING_JSON_REPORT: join(sandbox, "report.json"),
      }, configUrl);
      assert.equal(policy.outputDirectory, realpathSync(sandbox));
      assert.equal(policy.jsonReport, join(sandbox, "report.json"));
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it("uses only a protected JSON reporter so candidate response values cannot reach stdout", () => {
    const source = readFileSync(configPath, "utf8");
    assert.match(source, /reporter: \[\["json", \{ outputFile: stagingJsonReport \}\]\]/);
    assert.doesNotMatch(source, /\["line"\]|\["list"\]|console\./);
    assert.match(source, /Console reporters are\n\s+\/\/ forbidden because assertion diffs can echo candidate-controlled response data/);
  });
});
