import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const TEAM_AI_REPOSITORY = "tranhatam-collab/AI.OMDALA.COM";
const TEAM_AI_WORKFLOW_NAME = "OMDALA protected staging AI acceptance";
const TEAM_AI_WORKFLOW_PATH = ".github/workflows/omdala-staging-acceptance.yml";
const TENANT_ID = "omdala-com";
const WORKSPACE_ID = "omdala-com-staging";
const MAX_ACCEPTANCE_COST_USD = 0.25;
const FULL_SHA = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const NONEMPTY_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$/;
const EXPECTED_MODELS = Object.freeze([
  "iai-one/iris-3",
  "iai-one/iris-7",
  "iai-one/iris-9",
  "iai-one/iris-xl",
  "iai-one/iris-vision",
  "iai-one/nova-3",
  "iai-one/nova-7",
  "iai-one/nova-9",
  "iai-one/nova-xl",
  "iai-one/nova-reason",
  "iai-one/spectra-3",
  "iai-one/spectra-7",
  "iai-one/spectra-xl",
  "iai-one/spectra-code",
  "iai-one/pulse-3",
  "iai-one/pulse-7",
  "iai-one/pulse-fast",
  "iai-one/echo-mini",
  "iai-one/echo-xl",
]);
const AI_CALL_KEYS = [
  "api_origin", "authoritative_reconciled_cost_usd", "billing_eligible", "candidate_sha",
  "catalog_model_count", "catalog_selected", "consumer_version_id", "cost_ledger_status",
  "created_at", "ledger_entry_id", "model", "provider_origin", "receipt_id", "request_id",
  "response_body_persisted", "run_id", "schema_version", "secret_values_logged",
  "server_run_and_receipt_reconciliation_required", "tenant_id", "usage", "verdict", "workspace_id",
].sort().join(",");
const AI_RECONCILIATION_KEYS = [
  "authoritative_reconciled_cost_usd", "candidate_claims_cross_bound", "candidate_sha",
  "consumer_version_id", "contains_secret_values", "ledger_bundle_sha256",
  "ledger_contract_version", "ledger_entry_id", "ledger_migration_sha256",
  "ledger_reconciliation_verified", "ledger_release_sha", "ledger_schema_version",
  "ledger_version_id", "model", "production_mutated", "provider_bundle_sha256",
  "provider_origin", "provider_run_readback_verified", "provider_signed_receipt_verified",
  "provider_source_sha", "provider_version_id", "receipt_hash", "receipt_id", "request_id",
  "run_id", "schema_version", "tenant_id", "usage", "verdict", "verified_at", "workspace_id",
].sort().join(",");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function readJson(path, label) {
  const bytes = readFileSync(path);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
  return { value, bytes, sha256: sha256(bytes) };
}

function finiteCost(value, label) {
  invariant(
    typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= MAX_ACCEPTANCE_COST_USD,
    `${label} must be a finite amount between 0 and ${MAX_ACCEPTANCE_COST_USD} USD.`,
  );
  return value;
}

function nonemptyId(value, label) {
  invariant(NONEMPTY_ID.test(value ?? ""), `${label} is invalid.`);
  return value;
}

function exactModelSet(results) {
  invariant(Array.isArray(results) && results.length === EXPECTED_MODELS.length, "Team AI receipt must contain 19 model results.");
  const actual = results.map((result) => result?.model);
  invariant(new Set(actual).size === EXPECTED_MODELS.length, "Team AI model results must be unique.");
  invariant(
    JSON.stringify([...actual].sort()) === JSON.stringify([...EXPECTED_MODELS].sort()),
    "Team AI receipt does not contain the exact 19-model enterprise matrix.",
  );
}

function validateUsage(usage) {
  invariant(
    usage && Object.keys(usage).sort().join(",") === "input_tokens,output_tokens,total_tokens" &&
    Number.isSafeInteger(usage?.input_tokens) && usage.input_tokens >= 0 &&
      Number.isSafeInteger(usage?.output_tokens) && usage.output_tokens >= 0 &&
      Number.isSafeInteger(usage?.total_tokens) &&
      usage.total_tokens === usage.input_tokens + usage.output_tokens,
    "Staging AI call usage is invalid.",
  );
}

export function validateTeamAiRun(run, expectedRunId) {
  const runId = Number(expectedRunId);
  invariant(Number.isSafeInteger(runId) && runId > 0, "Team AI run ID must be a positive integer.");
  const pathMatches =
    run?.path === TEAM_AI_WORKFLOW_PATH ||
    run?.path === `${TEAM_AI_WORKFLOW_PATH}@refs/heads/main`;
  invariant(
    Number(run?.id) === runId &&
      run?.name === TEAM_AI_WORKFLOW_NAME &&
      pathMatches &&
      run?.event === "workflow_dispatch" &&
      run?.head_branch === "main" &&
      FULL_SHA.test(run?.head_sha ?? "") &&
      run?.status === "completed" &&
      run?.conclusion === "success" &&
      run?.repository?.full_name === TEAM_AI_REPOSITORY,
    "Team AI run is not the successful protected main-branch staging acceptance workflow.",
  );
  return run;
}

export function validateTeamAiReceipt(receipt, { run, candidateSha, consumerVersionId }) {
  invariant(receipt?.ok === true, "Team AI receipt did not complete successfully.");
  invariant(receipt?.result === "OMDALA_STAGING_ALL_MODEL_RECONCILIATION_PASS", "Team AI receipt verdict is not accepted.");
  invariant(receipt?.failure === null, "Team AI receipt contains a failure.");
  invariant(receipt?.provider_source_sha === run.head_sha, "Provider source SHA is not the protected workflow head.");
  invariant(receipt?.ledger_release_sha === run.head_sha, "Ledger source SHA is not the protected workflow head.");
  invariant(receipt?.consumer_source_sha === candidateSha, "Team AI receipt is not bound to the OMDALA candidate SHA.");
  invariant(receipt?.consumer_version_id === consumerVersionId, "Team AI receipt consumer version does not match the deployed OMDALA API.");
  invariant(receipt?.consumer_deployment_id === consumerVersionId, "Team AI consumer deployment/version IDs do not match.");

  for (const [field, value] of Object.entries({
    provider_version_id: receipt?.provider_version_id,
    provider_deployment_id: receipt?.provider_deployment_id,
    ledger_version_id: receipt?.ledger_version_id,
    ledger_deployment_id: receipt?.ledger_deployment_id,
    consumer_version_id: receipt?.consumer_version_id,
    consumer_deployment_id: receipt?.consumer_deployment_id,
  })) {
    invariant(UUID.test(value ?? ""), `${field} must be an exact deployment UUID.`);
  }
  invariant(receipt.provider_deployment_id === receipt.provider_version_id, "Provider deployment/version IDs do not match.");
  invariant(receipt.ledger_deployment_id === receipt.ledger_version_id, "Ledger deployment/version IDs do not match.");
  for (const field of [
    "provider_bundle_sha256",
    "ledger_bundle_sha256",
    "ledger_migration_sha256",
  ]) {
    invariant(SHA256.test(receipt?.[field] ?? ""), `${field} must be an exact SHA-256 digest.`);
  }
  invariant(receipt?.provider_contract_version === "1.0.0", "Provider contract must be 1.0.0.");
  invariant(receipt?.ledger_contract_version === "1.0.0", "Ledger contract must be 1.0.0.");
  invariant(receipt?.ledger_schema_version === "1", "Ledger schema must be version 1.");
  invariant(receipt?.credential_contract_version === "1.1.0", "Credential contract must be 1.1.0.");
  invariant(receipt?.tenant_id === TENANT_ID, "Team AI receipt tenant is not omdala-com.");
  invariant(receipt?.workspace_id === WORKSPACE_ID, "Team AI receipt workspace is not isolated staging.");

  invariant(receipt?.model_count === 19, "Team AI receipt model_count must equal 19.");
  invariant(receipt?.invocation_count === 20, "Team AI receipt invocation_count must equal 20.");
  exactModelSet(receipt?.results);
  let summedCost = 0;
  let chatCount = 0;
  let embedCount = 0;
  for (const result of receipt.results) {
    invariant(result?.capability === "chat" || result?.capability === "embed", `${result?.model ?? "unknown"} capability is invalid.`);
    if (result.capability === "chat") chatCount += 1;
    if (result.capability === "embed") embedCount += 1;
    invariant(result?.trace_id === result?.request_id, `${result.model} request/trace correlation is missing.`);
    nonemptyId(result?.request_id, `${result.model} request_id`);
    nonemptyId(result?.run_id, `${result.model} run_id`);
    nonemptyId(result?.receipt_id, `${result.model} receipt_id`);
    nonemptyId(result?.ledger_entry_id, `${result.model} ledger_entry_id`);
    invariant(SHA256.test(result?.receipt_hash ?? ""), `${result.model} receipt hash is invalid.`);
    invariant(typeof result?.upstream_provider === "string" && result.upstream_provider.length > 0 && result.upstream_provider !== "iai-one", `${result.model} upstream provider evidence is invalid.`);
    summedCost += finiteCost(result?.cost_usd, `${result.model} reconciled cost`);
    finiteCost(result?.reserved_cost_ceiling_usd, `${result.model} reserved ceiling`);
  }
  invariant(chatCount > 0 && embedCount > 0, "The exact model matrix must exercise both chat and embedding capabilities.");

  const stream = receipt?.stream_result;
  invariant(EXPECTED_MODELS.includes(stream?.model), "Stream model is outside the exact enterprise matrix.");
  nonemptyId(stream?.request_id, "Stream request_id");
  nonemptyId(stream?.run_id, "Stream run_id");
  nonemptyId(stream?.receipt_id, "Stream receipt_id");
  nonemptyId(stream?.ledger_entry_id, "Stream ledger_entry_id");
  invariant(SHA256.test(stream?.receipt_hash ?? ""), "Stream receipt hash is invalid.");
  invariant(Number.isSafeInteger(stream?.output_bytes) && stream.output_bytes > 0, "Stream output evidence is empty.");
  invariant(Number.isSafeInteger(stream?.stream_bytes) && stream.stream_bytes >= stream.output_bytes, "SSE stream byte evidence is invalid.");
  summedCost += finiteCost(stream?.cost_usd, "Stream reconciled cost");

  const configuredCeiling = finiteCost(receipt?.configured_acceptance_ceiling_usd, "Configured acceptance ceiling");
  invariant(configuredCeiling > 0, "Configured acceptance ceiling must be positive.");
  for (const field of [
    "matrix_acceptance_ceiling_usd",
    "stream_acceptance_ceiling_usd",
    "all_invocation_preflight_ceiling_usd",
    "reconciled_cost_usd",
  ]) {
    const amount = finiteCost(receipt?.[field], field);
    invariant(amount <= configuredCeiling, `${field} exceeds the configured acceptance ceiling.`);
  }
  invariant(
    Math.abs(summedCost - receipt.reconciled_cost_usd) <= 1e-9,
    "Team AI authoritative reconciled cost does not equal the 19-model plus stream ledger total.",
  );
  invariant(receipt?.provider_side_aggregate_spend_reservation_verified === true, "Provider aggregate spend reservation was not verified.");
  invariant(receipt?.wrong_tenant_status === 403, "Wrong-tenant lifecycle control was not verified.");
  invariant(receipt?.expired_credential_status === 401, "Credential expiry lifecycle control was not verified.");
  invariant(receipt?.quota_exhausted_status === 429, "Quota lifecycle control was not verified.");
  invariant(receipt?.budget_exhausted_status === 402, "Budget lifecycle control was not verified.");
  invariant(receipt?.post_revoke_status === 401, "Post-revoke lifecycle control was not verified.");
  invariant(receipt?.secret_values_logged === false, "Team AI receipt reports secret disclosure.");
  invariant(receipt?.production_mutated === false, "Team AI receipt reports a production mutation.");
  invariant(!JSON.stringify(receipt).includes("sk-aiagent-"), "Team AI receipt contains credential material.");
  return receipt;
}

export function validateAiCallReconciliation(reconciliation, {
  candidateSha,
  consumerVersionId,
  teamAiReceipt,
  aiCallEvidence,
}) {
  invariant(
    reconciliation && Object.keys(reconciliation).sort().join(",") === AI_RECONCILIATION_KEYS,
    "Trusted OMDALA AI call reconciliation keys are not exact.",
  );
  invariant(
    reconciliation.schema_version === 1 &&
      reconciliation.verdict === "STAGING_OMDALA_AI_CALL_PROVIDER_RECONCILED",
    "Trusted OMDALA AI call reconciliation is not accepted.",
  );
  invariant(
    reconciliation.candidate_sha === candidateSha &&
      reconciliation.consumer_version_id === consumerVersionId,
    "Trusted OMDALA AI call reconciliation consumer identity mismatch.",
  );
  invariant(reconciliation.provider_origin === "https://staging-api.aiagent.iai.one", "Trusted AI provider origin mismatch.");
  invariant(
    reconciliation.provider_source_sha === teamAiReceipt.provider_source_sha &&
      reconciliation.provider_version_id === teamAiReceipt.provider_version_id &&
      reconciliation.provider_bundle_sha256 === teamAiReceipt.provider_bundle_sha256,
    "Trusted AI provider authority mismatch.",
  );
  invariant(
    reconciliation.ledger_release_sha === teamAiReceipt.ledger_release_sha &&
      reconciliation.ledger_version_id === teamAiReceipt.ledger_version_id &&
      reconciliation.ledger_bundle_sha256 === teamAiReceipt.ledger_bundle_sha256 &&
      reconciliation.ledger_contract_version === teamAiReceipt.ledger_contract_version &&
      reconciliation.ledger_schema_version === teamAiReceipt.ledger_schema_version &&
      reconciliation.ledger_migration_sha256 === teamAiReceipt.ledger_migration_sha256,
    "Trusted AI ledger authority mismatch.",
  );
  invariant(
    reconciliation.tenant_id === TENANT_ID && reconciliation.workspace_id === WORKSPACE_ID,
    "Trusted OMDALA AI call reconciliation tenant/workspace mismatch.",
  );
  for (const field of ["model", "request_id", "run_id", "receipt_id", "ledger_entry_id"]) {
    invariant(reconciliation[field] === aiCallEvidence[field], `Trusted OMDALA AI call ${field} mismatch.`);
  }
  invariant(
    JSON.stringify(reconciliation.usage) === JSON.stringify(aiCallEvidence.usage),
    "Trusted OMDALA AI call usage mismatch.",
  );
  validateUsage(reconciliation.usage);
  const trustedCost = finiteCost(
    reconciliation.authoritative_reconciled_cost_usd,
    "Trusted authenticated AI call reconciled cost",
  );
  invariant(
    trustedCost === aiCallEvidence.authoritative_reconciled_cost_usd,
    "Trusted OMDALA AI call cost mismatch.",
  );
  invariant(SHA256.test(reconciliation.receipt_hash ?? ""), "Trusted provider receipt hash is invalid.");
  invariant(
    reconciliation.provider_run_readback_verified === true &&
      reconciliation.provider_signed_receipt_verified === true &&
      reconciliation.ledger_reconciliation_verified === true &&
      reconciliation.candidate_claims_cross_bound === true,
    "Trusted OMDALA AI call reconciliation is incomplete.",
  );
  invariant(
    reconciliation.contains_secret_values === false && reconciliation.production_mutated === false,
    "Trusted OMDALA AI call reconciliation is unsafe.",
  );
  invariant(Number.isFinite(Date.parse(reconciliation.verified_at ?? "")), "Trusted OMDALA AI call reconciliation timestamp is invalid.");
  return reconciliation;
}

export function validateAiCallEvidence(evidence, { candidateSha, consumerVersionId, teamAiReceipt, reconciliation }) {
  invariant(evidence && Object.keys(evidence).sort().join(",") === AI_CALL_KEYS, "Authenticated OMDALA AI call evidence keys are not exact.");
  invariant(evidence?.schema_version === 1 && evidence?.verdict === "STAGING_AI_CALL_ACCEPTED", "Authenticated OMDALA AI call evidence is not accepted.");
  invariant(evidence?.candidate_sha === candidateSha, "AI call evidence candidate SHA mismatch.");
  invariant(evidence?.consumer_version_id === consumerVersionId, "AI call evidence consumer version mismatch.");
  invariant(evidence?.api_origin === "https://api-staging.omdala.com", "AI call did not use the canonical OMDALA staging API.");
  invariant(evidence?.provider_origin === "https://staging-api.aiagent.iai.one", "AI call did not use the canonical AIAGENT staging authority.");
  invariant(evidence?.tenant_id === TENANT_ID && evidence?.workspace_id === WORKSPACE_ID, "AI call tenant/workspace isolation mismatch.");
  invariant(evidence?.catalog_selected === true && Number.isSafeInteger(evidence?.catalog_model_count) && evidence.catalog_model_count > 0, "AI call model was not selected from the authenticated catalog.");
  invariant(EXPECTED_MODELS.includes(evidence?.model) && teamAiReceipt.results.some((result) => result.model === evidence.model && result.capability === "chat"), "AI call did not use a matrix-verified iai-one chat model.");
  nonemptyId(evidence?.request_id, "AI call request_id");
  nonemptyId(evidence?.run_id, "AI call run_id");
  nonemptyId(evidence?.receipt_id, "AI call receipt_id");
  nonemptyId(evidence?.ledger_entry_id, "AI call ledger_entry_id");
  validateUsage(evidence?.usage);
  const callCost = finiteCost(evidence?.authoritative_reconciled_cost_usd, "Authenticated AI call reconciled cost");
  invariant(
    teamAiReceipt.reconciled_cost_usd + callCost <= MAX_ACCEPTANCE_COST_USD + 1e-12,
    "Combined Team AI matrix and authenticated OMDALA call cost exceeds 0.25 USD.",
  );
  invariant(evidence?.billing_eligible === true && evidence?.cost_ledger_status === "reconciled", "Authenticated AI call is missing authoritative ledger reconciliation.");
  invariant(evidence?.server_run_and_receipt_reconciliation_required === true, "Authenticated AI call is not bound to server run/receipt reconciliation.");
  invariant(evidence?.response_body_persisted === false && evidence?.secret_values_logged === false, "AI call evidence is not non-secret/minimal.");
  invariant(Number.isFinite(Date.parse(evidence?.created_at ?? "")), "AI call evidence timestamp is invalid.");
  validateAiCallReconciliation(reconciliation, {
    candidateSha,
    consumerVersionId,
    teamAiReceipt,
    aiCallEvidence: evidence,
  });
  return evidence;
}

export function buildStagingAiChain({ run, receipt, receiptSha256, runSha256, aiCallEvidence, reconciliation }) {
  return {
    schema_version: 1,
    verdict: "STAGING_AI_CHAIN_ACCEPTED",
    source_repository: TEAM_AI_REPOSITORY,
    workflow: {
      run_id: Number(run.id),
      name: run.name,
      path: TEAM_AI_WORKFLOW_PATH,
      head_branch: run.head_branch,
      head_sha: run.head_sha,
      conclusion: run.conclusion,
      run_metadata_sha256: runSha256,
    },
    team_ai_receipt_sha256: receiptSha256,
    provider: {
      source_sha: receipt.provider_source_sha,
      version_id: receipt.provider_version_id,
      deployment_id: receipt.provider_deployment_id,
      bundle_sha256: receipt.provider_bundle_sha256,
      contract_version: receipt.provider_contract_version,
    },
    ledger: {
      source_sha: receipt.ledger_release_sha,
      version_id: receipt.ledger_version_id,
      deployment_id: receipt.ledger_deployment_id,
      bundle_sha256: receipt.ledger_bundle_sha256,
      contract_version: receipt.ledger_contract_version,
      schema_version: receipt.ledger_schema_version,
      migration_sha256: receipt.ledger_migration_sha256,
    },
    consumer: {
      source_sha: receipt.consumer_source_sha,
      version_id: receipt.consumer_version_id,
      deployment_id: receipt.consumer_deployment_id,
    },
    matrix: {
      tenant_id: receipt.tenant_id,
      workspace_id: receipt.workspace_id,
      model_count: receipt.model_count,
      invocation_count: receipt.invocation_count,
      models: receipt.results.map((result) => result.model),
      stream_model: receipt.stream_result.model,
      configured_acceptance_ceiling_usd: receipt.configured_acceptance_ceiling_usd,
      reconciled_cost_usd: receipt.reconciled_cost_usd,
      provider_side_aggregate_spend_reservation_verified: true,
      lifecycle: {
        wrong_tenant_status: receipt.wrong_tenant_status,
        expired_credential_status: receipt.expired_credential_status,
        quota_exhausted_status: receipt.quota_exhausted_status,
        budget_exhausted_status: receipt.budget_exhausted_status,
        post_revoke_status: receipt.post_revoke_status,
      },
    },
    authenticated_omdala_ai_call: {
      candidate_sha: aiCallEvidence.candidate_sha,
      consumer_version_id: aiCallEvidence.consumer_version_id,
      tenant_id: aiCallEvidence.tenant_id,
      workspace_id: aiCallEvidence.workspace_id,
      provider_run_readback_verified: reconciliation.provider_run_readback_verified,
      provider_signed_receipt_verified: reconciliation.provider_signed_receipt_verified,
      ledger_reconciliation_verified: reconciliation.ledger_reconciliation_verified,
      authenticated_consumer_path_verified: true,
      candidate_runtime_values_omitted: true,
    },
    secret_values_logged: false,
    production_mutated: false,
  };
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const runPath = option("--run");
  const receiptPath = option("--receipt");
  const aiCallEvidencePath = option("--ai-call-evidence");
  const aiReconciliationPath = option("--ai-reconciliation");
  const candidateSha = option("--candidate-sha");
  const consumerVersionId = option("--consumer-version-id");
  const expectedRunId = option("--run-id");
  const outputPath = option("--output") ?? "staging-ai-chain.json";
  invariant(
    runPath && receiptPath && aiCallEvidencePath && aiReconciliationPath,
    "--run, --receipt, --ai-call-evidence, and --ai-reconciliation are required.",
  );
  invariant(FULL_SHA.test(candidateSha ?? ""), "--candidate-sha must be a full lowercase Git SHA.");
  invariant(UUID.test(consumerVersionId ?? ""), "--consumer-version-id must be an exact deployment UUID.");

  const runDocument = readJson(runPath, "Team AI workflow run metadata");
  const receiptDocument = readJson(receiptPath, "Team AI protected staging receipt");
  const aiCallDocument = readJson(aiCallEvidencePath, "Authenticated OMDALA AI call evidence");
  const reconciliationDocument = readJson(aiReconciliationPath, "Trusted OMDALA AI call reconciliation");
  const run = validateTeamAiRun(runDocument.value, expectedRunId);
  const receipt = validateTeamAiReceipt(receiptDocument.value, { run, candidateSha, consumerVersionId });
  const aiCallEvidence = validateAiCallEvidence(aiCallDocument.value, {
    candidateSha,
    consumerVersionId,
    teamAiReceipt: receipt,
    reconciliation: reconciliationDocument.value,
  });
  const chain = buildStagingAiChain({
    run,
    receipt,
    receiptSha256: receiptDocument.sha256,
    runSha256: runDocument.sha256,
    aiCallEvidence,
    reconciliation: reconciliationDocument.value,
  });
  const output = `${JSON.stringify(chain, null, 2)}\n`;
  writeFileSync(outputPath, output, "utf8");
  const chainSha256 = sha256(Buffer.from(output));
  process.stdout.write(`${JSON.stringify({ ...chain, staging_ai_chain_sha256: chainSha256 }, null, 2)}\n`);
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(
      process.env.GITHUB_OUTPUT,
      [
        `staging_ai_chain_sha256=${chainSha256}`,
        `team_ai_receipt_sha256=${receiptDocument.sha256}`,
        `provider_source_sha=${receipt.provider_source_sha}`,
        `provider_version_id=${receipt.provider_version_id}`,
        `provider_bundle_sha256=${receipt.provider_bundle_sha256}`,
        `ledger_source_sha=${receipt.ledger_release_sha}`,
        `ledger_version_id=${receipt.ledger_version_id}`,
        `ledger_bundle_sha256=${receipt.ledger_bundle_sha256}`,
        `consumer_version_id=${receipt.consumer_version_id}`,
        `reconciled_cost_usd=${receipt.reconciled_cost_usd}`,
      ].join("\n") + "\n",
      { flag: "a" },
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
