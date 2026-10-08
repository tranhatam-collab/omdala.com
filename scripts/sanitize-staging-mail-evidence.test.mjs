import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { sanitizeStagingMailEvidence } from "./sanitize-staging-mail-evidence.mjs";

const candidateSha = "a".repeat(40);
const consumerVersionId = "50000000-0000-4000-8000-000000000001";
const sinkAddress = "sink@example.invalid";
const testSecret = "protected-e2e-secret";

function fixture() {
  return {
    schema_version: 1, verdict: "STAGING_MAIL_SINK_ACCEPTED", candidate_sha: candidateSha,
    consumer_version_id: consumerVersionId, api_origin: "https://api-staging.omdala.com",
    workspace_id: "omdala.com-staging", delivery_mode: "sink", sink_enforced: true,
    sink_address_sha256: createHash("sha256").update(sinkAddress).digest("hex"),
    provider_message_count: 5, provider_message_ids: ["m1", "m2", "m3", "m4", "m5"],
    provider_statuses: ["accepted", "accepted", "accepted", "accepted", "accepted"],
    original_recipient_count: 5, delivered_recipient_count: 5, sink_address_persisted: false,
    created_at: "2026-10-08T00:00:00Z",
  };
}

function sanitize(value) {
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
  return sanitizeStagingMailEvidence(value, bytes, { candidateSha, consumerVersionId, sinkAddress, testSecret });
}

describe("trusted staging mail evidence sanitizer", () => {
  it("emits a fixed receipt without candidate message fields", () => {
    const receipt = sanitize(fixture());
    assert.equal(receipt.verdict, "STAGING_MAIL_SINK_ACCEPTED");
    assert.equal("provider_message_ids" in receipt, false);
    assert.equal("provider_statuses" in receipt, false);
    assert.equal("sink_address_sha256" in receipt, false);
    assert.equal("candidate_evidence_sha256" in receipt, false);
    assert.equal(receipt.candidate_evidence_contract_verified, true);
    assert.equal(receipt.sink_match_verified, true);
  });

  it("rejects extra fields and protected literals in any candidate field", () => {
    const extra = fixture();
    extra.accidental_secret = testSecret;
    assert.throws(() => sanitize(extra), /keys are not exact/);
    const secretId = fixture();
    secretId.provider_message_ids[0] = testSecret;
    assert.throws(() => sanitize(secretId), /protected literal/);
    const sinkStatus = fixture();
    sinkStatus.provider_statuses[0] = sinkAddress;
    assert.throws(() => sanitize(sinkStatus), /protected literal/);
  });
});
