import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const CAPSULE = /^omdala-staging-recovery-capsule-([a-f0-9]{40})-(staging-([1-9][0-9]*)-1)$/;
const TRUSTED_WORKFLOW_PATH = ".github/workflows/staging-transaction.yml";
const TRUSTED_WORKFLOW_NAME = "OMDALA Staging Transaction";
const SHA = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const TRANSACTION = /^staging-[1-9][0-9]*-1$/;

function trustedRun(run) {
  return (
    run?.path === TRUSTED_WORKFLOW_PATH &&
    run?.name === TRUSTED_WORKFLOW_NAME &&
    run?.event === "workflow_dispatch" &&
    run?.head_branch === "main" &&
    SHA.test(run?.head_sha ?? "")
  );
}

export function discoverUnresolvedCapsules({ runs, currentRunId, ledgerTransactions = [] }) {
  if (!Array.isArray(runs)) throw new Error("Workflow runs must be an array.");
  if (!Array.isArray(ledgerTransactions)) throw new Error("Ledger transactions must be an array.");
  const unresolved = [];
  const ledgerByTransaction = new Map();
  for (const entry of ledgerTransactions) {
    if (
      !TRANSACTION.test(entry?.transaction_id ?? "") ||
      !Number.isSafeInteger(entry?.workflow_run_id) ||
      entry.workflow_run_id <= 0 ||
      !SHA.test(entry?.candidate_sha ?? "") ||
      !SHA256.test(entry?.capsule_sha256 ?? "") ||
      typeof entry?.capsule_record_path !== "string" ||
      ![null, "commit", "recovery"].includes(entry?.terminal_record_type ?? null)
    ) throw new Error("Protected ledger transaction summary is invalid.");
    if (ledgerByTransaction.has(entry.transaction_id)) {
      throw new Error("Protected ledger contains a duplicate transaction.");
    }
    ledgerByTransaction.set(entry.transaction_id, entry);
  }
  const trustedRuns = runs.filter(trustedRun);
  for (const run of trustedRuns) {
    const runId = Number(run?.id);
    if (!Number.isSafeInteger(runId) || runId <= 0 || runId === currentRunId) continue;
    const artifacts = (run.artifacts ?? []).filter(
      (artifact) => typeof artifact?.name === "string",
    );
    for (const artifact of artifacts) {
      const name = artifact.name;
      const match = CAPSULE.exec(name);
      if (!match || Number(match[3]) !== runId) continue;
      const candidateSha = match[1];
      const transactionId = match[2];
      if (ledgerByTransaction.has(transactionId)) continue;
      if (artifact.expired === true) {
        unresolved.push({
          run_id: runId,
          candidate_sha: candidateSha,
          transaction_id: transactionId,
          capsule_artifact_name: name,
          recovery_capsule_sha256: null,
          expected_commit_artifact_name: `omdala-staging-transaction-commit-${candidateSha}-${transactionId}`,
          expected_recovery_artifact_name: `omdala-staging-recovery-resolved-${candidateSha}-${transactionId}`,
          run_status: run.status ?? null,
          run_conclusion: run.conclusion ?? null,
          workflow_path: run.path,
          workflow_head_sha: run.head_sha,
          capsule_expired: true,
          disposition: "EXPIRED_CAPSULE_MANUAL_PROVIDER_RECONCILIATION_REQUIRED",
        });
        continue;
      }
      if (
        artifact.capsule_verified !== true ||
        !SHA256.test(artifact.capsule_sha256 ?? "")
      ) continue;
      const capsuleSha256 = artifact.capsule_sha256;
      const commitName = `omdala-staging-transaction-commit-${candidateSha}-${transactionId}`;
      const recoveryName = `omdala-staging-recovery-resolved-${candidateSha}-${transactionId}`;
      unresolved.push({
        run_id: runId,
        candidate_sha: candidateSha,
        transaction_id: transactionId,
        capsule_artifact_name: name,
        recovery_capsule_sha256: capsuleSha256,
        expected_commit_artifact_name: commitName,
        expected_recovery_artifact_name: recoveryName,
        run_status: run.status ?? null,
        run_conclusion: run.conclusion ?? null,
        workflow_path: run.path,
        workflow_head_sha: run.head_sha,
        capsule_expired: false,
        durable_ledger_authority: false,
        disposition: "LEGACY_CAPSULE_HAS_NO_DURABLE_LEDGER_RECOVERY_SOURCE",
      });
    }
  }
  for (const entry of ledgerByTransaction.values()) {
    if (entry.workflow_run_id === currentRunId || entry.terminal_record_type) continue;
    unresolved.push({
      run_id: entry.workflow_run_id,
      candidate_sha: entry.candidate_sha,
      transaction_id: entry.transaction_id,
      capsule_artifact_name: null,
      capsule_ledger_record_path: entry.capsule_record_path,
      recovery_capsule_sha256: entry.capsule_sha256,
      expected_commit_artifact_name: `omdala-staging-transaction-commit-${entry.candidate_sha}-${entry.transaction_id}`,
      expected_recovery_artifact_name: `omdala-staging-recovery-resolved-${entry.candidate_sha}-${entry.transaction_id}`,
      run_status: null,
      run_conclusion: null,
      workflow_path: TRUSTED_WORKFLOW_PATH,
      workflow_head_sha: entry.control_plane_sha,
      capsule_expired: false,
      durable_ledger_authority: true,
      disposition: "MANUAL_REDISPATCH_REQUIRED",
    });
  }
  unresolved.sort((left, right) => left.run_id - right.run_id);
  const hasExpiredCapsule = unresolved.some((entry) => entry.capsule_expired === true);
  return {
    schema_version: 1,
    verdict: hasExpiredCapsule
      ? "EXPIRED_CAPSULE_MANUAL_PROVIDER_RECONCILIATION_REQUIRED"
      : unresolved.length
        ? "STAGING_UNRESOLVED_CAPSULES_BLOCK_DEPLOY"
        : "STAGING_NO_UNRESOLVED_CAPSULES",
    unresolved,
  };
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    if (!argv[index]?.startsWith("--") || argv[index + 1] === undefined) {
      throw new Error("Arguments must use --name value pairs.");
    }
    result[argv[index].slice(2)] = argv[index + 1];
  }
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = discoverUnresolvedCapsules({
    runs: JSON.parse(readFileSync(args.input, "utf8")),
    currentRunId: Number(args["current-run-id"]),
    ledgerTransactions: JSON.parse(readFileSync(args.ledger, "utf8")),
  });
  const mode = args.mode;
  if (!['deploy', 'recovery-only'].includes(mode)) {
    throw new Error("--mode must be deploy or recovery-only.");
  }
  const recoveryRunId = Number(args["recovery-run-id"] || 0);
  if (mode === "deploy" && result.unresolved.length) {
    result.allowed = false;
    result.reason = result.unresolved.some((entry) => entry.capsule_expired === true)
      ? "EXPIRED_CAPSULE_MANUAL_PROVIDER_RECONCILIATION_REQUIRED"
      : "MANUAL_REDISPATCH_REQUIRED";
  } else if (mode === "recovery-only") {
    const requested = result.unresolved.find((entry) => entry.run_id === recoveryRunId);
    const selected = requested?.capsule_expired === true || !requested?.capsule_ledger_record_path
      ? null
      : requested;
    result.allowed = Boolean(selected);
    result.selected = selected ?? null;
    result.reason = requested?.capsule_expired === true
      ? "EXPIRED_CAPSULE_MANUAL_PROVIDER_RECONCILIATION_REQUIRED"
      : requested && !requested.capsule_ledger_record_path
        ? "LEGACY_CAPSULE_HAS_NO_DURABLE_LEDGER_RECOVERY_SOURCE"
      : selected
        ? "RECOVERY_ONLY_SELECTED_UNRESOLVED_CAPSULE"
        : "RECOVERY_RUN_IS_NOT_UNRESOLVED";
  } else {
    result.allowed = true;
    result.reason = "DEPLOY_HAS_NO_UNRESOLVED_CAPSULES";
  }
  writeFileSync(args.output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.allowed) process.exitCode = 2;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
