import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { discoverUnresolvedCapsules } from "./staging-unresolved-capsules.mjs";

const sha = "a".repeat(40);
const capsule = `omdala-staging-recovery-capsule-${sha}-staging-41-1`;
const commit = `omdala-staging-transaction-commit-${sha}-staging-41-1`;
const recovery = `omdala-staging-recovery-resolved-${sha}-staging-41-1`;
const headSha = "b".repeat(40);
const capsuleSha256 = "c".repeat(64);

function run(overrides = {}) {
  return {
    id: 41,
    name: "OMDALA Staging Transaction",
    path: ".github/workflows/staging-transaction.yml",
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: headSha,
    status: "completed",
    conclusion: "cancelled",
    artifacts: [{ name: capsule, capsule_verified: true, capsule_sha256: capsuleSha256 }],
    ...overrides,
  };
}

describe("unresolved staging capsule discovery", () => {
  it("blocks a capsule whose run never published a commit or recovery artifact", () => {
    const result = discoverUnresolvedCapsules({
      currentRunId: 42,
      runs: [run()],
    });
    assert.equal(result.verdict, "STAGING_UNRESOLVED_CAPSULES_BLOCK_DEPLOY");
    assert.equal(result.unresolved[0].disposition, "LEGACY_CAPSULE_HAS_NO_DURABLE_LEDGER_RECOVERY_SOURCE");
  });

  it("never promotes a supplemental commit artifact to durable terminal authority", () => {
    const failed = discoverUnresolvedCapsules({
      currentRunId: 42,
      runs: [run({ conclusion: "failure", artifacts: [
        { name: capsule, capsule_verified: true, capsule_sha256: capsuleSha256 },
        { name: commit, commit_verified: true, recovery_capsule_sha256: capsuleSha256 },
      ] })],
    });
    assert.equal(failed.unresolved.length, 1);
    const passed = discoverUnresolvedCapsules({
      currentRunId: 42,
      runs: [run({ conclusion: "success", artifacts: [
        { name: capsule, capsule_verified: true, capsule_sha256: capsuleSha256 },
        { name: commit, commit_verified: true, recovery_capsule_sha256: capsuleSha256 },
      ] })],
    });
    assert.equal(passed.unresolved.length, 1);
    assert.equal(passed.unresolved[0].durable_ledger_authority, false);
  });

  it("never promotes a supplemental recovery artifact to durable terminal authority", () => {
    const result = discoverUnresolvedCapsules({
      currentRunId: 42,
      runs: [
        run({ conclusion: "failure" }),
        run({
          id: 44,
          conclusion: "failure",
          artifacts: [{ name: recovery, resolution_verified: true, recovery_capsule_sha256: capsuleSha256 }],
        }),
      ],
    });
    assert.equal(result.verdict, "STAGING_UNRESOLVED_CAPSULES_BLOCK_DEPLOY");
    assert.equal(result.unresolved[0].disposition, "LEGACY_CAPSULE_HAS_NO_DURABLE_LEDGER_RECOVERY_SOURCE");
  });

  it("ignores artifacts from the current run", () => {
    const result = discoverUnresolvedCapsules({
      currentRunId: 41,
      runs: [run({ status: "in_progress", conclusion: null })],
    });
    assert.equal(result.unresolved.length, 0);
  });

  it("ignores spoofed names from another workflow or an unverified receipt", () => {
    const result = discoverUnresolvedCapsules({
      currentRunId: 42,
      runs: [
        run(),
        run({
          id: 44,
          path: ".github/workflows/spoof.yml",
          artifacts: [{ name: recovery, resolution_verified: true, recovery_capsule_sha256: capsuleSha256 }],
        }),
        run({
          id: 45,
          artifacts: [{ name: recovery, resolution_verified: false }],
        }),
      ],
    });
    assert.equal(result.unresolved.length, 1);
  });

  it("does not resolve one capsule with a receipt for different capsule bytes", () => {
    const result = discoverUnresolvedCapsules({
      currentRunId: 42,
      runs: [
        run(),
        run({
          id: 44,
          artifacts: [{
            name: recovery,
            resolution_verified: true,
            recovery_capsule_sha256: "d".repeat(64),
          }],
        }),
      ],
    });
    assert.equal(result.unresolved.length, 1);
  });

  it("blocks deploy when the durable capsule expired instead of hiding it", () => {
    const result = discoverUnresolvedCapsules({
      currentRunId: 42,
      runs: [run({
        conclusion: "cancelled",
        artifacts: [{ name: capsule, expired: true }],
      })],
    });
    assert.equal(
      result.verdict,
      "EXPIRED_CAPSULE_MANUAL_PROVIDER_RECONCILIATION_REQUIRED",
    );
    assert.equal(result.unresolved.length, 1);
    assert.equal(result.unresolved[0].capsule_expired, true);
    assert.equal(
      result.unresolved[0].disposition,
      "EXPIRED_CAPSULE_MANUAL_PROVIDER_RECONCILIATION_REQUIRED",
    );
  });

  it("keeps an unresolved transaction blocked after every Actions artifact disappears", () => {
    const result = discoverUnresolvedCapsules({
      currentRunId: 42,
      runs: [],
      ledgerTransactions: [{
        transaction_id: "staging-41-1",
        workflow_run_id: 41,
        candidate_sha: sha,
        control_plane_sha: headSha,
        release_id: "gh-41-1-aaaaaaaaaaaa",
        capsule_sha256: capsuleSha256,
        capsule_record_path: "staging-durable-ledger-records/staging-41-1/capsule.json",
        terminal_record_type: null,
      }],
    });
    assert.equal(result.verdict, "STAGING_UNRESOLVED_CAPSULES_BLOCK_DEPLOY");
    assert.equal(result.unresolved[0].durable_ledger_authority, true);
    assert.equal(
      result.unresolved[0].capsule_ledger_record_path,
      "staging-durable-ledger-records/staging-41-1/capsule.json",
    );
  });

  it("resolves a vanished artifact only through a validated terminal ledger record", () => {
    const result = discoverUnresolvedCapsules({
      currentRunId: 42,
      runs: [],
      ledgerTransactions: [{
        transaction_id: "staging-41-1",
        workflow_run_id: 41,
        candidate_sha: sha,
        control_plane_sha: headSha,
        release_id: "gh-41-1-aaaaaaaaaaaa",
        capsule_sha256: capsuleSha256,
        capsule_record_path: "staging-durable-ledger-records/staging-41-1/capsule.json",
        terminal_record_type: "recovery",
      }],
    });
    assert.equal(result.verdict, "STAGING_NO_UNRESOLVED_CAPSULES");
  });
});
