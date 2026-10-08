import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { aiagentConnectionForm } from "../src/provider-presets.mjs";
import { saveProvider } from "../server/providers.mjs";

test("browser settings contain no provider credential input or state", async () => {
  const source = await fs.readFile(
    new URL("../src/Settings.jsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /apiKey|API key|type=["']password["']/);
  assert.doesNotMatch(saveProvider.toString(), /secret\(["']set["']/);
});

for (const [environment, id, baseUrl] of [
  ["production", "aiagent", "https://api.aiagent.iai.one"],
  ["staging", "aiagent-staging", "https://staging-api.aiagent.iai.one"],
]) {
  test(`AIAGENT ${environment} form matches its dedicated credential account`, () => {
    const form = aiagentConnectionForm([], environment);
    assert.equal(form.id, id);
    assert.equal(form.baseUrl, baseUrl);
    assert.equal(form.kind, "iai-one");
    assert.equal(Object.hasOwn(form, "tenantId"), false);
    assert.equal(Object.hasOwn(form, "workspaceId"), false);
    assert.equal(Object.hasOwn(form, "apiKey"), false);
  });
  test(`AIAGENT ${environment} form preserves only its own non-secret connection metadata`, () => {
    const other = {
      id: id === "aiagent" ? "aiagent-staging" : "aiagent",
      baseUrl: "https://wrong.invalid",
      tenantId: "wrong",
    };
    const current = {
      id,
      baseUrl,
      tenantId: "tenant",
      workspaceId: "workspace",
      model: "fixture-model",
      apiKey: "do-not-copy",
    };
    const form = aiagentConnectionForm([other, current], environment);
    assert.equal(form.model, "fixture-model");
    assert.equal(Object.hasOwn(form, "tenantId"), false);
    assert.equal(Object.hasOwn(form, "workspaceId"), false);
    assert.equal(Object.hasOwn(form, "apiKey"), false);
    assert.equal(JSON.stringify(form).includes("do-not-copy"), false);
  });
  test(`AIAGENT ${environment} backend rejects destination/scope confusion before persistence or Keychain`, async () => {
    const data = new Map();
    let writes = 0;
    const store = {
      get: (key, fallback) => data.get(key) ?? fallback,
      set: (key, value) => {
        writes++;
        data.set(key, value);
      },
    };
    const valid = { id, baseUrl, kind: "iai-one" };
    for (const change of [
      { baseUrl: "https://not-aiagent.invalid" },
      {
        baseUrl:
          id === "aiagent"
            ? "https://staging-api.aiagent.iai.one"
            : "https://api.aiagent.iai.one",
      },
      { kind: "openai" },
      { tenantId: "browser-selected" },
      { workspaceId: "../other" },
    ]) {
      await assert.rejects(
        saveProvider(store, { ...valid, ...change }),
        /AIAGENT|authority/,
      );
      assert.equal(writes, 0);
    }
    await assert.rejects(
      saveProvider(store, { ...valid, apiKey: "must-not-reach-keychain" }),
      /không nhận credential/,
    );
    assert.equal(writes, 0);
    const saved = await saveProvider(store, valid);
    assert.equal(saved.id, id);
    assert.equal(saved.baseUrl, baseUrl);
    assert.equal(saved.tenantId, "omdala-com");
    assert.equal(saved.workspaceId, `omdala-com-${environment}`);
    assert.equal(writes, 1);
  });
}
test("unknown environment cannot silently fall back to production", () => {
  assert.throws(
    () => aiagentConnectionForm([], "preview"),
    /Unknown AIAGENT environment/,
  );
});
