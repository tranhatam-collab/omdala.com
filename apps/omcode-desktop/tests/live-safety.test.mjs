import test from "node:test";
import assert from "node:assert/strict";
import {
  liveSelection,
  selectLiveProvider,
  assertLiveProposal,
  assertLiveBilling,
  LIVE_CONTENT,
  LIVE_FILE,
} from "../scripts/live-safety.mjs";

const env = {
  OMCODE_LIVE_PROVIDER_ID: "aiagent",
  OMCODE_LIVE_MODEL: "iai-one/iris-3",
  OMCODE_LIVE_BASE_URL: "https://api.aiagent.iai.one",
  OMCODE_LIVE_CONSENT: "one-synthetic-generation",
};
const provider = {
  id: "aiagent",
  baseUrl: env.OMCODE_LIVE_BASE_URL,
  status: "connected",
  catalog: { models: [env.OMCODE_LIVE_MODEL] },
};
const proposal = () => ({
  role: "assistant",
  proposals: [
    {
      type: "edit",
      status: "pending",
      path: LIVE_FILE,
      content: LIVE_CONTENT,
      before: "",
    },
  ],
  toolReceipts: [{ name: "propose_edit", ok: true }],
});

test("live preflight has no implicit provider/model/destination/consent", () => {
  for (const field of Object.keys(env)) {
    const missing = { ...env };
    delete missing[field];
    assert.throws(() => liveSelection(missing));
  }
  assert.deepEqual(selectLiveProvider([provider], liveSelection(env)), {
    ...provider,
    model: env.OMCODE_LIVE_MODEL,
  });
});
test("live preflight never chooses another verified provider or an unavailable model", () => {
  assert.throws(() =>
    selectLiveProvider(
      [{ ...provider, id: "google", generationStatus: "verified" }],
      liveSelection(env),
    ),
  );
  assert.throws(() =>
    selectLiveProvider([provider, provider], liveSelection(env)),
  );
  assert.throws(() =>
    selectLiveProvider([provider], {
      ...liveSelection(env),
      model: "unavailable",
    }),
  );
  assert.throws(() =>
    selectLiveProvider(
      [{ ...provider, baseUrl: "https://elsewhere.invalid" }],
      liveSelection(env),
    ),
  );
  assert.throws(() =>
    selectLiveProvider([{ ...provider, status: "error" }], liveSelection(env)),
  );
});
test("live preflight rejects credentials in URLs, insecure targets and missing consent", () => {
  for (const baseUrl of [
    "http://127.0.0.1",
    "https://name:secret@example.invalid",
    "https://example.invalid/?token=x",
    "https://example.invalid/#fragment",
    "https://api.deepseek.com/v1",
    "https://api.openai.com/v1",
    "https://generativelanguage.googleapis.com/v1beta/openai",
  ])
    assert.throws(() =>
      liveSelection({ ...env, OMCODE_LIVE_BASE_URL: baseUrl }),
    );
  assert.throws(() => liveSelection({ ...env, OMCODE_LIVE_CONSENT: "yes" }));
});
test("live generation is inert before automatic fixture approval", () => {
  assert.equal(assertLiveProposal(proposal()).content, LIVE_CONTENT);
  for (const content of [
    LIVE_CONTENT + "process.exit(9);\n",
    "// OMCODE_LIVE_E2E_OK\nthrow Error('unsafe');",
    LIVE_CONTENT.trim(),
  ]) {
    const message = proposal();
    message.proposals[0].content = content;
    assert.throws(() => assertLiveProposal(message));
  }
});
test("live fixture rejects unexpected paths, extra proposals and forbidden tool calls", () => {
  for (const mutation of [
    (m) => (m.proposals[0].path = "../outside.mjs"),
    (m) => m.proposals.push({ type: "command", command: "echo unexpected" }),
    (m) => (m.proposals[0].before = "existing content"),
    (m) => m.toolReceipts.push({ name: "read_file", ok: false }),
    (m) => (m.toolReceipts[0].ok = false),
  ]) {
    const message = proposal();
    mutation(message);
    assert.throws(() => assertLiveProposal(message));
  }
});
test("live acceptance requires reconciled run, receipt and authoritative cost", () => {
  const billing = {
    verified: true,
    cost_status: "authoritative_reconciled",
    billing_eligible: true,
    cost_usd: 0,
    request_id: "request",
    run_id: "run",
    receipt_id: "receipt",
    ledger_entry_id: "ledger",
  };
  assert.equal(assertLiveBilling(billing), billing);
  for (const field of Object.keys(billing)) {
    const missing = { ...billing };
    delete missing[field];
    assert.throws(() => assertLiveBilling(missing));
  }
  for (const cost of [null, NaN, -1, "0"])
    assert.throws(() => assertLiveBilling({ ...billing, cost_usd: cost }));
});
