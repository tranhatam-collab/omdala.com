import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reconcileOmdalaAiCall } from "./verify-omdala-ai-call-reconciliation.mjs";

const candidateSha = "a".repeat(40);
const consumerVersion = "30000000-0000-4000-8000-000000000003";
const providerVersion = "10000000-0000-4000-8000-000000000001";
const ledgerVersion = "20000000-0000-4000-8000-000000000002";
const evidence = {
  schema_version: 1,
  verdict: "STAGING_AI_CALL_ACCEPTED",
  candidate_sha: candidateSha,
  consumer_version_id: consumerVersion,
  api_origin: "https://api-staging.omdala.com",
  provider_origin: "https://staging-api.aiagent.iai.one",
  tenant_id: "omdala-com",
  workspace_id: "omdala-com-staging",
  model: "iai-one/iris-7",
  request_id: "request-123",
  run_id: "run-123",
  receipt_id: "receipt-123",
  ledger_entry_id: "ledger-123",
  usage: { input_tokens: 4, output_tokens: 2, total_tokens: 6 },
  authoritative_reconciled_cost_usd: 0.001,
};
const teamAiReceipt = {
  ok: true,
  result: "OMDALA_STAGING_ALL_MODEL_RECONCILIATION_PASS",
  consumer_source_sha: candidateSha,
  consumer_version_id: consumerVersion,
  provider_source_sha: "b".repeat(40),
  provider_version_id: providerVersion,
  provider_bundle_sha256: "c".repeat(64),
  ledger_release_sha: "b".repeat(40),
  ledger_version_id: ledgerVersion,
  ledger_bundle_sha256: "d".repeat(64),
  ledger_contract_version: "1.0.0",
  ledger_schema_version: "1",
  ledger_migration_sha256: "e".repeat(64),
};

function providerDocuments(overrides = {}) {
  const run = {
    run_id: evidence.run_id,
    status: "success",
    model: evidence.model,
    request_id: evidence.request_id,
    receipt_id: evidence.receipt_id,
    ledger_entry_id: evidence.ledger_entry_id,
    tenant_id: evidence.tenant_id,
    workspace_id: evidence.workspace_id,
    billing_eligible: true,
    cost_ledger_status: "reconciled",
    input_tokens: evidence.usage.input_tokens,
    output_tokens: evidence.usage.output_tokens,
    cost_usd: evidence.authoritative_reconciled_cost_usd,
    ...overrides.run,
  };
  const receipt = {
    run_id: evidence.run_id,
    receipt_id: evidence.receipt_id,
    request_id: evidence.request_id,
    model: evidence.model,
    tenant_id: evidence.tenant_id,
    workspace_id: evidence.workspace_id,
    ledger_entry_id: evidence.ledger_entry_id,
    input_tokens: evidence.usage.input_tokens,
    output_tokens: evidence.usage.output_tokens,
    cost_usd: evidence.authoritative_reconciled_cost_usd,
    billing_eligible: true,
    cost_ledger_status: "reconciled",
    deployment_id: providerVersion,
    ledger_release_sha: teamAiReceipt.ledger_release_sha,
    ledger_version_id: ledgerVersion,
    ledger_deployment_id: ledgerVersion,
    ledger_bundle_sha256: teamAiReceipt.ledger_bundle_sha256,
    ledger_contract_version: "1.0.0",
    ledger_schema_version: "1",
    ledger_migration_sha256: teamAiReceipt.ledger_migration_sha256,
    receipt_hash: "f".repeat(64),
    provider: "cloudflare-workers-ai",
    ...overrides.receipt,
  };
  return { run, receipt };
}

function mockFetch(documents, requests = []) {
  return async (url, init = {}) => {
    requests.push({ url, init });
    const headers = { "content-type": "application/json" };
    if (url.includes("/v1/runs/")) {
      return new Response(JSON.stringify({ ok: true, run: documents.run }), { status: 200, headers });
    }
    if (url.endsWith("/v1/ai/verify")) {
      return new Response(JSON.stringify({
        ok: true,
        contract_version: "1.0.0",
        data: {
          verified: true,
          verification_method: "ed25519-canonical-payload-sha256",
          execution_status: "success",
          receipt: documents.receipt,
        },
      }), { status: 200, headers });
    }
    throw new Error(`unexpected URL ${url}`);
  };
}

describe("trusted OMDALA AI call reconciliation", () => {
  it("cross-binds candidate claims to provider run readback and signed ledger receipt", async () => {
    const requests = [];
    const result = await reconcileOmdalaAiCall({
      evidence,
      teamAiReceipt,
      apiKey: `sk-aiagent-${"1".repeat(48)}`,
      candidateSha,
      consumerVersionId: consumerVersion,
      fetchImpl: mockFetch(providerDocuments(), requests),
    });
    assert.equal(result.verdict, "STAGING_OMDALA_AI_CALL_PROVIDER_RECONCILED");
    assert.equal(result.provider_run_readback_verified, true);
    assert.equal(result.provider_signed_receipt_verified, true);
    assert.equal(result.ledger_reconciliation_verified, true);
    assert.equal(requests.length, 2);
    assert.match(requests[0].init.headers.Authorization, /^Bearer sk-aiagent-/);
    assert.equal(JSON.stringify(result).includes("sk-aiagent-"), false);
  });

  it("rejects candidate-fabricated IDs absent from the provider run", async () => {
    await assert.rejects(
      reconcileOmdalaAiCall({
        evidence,
        teamAiReceipt,
        apiKey: `sk-aiagent-${"1".repeat(48)}`,
        candidateSha,
        consumerVersionId: consumerVersion,
        fetchImpl: mockFetch(providerDocuments({ run: { receipt_id: "different-receipt" } })),
      }),
      /does not match the OMDALA call/,
    );
  });

  it("rejects a signed receipt with a different ledger version", async () => {
    await assert.rejects(
      reconcileOmdalaAiCall({
        evidence,
        teamAiReceipt,
        apiKey: `sk-aiagent-${"1".repeat(48)}`,
        candidateSha,
        consumerVersionId: consumerVersion,
        fetchImpl: mockFetch(providerDocuments({ receipt: { ledger_version_id: "90000000-0000-4000-8000-000000000009" } })),
      }),
      /exact ledger authority/,
    );
  });
});
