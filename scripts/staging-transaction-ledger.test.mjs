import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  classifyAppendOutcome,
  createCapsuleLedgerRecord,
  createTerminalLedgerRecord,
  materializeCapsuleRecord,
  scanLedgerEvents,
  validateCapsuleLedgerRecord,
  validateTerminalLedgerRecord,
} from "./staging-transaction-ledger.mjs";

const candidateSha = "a".repeat(40);
const controlPlaneSha = "b".repeat(40);
const names = ["api", "web", "app", "auth", "brand"];

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function uuid(index, prefix = "5") {
  return `${prefix}${String(index).padStart(7, "0")}-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function providerResponse(results, changes = 0) {
  return { success: true, errors: [], result: [{ success: true, results, meta: { changes } }] };
}

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "omdala-ledger-test-"));
  const capsuleDirectory = join(directory, "capsule");
  const surfaceDirectory = join(directory, "surfaces");
  mkdirSync(capsuleDirectory);
  mkdirSync(surfaceDirectory);
  const configs = Object.fromEntries(names.map((name) => [name, Buffer.from(`name = "${name}"\n`)]));
  for (const name of names.slice(1)) writeFileSync(join(surfaceDirectory, `${name}.wrangler.jsonc`), configs[name]);
  const capsule = {
    schema_version: 1,
    verdict: "STAGING_RECOVERY_CAPSULE_SEALED",
    transaction_id: "staging-41-1",
    release_id: "gh-41-1-aaaaaaaaaaaa",
    candidate_sha: candidateSha,
    control_plane_sha: controlPlaneSha,
    workflow_run_id: 41,
    workflow_run_attempt: 1,
    cloudflare_account_id: "c".repeat(32),
    repository: "tranhatam-collab/omdala.com",
    target_order: [...names],
    reverse_recovery_order: [...names].reverse(),
    database_recovery_policy: "additive_migrations_backup_and_manual_restore_only",
    runner_loss_recovery_authority: "MANUAL_REDISPATCH_REQUIRED",
    targets: names.map((name, index) => ({
      kind: name === "api" ? "api" : "surface",
      name,
      workerName: name === "api" ? "omdala-api-staging" : `omdala-surface-${name}-staging`,
      configPath: name === "api"
        ? "services/api/wrangler.release.toml"
        : `infra/staging/surfaces/${name}.wrangler.jsonc`,
      configSha256: digest(configs[name]),
      deploymentSnapshotSha256: "d".repeat(64),
      baselineVersionId: uuid(index + 1),
      useStagingEnvironment: name === "api",
    })),
  };
  const capsulePath = join(capsuleDirectory, "recovery-capsule.json");
  writeFileSync(capsulePath, jsonBytes(capsule));
  const capsuleSha = digest(readFileSync(capsulePath));
  const journal = {
    schema_version: 1,
    transaction_id: capsule.transaction_id,
    candidate_sha: candidateSha,
    control_plane_sha: controlPlaneSha,
    recovery_capsule_sha256: capsuleSha,
    status: "CAPSULE_SEALED_NO_MUTATION",
    migration: { state: "pending", database_schema_reverted: false },
    targets: capsule.targets.map((target) => ({
      name: target.name,
      state: "pending",
      baseline_version_id: target.baselineVersionId,
      deployed_version_id: null,
    })),
  };
  const seal = {
    schema_version: 1,
    transaction_id: capsule.transaction_id,
    capsule_sha256: capsuleSha,
    verdict: "STAGING_RECOVERY_CAPSULE_SEALED",
    contains_secret_values: false,
  };
  const journalPath = join(capsuleDirectory, "transaction-journal.json");
  const sealPath = join(capsuleDirectory, "capsule-seal.json");
  const apiPath = join(capsuleDirectory, "api.wrangler.release.toml");
  writeFileSync(journalPath, jsonBytes(journal));
  writeFileSync(sealPath, jsonBytes(seal));
  writeFileSync(apiPath, configs.api);
  const capsuleRecord = createCapsuleLedgerRecord({ capsulePath, journalPath, sealPath, apiConfigPath: apiPath, surfaceDirectory });
  const capsuleRecordBytes = jsonBytes(capsuleRecord);
  const phase = () => ({
    deployments_sha256: "1".repeat(64), version_sha256: "2".repeat(64),
    secret_inventory_sha256: "3".repeat(64), secret_authority_sha256: "4".repeat(64),
    binding_authority_sha256: "5".repeat(64), absence_authority_sha256: null,
  });
  const provider = {
    schema_version: 1,
    verdict: "STAGING_PROVIDER_EVIDENCE_EXACT",
    transaction_id: capsule.transaction_id,
    release_id: capsule.release_id,
    candidate_sha: candidateSha,
    targets: names.map((name) => ({ name, pre: phase(), post: phase() })),
  };
  const providerPath = join(directory, "provider-evidence-manifest.json");
  writeFileSync(providerPath, jsonBytes(provider));
  const acceptance = {
    schema_version: 4,
    verdict: "STAGING_ACCEPTANCE_PREPARED_UNIFIED_TRANSACTION",
    staging_transaction_id: capsule.transaction_id,
    candidate_sha: candidateSha,
    control_plane_sha: controlPlaneSha,
    workflow_run_id: 41,
    workflow_run_attempt: 1,
    workflow_path: ".github/workflows/staging-transaction.yml",
    provider_evidence_manifest_sha256: digest(readFileSync(providerPath)),
    provider_evidence: provider,
    immutable_artifact_published: false,
    production_release_authorized: false,
    production_release_status: "HOLD_NO_GO",
  };
  const acceptancePath = join(directory, "staging-acceptance.json");
  writeFileSync(acceptancePath, jsonBytes(acceptance));
  const commitExecutor = {
    schema_version: 2,
    verdict: "STAGING_TRANSACTION_PREPARED_FOR_COMMIT",
    mode: "deploy",
    transaction_id: capsule.transaction_id,
    release_id: capsule.release_id,
    candidate_sha: candidateSha,
    control_plane_sha: controlPlaneSha,
    recovery_capsule_sha256: capsuleSha,
    acceptance_receipt_sha256: digest(readFileSync(acceptancePath)),
    provider_evidence_manifest_sha256: digest(readFileSync(providerPath)),
    original_exit_status: 0,
    recovery_exit_status: 0,
    contains_secret_values: false,
  };
  const commitExecutorPath = join(directory, "commit-executor.json");
  writeFileSync(commitExecutorPath, jsonBytes(commitExecutor));
  const commit = {
    schema_version: 1,
    verdict: "STAGING_TRANSACTION_COMMIT_INTENT",
    transaction_id: capsule.transaction_id,
    candidate_sha: candidateSha,
    control_plane_sha: controlPlaneSha,
    release_id: capsule.release_id,
    recovery_capsule_sha256: capsuleSha,
    executor_receipt_sha256: digest(readFileSync(commitExecutorPath)),
    acceptance_receipt_sha256: digest(readFileSync(acceptancePath)),
    provider_evidence_manifest_sha256: digest(readFileSync(providerPath)),
    durable_ledger_is_authority: true,
    artifacts_are_supplemental: true,
    production_release_authorized: false,
  };
  const commitPath = join(directory, "transaction-commit.json");
  writeFileSync(commitPath, jsonBytes(commit));
  const commitRecord = createTerminalLedgerRecord({
    type: "commit",
    capsuleRecordBytes,
    files: {
      transaction_commit: commitPath,
      transaction_executor_receipt: commitExecutorPath,
      staging_acceptance: acceptancePath,
      provider_evidence_manifest: providerPath,
    },
  });

  const recoveryExecution = {
    repository: "tranhatam-collab/omdala.com",
    workflow_path: ".github/workflows/staging-transaction.yml",
    workflow_ref: "tranhatam-collab/omdala.com/.github/workflows/staging-transaction.yml@refs/heads/main",
    run_id: 84,
    run_attempt: 1,
    control_plane_sha: "c".repeat(40),
  };

  const plan = {
    schema_version: 2,
    verdict: "STAGING_RECOVERY_PLAN_ACCEPTED",
    transaction_id: capsule.transaction_id,
    candidate_sha: candidateSha,
    control_plane_sha: controlPlaneSha,
    recovery_execution: recoveryExecution,
    targets: [...names].reverse().map((name) => {
      const baselineVersionId = capsule.targets.find((target) => target.name === name).baselineVersionId;
      return {
      name,
      workerName: name === "api" ? "omdala-api-staging" : `omdala-surface-${name}-staging`,
      configPath: name === "api"
        ? "services/api/wrangler.release.toml"
        : `infra/staging/surfaces/${name}.wrangler.jsonc`,
      journalState: "pending",
      disposition: "pending_unchanged",
      discoveredVersionId: baselineVersionId,
      deployedVersionId: null,
      baselineVersionId,
      useStagingEnvironment: name === "api",
      };
    }),
    mutation_targets: [],
  };
  const recoveredJournal = {
    ...journal,
    status: "STAGING_RECOVERY_ONLY_VERIFIED",
    updated_at: "2026-10-08T00:00:00Z",
  };
  const planPath = join(directory, "recovery-plan.json");
  const recoveredJournalPath = join(directory, "recovered-journal.json");
  writeFileSync(planPath, jsonBytes(plan));
  writeFileSync(recoveredJournalPath, jsonBytes(recoveredJournal));
  const recovery = {
    schema_version: 2,
    verdict: "STAGING_COMPENSATING_RECOVERY_VERIFIED",
    transaction_id: capsule.transaction_id,
    candidate_sha: candidateSha,
    control_plane_sha: controlPlaneSha,
    recovery_execution: recoveryExecution,
    recovery_plan_sha256: digest(readFileSync(planPath)),
    provider_readback_verified: true,
    database_schema_reverted: false,
    completed_at: "2026-10-08T00:00:00Z",
    mutation_targets: [],
    targets: [...names].reverse().map((name) => {
      const baselineVersionId = capsule.targets.find((target) => target.name === name).baselineVersionId;
      return {
      name,
      worker_name: name === "api" ? "omdala-api-staging" : `omdala-surface-${name}-staging`,
      deployed_version_id: null,
      baseline_version_id: baselineVersionId,
      disposition: "pending_unchanged",
      action: "pending_unchanged",
      provider_version_before: baselineVersionId,
      provider_version_after: baselineVersionId,
      provider_readback_verified: true,
      };
    }),
  };
  const recoveryPath = join(directory, "staging-recovery-receipt.json");
  writeFileSync(recoveryPath, jsonBytes(recovery));
  const executor = {
    schema_version: 2,
    verdict: "STAGING_RECOVERY_ONLY_VERIFIED",
    mode: "recovery-only",
    transaction_id: capsule.transaction_id,
    release_id: capsule.release_id,
    candidate_sha: candidateSha,
    control_plane_sha: controlPlaneSha,
    recovery_execution: recoveryExecution,
    recovery_capsule_sha256: capsuleSha,
    recovery_receipt_sha256: digest(readFileSync(recoveryPath)),
    transaction_journal_sha256: digest(readFileSync(recoveredJournalPath)),
    acceptance_receipt_sha256: null,
    provider_evidence_manifest_sha256: null,
    original_exit_status: 0,
    recovery_exit_status: 0,
    signal: null,
    database_schema_reverted: false,
    contains_secret_values: false,
    completed_at: "2026-10-08T00:00:00Z",
  };
  const executorPath = join(directory, "transaction-executor-receipt.json");
  writeFileSync(executorPath, jsonBytes(executor));
  const recoveryRecord = createTerminalLedgerRecord({
    type: "recovery",
    capsuleRecordBytes,
    files: {
      transaction_executor_receipt: executorPath,
      staging_recovery_receipt: recoveryPath,
      recovery_plan: planPath,
      transaction_journal: recoveredJournalPath,
    },
  });
  return { directory, capsuleRecord, capsuleRecordBytes, commitRecord, recoveryRecord };
}

function row(eventType, record, preparedSha = null) {
  const bytes = jsonBytes(record);
  return {
    ledger_rowid: eventType === "PREPARED" ? 1 : 2,
    event_id: `${record.transaction_id}:${eventType}`,
    transaction_id: record.transaction_id,
    event_type: eventType,
    event_sequence: eventType === "PREPARED" ? 0 : 1,
    workflow_run_id: record.workflow_run_id,
    candidate_sha: record.candidate_sha,
    prepared_sha256: preparedSha ?? digest(bytes),
    payload_sha256: digest(bytes),
    payload_json: bytes.toString("utf8"),
    created_at: "2026-10-08T00:00:00Z",
  };
}

function encodeJson(value) {
  const bytes = jsonBytes(value);
  return { sha256: digest(bytes), base64: bytes.toString("base64") };
}

function forgeInternallyConsistentCapsule(record, mutate) {
  const forged = structuredClone(record);
  const capsule = JSON.parse(Buffer.from(forged.files.recovery_capsule.base64, "base64"));
  mutate(capsule);
  forged.files.recovery_capsule = encodeJson(capsule);
  forged.capsule_sha256 = forged.files.recovery_capsule.sha256;
  forged.release_id = capsule.release_id;
  const journal = JSON.parse(Buffer.from(forged.files.transaction_journal.base64, "base64"));
  journal.recovery_capsule_sha256 = forged.capsule_sha256;
  forged.files.transaction_journal = encodeJson(journal);
  const seal = JSON.parse(Buffer.from(forged.files.capsule_seal.base64, "base64"));
  seal.capsule_sha256 = forged.capsule_sha256;
  forged.files.capsule_seal = encodeJson(seal);
  return forged;
}

function forgeInternallyConsistentRecovery(record, mutate) {
  const forged = structuredClone(record);
  const plan = JSON.parse(Buffer.from(forged.files.recovery_plan.base64, "base64"));
  const recovery = JSON.parse(Buffer.from(forged.files.staging_recovery_receipt.base64, "base64"));
  const executor = JSON.parse(Buffer.from(forged.files.transaction_executor_receipt.base64, "base64"));
  const journal = JSON.parse(Buffer.from(forged.files.transaction_journal.base64, "base64"));
  mutate(plan, recovery, executor, journal);
  forged.files.recovery_plan = encodeJson(plan);
  recovery.recovery_plan_sha256 = forged.files.recovery_plan.sha256;
  forged.files.staging_recovery_receipt = encodeJson(recovery);
  forged.files.transaction_journal = encodeJson(journal);
  executor.recovery_receipt_sha256 = forged.files.staging_recovery_receipt.sha256;
  executor.transaction_journal_sha256 = forged.files.transaction_journal.sha256;
  forged.files.transaction_executor_receipt = encodeJson(executor);
  return forged;
}

describe("durable staging transaction ledger records", () => {
  it("validates exact PREPARED bytes and one exact terminal", () => {
    const f = fixture();
    try {
      validateCapsuleLedgerRecord(f.capsuleRecord);
      validateTerminalLedgerRecord(f.commitRecord, f.capsuleRecord, digest(f.capsuleRecordBytes));
      const summaries = scanLedgerEvents([
        row("PREPARED", f.capsuleRecord),
        row("COMMITTED", f.commitRecord, digest(f.capsuleRecordBytes)),
      ]);
      assert.equal(summaries[0].terminal_record_type, "commit");
    } finally { rmSync(f.directory, { recursive: true, force: true }); }
  });

  it("rejects byte tampering, row identity mismatch, duplicates, and dual terminal events", () => {
    const f = fixture();
    try {
      const tampered = structuredClone(f.capsuleRecord);
      tampered.files.recovery_capsule.base64 = `${tampered.files.recovery_capsule.base64.slice(0, -4)}AAAA`;
      assert.throws(() => validateCapsuleLedgerRecord(tampered), /digest/);
      const identity = row("PREPARED", f.capsuleRecord);
      identity.candidate_sha = "c".repeat(40);
      assert.throws(() => scanLedgerEvents([identity]), /identity/);
      const prepared = row("PREPARED", f.capsuleRecord);
      assert.throws(() => scanLedgerEvents([prepared, { ...prepared }]), /duplicate/);
      assert.throws(() => scanLedgerEvents([
        prepared,
        row("COMMITTED", f.commitRecord, digest(f.capsuleRecordBytes)),
        row("RECOVERED", f.recoveryRecord, digest(f.capsuleRecordBytes)),
      ]), /dual terminal/);
    } finally { rmSync(f.directory, { recursive: true, force: true }); }
  });

  it("rejects internally hash-valid PREPARED records that forge staging target authority or release identity", () => {
    const f = fixture();
    try {
      for (const mutate of [
        (capsule) => { capsule.targets[0].workerName = "omdala-api"; },
        (capsule) => { capsule.targets[0].configPath = "services/api/wrangler.toml"; },
        (capsule) => { capsule.targets[0].useStagingEnvironment = false; },
        (capsule) => { capsule.release_id = "gh-999-1-aaaaaaaaaaaa"; },
      ]) {
        const forged = forgeInternallyConsistentCapsule(f.capsuleRecord, mutate);
        assert.throws(() => validateCapsuleLedgerRecord(forged), /identity|binding/);
      }
    } finally { rmSync(f.directory, { recursive: true, force: true }); }
  });

  it("rejects an unexpected embedded path and symlink materialization", () => {
    const f = fixture();
    try {
      const unexpected = structuredClone(f.capsuleRecord);
      unexpected.files["../../escape"] = unexpected.files.capsule_seal;
      assert.throws(() => validateCapsuleLedgerRecord(unexpected), /unexpected path/);
      const real = join(f.directory, "real-output");
      mkdirSync(real);
      const linked = join(f.directory, "linked-output");
      symlinkSync(real, linked);
      assert.throws(() => materializeCapsuleRecord(f.capsuleRecord, linked), /real directory|canonical/);
      const output = join(realpathSync(f.directory), "output");
      mkdirSync(output);
      symlinkSync(join(f.directory, "escape"), join(output, "recovery-capsule.json"));
      assert.throws(() => materializeCapsuleRecord(f.capsuleRecord, output), /symlink/);
    } finally { rmSync(f.directory, { recursive: true, force: true }); }
  });

  it("rejects recovery unless every provider target has exact readback", () => {
    const f = fixture();
    try {
      const bad = structuredClone(f.recoveryRecord);
      const recovery = JSON.parse(Buffer.from(bad.files.staging_recovery_receipt.base64, "base64"));
      recovery.provider_readback_verified = false;
      const bytes = jsonBytes(recovery);
      bad.files.staging_recovery_receipt = { sha256: digest(bytes), base64: bytes.toString("base64") };
      assert.throws(() => validateTerminalLedgerRecord(bad, f.capsuleRecord, digest(f.capsuleRecordBytes)), /RECOVERED/);
    } finally { rmSync(f.directory, { recursive: true, force: true }); }
  });

  it("binds RECOVERED to the exact current-main recovery executor run", () => {
    const f = fixture();
    try {
      assert.equal(f.recoveryRecord.recovery_execution.run_id, 84);
      assert.equal(f.recoveryRecord.recovery_execution.control_plane_sha, "c".repeat(40));
      for (const mutate of [
        (record) => { record.recovery_execution.run_attempt = 2; },
        (record) => { record.recovery_execution.workflow_ref = "attacker/repo/.github/workflows/staging-transaction.yml@refs/heads/main"; },
        (record) => { record.recovery_execution.control_plane_sha = controlPlaneSha; },
      ]) {
        const forged = structuredClone(f.recoveryRecord);
        mutate(forged);
        assert.throws(
          () => validateTerminalLedgerRecord(forged, f.capsuleRecord, digest(f.capsuleRecordBytes)),
          /RECOVERED/,
        );
      }
    } finally { rmSync(f.directory, { recursive: true, force: true }); }
  });

  it("rejects an internally consistent RECOVERED record whose plan changes PREPARED target authority", () => {
    const f = fixture();
    try {
      for (const mutate of [
        (plan, recovery) => {
          plan.targets[0].workerName = "omdala-production-worker";
          recovery.targets[0].worker_name = "omdala-production-worker";
        },
        (plan) => { plan.targets[0].configPath = "infra/production/wrangler.jsonc"; },
        (plan) => { plan.targets[4].useStagingEnvironment = false; },
        (plan) => { plan.targets[0].baselineVersionId = "attacker-baseline"; },
      ]) {
        const forged = forgeInternallyConsistentRecovery(f.recoveryRecord, mutate);
        assert.throws(
          () => validateTerminalLedgerRecord(forged, f.capsuleRecord, digest(f.capsuleRecordBytes)),
          /RECOVERED/,
        );
      }
    } finally { rmSync(f.directory, { recursive: true, force: true }); }
  });

  it("rejects self-consistent RECOVERED forgeries with false journal, disposition, or executor semantics", () => {
    const f = fixture();
    try {
      for (const mutate of [
        (plan, recovery, executor, journal) => {
          journal.targets[0].state = "deployed";
          plan.targets.find((target) => target.name === "api").journalState = "deployed";
        },
        (plan, recovery, executor) => { executor.mode = "deploy"; },
        (plan, recovery) => {
          plan.targets[0].disposition = "already_at_baseline";
          recovery.targets[0].disposition = "already_at_baseline";
          recovery.targets[0].action = "already_at_baseline";
        },
        (plan, recovery, executor, journal) => {
          journal.status = "STAGING_TRANSACTION_FAILED_RECOVERY_VERIFIED";
          executor.verdict = "STAGING_TRANSACTION_FAILED_RECOVERY_VERIFIED";
          executor.mode = "deploy";
          executor.original_exit_status = 0;
        },
        (plan, recovery, executor) => { executor.signal = "TERM"; },
        (plan, recovery, executor, journal) => {
          journal.status = "STAGING_TRANSACTION_FAILED_RECOVERY_VERIFIED";
          executor.verdict = "STAGING_TRANSACTION_FAILED_RECOVERY_VERIFIED";
          executor.mode = "deploy";
          executor.original_exit_status = 17;
          executor.signal = "INT";
        },
      ]) {
        const forged = forgeInternallyConsistentRecovery(f.recoveryRecord, mutate);
        assert.throws(
          () => validateTerminalLedgerRecord(forged, f.capsuleRecord, digest(f.capsuleRecordBytes)),
          /RECOVERED/,
        );
      }
    } finally { rmSync(f.directory, { recursive: true, force: true }); }
  });

  it("rejects records and scanned rows above the one MiB D1 payload cap", () => {
    const f = fixture();
    try {
      const oversized = structuredClone(f.capsuleRecord);
      const bytes = Buffer.alloc(800 * 1024, 0x61);
      oversized.files.surface_web_wrangler_jsonc = { sha256: digest(bytes), base64: bytes.toString("base64") };
      assert.throws(() => validateCapsuleLedgerRecord(oversized), /one MiB/);
      const oversizedPayload = `${" ".repeat(1024 * 1024)}{}`;
      const oversizedRow = row("PREPARED", f.capsuleRecord);
      oversizedRow.payload_json = oversizedPayload;
      oversizedRow.payload_sha256 = digest(Buffer.from(oversizedPayload));
      oversizedRow.prepared_sha256 = oversizedRow.payload_sha256;
      assert.throws(() => scanLedgerEvents([oversizedRow]), /invalid/);
    } finally { rmSync(f.directory, { recursive: true, force: true }); }
  });

  it("recovers a lost append response only through exact readback and never guesses absence", () => {
    const f = fixture();
    try {
      const recordBytes = jsonBytes(f.commitRecord);
      const exactRow = row("COMMITTED", f.commitRecord, digest(f.capsuleRecordBytes));
      const preparedRow = row("PREPARED", f.capsuleRecord);
      assert.equal(classifyAppendOutcome({ eventType: "PREPARED", recordBytes: f.capsuleRecordBytes, appendResponse: null, readbackResponse: providerResponse([preparedRow]) }).classification, "verified");
      assert.equal(classifyAppendOutcome({ eventType: "COMMITTED", recordBytes, appendResponse: null, readbackResponse: providerResponse([exactRow]) }).classification, "verified");
      assert.equal(classifyAppendOutcome({ eventType: "COMMITTED", recordBytes, appendResponse: null, readbackResponse: providerResponse([]) }).classification, "ambiguous");
      assert.equal(classifyAppendOutcome({ eventType: "COMMITTED", recordBytes, appendResponse: providerResponse([], 0), readbackResponse: providerResponse([]) }).classification, "confirmed_absent");
      assert.equal(classifyAppendOutcome({ eventType: "COMMITTED", recordBytes, appendResponse: { success: false, errors: [{ code: 7500, message: "statement rejected" }], result: [] }, readbackResponse: providerResponse([]) }).classification, "ambiguous");
      assert.equal(classifyAppendOutcome({ eventType: "COMMITTED", recordBytes, appendResponse: providerResponse([], 1), readbackResponse: providerResponse([]) }).classification, "ambiguous");
      assert.equal(classifyAppendOutcome({ eventType: "COMMITTED", recordBytes, appendResponse: { success: false, errors: [{ code: 7500, message: "late rejection" }], result: [] }, appendTransportStatus: 28, appendHttpStatus: "000", readbackResponse: providerResponse([]) }).classification, "ambiguous");
      assert.equal(classifyAppendOutcome({ eventType: "COMMITTED", recordBytes, appendResponse: { success: false, errors: [{ code: 1000, message: "backend error after apply" }], result: [] }, appendHttpStatus: "500", readbackResponse: providerResponse([]) }).classification, "ambiguous");
    } finally { rmSync(f.directory, { recursive: true, force: true }); }
  });

  it("attempts a mutating D1 append once when the committed response is dropped", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "omdala-ledger-transport-test-")));
    try {
      const bin = join(directory, "bin");
      mkdirSync(bin);
      const state = join(directory, "curl-state");
      const mode = join(directory, "curl-mode");
      const fakeCurl = join(bin, "curl");
      writeFileSync(fakeCurl, `#!/usr/bin/env bash
set -euo pipefail
state_file=${JSON.stringify(state)}
mode_file=${JSON.stringify(mode)}
request=""
output=""
expect_output=false
for argument in "$@"; do
  if [[ "$expect_output" == "true" ]]; then
    output="$argument"
    expect_output=false
    continue
  fi
  [[ "$argument" != "--output" ]] || { expect_output=true; continue; }
  case "$argument" in @*) request="\${argument#@}" ;; esac
done
test -n "$request"
sql="$(jq -er '.sql' "$request")"
if [[ "$sql" == "INSERT INTO staging_transaction_events"* ]]; then
  count=0
  [[ ! -f "$state_file" ]] || count="$(cat "$state_file")"
  count=$((count + 1))
  printf '%s\\n' "$count" > "$state_file"
  mutation_mode="$(cat "$mode_file")"
  if [[ "$count" == "1" && "$mutation_mode" == "drop" ]]; then
    : > "$output"
    printf 'COMMITTED_APPLIED_RESPONSE_DROPPED\\n' > "$state_file.applied"
    printf '000'
    exit 28
  fi
  if [[ "$count" == "1" && "$mutation_mode" == "http500" ]]; then
    printf '%s\\n' '{"success":false,"errors":[{"code":1000,"message":"backend error after apply"}],"result":[]}' > "$output"
    printf 'COMMITTED_APPLIED_HTTP_500\\n' > "$state_file.applied"
    printf '500'
    exit 0
  fi
  printf '%s\\n' '{"success":false,"errors":[{"code":7500,"message":"duplicate terminal"}],"result":[]}' > "$output"
  printf '409'
  exit 0
fi
printf '%s\\n' '{"success":true,"errors":[],"result":[{"success":true,"results":[],"meta":{"changes":0}}]}'
`);
      chmodSync(fakeCurl, 0o755);
      const ledgerConfig = JSON.parse(readFileSync("infra/staging/ledger-d1.json", "utf8"));
      const credentials = join(directory, "credentials.json");
      writeFileSync(credentials, `${JSON.stringify({
        CLOUDFLARE_D1_TOKEN: "t".repeat(40),
        CLOUDFLARE_ACCOUNT_ID: "1".repeat(32),
        D1_DATABASE_ID: ledgerConfig.database_id,
      })}\n`);
      const schemaReceipt = join(directory, "schema-receipt.json");
      writeFileSync(schemaReceipt, `${JSON.stringify({
        schema_version: 1,
        verdict: "STAGING_DURABLE_LEDGER_SCHEMA_EXACT",
        database_id: ledgerConfig.database_id,
        schema_manifest_sha256: ledgerConfig.schema_manifest_sha256,
        activation_epoch: ledgerConfig.activation_epoch,
        append_only_schema_verified: true,
        production_release_authorized: false,
      })}\n`);
      const record = join(directory, "commit-record.json");
      writeFileSync(record, `${JSON.stringify({
        schema_version: 1,
        record_type: "commit",
        transaction_id: "staging-41-1",
        workflow_run_id: 41,
        candidate_sha: candidateSha,
        prepared_record_sha256: "c".repeat(64),
      }, null, 2)}\n`);
      const runAppend = (mutationMode, receiptName) => {
        writeFileSync(mode, `${mutationMode}\n`);
        rmSync(state, { force: true });
        rmSync(`${state}.applied`, { force: true });
        const receipt = join(directory, receiptName);
        const result = spawnSync("bash", ["scripts/staging-durable-ledger.sh", "append", "COMMITTED", record, receipt], {
          cwd: process.cwd(),
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: `${bin}:${process.env.PATH}`,
            CONTROL_PLANE_ROOT: process.cwd(),
            STAGING_LEDGER_CREDENTIAL_FILE: credentials,
            STAGING_LEDGER_SCHEMA_RECEIPT: schemaReceipt,
          },
        });
        assert.equal(result.status, 5, result.stderr);
        assert.equal(readFileSync(state, "utf8"), "1\n");
        return JSON.parse(readFileSync(receipt, "utf8"));
      };
      const dropped = runAppend("drop", "append-dropped-receipt.json");
      assert.equal(readFileSync(state, "utf8"), "1\n");
      assert.equal(readFileSync(`${state}.applied`, "utf8"), "COMMITTED_APPLIED_RESPONSE_DROPPED\n");
      assert.equal(dropped.classification, "ambiguous");
      assert.equal(dropped.append_transport_status, 28);
      assert.equal(dropped.append_http_status, "000");
      assert.equal(dropped.event_present, false);
      const backendError = runAppend("http500", "append-http500-receipt.json");
      assert.equal(readFileSync(`${state}.applied`, "utf8"), "COMMITTED_APPLIED_HTTP_500\n");
      assert.equal(backendError.classification, "ambiguous");
      assert.equal(backendError.append_transport_status, 0);
      assert.equal(backendError.append_http_status, "500");
      assert.equal(backendError.append_provider_error_observed, true);
      assert.equal(backendError.event_present, false);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});
