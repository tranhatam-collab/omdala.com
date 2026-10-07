import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { evaluateReleaseControlSources } from "./release-control-contract.mjs";

function actualSources() {
  return {
    apiDeploy: readFileSync(".github/workflows/deploy.yml", "utf8"),
    surfaceDeploy: readFileSync(
      ".github/workflows/deploy-surfaces.yml",
      "utf8",
    ),
    staging: readFileSync(".github/workflows/staging-go-live-e2e.yml", "utf8"),
    production: readFileSync(
      ".github/workflows/production-go-live-e2e.yml",
      "utf8",
    ),
    independent: readFileSync(
      ".github/workflows/independent-review.yml",
      "utf8",
    ),
    codeowners: readFileSync(".github/CODEOWNERS", "utf8"),
    mailE2e: readFileSync("apps/app/e2e-staging/go-live.spec.ts", "utf8"),
    authLogin: readFileSync("apps/auth/app/login/AuthLoginForm.tsx", "utf8"),
    appAuthGate: readFileSync(
      "apps/app/app/(dashboard)/DashboardAuthGate.tsx",
      "utf8",
    ),
    appLogin: readFileSync("apps/app/app/(auth)/login/page.tsx", "utf8"),
    webChrome: readFileSync("apps/web/app/WebChrome.tsx", "utf8"),
    publicOrigins: readFileSync("packages/core/src/public-origins.mjs", "utf8"),
    publicConfigValidator: readFileSync(
      "scripts/validate-surface-public-config.mjs",
      "utf8",
    ),
    surfaceContract: readFileSync(
      "scripts/surface-release-contract.mjs",
      "utf8",
    ),
    apiConfigRenderer: readFileSync(
      "scripts/render-api-wrangler-config.mjs",
      "utf8",
    ),
    apiVersionVerifier: readFileSync(
      "scripts/verify-api-version-hyperdrive.mjs",
      "utf8",
    ),
    apiWorkerAuthority: readFileSync(
      "scripts/verify-api-worker-authority.mjs",
      "utf8",
    ),
    surfaceWorkerAuthority: readFileSync(
      "scripts/verify-surface-worker-authority.mjs",
      "utf8",
    ),
    surfaceWorkerConfigs: ["web", "app", "auth", "brand"]
      .map((surface) =>
        readFileSync(`infra/staging/surfaces/${surface}.wrangler.jsonc`, "utf8"),
      )
      .join("\n"),
    surfaceStaticWorker: readFileSync(
      "infra/staging/surfaces/static-worker.mjs",
      "utf8",
    ),
    productionReceipt: readFileSync(
      "scripts/production-acceptance-receipt.mjs",
      "utf8",
    ),
    productionE2EConfig: readFileSync(
      "scripts/production-e2e-config.mjs",
      "utf8",
    ),
    productionE2E: readFileSync(
      "apps/app/e2e-production/go-live.spec.ts",
      "utf8",
    ),
    apiIndex: readFileSync("services/api/src/index.ts", "utf8"),
    aiHealthTest: readFileSync("services/api/src/ai-health.test.ts", "utf8"),
    noSpendContract: readFileSync(
      "scripts/production-no-spend-contract.mjs",
      "utf8",
    ),
    hyperdriveTargetGuard: readFileSync(
      "scripts/hyperdrive-target-guard.mjs",
      "utf8",
    ),
    postgresTargetGuard: readFileSync(
      "scripts/postgres-target-guard.mjs",
      "utf8",
    ),
    postgresPreMigration: readFileSync(
      "scripts/postgres-pre-migration-gate.sh",
      "utf8",
    ),
    dataAuthority: readFileSync(
      "config/production-data-authority.json",
      "utf8",
    ),
    protectedRuntimeRepository: readFileSync(
      "services/api/src/db/runtime-repository.ts",
      "utf8",
    ),
    protectedRuntimeMigration: readFileSync(
      "infra/postgres/migrations/0003_protected_runtime_state.sql",
      "utf8",
    ),
    authRepository: readFileSync(
      "services/api/src/db/auth-repository.ts",
      "utf8",
    ),
    authMigration: readFileSync(
      "infra/postgres/migrations/0002_auth_session_state.sql",
      "utf8",
    ),
    releaseVerify: readFileSync("scripts/release-verify.mjs", "utf8"),
    ciWorkflow: readFileSync(".github/workflows/ci.yml", "utf8"),
    mobilePackage: readFileSync("om-ai.omdala.com/app/package.json", "utf8"),
  };
}

describe("release control source contract", () => {
  it("accepts the complete fail-closed release chain", () => {
    const result = evaluateReleaseControlSources(actualSources());
    assert.equal(result.accepted, true, JSON.stringify(result.checks));
    assert.equal(result.passed, result.total);
  });

  it("rejects migration when the backup/restore gate is removed", () => {
    const files = actualSources();
    files.apiDeploy = files.apiDeploy.replaceAll(
      "Backup, restore, and verify before migration",
      "Unverified database operation",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
  });

  it("rejects continue-on-error in the production acceptance workflow", () => {
    const files = actualSources();
    files.production += "\ncontinue-on-error: true\n";
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "NO_CONTINUE_ON_ERROR_IN_RELEASE_CHAIN",
      )?.pass,
      false,
    );
  });

  it("rejects a production workflow that skips the final acceptance receipt", () => {
    const files = actualSources();
    files.production = files.production.replace(
      "--phase final",
      "--phase chain",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "PRODUCTION_FINAL_RECEIPT_CHAIN",
      )?.pass,
      false,
    );
  });

  it("rejects a production chain that omits staging E2E evidence", () => {
    const files = actualSources();
    files.production = files.production.replaceAll(
      "--staging-e2e-report release-chain/staging/acceptance/staging-e2e-results.json",
      "--staging-e2e-report omitted.json",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "PRODUCTION_STAGING_API_SURFACE_EVIDENCE_CHAIN",
      )?.pass,
      false,
    );
  });

  it("rejects unsuffixed staging evidence in the production acceptance chain", () => {
    const files = actualSources();
    files.production = files.production.replaceAll(
      "-${{ inputs.staging_transaction_id }}",
      "",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "PRODUCTION_STAGING_API_SURFACE_EVIDENCE_CHAIN",
      )?.pass,
      false,
    );
  });

  it("rejects staging transaction and acceptance artifacts from different runs", () => {
    const files = actualSources();
    files.production = files.production.replace(
      "run-id: ${{ inputs.staging_transaction_run_id }}",
      "run-id: ${{ inputs.api_release_run_id }}",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "PRODUCTION_STAGING_API_SURFACE_EVIDENCE_CHAIN",
      )?.pass,
      false,
    );
  });

  it("rejects omission of the sealed staging transaction receipt", () => {
    const files = actualSources();
    files.production = files.production.replaceAll(
      "--staging-transaction-receipt release-chain/staging/transaction/staging-transaction.json",
      "--staging-transaction-receipt omitted.json",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "PRODUCTION_STAGING_API_SURFACE_EVIDENCE_CHAIN",
      )?.pass,
      false,
    );
  });

  it("rejects legacy child staging workflow identity in production promotion", () => {
    const files = actualSources();
    files.productionReceipt = files.productionReceipt.replace(
      'name: "OMDALA Staging Transaction"',
      'name: "OMDALA Staging Go-Live E2E"',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "PRODUCTION_STAGING_API_SURFACE_EVIDENCE_CHAIN",
      )?.pass,
      false,
    );
  });

  it("rejects a production receipt evaluator that expands beyond four surfaces", () => {
    const files = actualSources();
    files.productionReceipt = files.productionReceipt.replace(
      '["web", "app", "auth", "brand"]',
      '["web", "app", "auth", "brand", "admin"]',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "PRODUCTION_EXACT_FOUR_SURFACES",
      )?.pass,
      false,
    );
  });

  it("rejects a production smoke test that adds an AI endpoint call", () => {
    const files = actualSources();
    files.productionE2E +=
      "\nvoid request.post(`${production.apiUrl}/v1/ai/completions`);\n";
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find((check) => check.id === "PRODUCTION_SMOKE_MODEL_FREE")
        ?.pass,
      false,
    );
  });

  it("rejects a production source gate that omits the browser AIAGENT authority boundary", () => {
    const files = actualSources();
    files.noSpendContract = files.noSpendContract.replace(
      "WEB_AI_AUTHENTICATED_OMDALA_API_ONLY",
      "UNBOUND_BROWSER_AI_AUTHORITY",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find((check) => check.id === "PRODUCTION_SMOKE_MODEL_FREE")
        ?.pass,
      false,
    );
  });

  it("rejects a production source gate that omits the worker AIAGENT authority boundary", () => {
    const files = actualSources();
    files.noSpendContract = files.noSpendContract.replace(
      "WORKER_AIAGENT_AUTHORITY_ONLY",
      "UNBOUND_WORKER_AI_AUTHORITY",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find((check) => check.id === "PRODUCTION_SMOKE_MODEL_FREE")
        ?.pass,
      false,
    );
  });

  it("rejects a production smoke chain that stops using the protected magic token", () => {
    const files = actualSources();
    files.productionE2E = files.productionE2E.replaceAll(
      "token: production.magicLinkToken",
      'token: "hard-coded-token"',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "PRODUCTION_MAGIC_LINK_TOKEN_PROTECTED",
      )?.pass,
      false,
    );
  });

  it("rejects API deployment without atomic version secret delivery", () => {
    const files = actualSources();
    files.apiDeploy = files.apiDeploy.replace(
      '--secrets-file "$RUNNER_TEMP/omdala-api-secrets.json"',
      "",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "PROTECTED_API_SECRET_DELIVERY",
      )?.pass,
      false,
    );
  });

  it("rejects a surface release chain that omits Auth", () => {
    const files = actualSources();
    files.surfaceDeploy = files.surfaceDeploy.replace(
      'verify_release auth "$AUTH_URL"',
      'echo "Auth verification omitted"',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find((check) => check.id === "AUTH_PROTECTED_SURFACE_CHAIN")
        ?.pass,
      false,
    );
  });

  it("rejects an Auth redirect that is not environment-bound", () => {
    const files = actualSources();
    files.authLogin = files.authLogin.replace(
      "process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT",
      '"production"',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
  });

  it("rejects a protected App redirect that escapes staging", () => {
    const files = actualSources();
    files.appAuthGate = files.appAuthGate.replace(
      "process.env.NEXT_PUBLIC_AUTH_ORIGIN",
      '"https://auth.omdala.com"',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "STAGING_NAVIGATION_ENVIRONMENT_BOUND",
      )?.pass,
      false,
    );
  });

  it("rejects a release chain without public-origin preflight", () => {
    const files = actualSources();
    files.surfaceDeploy = files.surfaceDeploy.replace(
      "node scripts/validate-surface-public-config.mjs",
      'echo "public origin preflight omitted"',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
  });

  it("rejects a staging App live readback that skips the API CSP boundary", () => {
    const files = actualSources();
    files.surfaceDeploy = files.surfaceDeploy.replace(
      'verify_staging_policy app "$APP_URL" /workspace/ true',
      'verify_staging_policy app "$APP_URL" /workspace/ false',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "STAGING_APP_CSP_LIVE_READBACK",
      )?.pass,
      false,
    );
  });

  it("rejects staging surface deployment without exact rollback state", () => {
    const files = actualSources();
    files.surfaceDeploy = files.surfaceDeploy.replace(
      "services/api/node_modules/.bin/wrangler rollback",
      "echo rollback-omitted",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) =>
          check.id === "STAGING_SURFACE_DEPLOYMENT_IDENTITY_AND_ROLLBACK",
      )?.pass,
      false,
    );
  });

  it("rejects staging static Workers without strict exact-authority deployment", () => {
    for (const mutation of [
      (source) => source.replace("--strict", "--keep-vars"),
      (source) => source.replace("--format json", "--format pretty"),
      (source) =>
        source.replace(
          "node scripts/verify-surface-worker-authority.mjs",
          "echo surface-authority-omitted",
        ),
    ]) {
      const files = actualSources();
      files.surfaceDeploy = mutation(files.surfaceDeploy);
      const result = evaluateReleaseControlSources(files);
      assert.equal(result.accepted, false);
      assert.equal(
        result.checks.find(
          (check) => check.id === "STAGING_SURFACE_EXACT_REMOTE_AUTHORITY",
        )?.pass,
        false,
      );
    }
  });

  it("rejects a staging surface config without the exact ASSETS binding", () => {
    const files = actualSources();
    files.surfaceWorkerConfigs = files.surfaceWorkerConfigs.replace(
      '"binding": "ASSETS"',
      '"binding": "STATIC"',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "STAGING_SURFACE_EXACT_REMOTE_AUTHORITY",
      )?.pass,
      false,
    );
  });

  it("rejects a staging static Worker that bypasses the ASSETS binding", () => {
    const files = actualSources();
    files.surfaceStaticWorker = files.surfaceStaticWorker.replace(
      "return env.ASSETS.fetch(request)",
      'return fetch("https://staging.omdala.com")',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "STAGING_SURFACE_EXACT_REMOTE_AUTHORITY",
      )?.pass,
      false,
    );
  });

  it("rejects an authority verifier that permits a missing post-deploy Worker", () => {
    const files = actualSources();
    files.surfaceWorkerAuthority = files.surfaceWorkerAuthority.replace(
      'providerWorkerMissing && phase !== "preflight"',
      "false",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "STAGING_SURFACE_EXACT_REMOTE_AUTHORITY",
      )?.pass,
      false,
    );
  });

  it("rejects production Pages deployment without provider rollback", () => {
    const files = actualSources();
    files.surfaceDeploy = files.surfaceDeploy.replace(
      "/deployments/${previous}/rollback",
      "/deployments/rollback-omitted",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
  });

  it("rejects candidate-controlled independent review policy", () => {
    const files = actualSources();
    files.apiDeploy = files.apiDeploy.replaceAll(
      "$RUNNER_TEMP/omdala-release-review-policy.mjs",
      "scripts/release-review-policy.mjs",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
  });

  it("rejects an unpinned bootstrap review policy", () => {
    const files = actualSources();
    files.independent = files.independent.replace(
      "415927e5f1580d539013b55765dfba834de655e7",
      "OMCODE/go-live-e2e-20260829",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "INDEPENDENT_REVIEW_BOOTSTRAP_TRUST",
      )?.pass,
      false,
    );
  });

  it("rejects a dispatch gate that conflates control-plane and candidate SHAs", () => {
    const files = actualSources();
    files.staging = files.staging.replace(
      '.head_branch == "main"',
      ".head_sha == $sha",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) =>
          check.id ===
          "DISPATCH_RUN_IDENTITY_SEPARATES_CONTROL_PLANE_FROM_CANDIDATE",
      )?.pass,
      false,
    );
  });

  it("rejects production promotion without reviewed-tree equivalence", () => {
    const files = actualSources();
    files.apiDeploy = files.apiDeploy.replace(
      ".candidate_tree_sha == $production_tree_sha",
      ".candidate_sha == $staged_sha",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "PRODUCTION_PROMOTION_BINDS_REVIEWED_TREE",
      )?.pass,
      false,
    );
  });

  it("rejects a release chain that does not bind the protected Cloudflare account", () => {
    const files = actualSources();
    files.apiDeploy = files.apiDeploy.replace(
      "--wrangler-config services/api/wrangler.toml",
      "--wrangler-config unchecked.toml",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "CLOUDFLARE_ACCOUNT_AUTHORITY_BOUND",
      )?.pass,
      false,
    );
  });

  it("rejects receipt steps that use an undeclared protected Cloudflare account", () => {
    const files = actualSources();
    const marker = "        name: Write immutable API release receipt";
    const start = files.apiDeploy.indexOf(marker);
    const end = files.apiDeploy.indexOf("\n      - ", start + marker.length);
    const step = files.apiDeploy
      .slice(start, end)
      .replace(
        "          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}\n",
        "",
      );
    files.apiDeploy = `${files.apiDeploy.slice(0, start)}${step}${files.apiDeploy.slice(end)}`;
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "CLOUDFLARE_ACCOUNT_AUTHORITY_BOUND",
      )?.pass,
      false,
    );
  });

  it("rejects an API release that does not verify the exact provider Hyperdrive binding", () => {
    const files = actualSources();
    files.apiVersionVerifier = files.apiVersionVerifier.replace(
      "binding.id !== expectedHyperdriveId",
      "binding.id === expectedHyperdriveId",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "API_HYPERDRIVE_ENVIRONMENT_BINDING",
      )?.pass,
      false,
    );
  });

  it("rejects removal of the immutable staging database authority", () => {
    const files = actualSources();
    files.dataAuthority = files.dataAuthority.replace(
      '"postgres_database": "omdala_staging"',
      '"postgres_database": "omdala_prod"',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "DATA_PLANE_ENVIRONMENT_ISOLATION",
      )?.pass,
      false,
    );
  });

  it("rejects protected runtime state that falls back to non-durable storage", () => {
    const files = actualSources();
    files.protectedRuntimeMigration = files.protectedRuntimeMigration.replace(
      "CREATE TABLE IF NOT EXISTS omdala.analytics_events",
      "CREATE TEMP TABLE omdala.analytics_events",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "PROTECTED_RUNTIME_POSTGRES_PERSISTENCE",
      )?.pass,
      false,
    );
  });

  it("rejects replayable auth session state", () => {
    const files = actualSources();
    files.authRepository = files.authRepository.replace(
      "AND consumed_at IS NULL",
      "AND TRUE",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "AUTH_SESSION_POSTGRES_AUTHORITY",
      )?.pass,
      false,
    );
  });

  it("rejects retained remote Worker vars or secrets", () => {
    const files = actualSources();
    files.apiDeploy = files.apiDeploy.replace(
      'args=(deploy --config "$API_WRANGLER_CONFIG" --strict)',
      'args=(deploy --config "$API_WRANGLER_CONFIG" --strict --keep-vars)',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) => check.id === "API_WORKER_EXACT_REMOTE_AUTHORITY",
      )?.pass,
      false,
    );
  });

  it("rejects a local release verifier that retains remote Worker bindings", () => {
    const files = actualSources();
    files.releaseVerify += '\n"--keep-vars"\n';
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) =>
          check.id === "LOCAL_RELEASE_VERIFY_AUTHORITY_AND_MOBILE_AUDIT",
      )?.pass,
      false,
    );
  });

  it("rejects a local dry run executed from the wrong Wrangler authority", () => {
    const files = actualSources();
    files.releaseVerify = files.releaseVerify.replace(
      'command: "services/api/node_modules/.bin/wrangler"',
      'command: "pnpm"',
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) =>
          check.id === "LOCAL_RELEASE_VERIFY_AUTHORITY_AND_MOBILE_AUDIT",
      )?.pass,
      false,
    );
  });

  it("rejects a local release verifier that does not bind a clean source tree", () => {
    const files = actualSources();
    files.releaseVerify = files.releaseVerify.replace(
      "worktreeClean && /^[0-9a-f]{40}$/.test(releaseSha)",
      "/^[0-9a-f]{40}$/.test(releaseSha)",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) =>
          check.id === "LOCAL_RELEASE_VERIFY_AUTHORITY_AND_MOBILE_AUDIT",
      )?.pass,
      false,
    );
  });

  it("rejects omission of the mobile dependency audit", () => {
    const files = actualSources();
    files.releaseVerify = files.releaseVerify.replace(
      'id: "OM_AI_MOBILE_SECURITY"',
      'id: "OM_AI_MOBILE_SECURITY_OMITTED"',
    );
    files.ciWorkflow = files.ciWorkflow.replace(
      "Audit OM AI mobile dependencies",
      "Skip OM AI mobile dependencies",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) =>
          check.id === "LOCAL_RELEASE_VERIFY_AUTHORITY_AND_MOBILE_AUDIT",
      )?.pass,
      false,
    );
  });

  it("rejects omission of the OM AI web build and dependency audit", () => {
    const files = actualSources();
    files.releaseVerify = files.releaseVerify.replace(
      'id: "OM_AI_WEB_BUILD"',
      'id: "OM_AI_WEB_BUILD_OMITTED"',
    );
    files.ciWorkflow = files.ciWorkflow.replace(
      "Audit OM AI web dependencies",
      "Skip OM AI web dependencies",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) =>
          check.id === "LOCAL_RELEASE_VERIFY_AUTHORITY_AND_MOBILE_AUDIT",
      )?.pass,
      false,
    );
  });

  it("rejects a mobile test command that omits Jest or typecheck", () => {
    const files = actualSources();
    files.mobilePackage = files.mobilePackage.replace(
      "npm run test:contract && npm run test:unit && npm run typecheck",
      "npm run test:contract",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) =>
          check.id === "LOCAL_RELEASE_VERIFY_AUTHORITY_AND_MOBILE_AUDIT",
      )?.pass,
      false,
    );
  });

  it("rejects a non-canonical Auth origin in staging discovery", () => {
    const files = actualSources();
    files.releaseVerify = files.releaseVerify.replace(
      "https://auth-staging.omdala.com",
      "https://auth-staging.invalid",
    );
    const result = evaluateReleaseControlSources(files);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        (check) =>
          check.id === "LOCAL_RELEASE_VERIFY_AUTHORITY_AND_MOBILE_AUDIT",
      )?.pass,
      false,
    );
  });
});
