import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const FULL_SHA = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const HYPERDRIVE_ID = /^[a-f0-9]{32}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const POSITIVE_INTEGER = /^[1-9][0-9]*$/;
const STAGING_TRANSACTION_ID = /^staging-([1-9][0-9]*)-1$/;
const RELEASE_ID = /^[A-Za-z0-9._-]{8,160}$/;
const REQUIRED_SURFACES = Object.freeze(["web", "app", "auth", "brand"]);
const STAGING_SURFACE_SPECIFICATION = Object.freeze({
  web: { url: "https://staging.omdala.com", worker: "omdala-surface-web-staging" },
  app: { url: "https://app-staging.omdala.com", worker: "omdala-surface-app-staging" },
  auth: { url: "https://auth-staging.omdala.com", worker: "omdala-surface-auth-staging" },
  brand: { url: "https://brand-staging.omdala.com", worker: "omdala-surface-brand-staging" },
});
const SURFACE_SPECIFICATION = Object.freeze({
  web: {
    url: "https://omdala.com",
    project: "omdala-web",
    branch: "main",
    domain: "omdala.com",
  },
  app: {
    url: "https://app.omdala.com",
    project: "omdala-app",
    branch: "main",
    domain: "app.omdala.com",
  },
  auth: {
    url: "https://auth.omdala.com",
    project: "omdala-auth",
    branch: "production",
    domain: "auth.omdala.com",
  },
  brand: {
    url: "https://brand.omdala.com",
    project: "omdala-brand",
    branch: "main",
    domain: "brand.omdala.com",
  },
});
const EXPECTED_E2E_SCENARIOS = Object.freeze([
  "production API health and deep-health bind exact runtime identity",
  "all four production release manifests bind the exact release",
  "public production navigation remains canonical",
  "magic-link exchange verifies session, zero model egress, and logout",
]);
const WORKFLOW_SPECIFICATION = Object.freeze({
  staging: {
    name: "OMDALA Staging Transaction",
    path: ".github/workflows/staging-transaction.yml",
  },
  api: {
    name: "OMDALA Release",
    path: ".github/workflows/deploy.yml",
  },
  surfaces: {
    name: "OMDALA Surface Release",
    path: ".github/workflows/deploy-surfaces.yml",
  },
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isPositiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function requireFullSha(value, label) {
  invariant(FULL_SHA.test(value ?? ""), `${label} must be a full lowercase Git SHA.`);
  return value;
}

function requirePositiveInteger(value, label) {
  const number = typeof value === "number" ? value : Number(value);
  invariant(isPositiveInteger(number), `${label} must be a positive integer.`);
  return number;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function readJsonWithHash(path, label) {
  const bytes = readFileSync(path);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
  return { value, sha256: sha256(bytes) };
}

function validateHyperdriveEvidence(receipt, label) {
  invariant(
    HYPERDRIVE_ID.test(receipt?.hyperdrive_id ?? ""),
    `${label} hyperdrive_id must be exactly 32 lowercase hexadecimal characters.`,
  );
  invariant(
    receipt?.hyperdrive_binding === "HYPERDRIVE",
    `${label} hyperdrive_binding must equal HYPERDRIVE.`,
  );
  invariant(
    receipt?.hyperdrive_binding_verified === true,
    `${label} hyperdrive_binding_verified must be true.`,
  );
  invariant(
    receipt?.hyperdrive_target_verified === true,
    `${label} hyperdrive_target_verified must be true.`,
  );
  for (const field of [
    "hyperdrive_name",
    "hyperdrive_origin_host",
    "hyperdrive_origin_database",
    "hyperdrive_origin_user",
  ]) {
    invariant(
      typeof receipt?.[field] === "string" && receipt[field].trim().length > 0,
      `${label} ${field} is required.`,
    );
  }
  invariant(
    Number.isSafeInteger(receipt?.hyperdrive_origin_port) &&
      receipt.hyperdrive_origin_port > 0,
    `${label} hyperdrive_origin_port must be a positive integer.`,
  );
  invariant(
    receipt?.hyperdrive_origin_scheme === "postgresql",
    `${label} hyperdrive_origin_scheme must equal postgresql.`,
  );
  for (const field of [
    "hyperdrive_origin_fingerprint_sha256",
    "hyperdrive_authority_sha256",
  ]) {
    invariant(
      SHA256.test(receipt?.[field] ?? ""),
      `${label} ${field} must be exactly 64 lowercase hexadecimal characters.`,
    );
  }
  invariant(
    SHA256.test(receipt?.wrangler_config_sha256 ?? ""),
    `${label} wrangler_config_sha256 must be exactly 64 lowercase hexadecimal characters.`,
  );
  return receipt;
}

function validateWorkerAuthorityEvidence(receipt, label) {
  invariant(
    receipt?.secret_inventory_verified === true,
    `${label} secret_inventory_verified must be true.`,
  );
  invariant(
    receipt?.worker_authority_verified === true,
    `${label} worker_authority_verified must be true.`,
  );
  invariant(
    SHA256.test(receipt?.worker_authority_evidence_sha256 ?? ""),
    `${label} worker_authority_evidence_sha256 is invalid.`,
  );
}

function validateRun(
  run,
  specification,
  expectedRunId,
  expectedHeadSha,
  expectedRunAttempt,
) {
  const runId = requirePositiveInteger(expectedRunId, `${specification.name} run ID`);
  const pathMatches =
    run?.path === specification.path ||
    run?.path === `${specification.path}@refs/heads/main`;
  invariant(
    Number(run?.id) === runId &&
      run?.name === specification.name &&
      pathMatches &&
      run?.event === "workflow_dispatch" &&
      run?.head_branch === "main" &&
      FULL_SHA.test(run?.head_sha ?? "") &&
      (expectedRunAttempt === undefined ||
        Number(run?.run_attempt) === expectedRunAttempt) &&
      run?.status === "completed" &&
      run?.conclusion === "success",
    `${specification.name} run is not a successful trusted-main workflow_dispatch run.`,
  );
  if (expectedHeadSha) {
    invariant(
      run.head_sha === expectedHeadSha,
      `${specification.name} run does not use the accepted merged-main control plane.`,
    );
  }
  return run;
}

function validateReusableWorkflowIdentity(
  receipt,
  repository,
  path,
  controlPlaneSha,
  label,
) {
  invariant(
    receipt?.reusable_workflow_ref ===
      `${repository}/${path}@${controlPlaneSha}` &&
      receipt.reusable_workflow_sha === controlPlaneSha &&
      receipt.reusable_workflow_path === path,
    `${label} reusable workflow identity is invalid.`,
  );
}

function validateMigrationCompatibilityEvidence(receipt, label) {
  invariant(
    receipt?.migration_compatibility_verified === true &&
      SHA256.test(receipt.migration_compatibility_receipt_sha256 ?? "") &&
      SHA256.test(receipt.migration_manifest_sha256 ?? "") &&
      SHA256.test(receipt.migration_ledger_receipt_sha256 ?? "") &&
      receipt.rollback_scope ===
        "code_and_worker_only_database_schema_is_not_reverted" &&
      receipt.database_schema_reverted_by_code_rollback === false,
    `${label} migration compatibility evidence is missing or invalid.`,
  );
}

function validatePreMigrationRemoteEvidence(receipt, label) {
  invariant(
    receipt?.pre_migration_remote_preflight_verified === true &&
      SHA256.test(receipt.api_remote_preflight_receipt_sha256 ?? "") &&
      SHA256.test(receipt.hyperdrive_remote_preflight_receipt_sha256 ?? ""),
    `${label} pre-migration remote authority evidence is missing or invalid.`,
  );
}

function validateStagingTransactionReceipt(
  receipt,
  {
    stagingCandidateSha,
    stagingTransactionId,
    repository,
    stagingRun,
    receiptHashes,
  },
) {
  const match = STAGING_TRANSACTION_ID.exec(stagingTransactionId ?? "");
  invariant(match, "Staging transaction ID is invalid.");
  invariant(
    Number(match[1]) === Number(stagingRun.id) &&
      Number(stagingRun.run_attempt) === 1 &&
      stagingTransactionId ===
        `staging-${stagingRun.id}-${stagingRun.run_attempt}`,
    "Staging transaction ID does not bind the exact workflow run.",
  );
  invariant(
    receipt?.schema_version === 1 &&
      receipt.verdict === "STAGING_TRANSACTION_ACCEPTED" &&
      receipt.staging_transaction_id === stagingTransactionId &&
      receipt.candidate_sha === stagingCandidateSha &&
      receipt.control_plane_sha === stagingRun.head_sha &&
      receipt.workflow_run_id === Number(stagingRun.id) &&
      receipt.workflow_run_attempt === 1 &&
      receipt.repository === repository &&
      receipt.production_release_authorized === false &&
      receipt.production_release_status === "HOLD_NO_GO",
    "Staging transaction receipt is not bound to the exact accepted orchestrator run.",
  );
  invariant(
    receipt.api_receipt_sha256 === receiptHashes.stagingApi &&
      receipt.surface_receipt_sha256 === receiptHashes.stagingSurfaces &&
      receipt.acceptance_receipt_sha256 === receiptHashes.staging &&
      receiptHashes.stagingTransactionAcceptance === receiptHashes.staging &&
      receiptHashes.stagingTransactionApi === receiptHashes.stagingApi &&
      receiptHashes.stagingTransactionSurfaces === receiptHashes.stagingSurfaces,
    "Staging transaction receipt does not hash-bind the accepted staging evidence.",
  );
  return receipt;
}

function validateStagingReceipt(
  receipt,
  {
    stagingCandidateSha,
    stagingTransactionId,
    mainTreeSha,
    accountId,
    repository,
    stagingRun,
    stagingApiReceipt,
    stagingBackupReceipt,
    stagingSurfaceReceipt,
    stagingE2EReportSha256,
    receiptHashes,
  },
) {
  invariant(receipt?.schema_version === 2, "Staging acceptance schema must be version 2.");
  invariant(receipt.verdict === "STAGING_ACCEPTED", "Staging acceptance verdict is missing.");
  invariant(
    receipt.staging_transaction_id === stagingTransactionId,
    "Staging acceptance transaction ID mismatch.",
  );
  invariant(
    receipt.candidate_sha === stagingCandidateSha &&
      receipt.reviewed_sha === stagingCandidateSha,
    "Staging acceptance is not bound to the exact reviewed candidate SHA.",
  );
  invariant(
    receipt.candidate_tree_sha === mainTreeSha &&
      receipt.reviewed_tree_sha === mainTreeSha,
    "Staging acceptance tree is not equivalent to the merged-main tree.",
  );
  invariant(
    receipt.control_plane_sha === stagingRun.head_sha,
    "Staging acceptance control-plane SHA does not match its workflow run.",
  );
  invariant(
    receipt.api_release_control_plane_sha === receipt.control_plane_sha &&
      receipt.surface_release_control_plane_sha === receipt.control_plane_sha,
    "Staging API and surface releases do not share the accepted staging control plane.",
  );
  invariant(receipt.cloudflare_account_id === accountId, "Staging account authority mismatch.");
  invariant(receipt.repository === repository, "Staging receipt repository mismatch.");
  invariant(
    receipt.api_receipt_sha256 === receiptHashes.stagingApi &&
      receipt.surface_receipt_sha256 === receiptHashes.stagingSurfaces,
    "Staging acceptance does not hash-bind the downloaded API and surface receipts.",
  );
  invariant(
    receipt.workflow_run_id === Number(stagingRun.id) &&
      receipt.workflow_run_attempt === 1 &&
      receipt.api_release_run_id === Number(stagingRun.id) &&
      receipt.surface_release_run_id === Number(stagingRun.id),
    "Staging receipt run ID mismatch.",
  );
  invariant(isPositiveInteger(receipt.source_pr_number), "Staging source PR is invalid.");
  invariant(
    typeof receipt.independent_reviewer === "string" &&
      receipt.independent_reviewer.trim().length > 0 &&
      isPositiveInteger(receipt.independent_review_id),
    "Staging independent review identity is invalid.",
  );
  invariant(receipt.e2e_scenarios_executed === 4, "Staging E2E scenarios are incomplete.");
  invariant(
    SHA256.test(receipt.e2e_report_sha256 ?? "") &&
      receipt.e2e_report_sha256 === stagingE2EReportSha256,
    "Downloaded staging E2E report hash does not match acceptance.",
  );
  invariant(
    SHA256.test(receipt.database_backup_receipt_sha256 ?? ""),
    "Staging backup receipt hash is invalid.",
  );
  invariant(
    UUID.test(receipt.api_deployment_id ?? "") &&
      receipt.api_deployment_id === receipt.consumer_version_id &&
      typeof receipt.surface_release_id === "string" &&
      receipt.surface_release_id.length >= 8,
    "Staging release chain identity is incomplete.",
  );
  invariant(
    stagingBackupReceipt?.schema_version === 1 &&
      stagingBackupReceipt.verdict === "BACKUP_RESTORE_VERIFIED" &&
      stagingBackupReceipt.environment === "staging" &&
      stagingBackupReceipt.candidate_sha === stagingCandidateSha &&
      stagingBackupReceipt.source_and_restore_distinct === true &&
      stagingBackupReceipt.production_target_match === false &&
      stagingBackupReceipt.exact_row_counts_match === true &&
      stagingBackupReceipt.encrypted_backup_decrypt_verified === true &&
      SHA256.test(stagingBackupReceipt.encrypted_backup_sha256 ?? "") &&
      receipt.database_backup_receipt_sha256 === receiptHashes.stagingBackup,
    "Downloaded staging backup/restore receipt does not match acceptance.",
  );
  validateHyperdriveEvidence(stagingApiReceipt, "Staging API receipt");
  validateWorkerAuthorityEvidence(stagingApiReceipt, "Staging API receipt");
  validateMigrationCompatibilityEvidence(stagingApiReceipt, "Staging API receipt");
  validatePreMigrationRemoteEvidence(stagingApiReceipt, "Staging API receipt");
  invariant(
    receipt.api_secret_inventory_verified === true &&
      receipt.api_worker_authority_verified === true &&
      receipt.api_worker_authority_evidence_sha256 ===
        stagingApiReceipt.worker_authority_evidence_sha256,
    "Staging acceptance does not bind the exact Worker authority evidence.",
  );
  invariant(
    stagingApiReceipt.hyperdrive_isolated_from_production === true,
    "Staging API Hyperdrive is not isolated from production.",
  );
  validateReusableWorkflowIdentity(
    receipt,
    repository,
    ".github/workflows/staging-go-live-e2e.yml",
    receipt.control_plane_sha,
    "Staging acceptance receipt",
  );
  validateReusableWorkflowIdentity(
    stagingApiReceipt,
    repository,
    ".github/workflows/deploy.yml",
    receipt.control_plane_sha,
    "Staging API receipt",
  );
  validateReusableWorkflowIdentity(
    stagingSurfaceReceipt,
    repository,
    ".github/workflows/deploy-surfaces.yml",
    receipt.control_plane_sha,
    "Staging surface receipt",
  );
  invariant(
    stagingApiReceipt?.schema_version === 2 &&
      stagingApiReceipt.verdict === "API_RELEASE_ACCEPTED" &&
      stagingApiReceipt.environment === "staging" &&
      stagingApiReceipt.candidate_sha === stagingCandidateSha &&
      stagingApiReceipt.candidate_tree_sha === mainTreeSha &&
      stagingApiReceipt.reviewed_sha === stagingCandidateSha &&
      stagingApiReceipt.reviewed_tree_sha === mainTreeSha &&
      stagingApiReceipt.control_plane_sha === receipt.api_release_control_plane_sha &&
      stagingApiReceipt.staging_transaction_id === stagingTransactionId &&
      stagingApiReceipt.cloudflare_account_id === accountId &&
      stagingApiReceipt.repository === repository &&
      stagingApiReceipt.workflow_run_id === Number(stagingRun.id) &&
      stagingApiReceipt.workflow_run_attempt === 1 &&
      stagingApiReceipt.source_pr_number === receipt.source_pr_number &&
      stagingApiReceipt.independent_reviewer === receipt.independent_reviewer &&
      stagingApiReceipt.independent_review_id === receipt.independent_review_id &&
      stagingApiReceipt.api_url === "https://api-staging.omdala.com" &&
      stagingApiReceipt.version_id === receipt.consumer_version_id &&
      stagingApiReceipt.deployment_id === receipt.api_deployment_id &&
      stagingApiReceipt.database_backup_receipt_sha256 === receiptHashes.stagingBackup &&
      stagingApiReceipt.encrypted_backup_sha256 ===
        stagingBackupReceipt.encrypted_backup_sha256,
    "Downloaded staging API release receipt does not match acceptance.",
  );
  invariant(
    stagingSurfaceReceipt?.schema_version === 4 &&
      stagingSurfaceReceipt.verdict === "SURFACE_RELEASE_ACCEPTED" &&
      stagingSurfaceReceipt.environment === "staging" &&
      stagingSurfaceReceipt.candidate_sha === stagingCandidateSha &&
      stagingSurfaceReceipt.candidate_tree_sha === mainTreeSha &&
      stagingSurfaceReceipt.reviewed_sha === stagingCandidateSha &&
      stagingSurfaceReceipt.reviewed_tree_sha === mainTreeSha &&
      stagingSurfaceReceipt.control_plane_sha ===
        receipt.surface_release_control_plane_sha &&
      stagingSurfaceReceipt.staging_transaction_id === stagingTransactionId &&
      stagingSurfaceReceipt.cloudflare_account_id === accountId &&
      stagingSurfaceReceipt.repository === repository &&
      stagingSurfaceReceipt.workflow_run_id === Number(stagingRun.id) &&
      stagingSurfaceReceipt.workflow_run_attempt === 1 &&
      stagingSurfaceReceipt.source_pr_number === receipt.source_pr_number &&
      stagingSurfaceReceipt.independent_reviewer === receipt.independent_reviewer &&
      stagingSurfaceReceipt.independent_review_id === receipt.independent_review_id &&
      stagingSurfaceReceipt.release_id === receipt.surface_release_id &&
      JSON.stringify(stagingSurfaceReceipt.surface_names) ===
        JSON.stringify(REQUIRED_SURFACES) &&
      Object.keys(stagingSurfaceReceipt.worker_deployments ?? {}).sort().join(",") ===
        [...REQUIRED_SURFACES].sort().join(",") &&
      Object.keys(stagingSurfaceReceipt.pages_deployments ?? {}).length === 0,
    "Downloaded staging surface release receipt does not match acceptance.",
  );
  for (const surface of REQUIRED_SURFACES) {
    const manifest = stagingSurfaceReceipt.surfaces?.[surface];
    const deployment = stagingSurfaceReceipt.worker_deployments?.[surface];
    const specification = STAGING_SURFACE_SPECIFICATION[surface];
    invariant(
      manifest?.surface === surface &&
        manifest.environment === "staging" &&
        manifest.release_sha === stagingCandidateSha &&
        manifest.release_id === receipt.surface_release_id &&
        manifest.url === specification.url &&
        SHA256.test(manifest.asset_manifest_sha256 ?? "") &&
        isPositiveInteger(manifest.asset_file_count),
      `${surface} staging surface manifest is invalid.`,
    );
    invariant(
      deployment?.schema_version === 1 &&
        deployment.surface === surface &&
        deployment.platform === "cloudflare-workers-static-assets" &&
        deployment.worker_name === specification.worker &&
        deployment.release_id === receipt.surface_release_id &&
        UUID.test(deployment.deployment_id ?? "") &&
        UUID.test(deployment.version_id ?? "") &&
        SHA256.test(deployment.version_etag ?? ""),
      `${surface} staging Worker deployment identity is invalid.`,
    );
  }
  return receipt;
}

function validateApiReceipt(
  receipt,
  backup,
  encryptedBackupSha256,
  { mainSha, mainTreeSha, accountId, repository, apiRun, stagingReceipt },
) {
  invariant(receipt?.schema_version === 2, "Production API receipt schema must be version 2.");
  invariant(
    receipt.verdict === "API_RELEASE_ACCEPTED" && receipt.environment === "production",
    "Production API receipt is not accepted.",
  );
  validateHyperdriveEvidence(receipt, "Production API receipt");
  validateWorkerAuthorityEvidence(receipt, "Production API receipt");
  validateMigrationCompatibilityEvidence(receipt, "Production API receipt");
  validatePreMigrationRemoteEvidence(receipt, "Production API receipt");
  invariant(
    receipt.hyperdrive_isolated_from_production === false,
    "Production API Hyperdrive authority marker is invalid.",
  );
  invariant(RELEASE_ID.test(receipt.release_id ?? ""), "Production API release ID is invalid.");
  invariant(
    receipt.candidate_sha === mainSha && receipt.candidate_tree_sha === mainTreeSha,
    "Production API receipt is not bound to merged main.",
  );
  invariant(
    receipt.reviewed_sha === stagingReceipt.reviewed_sha &&
      receipt.reviewed_tree_sha === mainTreeSha,
    "Production API receipt is not tree-equivalent to the staging-reviewed candidate.",
  );
  invariant(
    receipt.control_plane_sha === apiRun.head_sha,
    "Production API control-plane SHA does not match its workflow run.",
  );
  invariant(
    receipt.cloudflare_account_id === accountId && receipt.repository === repository,
    "Production API authority mismatch.",
  );
  invariant(
    receipt.workflow_run_id === Number(apiRun.id),
    "Production API receipt run ID mismatch.",
  );
  invariant(
    receipt.source_pr_number === stagingReceipt.source_pr_number &&
      receipt.independent_reviewer === stagingReceipt.independent_reviewer &&
      receipt.independent_review_id === stagingReceipt.independent_review_id,
    "Production API independent-review chain mismatch.",
  );
  invariant(receipt.api_url === "https://api.omdala.com", "Production API URL is not canonical.");
  invariant(
    UUID.test(receipt.version_id ?? "") &&
      receipt.deployment_id === receipt.version_id &&
      UUID.test(receipt.cloudflare_deployment_id ?? ""),
    "Production API version or deployment identity is invalid.",
  );
  invariant(
    UUID.test(receipt.previous_version_id ?? "") &&
      UUID.test(receipt.previous_deployment_id ?? "") &&
      receipt.previous_version_id !== receipt.version_id &&
      receipt.previous_deployment_id !== receipt.cloudflare_deployment_id,
    "Production API rollback baseline is missing or aliases the new deployment.",
  );
  invariant(
    SHA256.test(receipt.database_backup_receipt_sha256 ?? "") &&
      SHA256.test(receipt.encrypted_backup_sha256 ?? ""),
    "Production API backup hashes are invalid.",
  );
  invariant(
    backup?.verdict === "BACKUP_RESTORE_VERIFIED" &&
      backup.environment === "production" &&
      backup.candidate_sha === mainSha &&
      backup.source_and_restore_distinct === true &&
      backup.production_target_match === true &&
      backup.exact_row_counts_match === true &&
      backup.encrypted_backup_decrypt_verified === true,
    "Production backup/restore receipt is not accepted.",
  );
  invariant(
    backup.encrypted_backup_sha256 === encryptedBackupSha256 &&
      receipt.encrypted_backup_sha256 === encryptedBackupSha256,
    "Encrypted production backup hash mismatch.",
  );
  return receipt;
}

function validateSurfaceReceipt(
  receipt,
  { mainSha, mainTreeSha, accountId, repository, surfaceRun, stagingReceipt },
) {
  invariant(receipt?.schema_version === 4, "Production surface receipt schema must be version 4.");
  invariant(
    receipt.verdict === "SURFACE_RELEASE_ACCEPTED" && receipt.environment === "production",
    "Production surface receipt is not accepted.",
  );
  invariant(
    RELEASE_ID.test(receipt.release_id ?? ""),
    "Production surface release ID is invalid.",
  );
  invariant(
    receipt.candidate_sha === mainSha && receipt.candidate_tree_sha === mainTreeSha,
    "Production surface receipt is not bound to merged main.",
  );
  invariant(
    receipt.reviewed_sha === stagingReceipt.reviewed_sha &&
      receipt.reviewed_tree_sha === mainTreeSha,
    "Production surface receipt is not tree-equivalent to the staging-reviewed candidate.",
  );
  invariant(
    receipt.control_plane_sha === surfaceRun.head_sha,
    "Production surface control-plane SHA does not match its workflow run.",
  );
  invariant(
    receipt.cloudflare_account_id === accountId && receipt.repository === repository,
    "Production surface authority mismatch.",
  );
  invariant(
    receipt.workflow_run_id === Number(surfaceRun.id),
    "Production surface receipt run ID mismatch.",
  );
  invariant(
    receipt.source_pr_number === stagingReceipt.source_pr_number &&
      receipt.independent_reviewer === stagingReceipt.independent_reviewer &&
      receipt.independent_review_id === stagingReceipt.independent_review_id,
    "Production surface independent-review chain mismatch.",
  );
  invariant(
    JSON.stringify(receipt.surface_names) === JSON.stringify(REQUIRED_SURFACES) &&
      Object.keys(receipt.surfaces ?? {}).sort().join(",") ===
        [...REQUIRED_SURFACES].sort().join(",") &&
      Object.keys(receipt.pages_deployments ?? {}).sort().join(",") ===
        [...REQUIRED_SURFACES].sort().join(",") &&
      Object.keys(receipt.worker_deployments ?? {}).length === 0,
    "Production surface set is incomplete or contains the wrong provider type.",
  );

  for (const surface of REQUIRED_SURFACES) {
    const manifest = receipt.surfaces[surface];
    const deployment = receipt.pages_deployments[surface];
    const specification = SURFACE_SPECIFICATION[surface];
    invariant(
      manifest?.schema_version === 1 &&
        manifest.surface === surface &&
        manifest.environment === "production" &&
        manifest.release_sha === mainSha &&
        manifest.release_id === receipt.release_id &&
        manifest.url === specification.url &&
        SHA256.test(manifest.asset_manifest_sha256 ?? "") &&
        isPositiveInteger(manifest.asset_file_count) &&
        SHA256.test(manifest.manifest_sha256 ?? ""),
      `${surface} production manifest identity is invalid.`,
    );
    invariant(
      deployment?.schema_version === 1 &&
        deployment.surface === surface &&
        deployment.platform === "cloudflare-pages" &&
        deployment.environment === "production" &&
        deployment.project_name === specification.project &&
        deployment.release_id === receipt.release_id &&
        deployment.source_sha === mainSha &&
        UUID.test(deployment.deployment_id ?? "") &&
        UUID.test(deployment.previous_deployment_id ?? "") &&
        deployment.previous_deployment_id !== deployment.deployment_id &&
        deployment.production_branch === specification.branch &&
        deployment.deployment_status === "success" &&
        deployment.custom_domain === specification.domain &&
        deployment.canonical_after_deploy === true,
      `${surface} production Pages deployment or rollback baseline is invalid.`,
    );
    let deploymentUrl;
    try {
      deploymentUrl = new URL(deployment.deployment_url);
    } catch {
      deploymentUrl = null;
    }
    invariant(
      deploymentUrl?.protocol === "https:" &&
        deploymentUrl.hostname.endsWith(".pages.dev") &&
        !deploymentUrl.username &&
        !deploymentUrl.password &&
        !deploymentUrl.port,
      `${surface} Pages deployment URL is invalid.`,
    );
  }
  return receipt;
}

function flattenPlaywrightTests(suites, output = []) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        output.push({ title: spec.title, ...test });
      }
    }
    flattenPlaywrightTests(suite.suites, output);
  }
  return output;
}

export function evaluateProductionPlaywrightReport(report) {
  const tests = flattenPlaywrightTests(report?.suites);
  const titles = tests.map(({ title }) => title).sort();
  const expectedTitles = [...EXPECTED_E2E_SCENARIOS].sort();
  const passed = tests.filter(
    (test) =>
      test.status === "expected" &&
      Array.isArray(test.results) &&
      test.results.length === 1 &&
      test.results[0]?.status === "passed",
  );
  const stats = report?.stats ?? {};
  const accepted =
    JSON.stringify(titles) === JSON.stringify(expectedTitles) &&
    passed.length === EXPECTED_E2E_SCENARIOS.length &&
    stats.expected === EXPECTED_E2E_SCENARIOS.length &&
    stats.unexpected === 0 &&
    stats.flaky === 0 &&
    stats.skipped === 0;
  return {
    accepted,
    reason: accepted ? "ALL_PRODUCTION_SCENARIOS_EXECUTED" : "PRODUCTION_SCENARIOS_INCOMPLETE",
    expectedCount: EXPECTED_E2E_SCENARIOS.length,
    discoveredCount: tests.length,
    executedAndPassedCount: passed.length,
    titles,
    stats,
    noSpendScenarioPassed:
      passed.some(
        ({ title }) =>
          title ===
          "magic-link exchange verifies session, zero model egress, and logout",
      ),
  };
}

function validateNoSpendEvidence(input, mainSha) {
  const source = input.noSpendSourceReceipt;
  invariant(
    source?.schema_version === 1 &&
      source.verdict === "PRODUCTION_NO_SPEND_SOURCE_ACCEPTED" &&
      source.accepted === true &&
      Array.isArray(source.checks) &&
      source.checks.length === 4 &&
      source.checks.every((check) => check?.pass === true) &&
      Object.values(source.sources ?? {}).length === 4 &&
      Object.values(source.sources ?? {}).every((hash) => SHA256.test(hash)),
    "Production no-spend source receipt is missing or invalid.",
  );
  const runtime = input.noSpendRuntimeReceipt;
  invariant(
    runtime?.schema_version === 1 &&
      runtime.verdict === "PRODUCTION_NO_SPEND_RUNTIME_VERIFIED" &&
      runtime.release_sha === mainSha &&
      runtime.checked_endpoint === "https://api.omdala.com/v1/ai/health" &&
      runtime.model_or_spend_requests_observed === 0 &&
      runtime.health_model_call_executed === false &&
      runtime.configuration_only === true,
    "Production no-spend runtime receipt is missing or invalid.",
  );
  invariant(
    SHA256.test(input.noSpendSourceReceiptSha256 ?? "") &&
      SHA256.test(input.noSpendRuntimeReceiptSha256 ?? ""),
    "Production no-spend receipt hash is invalid.",
  );
  return { source, runtime };
}

export function evaluateProductionReleaseChain(input) {
  const mainSha = requireFullSha(input.mainSha, "Merged-main SHA");
  const mainTreeSha = requireFullSha(input.mainTreeSha, "Merged-main tree SHA");
  const controlPlaneSha = requireFullSha(input.controlPlaneSha, "Control-plane SHA");
  const stagingCandidateSha = requireFullSha(
    input.stagingCandidateSha,
    "Staging candidate SHA",
  );
  invariant(
    mainSha === controlPlaneSha,
    "Production acceptance must execute from the accepted merged-main SHA.",
  );
  invariant(
    /^[a-f0-9]{32}$/.test(input.accountId ?? ""),
    "Cloudflare account ID must be exactly 32 lowercase hex characters.",
  );
  invariant(
    /^[^/\s]+\/[^/\s]+$/.test(input.repository ?? ""),
    "Repository must use the owner/name form.",
  );

  const stagingRun = validateRun(
    input.stagingRun,
    WORKFLOW_SPECIFICATION.staging,
    input.stagingTransactionRunId,
    undefined,
    1,
  );
  const apiRun = validateRun(
    input.apiRun,
    WORKFLOW_SPECIFICATION.api,
    input.apiRunId,
    mainSha,
  );
  const surfaceRun = validateRun(
    input.surfaceRun,
    WORKFLOW_SPECIFICATION.surfaces,
    input.surfaceRunId,
    mainSha,
  );
  const stagingTransactionReceipt = validateStagingTransactionReceipt(
    input.stagingTransactionReceipt,
    {
      stagingCandidateSha,
      stagingTransactionId: input.stagingTransactionId,
      repository: input.repository,
      stagingRun,
      receiptHashes: input.receiptHashes,
    },
  );
  const stagingReceipt = validateStagingReceipt(input.stagingReceipt, {
    stagingCandidateSha,
    stagingTransactionId: input.stagingTransactionId,
    mainTreeSha,
    accountId: input.accountId,
    repository: input.repository,
    stagingRun,
    stagingTransactionReceipt,
    stagingApiReceipt: input.stagingApiReceipt,
    stagingBackupReceipt: input.stagingBackupReceipt,
    stagingSurfaceReceipt: input.stagingSurfaceReceipt,
    stagingE2EReportSha256: input.stagingE2EReportSha256,
    receiptHashes: input.receiptHashes,
  });
  const apiReceipt = validateApiReceipt(
    input.apiReceipt,
    input.backupReceipt,
    input.encryptedBackupSha256,
    {
      mainSha,
      mainTreeSha,
      accountId: input.accountId,
      repository: input.repository,
      apiRun,
      stagingReceipt,
    },
  );
  invariant(
    stagingReceipt &&
      input.stagingApiReceipt.hyperdrive_id !== apiReceipt.hyperdrive_id &&
      input.stagingApiReceipt.hyperdrive_origin_fingerprint_sha256 !==
        apiReceipt.hyperdrive_origin_fingerprint_sha256 &&
      input.stagingApiReceipt.hyperdrive_authority_sha256 ===
        apiReceipt.hyperdrive_authority_sha256,
    "Staging and production Hyperdrive authorities are not distinct under one reviewed policy.",
  );
  invariant(
    SHA256.test(input.receiptHashes?.backup ?? "") &&
      apiReceipt.database_backup_receipt_sha256 === input.receiptHashes.backup,
    "Production API receipt does not bind the downloaded backup/restore receipt.",
  );
  const surfaceReceipt = validateSurfaceReceipt(input.surfaceReceipt, {
    mainSha,
    mainTreeSha,
    accountId: input.accountId,
    repository: input.repository,
    surfaceRun,
    stagingReceipt,
  });
  invariant(
    apiReceipt.release_id !== surfaceReceipt.release_id,
    "API and surface release IDs must identify their distinct release transactions.",
  );

  return {
    mainSha,
    mainTreeSha,
    controlPlaneSha,
    stagingCandidateSha,
    stagingRun,
    stagingRunAttempt: Number(stagingRun.run_attempt),
    stagingTransactionReceipt,
    apiRun,
    surfaceRun,
    stagingReceipt,
    apiReceipt,
    surfaceReceipt,
  };
}

export function createProductionAcceptanceReceipt(input) {
  const chain = evaluateProductionReleaseChain(input);
  const e2e = evaluateProductionPlaywrightReport(input.playwrightReport);
  invariant(e2e.accepted, "Production Playwright report is incomplete or contains failures.");
  invariant(
    e2e.noSpendScenarioPassed,
    "Production no-spend Playwright scenario did not pass.",
  );
  const noSpend = validateNoSpendEvidence(input, chain.mainSha);
  invariant(SHA256.test(input.playwrightReportSha256 ?? ""), "Playwright report hash is invalid.");
  for (const [label, hash] of Object.entries(input.receiptHashes ?? {})) {
    invariant(SHA256.test(hash ?? ""), `${label} receipt hash is invalid.`);
  }

  const pages = {};
  for (const surface of REQUIRED_SURFACES) {
    const deployment = chain.surfaceReceipt.pages_deployments[surface];
    pages[surface] = {
      deployment_id: deployment.deployment_id,
      rollback_deployment_id: deployment.previous_deployment_id,
    };
  }

  return {
    schema_version: 2,
    verdict: "PRODUCTION_ACCEPTED",
    merged_main_sha: chain.mainSha,
    merged_main_tree_sha: chain.mainTreeSha,
    control_plane_sha: chain.controlPlaneSha,
    staging_candidate_sha: chain.stagingCandidateSha,
    staging_candidate_tree_sha: chain.stagingReceipt.candidate_tree_sha,
    tree_equivalence_verified: true,
    cloudflare_account_id: input.accountId,
    source_pr_number: chain.stagingReceipt.source_pr_number,
    independent_reviewer: chain.stagingReceipt.independent_reviewer,
    independent_review_id: chain.stagingReceipt.independent_review_id,
    staging_acceptance: {
      staging_transaction_id: input.stagingTransactionId,
      workflow_run_id: Number(chain.stagingRun.id),
      workflow_run_attempt: chain.stagingRunAttempt,
      transaction_receipt_sha256: input.receiptHashes.stagingTransaction,
      receipt_sha256: input.receiptHashes.staging,
      api_release_receipt_sha256: input.receiptHashes.stagingApi,
      backup_receipt_sha256: input.receiptHashes.stagingBackup,
      surface_release_receipt_sha256: input.receiptHashes.stagingSurfaces,
    },
    api: {
      workflow_run_id: Number(chain.apiRun.id),
      release_id: chain.apiReceipt.release_id,
      version_id: chain.apiReceipt.version_id,
      cloudflare_deployment_id: chain.apiReceipt.cloudflare_deployment_id,
      rollback_version_id: chain.apiReceipt.previous_version_id,
      rollback_deployment_id: chain.apiReceipt.previous_deployment_id,
      receipt_sha256: input.receiptHashes.api,
      backup_receipt_sha256: input.receiptHashes.backup,
      encrypted_backup_sha256: input.encryptedBackupSha256,
      hyperdrive_id: chain.apiReceipt.hyperdrive_id,
      hyperdrive_origin_fingerprint_sha256:
        chain.apiReceipt.hyperdrive_origin_fingerprint_sha256,
    },
    surfaces: {
      workflow_run_id: Number(chain.surfaceRun.id),
      release_id: chain.surfaceReceipt.release_id,
      receipt_sha256: input.receiptHashes.surfaces,
      pages,
    },
    production_smoke: {
      report_sha256: input.playwrightReportSha256,
      scenarios_executed: e2e.executedAndPassedCount,
      scenario_titles: e2e.titles,
      authenticated_session_verified: true,
      secure_host_only_cookies_verified: true,
      logout_verified: true,
      model_or_spend_probe_executed:
        noSpend.runtime.health_model_call_executed,
      model_or_spend_requests_observed:
        noSpend.runtime.model_or_spend_requests_observed,
      source_contract_receipt_sha256: input.noSpendSourceReceiptSha256,
      runtime_receipt_sha256: input.noSpendRuntimeReceiptSha256,
    },
    workflow_run_id: requirePositiveInteger(input.workflowRunId, "Acceptance workflow run ID"),
    workflow_run_attempt: requirePositiveInteger(
      input.workflowRunAttempt,
      "Acceptance workflow run attempt",
    ),
    repository: input.repository,
    created_at: input.createdAt ?? new Date().toISOString(),
  };
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!name?.startsWith("--") || value === undefined) {
      throw new Error("Arguments must use --name value pairs.");
    }
    options[name.slice(2)] = value;
  }
  return options;
}

function appendOutputs(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  writeFileSync(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`, { flag: "a" });
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  const phase = options.phase ?? "final";
  invariant(phase === "chain" || phase === "final", "--phase must be chain or final.");

  const stagingRun = readJsonWithHash(options["staging-run"], "Staging run");
  const apiRun = readJsonWithHash(options["api-run"], "API run");
  const surfaceRun = readJsonWithHash(options["surface-run"], "Surface run");
  const stagingTransactionReceipt = readJsonWithHash(
    options["staging-transaction-receipt"],
    "Staging transaction receipt",
  );
  const stagingTransactionAcceptanceReceipt = readJsonWithHash(
    options["staging-transaction-acceptance-receipt"],
    "Staging transaction acceptance receipt copy",
  );
  const stagingTransactionApiReceipt = readJsonWithHash(
    options["staging-transaction-api-receipt"],
    "Staging transaction API receipt copy",
  );
  const stagingTransactionSurfaceReceipt = readJsonWithHash(
    options["staging-transaction-surface-receipt"],
    "Staging transaction surface receipt copy",
  );
  const stagingReceipt = readJsonWithHash(
    options["staging-receipt"],
    "Staging acceptance receipt",
  );
  const stagingApiReceipt = readJsonWithHash(
    options["staging-api-receipt"],
    "Staging API release receipt",
  );
  const stagingBackupReceipt = readJsonWithHash(
    options["staging-backup-receipt"],
    "Staging backup/restore receipt",
  );
  const stagingSurfaceReceipt = readJsonWithHash(
    options["staging-surface-receipt"],
    "Staging surface release receipt",
  );
  const stagingE2EReportBytes = readFileSync(options["staging-e2e-report"]);
  const apiReceipt = readJsonWithHash(options["api-receipt"], "API release receipt");
  const backupReceipt = readJsonWithHash(
    options["backup-receipt"],
    "Backup/restore receipt",
  );
  const surfaceReceipt = readJsonWithHash(
    options["surface-receipt"],
    "Surface release receipt",
  );
  const encryptedBackupBytes = readFileSync(options["encrypted-backup"]);
  const encryptedBackupSha256 = sha256(encryptedBackupBytes);
  const common = {
    mainSha: options["main-sha"],
    mainTreeSha: options["main-tree-sha"],
    controlPlaneSha: options["control-plane-sha"],
    stagingCandidateSha: options["staging-candidate-sha"],
    stagingTransactionId: options["staging-transaction-id"],
    accountId: options["account-id"],
    repository: options.repository,
    stagingTransactionRunId: options["staging-transaction-run-id"],
    apiRunId: options["api-run-id"],
    surfaceRunId: options["surface-run-id"],
    stagingRun: stagingRun.value,
    apiRun: apiRun.value,
    surfaceRun: surfaceRun.value,
    stagingTransactionReceipt: stagingTransactionReceipt.value,
    stagingReceipt: stagingReceipt.value,
    stagingApiReceipt: stagingApiReceipt.value,
    stagingBackupReceipt: stagingBackupReceipt.value,
    stagingSurfaceReceipt: stagingSurfaceReceipt.value,
    stagingE2EReportSha256: sha256(stagingE2EReportBytes),
    apiReceipt: apiReceipt.value,
    backupReceipt: backupReceipt.value,
    surfaceReceipt: surfaceReceipt.value,
    encryptedBackupSha256,
    receiptHashes: {
      stagingTransaction: stagingTransactionReceipt.sha256,
      stagingTransactionAcceptance: stagingTransactionAcceptanceReceipt.sha256,
      stagingTransactionApi: stagingTransactionApiReceipt.sha256,
      stagingTransactionSurfaces: stagingTransactionSurfaceReceipt.sha256,
      staging: stagingReceipt.sha256,
      stagingApi: stagingApiReceipt.sha256,
      stagingBackup: stagingBackupReceipt.sha256,
      stagingSurfaces: stagingSurfaceReceipt.sha256,
      api: apiReceipt.sha256,
      backup: backupReceipt.sha256,
      surfaces: surfaceReceipt.sha256,
    },
  };
  const chain = evaluateProductionReleaseChain(common);
  appendOutputs({
    api_version_id: chain.apiReceipt.version_id,
    api_deployment_id: chain.apiReceipt.cloudflare_deployment_id,
    api_url: chain.apiReceipt.api_url,
    surface_release_id: chain.surfaceReceipt.release_id,
    web_url: chain.surfaceReceipt.surfaces.web.url,
    app_url: chain.surfaceReceipt.surfaces.app.url,
    auth_url: chain.surfaceReceipt.surfaces.auth.url,
    brand_url: chain.surfaceReceipt.surfaces.brand.url,
  });

  if (phase === "chain") {
    const preflight = {
      schema_version: 1,
      verdict: "PRODUCTION_RELEASE_CHAIN_VERIFIED",
      merged_main_sha: chain.mainSha,
      merged_main_tree_sha: chain.mainTreeSha,
      staging_candidate_sha: chain.stagingCandidateSha,
      staging_transaction_id: common.stagingTransactionId,
      tree_equivalence_verified: true,
      cloudflare_account_id: options["account-id"],
      receipt_hashes: common.receiptHashes,
      checked_at: new Date().toISOString(),
    };
    writeFileSync(options.output, `${JSON.stringify(preflight, null, 2)}\n`, "utf8");
    return;
  }

  const playwrightReport = readJsonWithHash(options.report, "Production Playwright report");
  const noSpendSourceReceipt = readJsonWithHash(
    options["no-spend-source-receipt"],
    "Production no-spend source receipt",
  );
  const noSpendRuntimeReceipt = readJsonWithHash(
    options["no-spend-runtime-receipt"],
    "Production no-spend runtime receipt",
  );
  const receipt = createProductionAcceptanceReceipt({
    ...common,
    playwrightReport: playwrightReport.value,
    playwrightReportSha256: playwrightReport.sha256,
    noSpendSourceReceipt: noSpendSourceReceipt.value,
    noSpendSourceReceiptSha256: noSpendSourceReceipt.sha256,
    noSpendRuntimeReceipt: noSpendRuntimeReceipt.value,
    noSpendRuntimeReceiptSha256: noSpendRuntimeReceipt.sha256,
    workflowRunId: options["workflow-run-id"],
    workflowRunAttempt: options["workflow-run-attempt"],
  });
  writeFileSync(options.output, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  appendOutputs({
    report_sha256: playwrightReport.sha256,
    scenarios_executed: receipt.production_smoke.scenarios_executed,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export { EXPECTED_E2E_SCENARIOS, REQUIRED_SURFACES, SURFACE_SPECIFICATION };
