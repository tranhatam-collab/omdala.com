import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SHA = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TRANSACTION = /^staging-[1-9][0-9]*-[1-9][0-9]*$/;
const SURFACES = Object.freeze(["web", "app", "auth", "brand"]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function requireUuidOrNull(value, label) {
  if (value !== null && !UUID.test(value ?? "")) {
    throw new Error(`${label} must be a UUID or null.`);
  }
  return value;
}

function parseReceipt(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function requireSharedIdentity(receipt, expected, label) {
  if (
    receipt?.environment !== "staging" ||
    receipt.candidate_sha !== expected.candidateSha ||
    receipt.control_plane_sha !== expected.controlPlaneSha ||
    receipt.staging_transaction_id !== expected.transactionId ||
    receipt.workflow_run_id !== expected.workflowRunId ||
    receipt.workflow_run_attempt !== expected.workflowRunAttempt ||
    receipt.cloudflare_account_id !== expected.cloudflareAccountId
  ) {
    throw new Error(`${label} is not bound to the exact staging transaction.`);
  }
}

function requireReusableIdentity(receipt, expected, path, label) {
  if (
    receipt.reusable_workflow_ref !==
      `${expected.repository}/${path}@${expected.controlPlaneSha}` ||
    receipt.reusable_workflow_sha !== expected.controlPlaneSha ||
    receipt.reusable_workflow_path !== path
  ) {
    throw new Error(`${label} reusable-workflow identity is invalid.`);
  }
}

export function createStagingRecoveryPlan({
  apiReceiptBytes,
  apiConfigBytes,
  surfaceReceiptBytes,
  rollbackSurfaces,
  expected,
}) {
  if (!SHA.test(expected.candidateSha ?? "")) {
    throw new Error("Expected candidate SHA must be full lowercase hex.");
  }
  if (!SHA.test(expected.controlPlaneSha ?? "")) {
    throw new Error("Expected control-plane SHA must be full lowercase hex.");
  }
  if (!TRANSACTION.test(expected.transactionId ?? "")) {
    throw new Error("Expected staging transaction ID is invalid.");
  }
  if (!Number.isSafeInteger(expected.workflowRunId) || expected.workflowRunId <= 0) {
    throw new Error("Expected workflow run ID must be positive.");
  }
  if (
    !Number.isSafeInteger(expected.workflowRunAttempt) ||
    expected.workflowRunAttempt <= 0
  ) {
    throw new Error("Expected workflow run attempt must be positive.");
  }
  if (!/^[a-f0-9]{32}$/.test(expected.cloudflareAccountId ?? "")) {
    throw new Error("Expected Cloudflare account ID is invalid.");
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(expected.repository ?? "")) {
    throw new Error("Expected repository must use owner/name form.");
  }

  const apiHash = sha256(apiReceiptBytes);
  if (!SHA256.test(expected.apiReceiptSha256 ?? "") || apiHash !== expected.apiReceiptSha256) {
    throw new Error("API receipt hash does not match the reusable-workflow output.");
  }
  const api = parseReceipt(apiReceiptBytes, "API receipt");
  requireSharedIdentity(api, expected, "API receipt");
  requireReusableIdentity(
    api,
    expected,
    ".github/workflows/deploy.yml",
    "API receipt",
  );
  if (
    api.schema_version !== 2 ||
    api.verdict !== "API_RELEASE_ACCEPTED" ||
    api.deployment_id !== api.version_id ||
    !UUID.test(api.version_id ?? "") ||
    !SHA256.test(api.wrangler_config_sha256 ?? "") ||
    api.wrangler_config_sha256 !== sha256(apiConfigBytes)
  ) {
    throw new Error("API receipt does not describe an exact deployed Worker version.");
  }
  requireUuidOrNull(api.previous_version_id, "API previous version ID");

  const targets = [];
  let surfaceHash = null;
  if (rollbackSurfaces) {
    if (!surfaceReceiptBytes) throw new Error("Surface receipt is required for surface recovery.");
    surfaceHash = sha256(surfaceReceiptBytes);
    if (
      !SHA256.test(expected.surfaceReceiptSha256 ?? "") ||
      surfaceHash !== expected.surfaceReceiptSha256
    ) {
      throw new Error("Surface receipt hash does not match the reusable-workflow output.");
    }
    const surfaceReceipt = parseReceipt(surfaceReceiptBytes, "Surface receipt");
    requireSharedIdentity(surfaceReceipt, expected, "Surface receipt");
    requireReusableIdentity(
      surfaceReceipt,
      expected,
      ".github/workflows/deploy-surfaces.yml",
      "Surface receipt",
    );
    if (
      surfaceReceipt.schema_version !== 4 ||
      surfaceReceipt.verdict !== "SURFACE_RELEASE_ACCEPTED" ||
      JSON.stringify(surfaceReceipt.surface_names) !== JSON.stringify(SURFACES) ||
      Object.keys(surfaceReceipt.worker_deployments ?? {}).sort().join(",") !==
        [...SURFACES].sort().join(",")
    ) {
      throw new Error("Surface receipt does not contain exactly the four staging Workers.");
    }
    for (const surface of [...SURFACES].reverse()) {
      const deployment = surfaceReceipt.worker_deployments[surface];
      if (
        deployment?.surface !== surface ||
        deployment.worker_name !== `omdala-surface-${surface}-staging` ||
        deployment.deployment_id !== deployment.version_id ||
        !UUID.test(deployment.version_id ?? "")
      ) {
        throw new Error(`${surface} recovery identity is invalid.`);
      }
      requireUuidOrNull(
        deployment.previous_version_id,
        `${surface} previous version ID`,
      );
      targets.push({
        kind: "surface",
        name: surface,
        workerName: deployment.worker_name,
        configPath: `infra/staging/surfaces/${surface}.wrangler.jsonc`,
        deployedVersionId: deployment.version_id,
        baselineVersionId: deployment.previous_version_id,
        useStagingEnvironment: false,
      });
    }
  }

  targets.push({
    kind: "api",
    name: "api",
    workerName: "omdala-api-staging",
    configPath: "recovery-input/api-release-wrangler.toml",
    deployedVersionId: api.version_id,
    baselineVersionId: api.previous_version_id,
    useStagingEnvironment: true,
  });

  return {
    schema_version: 1,
    verdict: "STAGING_RECOVERY_PLAN_ACCEPTED",
    transaction_id: expected.transactionId,
    candidate_sha: expected.candidateSha,
    control_plane_sha: expected.controlPlaneSha,
    workflow_run_id: expected.workflowRunId,
    workflow_run_attempt: expected.workflowRunAttempt,
    cloudflare_account_id: expected.cloudflareAccountId,
    rollback_surfaces: rollbackSurfaces,
    api_receipt_sha256: apiHash,
    api_wrangler_config_sha256: sha256(apiConfigBytes),
    surface_receipt_sha256: surfaceHash,
    targets,
  };
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("Arguments must use --name value pairs.");
    }
    result[key.slice(2)] = value;
  }
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rollbackSurfaces = args["rollback-surfaces"] === "true";
  if (!["true", "false"].includes(args["rollback-surfaces"])) {
    throw new Error("--rollback-surfaces must be true or false.");
  }
  const plan = createStagingRecoveryPlan({
    apiReceiptBytes: readFileSync(args["api-receipt"]),
    apiConfigBytes: readFileSync(args["api-config"]),
    surfaceReceiptBytes: rollbackSurfaces
      ? readFileSync(args["surface-receipt"])
      : undefined,
    rollbackSurfaces,
    expected: {
      candidateSha: args["candidate-sha"],
      controlPlaneSha: args["control-plane-sha"],
      transactionId: args["transaction-id"],
      workflowRunId: Number(args["workflow-run-id"]),
      workflowRunAttempt: Number(args["workflow-run-attempt"]),
      cloudflareAccountId: args["cloudflare-account-id"],
      repository: args.repository,
      apiReceiptSha256: args["api-receipt-sha256"],
      surfaceReceiptSha256: args["surface-receipt-sha256"],
    },
  });
  if (!args.output) throw new Error("--output is required.");
  writeFileSync(args.output, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(plan)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
