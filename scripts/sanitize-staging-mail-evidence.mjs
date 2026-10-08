import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SHA = /^[a-f0-9]{40}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const INPUT_KEYS = [
  "api_origin", "candidate_sha", "consumer_version_id", "created_at", "delivered_recipient_count",
  "delivery_mode", "original_recipient_count", "provider_message_count", "provider_message_ids",
  "provider_statuses", "schema_version", "sink_address_persisted", "sink_address_sha256",
  "sink_enforced", "verdict", "workspace_id",
].sort().join(",");

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function sanitizeStagingMailEvidence(evidence, rawBytes, { candidateSha, consumerVersionId, sinkAddress, testSecret }) {
  const normalizedSink = String(sinkAddress ?? "").trim().toLowerCase();
  invariant(SHA.test(candidateSha ?? ""), "Candidate SHA is invalid");
  invariant(UUID.test(consumerVersionId ?? ""), "Consumer version is invalid");
  invariant(normalizedSink.length > 0 && String(testSecret ?? "").length > 0, "Protected scan needles are missing");
  invariant(evidence && Object.keys(evidence).sort().join(",") === INPUT_KEYS, "Mail evidence keys are not exact");
  const serialized = rawBytes.toString("utf8");
  invariant(!serialized.includes(testSecret) && !serialized.toLowerCase().includes(normalizedSink), "Mail evidence contains protected literal material");
  invariant(
    evidence.schema_version === 1 && evidence.verdict === "STAGING_MAIL_SINK_ACCEPTED" &&
    evidence.candidate_sha === candidateSha && evidence.consumer_version_id === consumerVersionId &&
    evidence.api_origin === "https://api-staging.omdala.com" &&
    evidence.workspace_id === "omdala.com-staging" && evidence.delivery_mode === "sink" &&
    evidence.sink_enforced === true && evidence.sink_address_persisted === false &&
    evidence.sink_address_sha256 === digest(Buffer.from(normalizedSink)) &&
    evidence.provider_message_count === 5 && evidence.original_recipient_count === 5 &&
    evidence.delivered_recipient_count === 5 &&
    Array.isArray(evidence.provider_message_ids) && evidence.provider_message_ids.length === 5 &&
    evidence.provider_message_ids.every((value) => typeof value === "string" && value.trim().length > 0 && value.length <= 256) &&
    new Set(evidence.provider_message_ids).size === 5 &&
    Array.isArray(evidence.provider_statuses) && evidence.provider_statuses.length === 5 &&
    evidence.provider_statuses.every((value) => typeof value === "string" && value.trim().length > 0 && value.length <= 128) &&
    Number.isFinite(Date.parse(evidence.created_at ?? "")),
    "Mail evidence contract is invalid",
  );
  return {
    schema_version: 1,
    verdict: "STAGING_MAIL_SINK_ACCEPTED",
    candidate_sha: candidateSha,
    consumer_version_id: consumerVersionId,
    api_origin: "https://api-staging.omdala.com",
    workspace_id: "omdala.com-staging",
    delivery_mode: "sink",
    sink_enforced: true,
    sink_match_verified: true,
    provider_message_count: 5,
    original_recipient_count: 5,
    delivered_recipient_count: 5,
    sink_address_persisted: false,
    candidate_evidence_contract_verified: true,
    contains_secret_values: false,
    verified_at: new Date().toISOString(),
  };
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const input = option("--input");
  const output = option("--output");
  if (!input || !output) throw new Error("--input and --output are required");
  const bytes = readFileSync(input);
  const evidence = JSON.parse(bytes.toString("utf8"));
  const receipt = sanitizeStagingMailEvidence(evidence, bytes, {
    candidateSha: option("--candidate-sha"),
    consumerVersionId: option("--consumer-version-id"),
    sinkAddress: option("--sink-address"),
    testSecret: option("--test-secret"),
  });
  writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
