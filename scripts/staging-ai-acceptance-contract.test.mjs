import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { evaluateStagingAiAcceptanceSources } from "./staging-ai-acceptance-contract.mjs";

function sources() {
  return {
    workflow: readFileSync(".github/workflows/staging-go-live-e2e.yml", "utf8"),
    e2e: readFileSync("apps/app/e2e-staging/go-live.spec.ts", "utf8"),
    verifier: readFileSync("scripts/verify-team-ai-staging-receipt.mjs", "utf8"),
  };
}

function failingCheck(result, id) {
  return result.checks.find((check) => check.id === id)?.pass === false;
}

describe("staging AI acceptance source contract", () => {
  it("accepts the exact protected cross-repository receipt and authenticated call chain", () => {
    const result = evaluateStagingAiAcceptanceSources(sources());
    assert.equal(result.verdict, "STAGING_AI_ACCEPTANCE_CONTRACT_ACCEPTED");
    assert.equal(result.checks.every((check) => check.pass), true);
  });

  it("rejects replacing the explicit cross-repository token with the caller token", () => {
    const candidate = sources();
    candidate.workflow = candidate.workflow.replaceAll(
      "secrets.AIAGENT_CROSS_REPO_READ_TOKEN",
      "github.token",
    );
    const result = evaluateStagingAiAcceptanceSources(candidate);
    assert.equal(failingCheck(result, "EXPLICIT_CROSS_REPO_READ_AUTHORITY"), true);
  });

  it("rejects a caller-supplied provider identity", () => {
    const candidate = sources();
    candidate.workflow = candidate.workflow.replace(
      "      team_ai_staging_acceptance_run_id:",
      "      provider_version_id:\n        required: true\n        type: string\n      team_ai_staging_acceptance_run_id:",
    );
    const result = evaluateStagingAiAcceptanceSources(candidate);
    assert.equal(failingCheck(result, "TEAM_AI_RUN_ID_ONLY_INPUT"), true);
  });

  it("rejects a staging E2E that omits the authenticated AI chat", () => {
    const candidate = sources();
    candidate.e2e = candidate.e2e.replace(
      'context.request.post(`${apiUrl}/v1/ai/chat`',
      'context.request.post(`${apiUrl}/v1/ai/disabled`',
    );
    const result = evaluateStagingAiAcceptanceSources(candidate);
    assert.equal(failingCheck(result, "AUTHENTICATED_OMDALA_AI_CALL_EXECUTED"), true);
  });

  it("rejects removing the full Team AI receipt from immutable evidence", () => {
    const candidate = sources();
    candidate.workflow = candidate.workflow.replaceAll(
      "release-chain/team-ai/receipt/omdala-staging-ai-receipt.json",
      "release-chain/team-ai/receipt/omitted.json",
    );
    const result = evaluateStagingAiAcceptanceSources(candidate);
    assert.equal(failingCheck(result, "FULL_TEAM_AI_RECEIPT_DOWNLOADED_AND_VERIFIED"), true);
  });

  it("rejects removing the Team AI chain from the final acceptance receipt", () => {
    const candidate = sources();
    candidate.workflow = candidate.workflow.replace(
      "--slurpfile team_ai_chain staging-ai-chain.json",
      "--arg team_ai_chain omitted",
    );
    const result = evaluateStagingAiAcceptanceSources(candidate);
    assert.equal(failingCheck(result, "FINAL_ACCEPTANCE_HASH_BINDS_AI_CHAIN"), true);
  });
});
