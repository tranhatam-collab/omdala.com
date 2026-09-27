import http from "node:http";

// aiagent.iai.one gateway fixture: 19-model catalog (17 chat + 2 embedding),
// /v1/ai/chat, /v1/runs/{id}, /v1/ai/verify. Mirrors the provider contract
// shape without touching live infrastructure.

export const GATEWAY_CHAT_MODELS = [
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
];
export const GATEWAY_EMBED_MODELS = ["iai-one/echo-mini", "iai-one/echo-xl"];

function modelEntry(id) {
  const embed = GATEWAY_EMBED_MODELS.includes(id);
  return {
    id,
    status: "available",
    family: id.split("/")[1].split("-")[0],
    capabilities: embed ? ["embed"] : ["chat", "streaming", "tools"],
  };
}

export function gatewayCatalog() {
  const models = [...GATEWAY_CHAT_MODELS, ...GATEWAY_EMBED_MODELS].map(
    modelEntry,
  );
  return {
    authority: "aiagent.iai.one",
    schema_version: "1.0.0",
    namespace: "iai-one",
    tier: "business",
    count: models.length,
    models,
  };
}

export function startGatewayFixture(options = {}) {
  const state = {
    requests: [],
    runs: new Map(),
    receipts: new Map(),
    failVerify: options.failVerify || false,
    omitLedger: options.omitLedger || false,
  };
  const server = http.createServer(async (req, res) => {
    let input = "";
    for await (const chunk of req) input += chunk;
    const body = input ? JSON.parse(input) : {};
    const tenant = req.headers["x-tenant-id"] || "aiagent";
    const workspace = req.headers["x-workspace-id"] || "unknown";
    state.requests.push({
      url: req.url,
      body,
      tenant,
      workspace,
      requestId: req.headers["x-request-id"],
      idempotencyKey: req.headers["idempotency-key"],
    });
    res.setHeader("Content-Type", "application/json");
    const envelope = (data) =>
      JSON.stringify({
        ok: true,
        contract_version: options.contractVersion || "1.0.0",
        data,
      });
    if (req.url === "/v1/ai/models" && req.method === "GET")
      return res.end(
        envelope({
          ...gatewayCatalog(),
          models: options.models || gatewayCatalog().models,
        }),
      );
    if (
      ["/v1/ai/chat", "/v1/ai/verify", "/v1/ai/embed"].includes(req.url) &&
      (req.headers["x-actor-role"] !== "agent" ||
        req.headers["x-surface"] !== "agent" ||
        !body.task_type ||
        !body.risk_level ||
        !body.data_sensitivity)
    )
      return res.writeHead(403).end(
        JSON.stringify({
          ok: false,
          contract_version: "1.0.0",
          error: { code: "POLICY_CONTEXT_MISSING" },
        }),
      );
    if (
      ["/v1/ai/chat", "/v1/ai/embed"].includes(req.url) &&
      req.method === "POST"
    ) {
      const isEmbed = req.url === "/v1/ai/embed";
      if (!req.headers.authorization?.startsWith("Bearer "))
        return res
          .writeHead(401)
          .end(JSON.stringify({ code: "AUTH_REQUIRED" }));
      const runId = `run_${state.receipts.size + 1}`;
      const receiptId = `prc_${state.receipts.size + 1}`;
      const ledgerId = options.omitLedger
        ? null
        : `led_${state.receipts.size + 1}`;
      if (options.failChat) return res.writeHead(503).end("{}");
      const probe = body.messages?.some((m) =>
        m.content?.includes("OMCODE_OK"),
      );
      const hasToolResult = body.messages?.some((m) => m.role === "tool");
      const data = {
        model: body.model,
        provider: "iai-one",
        response: probe
          ? "OMCODE_OK"
          : hasToolResult
            ? "Đã chuẩn bị bản sửa. Chờ bạn áp dụng."
            : "",
        request_id: req.headers["x-request-id"] || `req_fixture`,
        tenant_id: tenant,
        workspace_id: workspace,
        usage: {
          input_tokens: 10,
          output_tokens: isEmbed ? 0 : 5,
          total_tokens: isEmbed ? 10 : 15,
        },
        cost_usd: 0.00042,
        estimated_cost_usd: 0.00042,
        cost_status: "authoritative_reconciled",
        cost_ledger_status: "reconciled",
        ledger_entry_id: ledgerId,
        billing_eligible: Boolean(ledgerId),
        receipt_id: receiptId,
        run_id: runId,
        finish_reason: "stop",
        task_type: isEmbed ? "embed" : "agent-task",
        tool_calls:
          probe || hasToolResult
            ? []
            : [
                {
                  id: "call-1",
                  name: "propose_edit",
                  arguments: {
                    path: "agent-result.js",
                    content: "console.log('OMCODE_E2E_OK');\n",
                    reason: "Kiểm thử luồng AI và xác nhận bản sửa.",
                  },
                },
              ],
      };
      if (isEmbed) {
        delete data.response;
        delete data.tool_calls;
        data.embeddings = (
          Array.isArray(body.input) ? body.input : [body.input]
        ).map(() => [0.25, 0.75]);
        data.dimensions = 2;
      }
      state.runs.set(runId, {
        run_id: runId,
        status: "success",
        model: body.model,
        request_id: data.request_id,
        tenant_id: tenant,
        workspace_id: workspace,
        receipt_id: receiptId,
      });
      state.receipts.set(receiptId, {
        receipt_id: receiptId,
        run_id: runId,
        request_id: data.request_id,
        model: body.model,
        provider: "fixture-upstream",
        tenant_id: tenant,
        workspace_id: workspace,
        ledger_entry_id: ledgerId,
        cost_usd: 0.00042,
        billing_eligible: Boolean(ledgerId),
        cost_ledger_status: "reconciled",
      });
      if (options.mutateRun) options.mutateRun(state.runs.get(runId));
      if (options.mutateReceipt)
        options.mutateReceipt(state.receipts.get(receiptId));
      return res.end(envelope(data));
    }
    const runMatch = req.url.match(/^\/v1\/runs\/([^/]+)$/);
    if (runMatch && req.method === "GET") {
      if (!req.headers.authorization?.startsWith("Bearer "))
        return res
          .writeHead(401)
          .end(JSON.stringify({ code: "AUTH_REQUIRED" }));
      const run = state.runs.get(runMatch[1]);
      if (!run)
        return res
          .writeHead(404)
          .end(JSON.stringify({ error: "Run not found" }));
      return res.end(JSON.stringify({ ok: true, run }));
    }
    if (req.url === "/v1/ai/verify" && req.method === "POST") {
      if (!req.headers.authorization?.startsWith("Bearer "))
        return res
          .writeHead(401)
          .end(JSON.stringify({ code: "AUTH_REQUIRED" }));
      if (state.failVerify)
        return res
          .writeHead(200)
          .end(envelope({ receipt_id: body.receipt_id, verified: false }));
      const receipt = state.receipts.get(body.receipt_id);
      if (!receipt)
        return res
          .writeHead(404)
          .end(JSON.stringify({ code: "RECEIPT_NOT_FOUND" }));
      return res.end(
        envelope({
          receipt_id: receipt.receipt_id,
          verified: true,
          receipt,
        }),
      );
    }
    res.writeHead(404).end(JSON.stringify({ error: "not found" }));
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve({
        server,
        state,
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        close: () =>
          new Promise((done) => {
            server.close(done);
            server.closeAllConnections();
          }),
      }),
    ),
  );
}
