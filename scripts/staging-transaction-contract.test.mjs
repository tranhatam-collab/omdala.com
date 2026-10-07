import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { evaluateStagingTransactionSources } from "./staging-transaction-contract.mjs";

function sources() {
  return {
    orchestrator: readFileSync(".github/workflows/staging-transaction.yml", "utf8"),
    api: readFileSync(".github/workflows/deploy.yml", "utf8"),
    surfaces: readFileSync(".github/workflows/deploy-surfaces.yml", "utf8"),
    acceptance: readFileSync(".github/workflows/staging-go-live-e2e.yml", "utf8"),
    recovery: readFileSync(".github/workflows/staging-recovery.yml", "utf8"),
    recoveryPlan: readFileSync("scripts/staging-recovery-plan.mjs", "utf8"),
    recoveryScript: readFileSync("scripts/staging-transaction-recovery.sh", "utf8"),
  };
}

function check(result, id) {
  return result.checks.find((entry) => entry.id === id)?.pass;
}

describe("staging transaction source contract", () => {
  it("accepts the hard-disabled transaction design and its future compensation path", () => {
    const result = evaluateStagingTransactionSources(sources());
    assert.equal(result.verdict, "STAGING_TRANSACTION_SOURCE_ACCEPTED");
    assert.equal(result.checks.every((entry) => entry.pass), true);
  });

  it("rejects candidate-scoped concurrency that permits overlapping staging mutations", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replace(
      "group: omdala-staging-transaction",
      "group: omdala-staging-transaction-${{ inputs.candidate_sha }}",
    );
    const result = evaluateStagingTransactionSources(candidate);
    assert.equal(check(result, "ONE_CONSTANT_TRANSACTION_CONCURRENCY"), false);
  });

  it("rejects removal of the direct child dispatch guard", () => {
    const candidate = sources();
    candidate.api = candidate.api.replace(
      "DIRECT_STAGING_CHILD_DISPATCH_BLOCKED",
      "DIRECT_STAGING_CHILD_DISPATCH_ALLOWED",
    );
    const result = evaluateStagingTransactionSources(candidate);
    assert.equal(
      check(result, "CHILDREN_ARE_REUSABLE_AND_DIRECT_STAGING_FAILS_CLOSED"),
      false,
    );
  });

  it("rejects invalid job workflow identity expressions", () => {
    const candidate = sources();
    candidate.api += "\n# ${{ job.workflow_ref }}\n";
    const result = evaluateStagingTransactionSources(candidate);
    assert.equal(
      check(result, "CHILDREN_ARE_REUSABLE_AND_DIRECT_STAGING_FAILS_CLOSED"),
      false,
    );
  });

  it("rejects local receipt downloads that point to a caller-supplied run", () => {
    const candidate = sources();
    candidate.acceptance = candidate.acceptance.replace(
      "          path: release-chain/api\n",
      "          path: release-chain/api\n          run-id: ${{ inputs.api_release_run_id }}\n",
    );
    const result = evaluateStagingTransactionSources(candidate);
    assert.equal(check(result, "SAME_RUN_HASH_BOUND_ARTIFACT_CHAIN"), false);
  });

  it("rejects unsuffixed staging artifact names", () => {
    const candidate = sources();
    candidate.acceptance = candidate.acceptance.replace(
      'omdala-api-release-${suffix}',
      'omdala-api-release-${CANDIDATE_SHA}-staging',
    );
    const result = evaluateStagingTransactionSources(candidate);
    assert.equal(check(result, "SAME_RUN_HASH_BOUND_ARTIFACT_CHAIN"), false);
  });

  it("rejects removing the API compensation after a surface failure", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replace(
      "needs.deploy-surfaces.result != 'success'",
      "needs.deploy-surfaces.result == 'success'",
    );
    const result = evaluateStagingTransactionSources(candidate);
    assert.equal(check(result, "COMPENSATION_COVERS_DOWNSTREAM_FAILURES"), false);
  });

  it("rejects recovery that can overwrite an unrelated provider version", () => {
    const candidate = sources();
    candidate.recoveryScript = candidate.recoveryScript.replace(
      "provider state diverged",
      "provider state accepted",
    );
    const result = evaluateStagingTransactionSources(candidate);
    assert.equal(
      check(result, "RECOVERY_IS_HASH_BOUND_AND_PROVIDER_VERIFIED"),
      false,
    );
  });

  it("rejects removing the pre-mutation atomicity hold", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replace(
      "STAGING_TRANSACTION_BLOCKED_PROTECTED_ENVIRONMENT_ATOMICITY",
      "STAGING_TRANSACTION_ATOMICITY_ASSUMED",
    );
    const result = evaluateStagingTransactionSources(candidate);
    assert.equal(
      check(result, "STAGING_ATOMICITY_HOLD_PRECEDES_ALL_MUTATION"),
      false,
    );
  });
});
