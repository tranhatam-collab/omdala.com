import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

const MAIN_SHA = "a".repeat(40);
const ACCOUNT_ID = "f".repeat(32);
const API_CANDIDATE = "11111111-1111-4111-8111-111111111111";
const API_PREVIOUS = "22222222-2222-4222-8222-222222222222";
const API_DEPLOYMENT = "33333333-3333-4333-8333-333333333333";
const API_PREVIOUS_DEPLOYMENT = "44444444-4444-4444-8444-444444444444";
const SURFACES = ["web", "app", "auth", "brand"];

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function writeExecutable(path, source) {
  writeFileSync(path, source);
  chmodSync(path, 0o755);
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "omdala-cross-rollback-"));
  const bin = join(root, "bin");
  const statePath = join(root, "state.json");
  const apiReceiptPath = join(root, "api.json");
  const surfaceReceiptPath = join(root, "surfaces.json");
  const gatePath = join(root, "gate.json");
  const wranglerConfigPath = join(root, "wrangler.toml");
  const evidencePath = join(root, "evidence");
  const mkdir = spawnSync("mkdir", ["-p", bin]);
  assert.equal(mkdir.status, 0);

  const pagesDeployments = {};
  const state = { api: API_CANDIDATE, surfaces: {} };
  SURFACES.forEach((surface, index) => {
    const candidateDigit = String(index + 5);
    const previousDigit = String(index + 1);
    const candidate = `${candidateDigit.repeat(8)}-${candidateDigit.repeat(4)}-4${candidateDigit.repeat(3)}-8${candidateDigit.repeat(3)}-${candidateDigit.repeat(12)}`;
    const previous = `${previousDigit.repeat(8)}-${previousDigit.repeat(4)}-4${previousDigit.repeat(3)}-8${previousDigit.repeat(3)}-${previousDigit.repeat(12)}`;
    state.surfaces[`omdala-${surface}`] = candidate;
    pagesDeployments[surface] = {
      platform: "cloudflare-pages",
      environment: "production",
      source_sha: MAIN_SHA,
      project_name: `omdala-${surface}`,
      deployment_id: candidate,
      previous_deployment_id: previous,
    };
  });
  writeFileSync(statePath, JSON.stringify(state));
  writeFileSync(wranglerConfigPath, "name = \"omdala-api\"\n");
  writeFileSync(
    apiReceiptPath,
    JSON.stringify({
      schema_version: 2,
      verdict: "API_RELEASE_ACCEPTED",
      environment: "production",
      candidate_sha: MAIN_SHA,
      cloudflare_account_id: ACCOUNT_ID,
      version_id: API_CANDIDATE,
      previous_version_id: API_PREVIOUS,
      cloudflare_deployment_id: API_DEPLOYMENT,
      previous_deployment_id: API_PREVIOUS_DEPLOYMENT,
      migration_compatibility_verified: true,
      migration_compatibility_receipt_sha256: "d".repeat(64),
      migration_manifest_sha256: "e".repeat(64),
      migration_ledger_receipt_sha256: "f".repeat(64),
      rollback_scope: "code_and_worker_only_database_schema_is_not_reverted",
      database_schema_reverted_by_code_rollback: false,
      pre_migration_remote_preflight_verified: true,
      api_remote_preflight_receipt_sha256: "1".repeat(64),
      hyperdrive_remote_preflight_receipt_sha256: "2".repeat(64),
    }),
  );
  writeFileSync(
    surfaceReceiptPath,
    JSON.stringify({
      schema_version: 4,
      verdict: "SURFACE_RELEASE_ACCEPTED",
      environment: "production",
      candidate_sha: MAIN_SHA,
      cloudflare_account_id: ACCOUNT_ID,
      pages_deployments: pagesDeployments,
    }),
  );
  writeFileSync(
    gatePath,
    JSON.stringify({
      schema_version: 1,
      verdict: "PRODUCTION_RELEASE_CHAIN_VERIFIED",
      merged_main_sha: MAIN_SHA,
      cloudflare_account_id: ACCOUNT_ID,
      tree_equivalence_verified: true,
      receipt_hashes: {
        api: sha256(apiReceiptPath),
        surfaces: sha256(surfaceReceiptPath),
      },
    }),
  );

  const wranglerPath = join(bin, "wrangler");
  writeExecutable(
    wranglerPath,
    `#!/usr/bin/env node
const fs = require("node:fs");
const statePath = process.env.MOCK_STATE;
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const args = process.argv.slice(2);
if (args[0] === "deployments" && args[1] === "list") {
  process.stdout.write(JSON.stringify([{ created_on: "2026-10-08T00:00:00Z", versions: [{ percentage: 100, version_id: state.api }] }]));
} else if (args[0] === "rollback") {
  state.api = args[1];
  fs.writeFileSync(statePath, JSON.stringify(state));
} else {
  process.exit(64);
}
`,
  );
  writeExecutable(
    join(bin, "curl"),
    `#!/usr/bin/env node
const fs = require("node:fs");
const statePath = process.env.MOCK_STATE;
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const args = process.argv.slice(2);
const url = args.at(-1);
const match = url.match(/pages\\/projects\\/([^/]+)(?:\\/deployments\\/([^/]+)\\/rollback)?$/);
if (!match) process.exit(64);
const project = match[1];
if (match[2]) {
  state.surfaces[project] = match[2];
  fs.writeFileSync(statePath, JSON.stringify(state));
  process.stdout.write(JSON.stringify({ success: true }));
} else {
  process.stdout.write(JSON.stringify({ result: { canonical_deployment: { id: state.surfaces[project] } } }));
}
`,
  );

  return {
    root,
    bin,
    statePath,
    apiReceiptPath,
    surfaceReceiptPath,
    gatePath,
    wranglerConfigPath,
    evidencePath,
    pagesDeployments,
  };
}

function runRollback(paths) {
  return spawnSync(
    "bash",
    [
      "scripts/production-cross-workflow-rollback.sh",
      paths.gatePath,
      paths.apiReceiptPath,
      paths.surfaceReceiptPath,
      paths.wranglerConfigPath,
    ],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${paths.bin}:${process.env.PATH}`,
        MOCK_STATE: paths.statePath,
        WRANGLER_BIN: join(paths.bin, "wrangler"),
        PRODUCTION_ROLLBACK_EVIDENCE_DIR: paths.evidencePath,
        CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
        CLOUDFLARE_API_TOKEN: "test-token",
        EXPECTED_MAIN_SHA: MAIN_SHA,
      },
    },
  );
}

describe("production cross-workflow rollback", () => {
  it("restores the API and all four Pages surfaces to hash-bound baselines", () => {
    const paths = fixture();
    const result = runRollback(paths);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const state = JSON.parse(readFileSync(paths.statePath, "utf8"));
    assert.equal(state.api, API_PREVIOUS);
    for (const [surface, deployment] of Object.entries(paths.pagesDeployments)) {
      assert.equal(state.surfaces[`omdala-${surface}`], deployment.previous_deployment_id);
    }
    const receipt = JSON.parse(
      readFileSync(join(paths.evidencePath, "rollback-receipt.json"), "utf8"),
    );
    assert.equal(receipt.verdict, "ROLLBACK_VERIFIED");
    assert.equal(receipt.merged_main_sha, MAIN_SHA);
    assert.equal(receipt.database_schema_reverted, false);
  });

  it("refuses a release receipt changed after the rollback gate was issued", () => {
    const paths = fixture();
    const receipt = JSON.parse(readFileSync(paths.apiReceiptPath, "utf8"));
    receipt.previous_version_id = "99999999-9999-4999-8999-999999999999";
    writeFileSync(paths.apiReceiptPath, JSON.stringify(receipt));
    const result = runRollback(paths);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /does not match the verified rollback gate/);
  });
});
