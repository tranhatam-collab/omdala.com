import test from "node:test";
import assert from "node:assert/strict";
import { requestJSON, apiTimeout } from "../src/request.mjs";

function stalled(_url, { signal }) {
  return new Promise((_, reject) => {
    if (signal.aborted) return reject(signal.reason);
    signal.addEventListener("abort", () => reject(signal.reason), {
      once: true,
    });
  });
}
test("local fetch preserves the Window receiver required by native WKWebView", async () => {
  const result = await requestJSON("bootstrap", undefined, {
    fetchImpl: function () {
      assert.equal(this, globalThis);
      return Promise.resolve(Response.json({ ok: true }));
    },
  });
  assert.deepEqual(result, { ok: true });
});
test("local API timeouts are bounded and do not retry an ambiguous mutation", async () => {
  let count = 0;
  await assert.rejects(
    requestJSON(
      "provider/probe",
      { id: "fixture" },
      {
        timeoutMs: 15,
        fetchImpl: (...args) => {
          count++;
          return stalled(...args);
        },
      },
    ),
    /Kiểm tra trạng thái trước khi thử lại/,
  );
  assert.equal(count, 1);
});
test("a stalled file request releases the caller and a subsequent read can recover", async () => {
  await assert.rejects(
    requestJSON("files?root=fixture", undefined, {
      timeoutMs: 15,
      fetchImpl: stalled,
    }),
    /quá thời gian/,
  );
  assert.deepEqual(
    await requestJSON("files?root=fixture", undefined, {
      fetchImpl: async () => Response.json({ entries: [] }),
    }),
    { entries: [] },
  );
});
test("request deadline also covers stalled response bodies", async () => {
  await assert.rejects(
    requestJSON("bootstrap", undefined, {
      timeoutMs: 15,
      fetchImpl: async (_url, options) => ({
        ok: true,
        json: () => stalled(_url, options),
      }),
    }),
    /quá thời gian/,
  );
});
test("caller cancellation remains effective and is not misreported as a timeout", async () => {
  const controller = new AbortController();
  controller.abort(new Error("Caller cancelled"));
  await assert.rejects(
    requestJSON("bootstrap", undefined, {
      signal: controller.signal,
      fetchImpl: stalled,
    }),
    /Caller cancelled/,
  );
});
test("local API forwards capability token and propagates business failures", async () => {
  await assert.rejects(
    requestJSON(
      "file",
      { path: "fixture" },
      {
        token: "local-token",
        fetchImpl: async (_url, options) => {
          assert.equal(options.headers.Authorization, "Bearer local-token");
          assert.equal(options.method, "POST");
          assert.deepEqual(JSON.parse(options.body), { path: "fixture" });
          return Response.json({ error: "Conflict fixture" }, { status: 409 });
        },
      },
    ),
    /Conflict fixture/,
  );
  for (const route of [
    "bootstrap",
    "files",
    "file",
    "agent/prepare",
    "provider/check",
    "provider/probe",
    "embedding/run",
    "terminal",
    "mcp/check",
  ])
    assert.ok(apiTimeout(route) > 0 && apiTimeout(route) <= 130000);
});
