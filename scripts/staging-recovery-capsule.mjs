import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SHA = /^[a-f0-9]{40}$/;
const ACCOUNT = /^[a-f0-9]{32}$/;
const TRANSACTION = /^staging-[1-9][0-9]*-1$/;
const RELEASE = /^gh-[1-9][0-9]*-1-[a-f0-9]{12}$/;
const VERSION = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TARGET_ORDER = Object.freeze(["api", "web", "app", "auth", "brand"]);
const EXPECTED_REPOSITORY = "tranhatam-collab/omdala.com";
const TARGET_AUTHORITY = Object.freeze({
  api: Object.freeze({ kind: "api", workerName: "omdala-api-staging", configPath: "services/api/wrangler.release.toml", useStagingEnvironment: true }),
  web: Object.freeze({ kind: "surface", workerName: "omdala-surface-web-staging", configPath: "infra/staging/surfaces/web.wrangler.jsonc", useStagingEnvironment: false }),
  app: Object.freeze({ kind: "surface", workerName: "omdala-surface-app-staging", configPath: "infra/staging/surfaces/app.wrangler.jsonc", useStagingEnvironment: false }),
  auth: Object.freeze({ kind: "surface", workerName: "omdala-surface-auth-staging", configPath: "infra/staging/surfaces/auth.wrangler.jsonc", useStagingEnvironment: false }),
  brand: Object.freeze({ kind: "surface", workerName: "omdala-surface-brand-staging", configPath: "infra/staging/surfaces/brand.wrangler.jsonc", useStagingEnvironment: false }),
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function atomicJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(temporary, path);
}

function parseJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function requireSingleCurrentVersion(deployments, name) {
  if (!Array.isArray(deployments)) {
    throw new Error(`${name} deployment snapshot must be an array.`);
  }
  if (deployments.length === 0) return null;
  const latest = [...deployments].sort((left, right) =>
    String(left.created_on).localeCompare(String(right.created_on)),
  ).at(-1);
  if (
    !latest ||
    !Array.isArray(latest.versions) ||
    latest.versions.length !== 1 ||
    latest.versions[0]?.percentage !== 100 ||
    !VERSION.test(latest.versions[0]?.version_id ?? "")
  ) {
    throw new Error(`${name} has no single exact 100% rollback version.`);
  }
  return latest.versions[0].version_id;
}

function validateSpec(spec, expectedName) {
  const authority = TARGET_AUTHORITY[expectedName];
  if (
    spec?.name !== expectedName ||
    spec.kind !== authority.kind ||
    spec.workerName !== authority.workerName ||
    spec.configPath !== authority.configPath ||
    spec.deploymentsPath !== `provider-pre/${expectedName}.json` ||
    spec.useStagingEnvironment !== authority.useStagingEnvironment
  ) {
    throw new Error(`${expectedName} recovery target specification is invalid.`);
  }
}

function resolveTrustedEvidencePath(evidenceRoot, deploymentsPath) {
  const root = realpathSync(evidenceRoot);
  const expected = resolve(root, deploymentsPath);
  const actual = realpathSync(expected);
  if (actual !== expected || !actual.startsWith(`${root}/provider-pre/`)) {
    throw new Error("Provider deployment evidence is outside the exact trusted evidence root.");
  }
  return actual;
}

export function createRecoveryCapsule({
  candidateSha,
  controlPlaneSha,
  transactionId,
  releaseId,
  workflowRunId,
  workflowRunAttempt,
  cloudflareAccountId,
  repository,
  targetSpecs,
  evidenceRoot,
  readBytes = (path) => readFileSync(path),
  resolveEvidencePath = resolveTrustedEvidencePath,
}) {
  if (!SHA.test(candidateSha ?? "")) throw new Error("Candidate SHA is invalid.");
  if (!SHA.test(controlPlaneSha ?? "")) {
    throw new Error("Control-plane SHA is invalid.");
  }
  if (!TRANSACTION.test(transactionId ?? "")) {
    throw new Error("Staging transaction ID must bind attempt 1.");
  }
  if (!RELEASE.test(releaseId ?? "")) {
    throw new Error("Staging release ID must bind the original attempt-1 run.");
  }
  if (!Number.isSafeInteger(workflowRunId) || workflowRunId <= 0) {
    throw new Error("Workflow run ID is invalid.");
  }
  if (transactionId !== `staging-${workflowRunId}-1`) {
    throw new Error("Staging transaction ID does not match the original workflow run.");
  }
  if (releaseId !== `gh-${workflowRunId}-1-${candidateSha.slice(0, 12)}`) {
    throw new Error("Staging release ID does not match the run and candidate.");
  }
  if (workflowRunAttempt !== 1) {
    throw new Error("Staging transaction reruns are forbidden.");
  }
  if (!ACCOUNT.test(cloudflareAccountId ?? "")) {
    throw new Error("Cloudflare account ID is invalid.");
  }
  if (repository !== EXPECTED_REPOSITORY) {
    throw new Error(`Repository must be exactly ${EXPECTED_REPOSITORY}.`);
  }
  if (typeof evidenceRoot !== "string" || evidenceRoot.length === 0) {
    throw new Error("Trusted transaction evidence root is required.");
  }
  if (
    !Array.isArray(targetSpecs) ||
    targetSpecs.length !== TARGET_ORDER.length ||
    targetSpecs.map((entry) => entry?.name).join(",") !== TARGET_ORDER.join(",")
  ) {
    throw new Error("Recovery target order must be api, web, app, auth, brand.");
  }

  const targets = targetSpecs.map((spec, index) => {
    const name = TARGET_ORDER[index];
    validateSpec(spec, name);
    const configBytes = readBytes(spec.configPath);
    const deploymentBytes = readBytes(resolveEvidencePath(evidenceRoot, spec.deploymentsPath));
    const deployments = JSON.parse(deploymentBytes.toString("utf8"));
    return {
      kind: spec.kind,
      name,
      workerName: spec.workerName,
      configPath: spec.configPath,
      configSha256: sha256(configBytes),
      deploymentSnapshotSha256: sha256(deploymentBytes),
      baselineVersionId: requireSingleCurrentVersion(deployments, name),
      useStagingEnvironment: spec.useStagingEnvironment,
    };
  });

  return {
    schema_version: 1,
    verdict: "STAGING_RECOVERY_CAPSULE_SEALED",
    transaction_id: transactionId,
    release_id: releaseId,
    candidate_sha: candidateSha,
    control_plane_sha: controlPlaneSha,
    workflow_run_id: workflowRunId,
    workflow_run_attempt: workflowRunAttempt,
    cloudflare_account_id: cloudflareAccountId,
    repository,
    target_order: [...TARGET_ORDER],
    reverse_recovery_order: [...TARGET_ORDER].reverse(),
    database_recovery_policy: "additive_migrations_backup_and_manual_restore_only",
    runner_loss_recovery_authority: "MANUAL_REDISPATCH_REQUIRED",
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
  const outputDir = args["output-dir"];
  if (!outputDir) throw new Error("--output-dir is required.");
  const capsule = createRecoveryCapsule({
    candidateSha: args["candidate-sha"],
    controlPlaneSha: args["control-plane-sha"],
    transactionId: args["transaction-id"],
    releaseId: args["release-id"],
    workflowRunId: Number(args["workflow-run-id"]),
    workflowRunAttempt: Number(args["workflow-run-attempt"]),
    cloudflareAccountId: args["cloudflare-account-id"],
    repository: args.repository,
    targetSpecs: parseJson(args["target-specs"], "Target specification"),
    evidenceRoot: args["evidence-root"],
  });
  mkdirSync(outputDir, { recursive: true });
  const capsulePath = join(outputDir, "recovery-capsule.json");
  atomicJson(capsulePath, capsule);
  const capsuleSha256 = sha256(readFileSync(capsulePath));
  atomicJson(join(outputDir, "transaction-journal.json"), {
    schema_version: 1,
    transaction_id: capsule.transaction_id,
    candidate_sha: capsule.candidate_sha,
    control_plane_sha: capsule.control_plane_sha,
    recovery_capsule_sha256: capsuleSha256,
    status: "CAPSULE_SEALED_NO_MUTATION",
    migration: { state: "pending", database_schema_reverted: false },
    targets: capsule.targets.map((target) => ({
      name: target.name,
      state: "pending",
      baseline_version_id: target.baselineVersionId,
      deployed_version_id: null,
    })),
  });
  atomicJson(join(outputDir, "capsule-seal.json"), {
    schema_version: 1,
    verdict: "STAGING_RECOVERY_CAPSULE_SEALED",
    transaction_id: capsule.transaction_id,
    capsule_sha256: capsuleSha256,
    contains_secret_values: false,
    sealed_at: new Date().toISOString(),
  });
  process.stdout.write(`${capsuleSha256}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
