import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { evaluateProductionNoSpendSources } from "./production-no-spend-contract.mjs";

function readOptionalFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

function readSourceTree(root) {
  return readdirSync(root, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const path = `${root}/${entry.name}`;
      if (entry.isDirectory()) return [readSourceTree(path)];
      if (
        !entry.isFile() ||
        !/\.[cm]?[jt]sx?$/.test(entry.name) ||
        /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)
      ) {
        return [];
      }
      return [`// SOURCE: ${path}\n${readFileSync(path, "utf8")}`];
    })
    .join("\n");
}

function actualSources() {
  return {
    apiIndex: readFileSync("services/api/src/index.ts", "utf8"),
    aiHealthTest: readFileSync("services/api/src/ai-health.test.ts", "utf8"),
    productionE2E: readFileSync(
      "apps/app/e2e-production/go-live.spec.ts",
      "utf8",
    ),
    productionWorkflow: readFileSync(
      ".github/workflows/production-go-live-e2e.yml",
      "utf8",
    ),
    appAiClient: [
      readOptionalFile("apps/app/app/workspace/api/gateway.ts"),
      readOptionalFile("apps/app/app/workspace/api/aiagent.ts"),
    ].join("\n"),
    appAiChat: readOptionalFile(
      "apps/app/app/workspace/components/AIChatPanel.tsx",
      "utf8",
    ),
    appSettings: readOptionalFile(
      "apps/app/app/workspace/components/SettingsPanel.tsx",
      "utf8",
    ),
    appAccount: readOptionalFile(
      "apps/app/app/workspace/components/AccountPanel.tsx",
      "utf8",
    ),
    appModelPicker: readOptionalFile(
      "apps/app/app/workspace/components/ModelPicker.tsx",
      "utf8",
    ),
    appCommandPalette: readOptionalFile(
      "apps/app/app/ai/AICommandPalette.tsx",
      "utf8",
    ),
    coreIndex: readOptionalFile("packages/core/src/index.ts"),
    coreModelRouter: readOptionalFile("packages/core/src/model-router.ts"),
    coreAgentOrchestrator: readOptionalFile(
      "packages/core/src/agent-orchestrator.ts",
    ),
    workerAiTask: readOptionalFile(
      "infra/services/worker/src/jobs/ai-task.js",
      "utf8",
    ),
    workerCodeReview: readOptionalFile(
      "infra/services/worker/src/jobs/code-review.js",
      "utf8",
    ),
    workerAiagentClient: readOptionalFile(
      "infra/services/worker/src/lib/aiagent.js",
    ),
    appSourceTree: [readSourceTree("apps/app/app"), readSourceTree("apps/app/lib")].join(
      "\n",
    ),
    apiAiagentClient: [
      readOptionalFile("services/api/src/aiagent-client.ts"),
      readOptionalFile("services/api/src/aiagent.ts"),
    ].join("\n"),
    apiAiConnectors: readOptionalFile("services/api/src/ai-connectors.ts"),
    apiContracts: readOptionalFile("services/api/src/contracts.ts"),
    apiWrangler: readOptionalFile("services/api/wrangler.toml"),
    apiDeployWorkflow: readOptionalFile(".github/workflows/deploy.yml"),
    webHeaders: readOptionalFile("apps/web/public/_headers"),
    appHeaders: readOptionalFile("apps/app/public/_headers"),
    appApiTransport: readOptionalFile("apps/app/lib/api-client.ts"),
  };
}

function assertCheckFails(sources, id) {
  const result = evaluateProductionNoSpendSources(sources);
  assert.equal(result.accepted, false);
  assert.equal(
    result.checks.find((check) => check.id === id)?.pass,
    false,
    `${id} unexpectedly accepted the mutation`,
  );
}

function replaceRequired(source, needle, replacement) {
  assert.ok(source.includes(needle), `mutation anchor missing: ${needle}`);
  return source.replace(needle, replacement);
}

describe("production no-spend source contract", () => {
  it("accepts the AIAGENT-only configuration route and disabled direct model endpoint", () => {
    const result = evaluateProductionNoSpendSources(actualSources());
    assert.equal(result.accepted, true, JSON.stringify(result.checks));
  });

  it("rejects restoration of the legacy direct-provider implementation", () => {
    const sources = actualSources();
    sources.apiIndex = sources.apiIndex.replace(
      "// ── AIAGENT authority boundary",
      'import { aiCompleteWithFallback } from "./ai-connectors";\n// ── AIAGENT authority boundary',
    );
    const result = evaluateProductionNoSpendSources(sources);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "DIRECT_UPSTREAM_EXECUTION_DISABLED",
      )?.pass,
      false,
    );
  });

  it("rejects a transitive provider fetch added to the health route", () => {
    const sources = actualSources();
    sources.apiIndex = sources.apiIndex.replace(
      "// This route is read-only configuration health.",
      'await fetch("https://provider.invalid");\n  // This route is read-only configuration health.',
    );
    const result = evaluateProductionNoSpendSources(sources);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find((check) => check.id === "HEALTH_ROUTE_CONFIGURATION_ONLY")
        ?.pass,
      false,
    );
  });

  it("rejects removal of the pre-network browser abort", () => {
    const sources = actualSources();
    sources.productionE2E = sources.productionE2E.replace(
      'await route.abort("blockedbyclient")',
      "await route.continue()",
    );
    const result = evaluateProductionNoSpendSources(sources);
    assert.equal(result.accepted, false);
  });

  it("rejects a no-spend guard that watches only the disabled legacy route", () => {
    const sources = actualSources();
    sources.productionE2E = replaceRequired(
      sources.productionE2E,
      'new URL("/v1/ai/chat", production.apiUrl)',
      'new URL("/v1/ai/complete", production.apiUrl)',
    );
    assertCheckFails(sources, "BROWSER_BLOCKS_MODEL_ENDPOINT");
  });

  it("rejects a browser client whose OMDALA API authority can be redirected", () => {
    const sources = actualSources();
    sources.appAiClient +=
      '\nconst attackerControlledAiOrigin = "https://attacker.invalid";\n';
    assertCheckFails(sources, "WEB_AI_AUTHENTICATED_OMDALA_API_ONLY");
  });

  it("rejects a provider bearer credential introduced into browser code", () => {
    const sources = actualSources();
    const injected =
      '\nconst leaked = sessionStorage.getItem("sk-aiagent-credential");\n' +
      'const headers = { Authorization: `Bearer ${leaked}` };\n';
    sources.appAiClient += injected;
    sources.appSourceTree += injected;
    assertCheckFails(sources, "WEB_AI_NO_BROWSER_PROVIDER_CREDENTIAL");
  });

  it("rejects browser forwarding of an internal authority header", () => {
    const sources = actualSources();
    const injected =
      '\nconst forgedAuthority = { "X-Tenant-ID": "attacker-tenant" };\n';
    sources.appAiClient += injected;
    sources.appSourceTree += injected;
    assertCheckFails(sources, "WEB_AI_NO_BROWSER_PROVIDER_CREDENTIAL");
  });

  it("rejects an environment-unbound OMDALA API transport", () => {
    const sources = actualSources();
    sources.appApiTransport = sources.appApiTransport.replaceAll(
      "resolvePublicOrigin",
      "uncheckedPublicOrigin",
    );
    assertCheckFails(sources, "WEB_AI_API_ORIGIN_ENVIRONMENT_BOUND");
  });

  it("rejects restoration of modelRouter anywhere in the shipped App source tree", () => {
    const sources = actualSources();
    const injected = '\nvoid modelRouter.route({ model: "gpt-4o" });\n';
    sources.appAiChat += injected;
    sources.appSourceTree += injected;
    assertCheckFails(sources, "WEB_AI_SINGLE_EXECUTION_PATH");
  });

  it("rejects an OpenAI-compatible chat completion path in the App client", () => {
    const sources = actualSources();
    sources.appAiClient = replaceRequired(
      sources.appAiClient,
      "/v1/ai/chat",
      "/chat/completions",
    );
    assertCheckFails(sources, "WEB_AI_AUTHENTICATED_OMDALA_API_ONLY");
  });

  it("rejects an AIAGENT response path that stops binding the signed receipt", () => {
    const sources = actualSources();
    sources.appAiClient = sources.appAiClient.replaceAll(
      "receipt_id",
      "unsigned_result_id",
    );
    assertCheckFails(sources, "WEB_AI_RESPONSE_FAILS_CLOSED");
  });

  it("rejects a silent retry or provider fallback in the browser client", () => {
    const sources = actualSources();
    sources.appAiClient += "\nconst MAX_RETRIES = 2;\n";
    assertCheckFails(sources, "WEB_AI_RESPONSE_FAILS_CLOSED");
  });

  it("rejects an infra worker fallback to a direct provider endpoint", () => {
    const sources = actualSources();
    sources.workerAiagentClient +=
      "\nconst bypass = process.env.AI_API_URL || 'https://api.openai.com';\n";
    assertCheckFails(sources, "WORKER_AIAGENT_AUTHORITY_ONLY");
  });

  it("rejects an infra worker request without an idempotency key", () => {
    const sources = actualSources();
    sources.workerAiagentClient = sources.workerAiagentClient.replaceAll(
      "Idempotency-Key",
      "X-Unbound-Request",
    );
    assertCheckFails(sources, "WORKER_AIAGENT_AUTHORITY_ONLY");
  });

  it("rejects a server AIAGENT client without run readback reconciliation", () => {
    const sources = actualSources();
    sources.apiAiagentClient = sources.apiAiagentClient.replaceAll(
      "/v1/runs/",
      "/v1/unverified-runs/",
    );
    assertCheckFails(sources, "API_AIAGENT_CANONICAL_AUTHORITY");
  });

  it("rejects a server that forwards a request-controlled tenant selection", () => {
    const sources = actualSources();
    sources.apiAiagentClient = replaceRequired(
      sources.apiAiagentClient,
      'headers.set("X-Tenant-ID", AIAGENT_TENANT_ID)',
      'headers.set("X-Tenant-ID", input.tenantId)',
    );
    assertCheckFails(sources, "API_AIAGENT_CANONICAL_AUTHORITY");
  });

  it("rejects reintroducing a dormant direct-provider connector module", () => {
    const sources = actualSources();
    sources.apiAiConnectors =
      'export const direct = () => fetch("https://api.openai.com/v1/chat/completions");';
    assertCheckFails(sources, "DIRECT_PROVIDER_IMPLEMENTATIONS_ABSENT");
  });

  it("rejects browser CSP that permits direct AIAGENT egress", () => {
    const sources = actualSources();
    sources.appHeaders +=
      "\nContent-Security-Policy: connect-src 'self' https://api.aiagent.iai.one;\n";
    assertCheckFails(sources, "BROWSER_CSP_BLOCKS_PROVIDER_EGRESS");
  });

  it("rejects API deployment without the protected AIAGENT secret binding", () => {
    const sources = actualSources();
    sources.apiDeployWorkflow = sources.apiDeployWorkflow.replaceAll(
      "AIAGENT_API_KEY",
      "OMITTED_AIAGENT_SECRET",
    );
    assertCheckFails(sources, "API_AIAGENT_SECRET_AND_READBACK_RECEIPT");
  });

  it("rejects leaking the protected AIAGENT secret into the release receipt step", () => {
    const sources = actualSources();
    const marker = "        name: Write immutable API release receipt";
    sources.apiDeployWorkflow = replaceRequired(
      sources.apiDeployWorkflow,
      marker,
      `${marker}\n        env:\n          LEAKED_AIAGENT_KEY: \${{ secrets.OMDALA_AIAGENT_API_KEY }}`,
    );
    assertCheckFails(sources, "API_AIAGENT_SECRET_AND_READBACK_RECEIPT");
  });
});
