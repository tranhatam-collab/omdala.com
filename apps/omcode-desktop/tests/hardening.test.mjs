import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { createHash } from "node:crypto";
import { createStore } from "../server/store.mjs";
import { startServer } from "../server/index.mjs";
import { createAgent } from "../server/agent.mjs";
import { createApprovals } from "../server/approvals.mjs";
import {
  validateAttachments,
  assertSafeAttachmentPath,
} from "../server/attachment-policy.mjs";
import { assertEgressAllowed } from "../server/egress-policy.mjs";
import {
  checkProvider,
  completion,
  embedding,
  saveProvider,
  probeGeneration,
} from "../server/providers.mjs";
import { skillManifest, skillPrompt } from "../server/catalog.mjs";
import {
  startGatewayFixture,
  GATEWAY_CHAT_MODELS,
  GATEWAY_EMBED_MODELS,
} from "./fixtures/gateway-fixture.mjs";
const signal = () => new AbortController().signal;
const sha = (s) => createHash("sha256").update(s).digest("hex");
async function scratch(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "omcode-hardening-"));
  const project = path.join(root, "project");
  await fs.mkdir(project);
  const store = createStore(path.join(root, "state"));
  t.after(() => store.close());
  return { root, project, store };
}
async function gateway(t, options = {}) {
  const f = await startGatewayFixture({
    tenantId: "test-tenant",
    workspaceId: "test-workspace",
    ...options,
  });
  t.after(() => f.close());
  const { store } = await scratch(t);
  const old = process.env.OMCODE_TEST_API_KEY_GATEWAY;
  process.env.OMCODE_TEST_API_KEY_GATEWAY = "sk-aiagent-synthetic-only";
  t.after(() => {
    if (old === undefined) delete process.env.OMCODE_TEST_API_KEY_GATEWAY;
    else process.env.OMCODE_TEST_API_KEY_GATEWAY = old;
  });
  await saveProvider(store, {
    id: "gateway",
    name: "fixture",
    baseUrl: f.baseUrl,
    kind: "iai-one",
    model: GATEWAY_CHAT_MODELS[0],
    tenantId: "test-tenant",
    workspaceId: "test-workspace",
  });
  return { f, store, p: await checkProvider(store, "gateway") };
}
const probe = [{ role: "user", content: "Reply exactly OMCODE_OK" }];
test("all 17 chat and 2 embedding contract models execute with policy and unique identity", async (t) => {
  const { f, p } = await gateway(t);
  for (const model of GATEWAY_CHAT_MODELS) {
    const result = await completion({ ...p, model }, probe, [], signal());
    assert.equal(result.message.content, "OMCODE_OK");
    assert.equal(result.billing.verified, true);
  }
  for (const model of GATEWAY_EMBED_MODELS) {
    const data = await embedding({ ...p, model }, ["one", "two"]);
    assert.equal(data.embeddings.length, 2);
    assert.equal(data.billing.verified, true);
    assert.equal(data.billing.cost_status, "authoritative_reconciled");
  }
  const calls = f.state.requests.filter((r) =>
    ["/v1/ai/chat", "/v1/ai/embed"].includes(r.url),
  );
  assert.equal(calls.length, 19);
  assert.equal(new Set(calls.map((r) => r.requestId)).size, 19);
  for (const r of calls) {
    assert.equal(r.requestId, r.idempotencyKey);
    assert.equal(r.requestId, r.traceId);
    assert.equal(r.requestId, r.body.request_id);
    assert.equal(r.body.risk_level, "low");
    assert.equal(r.workspaceHeader, undefined);
    assert.equal(r.actorIdHeader, undefined);
    assert.equal(r.tierHeader, undefined);
    assert.equal(r.quotaHeader, undefined);
  }
});
for (const field of [
  "run_id",
  "receipt_id",
  "request_id",
  "model",
  "tenant_id",
  "workspace_id",
  "status",
])
  test(`billing fails closed on mismatched run ${field}`, async (t) => {
    const { p } = await gateway(t, {
      mutateRun: (run) => (run[field] = "wrong"),
    });
    await assert.rejects(
      completion(p, probe, [], signal()),
      /reconciliation|verification/,
    );
  });
for (const field of [
  "run_id",
  "receipt_id",
  "request_id",
  "model",
  "tenant_id",
  "workspace_id",
  "ledger_entry_id",
  "cost_usd",
  "billing_eligible",
])
  test(`billing fails closed on mismatched receipt ${field}`, async (t) => {
    const { p } = await gateway(t, {
      mutateReceipt: (r) => (r[field] = "wrong"),
    });
    await assert.rejects(
      completion(p, probe, [], signal()),
      /reconciliation|verification/,
    );
  });
test("incompatible contracts and unavailable models cannot enable a catalog", async (t) => {
  const { p } = await gateway(t, { contractVersion: "2.0.0" });
  assert.equal(p.status, "error");
  assert.equal(p.catalog, null);
});
test("generation is not retried after ambiguous provider failure", async (t) => {
  const { p, f } = await gateway(t, { failChat: true });
  await assert.rejects(completion(p, probe, [], signal()), /503/);
  assert.equal(
    f.state.requests.filter((r) => r.url === "/v1/ai/chat").length,
    1,
  );
});
test("success clears stale generation HTTP error; an account cannot change AIAGENT environment", async (t) => {
  const { store, p } = await gateway(t);
  store.set("providers", [{ ...p, generationHttpStatus: 404 }]);
  const r = await probeGeneration(store, "gateway");
  assert.equal(r.generationStatus, "verified");
  assert.equal(r.generationHttpStatus, undefined);
  await assert.rejects(
    saveProvider(store, {
      ...p,
      baseUrl: "https://staging-api.aiagent.iai.one",
    }),
    /đúng tài khoản Keychain theo môi trường/,
  );
  await assert.rejects(
    completion({ ...p, workspaceId: "other" }, probe, [], signal()),
    /Catalog/,
  );
});
test("approval is single-use, expiring and bound to payload and destination", () => {
  const a = createApprovals();
  const p = a.prepare(
    "test",
    { destination: "https://safe.invalid", request: { text: "hello" } },
    { version: 1 },
  );
  assert.throws(
    () => a.consume("test", p.id, p.digest, { version: 2 }),
    /Xác nhận/,
  );
  assert.throws(
    () => a.consume("test", p.id, p.digest, { version: 1 }),
    /Xác nhận/,
  );
  const q = a.prepare(
    "test",
    { destination: "https://safe.invalid", request: {} },
    {},
  );
  a.consume("test", q.id, q.digest, {});
  assert.throws(() => a.consume("test", q.id, q.digest, {}), /Xác nhận/);
  const expired = a.prepare("test", {}, {});
  const now = Date.now;
  Date.now = () => now() + 300001;
  try {
    assert.throws(
      () => a.consume("test", expired.id, expired.digest, {}),
      /Xác nhận/,
    );
  } finally {
    Date.now = now;
  }
});
test("secret scanning catches later keys and structured values without exposing prefixes", () => {
  for (const value of [
    '{"api_key":"example-placeholder","token":"sk-aiagent-real-secret-value"}',
    { api_key: "sk-aiagent-real-secret-value" },
    "iai-svc-livecredential123456",
  ])
    assert.throws(() => assertEgressAllowed(value), /EGRESS_BLOCKED/);
});
test("sensitive names and ignore policies reject manually attached data", async (t) => {
  const { project } = await scratch(t);
  for (const file of [
    "service-account.json",
    "secrets.yaml",
    "terraform.tfstate",
    "private.pem",
    "id_custom",
    "wrangler.toml",
    ".env.production",
    "../outside",
  ])
    assert.throws(() => assertSafeAttachmentPath(file));
  await fs.writeFile(
    path.join(project, ".omcodeignore"),
    "private/**\n*.secret\n",
  );
  await fs.writeFile(path.join(project, ".gitignore"), "ignored.js\n");
  for (const file of ["private/note.md", "ignored.js", "test.secret"])
    await assert.rejects(
      validateAttachments(project, [{ path: file, content: "safe" }]),
      /loại|ignore/,
    );
  assert.equal(
    (
      await validateAttachments(project, [
        { path: "ok.js", content: "const ok = true;" },
      ])
    ).length,
    1,
  );
});
test("agent requires exact consent, sends only explicit attachments, never reads repo or calls MCP", async (t) => {
  const { project, store } = await scratch(t);
  await fs.writeFile(path.join(project, "private.txt"), "LOCAL_ONLY_SENTINEL");
  let sent;
  let count = 0;
  const fixture = http.createServer(async (req, res) => {
    let text = "";
    for await (const chunk of req) text += chunk;
    sent = JSON.parse(text);
    count++;
    res.end(
      JSON.stringify({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "x",
                  function: {
                    name: "read_file",
                    arguments: '{"path":"private.txt"}',
                  },
                },
                {
                  id: "y",
                  function: { name: "mcp_admin_delete", arguments: "{}" },
                },
              ],
            },
          },
        ],
      }),
    );
  });
  await new Promise((r) => fixture.listen(0, "127.0.0.1", r));
  t.after(
    () =>
      new Promise((r) => {
        fixture.close(r);
        fixture.closeAllConnections();
      }),
  );
  store.set("providers", [
    {
      id: "local",
      name: "Local",
      baseUrl: `http://127.0.0.1:${fixture.address().port}`,
      model: "model",
      models: ["model"],
    },
  ]);
  store.set("mcp", [
    {
      id: "admin",
      status: "connected",
      url: "https://example.invalid",
      tools: [{ name: "delete", readOnly: true }],
    },
  ]);
  const session = store.createSession(project);
  const agent = createAgent(store);
  t.after(() => agent.close());
  const input = {
    sessionId: session.id,
    providerId: "local",
    prompt: "Read repository",
    attachments: [{ path: "manual.txt", content: "MANUAL_SENTINEL" }],
  };
  assert.throws(() => agent.start(input), /xác nhận/);
  let preview = await agent.prepare(input);
  assert.equal(count, 0);
  assert.ok(!JSON.stringify(preview.request).includes("LOCAL_ONLY_SENTINEL"));
  assert.ok(JSON.stringify(preview.request).includes("MANUAL_SENTINEL"));
  assert.deepEqual(
    preview.request.body.tools.map((t) => t.function.name),
    ["propose_edit", "propose_command"],
  );
  store.saveSession({
    ...session,
    messages: [{ role: "user", content: "changed history" }],
  });
  assert.throws(
    () => agent.start({ approvalId: preview.id, digest: preview.digest }),
    /thay đổi/,
  );
  preview = await agent.prepare(input);
  const { id } = agent.start({
    approvalId: preview.id,
    digest: preview.digest,
  });
  for (let i = 0; i < 100 && agent.get(id).status === "running"; i++)
    await new Promise((r) => setTimeout(r, 20));
  const run = agent.get(id);
  assert.equal(run.status, "completed");
  assert.equal(count, 1);
  assert.ok(run.toolReceipts.every((r) => !r.ok));
  assert.equal(JSON.stringify(sent).includes("LOCAL_ONLY_SENTINEL"), false);
  assert.throws(
    () => agent.start({ approvalId: preview.id, digest: preview.digest }),
    /xác nhận/,
  );
});
test("skills require full-tree review and invalidate on an asset change", async (t) => {
  const { root, store } = await scratch(t);
  const skill = path.join(root, "skill");
  await fs.mkdir(skill);
  await fs.writeFile(path.join(skill, "SKILL.md"), "# Safe skill\n");
  await fs.writeFile(path.join(skill, "script.js"), "console.log(1)");
  const manifest = await skillManifest(skill);
  store.set("skills", [{ id: "skill", path: skill, digest: manifest.digest }]);
  await assert.rejects(skillPrompt(store, ["skill"]), /chưa được duyệt/);
  store.set("skills", [
    {
      id: "skill",
      path: skill,
      digest: manifest.digest,
      reviewedDigest: manifest.digest,
    },
  ]);
  assert.match(await skillPrompt(store, ["skill"]), /Safe/);
  await fs.writeFile(path.join(skill, "script.js"), "console.log(2)");
  await assert.rejects(skillPrompt(store, ["skill"]), /đã thay đổi/);
});
test("failed writes create no committed history; restart marks unfinished writes interrupted", async (t) => {
  const { root, project } = await scratch(t);
  const state = path.join(root, "http-state");
  const r = await startServer({ dataDirectory: state });
  t.after(() => r.close());
  r.store.set("projects", [{ root: project }]);
  await fs.writeFile(path.join(project, "a.js"), "old");
  const request = async (route, body) => {
    const response = await fetch(r.origin + "/api/" + route, {
      method: "POST",
      headers: {
        authorization: "Bearer " + r.token,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  };
  const failed = await request("file", {
    root: project,
    path: "a.js",
    content: "x".repeat(2097153),
    expectedHash: sha("old"),
  });
  assert.equal(failed.status, 400);
  assert.equal(r.store.edits(project).length, 0);
  assert.equal(r.store.exportData().edits[0].state, "failed");
  const cleared = await request("data/clear", {});
  assert.equal(cleared.status, 400);
  const preview = (await request("data/prepare-clear", {})).data;
  assert.equal(
    (
      await request("data/clear", {
        approvalId: preview.id,
        digest: preview.digest,
      })
    ).status,
    200,
  );
  assert.equal(await fs.readFile(path.join(project, "a.js"), "utf8"), "old");
  assert.equal(r.store.exportData().edits.length, 0);
  const dir = path.join(root, "recovery");
  let st = createStore(dir);
  const id = st.recordEdit(project, "a.js", "old", "new");
  st.close();
  st = createStore(dir);
  assert.equal(st.edit(id).state, "interrupted");
  assert.equal(st.edits(project).length, 0);
  st.close();
});

test("embedding-only catalog works and unavailable models are excluded", async (t) => {
  const { p } = await gateway(t, {
    models: [
      { id: "iai-one/echo-mini", status: "available", capabilities: ["embed"] },
      {
        id: "iai-one/disabled-chat",
        status: "unavailable",
        capabilities: ["chat"],
      },
    ],
  });
  assert.equal(p.status, "connected");
  assert.deepEqual(p.models, []);
  assert.deepEqual(p.embeddingModels, ["iai-one/echo-mini"]);
  assert.equal(
    (await embedding({ ...p, model: "iai-one/echo-mini" }, "synthetic text"))
      .embeddings.length,
    1,
  );
});
test("AIAGENT full chat URL is normalized instead of producing a duplicate endpoint path", async (t) => {
  const { store } = await scratch(t);
  const p = await saveProvider(store, {
    id: "aiagent",
    name: "AIAGENT",
    baseUrl: "https://api.aiagent.iai.one/v1/ai/chat",
    kind: "iai-one",
  });
  assert.equal(p.baseUrl, "https://api.aiagent.iai.one");
  assert.equal(p.kind, "iai-one");
  assert.equal(p.tenantId, "omdala-com");
  assert.equal(p.workspaceId, "omdala-com-production");
});
