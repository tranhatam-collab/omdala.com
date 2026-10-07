import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function step(source, name) {
  const marker = `      - name: ${name}`;
  const start = source.indexOf(marker);
  if (start < 0) return "";
  const end = source.indexOf("\n      - ", start + marker.length);
  return source.slice(start, end < 0 ? source.length : end);
}

export function evaluateStagingTransactionSources({
  orchestrator = "",
  api = "",
  surfaces = "",
  acceptance = "",
  recovery = "",
  recoveryPlan = "",
  recoveryScript = "",
}) {
  const apiGuard = step(api, "Require the single staging transaction caller before mutation");
  const surfaceGuard = step(
    surfaces,
    "Require the single staging transaction caller before mutation",
  );
  const acceptanceGuard = step(
    acceptance,
    "Require the workflow control plane from current main",
  );
  const recoveryGuard = step(recovery, "Require the trusted staging transaction caller");
  const localAcceptanceDownloads = acceptance.slice(
    acceptance.indexOf("      - name: Download immutable API release receipt"),
    acceptance.indexOf("      - id: release_chain"),
  );
  const checks = [
    {
      id: "ONE_CONSTANT_TRANSACTION_CONCURRENCY",
      pass:
        orchestrator.includes("name: OMDALA Staging Transaction") &&
        orchestrator.includes("group: omdala-staging-transaction") &&
        orchestrator.includes("cancel-in-progress: false") &&
        !orchestrator.includes("group: omdala-staging-transaction-${{") &&
        !orchestrator.includes("queue:"),
    },
    {
      id: "CURRENT_MAIN_AND_IMMUTABLE_INPUTS",
      pass:
        orchestrator.includes('[[ "$CANDIDATE_SHA" =~ ^[0-9a-f]{40}$ ]]') &&
        orchestrator.includes('test "$GITHUB_REF" = "refs/heads/main"') &&
        orchestrator.includes('test "$GITHUB_SHA" = "$current_main"') &&
        orchestrator.includes("STAGING_TRANSACTION_RERUN_BLOCKED_START_A_NEW_DISPATCH") &&
        orchestrator.includes(".github/workflows/staging-transaction.yml@refs/heads/main"),
    },
    {
      id: "SEQUENTIAL_REUSABLE_STAGES",
      pass:
        orchestrator.includes("uses: ./.github/workflows/deploy.yml") &&
        orchestrator.includes("needs: [lock-control-plane, deploy-api]") &&
        orchestrator.includes("uses: ./.github/workflows/deploy-surfaces.yml") &&
        orchestrator.includes("needs: [lock-control-plane, deploy-api, deploy-surfaces]") &&
        orchestrator.includes("uses: ./.github/workflows/staging-go-live-e2e.yml") &&
        orchestrator.includes("team_ai_staging_acceptance_run_id: ${{ inputs.team_ai_staging_acceptance_run_id }}"),
    },
    {
      id: "CHILDREN_ARE_REUSABLE_AND_DIRECT_STAGING_FAILS_CLOSED",
      pass:
        [api, surfaces, acceptance].every((source) =>
          source.includes("workflow_call:"),
        ) &&
        [api, surfaces, acceptance].every(
          (source) => !source.includes("workflow_dispatch:"),
        ) &&
        [orchestrator, api, surfaces, acceptance, recovery].every(
          (source) => !/\bjob\.workflow_(?:ref|sha|file_path)\b/.test(source),
        ) &&
        [apiGuard, surfaceGuard, acceptanceGuard].every(
          (source) =>
            source.includes("DIRECT_STAGING_CHILD_DISPATCH_BLOCKED") &&
            source.includes("UNTRUSTED_STAGING_TRANSACTION_CALLER") &&
            source.includes("GITHUB_WORKFLOW_REF") &&
            source.includes("GITHUB_WORKFLOW_SHA") &&
            source.includes("staging-transaction.yml@refs/heads/main"),
        ) &&
        api.indexOf("Require the single staging transaction caller before mutation") <
          api.indexOf("Apply migrations in lexical order") &&
        surfaces.indexOf("Require the single staging transaction caller before mutation") <
          surfaces.indexOf("Deploy isolated staging surface Workers"),
    },
    {
      id: "STAGING_ATOMICITY_HOLD_PRECEDES_ALL_MUTATION",
      pass:
        orchestrator.includes("atomicity-hold:") &&
        orchestrator.includes(
          "STAGING_TRANSACTION_BLOCKED_PROTECTED_ENVIRONMENT_ATOMICITY",
        ) &&
        orchestrator.includes("needs: atomicity-hold") &&
        orchestrator.indexOf("atomicity-hold:") <
          orchestrator.indexOf("uses: ./.github/workflows/deploy.yml"),
    },
    {
      id: "INVALID_AND_PRODUCTION_ENVIRONMENTS_HARD_FAIL",
      pass:
        [apiGuard, surfaceGuard].every(
          (source) =>
            source.includes("INVALID_RELEASE_ENVIRONMENT") &&
            source.includes("PRODUCTION_HOLD_UNIFIED_TRANSACTION_REQUIRED"),
        ) &&
        orchestrator.includes('PRODUCTION_RELEASES_HARD_DISABLED: "true"') &&
        orchestrator.includes('production_release_status: "HOLD_NO_GO"'),
    },
    {
      id: "SAME_RUN_HASH_BOUND_ARTIFACT_CHAIN",
      pass:
        acceptance.includes("api_receipt_sha256") &&
        acceptance.includes("surface_receipt_sha256") &&
        acceptance.includes("staging_transaction_id") &&
        acceptance.includes("reusable_workflow_ref") &&
        api.includes(
          'release_artifact_name=omdala-api-release-${{ needs.validate.outputs.sha }}-staging-${{ inputs.staging_transaction_id }}',
        ) &&
        api.includes(
          'backup_artifact_name=omdala-pre-migration-backup-${{ needs.validate.outputs.sha }}-staging-${{ inputs.staging_transaction_id }}',
        ) &&
        surfaces.includes(
          'release_artifact_name=omdala-surface-release-${{ steps.identity.outputs.sha }}-staging-${{ inputs.staging_transaction_id }}',
        ) &&
        acceptance.includes(
          'suffix="${CANDIDATE_SHA}-staging-${{ inputs.staging_transaction_id }}"',
        ) &&
        acceptance.includes(
          '[[ "$API_RELEASE_ARTIFACT_NAME" == "omdala-api-release-${suffix}" ]]',
        ) &&
        acceptance.includes(
          '[[ "$SURFACE_RELEASE_ARTIFACT_NAME" == "omdala-surface-release-${suffix}" ]]',
        ) &&
        localAcceptanceDownloads.includes("actions/download-artifact@") &&
        !localAcceptanceDownloads.includes("run-id:") &&
        !localAcceptanceDownloads.includes("github-token:") &&
        orchestrator.includes("ACCEPTANCE_RECEIPT_SHA256") &&
        orchestrator.includes('verdict: "STAGING_TRANSACTION_ACCEPTED"'),
    },
    {
      id: "COMPENSATION_COVERS_DOWNSTREAM_FAILURES",
      pass:
        orchestrator.includes("recover-api-after-surface-failure:") &&
        orchestrator.includes("needs.deploy-surfaces.result != 'success'") &&
        orchestrator.includes("rollback_surfaces: false") &&
        orchestrator.includes("recover-after-acceptance-failure:") &&
        orchestrator.includes("needs.accept-staging.result != 'success'") &&
        orchestrator.includes("needs.finalize-transaction.result != 'success'") &&
        orchestrator.includes("rollback_surfaces: true") &&
        (orchestrator.match(/uses: \.\/\.github\/workflows\/staging-recovery\.yml/g)?.length ?? 0) === 2,
    },
    {
      id: "RECOVERY_IS_HASH_BOUND_AND_PROVIDER_VERIFIED",
      pass:
        recovery.includes("workflow_call:") &&
        !recovery.includes("workflow_dispatch:") &&
        recoveryGuard.includes("GITHUB_WORKFLOW_REF") &&
        recovery.includes("staging-recovery-plan.mjs") &&
        recovery.includes("staging-transaction-recovery.sh") &&
        recoveryPlan.includes("API receipt hash does not match") &&
        recoveryPlan.includes("Surface receipt hash does not match") &&
        recoveryPlan.includes("previous_version_id") &&
        recoveryScript.includes("provider state diverged") &&
        recoveryScript.includes("delete_new_staging_resource") &&
        recoveryScript.includes("< /dev/null") &&
        recoveryScript.includes("recovery_failed=1") &&
        recoveryScript.includes("provider readback did not reach the exact baseline") &&
        recoveryScript.includes('database_schema_reverted: false'),
    },
  ];
  return {
    verdict: checks.every((entry) => entry.pass)
      ? "STAGING_TRANSACTION_SOURCE_ACCEPTED"
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
    recovery: readFileSync(".github/workflows/staging-recovery.yml", "utf8"),
    recoveryPlan: readFileSync("scripts/staging-recovery-plan.mjs", "utf8"),
    recoveryScript: readFileSync("scripts/staging-transaction-recovery.sh", "utf8"),
  };
}

function main() {
  const result = evaluateStagingTransactionSources(sources());
  const output = `${JSON.stringify(result, null, 2)}\n`;
  const outputPath = process.argv[2];
  if (outputPath) writeFileSync(outputPath, output, "utf8");
  process.stdout.write(output);
  if (result.verdict !== "STAGING_TRANSACTION_SOURCE_ACCEPTED") process.exitCode = 2;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
