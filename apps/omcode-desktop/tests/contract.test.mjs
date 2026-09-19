import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { createStore } from "../server/store.mjs";
import {
  checkProvider,
  completion,
  saveProvider,
  credentialFingerprint,
} from "../server/providers.mjs";
import {
  scanEgressText,
  assertEgressAllowed,
  EgressPolicyError,
} from "../server/egress-policy.mjs";
import {
  startGatewayFixture,
  GATEWAY_CHAT_MODELS,
  GATEWAY_EMBED_MODELS,
} from "./fixtures/gateway-fixture.mjs";

const signal = () => new AbortController().signal;
const KEY_ENV = "OMCODE_TEST_API_KEY_GATEWAY";
const KEY = "sk-aiagent-contract-test-key";

function withKey(value, fn) {
  const previous = process.env[KEY_ENV];
  process.env[KEY_ENV] = value;
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (previous === undefined) delete process.env[KEY_ENV];
      else process.env[KEY_ENV] = previous;
    });
}

async function tempStore() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "omcode-contract-"));
  return createStore(path.join(root, "state"));
}

test("egress policy blocks credential material in outbound payloads", () => {
  const blocked = [
    '{"api_key": "sk-aiagent-abcdef1234567890"}',
    'config:\n  password: "Sup3rSecretPassw0rd!!"\n  host: db',
    "token: ghp_abcdefghijklmnopqrstuvwxyz123456",
    'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"',
    "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA7",
    "api_key: AKIAIOSFODNN7EXAMPLE",
    "safe text ​with hidden char",
    `token = "xJ9${"aQ2ZmK8pL3vB7nR4tY6uI0oP".repeat(2)}wE1"`,
  ];
  for (const text of blocked) {
    const findings = scanEgressText(text);
    assert.ok(
      findings.length > 0,
      `expected block for: ${text.slice(0, 60)}`,
    );
  }
});

test("egress policy allows ordinary source and non-secret identifiers", () => {
  const allowed = [
    "export const sha = 'f54703feac11dc22f30fe88e8515cc57979566117fea9e6ee5bbfa20c8acf418';",
    "const id = '262d5b72-fb41-4a1c-9e00-20e87f923015';",
    'password: "your-password-here"',
    'api_key: "example_key_replace_me"',
    "const password = 'short';",
    "README with normal prose about secrets and tokens",
    "def get_token(): return settings.token",
    "Authorization required for this endpoint",
  ];
  for (const text of allowed) {
    assert.deepEqual(
      scanEgressText(text),
      [],
      `unexpected block for: ${text.slice(0, 60)}`,
    );
  }
});

test("egress findings never leak the secret value", () => {
  const secretValue = "sk-aiagent-abcdef1234567890ZYXWVU";
  let error;
  try {
    assertEgressAllowed({ messages: [{ role: "user", content: secretValue }] });
  } catch (e) {
    error = e;
  }
  assert.ok(error instanceof EgressPolicyError);
  assert.equal(error.code, "EGRESS_BLOCKED");
  assert.ok(!error.message.includes(secretValue));
  for (const finding of error.findings)
    assert.ok(!finding.preview.includes(secretValue));
});

test("completion enforces egress before any provider request", async (t) => {
  let count = 0;
  const fixture = http.createServer((req, res) => {
    count++;
    res.end("{}");
  });
  await new Promise((resolve) => fixture.listen(0, "127.0.0.1", resolve));
  t.after(() => fixture.close());
  const provider = {
    id: "egress-fixture",
    name: "fixture",
    kind: "openai",
    baseUrl: `http://127.0.0.1:${fixture.address().port}`,
    model: "fixture-model",
    models: ["fixture-model"],
  };
  await assert.rejects(
    completion(
      provider,
      [{ role: "user", content: 'send {"api_key": "sk-aiagent-leakedkey12345"}' }],
      [],
      signal(),
    ),
    /EGRESS_BLOCKED/,
  );
  assert.equal(count, 0, "no request may leave the process");
});

test("gateway catalog binds to credential fingerprint and revision", async (t) => {
  const fixture = await startGatewayFixture();
  t.after(() => fixture.close());
  const store = await tempStore();
  await withKey(KEY, async () => {
    await saveProvider(store, {
      id: "gateway",
      name: "IAI One",
      baseUrl: fixture.baseUrl,
      kind: "iai-one",
      model: "iai-one/iris-3",
      tenantId: "omcode-test",
      workspaceId: "omcode-ws",
    });
    const checked = await checkProvider(store, "gateway");
    assert.equal(checked.status, "connected");
    assert.equal(checked.models.length, GATEWAY_CHAT_MODELS.length);
    assert.equal(checked.embeddingModels.length, GATEWAY_EMBED_MODELS.length);
    assert.equal(
      checked.catalog.fingerprint,
      credentialFingerprint(KEY),
    );
    assert.equal(checked.catalog.revision, 0);

    const providers = store.get("providers", []);
    const provider = providers.find((p) => p.id === "gateway");
    const result = await completion(
      provider,
      [
        { role: "user", content: "hi" },
        { role: "tool", tool_call_id: "x", content: "{}" },
      ],
      [],
      signal(),
    );
    assert.equal(result.message.content, "Đã chuẩn bị bản sửa. Chờ bạn áp dụng.");
  });
});

test("catalog invalidates when the credential changes", async (t) => {
  const fixture = await startGatewayFixture();
  t.after(() => fixture.close());
  const store = await tempStore();
  await saveProvider(store, {
    id: "gateway",
    name: "IAI One",
    baseUrl: fixture.baseUrl,
    kind: "iai-one",
    model: "iai-one/iris-3",
    tenantId: "omcode-test",
    workspaceId: "omcode-ws",
  });
  await withKey(KEY, async () => {
    await checkProvider(store, "gateway");
  });
  await withKey("sk-aiagent-rotated-key-999", async () => {
    const provider = store
      .get("providers", [])
      .find((p) => p.id === "gateway");
    await assert.rejects(
      completion(provider, [{ role: "user", content: "hi" }], [], signal()),
      /Catalog chưa gắn với credential hiện tại/,
    );
  });
});

test("catalog invalidates when credential revision bumps", async (t) => {
  const fixture = await startGatewayFixture();
  t.after(() => fixture.close());
  const store = await tempStore();
  await withKey(KEY, async () => {
    await saveProvider(store, {
      id: "gateway",
      name: "IAI One",
      baseUrl: fixture.baseUrl,
      kind: "iai-one",
      model: "iai-one/iris-3",
      tenantId: "omcode-test",
      workspaceId: "omcode-ws",
    });
    await checkProvider(store, "gateway");
    const providers = store.get("providers", []);
    const provider = providers.find((p) => p.id === "gateway");
    provider.credentialRevision = 1;
    store.set("providers", providers);
    await assert.rejects(
      completion(provider, [{ role: "user", content: "hi" }], [], signal()),
      /Catalog chưa gắn với credential hiện tại/,
    );
    // Re-checking with the same key rebinds at the new revision.
    const rechecked = await checkProvider(store, "gateway");
    assert.equal(rechecked.catalog.revision, 1);
    const result = await completion(
      rechecked,
      [
        { role: "user", content: "hi" },
        { role: "tool", tool_call_id: "x", content: "{}" },
      ],
      [],
      signal(),
    );
    assert.ok(result.message.content);
  });
});

test("a failed provider check invalidates the previous catalog", async (t) => {
  const fixture = await startGatewayFixture();
  const store = await tempStore();
  await withKey(KEY, async () => {
    await saveProvider(store, {
      id: "gateway",
      name: "IAI One",
      baseUrl: fixture.baseUrl,
      kind: "iai-one",
      model: "iai-one/iris-3",
      tenantId: "omcode-test",
      workspaceId: "omcode-ws",
    });
    await checkProvider(store, "gateway");
    assert.ok(
      store.get("providers", []).find((p) => p.id === "gateway").catalog,
    );
    await fixture.close();
    const failed = await checkProvider(store, "gateway");
    assert.equal(failed.status, "error");
    assert.equal(failed.catalog, null);
    await assert.rejects(
      completion(failed, [{ role: "user", content: "hi" }], [], signal()),
      /Catalog chưa gắn/,
    );
  });
});

test("model fallback stays inside the credential-verified catalog", async (t) => {
  const fixture = await startGatewayFixture();
  t.after(() => fixture.close());
  const store = await tempStore();
  await withKey(KEY, async () => {
    await saveProvider(store, {
      id: "gateway",
      name: "IAI One",
      baseUrl: fixture.baseUrl,
      kind: "iai-one",
      model: "iai-one/iris-3",
      tenantId: "omcode-test",
      workspaceId: "omcode-ws",
    });
    const checked = await checkProvider(store, "gateway");
    checked.model = "iai-one/not-in-catalog";
    await assert.rejects(
      completion(checked, [{ role: "user", content: "hi" }], [], signal()),
      /không nằm trong catalog đã xác minh/,
    );
  });
});

test("billing requires ledger ID plus authenticated run/receipt read-back", async (t) => {
  const fixture = await startGatewayFixture();
  t.after(() => fixture.close());
  const store = await tempStore();
  await withKey(KEY, async () => {
    await saveProvider(store, {
      id: "gateway",
      name: "IAI One",
      baseUrl: fixture.baseUrl,
      kind: "iai-one",
      model: "iai-one/iris-3",
      tenantId: "omcode-test",
      workspaceId: "omcode-ws",
    });
    const provider = await checkProvider(store, "gateway");
    const result = await completion(
      provider,
      [
        { role: "user", content: "hi" },
        { role: "tool", tool_call_id: "x", content: "{}" },
      ],
      [],
      signal(),
    );
    const billing = result.billing;
    assert.equal(billing.verified, true);
    assert.equal(billing.receipt_id, "prc_1");
    assert.equal(billing.run_id, "run_1");
    assert.equal(billing.ledger_entry_id, "led_1");
    assert.equal(billing.cost_usd, 0.00042);
    assert.equal(billing.cost_status, "authoritative_reconciled");
    assert.equal(billing.billing_eligible, true);
    // Read-back must have hit the authenticated endpoints.
    const urls = fixture.state.requests.map((r) => r.url);
    assert.ok(urls.includes("/v1/runs/run_1"));
    assert.ok(urls.includes("/v1/ai/verify"));
  });
});

test("unverified read-back never reports billable cost", async (t) => {
  const fixture = await startGatewayFixture({ failVerify: true });
  t.after(() => fixture.close());
  const store = await tempStore();
  await withKey(KEY, async () => {
    await saveProvider(store, {
      id: "gateway",
      name: "IAI One",
      baseUrl: fixture.baseUrl,
      kind: "iai-one",
      model: "iai-one/iris-3",
      tenantId: "omcode-test",
      workspaceId: "omcode-ws",
    });
    const provider = await checkProvider(store, "gateway");
    const result = await completion(
      provider,
      [
        { role: "user", content: "hi" },
        { role: "tool", tool_call_id: "x", content: "{}" },
      ],
      [],
      signal(),
    );
    assert.equal(result.billing.verified, false);
    assert.equal(result.billing.cost_usd, null);
    assert.equal(result.billing.cost_status, "readback_failed");
    assert.ok(result.billing.readback_error);
  });
});

test("missing ledger entry keeps cost non-billable even when read-back verifies", async (t) => {
  const fixture = await startGatewayFixture({ omitLedger: true });
  t.after(() => fixture.close());
  const store = await tempStore();
  await withKey(KEY, async () => {
    await saveProvider(store, {
      id: "gateway",
      name: "IAI One",
      baseUrl: fixture.baseUrl,
      kind: "iai-one",
      model: "iai-one/iris-3",
      tenantId: "omcode-test",
      workspaceId: "omcode-ws",
    });
    const provider = await checkProvider(store, "gateway");
    const result = await completion(
      provider,
      [
        { role: "user", content: "hi" },
        { role: "tool", tool_call_id: "x", content: "{}" },
      ],
      [],
      signal(),
    );
    assert.equal(result.billing.verified, true);
    assert.equal(result.billing.ledger_entry_id, null);
    assert.equal(result.billing.cost_usd, null);
    assert.equal(result.billing.cost_status, "no_ledger_not_billable");
  });
});

test("gateway without a credential fails closed before egress", async (t) => {
  const fixture = await startGatewayFixture();
  t.after(() => fixture.close());
  const store = await tempStore();
  await saveProvider(store, {
    id: "gateway",
    name: "IAI One",
    baseUrl: fixture.baseUrl,
    kind: "iai-one",
    model: "iai-one/iris-3",
  });
  const provider = store
    .get("providers", [])
    .find((p) => p.id === "gateway");
  const previous = process.env[KEY_ENV];
  delete process.env[KEY_ENV];
  const previousGlobal = process.env.OMCODE_TEST_API_KEY;
  delete process.env.OMCODE_TEST_API_KEY;
  try {
    await assert.rejects(
      completion(provider, [{ role: "user", content: "hi" }], [], signal()),
      /Chưa có API key/,
    );
    assert.equal(
      fixture.state.requests.filter((r) => r.url === "/v1/ai/chat").length,
      0,
    );
  } finally {
    if (previous !== undefined) process.env[KEY_ENV] = previous;
    if (previousGlobal !== undefined)
      process.env.OMCODE_TEST_API_KEY = previousGlobal;
  }
});

test("catalog fixture exposes 17 chat models and excludes exactly 2 embedding models", async (t) => {
  const fixture = await startGatewayFixture();
  t.after(() => fixture.close());
  const store = await tempStore();
  await withKey(KEY, async () => {
    await saveProvider(store, {
      id: "gateway",
      name: "IAI One",
      baseUrl: fixture.baseUrl,
      kind: "iai-one",
      model: "iai-one/iris-3",
      tenantId: "omcode-test",
      workspaceId: "omcode-ws",
    });
    const checked = await checkProvider(store, "gateway");
    assert.equal(checked.models.length, 17);
    assert.equal(checked.embeddingModels.length, 2);
    for (const id of GATEWAY_CHAT_MODELS)
      assert.ok(checked.models.includes(id));
    for (const id of GATEWAY_EMBED_MODELS) {
      assert.ok(!checked.models.includes(id));
      assert.ok(checked.embeddingModels.includes(id));
    }
  });
});
