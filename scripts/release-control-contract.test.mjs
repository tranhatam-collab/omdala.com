import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { evaluateReleaseControlSources } from "./release-control-contract.mjs";

function actualSources() {
  return {
    apiDeploy: readFileSync(".github/workflows/deploy.yml", "utf8"),
    surfaceDeploy: readFileSync(".github/workflows/deploy-surfaces.yml", "utf8"),
    staging: readFileSync(".github/workflows/staging-go-live-e2e.yml", "utf8"),
    independent: readFileSync(".github/workflows/independent-review.yml", "utf8"),
    codeowners: readFileSync(".github/CODEOWNERS", "utf8"),
    mailE2e: readFileSync("apps/app/e2e-staging/go-live.spec.ts", "utf8"),
  };
}

describe("release control source contract", () => {
  it("accepts the complete fail-closed release chain", () => {
    const result = evaluateReleaseControlSources(actualSources());
    assert.equal(result.accepted, true, JSON.stringify(result.checks));
    assert.equal(result.passed, result.total);
  });

  it("rejects migration when the backup/restore gate is removed", () => {
    const files = actualSources();
    files.apiDeploy = files.apiDeploy.replace(
      "Backup, restore, and verify before migration",
      "Unverified database operation",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
  });

  it("rejects continue-on-error in a release workflow", () => {
    const files = actualSources();
    files.staging += "\ncontinue-on-error: true\n";
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
  });
});
