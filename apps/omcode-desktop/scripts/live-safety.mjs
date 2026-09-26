import assert from "node:assert/strict";

export const LIVE_FILE = "hello-omcode.mjs";
export const LIVE_CONTENT = "console.log('OMCODE_LIVE_E2E_OK');\n";
export const LIVE_PROMPT =
  "Dựa trên README.md được đính kèm thủ công. Sau đó dùng propose_edit để đề xuất tạo đúng một file " +
  LIVE_FILE +
  " với đúng nội dung: " +
  JSON.stringify(LIVE_CONTENT) +
  ". Không tạo file khác, không chạy lệnh. Hãy cho biết đang chờ tôi duyệt.";

// No default provider, model, destination or permission to consume quota.
export function liveSelection(env = process.env) {
  const id = env.OMCODE_LIVE_PROVIDER_ID;
  const model = env.OMCODE_LIVE_MODEL;
  const baseUrl = env.OMCODE_LIVE_BASE_URL;
  assert.match(
    id || "",
    /^[a-zA-Z0-9_-]{1,80}$/,
    "Set OMCODE_LIVE_PROVIDER_ID explicitly.",
  );
  assert.ok(
    typeof model === "string" && model.length > 0 && model.length <= 160,
    "Set OMCODE_LIVE_MODEL explicitly.",
  );
  const url = new URL(baseUrl);
  assert.ok(
    url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash,
    "Live provider requires an explicit HTTPS endpoint.",
  );
  assert.equal(
    env.OMCODE_LIVE_CONSENT,
    "one-synthetic-generation",
    "Live E2E requires explicit consent for one synthetic generation and provider quota. No request sent.",
  );
  return { id, model, baseUrl: baseUrl.replace(/\/$/, "") };
}

export function selectLiveProvider(providers, selection) {
  const matches = providers.filter((p) => p.id === selection.id);
  assert.equal(
    matches.length,
    1,
    "Selected provider is absent or ambiguous; no fallback allowed.",
  );
  const provider = matches[0];
  assert.equal(
    provider.baseUrl,
    selection.baseUrl,
    "Live destination does not match the selected provider.",
  );
  assert.equal(
    provider.status,
    "connected",
    "Run the selected provider's connection check first.",
  );
  assert.ok(
    provider.catalog?.models?.includes(selection.model),
    "Selected chat model is not in the credential-bound catalog.",
  );
  return { ...provider, model: selection.model };
}

export function assertLiveProposal(message) {
  assert.equal(
    message?.role,
    "assistant",
    "Missing completed assistant message.",
  );
  assert.equal(
    message.proposals?.length,
    1,
    "Expected exactly one proposal; nothing will be applied.",
  );
  const proposal = message.proposals[0];
  assert.equal(proposal.type, "edit");
  assert.equal(proposal.status, "pending");
  assert.equal(
    proposal.path,
    LIVE_FILE,
    "Unexpected proposal path; nothing will be applied.",
  );
  assert.equal(
    proposal.content,
    LIVE_CONTENT,
    "Generated code is not the exact inert fixture; nothing will be applied.",
  );
  assert.equal(
    proposal.before,
    "",
    "Live fixture must create a new file only.",
  );
  assert.equal(
    message.toolReceipts?.length,
    1,
    "Unexpected tool calls; nothing will be applied.",
  );
  assert.equal(message.toolReceipts[0].name, "propose_edit");
  assert.equal(message.toolReceipts[0].ok, true);
  return proposal;
}

export function assertLiveBilling(billing) {
  assert.equal(
    billing?.verified,
    true,
    "Authenticated run/receipt read-back is not verified.",
  );
  assert.equal(
    billing.cost_status,
    "authoritative_reconciled",
    "Cost has not been reconciled.",
  );
  assert.equal(billing.billing_eligible, true);
  for (const field of ["request_id", "run_id", "receipt_id", "ledger_entry_id"])
    assert.ok(
      typeof billing[field] === "string" && billing[field].length > 0,
      `Missing ${field}.`,
    );
  assert.ok(
    Number.isFinite(billing.cost_usd) && billing.cost_usd >= 0,
    "Missing authoritative cost.",
  );
  return billing;
}
