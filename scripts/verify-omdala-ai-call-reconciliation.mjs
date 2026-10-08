import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ORIGIN = "https://staging-api.aiagent.iai.one";
const TENANT = "omdala-com";
const WORKSPACE = "omdala-com-staging";
const FULL_SHA = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

function exactUsage(usage) {
  return usage && Object.keys(usage).sort().join(",") === "input_tokens,output_tokens,total_tokens" &&
    Number.isSafeInteger(usage.input_tokens) && usage.input_tokens >= 0 &&
    Number.isSafeInteger(usage.output_tokens) && usage.output_tokens >= 0 &&
    usage.total_tokens === usage.input_tokens + usage.output_tokens;
}

async function responseJson(response, label) {
  invariant(response?.status === 200, `${label} did not return HTTP 200`);
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  invariant(contentType.includes("application/json"), `${label} did not return JSON`);
  let value;
  try {
    value = await response.json();
  } catch {
    throw new Error(`${label} returned invalid JSON`);
  }
  return value;
}

export async function reconcileOmdalaAiCall({
  evidence,
  teamAiReceipt,
  apiKey,
  candidateSha,
  consumerVersionId,
  fetchImpl = fetch,
}) {
  invariant(FULL_SHA.test(candidateSha ?? ""), "Candidate SHA is invalid");
  invariant(UUID.test(consumerVersionId ?? ""), "Consumer version ID is invalid");
  invariant(/^sk-aiagent-[a-f0-9]{48}$/.test(apiKey ?? ""), "Scoped AIAGENT credential is invalid");
  invariant(evidence?.schema_version === 1 && evidence?.verdict === "STAGING_AI_CALL_ACCEPTED", "Candidate AI call evidence is invalid");
  invariant(evidence?.candidate_sha === candidateSha && evidence?.consumer_version_id === consumerVersionId, "Candidate AI call identity is invalid");
  invariant(evidence?.api_origin === "https://api-staging.omdala.com" && evidence?.provider_origin === ORIGIN, "Candidate AI call origins are invalid");
  invariant(evidence?.tenant_id === TENANT && evidence?.workspace_id === WORKSPACE, "Candidate AI tenant/workspace is invalid");
  for (const field of ["request_id", "run_id", "receipt_id", "ledger_entry_id"]) {
    invariant(ID.test(evidence?.[field] ?? ""), `Candidate AI ${field} is invalid`);
  }
  invariant(typeof evidence?.model === "string" && evidence.model.startsWith("iai-one/"), "Candidate AI model is invalid");
  invariant(exactUsage(evidence?.usage), "Candidate AI usage is invalid");
  invariant(Number.isFinite(evidence?.authoritative_reconciled_cost_usd) && evidence.authoritative_reconciled_cost_usd >= 0 && evidence.authoritative_reconciled_cost_usd <= 0.25, "Candidate AI cost is invalid");

  invariant(teamAiReceipt?.ok === true && teamAiReceipt?.result === "OMDALA_STAGING_ALL_MODEL_RECONCILIATION_PASS", "Team AI receipt is not accepted");
  invariant(teamAiReceipt?.consumer_source_sha === candidateSha && teamAiReceipt?.consumer_version_id === consumerVersionId, "Team AI receipt is not bound to the deployed consumer");
  invariant(FULL_SHA.test(teamAiReceipt?.provider_source_sha ?? "") && teamAiReceipt?.ledger_release_sha === teamAiReceipt.provider_source_sha, "Team AI source identity is invalid");
  invariant(UUID.test(teamAiReceipt?.provider_version_id ?? "") && UUID.test(teamAiReceipt?.ledger_version_id ?? ""), "Team AI provider/ledger version is invalid");
  invariant(SHA256.test(teamAiReceipt?.provider_bundle_sha256 ?? "") && SHA256.test(teamAiReceipt?.ledger_bundle_sha256 ?? "") && SHA256.test(teamAiReceipt?.ledger_migration_sha256 ?? ""), "Team AI provider/ledger digest is invalid");

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Tenant-ID": TENANT,
    "X-Workspace-ID": WORKSPACE,
    "X-Actor-ID": "omdala-staging-control-plane",
    "X-Actor-Role": "agent",
    "X-Surface": "agent",
  };
  const runResponse = await fetchImpl(`${ORIGIN}/v1/runs/${encodeURIComponent(evidence.run_id)}`, {
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  const runPayload = await responseJson(runResponse, "Provider run readback");
  const run = runPayload?.run;
  invariant(runPayload?.ok === true && run, "Provider run readback is not accepted");
  invariant(
    run.run_id === evidence.run_id && run.status === "success" && run.model === evidence.model &&
    run.request_id === evidence.request_id && run.receipt_id === evidence.receipt_id &&
    run.ledger_entry_id === evidence.ledger_entry_id && run.tenant_id === TENANT &&
    run.workspace_id === WORKSPACE && run.billing_eligible === true &&
    run.cost_ledger_status === "reconciled" &&
    run.input_tokens === evidence.usage.input_tokens && run.output_tokens === evidence.usage.output_tokens &&
    run.cost_usd === evidence.authoritative_reconciled_cost_usd,
    "Provider run readback does not match the OMDALA call",
  );

  const verificationRequestId = `${evidence.request_id}-control-plane-verify`;
  const verifyResponse = await fetchImpl(`${ORIGIN}/v1/ai/verify`, {
    method: "POST",
    headers: {
      ...headers,
      "X-Request-ID": verificationRequestId,
      "X-Trace-ID": verificationRequestId,
      "Idempotency-Key": verificationRequestId,
    },
    body: JSON.stringify({
      receipt_id: evidence.receipt_id,
      task_type: "verify",
      risk_level: "low",
      data_sensitivity: "internal",
      tenant_id: TENANT,
    }),
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  const verification = await responseJson(verifyResponse, "Provider signed-receipt verification");
  const signedReceipt = verification?.data?.receipt;
  invariant(
    verification?.ok === true && verification?.contract_version === "1.0.0" &&
    verification?.data?.verified === true &&
    verification?.data?.verification_method === "ed25519-canonical-payload-sha256" &&
    verification?.data?.execution_status === "success" && signedReceipt,
    "Provider signed-receipt verification is not accepted",
  );
  invariant(
    signedReceipt.run_id === evidence.run_id && signedReceipt.receipt_id === evidence.receipt_id &&
    signedReceipt.request_id === evidence.request_id && signedReceipt.model === evidence.model &&
    signedReceipt.tenant_id === TENANT && signedReceipt.workspace_id === WORKSPACE &&
    signedReceipt.ledger_entry_id === evidence.ledger_entry_id &&
    signedReceipt.input_tokens === evidence.usage.input_tokens &&
    signedReceipt.output_tokens === evidence.usage.output_tokens &&
    signedReceipt.cost_usd === evidence.authoritative_reconciled_cost_usd &&
    signedReceipt.billing_eligible === true && signedReceipt.cost_ledger_status === "reconciled" &&
    signedReceipt.deployment_id === teamAiReceipt.provider_version_id &&
    signedReceipt.ledger_release_sha === teamAiReceipt.ledger_release_sha &&
    signedReceipt.ledger_version_id === teamAiReceipt.ledger_version_id &&
    signedReceipt.ledger_deployment_id === teamAiReceipt.ledger_version_id &&
    signedReceipt.ledger_bundle_sha256 === teamAiReceipt.ledger_bundle_sha256 &&
    signedReceipt.ledger_contract_version === teamAiReceipt.ledger_contract_version &&
    signedReceipt.ledger_schema_version === teamAiReceipt.ledger_schema_version &&
    signedReceipt.ledger_migration_sha256 === teamAiReceipt.ledger_migration_sha256 &&
    SHA256.test(signedReceipt.receipt_hash ?? "") &&
    typeof signedReceipt.provider === "string" && signedReceipt.provider.length > 0 && signedReceipt.provider !== "iai-one",
    "Signed provider receipt does not match the persisted run and exact ledger authority",
  );

  return {
    schema_version: 1,
    verdict: "STAGING_OMDALA_AI_CALL_PROVIDER_RECONCILED",
    candidate_sha: candidateSha,
    consumer_version_id: consumerVersionId,
    provider_origin: ORIGIN,
    provider_source_sha: teamAiReceipt.provider_source_sha,
    provider_version_id: teamAiReceipt.provider_version_id,
    provider_bundle_sha256: teamAiReceipt.provider_bundle_sha256,
    ledger_release_sha: teamAiReceipt.ledger_release_sha,
    ledger_version_id: teamAiReceipt.ledger_version_id,
    ledger_bundle_sha256: teamAiReceipt.ledger_bundle_sha256,
    ledger_contract_version: teamAiReceipt.ledger_contract_version,
    ledger_schema_version: teamAiReceipt.ledger_schema_version,
    ledger_migration_sha256: teamAiReceipt.ledger_migration_sha256,
    tenant_id: TENANT,
    workspace_id: WORKSPACE,
    model: evidence.model,
    request_id: evidence.request_id,
    run_id: evidence.run_id,
    receipt_id: evidence.receipt_id,
    receipt_hash: signedReceipt.receipt_hash,
    ledger_entry_id: evidence.ledger_entry_id,
    usage: evidence.usage,
    authoritative_reconciled_cost_usd: evidence.authoritative_reconciled_cost_usd,
    provider_run_readback_verified: true,
    provider_signed_receipt_verified: true,
    ledger_reconciliation_verified: true,
    candidate_claims_cross_bound: true,
    contains_secret_values: false,
    production_mutated: false,
    verified_at: new Date().toISOString(),
  };
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const evidencePath = option("--evidence");
  const teamAiReceiptPath = option("--team-ai-receipt");
  const credentialPath = option("--credential");
  const outputPath = option("--output");
  const candidateSha = option("--candidate-sha");
  const consumerVersionId = option("--consumer-version-id");
  invariant(evidencePath && teamAiReceiptPath && credentialPath && outputPath, "--evidence, --team-ai-receipt, --credential, and --output are required");
  const credential = readJson(credentialPath, "AI reconciliation credential");
  const value = await reconcileOmdalaAiCall({
    evidence: readJson(evidencePath, "OMDALA AI call evidence"),
    teamAiReceipt: readJson(teamAiReceiptPath, "Team AI receipt"),
    apiKey: credential.AIAGENT_API_KEY,
    candidateSha,
    consumerVersionId,
  });
  writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  process.stdout.write(`${JSON.stringify({ verdict: value.verdict, run_id: value.run_id })}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
