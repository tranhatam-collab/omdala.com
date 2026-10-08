import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { evaluateStagingTransactionSources } from "./staging-transaction-contract.mjs";

function sources() {
  return {
    orchestrator: readFileSync(".github/workflows/staging-transaction.yml", "utf8"),
    api: readFileSync(".github/workflows/deploy.yml", "utf8"),
    surfaces: readFileSync(".github/workflows/deploy-surfaces.yml", "utf8"),
    acceptance: readFileSync(".github/workflows/staging-go-live-e2e.yml", "utf8"),
    legacyRecovery: readFileSync(".github/workflows/staging-recovery.yml", "utf8"),
    capsule: readFileSync("scripts/staging-recovery-capsule.mjs", "utf8"),
    executor: readFileSync("scripts/staging-unified-transaction.sh", "utf8"),
    hooks: readFileSync("scripts/staging-transaction-hooks.sh", "utf8"),
    recoveryScript: readFileSync("scripts/staging-transaction-recovery.sh", "utf8"),
    recoveryWorkspace: readFileSync("scripts/staging-restore-recovery-workspace.sh", "utf8"),
    unresolved: readFileSync("scripts/staging-unresolved-capsules.mjs", "utf8"),
    configSafety: readFileSync("scripts/verify-staging-wrangler-execution-safety.mjs", "utf8"),
    configPolicy: readFileSync("scripts/staging-api-wrangler-policy.mjs", "utf8"),
    configRenderer: readFileSync("scripts/render-api-wrangler-config.mjs", "utf8"),
    infraAuthority: readFileSync("scripts/verify-infra-authority-handoff.mjs", "utf8"),
    absenceVerifier: readFileSync("scripts/verify-cloudflare-worker-absence.mjs", "utf8"),
    durableLedger: readFileSync("scripts/staging-durable-ledger.sh", "utf8"),
    durableEvidence: readFileSync("scripts/staging-durable-ledger-evidence.mjs", "utf8"),
    ledgerRecords: readFileSync("scripts/staging-transaction-ledger.mjs", "utf8"),
    ledgerMigration: readFileSync("infra/d1/migrations-audit/0004_staging_transaction_ledger.sql", "utf8"),
    ledgerConfig: readFileSync("infra/staging/ledger-d1.json", "utf8"),
  };
}

function check(result, id) {
  return result.checks.find((entry) => entry.id === id)?.pass;
}

describe("unified staging transaction source contract", () => {
  it("accepts the fail-closed two-mode protected control plane", () => {
    const result = evaluateStagingTransactionSources(sources());
    assert.equal(result.verdict, "STAGING_TRANSACTION_SOURCE_ACCEPTED_FAIL_CLOSED");
    assert.equal(result.checks.every((entry) => entry.pass), true);
  });

  it("rejects a second staging environment approval", () => {
    const candidate = sources();
    candidate.orchestrator += "\n  recovery:\n    environment: staging\n";
    assert.equal(check(evaluateStagingTransactionSources(candidate), "ONE_PROTECTED_JOB_ONE_APPROVAL"), false);
  });

  it("rejects candidate-scoped concurrency", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replace(
      "group: omdala-staging-transaction",
      "group: omdala-staging-transaction-${{ inputs.candidate_sha }}",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "FIXED_CONCURRENCY_AND_ATTEMPT_ONE"), false);
  });

  it("rejects workflow inputs interpolated directly into a shell script", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replace(
      'test "$DISPATCH_CONFIRMATION" = "DEPLOY_OMDALA_STAGING_TRANSACTION"',
      'test "${{ inputs.confirmation }}" = "DEPLOY_OMDALA_STAGING_TRANSACTION"',
    );
    assert.equal(
      check(evaluateStagingTransactionSources(candidate), "DISPATCH_INPUTS_ARE_ENV_SCOPED_BEFORE_SHELL_VALIDATION"),
      false,
    );
  });

  it("rejects recovery-only if it can fall through into forward mutation", () => {
    const candidate = sources();
    candidate.executor = candidate.executor.replace(
      "run_recovery_only\n  exit $?",
      "run_recovery_only",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "DEPLOY_AND_RECOVERY_ONLY_SAME_PROTECTED_JOB"), false);
  });

  it("rejects recovery-only that fetches a potentially unreachable candidate SHA", () => {
    const fetchesExpiredCandidate = sources();
    fetchesExpiredCandidate.orchestrator = fetchesExpiredCandidate.orchestrator.replace(
      "Checkout exact candidate separately from trusted controls\n        if: inputs.mode == 'deploy'",
      "Checkout exact candidate separately from trusted controls\n        if: always()",
    );
    assert.equal(check(evaluateStagingTransactionSources(fetchesExpiredCandidate), "TRUSTED_MAIN_CONTROLS_EXACT_CANDIDATE"), false);
  });

  it("rejects capsule discovery that promotes supplemental artifacts to durable authority", () => {
    const candidate = sources();
    candidate.unresolved = candidate.unresolved.replace(
      "durable_ledger_authority: false",
      "durable_ledger_authority: true",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "UNRESOLVED_CAPSULE_DISCOVERY_IS_TRUSTED_AND_BLOCKING"), false);
  });

  it("rejects recovery that rerenders the API config instead of restoring it", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replace(
      'bash "$CONTROL_PLANE_ROOT/scripts/staging-restore-recovery-workspace.sh"',
      'node scripts/render-api-wrangler-config.mjs',
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "DURABLE_CAPSULE_PRESERVES_EXACT_RECOVERY_CONFIG"), false);
  });

  it("rejects transaction evidence stored inside the untrusted candidate checkout", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replaceAll(
      "${{ github.workspace }}/transaction-evidence",
      "${{ github.workspace }}/candidate/transaction-evidence",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "DURABLE_CAPSULE_PRESERVES_EXACT_RECOVERY_CONFIG"), false);
  });

  it("rejects candidate Wrangler as the provider credential process", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replace(
      "${{ github.workspace }}/control-plane/services/api/node_modules/.bin/wrangler",
      "${{ github.workspace }}/candidate/services/api/node_modules/.bin/wrangler",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "NO_CANDIDATE_BUILD_HOOK_IN_PROVIDER_CREDENTIAL_SCOPE"), false);
  });

  it("rejects removing semantic TOML parsing or protected account authority", () => {
    const noSemanticParser = sources();
    noSemanticParser.configPolicy = noSemanticParser.configPolicy.replace(
      "tomllib.loads",
      "json.loads",
    );
    assert.equal(check(evaluateStagingTransactionSources(noSemanticParser), "NO_CANDIDATE_BUILD_HOOK_IN_PROVIDER_CREDENTIAL_SCOPE"), false);

    const noProtectedAuthority = sources();
    noProtectedAuthority.infraAuthority = noProtectedAuthority.infraAuthority.replaceAll(
      "verifyBaseApiWranglerConfig",
      "unsafeWranglerConfig",
    );
    assert.equal(check(evaluateStagingTransactionSources(noProtectedAuthority), "NO_CANDIDATE_BUILD_HOOK_IN_PROVIDER_CREDENTIAL_SCOPE"), false);
  });

  it("rejects Python TOML parsing that can import candidate modules", () => {
    const candidate = sources();
    candidate.configPolicy = candidate.configPolicy.replace('["-I", "-c"', '["-c"');
    assert.equal(check(evaluateStagingTransactionSources(candidate), "NO_CANDIDATE_BUILD_HOOK_IN_PROVIDER_CREDENTIAL_SCOPE"), false);
  });

  it("rejects rollback without exact transaction annotation ownership", () => {
    const candidate = sources();
    candidate.executor = candidate.executor.replace(
      '.annotations["workers/message"] == $release_id',
      ".id == $version_id",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "TRANSACTION_OWNED_ROLLBACK_ONLY"), false);
  });

  it("rejects forged recovery target or release authority", () => {
    const candidate = sources();
    candidate.ledgerRecords = candidate.ledgerRecords.replaceAll(
      "validRecoveryEvidence(plan, recovery, capsule, journal)",
      "validRecoveryEvidence(plan, recovery, capsule)",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "EXACT_RECOVERY_TARGET_AND_RELEASE_AUTHORITY"), false);
  });

  it("rejects privileged Wrangler without an isolated env file and pinned Cloudflare endpoint", () => {
    const candidate = sources();
    candidate.hooks = candidate.hooks.replaceAll(' --env-file /dev/null', '');
    assert.equal(check(evaluateStagingTransactionSources(candidate), "PRIVILEGED_WRANGLER_DOTENV_AND_ENDPOINT_ISOLATED"), false);
  });

  it("rejects privileged Wrangler without the exact protected Cloudflare account", () => {
    const candidate = sources();
    candidate.hooks = candidate.hooks.replaceAll('CLOUDFLARE_ACCOUNT_ID="$account_id"', 'CLOUDFLARE_ACCOUNT_ID="attacker"');
    assert.equal(check(evaluateStagingTransactionSources(candidate), "PRIVILEGED_WRANGLER_DOTENV_AND_ENDPOINT_ISOLATED"), false);
  });

  it("rejects provider Wrangler under the candidate identity or a candidate-seeded HOME", () => {
    const sharedIdentity = sources();
    sharedIdentity.orchestrator = sharedIdentity.orchestrator.replace(
      'test "$provider_uid" != "$STAGING_CANDIDATE_UID"',
      ': # identities may be shared',
    );
    assert.equal(check(evaluateStagingTransactionSources(sharedIdentity), "PRIVILEGED_WRANGLER_DOTENV_AND_ENDPOINT_ISOLATED"), false);

    const noProviderIsolation = sources();
    noProviderIsolation.executor = noProviderIsolation.executor.replace(
      'sudo --non-interactive --user="#${STAGING_PROVIDER_UID}" -- env -i',
      "env -i",
    );
    assert.equal(check(evaluateStagingTransactionSources(noProviderIsolation), "PRIVILEGED_WRANGLER_DOTENV_AND_ENDPOINT_ISOLATED"), false);
  });

  it("rejects stderr heuristics or incomplete account inventory as Worker absence", () => {
    const heuristic = sources();
    heuristic.executor = heuristic.executor.replace(
      'elif verify_provider_absence "$name" "$phase"; then',
      'elif grep -Eqi "does not exist|could not find|10007" "$error"; then',
    );
    assert.equal(check(evaluateStagingTransactionSources(heuristic), "PROVIDER_ABSENCE_USES_EXACT_ACCOUNT_INVENTORY"), false);

    const incomplete = sources();
    incomplete.absenceVerifier = incomplete.absenceVerifier.replace(
      "inventory.result_info.total_pages === 1",
      "inventory.result_info.total_pages >= 1",
    );
    assert.equal(check(evaluateStagingTransactionSources(incomplete), "PROVIDER_ABSENCE_USES_EXACT_ACCOUNT_INVENTORY"), false);

    const tokenInArgv = sources();
    tokenInArgv.executor = tokenInArgv.executor.replace(
      '--header "@$authorization_header_file"',
      '--header "Authorization: Bearer $token"',
    );
    assert.equal(check(evaluateStagingTransactionSources(tokenInArgv), "PROVIDER_ABSENCE_USES_EXACT_ACCOUNT_INVENTORY"), false);
  });

  it("rejects secrets in the executor step environment", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replace(
      "STAGING_TRANSACTION_HOOK_SCRIPT:",
      "CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}\n          STAGING_TRANSACTION_HOOK_SCRIPT:",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "PHASE_SCOPED_CREDENTIALS_AND_E2E_ENV_SCRUB"), false);
  });

  it("rejects candidate E2E under the runner identity or retained DB credentials", () => {
    const sameIdentity = sources();
    sameIdentity.hooks = sameIdentity.hooks.replace(
      'sudo --non-interactive --user="#$e2e_uid" -- env -i',
      "env -i",
    );
    assert.equal(
      check(evaluateStagingTransactionSources(sameIdentity), "CANDIDATE_E2E_OS_IDENTITY_ISOLATED"),
      false,
    );

    const retainedDatabase = sources();
    retainedDatabase.hooks = retainedDatabase.hooks.replace(
      'rm -f "$database_credential_file"',
      ': # retained database credential',
    );
    assert.equal(
      check(evaluateStagingTransactionSources(retainedDatabase), "CANDIDATE_E2E_OS_IDENTITY_ISOLATED"),
      false,
    );

    const liveAcceptanceProcesses = sources();
    liveAcceptanceProcesses.hooks = liveAcceptanceProcesses.hooks.replace(
      'sudo pkill -KILL -U "$e2e_uid"',
      ': # acceptance processes left running',
    );
    assert.equal(
      check(evaluateStagingTransactionSources(liveAcceptanceProcesses), "CANDIDATE_E2E_OS_IDENTITY_ISOLATED"),
      false,
    );

    const recursiveOwnership = sources();
    recursiveOwnership.hooks = recursiveOwnership.hooks.replace(
      'sudo chown "$(id -u):$(id -g)" -- "$e2e_output_dir" "${e2e_files[@]}"',
      'sudo chown -R "$(id -u):$(id -g)" "$e2e_output_dir"',
    );
    assert.equal(
      check(evaluateStagingTransactionSources(recursiveOwnership), "CANDIDATE_E2E_OS_IDENTITY_ISOLATED"),
      false,
    );
  });

  it("rejects accepted status before immutable publication", () => {
    const candidate = sources();
    candidate.hooks = candidate.hooks.replace(
      "STAGING_ACCEPTANCE_PREPARED_UNIFIED_TRANSACTION",
      "STAGING_ACCEPTED_UNIFIED_TRANSACTION",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "ACCEPTANCE_BINDS_ALL_PROVIDER_READBACKS"), false);
  });

  it("rejects compensation on an ambiguous durable terminal outcome", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replace(
      "steps.ledger_commit_state.outputs.classification == 'confirmed_absent'",
      "steps.ledger_commit_state.outputs.classification != 'verified'",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "IMMUTABLE_PREPARE_COMMIT_AND_UPLOAD_COMPENSATION"), false);
  });

  it("rejects a commit-intent failure that cannot enter reverse compensation", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replace(
      "steps.commit_intent.outcome == 'failure'",
      "steps.commit_intent.outcome == 'success'",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "IMMUTABLE_PREPARE_COMMIT_AND_UPLOAD_COMPENSATION"), false);
  });

  it("rejects candidate lifecycle execution or runner-owned candidate builds", () => {
    const lifecycle = sources();
    lifecycle.orchestrator = lifecycle.orchestrator.replace("pnpm install --frozen-lockfile --ignore-scripts", "pnpm install --frozen-lockfile");
    assert.equal(check(evaluateStagingTransactionSources(lifecycle), "CANDIDATE_INSTALL_TEST_BUILD_IMMUTABLE_BOUNDARY"), false);

    const runnerBuild = sources();
    runnerBuild.orchestrator = runnerBuild.orchestrator.replace('sudo --non-interactive --user="#$STAGING_CANDIDATE_UID" -- env -i', "env -i");
    assert.equal(check(evaluateStagingTransactionSources(runnerBuild), "CANDIDATE_INSTALL_TEST_BUILD_IMMUTABLE_BOUNDARY"), false);
  });

  it("rejects reusing the candidate identity or candidate-writable browser state for acceptance", () => {
    const sameUid = sources();
    sameUid.orchestrator = sameUid.orchestrator.replace(
      'test "$acceptance_uid" != "$STAGING_CANDIDATE_UID"',
      ': # acceptance UID may equal candidate UID',
    );
    assert.equal(check(evaluateStagingTransactionSources(sameUid), "CANDIDATE_E2E_OS_IDENTITY_ISOLATED"), false);

    const writableBrowser = sources();
    writableBrowser.orchestrator = writableBrowser.orchestrator.replace(
      'chmod -R a-w,a+rX "$acceptance_browsers"',
      'chmod -R a+rwx "$acceptance_browsers"',
    );
    assert.equal(check(evaluateStagingTransactionSources(writableBrowser), "CANDIDATE_E2E_OS_IDENTITY_ISOLATED"), false);
  });

  it("rejects a weak D1 schema, non-keyset scan, or missing activation gate", () => {
    const weakSchema = sources();
    weakSchema.ledgerMigration = weakSchema.ledgerMigration.replace("staging_transaction_events_terminal_requires_prepared", "terminal_not_checked");
    assert.equal(check(evaluateStagingTransactionSources(weakSchema), "DURABLE_D1_LEDGER_EXACT_ACTIVATED_AND_APPEND_ONLY"), false);

    const offsetScan = sources();
    offsetScan.durableLedger = offsetScan.durableLedger.replace("rowid > ? AND rowid <= ?", "1 = 1 OFFSET ?");
    assert.equal(check(evaluateStagingTransactionSources(offsetScan), "D1_SCHEMA_AND_PAGED_SCAN_ARE_EXACT"), false);
  });

  it("rejects artifact authority and lost-response rollback", () => {
    const artifactAuthority = sources();
    artifactAuthority.orchestrator = artifactAuthority.orchestrator.replace(
      '[[ "${{ steps.ledger_commit_state.outputs.classification }}" == "verified" ]]',
      '[[ "${{ steps.commit_upload.outcome }}" == "success" ]]',
    );
    assert.equal(check(evaluateStagingTransactionSources(artifactAuthority), "IMMUTABLE_PREPARE_COMMIT_AND_UPLOAD_COMPENSATION"), false);

    const ambiguousRollback = sources();
    ambiguousRollback.orchestrator = ambiguousRollback.orchestrator.replace(
      "steps.ledger_commit_state.outputs.classification == 'confirmed_absent'",
      "steps.ledger_commit_state.outputs.classification == 'ambiguous'",
    );
    assert.equal(check(evaluateStagingTransactionSources(ambiguousRollback), "D1_TERMINAL_AMBIGUITY_NEVER_COMPENSATES"), false);

    const hiddenAmbiguity = sources();
    hiddenAmbiguity.orchestrator = hiddenAmbiguity.orchestrator.replaceAll(
      "MANUAL_LEDGER_RECONCILIATION_REQUIRED",
      "MANUAL_REDISPATCH_REQUIRED",
    );
    assert.equal(check(evaluateStagingTransactionSources(hiddenAmbiguity), "D1_TERMINAL_AMBIGUITY_NEVER_COMPENSATES"), false);

    const unsetClassificationRedispatch = sources();
    unsetClassificationRedispatch.orchestrator = unsetClassificationRedispatch.orchestrator.replace(
      "              *)\n                echo \"::error::MANUAL_LEDGER_RECONCILIATION_REQUIRED\"",
      "              ambiguous|conflict|missing)\n                echo \"::error::MANUAL_LEDGER_RECONCILIATION_REQUIRED\"",
    );
    assert.equal(
      check(evaluateStagingTransactionSources(unsetClassificationRedispatch), "D1_TERMINAL_AMBIGUITY_NEVER_COMPENSATES"),
      false,
    );
  });

  it("rejects reopening a legacy staging child workflow", () => {
    const candidate = sources();
    candidate.api = candidate.api.replace(
      "LEGACY_STAGING_MUTATION_ENTRY_POINT_DISABLED",
      "LEGACY_STAGING_MUTATION_ENTRY_POINT_ALLOWED",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "LEGACY_STAGING_PATHS_FAIL_CLOSED"), false);
  });

  it("rejects removing the manual redispatch disclosure", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replaceAll(
      "MANUAL_REDISPATCH_REQUIRED",
      "AUTOMATIC_RECOVERY_CLAIMED",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "MANUAL_REDISPATCH_FOR_FORCE_CANCEL_OR_RUNNER_LOSS"), false);
  });

  it("rejects telling an already recovered failed deploy to redispatch recovery", () => {
    const candidate = sources();
    candidate.orchestrator = candidate.orchestrator.replace(
      "No recovery-only redispatch is required.",
      "Dispatch recovery-only even though the RECOVERED terminal is verified.",
    );
    assert.equal(check(evaluateStagingTransactionSources(candidate), "MANUAL_REDISPATCH_FOR_FORCE_CANCEL_OR_RUNNER_LOSS"), false);
  });

  it("routes definitive PREPARED absence to a fresh deploy and RECOVERED absence to recovery-only", () => {
    const freshDeploy = sources();
    freshDeploy.orchestrator = freshDeploy.orchestrator.replace(
      "STAGING_PREPARED_NOT_CREATED_START_FRESH_DEPLOY",
      "MANUAL_REDISPATCH_REQUIRED",
    );
    assert.equal(check(evaluateStagingTransactionSources(freshDeploy), "PREPARED_AND_RECOVERED_RETRY_ROUTING_EXACT"), false);

    const recoveryOnly = sources();
    recoveryOnly.orchestrator = recoveryOnly.orchestrator.replace(
      "Dispatch recovery-only again to append the no-op closure.",
      "Start a fresh deploy dispatch.",
    );
    assert.equal(check(evaluateStagingTransactionSources(recoveryOnly), "PREPARED_AND_RECOVERED_RETRY_ROUTING_EXACT"), false);

    const ambiguousRecovery = sources();
    ambiguousRecovery.orchestrator = ambiguousRecovery.orchestrator.replace(
      'steps.ledger_recovery_state.outputs.classification }}" =~ ^(ambiguous|conflict|missing)$',
      'steps.ledger_recovery_state.outputs.classification }}" == "confirmed_absent"',
    );
    assert.equal(check(evaluateStagingTransactionSources(ambiguousRecovery), "PREPARED_AND_RECOVERED_RETRY_ROUTING_EXACT"), false);
  });
});
