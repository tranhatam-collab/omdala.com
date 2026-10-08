import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRecoveryCapsule } from "./staging-recovery-capsule.mjs";

const candidateSha = "a".repeat(40);
const controlPlaneSha = "b".repeat(40);
const version = "50000000-0000-4000-8000-000000000001";

function specs() {
  return [
    ["api", "api", true],
    ["web", "surface", false],
    ["app", "surface", false],
    ["auth", "surface", false],
    ["brand", "surface", false],
  ].map(([name, kind, useStagingEnvironment]) => ({
    kind,
    name,
    workerName: name === "api" ? "omdala-api-staging" : `omdala-surface-${name}-staging`,
    configPath: name === "api"
      ? "services/api/wrangler.release.toml"
      : `infra/staging/surfaces/${name}.wrangler.jsonc`,
    deploymentsPath: `provider-pre/${name}.json`,
    useStagingEnvironment,
  }));
}

function create(overrides = {}) {
  return createRecoveryCapsule({
    candidateSha,
    controlPlaneSha,
    transactionId: "staging-42-1",
    releaseId: `gh-42-1-${candidateSha.slice(0, 12)}`,
    workflowRunId: 42,
    workflowRunAttempt: 1,
    cloudflareAccountId: "c".repeat(32),
    repository: "tranhatam-collab/omdala.com",
    targetSpecs: specs(),
    evidenceRoot: "/trusted/transaction-evidence",
    resolveEvidencePath(root, path) {
      assert.equal(root, "/trusted/transaction-evidence");
      return `${root}/${path}`;
    },
    readBytes(path) {
      if (!path.startsWith("/trusted/transaction-evidence/provider-pre/")) return Buffer.from(`config:${path}`);
      return Buffer.from(
        JSON.stringify([
          {
            created_on: "2026-10-08T00:00:00Z",
            versions: [{ version_id: version, percentage: 100 }],
          },
        ]),
      );
    },
    ...overrides,
  });
}

describe("staging recovery capsule", () => {
  it("seals five baselines and the exact reverse recovery order", () => {
    const capsule = create();
    assert.equal(capsule.verdict, "STAGING_RECOVERY_CAPSULE_SEALED");
    assert.deepEqual(capsule.target_order, ["api", "web", "app", "auth", "brand"]);
    assert.deepEqual(capsule.reverse_recovery_order, ["brand", "auth", "app", "web", "api"]);
    assert.equal(capsule.targets.length, 5);
    assert.equal(capsule.targets.every((entry) => entry.baselineVersionId === version), true);
    assert.equal(capsule.runner_loss_recovery_authority, "MANUAL_REDISPATCH_REQUIRED");
  });

  it("rejects a rerun before a capsule can authorize mutation", () => {
    assert.throws(
      () => create({ workflowRunAttempt: 2 }),
      /reruns are forbidden/,
    );
  });

  it("rejects a split or partial provider baseline", () => {
    assert.throws(
      () =>
        create({
          readBytes(path) {
            if (!path.startsWith("/trusted/transaction-evidence/provider-pre/")) return Buffer.from("config");
            return Buffer.from(
              JSON.stringify([
                {
                  created_on: "2026-10-08T00:00:00Z",
                  versions: [
                    { version_id: version, percentage: 50 },
                    {
                      version_id: "60000000-0000-4000-8000-000000000001",
                      percentage: 50,
                    },
                  ],
                },
              ]),
            );
          },
        }),
      /no single exact 100% rollback version/,
    );
  });

  it("rejects target reordering that could change recovery semantics", () => {
    const reordered = specs();
    [reordered[1], reordered[2]] = [reordered[2], reordered[1]];
    assert.throws(
      () => create({ targetSpecs: reordered }),
      /target order must be/,
    );
  });

  it("rejects any target authority outside the fixed staging tuple", () => {
    for (const mutation of [
      (target) => { target.workerName = "omdala-production-worker"; },
      (target) => { target.configPath = "infra/production/wrangler.toml"; },
      (target) => { target.useStagingEnvironment = false; },
    ]) {
      const forged = specs();
      mutation(forged[0]);
      assert.throws(() => create({ targetSpecs: forged }), /target specification is invalid/);
    }
  });

  it("rejects provider evidence outside the exact external evidence child path", () => {
    const forged = specs();
    forged[0].deploymentsPath = "/tmp/api.json";
    assert.throws(() => create({ targetSpecs: forged }), /target specification is invalid/);
    const forgedSibling = specs();
    forgedSibling[0].deploymentsPath = "provider-pre/web.json";
    assert.throws(() => create({ targetSpecs: forgedSibling }), /target specification is invalid/);
  });
});
