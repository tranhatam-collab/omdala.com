import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function routeBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  return start >= 0 && end > start ? source.slice(start, end) : "";
}

function workflowStep(source, name) {
  const markers = [`      - name: ${name}`, `        name: ${name}`];
  const start = markers
    .map((marker) => source.indexOf(marker))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0] ?? -1;
  if (start < 0) return "";
  const end = source.indexOf("\n      - ", start + name.length);
  return source.slice(start, end < 0 ? source.length : end);
}

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
  const entries = readdirSync(root, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  return entries
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

const DIRECT_PROVIDER_ORIGIN =
  /https?:\/\/(?:api\.openai\.com|api\.anthropic\.com|api\.groq\.com|api\.deepseek\.com|generativelanguage\.googleapis\.com)|https?:\/\/localhost:11434/i;
const DIRECT_PROVIDER_SECRET =
  /\b(?:OPENAI|ANTHROPIC|GEMINI|GOOGLE|GROQ|DEEPSEEK|OLLAMA)(?:_[A-Z0-9]+)*_(?:API_)?(?:KEY|TOKEN)\b/;
const LEGACY_COMPLETION_PATH = /\/chat\/completions\b/;
const AIAGENT_PROVIDER_ORIGIN =
  /https:\/\/(?:staging-)?api\.aiagent\.iai\.one\b/;
const ABSOLUTE_NETWORK_ORIGIN = /https?:\/\//i;
const BROWSER_AI_CREDENTIAL =
  /\bsessionStorage\b|\bsk-aiagent-|\bAIAGENT_API_KEY\b|\bCREDENTIAL_(?:KEY|PATTERN)\b|\bAuthorization\b|\bBearer\b|\bX-(?:Tenant-ID|Workspace-ID|Actor-Role|Surface)\b/i;
const MODEL_ROUTER_REFERENCE =
  /\bmodelRouter\b|\bModelRouter\b|["'][^"']*model-router["']|\b(?:init|get)AgentOrchestrator\b/;
const ARBITRARY_GATEWAY_AUTHORITY =
  /\bapiGatewayUrl\b|\b(?:setApiUrl|setGatewayUrl)\b|\b(?:baseUrl|apiUrl|gatewayUrl)\s*:\s*string\b|NEXT_PUBLIC_AIAGENT_(?:API_)?URL/;
const LEGACY_PROVIDER_CONFIGURATION =
  /\b(?:PROVIDERS|AI_PROVIDERS)\b|\bProviderKey\b|\bpreferLocal\b|\bcustomModels?\b|\bapplySettingsToRouter\b|\bsetProviderConfig\b|\b(?:apiKey|baseUrlPlaceholder)\b/;
const SILENT_AI_FALLBACK =
  /\bMAX_RETRIES\b|\bretries\s*=|gateway\s+fail|fallback\s+(?:local|provider)|catch\s*\([^)]*\)?\s*\{\s*return\s+null\b/i;

function hasForbiddenProviderExecution(source) {
  return (
    DIRECT_PROVIDER_ORIGIN.test(source) ||
    DIRECT_PROVIDER_SECRET.test(source) ||
    LEGACY_COMPLETION_PATH.test(source)
  );
}

export function evaluateProductionNoSpendSources({
  apiIndex,
  aiHealthTest,
  productionE2E,
  productionWorkflow,
  appAiClient = "",
  appAiChat = "",
  appSettings = "",
  appAccount = "",
  appModelPicker = "",
  appCommandPalette = "",
  coreIndex = "",
  coreModelRouter = "",
  coreAgentOrchestrator = "",
  workerAiTask = "",
  workerCodeReview = "",
  workerAiagentClient = "",
  appSourceTree = "",
  apiAiagentClient = "",
  apiAiConnectors = "",
  apiContracts = "",
  apiWrangler = "",
  apiDeployWorkflow = "",
  webHeaders = "",
  appHeaders = "",
  appApiTransport = "",
}) {
  const healthEndMarker = apiIndex.includes('app.get("/v1/ai/models"')
    ? 'app.get("/v1/ai/models"'
    : 'app.post("/v1/ai/complete"';
  const healthRoute = routeBlock(
    apiIndex,
    'app.get("/v1/ai/health"',
    healthEndMarker,
  );
  const completionRoute = routeBlock(
    apiIndex,
    'app.post("/v1/ai/complete"',
    "// ── Google OAuth",
  );
  const forbiddenHealthEgress =
    /\bfetch\s*\(|\baiComplete\w*\s*\(|\bcheckAiProviderHealth\s*\(|\.map\s*\(\s*async\b/;
  const appExecutionSources = [
    appAiChat,
    appSettings,
    appAccount,
    appModelPicker,
    appCommandPalette,
  ].join("\n");
  const workerExecutionSources = [
    workerAiTask,
    workerCodeReview,
    workerAiagentClient,
  ].join("\n");
  const browserCredentialSources = [
    appAiClient,
    appAiChat,
    appSettings,
    appAccount,
    appModelPicker,
    appCommandPalette,
  ].join("\n");
  const browserHeaders = [webHeaders, appHeaders].join("\n");
  const serverAuthoritySources = [
    apiAiagentClient,
    apiIndex,
    apiContracts,
    apiWrangler,
    apiDeployWorkflow,
  ].join("\n");
  const apiSecretBundleStep = workflowStep(
    apiDeployWorkflow,
    "Prepare protected API secret bundle",
  );
  const apiReleaseReceiptStep = workflowStep(
    apiDeployWorkflow,
    "Write immutable API release receipt",
  );
  const canonicalClientImport =
    /from\s+["'][^"']*\/api\/(?:gateway|aiagent)["']/;
  const appNetworkCallers = [appAiChat, appAccount, appCommandPalette].join(
    "\n",
  );
  const checks = [
    {
      id: "HEALTH_ROUTE_CONFIGURATION_ONLY",
      pass:
        healthRoute.includes("getAiagentAuthority") &&
        healthRoute.includes("modelCallExecuted: false") &&
        apiAiagentClient.includes('probe: "configuration-only"') &&
        apiAiagentClient.includes('provider: "aiagent"') &&
        apiAiagentClient.includes("directUpstreamAllowed: false") &&
        !forbiddenHealthEgress.test(healthRoute) &&
        !apiIndex.includes("checkAiProviderHealth"),
    },
    {
      id: "HEALTH_TEST_PROVES_ZERO_PROVIDER_EGRESS",
      pass:
        aiHealthTest.includes('vi.spyOn(globalThis, "fetch")') &&
        aiHealthTest.includes("expect(fetchSpy).not.toHaveBeenCalled()") &&
        aiHealthTest.includes("modelCallExecuted: false"),
    },
    {
      id: "DIRECT_UPSTREAM_EXECUTION_DISABLED",
      pass:
        completionRoute.includes('"direct_ai_disabled"') &&
        completionRoute.includes("501") &&
        !forbiddenHealthEgress.test(completionRoute) &&
        !apiIndex.includes('from "./ai-connectors"') &&
        !apiIndex.includes("aiCompleteWithFallback") &&
        !apiIndex.includes("discoverConnectors") &&
        aiHealthTest.includes('error: { code: "direct_ai_disabled" }') &&
        aiHealthTest.includes("expect(fetchSpy).not.toHaveBeenCalled()"),
    },
    {
      id: "BROWSER_BLOCKS_MODEL_ENDPOINT",
      pass:
        productionE2E.includes('new URL("/v1/ai/chat", production.apiUrl)') &&
        !productionE2E.includes(
          'new URL("/v1/ai/complete", production.apiUrl)',
        ) &&
        productionE2E.includes('await route.abort("blockedbyclient")') &&
        productionE2E.includes("expect(modelOrSpendRequestsObserved).toBe(0)") &&
        productionE2E.includes("PRODUCTION_NO_SPEND_RUNTIME_VERIFIED") &&
        productionE2E.includes("health_model_call_executed"),
    },
    {
      id: "WORKFLOW_BINDS_SOURCE_AND_RUNTIME_RECEIPTS",
      pass:
        productionWorkflow.includes(
          "node scripts/production-no-spend-contract.mjs production-no-spend-source.json",
        ) &&
        productionWorkflow.includes(
          "E2E_PRODUCTION_NO_SPEND_RECEIPT: production-no-spend-runtime.json",
        ) &&
        productionWorkflow.includes(
          "--no-spend-source-receipt production-no-spend-source.json",
        ) &&
        productionWorkflow.includes(
          "--no-spend-runtime-receipt production-no-spend-runtime.json",
        ),
    },
    {
      id: "WEB_AI_AUTHENTICATED_OMDALA_API_ONLY",
      pass:
        appAiClient.includes("/v1/ai/models") &&
        appAiClient.includes("/v1/ai/chat") &&
        appAiClient.includes('credentials: "include"') &&
        appAiClient.includes("Idempotency-Key") &&
        appAiClient.includes("apiJsonRequest") &&
        !ABSOLUTE_NETWORK_ORIGIN.test(appAiClient) &&
        !ARBITRARY_GATEWAY_AUTHORITY.test(appAiClient) &&
        !hasForbiddenProviderExecution(appAiClient) &&
        !AIAGENT_PROVIDER_ORIGIN.test(appAiClient),
    },
    {
      id: "WEB_AI_API_ORIGIN_ENVIRONMENT_BOUND",
      pass:
        appApiTransport.includes("resolvePublicOrigin") &&
        appApiTransport.includes('"api"') &&
        appApiTransport.includes("NEXT_PUBLIC_RELEASE_ENVIRONMENT") &&
        appApiTransport.includes("NEXT_PUBLIC_API_URL") &&
        appApiTransport.includes('credentials: "include"') &&
        /\bfetch\s*\(/.test(appApiTransport) &&
        !AIAGENT_PROVIDER_ORIGIN.test(appApiTransport) &&
        !hasForbiddenProviderExecution(appApiTransport),
    },
    {
      id: "WEB_AI_NO_BROWSER_PROVIDER_CREDENTIAL",
      pass:
        !BROWSER_AI_CREDENTIAL.test(browserCredentialSources) &&
        !AIAGENT_PROVIDER_ORIGIN.test(browserCredentialSources) &&
        !LEGACY_PROVIDER_CONFIGURATION.test(appSettings) &&
        !/\b(?:apiGatewayUrl|setApiUrl|setGatewayUrl)\b/.test(appAccount),
    },
    {
      id: "WEB_AI_SINGLE_EXECUTION_PATH",
      pass:
        canonicalClientImport.test(appAiChat) &&
        !MODEL_ROUTER_REFERENCE.test(appExecutionSources) &&
        !MODEL_ROUTER_REFERENCE.test(appSourceTree) &&
        !hasForbiddenProviderExecution(appExecutionSources) &&
        !hasForbiddenProviderExecution(appSourceTree) &&
        !AIAGENT_PROVIDER_ORIGIN.test(appSourceTree) &&
        !ARBITRARY_GATEWAY_AUTHORITY.test(appExecutionSources) &&
        !ARBITRARY_GATEWAY_AUTHORITY.test(appSourceTree) &&
        !/\bfetch\s*\(/.test(appNetworkCallers) &&
        !coreIndex.includes('from "./model-router"') &&
        !coreIndex.includes("from './model-router'") &&
        !coreIndex.includes('from "./agent-orchestrator"') &&
        !coreIndex.includes("from './agent-orchestrator'"),
    },
    {
      id: "WEB_AI_RESPONSE_FAILS_CLOSED",
      pass:
        appAiClient.includes("receipt_id") &&
        appAiClient.includes("run_id") &&
        appAiClient.includes("usage") &&
        appAiClient.includes("cost_usd") &&
        appAiClient.includes('redirect: "error"') &&
        /throw\s+new\s+\w*Error\b/.test(appAiClient) &&
        !SILENT_AI_FALLBACK.test(appAiClient) &&
        !/\bfallback\b/i.test(appExecutionSources),
    },
    {
      id: "API_AIAGENT_CANONICAL_AUTHORITY",
      pass:
        apiAiagentClient.includes("https://api.aiagent.iai.one") &&
        apiAiagentClient.includes("https://staging-api.aiagent.iai.one") &&
        apiAiagentClient.includes("AIAGENT_API_KEY") &&
        apiAiagentClient.includes("Authorization") &&
        apiAiagentClient.includes("Bearer") &&
        apiAiagentClient.includes('redirect: "error"') &&
        apiAiagentClient.includes(
          'headers.set("X-Tenant-ID", AIAGENT_TENANT_ID)',
        ) &&
        apiAiagentClient.includes(
          'headers.set("X-Workspace-ID", identity.workspace)',
        ) &&
        apiAiagentClient.includes('headers.set("X-Actor-Role", "agent")') &&
        apiAiagentClient.includes('headers.set("X-Surface", "agent")') &&
        apiAiagentClient.includes("Idempotency-Key") &&
        apiAiagentClient.includes("X-Request-ID") &&
        apiAiagentClient.includes("tenant_id: AIAGENT_TENANT_ID") &&
        apiAiagentClient.includes("/v1/ai/models") &&
        apiAiagentClient.includes("/v1/ai/chat") &&
        apiAiagentClient.includes("/v1/runs/") &&
        apiAiagentClient.includes("/v1/ai/verify") &&
        [
          "contract_version",
          "receipt_id",
          "run_id",
          "ledger_entry_id",
          "usage",
          "cost_usd",
        ].every((field) => apiAiagentClient.includes(field)) &&
        apiAiagentClient.includes('data.authority !== "aiagent.iai.one"') &&
        apiAiagentClient.includes("data.transport_origin !== identity.origin") &&
        apiAiagentClient.includes('data.namespace !== "iai-one"') &&
        apiAiagentClient.includes("data.count !== data.models.length") &&
        apiAiagentClient.includes("value.tenant_id !== AIAGENT_TENANT_ID") &&
        apiAiagentClient.includes("value.workspace_id !== workspace") &&
        apiAiagentClient.includes("run.tenant_id !== invocation.tenant_id") &&
        apiAiagentClient.includes(
          "receipt.tenant_id !== invocation.tenant_id",
        ) &&
        apiAiagentClient.includes(
          "receipt.workspace_id !== invocation.workspace_id",
        ) &&
        !hasForbiddenProviderExecution(apiAiagentClient) &&
        !SILENT_AI_FALLBACK.test(apiAiagentClient),
    },
    {
      id: "API_AIAGENT_PROXY_IS_SESSION_PROTECTED",
      pass:
        apiIndex.includes('app.get("/v1/ai/models"') &&
        apiIndex.includes('app.post("/v1/ai/chat"') &&
        routeBlock(
          apiIndex,
          'app.get("/v1/ai/models"',
          'app.post("/v1/ai/chat"',
        ).includes("requireAuthenticatedSession") &&
        routeBlock(
          apiIndex,
          'app.post("/v1/ai/chat"',
          "// ── Google OAuth",
        ).includes("requireAuthenticatedSession") &&
        serverAuthoritySources.includes("AIAGENT_API_KEY") &&
        apiContracts.includes("AIAGENT_API_KEY") &&
        apiWrangler.includes('AIAGENT_API_URL = "https://api.aiagent.iai.one"') &&
        apiWrangler.includes(
          'AIAGENT_API_URL = "https://staging-api.aiagent.iai.one"',
        ) &&
        !apiWrangler.includes("AIAGENT_API_KEY"),
    },
    {
      id: "API_AIAGENT_SECRET_AND_READBACK_RECEIPT",
      pass:
        apiSecretBundleStep.includes(
          "OMDALA_AIAGENT_API_KEY: ${{ secrets.OMDALA_AIAGENT_API_KEY }}",
        ) &&
        apiSecretBundleStep.includes(
          "AIAGENT_API_KEY: process.env.OMDALA_AIAGENT_API_KEY",
        ) &&
        apiReleaseReceiptStep.includes("aiagent_secret_binding_verified") &&
        apiReleaseReceiptStep.includes("aiagent_secret_binding_name") &&
        apiReleaseReceiptStep.includes("AIAGENT_API_KEY") &&
        !apiReleaseReceiptStep.includes("secrets.OMDALA_AIAGENT_API_KEY") &&
        !apiReleaseReceiptStep.includes("process.env.OMDALA_AIAGENT_API_KEY") &&
        apiAiagentClient.includes("AIAGENT_RUN_READBACK_MISMATCH") &&
        apiAiagentClient.includes("AIAGENT_VERIFY_RECONCILIATION_MISMATCH"),
    },
    {
      id: "DIRECT_PROVIDER_IMPLEMENTATIONS_ABSENT",
      pass:
        apiAiConnectors.trim() === "" &&
        !hasForbiddenProviderExecution(serverAuthoritySources) &&
        !/\bAI_API_(?:URL|KEY)\b/.test(serverAuthoritySources),
    },
    {
      id: "BROWSER_CSP_BLOCKS_PROVIDER_EGRESS",
      pass:
        webHeaders.includes("Content-Security-Policy:") &&
        appHeaders.includes("Content-Security-Policy:") &&
        webHeaders.includes("connect-src") &&
        appHeaders.includes("connect-src") &&
        /connect-src\s+'self'/.test(webHeaders) &&
        /connect-src\s+'self'/.test(appHeaders) &&
        !hasForbiddenProviderExecution(browserHeaders) &&
        !AIAGENT_PROVIDER_ORIGIN.test(browserHeaders),
    },
    {
      id: "WORKER_AIAGENT_AUTHORITY_ONLY",
      pass:
        workerAiTask.includes("callAiagentChat") &&
        workerCodeReview.includes("callAiagentChat") &&
        workerAiagentClient.includes("https://api.aiagent.iai.one") &&
        workerAiagentClient.includes("https://staging-api.aiagent.iai.one") &&
        workerAiagentClient.includes("AIAGENT_API_KEY") &&
        workerAiagentClient.includes("/v1/ai/chat") &&
        workerAiagentClient.includes("Idempotency-Key") &&
        ["receipt_id", "run_id", "usage", "cost_usd"].every(
          (field) =>
            workerExecutionSources.includes(field),
        ) &&
        !hasForbiddenProviderExecution(workerExecutionSources) &&
        !/\bAI_API_(?:URL|KEY)\b/.test(workerExecutionSources) &&
        !SILENT_AI_FALLBACK.test(workerAiagentClient),
    },
  ];
  return {
    accepted: checks.every((check) => check.pass),
    checks,
    sources: {
      api_index_sha256: sha256(apiIndex),
      ai_health_test_sha256: sha256(aiHealthTest),
      production_e2e_sha256: sha256(productionE2E),
      production_workflow_sha256: sha256(productionWorkflow),
      app_ai_client_sha256: sha256(appAiClient),
      app_ai_chat_sha256: sha256(appAiChat),
      app_settings_sha256: sha256(appSettings),
      app_account_sha256: sha256(appAccount),
      app_model_picker_sha256: sha256(appModelPicker),
      app_command_palette_sha256: sha256(appCommandPalette),
      core_index_sha256: sha256(coreIndex),
      core_model_router_sha256: sha256(coreModelRouter),
      core_agent_orchestrator_sha256: sha256(coreAgentOrchestrator),
      worker_ai_task_sha256: sha256(workerAiTask),
      worker_code_review_sha256: sha256(workerCodeReview),
      worker_aiagent_client_sha256: sha256(workerAiagentClient),
      app_source_tree_sha256: sha256(appSourceTree),
      api_aiagent_client_sha256: sha256(apiAiagentClient),
      api_ai_connectors_sha256: sha256(apiAiConnectors),
      api_contracts_sha256: sha256(apiContracts),
      api_wrangler_sha256: sha256(apiWrangler),
      api_deploy_workflow_sha256: sha256(apiDeployWorkflow),
      web_headers_sha256: sha256(webHeaders),
      app_headers_sha256: sha256(appHeaders),
      app_api_transport_sha256: sha256(appApiTransport),
    },
  };
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

function main() {
  const result = evaluateProductionNoSpendSources(actualSources());
  const receipt = {
    schema_version: 1,
    verdict: result.accepted
      ? "PRODUCTION_NO_SPEND_SOURCE_ACCEPTED"
      : "PRODUCTION_NO_SPEND_SOURCE_BLOCKED",
    checked_at: new Date().toISOString(),
    ...result,
  };
  const receiptPath = process.argv[2];
  if (receiptPath) {
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  if (!result.accepted) process.exitCode = 2;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
