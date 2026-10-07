import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";
import { createStagingRecoveryPlan } from "./staging-recovery-plan.mjs";

const candidateSha = "a".repeat(40);
const controlPlaneSha = "b".repeat(40);
const account = "c".repeat(32);
const transactionId = "staging-123-1";
const repository = "owner/omdala.com";
const deployedApi = "10000000-0000-4000-8000-000000000001";
const baselineApi = "20000000-0000-4000-8000-000000000001";
const configBytes = Buffer.from('name = "omdala-api"\n');

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function shared(path) {
  return {
    environment: "staging",
    candidate_sha: candidateSha,
    control_plane_sha: controlPlaneSha,
    staging_transaction_id: transactionId,
    workflow_run_id: 123,
    workflow_run_attempt: 1,
    cloudflare_account_id: account,
    reusable_workflow_ref: `${repository}/${path}@${controlPlaneSha}`,
    reusable_workflow_sha: controlPlaneSha,
    reusable_workflow_path: path,
  };
}

function apiReceipt() {
  return {
    schema_version: 2,
    verdict: "API_RELEASE_ACCEPTED",
    ...shared(".github/workflows/deploy.yml"),
    deployment_id: deployedApi,
    version_id: deployedApi,
    previous_version_id: baselineApi,
    wrangler_config_sha256: digest(configBytes),
  };
}

function surfaceReceipt() {
  const names = ["web", "app", "auth", "brand"];
  return {
    schema_version: 4,
    verdict: "SURFACE_RELEASE_ACCEPTED",
    ...shared(".github/workflows/deploy-surfaces.yml"),
    surface_names: names,
    worker_deployments: Object.fromEntries(
      names.map((name, index) => {
        const suffix = String(index + 1).padStart(12, "0");
        const version = `30000000-0000-4000-8000-${suffix}`;
        return [
          name,
          {
            surface: name,
            worker_name: `omdala-surface-${name}-staging`,
            deployment_id: version,
            version_id: version,
            previous_version_id:
              name === "brand" ? null : `40000000-0000-4000-8000-${suffix}`,
          },
        ];
      }),
    ),
  };
}

function planInput(overrides = {}) {
  const apiBytes = Buffer.from(`${JSON.stringify(apiReceipt())}\n`);
  const surfaceBytes = Buffer.from(`${JSON.stringify(surfaceReceipt())}\n`);
  return {
    apiReceiptBytes: apiBytes,
    apiConfigBytes: configBytes,
    surfaceReceiptBytes: surfaceBytes,
    rollbackSurfaces: true,
    expected: {
      candidateSha,
      controlPlaneSha,
      transactionId,
      workflowRunId: 123,
      workflowRunAttempt: 1,
      cloudflareAccountId: account,
      repository,
      apiReceiptSha256: digest(apiBytes),
      surfaceReceiptSha256: digest(surfaceBytes),
    },
    ...overrides,
  };
}

describe("staging recovery plan", () => {
  it("binds exact receipts and restores surfaces in reverse order before API", () => {
    const plan = createStagingRecoveryPlan(planInput());
    assert.equal(plan.verdict, "STAGING_RECOVERY_PLAN_ACCEPTED");
    assert.deepEqual(
      plan.targets.map((target) => target.name),
      ["brand", "auth", "app", "web", "api"],
    );
    assert.equal(plan.targets[0].baselineVersionId, null);
    assert.equal(plan.targets.at(-1).baselineVersionId, baselineApi);
  });

  it("rejects a receipt changed after the reusable workflow published its hash", () => {
    const input = planInput();
    input.expected.apiReceiptSha256 = "f".repeat(64);
    assert.throws(
      () => createStagingRecoveryPlan(input),
      /API receipt hash does not match/,
    );
  });

  it("rejects mixed transaction identities", () => {
    const input = planInput();
    input.expected.transactionId = "staging-999-1";
    assert.throws(
      () => createStagingRecoveryPlan(input),
      /not bound to the exact staging transaction/,
    );
  });

  it("rejects a forged reusable-workflow identity", () => {
    const input = planInput();
    const receipt = apiReceipt();
    receipt.reusable_workflow_path = ".github/workflows/forged.yml";
    input.apiReceiptBytes = Buffer.from(`${JSON.stringify(receipt)}\n`);
    input.expected.apiReceiptSha256 = digest(input.apiReceiptBytes);
    assert.throws(
      () => createStagingRecoveryPlan(input),
      /reusable-workflow identity is invalid/,
    );
  });
});

describe("staging recovery executor", () => {
  it("attempts the API after an earlier surface rollback fails", () => {
    const directory = mkdtempSync(join(tmpdir(), "omdala-staging-recovery-"));
    try {
      mkdirSync(join(directory, "recovery-input"), { recursive: true });
      mkdirSync(join(directory, "infra/staging/surfaces"), { recursive: true });
      writeFileSync(join(directory, "recovery-input/api-release-wrangler.toml"), "api\n");
      writeFileSync(join(directory, "infra/staging/surfaces/brand.wrangler.jsonc"), "{}\n");
      const surfaceDeployed = "50000000-0000-4000-8000-000000000001";
      const surfaceBaseline = "60000000-0000-4000-8000-000000000001";
      const plan = {
        schema_version: 1,
        verdict: "STAGING_RECOVERY_PLAN_ACCEPTED",
        transaction_id: transactionId,
        candidate_sha: candidateSha,
        control_plane_sha: controlPlaneSha,
        targets: [
          {
            name: "brand",
            workerName: "omdala-surface-brand-staging",
            configPath: "infra/staging/surfaces/brand.wrangler.jsonc",
            deployedVersionId: surfaceDeployed,
            baselineVersionId: surfaceBaseline,
            useStagingEnvironment: false,
          },
          {
            name: "api",
            workerName: "omdala-api-staging",
            configPath: "recovery-input/api-release-wrangler.toml",
            deployedVersionId: deployedApi,
            baselineVersionId: baselineApi,
            useStagingEnvironment: true,
          },
        ],
      };
      writeFileSync(join(directory, "plan.json"), `${JSON.stringify(plan)}\n`);
      writeFileSync(join(directory, "brand.state"), `${surfaceDeployed}\n`);
      writeFileSync(join(directory, "api.state"), `${deployedApi}\n`);
      const mock = join(directory, "wrangler-mock.sh");
      writeFileSync(
        mock,
        `#!/usr/bin/env bash
set -euo pipefail
echo "$*" >> "${directory}/commands.log"
config=""
for ((i=1; i<=$#; i++)); do
  if [[ "\${!i}" == "--config" ]]; then j=$((i+1)); config="\${!j}"; fi
done
if [[ "$1 $2" == "deployments list" ]]; then
  if [[ "$config" == *brand* ]]; then state="${directory}/brand.state"; else state="${directory}/api.state"; fi
  version="$(cat "$state")"
  printf '[{"created_on":"2026-01-01T00:00:00Z","versions":[{"version_id":"%s","percentage":100}]}]\n' "$version"
elif [[ "$1" == "rollback" ]]; then
  if [[ "$config" == *brand* ]]; then exit 9; fi
  printf '%s\n' "$2" > "${directory}/api.state"
  printf '{}\n'
else
  exit 8
fi
`,
      );
      chmodSync(mock, 0o755);
      const execution = spawnSync(
        "bash",
        [
          resolve("scripts/staging-transaction-recovery.sh"),
          "plan.json",
          "evidence",
        ],
        {
          cwd: directory,
          env: {
            ...process.env,
            PATH: (process.env.PATH ?? "")
              .split(":")
              .filter((entry) => entry !== "/sbin" && entry !== "/usr/sbin")
              .join(":"),
            WRANGLER_BIN: mock,
            STAGING_RECOVERY_POLL_SECONDS: "0",
          },
          encoding: "utf8",
        },
      );
      assert.notEqual(execution.status, 0);
      const commands = readFileSync(join(directory, "commands.log"), "utf8");
      assert.match(commands, new RegExp(`rollback ${surfaceBaseline}`));
      assert.match(commands, new RegExp(`rollback ${baselineApi}`));
      const receiptPath = join(
        directory,
        "evidence/staging-recovery-receipt.json",
      );
      assert.equal(
        existsSync(receiptPath),
        true,
        `recovery receipt was not written (status=${execution.status}, signal=${execution.signal}, error=${execution.error?.message ?? "none"})\nstdout:\n${execution.stdout}\nstderr:\n${execution.stderr}`,
      );
      const receipt = JSON.parse(
        readFileSync(receiptPath, "utf8"),
      );
      assert.equal(receipt.verdict, "STAGING_COMPENSATING_RECOVERY_FAILED");
      assert.equal(
        receipt.recovery_plan_sha256,
        digest(readFileSync(join(directory, "plan.json"))),
      );
      assert.equal(receipt.targets.length, 2);
      assert.equal(receipt.targets[0].provider_readback_verified, false);
      assert.equal(receipt.targets[1].provider_readback_verified, true);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
