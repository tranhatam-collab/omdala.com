import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function evaluateStagingAiAcceptanceSources({ workflow = "", e2e = "", verifier = "" }) {
  const dispatchInputs = workflow.slice(
    workflow.indexOf("    inputs:"),
    workflow.indexOf("\npermissions:"),
  );
  const checks = [
    {
      id: "TEAM_AI_RUN_ID_ONLY_INPUT",
      pass:
        dispatchInputs.includes("team_ai_staging_acceptance_run_id:") &&
        !dispatchInputs.includes("provider_version_id:") &&
        !dispatchInputs.includes("provider_bundle_sha256:") &&
        !dispatchInputs.includes("ledger_version_id:") &&
        !dispatchInputs.includes("ledger_bundle_sha256:"),
    },
    {
      id: "EXPLICIT_CROSS_REPO_READ_AUTHORITY",
      pass:
        workflow.includes("AIAGENT_CROSS_REPO_READ_TOKEN: ${{ secrets.AIAGENT_CROSS_REPO_READ_TOKEN }}") &&
        workflow.includes("github-token: ${{ secrets.AIAGENT_CROSS_REPO_READ_TOKEN }}") &&
        workflow.includes("repository: tranhatam-collab/AI.OMDALA.COM") &&
        workflow.includes("https://api.github.com/repos/tranhatam-collab/AI.OMDALA.COM/actions/runs/") &&
        !workflow.includes("github-token: ${{ github.token }}\n          run-id: ${{ inputs.team_ai_staging_acceptance_run_id }}"),
    },
    {
      id: "TEAM_AI_WORKFLOW_IDENTITY_VERIFIED",
      pass:
        workflow.includes('"OMDALA protected staging AI acceptance"') &&
        workflow.includes('".github/workflows/omdala-staging-acceptance.yml"') &&
        workflow.includes('.event == "workflow_dispatch"') &&
        workflow.includes('.head_branch == "main"') &&
        workflow.includes('.status == "completed"') &&
        workflow.includes('.conclusion == "success"') &&
        workflow.includes('.repository.full_name == $repository'),
    },
    {
      id: "FULL_TEAM_AI_RECEIPT_DOWNLOADED_AND_VERIFIED",
      pass:
        workflow.includes("omdala-staging-ai-receipt-${{ steps.team_ai_run.outputs.head_sha }}") &&
        workflow.includes("release-chain/team-ai/receipt/omdala-staging-ai-receipt.json") &&
        workflow.includes("node scripts/verify-team-ai-staging-receipt.mjs") &&
        workflow.includes('--run-id "$TEAM_AI_STAGING_RUN_ID"') &&
        verifier.includes("receipt?.model_count === 19") &&
        verifier.includes("receipt?.invocation_count === 20") &&
        verifier.includes("post_revoke_status === 401") &&
        verifier.includes("Math.abs(summedCost - receipt.reconciled_cost_usd) <= 1e-9"),
    },
    {
      id: "AUTHENTICATED_OMDALA_AI_CALL_EXECUTED",
      pass:
        e2e.includes('context.request.get(`${apiUrl}/v1/ai/models`)') &&
        e2e.includes('context.request.post(`${apiUrl}/v1/ai/chat`') &&
        e2e.includes('tenant_id: "omdala-com"') &&
        e2e.includes('workspace_id: "omdala-com-staging"') &&
        e2e.includes("run_id: expect.any(String)") &&
        e2e.includes("receipt_id: expect.any(String)") &&
        e2e.includes("ledger_entry_id: expect.any(String)") &&
        e2e.includes('cost_ledger_status: "reconciled"') &&
        e2e.includes("expect(aiEvidence.cost_usd).toBeLessThanOrEqual(0.25)") &&
        e2e.includes('verdict: "STAGING_AI_CALL_ACCEPTED"') &&
        e2e.includes("response_body_persisted: false") &&
        e2e.includes("secret_values_logged: false"),
    },
    {
      id: "FINAL_ACCEPTANCE_HASH_BINDS_AI_CHAIN",
      pass:
        workflow.includes("--slurpfile team_ai_chain staging-ai-chain.json") &&
        workflow.includes("team_ai_receipt_sha256: $team_ai_receipt_sha256") &&
        workflow.includes("authenticated_ai_call_evidence_sha256: $authenticated_ai_call_evidence_sha256") &&
        workflow.includes("staging_ai_chain_sha256: $staging_ai_chain_sha256") &&
        workflow.includes("team_ai: $team_ai_chain[0]") &&
        workflow.includes('.team_ai.matrix.model_count == 19') &&
        workflow.includes('.team_ai.matrix.invocation_count == 20') &&
        workflow.includes('.team_ai.total_live_acceptance_cost_usd <= 0.25') &&
        workflow.includes('.team_ai.authenticated_omdala_ai_call.authoritative_reconciled_cost_usd <= 0.25'),
    },
    {
      id: "NON_SECRET_AI_EVIDENCE_PRESERVED",
      pass:
        workflow.includes("staging-ai-call-evidence.json") &&
        workflow.includes("staging-ai-chain.json") &&
        workflow.includes("release-chain/team-ai/run/workflow-run.json") &&
        workflow.includes("release-chain/team-ai/receipt/omdala-staging-ai-receipt.json") &&
        verifier.includes('!JSON.stringify(receipt).includes("sk-aiagent-")'),
    },
  ];
  return {
    verdict: checks.every((check) => check.pass)
      ? "STAGING_AI_ACCEPTANCE_CONTRACT_ACCEPTED"
      : "STAGING_AI_ACCEPTANCE_CONTRACT_BLOCKED",
    checks,
  };
}

function main() {
  const result = evaluateStagingAiAcceptanceSources({
    workflow: readFileSync(".github/workflows/staging-go-live-e2e.yml", "utf8"),
    e2e: readFileSync("apps/app/e2e-staging/go-live.spec.ts", "utf8"),
    verifier: readFileSync("scripts/verify-team-ai-staging-receipt.mjs", "utf8"),
  });
  const output = `${JSON.stringify(result, null, 2)}\n`;
  const outputPath = process.argv[2];
  if (outputPath) writeFileSync(outputPath, output, "utf8");
  process.stdout.write(output);
  if (result.verdict !== "STAGING_AI_ACCEPTANCE_CONTRACT_ACCEPTED") process.exitCode = 2;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
