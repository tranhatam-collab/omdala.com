import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SHA = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const TRANSACTION = /^staging-([1-9][0-9]*)-1$/;
const TARGETS = new Set(["api", "web", "app", "auth", "brand"]);
const TARGET_ORDER = ["api", "web", "app", "auth", "brand"];
const RECOVERY_ORDER = ["brand", "auth", "app", "web", "api"];
const EXPECTED_REPOSITORY = "tranhatam-collab/omdala.com";
const VERSION = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TARGET_AUTHORITY = Object.freeze({
  api: Object.freeze({ kind: "api", workerName: "omdala-api-staging", configPath: "services/api/wrangler.release.toml", useStagingEnvironment: true }),
  web: Object.freeze({ kind: "surface", workerName: "omdala-surface-web-staging", configPath: "infra/staging/surfaces/web.wrangler.jsonc", useStagingEnvironment: false }),
  app: Object.freeze({ kind: "surface", workerName: "omdala-surface-app-staging", configPath: "infra/staging/surfaces/app.wrangler.jsonc", useStagingEnvironment: false }),
  auth: Object.freeze({ kind: "surface", workerName: "omdala-surface-auth-staging", configPath: "infra/staging/surfaces/auth.wrangler.jsonc", useStagingEnvironment: false }),
  brand: Object.freeze({ kind: "surface", workerName: "omdala-surface-brand-staging", configPath: "infra/staging/surfaces/brand.wrangler.jsonc", useStagingEnvironment: false }),
});
const RECOVERY_ACTION = Object.freeze({
  pending_unchanged: "pending_unchanged",
  already_at_baseline: "already_at_baseline",
  already_absent: "already_absent",
  rollback_required: "rollback",
  delete_required: "delete_new_staging_resource",
});
export const MAX_LEDGER_PAYLOAD_BYTES = 1024 * 1024;

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function parseJsonBytes(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

function encodeBytes(bytes) {
  return { sha256: digest(bytes), base64: bytes.toString("base64") };
}

function encodeFile(path) {
  return encodeBytes(readFileSync(path));
}

function decodeFile(entry, label) {
  if (!entry || !SHA256.test(entry.sha256 ?? "") || typeof entry.base64 !== "string") {
    throw new Error(`${label} encoded file is invalid`);
  }
  const bytes = Buffer.from(entry.base64, "base64");
  if (bytes.toString("base64") !== entry.base64 || digest(bytes) !== entry.sha256) {
    throw new Error(`${label} encoded bytes do not match their digest`);
  }
  return bytes;
}

function requireExactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  if (Object.keys(value).sort().join(",") !== [...expected].sort().join(",")) {
    throw new Error(`${label} contains an unexpected path or is missing a required path`);
  }
}

function assertRecordPayloadCap(record, label) {
  if (Buffer.byteLength(`${JSON.stringify(record, null, 2)}\n`) > MAX_LEDGER_PAYLOAD_BYTES) {
    throw new Error(`${label} exceeds the one MiB D1 payload cap`);
  }
}

function exactIdentity(value, capsule, label) {
  if (
    value?.transaction_id !== capsule.transaction_id ||
    value?.candidate_sha !== capsule.candidate_sha ||
    (value.control_plane_sha !== undefined && value.control_plane_sha !== capsule.control_plane_sha) ||
    (value.workflow_run_id !== undefined && value.workflow_run_id !== capsule.workflow_run_id) ||
    (value.release_id !== undefined && value.release_id !== capsule.release_id)
  ) throw new Error(`${label} identity does not match the PREPARED capsule`);
}

function validCapsuleTarget(target, name) {
  const authority = TARGET_AUTHORITY[name];
  return target &&
    Object.keys(target).sort().join(",") === [
      "baselineVersionId", "configPath", "configSha256", "deploymentSnapshotSha256",
      "kind", "name", "useStagingEnvironment", "workerName",
    ].sort().join(",") &&
    target.name === name && target.kind === authority.kind &&
    target.workerName === authority.workerName && target.configPath === authority.configPath &&
    target.useStagingEnvironment === authority.useStagingEnvironment &&
    SHA256.test(target.configSha256 ?? "") && SHA256.test(target.deploymentSnapshotSha256 ?? "") &&
    (target.baselineVersionId === null || VERSION.test(target.baselineVersionId ?? ""));
}

export function validateCapsuleLedgerRecord(record) {
  assertRecordPayloadCap(record, "PREPARED ledger record");
  if (record?.schema_version !== 1 || record.record_type !== "capsule") {
    throw new Error("PREPARED ledger record type is invalid");
  }
  requireExactKeys(record.files, [
    "recovery_capsule", "transaction_journal", "capsule_seal", "api_wrangler_release_toml",
    "surface_web_wrangler_jsonc", "surface_app_wrangler_jsonc",
    "surface_auth_wrangler_jsonc", "surface_brand_wrangler_jsonc",
  ], "PREPARED ledger files");
  const capsuleBytes = decodeFile(record.files?.recovery_capsule, "Recovery capsule");
  const journalBytes = decodeFile(record.files?.transaction_journal, "Transaction journal");
  const sealBytes = decodeFile(record.files?.capsule_seal, "Capsule seal");
  const apiBytes = decodeFile(record.files?.api_wrangler_release_toml, "API Wrangler config");
  const surfaceBytes = Object.fromEntries(
    ["web", "app", "auth", "brand"].map((name) => [
      name,
      decodeFile(record.files?.[`surface_${name}_wrangler_jsonc`], `${name} Wrangler config`),
    ]),
  );
  const capsule = parseJsonBytes(capsuleBytes, "Recovery capsule");
  const journal = parseJsonBytes(journalBytes, "Transaction journal");
  const seal = parseJsonBytes(sealBytes, "Capsule seal");
  const transaction = TRANSACTION.exec(capsule.transaction_id ?? "");
  if (
    !transaction || capsule.schema_version !== 1 ||
    capsule.verdict !== "STAGING_RECOVERY_CAPSULE_SEALED" ||
    !SHA.test(capsule.candidate_sha ?? "") || !SHA.test(capsule.control_plane_sha ?? "") ||
    capsule.workflow_run_id !== Number(transaction[1]) || capsule.workflow_run_attempt !== 1 ||
    capsule.transaction_id !== `staging-${capsule.workflow_run_id}-1` ||
    capsule.release_id !== `gh-${capsule.workflow_run_id}-1-${capsule.candidate_sha.slice(0, 12)}` ||
    !/^[a-f0-9]{32}$/.test(capsule.cloudflare_account_id ?? "") ||
    capsule.repository !== EXPECTED_REPOSITORY ||
    JSON.stringify(capsule.target_order) !== JSON.stringify(TARGET_ORDER) ||
    JSON.stringify(capsule.reverse_recovery_order) !== JSON.stringify(RECOVERY_ORDER) ||
    capsule.database_recovery_policy !== "additive_migrations_backup_and_manual_restore_only" ||
    capsule.runner_loss_recovery_authority !== "MANUAL_REDISPATCH_REQUIRED" ||
    record.transaction_id !== capsule.transaction_id || record.workflow_run_id !== capsule.workflow_run_id ||
    record.candidate_sha !== capsule.candidate_sha || record.control_plane_sha !== capsule.control_plane_sha ||
    record.release_id !== capsule.release_id || record.capsule_sha256 !== record.files.recovery_capsule.sha256 ||
    record.production_release_authorized !== false
  ) throw new Error("PREPARED ledger capsule identity is invalid");
  exactIdentity(journal, capsule, "Transaction journal");
  if (
    journal.schema_version !== 1 ||
    journal.recovery_capsule_sha256 !== record.capsule_sha256 ||
    journal.status !== "CAPSULE_SEALED_NO_MUTATION" ||
    JSON.stringify(journal.migration) !== JSON.stringify({ state: "pending", database_schema_reverted: false }) ||
    !Array.isArray(journal.targets) ||
    JSON.stringify(journal.targets.map((target) => target?.name)) !== JSON.stringify(TARGET_ORDER) ||
    journal.targets.some((target, index) =>
      Object.keys(target ?? {}).sort().join(",") !== ["baseline_version_id", "deployed_version_id", "name", "state"].sort().join(",") ||
      target.state !== "pending" || target.deployed_version_id !== null ||
      target.baseline_version_id !== capsule.targets?.[index]?.baselineVersionId) ||
    seal.transaction_id !== capsule.transaction_id || seal.capsule_sha256 !== record.capsule_sha256 ||
    seal.verdict !== "STAGING_RECOVERY_CAPSULE_SEALED" || seal.contains_secret_values !== false ||
    !Array.isArray(capsule.targets) || capsule.targets.length !== 5 ||
    JSON.stringify(capsule.targets.map((target) => target?.name)) !== JSON.stringify(TARGET_ORDER) ||
    capsule.targets.some((target, index) => !validCapsuleTarget(target, TARGET_ORDER[index])) ||
    capsule.targets?.find((target) => target.name === "api")?.configSha256 !== digest(apiBytes) ||
    Object.entries(surfaceBytes).some(([name, bytes]) =>
      capsule.targets.find((target) => target.name === name)?.configSha256 !== digest(bytes))
  ) throw new Error("PREPARED ledger capsule evidence binding is invalid");
  return { capsule, journal, seal };
}

function nullableVersion(value) {
  return value === null || VERSION.test(value ?? "");
}

function validRecoveryExecution(value) {
  return value && Object.keys(value).sort().join(",") === [
    "control_plane_sha", "repository", "run_attempt", "run_id", "workflow_path", "workflow_ref",
  ].sort().join(",") &&
    value.repository === EXPECTED_REPOSITORY &&
    value.workflow_path === ".github/workflows/staging-transaction.yml" &&
    value.workflow_ref === `${EXPECTED_REPOSITORY}/.github/workflows/staging-transaction.yml@refs/heads/main` &&
    Number.isSafeInteger(value.run_id) && value.run_id > 0 &&
    value.run_attempt === 1 && SHA.test(value.control_plane_sha ?? "");
}

function validRecoveryEvidence(plan, recovery, capsule, journal) {
  if (
    Object.keys(plan ?? {}).sort().join(",") !== [
      "candidate_sha", "control_plane_sha", "mutation_targets", "schema_version",
      "recovery_execution", "targets", "transaction_id", "verdict",
    ].sort().join(",") ||
    !validRecoveryExecution(plan?.recovery_execution) ||
    JSON.stringify(recovery?.recovery_execution) !== JSON.stringify(plan.recovery_execution) ||
    !Array.isArray(plan?.targets) ||
    JSON.stringify(plan.targets.map((target) => target?.name)) !== JSON.stringify(RECOVERY_ORDER) ||
    !Array.isArray(plan.mutation_targets) ||
    !Array.isArray(recovery?.targets) ||
    JSON.stringify(recovery.targets.map((target) => target?.name)) !== JSON.stringify(RECOVERY_ORDER) ||
    JSON.stringify(recovery.mutation_targets) !== JSON.stringify(plan.mutation_targets)
  ) return false;
  const expectedMutationTargets = plan.targets
    .filter((target) => ["rollback_required", "delete_required"].includes(target?.disposition))
    .map((target) => target.name);
  if (JSON.stringify(plan.mutation_targets) !== JSON.stringify(expectedMutationTargets)) return false;
  return plan.targets.every((target, index) => {
    const result = recovery.targets[index];
    const capsuleTarget = capsule.targets.find((entry) => entry.name === target?.name);
    const journalTarget = journal.targets.find((entry) => entry.name === target?.name);
    const expectedAction = RECOVERY_ACTION[target?.disposition];
    if (
      Object.keys(target ?? {}).sort().join(",") !== [
        "baselineVersionId", "configPath", "deployedVersionId", "discoveredVersionId",
        "disposition", "journalState", "name", "useStagingEnvironment", "workerName",
      ].sort().join(",") ||
      Object.keys(result ?? {}).sort().join(",") !== [
        "action", "baseline_version_id", "deployed_version_id", "disposition", "name",
        "provider_readback_verified", "provider_version_after", "provider_version_before", "worker_name",
      ].sort().join(",") ||
      !expectedAction ||
      !["pending", "attempted", "deployed"].includes(target.journalState) ||
      !capsuleTarget || !journalTarget ||
      target.workerName !== capsuleTarget.workerName ||
      target.configPath !== capsuleTarget.configPath ||
      target.useStagingEnvironment !== capsuleTarget.useStagingEnvironment ||
      target.baselineVersionId !== capsuleTarget.baselineVersionId ||
      target.journalState !== journalTarget.state ||
      target.baselineVersionId !== journalTarget.baseline_version_id ||
      target.deployedVersionId !== journalTarget.deployed_version_id ||
      !nullableVersion(target.baselineVersionId) ||
      !nullableVersion(target.deployedVersionId) ||
      !nullableVersion(target.discoveredVersionId) ||
      result?.name !== target.name || result.disposition !== target.disposition ||
      result.worker_name !== target.workerName ||
      result.action !== expectedAction || result.provider_readback_verified !== true ||
      result.baseline_version_id !== target.baselineVersionId ||
      result.deployed_version_id !== target.deployedVersionId ||
      result.provider_version_before !== target.discoveredVersionId ||
      result.provider_version_after !== target.baselineVersionId
    ) return false;
    const semanticDisposition = {
      pending_unchanged:
        target.journalState === "pending" && target.deployedVersionId === null &&
        target.discoveredVersionId === target.baselineVersionId,
      already_at_baseline:
        target.journalState !== "pending" && target.baselineVersionId !== null &&
        target.discoveredVersionId === target.baselineVersionId,
      already_absent:
        target.journalState !== "pending" && target.baselineVersionId === null &&
        target.discoveredVersionId === null,
      rollback_required:
        target.journalState !== "pending" && target.baselineVersionId !== null &&
        target.deployedVersionId !== null && target.discoveredVersionId === target.deployedVersionId,
      delete_required:
        target.journalState !== "pending" && target.baselineVersionId === null &&
        target.deployedVersionId !== null && target.discoveredVersionId === target.deployedVersionId,
    }[target.disposition];
    return semanticDisposition === true;
  });
}

function validRecoveredJournal(journal, capsule, plan, executor) {
  if (
    Object.keys(journal ?? {}).sort().join(",") !== [
      "candidate_sha", "control_plane_sha", "migration", "recovery_capsule_sha256",
      "schema_version", "status", "targets", "transaction_id", "updated_at",
    ].sort().join(",") ||
    journal.schema_version !== 1 || journal.status !== executor.verdict ||
    !journal.migration || Object.keys(journal.migration).sort().join(",") !== "database_schema_reverted,state" ||
    !["pending", "attempted", "applied_additive"].includes(journal.migration.state) ||
    journal.migration.database_schema_reverted !== false ||
    !Array.isArray(journal.targets) ||
    JSON.stringify(journal.targets.map((target) => target?.name)) !== JSON.stringify(TARGET_ORDER)
  ) return false;
  if (journal.targets.some((target, index) =>
    Object.keys(target ?? {}).sort().join(",") !== ["baseline_version_id", "deployed_version_id", "name", "state"].sort().join(",") ||
    !["pending", "attempted", "deployed"].includes(target.state) ||
    target.baseline_version_id !== capsule.targets[index].baselineVersionId ||
    !nullableVersion(target.baseline_version_id) || !nullableVersion(target.deployed_version_id))) return false;
  return plan.targets.every((target) => {
    const journalTarget = journal.targets.find((entry) => entry.name === target.name);
    return journalTarget && target.journalState === journalTarget.state &&
      target.baselineVersionId === journalTarget.baseline_version_id &&
      target.deployedVersionId === journalTarget.deployed_version_id;
  });
}

function validProviderManifestTargets(targets) {
  if (!Array.isArray(targets) || targets.length !== TARGETS.size) return false;
  const names = targets.map((target) => target?.name);
  const phaseKeys = [
    "deployments_sha256", "version_sha256", "secret_inventory_sha256",
    "secret_authority_sha256", "binding_authority_sha256", "absence_authority_sha256",
  ];
  return new Set(names).size === TARGETS.size && [...TARGETS].every((name) => names.includes(name)) &&
    targets.every((target) => [target.pre, target.post].every((phase) =>
      phase && Object.keys(phase).sort().join(",") === [...phaseKeys].sort().join(",") &&
      phaseKeys.filter((key) => key !== "absence_authority_sha256").every((key) => SHA256.test(phase[key] ?? "")) &&
      (phase.absence_authority_sha256 === null || SHA256.test(phase.absence_authority_sha256 ?? ""))));
}

export function validateTerminalLedgerRecord(record, capsuleRecord, preparedRecordSha256) {
  assertRecordPayloadCap(record, "Terminal ledger record");
  const { capsule } = validateCapsuleLedgerRecord(capsuleRecord);
  if (
    record?.schema_version !== 1 ||
    !["commit", "recovery"].includes(record.record_type) ||
    !SHA256.test(preparedRecordSha256 ?? "") ||
    record.prepared_record_sha256 !== preparedRecordSha256 ||
    record.capsule_sha256 !== capsuleRecord.capsule_sha256 ||
    record.production_release_authorized !== false
  ) throw new Error("Terminal ledger record binding is invalid");
  exactIdentity(record, capsule, "Terminal ledger record");

  if (record.record_type === "commit") {
    requireExactKeys(record.files, [
      "transaction_commit", "transaction_executor_receipt", "staging_acceptance", "provider_evidence_manifest",
    ], "COMMITTED ledger files");
    const receiptBytes = decodeFile(record.files?.transaction_commit, "Transaction commit");
    const executorBytes = decodeFile(record.files?.transaction_executor_receipt, "Executor receipt");
    const acceptanceBytes = decodeFile(record.files?.staging_acceptance, "Staging acceptance");
    const providerBytes = decodeFile(record.files?.provider_evidence_manifest, "Provider evidence manifest");
    const receipt = parseJsonBytes(receiptBytes, "Transaction commit");
    const executor = parseJsonBytes(executorBytes, "Executor receipt");
    const acceptance = parseJsonBytes(acceptanceBytes, "Staging acceptance");
    const provider = parseJsonBytes(providerBytes, "Provider evidence manifest");
    exactIdentity(receipt, capsule, "Transaction commit");
    exactIdentity(executor, capsule, "Executor receipt");
    if (
      receipt.schema_version !== 1 || receipt.verdict !== "STAGING_TRANSACTION_COMMIT_INTENT" ||
      receipt.release_id !== capsule.release_id ||
      receipt.recovery_capsule_sha256 !== capsuleRecord.capsule_sha256 ||
      receipt.executor_receipt_sha256 !== digest(executorBytes) ||
      receipt.acceptance_receipt_sha256 !== digest(acceptanceBytes) ||
      receipt.provider_evidence_manifest_sha256 !== digest(providerBytes) ||
      receipt.durable_ledger_is_authority !== true || receipt.artifacts_are_supplemental !== true ||
      receipt.production_release_authorized !== false ||
      executor.schema_version !== 2 || executor.verdict !== "STAGING_TRANSACTION_PREPARED_FOR_COMMIT" ||
      executor.mode !== "deploy" || executor.release_id !== capsule.release_id ||
      executor.original_exit_status !== 0 || executor.recovery_exit_status !== 0 ||
      executor.recovery_capsule_sha256 !== capsuleRecord.capsule_sha256 ||
      executor.acceptance_receipt_sha256 !== digest(acceptanceBytes) ||
      executor.provider_evidence_manifest_sha256 !== digest(providerBytes) || executor.contains_secret_values !== false ||
      acceptance.schema_version !== 4 || acceptance.verdict !== "STAGING_ACCEPTANCE_PREPARED_UNIFIED_TRANSACTION" ||
      acceptance.staging_transaction_id !== capsule.transaction_id || acceptance.candidate_sha !== capsule.candidate_sha ||
      acceptance.control_plane_sha !== capsule.control_plane_sha ||
      acceptance.workflow_run_id !== capsule.workflow_run_id || acceptance.workflow_run_attempt !== 1 ||
      acceptance.workflow_path !== ".github/workflows/staging-transaction.yml" ||
      acceptance.provider_evidence_manifest_sha256 !== digest(providerBytes) ||
      JSON.stringify(acceptance.provider_evidence) !== JSON.stringify(provider) ||
      acceptance.immutable_artifact_published !== false || acceptance.production_release_authorized !== false ||
      acceptance.production_release_status !== "HOLD_NO_GO" ||
      provider.schema_version !== 1 || provider.verdict !== "STAGING_PROVIDER_EVIDENCE_EXACT" ||
      provider.transaction_id !== capsule.transaction_id || provider.release_id !== capsule.release_id ||
      provider.candidate_sha !== capsule.candidate_sha || !validProviderManifestTargets(provider.targets)
    ) throw new Error("COMMITTED ledger evidence is invalid");
    return;
  }

  requireExactKeys(record.files, [
    "transaction_executor_receipt", "staging_recovery_receipt", "recovery_plan", "transaction_journal",
  ], "RECOVERED ledger files");

  const executorBytes = decodeFile(record.files?.transaction_executor_receipt, "Executor receipt");
  const recoveryBytes = decodeFile(record.files?.staging_recovery_receipt, "Recovery receipt");
  const planBytes = decodeFile(record.files?.recovery_plan, "Recovery plan");
  const journalBytes = decodeFile(record.files?.transaction_journal, "Recovered journal");
  const executor = parseJsonBytes(executorBytes, "Executor receipt");
  const recovery = parseJsonBytes(recoveryBytes, "Recovery receipt");
  const plan = parseJsonBytes(planBytes, "Recovery plan");
  const journal = parseJsonBytes(journalBytes, "Recovered journal");
  for (const [value, label] of [[executor, "Executor receipt"], [recovery, "Recovery receipt"], [plan, "Recovery plan"], [journal, "Recovered journal"]]) {
    exactIdentity(value, capsule, label);
  }
  const recoveryOnly = executor.verdict === "STAGING_RECOVERY_ONLY_VERIFIED";
  const failedDeploy = executor.verdict === "STAGING_TRANSACTION_FAILED_RECOVERY_VERIFIED";
  const executorStatusValid =
    (recoveryOnly && executor.mode === "recovery-only" && executor.original_exit_status === 0) ||
    (failedDeploy && executor.mode === "deploy" && Number.isInteger(executor.original_exit_status) && executor.original_exit_status > 0);
  const executorSignalValid =
    (recoveryOnly && executor.signal === null) ||
    (failedDeploy && (
      executor.signal === null ||
      (executor.signal === "INT" && executor.original_exit_status === 130) ||
      (executor.signal === "TERM" && executor.original_exit_status === 143)
    ));
  if (
    Object.keys(executor ?? {}).sort().join(",") !== [
      "acceptance_receipt_sha256", "candidate_sha", "completed_at", "contains_secret_values",
      "control_plane_sha", "database_schema_reverted", "mode", "original_exit_status",
      "provider_evidence_manifest_sha256", "recovery_capsule_sha256", "recovery_exit_status",
      "recovery_execution", "recovery_receipt_sha256", "release_id", "schema_version", "signal",
      "transaction_id", "transaction_journal_sha256", "verdict",
    ].sort().join(",") ||
    executor.schema_version !== 2 ||
    (!recoveryOnly && !failedDeploy) || !executorStatusValid ||
    executor.recovery_exit_status !== 0 || !executorSignalValid ||
    executor.database_schema_reverted !== false || executor.contains_secret_values !== false ||
    ![executor.acceptance_receipt_sha256, executor.provider_evidence_manifest_sha256]
      .every((value) => value === null || SHA256.test(value ?? "")) ||
    executor.recovery_capsule_sha256 !== capsuleRecord.capsule_sha256 ||
    !validRecoveryExecution(executor.recovery_execution) ||
    JSON.stringify(executor.recovery_execution) !== JSON.stringify(plan.recovery_execution) ||
    JSON.stringify(record.recovery_execution) !== JSON.stringify(plan.recovery_execution) ||
    executor.recovery_receipt_sha256 !== digest(recoveryBytes) ||
    executor.transaction_journal_sha256 !== digest(journalBytes) ||
    Object.keys(recovery ?? {}).sort().join(",") !== [
      "candidate_sha", "completed_at", "control_plane_sha", "database_schema_reverted",
      "mutation_targets", "provider_readback_verified", "recovery_execution", "recovery_plan_sha256", "schema_version",
      "targets", "transaction_id", "verdict",
    ].sort().join(",") ||
    recovery.schema_version !== 2 || recovery.verdict !== "STAGING_COMPENSATING_RECOVERY_VERIFIED" ||
    recovery.recovery_plan_sha256 !== digest(planBytes) || recovery.provider_readback_verified !== true ||
    recovery.database_schema_reverted !== false ||
    plan.schema_version !== 2 || plan.verdict !== "STAGING_RECOVERY_PLAN_ACCEPTED" ||
    journal.recovery_capsule_sha256 !== capsuleRecord.capsule_sha256 ||
    !validRecoveredJournal(journal, capsule, plan, executor) ||
    !validRecoveryEvidence(plan, recovery, capsule, journal)
  ) throw new Error("RECOVERED ledger evidence is invalid");
}

export function createCapsuleLedgerRecord({ capsulePath, journalPath, sealPath, apiConfigPath, surfaceDirectory }) {
  const files = {
    recovery_capsule: encodeFile(capsulePath),
    transaction_journal: encodeFile(journalPath),
    capsule_seal: encodeFile(sealPath),
    api_wrangler_release_toml: encodeFile(apiConfigPath),
    ...Object.fromEntries(["web", "app", "auth", "brand"].map((name) => [
      `surface_${name}_wrangler_jsonc`,
      encodeFile(join(surfaceDirectory, `${name}.wrangler.jsonc`)),
    ])),
  };
  const capsule = parseJsonBytes(decodeFile(files.recovery_capsule, "Recovery capsule"), "Recovery capsule");
  const record = {
    schema_version: 1, record_type: "capsule",
    transaction_id: capsule.transaction_id, workflow_run_id: capsule.workflow_run_id,
    candidate_sha: capsule.candidate_sha, control_plane_sha: capsule.control_plane_sha,
    release_id: capsule.release_id, capsule_sha256: files.recovery_capsule.sha256,
    files, production_release_authorized: false, created_at: new Date().toISOString(),
  };
  validateCapsuleLedgerRecord(record);
  return record;
}

export function createTerminalLedgerRecord({ type, capsuleRecordBytes, files }) {
  const capsuleRecord = parseJsonBytes(capsuleRecordBytes, "PREPARED ledger record");
  validateCapsuleLedgerRecord(capsuleRecord);
  const record = {
    schema_version: 1, record_type: type,
    transaction_id: capsuleRecord.transaction_id, workflow_run_id: capsuleRecord.workflow_run_id,
    candidate_sha: capsuleRecord.candidate_sha, control_plane_sha: capsuleRecord.control_plane_sha,
    release_id: capsuleRecord.release_id, capsule_sha256: capsuleRecord.capsule_sha256,
    prepared_record_sha256: digest(capsuleRecordBytes),
    files: Object.fromEntries(Object.entries(files).map(([name, path]) => [name, encodeFile(path)])),
    production_release_authorized: false, created_at: new Date().toISOString(),
  };
  if (type === "recovery") {
    const executor = JSON.parse(readFileSync(files.transaction_executor_receipt, "utf8"));
    record.recovery_execution = executor.recovery_execution;
  }
  validateTerminalLedgerRecord(record, capsuleRecord, digest(capsuleRecordBytes));
  return record;
}

export function scanLedgerEvents(rows) {
  if (!Array.isArray(rows)) throw new Error("D1 ledger rows must be an array");
  const groups = new Map();
  for (const row of rows) {
    if (
      !TRANSACTION.test(row?.transaction_id ?? "") ||
      !["PREPARED", "COMMITTED", "RECOVERED"].includes(row?.event_type) ||
      !SHA256.test(row?.prepared_sha256 ?? "") || !SHA256.test(row?.payload_sha256 ?? "") ||
      typeof row?.payload_json !== "string" || Buffer.byteLength(row.payload_json) > MAX_LEDGER_PAYLOAD_BYTES ||
      digest(Buffer.from(row.payload_json)) !== row.payload_sha256
    ) throw new Error("D1 ledger row or payload digest is invalid");
    const record = JSON.parse(row.payload_json);
    const expectedType = { PREPARED: "capsule", COMMITTED: "commit", RECOVERED: "recovery" }[row.event_type];
    if (
      record.record_type !== expectedType || record.transaction_id !== row.transaction_id ||
      record.workflow_run_id !== row.workflow_run_id || record.candidate_sha !== row.candidate_sha
    ) throw new Error("D1 ledger row identity does not match its payload");
    if (!groups.has(row.transaction_id)) groups.set(row.transaction_id, {});
    const group = groups.get(row.transaction_id);
    if (group[row.event_type]) throw new Error("D1 ledger contains a duplicate event type");
    group[row.event_type] = { row, record };
  }
  const summaries = [];
  for (const [transactionId, group] of groups) {
    if (!group.PREPARED) throw new Error("D1 terminal event has no PREPARED event");
    if (group.COMMITTED && group.RECOVERED) throw new Error("D1 ledger transaction has dual terminal events");
    const prepared = group.PREPARED;
    validateCapsuleLedgerRecord(prepared.record);
    if (prepared.row.prepared_sha256 !== prepared.row.payload_sha256) {
      throw new Error("D1 PREPARED row does not self-bind its payload");
    }
    const terminal = group.COMMITTED ?? group.RECOVERED;
    if (terminal) {
      if (terminal.row.prepared_sha256 !== prepared.row.payload_sha256) {
        throw new Error("D1 terminal row does not link the exact PREPARED payload");
      }
      validateTerminalLedgerRecord(terminal.record, prepared.record, prepared.row.payload_sha256);
    }
    summaries.push({
      transaction_id: transactionId,
      workflow_run_id: prepared.record.workflow_run_id,
      candidate_sha: prepared.record.candidate_sha,
      control_plane_sha: prepared.record.control_plane_sha,
      release_id: prepared.record.release_id,
      capsule_sha256: prepared.record.capsule_sha256,
      capsule_record_path: `staging-durable-ledger-records/${transactionId}/capsule.json`,
      terminal_record_type: group.COMMITTED ? "commit" : group.RECOVERED ? "recovery" : null,
      prepared_payload_json: prepared.row.payload_json,
    });
  }
  return summaries.sort((left, right) => left.workflow_run_id - right.workflow_run_id);
}

function assertSafeDirectory(path) {
  const absolute = resolve(path);
  let metadata = null;
  try { metadata = lstatSync(absolute); } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (metadata) {
    if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
      throw new Error("Ledger output directory must be a real directory");
    }
    if (realpathSync(absolute) !== absolute) throw new Error("Ledger output directory must be canonical");
  } else {
    assertSafeDirectory(dirname(absolute));
    mkdirSync(absolute, { mode: 0o700 });
  }
  return absolute;
}

function safeWrite(path, bytes) {
  assertSafeDirectory(dirname(resolve(path)));
  const output = resolve(path);
  try {
    if (lstatSync(output).isSymbolicLink()) throw new Error("Ledger output file must not be a symlink");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  writeFileSync(output, bytes, { mode: 0o600 });
}

function successfulProviderResponse(value) {
  return value?.success === true && Array.isArray(value.errors) && value.errors.length === 0 &&
    Array.isArray(value.result) && value.result.length === 1 && value.result[0]?.success === true &&
    Array.isArray(value.result[0].results);
}

function readProviderResponse(path) {
  if (!path || !existsSync(path)) return { bytes: Buffer.alloc(0), value: null };
  const bytes = readFileSync(path);
  try { return { bytes, value: JSON.parse(bytes.toString("utf8")) }; } catch { return { bytes, value: null }; }
}

export function classifyAppendOutcome({ eventType, recordBytes, appendResponse, appendTransportStatus = 0, appendHttpStatus = "200", readbackResponse }) {
  if (!new Set(["PREPARED", "COMMITTED", "RECOVERED"]).has(eventType)) {
    throw new Error("D1 append event type is invalid");
  }
  if (recordBytes.length > MAX_LEDGER_PAYLOAD_BYTES) throw new Error("D1 append record exceeds the one MiB payload cap");
  const record = parseJsonBytes(recordBytes, "D1 append record");
  const expectedRecordType = { PREPARED: "capsule", COMMITTED: "commit", RECOVERED: "recovery" }[eventType];
  const transaction = TRANSACTION.exec(record.transaction_id ?? "");
  if (
    record.schema_version !== 1 || record.record_type !== expectedRecordType || !transaction ||
    record.workflow_run_id !== Number(transaction[1]) || !SHA.test(record.candidate_sha ?? "")
  ) throw new Error("D1 append record identity is invalid");
  const payloadSha256 = digest(recordBytes);
  const preparedSha256 = eventType === "PREPARED" ? payloadSha256 : record.prepared_record_sha256;
  const eventSequence = eventType === "PREPARED" ? 0 : 1;
  const eventId = `${record.transaction_id}:${eventType}`;
  if (!Number.isSafeInteger(appendTransportStatus) || appendTransportStatus < 0) {
    throw new Error("D1 append transport status is invalid");
  }
  if (typeof appendHttpStatus !== "string" || !/^[0-9]{3}$/.test(appendHttpStatus)) {
    throw new Error("D1 append HTTP status is invalid");
  }
  const appendHttpSuccessful = /^2[0-9]{2}$/.test(appendHttpStatus);
  const appendValid = appendTransportStatus === 0 && appendHttpSuccessful && successfulProviderResponse(appendResponse);
  const appendProviderErrorObserved = appendResponse && typeof appendResponse === "object" &&
    appendResponse.success === false && Array.isArray(appendResponse.errors) && appendResponse.errors.length > 0;
  const readbackValid = successfulProviderResponse(readbackResponse);
  let classification = "ambiguous";
  let verdict = "STAGING_DURABLE_LEDGER_APPEND_AMBIGUOUS_MANUAL_RECONCILIATION_REQUIRED";
  let providerReadbackVerified = false;
  let eventPresent = null;

  if (readbackValid) {
    const rows = readbackResponse.result[0].results;
    if (rows.length === 1) {
      const row = rows[0];
      const exact = row?.event_id === eventId && row?.transaction_id === record.transaction_id &&
        row?.event_type === eventType && row?.event_sequence === eventSequence &&
        row?.workflow_run_id === record.workflow_run_id && row?.candidate_sha === record.candidate_sha &&
        row?.prepared_sha256 === preparedSha256 && row?.payload_sha256 === payloadSha256 &&
        row?.payload_json === recordBytes.toString("utf8") &&
        typeof row?.created_at === "string" && !Number.isNaN(Date.parse(row.created_at));
      if (exact) {
        classification = "verified";
        verdict = "STAGING_DURABLE_LEDGER_APPEND_READBACK_VERIFIED";
        providerReadbackVerified = true;
        eventPresent = true;
      } else {
        classification = "conflict";
        verdict = "STAGING_DURABLE_LEDGER_APPEND_CONFLICT_MANUAL_RECONCILIATION_REQUIRED";
        providerReadbackVerified = true;
        eventPresent = true;
      }
    } else if (rows.length === 0) {
      providerReadbackVerified = true;
      eventPresent = false;
      const changes = appendValid ? appendResponse.result[0]?.meta?.changes : undefined;
      if (changes === 0) {
        classification = "confirmed_absent";
        verdict = "STAGING_DURABLE_LEDGER_APPEND_CONFIRMED_ABSENT";
      }
    } else {
      classification = "conflict";
      verdict = "STAGING_DURABLE_LEDGER_APPEND_CONFLICT_MANUAL_RECONCILIATION_REQUIRED";
      providerReadbackVerified = true;
      eventPresent = true;
    }
  }
  return {
    schema_version: 1,
    verdict,
    classification,
    event_id: eventId,
    event_type: eventType,
    transaction_id: record.transaction_id,
    prepared_sha256: preparedSha256,
    payload_sha256: payloadSha256,
    append_http_status: appendHttpStatus,
    append_response_verified: appendValid,
    append_provider_error_observed: Boolean(appendProviderErrorObserved),
    provider_readback_verified: providerReadbackVerified,
    event_present: eventPresent,
    production_release_authorized: false,
  };
}

export function materializeCapsuleRecord(record, outputDir) {
  validateCapsuleLedgerRecord(record);
  const directory = assertSafeDirectory(outputDir);
  for (const [key, filename] of Object.entries({
    recovery_capsule: "recovery-capsule.json",
    transaction_journal: "transaction-journal.json",
    capsule_seal: "capsule-seal.json",
    api_wrangler_release_toml: "api.wrangler.release.toml",
    surface_web_wrangler_jsonc: "surfaces/web.wrangler.jsonc",
    surface_app_wrangler_jsonc: "surfaces/app.wrangler.jsonc",
    surface_auth_wrangler_jsonc: "surfaces/auth.wrangler.jsonc",
    surface_brand_wrangler_jsonc: "surfaces/brand.wrangler.jsonc",
  })) safeWrite(join(directory, filename), decodeFile(record.files[key], key));
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    if (!argv[index]?.startsWith("--") || argv[index + 1] === undefined) throw new Error("Arguments must use --name value pairs");
    result[argv[index].slice(2)] = argv[index + 1];
  }
  return result;
}

function writeJson(path, value) {
  safeWrite(path, Buffer.from(`${JSON.stringify(value, null, 2)}\n`));
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (command === "create-capsule") {
    writeJson(args.output, createCapsuleLedgerRecord({ capsulePath: args.capsule, journalPath: args.journal, sealPath: args.seal, apiConfigPath: args["api-config"], surfaceDirectory: args["surface-directory"] }));
  } else if (command === "create-commit") {
    writeJson(args.output, createTerminalLedgerRecord({
      type: "commit",
      capsuleRecordBytes: readFileSync(args["capsule-record"]),
      files: {
        transaction_commit: args.receipt,
        transaction_executor_receipt: args.executor,
        staging_acceptance: args.acceptance,
        provider_evidence_manifest: args["provider-manifest"],
      },
    }));
  } else if (command === "create-recovery") {
    writeJson(args.output, createTerminalLedgerRecord({ type: "recovery", capsuleRecordBytes: readFileSync(args["capsule-record"]), files: { transaction_executor_receipt: args.executor, staging_recovery_receipt: args.recovery, recovery_plan: args.plan, transaction_journal: args.journal } }));
  } else if (command === "scan-events") {
    const summaries = scanLedgerEvents(JSON.parse(readFileSync(args.input, "utf8")));
    const recordsRoot = assertSafeDirectory(args["records-dir"]);
    for (const summary of summaries) {
      const path = join(recordsRoot, summary.transaction_id, "capsule.json");
      safeWrite(path, Buffer.from(summary.prepared_payload_json));
      delete summary.prepared_payload_json;
    }
    writeJson(args.output, summaries);
  } else if (command === "materialize") {
    materializeCapsuleRecord(JSON.parse(readFileSync(args.record, "utf8")), args["output-dir"]);
  } else if (command === "classify-append") {
    const recordBytes = readFileSync(args.record);
    const append = readProviderResponse(args["append-response"]);
    const readback = readProviderResponse(args["readback-response"]);
    const receipt = {
      ...classifyAppendOutcome({
        eventType: args.event,
        recordBytes,
      appendResponse: append.value,
      appendTransportStatus: Number(args["append-transport-status"]),
      appendHttpStatus: args["append-http-status"],
      readbackResponse: readback.value,
      }),
      database_id: args["database-id"],
      append_response_sha256: append.bytes.length > 0 ? digest(append.bytes) : null,
      readback_response_sha256: readback.bytes.length > 0 ? digest(readback.bytes) : null,
      observed_at: new Date().toISOString(),
    };
    writeJson(args.output, receipt);
    if (receipt.classification === "confirmed_absent") process.exitCode = 3;
    else if (receipt.classification === "conflict") process.exitCode = 4;
    else if (receipt.classification === "ambiguous") process.exitCode = 5;
  } else throw new Error("Unknown staging ledger command");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
