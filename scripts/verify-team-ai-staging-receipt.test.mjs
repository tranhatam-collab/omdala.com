import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildStagingAiChain,
  validateAiCallEvidence,
  validateTeamAiReceipt,
  validateTeamAiRun,
} from "./verify-team-ai-staging-receipt.mjs";

const providerSha = "a".repeat(40);
const candidateSha = "b".repeat(40);
const providerVersionId = "11111111-1111-4111-8111-111111111111";
const ledgerVersionId = "22222222-2222-4222-8222-222222222222";
const consumerVersionId = "33333333-3333-4333-8333-333333333333";
const models = [
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
];

function fixtureRun() {
  return {
    id: 987654,
    name: "OMDALA protected staging AI acceptance",
    path: ".github/workflows/omdala-staging-acceptance.yml@refs/heads/main",
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: providerSha,
    status: "completed",
    conclusion: "success",
    repository: { full_name: "tranhatam-collab/AI.OMDALA.COM" },
  };
}

function fixtureReceipt() {
  const results = models.map((model, index) => ({
    model,
    capability: index === models.length - 1 ? "embed" : "chat",
    upstream_provider: "openrouter",
    request_id: `request-${index}`,
    trace_id: `request-${index}`,
    run_id: `run-${index}`,
    receipt_id: `receipt-${index}`,
    receipt_hash: String(index % 10).repeat(64),
    ledger_entry_id: `ledger-${index}`,
    cost_usd: 0.001,
    reserved_cost_ceiling_usd: 0.005,
  }));
  return {
    ok: true,
    result: "OMDALA_STAGING_ALL_MODEL_RECONCILIATION_PASS",
    failure: null,
    provider_source_sha: providerSha,
    provider_deployment_id: providerVersionId,
    provider_version_id: providerVersionId,
    provider_bundle_sha256: "1".repeat(64),
    ledger_release_sha: providerSha,
    ledger_deployment_id: ledgerVersionId,
    ledger_version_id: ledgerVersionId,
    ledger_bundle_sha256: "2".repeat(64),
    ledger_contract_version: "1.0.0",
    ledger_schema_version: "1",
    ledger_migration_sha256: "3".repeat(64),
    consumer_source_sha: candidateSha,
    consumer_deployment_id: consumerVersionId,
    consumer_version_id: consumerVersionId,
    tenant_id: "omdala-com",
    workspace_id: "omdala-com-staging",
    credential_contract_version: "1.1.0",
    provider_contract_version: "1.0.0",
    key_id: "key-id-not-a-secret",
    model_count: 19,
    invocation_count: 20,
    matrix_acceptance_ceiling_usd: 0.15,
    stream_acceptance_ceiling_usd: 0.05,
    all_invocation_preflight_ceiling_usd: 0.2,
    reconciled_cost_usd: 0.02,
    configured_acceptance_ceiling_usd: 0.25,
    provider_side_aggregate_spend_reservation_verified: true,
    results,
    stream_result: {
      model: models[0],
      request_id: "stream-request",
      run_id: "stream-run",
      receipt_id: "stream-receipt",
      receipt_hash: "4".repeat(64),
      ledger_entry_id: "stream-ledger",
      cost_usd: 0.001,
      output_bytes: 20,
      stream_bytes: 80,
    },
    wrong_tenant_status: 403,
    expired_credential_status: 401,
    quota_exhausted_status: 429,
    budget_exhausted_status: 402,
    post_revoke_status: 401,
    secret_values_logged: false,
    production_mutated: false,
  };
}

function fixtureAiCall() {
  return {
    schema_version: 1,
    verdict: "STAGING_AI_CALL_ACCEPTED",
    candidate_sha: candidateSha,
    consumer_version_id: consumerVersionId,
    api_origin: "https://api-staging.omdala.com",
    provider_origin: "https://staging-api.aiagent.iai.one",
    tenant_id: "omdala-com",
    workspace_id: "omdala-com-staging",
    catalog_selected: true,
    catalog_model_count: 19,
    model: models[0],
    request_id: "omdala-request",
    run_id: "omdala-run",
    receipt_id: "omdala-receipt",
    ledger_entry_id: "omdala-ledger",
    usage: { input_tokens: 4, output_tokens: 2, total_tokens: 6 },
    authoritative_reconciled_cost_usd: 0.001,
    billing_eligible: true,
    cost_ledger_status: "reconciled",
    server_run_and_receipt_reconciliation_required: true,
    response_body_persisted: false,
    secret_values_logged: false,
    created_at: "2026-10-08T00:00:00.000Z",
  };
}

function validateFixtures(run = fixtureRun(), receipt = fixtureReceipt(), aiCall = fixtureAiCall()) {
  const validRun = validateTeamAiRun(run, 987654);
  const validReceipt = validateTeamAiReceipt(receipt, {
    run: validRun,
    candidateSha,
    consumerVersionId,
  });
  const validAiCall = validateAiCallEvidence(aiCall, {
    candidateSha,
    consumerVersionId,
    teamAiReceipt: validReceipt,
  });
  return { validRun, validReceipt, validAiCall };
}

describe("protected Team AI staging receipt verifier", () => {
  it("accepts and hash-binds the exact 19-model, one-stream, lifecycle, and authenticated-call chain", () => {
    const { validRun, validReceipt, validAiCall } = validateFixtures();
    const chain = buildStagingAiChain({
      run: validRun,
      receipt: validReceipt,
      receiptSha256: "5".repeat(64),
      runSha256: "6".repeat(64),
      aiCallEvidence: validAiCall,
      aiCallEvidenceSha256: "7".repeat(64),
    });
    assert.equal(chain.verdict, "STAGING_AI_CHAIN_ACCEPTED");
    assert.equal(chain.matrix.model_count, 19);
    assert.equal(chain.matrix.invocation_count, 20);
    assert.equal(chain.provider.source_sha, providerSha);
    assert.equal(chain.consumer.source_sha, candidateSha);
    assert.equal(chain.authenticated_omdala_ai_call.workspace_id, "omdala-com-staging");
    assert.equal(JSON.stringify(chain).includes("key-id-not-a-secret"), false);
  });

  it("rejects a caller-selected workflow identity or unsuccessful run", () => {
    for (const mutate of [
      (run) => { run.repository.full_name = "attacker/fork"; },
      (run) => { run.path = ".github/workflows/other.yml"; },
      (run) => { run.head_branch = "feature"; },
      (run) => { run.conclusion = "failure"; },
      (run) => { run.head_sha = "not-a-sha"; },
    ]) {
      const run = fixtureRun();
      mutate(run);
      assert.throws(() => validateTeamAiRun(run, 987654), /protected main-branch staging acceptance/);
    }
  });

  it("rejects mutations to provider, ledger, or consumer release identity", () => {
    const mutations = [
      ["provider_source_sha", candidateSha],
      ["ledger_release_sha", candidateSha],
      ["consumer_source_sha", providerSha],
      ["provider_version_id", consumerVersionId],
      ["ledger_bundle_sha256", "not-a-hash"],
      ["consumer_version_id", providerVersionId],
    ];
    for (const [field, value] of mutations) {
      const receipt = fixtureReceipt();
      receipt[field] = value;
      assert.throws(() => validateFixtures(fixtureRun(), receipt), Error);
    }
  });

  it("rejects any missing, duplicate, or substituted model in the 19-model matrix", () => {
    const missing = fixtureReceipt();
    missing.results.pop();
    assert.throws(() => validateFixtures(fixtureRun(), missing), /19 model results/);

    const duplicate = fixtureReceipt();
    duplicate.results[18].model = duplicate.results[0].model;
    assert.throws(() => validateFixtures(fixtureRun(), duplicate), /unique/);

    const substituted = fixtureReceipt();
    substituted.results[0].model = "iai-one/unreviewed-model";
    assert.throws(() => validateFixtures(fixtureRun(), substituted), /exact 19-model/);
  });

  it("rejects missing SSE, lifecycle, and authoritative cost reconciliation", () => {
    const noStream = fixtureReceipt();
    delete noStream.stream_result.receipt_id;
    assert.throws(() => validateFixtures(fixtureRun(), noStream), /Stream receipt_id/);

    const lifecycle = fixtureReceipt();
    lifecycle.post_revoke_status = 200;
    assert.throws(() => validateFixtures(fixtureRun(), lifecycle), /Post-revoke/);

    const cost = fixtureReceipt();
    cost.reconciled_cost_usd = 0.019;
    assert.throws(() => validateFixtures(fixtureRun(), cost), /ledger total/);

    const ceiling = fixtureReceipt();
    ceiling.configured_acceptance_ceiling_usd = 0.251;
    assert.throws(() => validateFixtures(fixtureRun(), ceiling), /between 0 and 0.25/);
  });

  it("rejects forged OMDALA AI-call tenant, model, usage, ledger, and cost evidence", () => {
    for (const mutate of [
      (evidence) => { evidence.workspace_id = "omdala-com-production"; },
      (evidence) => { evidence.model = "openai/gpt-4"; },
      (evidence) => { evidence.usage.total_tokens = 99; },
      (evidence) => { evidence.cost_ledger_status = "pending"; },
      (evidence) => { evidence.authoritative_reconciled_cost_usd = 0.251; },
      (evidence) => { evidence.authoritative_reconciled_cost_usd = 0.24; },
      (evidence) => { evidence.consumer_version_id = providerVersionId; },
    ]) {
      const aiCall = fixtureAiCall();
      mutate(aiCall);
      assert.throws(() => validateFixtures(fixtureRun(), fixtureReceipt(), aiCall), Error);
    }
  });

  it("rejects receipt credential material", () => {
    const receipt = fixtureReceipt();
    receipt.accidental_secret = `sk-aiagent-${"f".repeat(48)}`;
    assert.throws(() => validateFixtures(fixtureRun(), receipt), /credential material/);
  });
});
