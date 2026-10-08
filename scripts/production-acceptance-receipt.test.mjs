import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EXPECTED_E2E_SCENARIOS,
  createProductionAcceptanceReceipt,
  evaluateProductionPlaywrightReport,
  evaluateProductionReleaseChain,
} from "./production-acceptance-receipt.mjs";

const MAIN_SHA = "a".repeat(40);
const MAIN_TREE = "b".repeat(40);
const STAGING_SHA = "c".repeat(40);
const STAGING_TRANSACTION_ID = "staging-101-1";
const ACCOUNT_ID = "f".repeat(32);
const HASH = "d".repeat(64);
const STAGING_HYPERDRIVE_ID = "e".repeat(32);
const PRODUCTION_HYPERDRIVE_ID = "a".repeat(32);
const STAGING_HYPERDRIVE_FINGERPRINT = "1".repeat(64);
const PRODUCTION_HYPERDRIVE_FINGERPRINT = "2".repeat(64);
const HYPERDRIVE_AUTHORITY_SHA256 = "3".repeat(64);
const WRANGLER_CONFIG_SHA256 = "f".repeat(64);
const API_VERSION = "11111111-1111-4111-8111-111111111111";
const API_DEPLOYMENT = "22222222-2222-4222-8222-222222222222";
const API_PREVIOUS_VERSION = "33333333-3333-4333-8333-333333333333";
const API_PREVIOUS_DEPLOYMENT = "44444444-4444-4444-8444-444444444444";
const HYPERDRIVE_EVIDENCE_FIELDS = Object.freeze([
  "hyperdrive_id",
  "hyperdrive_binding",
  "hyperdrive_binding_verified",
  "hyperdrive_target_verified",
  "hyperdrive_name",
  "hyperdrive_origin_host",
  "hyperdrive_origin_port",
  "hyperdrive_origin_database",
  "hyperdrive_origin_user",
  "hyperdrive_origin_scheme",
  "hyperdrive_origin_fingerprint_sha256",
  "hyperdrive_authority_sha256",
  "wrangler_config_sha256",
]);

const surfaceSpecification = {
  web: ["https://omdala.com", "omdala-web", "main", "omdala.com"],
  app: ["https://app.omdala.com", "omdala-app", "main", "app.omdala.com"],
  auth: ["https://auth.omdala.com", "omdala-auth", "production", "auth.omdala.com"],
  brand: ["https://brand.omdala.com", "omdala-brand", "main", "brand.omdala.com"],
};

function run(id, name, path, headSha = MAIN_SHA) {
  return {
    id,
    name,
    path,
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: headSha,
    run_attempt: 1,
    status: "completed",
    conclusion: "success",
  };
}

function playwrightReport(status = "passed") {
  return {
    suites: [
      {
        specs: EXPECTED_E2E_SCENARIOS.map((title) => ({
          title,
          tests: [
            {
              status: status === "passed" ? "expected" : "unexpected",
              results: [{ status }],
            },
          ],
        })),
      },
    ],
    stats: {
      expected: status === "passed" ? 4 : 0,
      unexpected: status === "passed" ? 0 : 4,
      flaky: 0,
      skipped: 0,
    },
  };
}

function validInput() {
  const stagingRun = run(
    101,
    "OMDALA Staging Transaction",
    ".github/workflows/staging-transaction.yml",
    "e".repeat(40),
  );
  const apiRun = run(102, "OMDALA Release", ".github/workflows/deploy.yml");
  const surfaceRun = run(
    103,
    "OMDALA Surface Release",
    ".github/workflows/deploy-surfaces.yml@refs/heads/main",
  );
  const stagingReceipt = {
    schema_version: 2,
    verdict: "STAGING_ACCEPTED",
    candidate_sha: STAGING_SHA,
    candidate_tree_sha: MAIN_TREE,
    reviewed_sha: STAGING_SHA,
    reviewed_tree_sha: MAIN_TREE,
    control_plane_sha: stagingRun.head_sha,
    staging_transaction_id: STAGING_TRANSACTION_ID,
    api_release_control_plane_sha: stagingRun.head_sha,
    surface_release_control_plane_sha: stagingRun.head_sha,
    api_receipt_sha256: HASH,
    surface_receipt_sha256: HASH,
    cloudflare_account_id: ACCOUNT_ID,
    source_pr_number: 10,
    independent_reviewer: "independent-reviewer",
    independent_review_id: 501,
    api_release_run_id: stagingRun.id,
    surface_release_run_id: stagingRun.id,
    api_deployment_id: "55555555-5555-4555-8555-555555555555",
    consumer_version_id: "55555555-5555-4555-8555-555555555555",
    api_secret_inventory_verified: true,
    api_worker_authority_verified: true,
    api_worker_authority_evidence_sha256: HASH,
    surface_release_id: "pages-91-1-cccccccccccc",
    database_backup_receipt_sha256: HASH,
    e2e_report_sha256: HASH,
    e2e_scenarios_executed: 4,
    workflow_run_id: stagingRun.id,
    workflow_run_attempt: 1,
    reusable_workflow_ref: `owner/omdala.com/.github/workflows/staging-go-live-e2e.yml@${stagingRun.head_sha}`,
    reusable_workflow_sha: stagingRun.head_sha,
    reusable_workflow_path: ".github/workflows/staging-go-live-e2e.yml",
    repository: "owner/omdala.com",
  };
  const stagingBackupReceipt = {
    schema_version: 1,
    verdict: "BACKUP_RESTORE_VERIFIED",
    candidate_sha: STAGING_SHA,
    environment: "staging",
    source_and_restore_distinct: true,
    production_target_match: false,
    exact_row_counts_match: true,
    encrypted_backup_decrypt_verified: true,
    encrypted_backup_sha256: HASH,
  };
  const stagingApiReceipt = {
    schema_version: 2,
    verdict: "API_RELEASE_ACCEPTED",
    environment: "staging",
    candidate_sha: STAGING_SHA,
    candidate_tree_sha: MAIN_TREE,
    reviewed_sha: STAGING_SHA,
    reviewed_tree_sha: MAIN_TREE,
    control_plane_sha: stagingReceipt.api_release_control_plane_sha,
    staging_transaction_id: STAGING_TRANSACTION_ID,
    cloudflare_account_id: ACCOUNT_ID,
    release_id: "api-91-1-cccccccccccc",
    deployment_id: stagingReceipt.api_deployment_id,
    version_id: stagingReceipt.consumer_version_id,
    cloudflare_deployment_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    hyperdrive_id: STAGING_HYPERDRIVE_ID,
    hyperdrive_binding: "HYPERDRIVE",
    hyperdrive_binding_verified: true,
    secret_inventory_verified: true,
    worker_authority_verified: true,
    worker_authority_evidence_sha256: HASH,
    hyperdrive_target_verified: true,
    hyperdrive_name: "omdala-postgres-staging",
    hyperdrive_origin_host: "db.example.com",
    hyperdrive_origin_port: 5432,
    hyperdrive_origin_database: "omdala_staging",
    hyperdrive_origin_user: "omdala_staging",
    hyperdrive_origin_scheme: "postgresql",
    hyperdrive_origin_fingerprint_sha256: STAGING_HYPERDRIVE_FINGERPRINT,
    hyperdrive_authority_sha256: HYPERDRIVE_AUTHORITY_SHA256,
    hyperdrive_isolated_from_production: true,
    wrangler_config_sha256: WRANGLER_CONFIG_SHA256,
    previous_deployment_id: null,
    previous_version_id: null,
    api_url: "https://api-staging.omdala.com",
    source_pr_number: 10,
    independent_reviewer: "independent-reviewer",
    independent_review_id: 501,
    database_backup_receipt_sha256: HASH,
    encrypted_backup_sha256: HASH,
    migration_compatibility_verified: true,
    migration_compatibility_receipt_sha256: HASH,
    migration_manifest_sha256: HASH,
    migration_ledger_receipt_sha256: HASH,
    rollback_scope: "code_and_worker_only_database_schema_is_not_reverted",
    database_schema_reverted_by_code_rollback: false,
    pre_migration_remote_preflight_verified: true,
    api_remote_preflight_receipt_sha256: HASH,
    hyperdrive_remote_preflight_receipt_sha256: HASH,
    workflow_run_id: stagingRun.id,
    workflow_run_attempt: 1,
    reusable_workflow_ref: `owner/omdala.com/.github/workflows/deploy.yml@${stagingRun.head_sha}`,
    reusable_workflow_sha: stagingRun.head_sha,
    reusable_workflow_path: ".github/workflows/deploy.yml",
    repository: "owner/omdala.com",
  };
  const stagingOrigins = {
    web: ["https://staging.omdala.com", "omdala-surface-web-staging", "1"],
    app: ["https://app-staging.omdala.com", "omdala-surface-app-staging", "2"],
    auth: ["https://auth-staging.omdala.com", "omdala-surface-auth-staging", "3"],
    brand: ["https://brand-staging.omdala.com", "omdala-surface-brand-staging", "4"],
  };
  const stagingSurfaces = {};
  const workerDeployments = {};
  for (const [surface, [url, worker, digit]] of Object.entries(stagingOrigins)) {
    stagingSurfaces[surface] = {
      schema_version: 1,
      surface,
      environment: "staging",
      release_sha: STAGING_SHA,
      release_id: stagingReceipt.surface_release_id,
      asset_manifest_sha256: HASH,
      asset_file_count: 4,
      manifest_sha256: HASH,
      url,
    };
    workerDeployments[surface] = {
      schema_version: 1,
      surface,
      platform: "cloudflare-workers-static-assets",
      worker_name: worker,
      release_id: stagingReceipt.surface_release_id,
      deployment_id: `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${digit.repeat(12)}`,
      version_id: `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-9${digit.repeat(3)}-${digit.repeat(12)}`,
      version_etag: HASH,
    };
  }
  const stagingSurfaceReceipt = {
    schema_version: 4,
    verdict: "SURFACE_RELEASE_ACCEPTED",
    environment: "staging",
    candidate_sha: STAGING_SHA,
    candidate_tree_sha: MAIN_TREE,
    reviewed_sha: STAGING_SHA,
    reviewed_tree_sha: MAIN_TREE,
    control_plane_sha: stagingReceipt.surface_release_control_plane_sha,
    staging_transaction_id: STAGING_TRANSACTION_ID,
    cloudflare_account_id: ACCOUNT_ID,
    release_id: stagingReceipt.surface_release_id,
    source_pr_number: 10,
    independent_reviewer: "independent-reviewer",
    independent_review_id: 501,
    workflow_run_id: stagingRun.id,
    workflow_run_attempt: 1,
    reusable_workflow_ref: `owner/omdala.com/.github/workflows/deploy-surfaces.yml@${stagingRun.head_sha}`,
    reusable_workflow_sha: stagingRun.head_sha,
    reusable_workflow_path: ".github/workflows/deploy-surfaces.yml",
    repository: "owner/omdala.com",
    surface_names: ["web", "app", "auth", "brand"],
    surfaces: stagingSurfaces,
    worker_deployments: workerDeployments,
    pages_deployments: {},
  };
  const backupReceipt = {
    schema_version: 1,
    verdict: "BACKUP_RESTORE_VERIFIED",
    candidate_sha: MAIN_SHA,
    environment: "production",
    source_and_restore_distinct: true,
    production_target_match: true,
    exact_row_counts_match: true,
    encrypted_backup_decrypt_verified: true,
    encrypted_backup_sha256: HASH,
  };
  const apiReceipt = {
    schema_version: 2,
    verdict: "API_RELEASE_ACCEPTED",
    environment: "production",
    candidate_sha: MAIN_SHA,
    candidate_tree_sha: MAIN_TREE,
    reviewed_sha: STAGING_SHA,
    reviewed_tree_sha: MAIN_TREE,
    control_plane_sha: MAIN_SHA,
    cloudflare_account_id: ACCOUNT_ID,
    release_id: "api-102-1-aaaaaaaaaaaa",
    deployment_id: API_VERSION,
    version_id: API_VERSION,
    cloudflare_deployment_id: API_DEPLOYMENT,
    hyperdrive_id: PRODUCTION_HYPERDRIVE_ID,
    hyperdrive_binding: "HYPERDRIVE",
    hyperdrive_binding_verified: true,
    secret_inventory_verified: true,
    worker_authority_verified: true,
    worker_authority_evidence_sha256: HASH,
    hyperdrive_target_verified: true,
    hyperdrive_name: "omdala-postgres-production",
    hyperdrive_origin_host: "db.example.com",
    hyperdrive_origin_port: 5432,
    hyperdrive_origin_database: "omdala_prod",
    hyperdrive_origin_user: "omdala_api",
    hyperdrive_origin_scheme: "postgresql",
    hyperdrive_origin_fingerprint_sha256: PRODUCTION_HYPERDRIVE_FINGERPRINT,
    hyperdrive_authority_sha256: HYPERDRIVE_AUTHORITY_SHA256,
    hyperdrive_isolated_from_production: false,
    wrangler_config_sha256: WRANGLER_CONFIG_SHA256,
    previous_deployment_id: API_PREVIOUS_DEPLOYMENT,
    previous_version_id: API_PREVIOUS_VERSION,
    api_url: "https://api.omdala.com",
    source_pr_number: 10,
    independent_reviewer: "independent-reviewer",
    independent_review_id: 501,
    database_backup_receipt_sha256: HASH,
    encrypted_backup_sha256: HASH,
    migration_compatibility_verified: true,
    migration_compatibility_receipt_sha256: HASH,
    migration_manifest_sha256: HASH,
    migration_ledger_receipt_sha256: HASH,
    rollback_scope: "code_and_worker_only_database_schema_is_not_reverted",
    database_schema_reverted_by_code_rollback: false,
    pre_migration_remote_preflight_verified: true,
    api_remote_preflight_receipt_sha256: HASH,
    hyperdrive_remote_preflight_receipt_sha256: HASH,
    workflow_run_id: apiRun.id,
    repository: "owner/omdala.com",
  };
  const surfaces = {};
  const pagesDeployments = {};
  const deploymentDigits = [
    ["6", "7"],
    ["8", "9"],
    ["a", "b"],
    ["c", "d"],
  ];
  let index = 0;
  for (const [surface, [url, project, branch, domain]] of Object.entries(
    surfaceSpecification,
  )) {
    const [digit, previousDigit] = deploymentDigits[index];
    surfaces[surface] = {
      schema_version: 1,
      surface,
      environment: "production",
      release_sha: MAIN_SHA,
      release_id: "pages-103-1-aaaaaaaaaaaa",
      asset_manifest_sha256: HASH,
      asset_file_count: 4,
      manifest_sha256: HASH,
      url,
    };
    pagesDeployments[surface] = {
      schema_version: 1,
      surface,
      platform: "cloudflare-pages",
      environment: "production",
      project_name: project,
      release_id: "pages-103-1-aaaaaaaaaaaa",
      source_sha: MAIN_SHA,
      deployment_id: `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${digit.repeat(12)}`,
      previous_deployment_id: `${previousDigit.repeat(8)}-${previousDigit.repeat(4)}-4${previousDigit.repeat(3)}-8${previousDigit.repeat(3)}-${previousDigit.repeat(12)}`,
      deployment_url: `https://${surface}-release.pages.dev`,
      production_branch: branch,
      deployment_status: "success",
      custom_domain: domain,
      canonical_after_deploy: true,
    };
    index += 1;
  }
  const surfaceReceipt = {
    schema_version: 4,
    verdict: "SURFACE_RELEASE_ACCEPTED",
    environment: "production",
    candidate_sha: MAIN_SHA,
    candidate_tree_sha: MAIN_TREE,
    reviewed_sha: STAGING_SHA,
    reviewed_tree_sha: MAIN_TREE,
    control_plane_sha: MAIN_SHA,
    cloudflare_account_id: ACCOUNT_ID,
    release_id: "pages-103-1-aaaaaaaaaaaa",
    source_pr_number: 10,
    independent_reviewer: "independent-reviewer",
    independent_review_id: 501,
    workflow_run_id: surfaceRun.id,
    repository: "owner/omdala.com",
    surface_names: ["web", "app", "auth", "brand"],
    surfaces,
    worker_deployments: {},
    pages_deployments: pagesDeployments,
  };
  const stagingTransactionReceipt = {
    schema_version: 1,
    verdict: "STAGING_TRANSACTION_ACCEPTED",
    staging_transaction_id: STAGING_TRANSACTION_ID,
    candidate_sha: STAGING_SHA,
    control_plane_sha: stagingRun.head_sha,
    api_receipt_sha256: HASH,
    surface_receipt_sha256: HASH,
    acceptance_receipt_sha256: HASH,
    workflow_run_id: stagingRun.id,
    workflow_run_attempt: 1,
    repository: "owner/omdala.com",
    production_release_authorized: false,
    production_release_status: "HOLD_NO_GO",
  };
  return {
    mainSha: MAIN_SHA,
    mainTreeSha: MAIN_TREE,
    controlPlaneSha: MAIN_SHA,
    stagingCandidateSha: STAGING_SHA,
    stagingTransactionId: STAGING_TRANSACTION_ID,
    accountId: ACCOUNT_ID,
    repository: "owner/omdala.com",
    stagingTransactionRunId: stagingRun.id,
    apiRunId: apiRun.id,
    surfaceRunId: surfaceRun.id,
    stagingRun,
    apiRun,
    surfaceRun,
    stagingTransactionReceipt,
    stagingReceipt,
    stagingApiReceipt,
    stagingBackupReceipt,
    stagingSurfaceReceipt,
    stagingE2EReportSha256: HASH,
    apiReceipt,
    backupReceipt,
    surfaceReceipt,
    encryptedBackupSha256: HASH,
    receiptHashes: {
      stagingTransaction: HASH,
      stagingTransactionAcceptance: HASH,
      stagingTransactionApi: HASH,
      stagingTransactionSurfaces: HASH,
      staging: HASH,
      stagingApi: HASH,
      stagingBackup: HASH,
      stagingSurfaces: HASH,
      api: HASH,
      backup: HASH,
      surfaces: HASH,
    },
    playwrightReport: playwrightReport(),
    playwrightReportSha256: HASH,
    noSpendSourceReceipt: {
      schema_version: 1,
      verdict: "PRODUCTION_NO_SPEND_SOURCE_ACCEPTED",
      accepted: true,
      checks: ["a", "b", "c", "d"].map((id) => ({ id, pass: true })),
      sources: {
        api_index_sha256: HASH,
        ai_health_test_sha256: HASH,
        production_e2e_sha256: HASH,
        production_workflow_sha256: HASH,
      },
    },
    noSpendSourceReceiptSha256: HASH,
    noSpendRuntimeReceipt: {
      schema_version: 1,
      verdict: "PRODUCTION_NO_SPEND_RUNTIME_VERIFIED",
      release_sha: MAIN_SHA,
      checked_endpoint: "https://api.omdala.com/v1/ai/health",
      model_or_spend_requests_observed: 0,
      health_model_call_executed: false,
      configuration_only: true,
    },
    noSpendRuntimeReceiptSha256: HASH,
    workflowRunId: 104,
    workflowRunAttempt: 1,
    createdAt: "2026-10-08T00:00:00Z",
  };
}

describe("production acceptance receipt", () => {
  it("accepts one exact merged-main, staging, API, Pages, rollback, and E2E chain", () => {
    const receipt = createProductionAcceptanceReceipt(validInput());
    assert.equal(receipt.schema_version, 2);
    assert.equal(receipt.verdict, "PRODUCTION_ACCEPTED");
    assert.equal(receipt.tree_equivalence_verified, true);
    assert.equal(
      receipt.staging_acceptance.staging_transaction_id,
      STAGING_TRANSACTION_ID,
    );
    assert.equal(receipt.staging_acceptance.workflow_run_id, 101);
    assert.equal(receipt.staging_acceptance.transaction_receipt_sha256, HASH);
    assert.equal(receipt.api.version_id, API_VERSION);
    assert.equal(receipt.production_smoke.scenarios_executed, 4);
    assert.equal(receipt.production_smoke.model_or_spend_probe_executed, false);
    assert.equal(receipt.production_smoke.model_or_spend_requests_observed, 0);
  });

  it("rejects forged or non-zero runtime no-spend evidence", () => {
    const candidate = validInput();
    candidate.noSpendRuntimeReceipt.model_or_spend_requests_observed = 1;
    assert.throws(
      () => createProductionAcceptanceReceipt(candidate),
      /no-spend runtime receipt/,
    );
  });

  it("rejects staging evidence whose tree differs from merged main", () => {
    const candidate = validInput();
    candidate.stagingReceipt.candidate_tree_sha = "0".repeat(40);
    assert.throws(
      () => evaluateProductionReleaseChain(candidate),
      /tree is not equivalent/,
    );
  });

  it("rejects a production deployment run that did not execute from accepted main", () => {
    const candidate = validInput();
    candidate.apiRun.head_sha = "0".repeat(40);
    assert.throws(
      () => evaluateProductionReleaseChain(candidate),
      /merged-main control plane/,
    );
  });

  it("rejects mixed staging API and surface control-plane SHAs", () => {
    const candidate = validInput();
    candidate.stagingReceipt.surface_release_control_plane_sha = "0".repeat(40);
    candidate.stagingSurfaceReceipt.control_plane_sha = "0".repeat(40);
    assert.throws(
      () => evaluateProductionReleaseChain(candidate),
      /do not share the accepted staging control plane/,
    );
  });

  it("rejects a staging workflow run whose receipt names another control plane", () => {
    const candidate = validInput();
    candidate.stagingRun.head_sha = "0".repeat(40);
    assert.throws(
      () => evaluateProductionReleaseChain(candidate),
      /exact accepted orchestrator run/,
    );
  });

  it("rejects legacy child-workflow staging run provenance", () => {
    for (const [field, value] of [
      ["name", "OMDALA Staging Go-Live E2E"],
      ["path", ".github/workflows/staging-go-live-e2e.yml"],
    ]) {
      const candidate = validInput();
      candidate.stagingRun[field] = value;
      assert.throws(
        () => evaluateProductionReleaseChain(candidate),
        /OMDALA Staging Transaction run is not a successful trusted-main workflow_dispatch run/,
      );
    }
  });

  it("rejects a staging transaction ID that is not bound to the orchestrator run", () => {
    const candidate = validInput();
    candidate.stagingTransactionId = "staging-999-1";
    candidate.stagingTransactionReceipt.staging_transaction_id = "staging-999-1";
    candidate.stagingReceipt.staging_transaction_id = "staging-999-1";
    candidate.stagingApiReceipt.staging_transaction_id = "staging-999-1";
    candidate.stagingSurfaceReceipt.staging_transaction_id = "staging-999-1";
    assert.throws(
      () => evaluateProductionReleaseChain(candidate),
      /does not bind the exact workflow run/,
    );
  });

  it("rejects a staging transaction receipt that does not hash-bind acceptance", () => {
    const candidate = validInput();
    candidate.stagingTransactionReceipt.acceptance_receipt_sha256 = "0".repeat(64);
    assert.throws(
      () => evaluateProductionReleaseChain(candidate),
      /does not hash-bind the accepted staging evidence/,
    );
  });

  it("rejects a rerun of the staging transaction", () => {
    const candidate = validInput();
    candidate.stagingRun.run_attempt = 2;
    candidate.stagingTransactionId = "staging-101-2";
    assert.throws(
      () => evaluateProductionReleaseChain(candidate),
      /OMDALA Staging Transaction run is not a successful trusted-main workflow_dispatch run/,
    );
  });

  it("rejects forged staging transaction authority fields", () => {
    for (const mutate of [
      (candidate) => {
        candidate.stagingTransactionReceipt.candidate_sha = "0".repeat(40);
      },
      (candidate) => {
        candidate.stagingTransactionReceipt.control_plane_sha = "0".repeat(40);
      },
      (candidate) => {
        candidate.stagingTransactionReceipt.workflow_run_id = 999;
      },
      (candidate) => {
        candidate.stagingTransactionReceipt.workflow_run_attempt = 2;
      },
      (candidate) => {
        candidate.stagingTransactionReceipt.repository = "attacker/repository";
      },
      (candidate) => {
        candidate.stagingTransactionReceipt.production_release_authorized = true;
      },
      (candidate) => {
        candidate.stagingTransactionReceipt.production_release_status = "GO";
      },
    ]) {
      const candidate = validInput();
      mutate(candidate);
      assert.throws(
        () => evaluateProductionReleaseChain(candidate),
        /exact accepted orchestrator run/,
      );
    }
  });

  it("rejects divergent receipt copies inside the sealed transaction artifact", () => {
    const candidate = validInput();
    candidate.receiptHashes.stagingTransactionApi = "0".repeat(64);
    assert.throws(
      () => evaluateProductionReleaseChain(candidate),
      /does not hash-bind the accepted staging evidence/,
    );
  });

  it("rejects acceptance hashes that do not match downloaded staging receipts", () => {
    for (const field of ["api_receipt_sha256", "surface_receipt_sha256"]) {
      const candidate = validInput();
      candidate.stagingReceipt[field] = "0".repeat(64);
      assert.throws(
        () => evaluateProductionReleaseChain(candidate),
        /does not hash-bind the downloaded API and surface receipts/,
      );
    }
  });

  it("rejects forged reusable workflow identity in every staging receipt", () => {
    for (const field of [
      "stagingReceipt",
      "stagingApiReceipt",
      "stagingSurfaceReceipt",
    ]) {
      const candidate = validInput();
      candidate[field].reusable_workflow_ref =
        `owner/omdala.com/.github/workflows/forged.yml@${candidate.stagingRun.head_sha}`;
      assert.throws(
        () => evaluateProductionReleaseChain(candidate),
        /reusable workflow identity is invalid/,
      );
    }
  });

  it("rejects separate child workflow run identities inside staging receipts", () => {
    const candidate = validInput();
    candidate.stagingReceipt.api_release_run_id = 91;
    candidate.stagingApiReceipt.workflow_run_id = 91;
    assert.throws(
      () => evaluateProductionReleaseChain(candidate),
      /Staging receipt run ID mismatch/,
    );
  });

  it("rejects a missing or aliased API rollback baseline", () => {
    const missing = validInput();
    missing.apiReceipt.previous_version_id = null;
    assert.throws(() => evaluateProductionReleaseChain(missing), /rollback baseline/);

    const aliased = validInput();
    aliased.apiReceipt.previous_deployment_id = API_DEPLOYMENT;
    assert.throws(() => evaluateProductionReleaseChain(aliased), /rollback baseline/);
  });

  it("rejects a missing or aliased Pages rollback baseline", () => {
    const candidate = validInput();
    candidate.surfaceReceipt.pages_deployments.auth.previous_deployment_id =
      candidate.surfaceReceipt.pages_deployments.auth.deployment_id;
    assert.throws(
      () => evaluateProductionReleaseChain(candidate),
      /auth production Pages deployment/,
    );
  });

  it("rejects a receipt from a different Cloudflare account", () => {
    const candidate = validInput();
    candidate.surfaceReceipt.cloudflare_account_id = "0".repeat(32);
    assert.throws(() => evaluateProductionReleaseChain(candidate), /authority mismatch/);
  });

  it("rejects an API receipt that does not hash-bind the downloaded backup receipt", () => {
    const candidate = validInput();
    candidate.apiReceipt.database_backup_receipt_sha256 = "0".repeat(64);
    assert.throws(
      () => evaluateProductionReleaseChain(candidate),
      /downloaded backup\/restore receipt/,
    );
  });

  it("requires exact migration compatibility evidence for staging and production", () => {
    for (const target of ["stagingApiReceipt", "apiReceipt"]) {
      const candidate = validInput();
      candidate[target].migration_compatibility_verified = false;
      assert.throws(
        () => evaluateProductionReleaseChain(candidate),
        /migration compatibility evidence/,
      );
    }

    const destructiveRollbackClaim = validInput();
    destructiveRollbackClaim.apiReceipt.database_schema_reverted_by_code_rollback = true;
    assert.throws(
      () => evaluateProductionReleaseChain(destructiveRollbackClaim),
      /migration compatibility evidence/,
    );
  });

  it("requires remote Worker and Hyperdrive authority before migration", () => {
    for (const target of ["stagingApiReceipt", "apiReceipt"]) {
      const candidate = validInput();
      candidate[target].pre_migration_remote_preflight_verified = false;
      assert.throws(
        () => evaluateProductionReleaseChain(candidate),
        /pre-migration remote authority evidence/,
      );
    }
  });

  it("requires exact Hyperdrive evidence in the staging API receipt", () => {
    for (const field of HYPERDRIVE_EVIDENCE_FIELDS) {
      const candidate = validInput();
      delete candidate.stagingApiReceipt[field];
      assert.throws(
        () => evaluateProductionReleaseChain(candidate),
        new RegExp(`Staging API receipt ${field}`),
      );
    }

    const invalidEvidence = [
      ["hyperdrive_id", "e".repeat(31), /Staging API receipt hyperdrive_id/],
      ["hyperdrive_id", "E".repeat(32), /Staging API receipt hyperdrive_id/],
      ["hyperdrive_binding", "hyperdrive", /Staging API receipt hyperdrive_binding/],
      [
        "hyperdrive_binding_verified",
        false,
        /Staging API receipt hyperdrive_binding_verified/,
      ],
      [
        "wrangler_config_sha256",
        "f".repeat(63),
        /Staging API receipt wrangler_config_sha256/,
      ],
      [
        "wrangler_config_sha256",
        "F".repeat(64),
        /Staging API receipt wrangler_config_sha256/,
      ],
    ];

    for (const [field, invalidValue, expectedError] of invalidEvidence) {
      const candidate = validInput();
      candidate.stagingApiReceipt[field] = invalidValue;
      assert.throws(() => evaluateProductionReleaseChain(candidate), expectedError);
    }
  });

  it("requires exact Hyperdrive evidence in the production API receipt", () => {
    for (const field of HYPERDRIVE_EVIDENCE_FIELDS) {
      const candidate = validInput();
      delete candidate.apiReceipt[field];
      assert.throws(
        () => evaluateProductionReleaseChain(candidate),
        new RegExp(`Production API receipt ${field}`),
      );
    }

    const invalidEvidence = [
      ["hyperdrive_id", "e".repeat(31), /Production API receipt hyperdrive_id/],
      ["hyperdrive_id", "E".repeat(32), /Production API receipt hyperdrive_id/],
      ["hyperdrive_binding", "hyperdrive", /Production API receipt hyperdrive_binding/],
      [
        "hyperdrive_binding_verified",
        1,
        /Production API receipt hyperdrive_binding_verified/,
      ],
      [
        "wrangler_config_sha256",
        "f".repeat(63),
        /Production API receipt wrangler_config_sha256/,
      ],
      [
        "wrangler_config_sha256",
        "F".repeat(64),
        /Production API receipt wrangler_config_sha256/,
      ],
    ];

    for (const [field, invalidValue, expectedError] of invalidEvidence) {
      const candidate = validInput();
      candidate.apiReceipt[field] = invalidValue;
      assert.throws(() => evaluateProductionReleaseChain(candidate), expectedError);
    }
  });

  it("rejects aliased staging and production Hyperdrive identity or origin", () => {
    const sameId = validInput();
    sameId.apiReceipt.hyperdrive_id = sameId.stagingApiReceipt.hyperdrive_id;
    assert.throws(
      () => evaluateProductionReleaseChain(sameId),
      /Hyperdrive authorities are not distinct/,
    );

    const sameOrigin = validInput();
    sameOrigin.apiReceipt.hyperdrive_origin_fingerprint_sha256 =
      sameOrigin.stagingApiReceipt.hyperdrive_origin_fingerprint_sha256;
    assert.throws(
      () => evaluateProductionReleaseChain(sameOrigin),
      /Hyperdrive authorities are not distinct/,
    );
  });

  it("requires exactly the four named passing production smoke scenarios", () => {
    assert.equal(evaluateProductionPlaywrightReport(playwrightReport()).accepted, true);

    const failed = playwrightReport("failed");
    assert.equal(evaluateProductionPlaywrightReport(failed).accepted, false);

    const renamed = playwrightReport();
    renamed.suites[0].specs[0].title = "untrusted replacement";
    assert.equal(evaluateProductionPlaywrightReport(renamed).accepted, false);

    const retried = playwrightReport();
    retried.suites[0].specs[0].tests[0].results.push({ status: "passed" });
    assert.equal(evaluateProductionPlaywrightReport(retried).accepted, false);
  });
});
