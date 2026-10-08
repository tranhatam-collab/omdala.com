import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function count(source, needle) {
  return source.split(needle).length - 1;
}

function ordered(source, needles) {
  let offset = -1;
  for (const needle of needles) {
    offset = source.indexOf(needle, offset + 1);
    if (offset < 0) return false;
  }
  return true;
}

export function evaluateStagingTransactionSources({
  orchestrator = "",
  api = "",
  surfaces = "",
  acceptance = "",
  legacyRecovery = "",
  capsule = "",
  executor = "",
  hooks = "",
  recoveryScript = "",
  recoveryWorkspace = "",
  unresolved = "",
  configSafety = "",
  configPolicy = "",
  configRenderer = "",
  infraAuthority = "",
  absenceVerifier = "",
  durableLedger = "",
  durableEvidence = "",
  ledgerRecords = "",
  ledgerMigration = "",
  ledgerConfig = "",
}) {
  const executeStart = orchestrator.indexOf("      - id: execute");
  const executeEnd = orchestrator.indexOf("      - id: prepared_upload");
  const executeStep = orchestrator.slice(executeStart, executeEnd);
  const mutationPostStart = durableLedger.indexOf("post_mutation_once() {");
  const mutationPostEnd = durableLedger.indexOf("verify_query_response() {", mutationPostStart);
  const mutationPost = durableLedger.slice(mutationPostStart, mutationPostEnd);
  const commitTerminalCaseStart = orchestrator.indexOf(
    'case "${{ steps.ledger_commit_state.outputs.classification }}" in',
  );
  const commitTerminalCaseEnd = orchestrator.indexOf("\n            esac", commitTerminalCaseStart);
  const commitTerminalCase = orchestrator.slice(commitTerminalCaseStart, commitTerminalCaseEnd);
  const checks = [
    {
      id: "ONE_PROTECTED_JOB_ONE_APPROVAL",
      pass:
        orchestrator.includes("  transaction:") &&
        count(orchestrator, "    environment: staging") === 1 &&
        !orchestrator.includes("uses: ./.github/workflows/") &&
        !orchestrator.includes("\n  recovery:"),
    },
    {
      id: "FIXED_CONCURRENCY_AND_ATTEMPT_ONE",
      pass:
        orchestrator.includes("  group: omdala-staging-transaction\n") &&
        !orchestrator.includes("group: omdala-staging-transaction-${{") &&
        orchestrator.includes("cancel-in-progress: false") &&
        orchestrator.includes('test "$GITHUB_RUN_ATTEMPT" = "1"') &&
        orchestrator.includes("STAGING_TRANSACTION_RERUN_BLOCKED_START_A_NEW_DISPATCH"),
    },
    {
      id: "DEPLOY_AND_RECOVERY_ONLY_SAME_PROTECTED_JOB",
      pass:
        orchestrator.includes("options:\n          - deploy\n          - recovery-only") &&
        orchestrator.includes('test "$DISPATCH_CONFIRMATION" = "DEPLOY_OMDALA_STAGING_TRANSACTION"') &&
        orchestrator.includes('test "$DISPATCH_CONFIRMATION" = "RECOVER_OMDALA_STAGING_TRANSACTION"') &&
        orchestrator.includes("Materialize the explicit prior durable capsule from verified D1 bytes") &&
        executor.includes('if [[ "$transaction_mode" == "recovery-only" ]]') &&
        executor.includes("run_recovery_only") &&
        executor.includes("run_recovery_only\n  exit $?") &&
        executor.indexOf('if [[ "$transaction_mode" == "recovery-only" ]]') <
          executor.lastIndexOf("run_deploy_transaction"),
    },
    {
      id: "DISPATCH_INPUTS_ARE_ENV_SCOPED_BEFORE_SHELL_VALIDATION",
      pass:
        orchestrator.includes("DISPATCH_CONFIRMATION: ${{ inputs.confirmation }}") &&
        orchestrator.includes("DISPATCH_CANDIDATE_SHA: ${{ inputs.candidate_sha }}") &&
        orchestrator.includes("DISPATCH_RECOVERY_RUN_ID: ${{ inputs.recovery_run_id }}") &&
        orchestrator.includes('[[ "$DISPATCH_CANDIDATE_SHA" =~ ^[0-9a-f]{40}$ ]]') &&
        orchestrator.includes('[[ "$DISPATCH_RECOVERY_RUN_ID" =~ ^[1-9][0-9]*$ ]]') &&
        orchestrator.includes('--recovery-run-id "$DISPATCH_RECOVERY_RUN_ID"') &&
        orchestrator.includes('candidate_sha="$DISPATCH_CANDIDATE_SHA"') &&
        orchestrator.includes('--arg run "$DISPATCH_RECOVERY_RUN_ID"') &&
        !orchestrator.includes('--hyperdrive-id "${{ vars.') &&
        !orchestrator.includes('--google-client-id "${{ vars.') &&
        !orchestrator.includes('"${{ inputs.confirmation }}"') &&
        !orchestrator.includes('"${{ inputs.candidate_sha }}"') &&
        !orchestrator.includes('"${{ inputs.recovery_run_id }}"'),
    },
    {
      id: "TRUSTED_MAIN_CONTROLS_EXACT_CANDIDATE",
      pass:
        orchestrator.includes('test "$GITHUB_REF" = "refs/heads/main"') &&
        orchestrator.includes('test "$GITHUB_SHA" = "$current_main"') &&
        orchestrator.includes("Checkout trusted transaction controls from current main") &&
        orchestrator.includes("Checkout exact candidate separately from trusted controls") &&
        orchestrator.includes("Checkout exact candidate separately from trusted controls\n        if: inputs.mode == 'deploy'") &&
        orchestrator.includes("Create candidate-free recovery workspace from durable bytes") &&
        orchestrator.includes('test ! -e "$CANDIDATE_ROOT/.git"') &&
        count(orchestrator, "          path: control-plane\n") === 1 &&
        count(orchestrator, "          path: candidate\n") === 1 &&
        orchestrator.includes('test "$(git -C "$CANDIDATE_ROOT" rev-parse HEAD)" = "$CANDIDATE_SHA"'),
    },
    {
      id: "UNRESOLVED_CAPSULE_DISCOVERY_IS_TRUSTED_AND_BLOCKING",
      pass:
        orchestrator.includes("Discover every durable unresolved staging capsule from D1") &&
        orchestrator.includes("staging-unresolved-capsules.mjs") &&
        orchestrator.includes('recovery_run_id') &&
        orchestrator.includes("supplemental-actions-artifacts.json") &&
        orchestrator.includes("D1 PREPARED/terminal rows are the sole state authority") &&
        !orchestrator.includes("/actions/artifacts?per_page=") &&
        !orchestrator.includes("commit_verified") &&
        !orchestrator.includes("resolution_verified") &&
        unresolved.includes("trustedRun") &&
        unresolved.includes("STAGING_UNRESOLVED_CAPSULES_BLOCK_DEPLOY") &&
        unresolved.includes("EXPIRED_CAPSULE_MANUAL_PROVIDER_RECONCILIATION_REQUIRED") &&
        unresolved.includes("MANUAL_REDISPATCH_REQUIRED") &&
        unresolved.includes("artifact.capsule_verified !== true") &&
        unresolved.includes("LEGACY_CAPSULE_HAS_NO_DURABLE_LEDGER_RECOVERY_SOURCE") &&
        unresolved.includes("durable_ledger_authority: false") &&
        unresolved.includes("durable_ledger_authority: true") &&
        !unresolved.includes("candidate.commit_verified") &&
        !unresolved.includes("verifiedRecoveries") &&
        unresolved.includes("ledgerTransactions") &&
        orchestrator.includes('--ledger "$GITHUB_WORKSPACE/staging-ledger-records.json"'),
    },
    {
      id: "DURABLE_CAPSULE_PRESERVES_EXACT_RECOVERY_CONFIG",
      pass:
        ordered(orchestrator, [
          "Create verified encrypted pre-migration backup before any mutation",
          "Upload durable encrypted database recovery evidence before mutation",
          "Verify infra authority and snapshot five provider baselines",
          'cp services/api/wrangler.release.toml "$STAGING_TRANSACTION_EVIDENCE_DIR/capsule/api.wrangler.release.toml"',
          "Upload pre-mutation durable recovery capsule and atomic journal",
          "      - id: execute",
        ]) &&
        orchestrator.includes("${{ env.STAGING_TRANSACTION_EVIDENCE_DIR }}/capsule/api.wrangler.release.toml") &&
        orchestrator.includes('STAGING_TRANSACTION_EVIDENCE_DIR: ${{ github.workspace }}/transaction-evidence') &&
        orchestrator.includes('test ! -e "$CANDIDATE_ROOT/transaction-evidence"') &&
        !orchestrator.includes("candidate/transaction-evidence") &&
        orchestrator.includes("Restore the downloaded immutable recovery inputs\n        if: inputs.mode == 'recovery-only'\n        working-directory: candidate") &&
        orchestrator.includes('bash "$CONTROL_PLANE_ROOT/scripts/staging-restore-recovery-workspace.sh"') &&
        orchestrator.includes('"$GITHUB_WORKSPACE/recovery-input"') &&
        recoveryWorkspace.includes('test ! -e "$candidate_root/.git"') &&
        recoveryWorkspace.includes('install -m 600 "$source_root/api.wrangler.release.toml" "$api_config"') &&
        recoveryWorkspace.includes('"$candidate_root/infra/staging/surfaces/$surface.wrangler.jsonc"') &&
        recoveryWorkspace.includes('test "$(digest_file "$destination")" = "$expected"') &&
        orchestrator.includes("--surface-directory infra/staging/surfaces") &&
        ledgerRecords.includes("surface_web_wrangler_jsonc") &&
        ledgerRecords.includes("surface_app_wrangler_jsonc") &&
        ledgerRecords.includes("surface_auth_wrangler_jsonc") &&
        ledgerRecords.includes("surface_brand_wrangler_jsonc") &&
        recoveryWorkspace.includes("configSha256") &&
        capsule.includes("configSha256") &&
        capsule.includes("CAPSULE_SEALED_NO_MUTATION") &&
        capsule.includes('runner_loss_recovery_authority: "MANUAL_REDISPATCH_REQUIRED"'),
    },
    {
      id: "NO_CANDIDATE_BUILD_HOOK_IN_PROVIDER_CREDENTIAL_SCOPE",
      pass:
        orchestrator.includes("Reject candidate-controlled Wrangler build hooks") &&
        orchestrator.includes("verify-staging-wrangler-execution-safety.mjs") &&
        orchestrator.includes("--account-id \"$account_id\"") &&
        configSafety.includes("STAGING_WRANGLER_EXECUTION_SAFETY_EXACT") &&
        configSafety.includes("TOP_LEVEL_KEYS") &&
        configSafety.includes("verifyRenderedApiWranglerConfig") &&
        configRenderer.includes("verifyBaseApiWranglerConfig") &&
        configRenderer.includes("canonicalRenderedApiWranglerConfig") &&
        infraAuthority.includes("verifyBaseApiWranglerConfig") &&
        configPolicy.includes("tomllib.loads") &&
        configPolicy.includes('["-I", "-c"') &&
        configPolicy.includes('cwd: "/"') &&
        configPolicy.includes('PYTHONNOUSERSITE: "1"') &&
        configPolicy.includes("assertSemanticIdentity") &&
        configPolicy.includes("exact canonical TOML serialization") &&
        executeStep.includes("control-plane/services/api/node_modules/.bin/wrangler") &&
        !executeStep.includes("candidate/services/api/node_modules/.bin/wrangler"),
    },
    {
      id: "EXACT_PROVIDER_AUTHORITY_PRE_AND_POST",
      pass:
        executor.includes('"$hook_script" authority pre') &&
        executor.includes('"$hook_script" authority post') &&
        hooks.includes("verify-api-worker-authority.mjs") &&
        hooks.includes("verify-surface-worker-authority.mjs") &&
        hooks.includes("SURFACE_REMOTE_PREFLIGHT_MISSING_STAGING_RESOURCE_ALLOWED") &&
        hooks.includes("--phase preflight") === false &&
        hooks.includes('secret_phase="preflight"') &&
        hooks.includes("postdeploy") &&
        executor.includes("pre_secret_authority_sha256") &&
        executor.includes("post_secret_authority_sha256") &&
        executor.includes("pre_binding_authority_sha256") &&
        executor.includes("post_binding_authority_sha256") &&
        hooks.includes("SURFACE_WORKER_SECRET_INVENTORY_EXACT_EMPTY") === false,
    },
    {
      id: "TRANSACTION_OWNED_ROLLBACK_ONLY",
      pass:
        executor.includes('verify_transaction_ownership') &&
        executor.includes('.annotations["workers/message"] == $release_id') &&
        executor.includes('if [[ -z "$deployed" ]]; then') &&
        executor.includes('verify_transaction_ownership "$name" "$config" "$use_staging" "$current"') &&
        executor.includes("refusing rollback") &&
        executor.indexOf('mark_target "$name" "attempted"') <
          executor.indexOf('"$hook_script" mutate "$name"'),
    },
    {
      id: "EXACT_RECOVERY_TARGET_AND_RELEASE_AUTHORITY",
      pass:
        capsule.includes("TARGET_AUTHORITY") &&
        capsule.includes('configPath: "services/api/wrangler.release.toml"') &&
        capsule.includes('configPath: "infra/staging/surfaces/brand.wrangler.jsonc"') &&
        capsule.includes('transactionId !== `staging-${workflowRunId}-1`') &&
        capsule.includes('releaseId !== `gh-${workflowRunId}-1-${candidateSha.slice(0, 12)}`') &&
        ledgerRecords.includes("TARGET_AUTHORITY") &&
        ledgerRecords.includes('capsule.release_id !== `gh-${capsule.workflow_run_id}-1-${capsule.candidate_sha.slice(0, 12)}`') &&
        ledgerRecords.includes("validRecoveryEvidence(plan, recovery, capsule, journal)") &&
        ledgerRecords.includes("validRecoveryExecution") &&
        ledgerRecords.includes("record.recovery_execution") &&
        ledgerRecords.includes("target.workerName !== capsuleTarget.workerName") &&
        executor.includes("recovery_execution:") &&
        executor.includes('--arg execution_control_plane_sha "$GITHUB_SHA"') &&
        recoveryScript.includes('.recovery_execution == {repository:$repository') &&
        recoveryScript.includes('workflow_ref:$workflow_ref,run_id:$run_id,run_attempt:$run_attempt,control_plane_sha:$control_plane_sha') &&
        executor.includes('configPath:"services/api/wrangler.release.toml"') &&
        executor.includes('workerName:"omdala-surface-brand-staging"') &&
        executor.includes('($journal[0].targets | map(.baseline_version_id)) == ($capsule.targets | map(.baselineVersionId))'),
    },
    {
      id: "PRIVILEGED_WRANGLER_DOTENV_AND_ENDPOINT_ISOLATED",
      pass:
        count(orchestrator, "--env-file /dev/null") >= 2 &&
        [orchestrator, executor, hooks, recoveryScript].every((source) =>
          source.includes('CLOUDFLARE_API_BASE_URL="https://api.cloudflare.com/client/v4"') &&
          source.includes('CLOUDFLARE_ACCOUNT_ID="$account_id"') &&
          source.includes('WRANGLER_API_ENVIRONMENT="production"') &&
          source.includes('CLOUDFLARE_COMPLIANCE_REGION="public"') &&
          source.includes('CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV="false"')) &&
        [executor, hooks, recoveryScript].every((source) =>
          source.includes('sudo --non-interactive --user="#${STAGING_PROVIDER_UID}" -- env -i') &&
          source.includes('"$wrangler_bin" "$@" --env-file /dev/null')) &&
        orchestrator.includes("Provision a fresh provider-only identity after every candidate command") &&
        orchestrator.includes('test "$provider_uid" != "$STAGING_CANDIDATE_UID"') &&
        orchestrator.includes('test -z "$(sudo find "$provider_home" -mindepth 1 -print -quit)"') &&
        orchestrator.includes('sudo --non-interactive --user="#$STAGING_CANDIDATE_UID" -- test ! -w "$provider_home"'),
    },
    {
      id: "PROVIDER_ABSENCE_USES_EXACT_ACCOUNT_INVENTORY",
      pass:
        [orchestrator, executor, recoveryScript].every((source) =>
          source.includes("verify-cloudflare-worker-absence.mjs") &&
          source.includes("workers/scripts?page=1&per_page=1000")) &&
        [orchestrator, executor, recoveryScript, hooks].every((source) =>
          !source.includes('grep -Eqi "does not exist|could not find|10007"')) &&
        hooks.includes("STAGING_WORKER_ABSENCE_EXACT") &&
        absenceVerifier.includes("inventory.result_info.total_pages === 1") &&
        absenceVerifier.includes("Cloudflare scripts inventory is incomplete or paginated") &&
        absenceVerifier.includes("The requested staging Worker exists in the exact account inventory"),
    },
    {
      id: "PHASE_SCOPED_CREDENTIALS_AND_E2E_ENV_SCRUB",
      pass:
        orchestrator.includes("STAGING_PROVIDER_CREDENTIAL_FILE") &&
        orchestrator.includes("STAGING_DATABASE_CREDENTIAL_FILE") &&
        orchestrator.includes("STAGING_E2E_CREDENTIAL_FILE") &&
        executeStart >= 0 &&
        executeEnd > executeStart &&
        !executeStep.includes("${{ secrets.") &&
        count(hooks, "env -i") >= 3 &&
        executor.includes("env -i") &&
        recoveryScript.includes("env -i") &&
        hooks.includes('"$control_plane_root/apps/app/node_modules/.bin/playwright" test') &&
        hooks.includes('--config "$control_plane_root/apps/app/playwright.staging.config.ts"') &&
        hooks.includes("provider_exec") &&
        !hooks.includes('export CLOUDFLARE_API_TOKEN') &&
        !hooks.includes('export OMDALA_DATABASE_URL'),
    },
    {
      id: "CANDIDATE_E2E_OS_IDENTITY_ISOLATED",
      pass:
        orchestrator.includes("Prove candidate E2E runs under an isolated unprivileged identity") &&
        orchestrator.includes("Provision a fresh acceptance-only identity and trusted browser after candidate execution") &&
        orchestrator.includes("sudo useradd --system --no-create-home") &&
        orchestrator.includes('test "$(stat -c \'%a\' "$runtime_dir")" = "700"') &&
        orchestrator.includes('test "$acceptance_uid" != "$STAGING_CANDIDATE_UID"') &&
        orchestrator.includes('PLAYWRIGHT_BROWSERS_PATH="$acceptance_browsers"') &&
        orchestrator.includes('chmod -R a-w,a+rX "$acceptance_browsers"') &&
        orchestrator.includes('test -z "$(find "$PLAYWRIGHT_BROWSERS_PATH" -perm /022 -print -quit)"') &&
        orchestrator.includes('candidate_build_state_reused_for_acceptance:false') &&
        orchestrator.includes('acceptance_identity_fresh_and_distinct:') &&
        orchestrator.includes('provider_credential_readable_by_candidate:false') &&
        orchestrator.includes('sudo --non-interactive --user="#$e2e_uid" -- test -r "$protected_file"') &&
        hooks.includes('rm -f "$database_credential_file"') &&
        hooks.includes('provider_secret_bundle="$provider_tmpdir/api-secrets.json"') &&
        hooks.includes('-o "$STAGING_PROVIDER_UID" -g "$STAGING_PROVIDER_UID" -m 600') &&
        hooks.includes("trap 'sudo rm -f \"$provider_secret_bundle\"; rm -f \"$secret_bundle\"' EXIT") &&
        hooks.includes('sudo rm -f "$provider_secret_bundle"') &&
        hooks.includes('rm -f "$e2e_credential_file"') &&
        hooks.includes('rm -f "$team_ai_credential_file"') &&
        hooks.includes('rm -f "$ai_reconciliation_credential_file"') &&
        hooks.includes('test ! -e "$database_credential_file"') &&
        hooks.includes('test ! -e "$secret_bundle"') &&
        hooks.includes('sudo --non-interactive --user="#$e2e_uid" -- test -r "$provider_credential_file"') &&
        hooks.includes('sudo --non-interactive --user="#$e2e_uid" -- env -i') &&
        hooks.includes('E2E_STAGING_JSON_REPORT="$e2e_output_dir/staging-e2e-results.json"') &&
        hooks.includes('test -r "$provider_credential_file"'),
    },
    {
      id: "CANDIDATE_INSTALL_TEST_BUILD_IMMUTABLE_BOUNDARY",
      pass:
        ordered(orchestrator, [
          'chmod -R go-w "$CANDIDATE_ROOT" "$CONTROL_PLANE_ROOT"',
          "pnpm install --frozen-lockfile --ignore-scripts",
          'sudo --non-interactive --user="#$STAGING_CANDIDATE_UID" -- env -i',
          "pnpm security:audit",
          "Build exact static surfaces as the isolated candidate identity",
          "Provision a fresh provider-only identity after every candidate command",
          "Dry-run the API bundle as the fresh provider-only identity",
          "Re-verify immutable candidate and trusted controls before credentials",
          "Provision a fresh acceptance-only identity and trusted browser after candidate execution",
        ]) &&
        orchestrator.includes("test ! -e .pnpmfile.cjs") &&
        orchestrator.includes("test ! -e pnpmfile.cjs") &&
        orchestrator.includes("test ! -e .npmrc") &&
        orchestrator.includes('git diff --exit-code HEAD -- .') &&
        orchestrator.includes('test -z "$(git status --porcelain --untracked-files=all)"') &&
        orchestrator.includes('git -C "$CONTROL_PLANE_ROOT" diff --exit-code HEAD -- .') &&
        orchestrator.includes('git -C "$CONTROL_PLANE_ROOT" diff --cached --exit-code') &&
        orchestrator.includes('test -z "$(git -C "$CONTROL_PLANE_ROOT" status --porcelain --untracked-files=all)"') &&
        orchestrator.includes("pnpm --filter @omdala/api... --filter @omdala/app... install --frozen-lockfile --ignore-scripts") &&
        orchestrator.includes('test -z "$(find "$output" -type l -print -quit)"') &&
        count(orchestrator, "verify-staging-wrangler-execution-safety.mjs") >= 2 &&
        orchestrator.includes("scripts/staging-durable-ledger.sh") &&
        orchestrator.includes("scripts/staging-restore-recovery-workspace.sh") &&
        hooks.includes("scripts/sanitize-staging-mail-evidence.mjs") &&
        orchestrator.includes("scripts/scan-staging-artifacts-for-secrets.mjs") &&
        orchestrator.includes("infra/staging/ledger-d1.json") &&
        orchestrator.includes("infra/staging/ledger-activation-reconciliation.schema.json"),
    },
    {
      id: "ACCEPTANCE_BINDS_ALL_PROVIDER_READBACKS",
      pass:
        executor.includes('["api", "web", "app", "auth", "brand"]') &&
        executor.includes("provider-evidence-manifest.json") &&
        executor.includes("pre_deployments_sha256") &&
        executor.includes("post_deployments_sha256") &&
        executor.includes("pre_secrets_sha256") &&
        executor.includes("post_secrets_sha256") &&
        hooks.includes("provider_evidence_manifest_sha256") &&
        hooks.includes("provider_evidence: $provider_evidence[0]") &&
        hooks.includes("STAGING_ACCEPTANCE_PREPARED_UNIFIED_TRANSACTION") &&
        !hooks.includes('verdict: "STAGING_ACCEPTED_UNIFIED_TRANSACTION"'),
    },
    {
      id: "IMMUTABLE_PREPARE_COMMIT_AND_UPLOAD_COMPENSATION",
      pass:
        ordered(orchestrator, [
          "Execute protected deploy or recovery-only transaction",
          "Create durable commit intent from exact local acceptance evidence",
          "Append and read back the D1 COMMITTED terminal event",
          "Compensate only when D1 definitively confirms COMMITTED is absent",
          "Append and read back the D1 RECOVERED terminal event",
          "Remove every protected credential file before supplemental artifact publication",
          "Publish supplemental prepared acceptance evidence",
          "Publish supplemental staging transaction commit",
          "Publish supplemental recovery resolution",
        ]) &&
        orchestrator.includes("STAGING_TRANSACTION_COMMIT_INTENT") &&
        orchestrator.includes("      - id: commit_intent\n        name: Create durable commit intent from exact local acceptance evidence") &&
        orchestrator.includes("steps.commit_intent.outcome == 'failure'") &&
        orchestrator.includes("durable_ledger_is_authority:true,artifacts_are_supplemental:true") &&
        orchestrator.includes("steps.ledger_commit_state.outputs.classification == 'confirmed_absent'") &&
        !orchestrator.includes("steps.ledger_commit.outcome != 'success'") &&
        !orchestrator.includes("steps.prepared_upload.outcome != 'success'") &&
        !orchestrator.includes('[[ "${{ steps.commit_upload.outcome }}" == "success" ]]') &&
        !orchestrator.includes("candidate/transaction-evidence") &&
        orchestrator.includes("omdala-staging-transaction-commit-") &&
        orchestrator.includes("omdala-staging-recovery-resolved-"),
    },
    {
      id: "DURABLE_D1_LEDGER_EXACT_ACTIVATED_AND_APPEND_ONLY",
      pass:
        ordered(orchestrator, [
          "Prepare the dedicated D1-only durable-ledger credential",
          "Fail closed unless the durable D1 ledger schema and every event verify",
          "Discover every durable unresolved staging capsule",
          "Upload pre-mutation durable recovery capsule and atomic journal",
          "Append and read back the non-expiring D1 PREPARED event",
          "Execute protected deploy or recovery-only transaction",
        ]) &&
        orchestrator.includes("OMDALA_STAGING_LEDGER_D1_TOKEN") &&
        orchestrator.includes("OMDALA_STAGING_LEDGER_D1_ID") &&
        orchestrator.includes("staging-durable-ledger.sh verify-and-list") &&
        orchestrator.includes("staging-transaction-ledger.mjs scan-events") &&
        orchestrator.includes("staging-transaction-ledger.mjs\" materialize") &&
        durableLedger.includes("INSERT INTO staging_transaction_events") &&
        !durableLedger.includes("INSERT OR IGNORE INTO staging_transaction_events") &&
        ledgerMigration.includes("staging_transaction_events_require_activation") &&
        ledgerMigration.includes("staging_transaction_events_one_unresolved") &&
        ledgerMigration.includes("staging_transaction_events_terminal_requires_prepared") &&
        ledgerMigration.includes("staging_transaction_events_terminal_is_exclusive") &&
        ledgerMigration.includes("staging_transaction_events_no_update") &&
        ledgerMigration.includes("staging_transaction_events_no_delete") &&
        ledgerMigration.includes("prepared_sha256 = payload_sha256") &&
        ledgerMigration.includes("json_extract(payload_json, '$.transaction_id') = transaction_id") &&
        ledgerMigration.includes("json_extract(payload_json, '$.prepared_record_sha256') = prepared_sha256") &&
        ledgerRecords.includes("provider_evidence_manifest") &&
        ledgerRecords.includes("validProviderManifestTargets") &&
        ledgerRecords.includes("STAGING_TRANSACTION_PREPARED_FOR_COMMIT") &&
        orchestrator.includes('--provider-manifest "$STAGING_TRANSACTION_EVIDENCE_DIR/provider-evidence-manifest.json"') &&
        orchestrator.includes("durable_ledger_is_authority:true,artifacts_are_supplemental:true") &&
        ledgerConfig.includes('"activation_epoch": "omdala-staging-ledger-v1"') &&
        ledgerConfig.includes('"activation_receipt_schema": "infra/staging/ledger-activation-reconciliation.schema.json"') &&
        ledgerConfig.includes('"activation_import_policy": "canonical-zero-unresolved"') &&
        durableEvidence.includes("EMPTY_UNRESOLVED_IMPORT_SHA256") &&
        ledgerConfig.includes('"required_cloudflare_permission": "D1:Edit"') &&
        ledgerConfig.includes('"allowed_cloudflare_account_scope": "exact-account-only"'),
    },
    {
      id: "D1_SCHEMA_AND_PAGED_SCAN_ARE_EXACT",
      pass:
        durableEvidence.includes("canonicalSchemaManifest") &&
        durableEvidence.includes("schema manifest digest mismatch") &&
        durableEvidence.includes("verifyActivationEvidence") &&
        durableEvidence.includes("validatePagedLedgerSnapshot") &&
        durableEvidence.includes("high-water row") &&
        durableEvidence.includes("truncated or contains an omitted row") &&
        durableLedger.includes("rowid AS ledger_rowid") &&
        durableLedger.includes("rowid > ? AND rowid <= ?") &&
        durableLedger.includes("scan_page_size") &&
        ledgerConfig.includes('"scan_page_size": 1') &&
        /"schema_manifest_sha256": "[a-f0-9]{64}"/.test(ledgerConfig),
    },
    {
      id: "D1_TERMINAL_AMBIGUITY_NEVER_COMPENSATES",
      pass:
        durableLedger.includes("--retry 3 --retry-all-errors") &&
        mutationPostStart >= 0 && mutationPostEnd > mutationPostStart &&
        !mutationPost.includes("--retry") &&
        mutationPost.includes("--write-out '%{http_code}'") &&
        durableLedger.includes('post_mutation_once "$request_dir/append.json"') &&
        durableLedger.includes('--append-transport-status "$append_transport_status"') &&
        durableLedger.includes('--append-http-status "$append_http_status"') &&
        durableLedger.includes("classify-append") &&
        ledgerRecords.includes("classifyAppendOutcome") &&
        ledgerRecords.includes("STAGING_DURABLE_LEDGER_APPEND_AMBIGUOUS_MANUAL_RECONCILIATION_REQUIRED") &&
        ledgerRecords.includes("STAGING_DURABLE_LEDGER_APPEND_CONFIRMED_ABSENT") &&
        ledgerRecords.includes("append_provider_error_observed") &&
        !ledgerRecords.includes("changes === 0 ||") &&
        ledgerRecords.includes('changes === 0') &&
        orchestrator.includes("Classify the durable COMMITTED readback without guessing") &&
        orchestrator.includes("Classify the durable RECOVERED readback without guessing") &&
        orchestrator.includes("steps.ledger_commit_state.outputs.classification == 'confirmed_absent'") &&
        commitTerminalCaseStart >= 0 &&
        commitTerminalCaseEnd > commitTerminalCaseStart &&
        ordered(commitTerminalCase, [
          "verified)",
          "confirmed_absent)",
          "*)",
          "MANUAL_LEDGER_RECONCILIATION_REQUIRED",
          "Do not compensate until an exact D1 readback resolves it",
        ]) &&
        orchestrator.includes("MANUAL_LEDGER_RECONCILIATION_REQUIRED") &&
        orchestrator.includes("Do not compensate until an exact D1 readback resolves it") &&
        !orchestrator.includes("steps.ledger_commit.outcome != 'success'"),
    },
    {
      id: "REVERSE_COMPENSATION_CONTINUES_AND_RECEIPTS",
      pass:
        capsule.includes("reverse_recovery_order") &&
        executor.includes("jq -c '.targets | reverse[]'") &&
        executor.includes('disposition="pending_unchanged"') &&
        executor.includes('disposition="already_at_baseline"') &&
        executor.includes('disposition="rollback_required"') &&
        executor.includes('disposition="delete_required"') &&
        executor.includes('disposition="manual_reconciliation_required"') &&
        executor.includes("mutation_targets: $mutation_targets") &&
        recoveryScript.includes('map(.name)) == ["brand", "auth", "app", "web", "api"]') &&
        recoveryScript.includes("mutation_targets: $mutation_targets") &&
        ledgerRecords.includes("validRecoveryEvidence(plan, recovery, capsule, journal)") &&
        recoveryScript.includes("recovery_failed=1") &&
        recoveryScript.includes("STAGING_COMPENSATING_RECOVERY_FAILED") &&
        recoveryScript.includes("staging-recovery-receipt.json") &&
        executor.includes("transaction-executor-receipt.json") &&
        executor.includes("STAGING_TRANSACTION_FAILED_RECOVERY_INCOMPLETE") &&
        executor.includes('on_signal()') &&
        executor.includes('finalize_deploy "$2"'),
    },
    {
      id: "PREPARED_AND_RECOVERED_RETRY_ROUTING_EXACT",
      pass:
        orchestrator.includes("Classify the durable PREPARED readback without guessing") &&
        orchestrator.includes("Require an exact durable PREPARED readback before mutation") &&
        orchestrator.includes('steps.ledger_prepared_state.outputs.classification }}" == "confirmed_absent"') &&
        orchestrator.includes("STAGING_PREPARED_NOT_CREATED_START_FRESH_DEPLOY") &&
        orchestrator.includes("no provider mutation was allowed. Start a fresh deploy dispatch") &&
        orchestrator.includes('steps.ledger_prepared_state.outputs.classification }}" =~ ^(ambiguous|conflict|missing)$') &&
        orchestrator.includes('steps.ledger_recovery_state.outputs.classification }}" == "confirmed_absent"') &&
        orchestrator.includes("Dispatch recovery-only again to append the no-op closure") &&
        orchestrator.includes('steps.ledger_recovery_state.outputs.classification }}" =~ ^(ambiguous|conflict|missing)$'),
    },
    {
      id: "MANUAL_REDISPATCH_FOR_FORCE_CANCEL_OR_RUNNER_LOSS",
      pass:
        !orchestrator.includes("STAGING_TRANSACTION_BLOCKED_RUNNER_LOSS_RECOVERY_AUTHORITY") &&
        orchestrator.includes("MANUAL_REDISPATCH_REQUIRED") &&
        orchestrator.includes("Force-cancel or runner loss cannot be recovered by the stopped runner") &&
        orchestrator.includes("STAGING_TRANSACTION_FAILED_RECOVERY_VERIFIED") &&
        orchestrator.includes("No recovery-only redispatch is required") &&
        orchestrator.includes('steps.ledger_recovery_state.outputs.classification }}" == "verified"') &&
        capsule.includes('runner_loss_recovery_authority: "MANUAL_REDISPATCH_REQUIRED"'),
    },
    {
      id: "AI_SPEND_AND_PRODUCTION_HOLD",
      pass:
        orchestrator.includes('STAGING_AI_COST_CEILING_USD: "0.25"') &&
        hooks.includes("configured_acceptance_ceiling_usd <= ($cap | tonumber)") &&
        hooks.includes("matrix.reconciled_cost_usd <= ($cap | tonumber)") &&
        orchestrator.includes('PRODUCTION_RELEASES_HARD_DISABLED: "true"') &&
        hooks.includes("production_release_authorized: false") &&
        hooks.includes('production_release_status: "HOLD_NO_GO"'),
    },
    {
      id: "LEGACY_STAGING_PATHS_FAIL_CLOSED",
      pass:
        [api, surfaces, acceptance, legacyRecovery].every((source) =>
          source.includes("LEGACY_STAGING_MUTATION_ENTRY_POINT_DISABLED"),
        ) &&
        [api, surfaces, acceptance, legacyRecovery].every(
          (source) => !source.includes("workflow_dispatch:"),
        ) &&
        api.includes("PRODUCTION_HOLD_UNIFIED_TRANSACTION_REQUIRED") &&
        surfaces.includes("PRODUCTION_HOLD_UNIFIED_TRANSACTION_REQUIRED"),
    },
  ];
  return {
    verdict: checks.every((entry) => entry.pass)
      ? "STAGING_TRANSACTION_SOURCE_ACCEPTED_FAIL_CLOSED"
      : "STAGING_TRANSACTION_SOURCE_BLOCKED",
    checks,
  };
}

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

function main() {
  const result = evaluateStagingTransactionSources(sources());
  const output = `${JSON.stringify(result, null, 2)}\n`;
  const outputPath = process.argv[2];
  if (outputPath) writeFileSync(outputPath, output, "utf8");
  process.stdout.write(output);
  if (result.verdict === "STAGING_TRANSACTION_SOURCE_BLOCKED") process.exitCode = 2;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
