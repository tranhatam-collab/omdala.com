import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function evaluateReleaseControlSources(files) {
  const apiDeploy = files.apiDeploy ?? "";
  const surfaceDeploy = files.surfaceDeploy ?? "";
  const staging = files.staging ?? "";
  const production = files.production ?? "";
  const independent = files.independent ?? "";
  const codeowners = files.codeowners ?? "";
  const mailE2e = files.mailE2e ?? "";
  const authLogin = files.authLogin ?? "";
  const appAuthGate = files.appAuthGate ?? "";
  const appLogin = files.appLogin ?? "";
  const webChrome = files.webChrome ?? "";
  const publicOrigins = files.publicOrigins ?? "";
  const publicConfigValidator = files.publicConfigValidator ?? "";
  const surfaceContract = files.surfaceContract ?? "";
  const apiConfigRenderer = files.apiConfigRenderer ?? "";
  const apiConfigPolicy = files.apiConfigPolicy ?? "";
  const apiVersionVerifier = files.apiVersionVerifier ?? "";
  const apiWorkerAuthority = files.apiWorkerAuthority ?? "";
  const surfaceWorkerAuthority = files.surfaceWorkerAuthority ?? "";
  const surfaceWorkerConfigs = files.surfaceWorkerConfigs ?? "";
  const surfaceStaticWorker = files.surfaceStaticWorker ?? "";
  const productionReceipt = files.productionReceipt ?? "";
  const productionE2EConfig = files.productionE2EConfig ?? "";
  const productionE2E = files.productionE2E ?? "";
  const apiIndex = files.apiIndex ?? "";
  const aiHealthTest = files.aiHealthTest ?? "";
  const noSpendContract = files.noSpendContract ?? "";
  const hyperdriveTargetGuard = files.hyperdriveTargetGuard ?? "";
  const postgresTargetGuard = files.postgresTargetGuard ?? "";
  const postgresPreMigration = files.postgresPreMigration ?? "";
  const dataAuthority = files.dataAuthority ?? "";
  const protectedRuntimeRepository = files.protectedRuntimeRepository ?? "";
  const protectedRuntimeMigration = files.protectedRuntimeMigration ?? "";
  const authRepository = files.authRepository ?? "";
  const authMigration = files.authMigration ?? "";
  const releaseVerify = files.releaseVerify ?? "";
  const ciWorkflow = files.ciWorkflow ?? "";
  const mobilePackage = files.mobilePackage ?? "";
  const releaseSources = [
    apiDeploy,
    surfaceDeploy,
    staging,
    production,
    independent,
  ].join("\n");
  const deployApiJob = apiDeploy.slice(apiDeploy.indexOf("\n  deploy-api:"));
  const backupIndex = apiDeploy.indexOf(
    "Backup, restore, and verify before migration",
  );
  const migrationIndex = apiDeploy.indexOf("Apply migrations in lexical order");
  const stepBody = (source, name) => {
    const markers = [`      - name: ${name}`, `        name: ${name}`];
    const start = markers
      .map((marker) => source.indexOf(marker))
      .filter((index) => index >= 0)
      .sort((left, right) => left - right)[0] ?? -1;
    if (start < 0) return "";
    const next = source.indexOf("\n      - ", start + name.length);
    return source.slice(start, next < 0 ? source.length : next);
  };
  const apiReceiptStep = stepBody(
    apiDeploy,
    "Write immutable API release receipt",
  );
  const surfaceReceiptStep = stepBody(
    surfaceDeploy,
    "Write immutable surface release receipt",
  );
  const apiAccountStep = stepBody(
    apiDeploy,
    "Require protected Cloudflare account authority",
  );
  const apiSecretBundleStep = stepBody(
    apiDeploy,
    "Prepare protected API secret bundle",
  );
  const apiDeployStep = stepBody(
    apiDeploy,
    "Deploy exact environment and source identity",
  );
  const surfaceAccountStep = stepBody(
    surfaceDeploy,
    "Require protected Cloudflare account authority",
  );
  const stagingAccountStep = stepBody(
    staging,
    "Require protected Cloudflare account authority",
  );
  const productionModelGuardStep = stepBody(
    production,
    "Verify transitive production no-spend contract",
  );
  const productionTokenRedactionStep = stepBody(
    production,
    "Ensure the protected magic-link token is absent from the report",
  );
  const productionFinalReceiptStep = stepBody(
    production,
    "Write final production acceptance receipt",
  );
  const productionReceiptUploadStep = stepBody(
    production,
    "Upload immutable production acceptance receipt",
  );
  const normalizedProductionReceipt = productionReceipt.replace(/\s+/g, " ");
  const normalizedProductionE2EConfig = productionE2EConfig.replace(/\s+/g, " ");
  const normalizedProductionE2E = productionE2E.replace(/\s+/g, " ");
  const productionMagicTokenSecretReferences =
    production.match(
      /\$\{\{\s*secrets\.OMDALA_PRODUCTION_SMOKE_MAGIC_LINK_TOKEN\s*\}\}/g,
    )?.length ?? 0;
  const productionApiPaths = [
    ...new Set(
      [
        ...productionE2E.matchAll(/\$\{production\.apiUrl\}(\/[^`"'\s?]*)/g),
      ].map((match) => match[1]),
    ),
  ].sort();
  const requiredProductionApiPaths = [
    "/health",
    "/health/deep",
    "/v1/ai/health",
    "/v1/auth/google/start",
    "/v1/auth/logout",
    "/v1/auth/refresh",
    "/v1/auth/session",
    "/v1/auth/session/exchange",
  ];

  const checks = [
    {
      id: "CODEOWNERS_CRITICAL_PATHS",
      pass:
        codeowners.includes("/.github/workflows/") &&
        codeowners.includes("/infra/postgres/") &&
        codeowners.includes("/services/api/"),
    },
    {
      id: "INDEPENDENT_EXACT_SHA_REVIEW",
      pass:
        independent.includes("release-review-policy.mjs") &&
        independent.includes("github.event.pull_request.head.sha"),
    },
    {
      id: "INDEPENDENT_REVIEW_BOOTSTRAP_TRUST",
      pass:
        independent.includes(
          "BOOTSTRAP_POLICY_SHA: 415927e5f1580d539013b55765dfba834de655e7",
        ) &&
        independent.includes(
          "BOOTSTRAP_POLICY_SHA256: 771f34e87c7007f24c7c58931ab72ad91028d4a725efa1096653195b6a15e8d5",
        ) &&
        independent.includes("git -C .trusted-bootstrap rev-parse HEAD") &&
        independent.includes('sha256sum "$policy"'),
    },
    {
      id: "DEPLOYMENTS_RECHECK_INDEPENDENT_REVIEW",
      pass:
        apiDeploy.includes("release-review-policy.mjs") &&
        surfaceDeploy.includes("release-review-policy.mjs") &&
        staging.includes("release-review-policy.mjs"),
    },
    {
      id: "BACKUP_RESTORE_PRECEDES_MIGRATION",
      pass: backupIndex >= 0 && migrationIndex > backupIndex,
    },
    {
      id: "PROTECTED_RUNTIME_POSTGRES_PERSISTENCE",
      pass:
        protectedRuntimeMigration.includes(
          "CREATE TABLE IF NOT EXISTS omdala.billing_subscriptions",
        ) &&
        protectedRuntimeMigration.includes(
          "CREATE TABLE IF NOT EXISTS omdala.workspaces",
        ) &&
        protectedRuntimeMigration.includes(
          "CREATE TABLE IF NOT EXISTS omdala.shared_notifications",
        ) &&
        protectedRuntimeMigration.includes(
          "CREATE TABLE IF NOT EXISTS omdala.analytics_events",
        ) &&
        protectedRuntimeMigration.includes("0003_protected_runtime_state") &&
        protectedRuntimeRepository.includes(
          "readOrCreateBillingSubscription",
        ) &&
        protectedRuntimeRepository.includes("readBillingUsageMinutesToday") &&
        protectedRuntimeRepository.includes("listOrCreateWorkspaces") &&
        protectedRuntimeRepository.includes("listOrCreateNotifications") &&
        protectedRuntimeRepository.includes("listOrCreateAnalyticsEvents") &&
        apiIndex.includes("allowsEphemeralProtectedRuntime") &&
        apiIndex.includes('["test", "development"]') &&
        apiIndex.includes("protectedRuntimePersistenceError") &&
        apiIndex.includes("to_regclass('omdala.billing_subscriptions')") &&
        apiIndex.includes("to_regclass('omdala.workspaces')") &&
        apiIndex.includes("to_regclass('omdala.shared_notifications')") &&
        apiIndex.includes("to_regclass('omdala.analytics_events')") &&
        apiIndex.includes("protected_runtime_migration === true") &&
        apiDeploy.includes("'billing_subscriptions', 'workspaces', 'shared_notifications', 'analytics_events'") &&
        apiDeploy.includes("0003_protected_runtime_state"),
    },
    {
      id: "AUTH_SESSION_POSTGRES_AUTHORITY",
      pass:
        authMigration.includes("CREATE TABLE IF NOT EXISTS omdala.auth_magic_links") &&
        authMigration.includes("CREATE TABLE IF NOT EXISTS omdala.auth_sessions") &&
        authMigration.includes("0002_auth_session_state") &&
        authRepository.includes("consumed_at IS NULL") &&
        authRepository.includes("current_refresh_jti = $3::uuid") &&
        authRepository.includes("revoked_at = COALESCE") &&
        apiIndex.includes("consumeMagicLinkState") &&
        apiIndex.includes("rotateAuthSessionState") &&
        apiIndex.includes("revokeAuthSessionState") &&
        apiIndex.includes("isAuthSessionStateActive") &&
        apiIndex.includes("magic_link_exchange_required") &&
        !apiIndex.includes("Stateless MVP") &&
        !apiIndex.includes("access_token: accessToken") &&
        !apiIndex.includes("refresh_token: refreshToken") &&
        apiIndex.includes("to_regclass('omdala.auth_magic_links')") &&
        apiIndex.includes("to_regclass('omdala.auth_sessions')") &&
        apiDeploy.includes("'auth_magic_links', 'auth_sessions'") &&
        apiDeploy.includes("0002_auth_session_state") &&
        productionE2E.includes("replayedMagicLink.status()).toBe(401)") &&
        productionE2E.includes("preLogoutRefreshCookie") &&
        productionE2E.includes("staleRefresh.status()).toBe(401)") &&
        productionE2E.includes("__Host-omdala_google_state") &&
        productionE2E.includes('code_challenge_method")).toBe("S256")') &&
        mailE2e.includes("__Host-omdala_google_state") &&
        mailE2e.includes('code_challenge_method")).toBe("S256")'),
    },
    {
      id: "API_WORKER_EXACT_REMOTE_AUTHORITY",
      pass:
        !apiDeploy.includes("--keep-vars") &&
        apiDeploy.includes("Reject unknown remote API secrets before deployment") &&
        (apiDeploy.match(/node scripts\/verify-api-worker-authority\.mjs/g)?.length ?? 0) >= 3 &&
        apiDeploy.includes("--allow-missing") &&
        apiDeploy.includes("OMDALA_GOOGLE_CLIENT_SECRET") &&
        apiDeploy.includes("OMDALA_GOOGLE_OAUTH_STATE_SECRET") &&
        apiConfigRenderer.includes("canonicalRenderedApiWranglerConfig") &&
        apiConfigRenderer.includes("verifyBaseApiWranglerConfig") &&
        apiConfigPolicy.includes("assertSemanticIdentity") &&
        apiConfigRenderer.includes("OMDALA_GOOGLE_CLIENT_ID") &&
        apiWorkerAuthority.includes("API_SECRET_INVENTORY_EXACT") &&
        apiWorkerAuthority.includes("API_WORKER_AUTHORITY_EXACT") &&
        apiWorkerAuthority.includes("unsupported bindings") &&
        apiReceiptStep.includes("secret_inventory_verified") &&
        apiReceiptStep.includes("worker_authority_evidence_sha256") &&
        staging.includes("api_worker_authority_evidence_sha256") &&
        productionReceipt.includes("validateWorkerAuthorityEvidence"),
    },
    {
      id: "LOCAL_RELEASE_VERIFY_AUTHORITY_AND_MOBILE_AUDIT",
      pass:
        !releaseVerify.includes("--keep-vars") &&
        !releaseVerify.includes('"--var"') &&
        releaseVerify.includes('id: "API_WRANGLER_PRODUCTION_RENDER"') &&
        releaseVerify.includes('id: "API_WRANGLER_STAGING_RENDER"') &&
        (releaseVerify.match(/scripts\/render-api-wrangler-config\.mjs/g)?.length ??
          0) === 2 &&
        (releaseVerify.match(
          /command: "services\/api\/node_modules\/\.bin\/wrangler"/g,
        )?.length ?? 0) === 2 &&
        releaseVerify.includes("services/api/wrangler.release.toml") &&
        releaseVerify.includes('id: "OM_AI_MOBILE_SECURITY"') &&
        releaseVerify.includes('id: "OM_AI_ROOT_SECURITY"') &&
        releaseVerify.includes('id: "OM_AI_WEB_SECURITY"') &&
        releaseVerify.includes('id: "OM_AI_WEB_TYPECHECK"') &&
        releaseVerify.includes('id: "OM_AI_WEB_BUILD"') &&
        releaseVerify.includes('id: "SOURCE_IDENTITY"') &&
        releaseVerify.includes(
          'worktreeClean && /^[0-9a-f]{40}$/.test(releaseSha)',
        ) &&
        releaseVerify.includes(
          'results.every((result) => result.state === "PASS")',
        ) &&
        releaseVerify.includes('cwd: "om-ai.omdala.com/app"') &&
        releaseVerify.includes(
          'E2E_STAGING_AUTH_URL: "https://auth-staging.omdala.com"',
        ) &&
        releaseVerify.includes("E2E_STAGING_MAIL_SINK_ADDRESS") &&
        releaseVerify.includes(
          'unlinkSync(resolve(repoRoot, "services/api/wrangler.release.toml"))',
        ) &&
        ciWorkflow.includes("om-ai.omdala.com/app") &&
        ciWorkflow.includes("Audit OM AI mobile dependencies") &&
        ciWorkflow.includes("Audit OM AI root dependencies") &&
        ciWorkflow.includes("Audit OM AI web dependencies") &&
        ciWorkflow.includes("OM AI Web Typecheck and Build") &&
        ciWorkflow.includes("working-directory: om-ai.omdala.com/app") &&
        ciWorkflow.includes("working-directory: om-ai.omdala.com/web") &&
        mobilePackage.includes(
          '"test": "npm run test:contract && npm run test:unit && npm run typecheck"',
        ) &&
        mobilePackage.includes('"test:unit": "jest --runInBand"') &&
        mobilePackage.includes('"typecheck": "tsc --noEmit"'),
    },
    {
      id: "STAGING_BINDS_RELEASE_RUN_ARTIFACTS",
      pass:
        staging.includes("api_release_run_id") &&
        staging.includes("surface_release_run_id") &&
        staging.includes("omdala-pre-migration-backup-") &&
        staging.includes("database_backup_receipt_sha256") &&
        staging.includes("encrypted_backup_decrypt_verified") &&
        apiDeploy.includes("api_url: $api_url") &&
        staging.includes(
          "E2E_STAGING_API_URL: ${{ steps.release_chain.outputs.api_url }}",
        ) &&
        staging.includes(
          "E2E_STAGING_WEB_URL: ${{ steps.release_chain.outputs.web_url }}",
        ) &&
        staging.includes(
          "E2E_STAGING_APP_URL: ${{ steps.release_chain.outputs.app_url }}",
        ) &&
        staging.includes(
          "E2E_STAGING_AUTH_URL: ${{ steps.release_chain.outputs.auth_url }}",
        ) &&
        staging.includes(
          "E2E_STAGING_BRAND_URL: ${{ steps.release_chain.outputs.brand_url }}",
        ),
    },
    {
      id: "PLAYWRIGHT_EXECUTION_RECEIPT",
      pass:
        staging.includes("playwright-staging-receipt.mjs") &&
        staging.includes("staging-e2e-receipt.json"),
    },
    {
      id: "MAIL_PROVIDER_RECEIPT_ASSERTED",
      pass:
        mailE2e.includes('transport: "mail-api"') &&
        mailE2e.includes("providerMessageId: expect.any(String)"),
    },
    {
      id: "AUTH_PROTECTED_SURFACE_CHAIN",
      pass:
        surfaceDeploy.includes("OMDALA_AUTH_URL") &&
        surfaceDeploy.includes("OMDALA_AUTH_PAGES_PROJECT") &&
        surfaceDeploy.includes("pnpm --filter @omdala/auth run build") &&
        surfaceDeploy.includes("apps/auth/out auth") &&
        surfaceDeploy.includes("infra/staging/surfaces/auth.wrangler.jsonc") &&
        surfaceDeploy.includes("auth) printf '%s\\n' apps/auth/out") &&
        surfaceDeploy.includes('"$(directory_for "$surface")"') &&
        surfaceDeploy.includes('verify_release auth "$AUTH_URL"') &&
        surfaceDeploy.includes("${AUTH_URL%/}/login/"),
    },
    {
      id: "AUTH_REDIRECT_ENVIRONMENT_BOUND",
      pass:
        authLogin.includes('validatePublicOrigin(\n          "app"') &&
        authLogin.includes("normalizePublicPath(data.redirectTo") &&
        authLogin.includes("NEXT_PUBLIC_APP_ORIGIN") &&
        authLogin.includes("NEXT_PUBLIC_RELEASE_ENVIRONMENT") &&
        !authLogin.includes("router.replace(`https://app.omdala.com"),
    },
    {
      id: "STAGING_NAVIGATION_ENVIRONMENT_BOUND",
      pass:
        appAuthGate.includes('resolvePublicOrigin(\n            "auth"') &&
        appLogin.includes('resolvePublicOrigin(\n    "auth"') &&
        webChrome.includes('resolvePublicOrigin(\n    "app"') &&
        appAuthGate.includes("NEXT_PUBLIC_AUTH_ORIGIN") &&
        appLogin.includes("NEXT_PUBLIC_AUTH_ORIGIN") &&
        webChrome.includes("NEXT_PUBLIC_APP_ORIGIN") &&
        appAuthGate.includes("NEXT_PUBLIC_RELEASE_ENVIRONMENT") &&
        appLogin.includes("NEXT_PUBLIC_RELEASE_ENVIRONMENT") &&
        webChrome.includes("NEXT_PUBLIC_RELEASE_ENVIRONMENT") &&
        !appAuthGate.includes("https://auth.omdala.com") &&
        !appLogin.includes("https://auth.omdala.com") &&
        !webChrome.includes("https://app.omdala.com"),
    },
    {
      id: "PUBLIC_ORIGIN_PREFLIGHT",
      pass:
        publicOrigins.includes("validatePublicOrigin") &&
        publicOrigins.includes('environment === "production"') &&
        publicOrigins.includes('staging: "https://app-staging.omdala.com"') &&
        publicOrigins.includes('staging: "https://auth-staging.omdala.com"') &&
        publicOrigins.includes('staging: "https://api-staging.omdala.com"') &&
        !publicOrigins.includes("stagingSuffixes") &&
        publicConfigValidator.includes('validatePublicOrigin(\n  "app"') &&
        publicConfigValidator.includes('validatePublicOrigin(\n  "auth"') &&
        publicConfigValidator.includes('validatePublicOrigin(\n  "api"') &&
        surfaceDeploy.includes("NEXT_PUBLIC_AUTH_ORIGIN") &&
        surfaceDeploy.includes("validate-surface-public-config.mjs"),
    },
    {
      id: "STAGING_APP_CSP_LIVE_READBACK",
      pass:
        surfaceDeploy.includes(
          'verify_staging_policy app "$APP_URL" /workspace/ true',
        ) &&
        surfaceDeploy.includes("https://api-staging.omdala.com") &&
        surfaceDeploy.includes(
          "live staging CSP permits the production API origin",
        ),
    },
    {
      id: "SURFACE_RECEIPT_REQUIRES_AUTH",
      pass:
        surfaceDeploy.includes("scripts/surface-release-contract.mjs") &&
        surfaceDeploy.includes(
          "--manifest auth=surface-release-manifests/auth.json",
        ) &&
        staging.includes('.surface_names == ["web", "app", "auth", "brand"]') &&
        surfaceContract.includes('["web", "app", "auth", "brand"]'),
    },
    {
      id: "STAGING_SURFACE_DEPLOYMENT_IDENTITY_AND_ROLLBACK",
      pass:
        surfaceDeploy.includes("wrangler deployments list") &&
        surfaceDeploy.includes("wrangler versions view") &&
        surfaceDeploy.includes("wrangler rollback") &&
        surfaceDeploy.includes('wrangler delete "$worker_name"') &&
        surfaceDeploy.includes("surface-worker-deployments/attempted") &&
        surfaceDeploy.includes(
          "--deployment web=surface-worker-deployments/web.json",
        ) &&
        surfaceContract.includes("validateWorkerDeployment") &&
        surfaceContract.includes("worker_deployments: deployments"),
    },
    {
      id: "STAGING_SURFACE_EXACT_REMOTE_AUTHORITY",
      pass:
        !surfaceDeploy.includes("--keep-vars") &&
        surfaceDeploy.includes("--strict") &&
        (surfaceDeploy.match(/wrangler secret list/g)?.length ?? 0) === 2 &&
        (surfaceDeploy.match(/--format json/g)?.length ?? 0) === 2 &&
        (surfaceDeploy.match(
          /node scripts\/verify-surface-worker-authority\.mjs/g,
        )?.length ?? 0) === 3 &&
        surfaceDeploy.includes("provider-worker-missing") &&
        surfaceDeploy.includes("surface-worker-deployments/secrets-pre") &&
        surfaceDeploy.includes("surface-worker-deployments/secrets-post") &&
        surfaceDeploy.includes("surface-worker-deployments/authority") &&
        surfaceDeploy.includes("pre_secret_inventory_receipt_sha256") &&
        surfaceDeploy.includes("post_secret_inventory_receipt_sha256") &&
        surfaceDeploy.includes("worker_authority_receipt_sha256") &&
        surfaceDeploy.includes("pre_secret_inventory_verified") &&
        surfaceDeploy.includes("post_secret_inventory_verified") &&
        surfaceDeploy.includes("worker_authority_verified") &&
        surfaceDeploy.includes("asset_binding_verified: $worker_authority_verified") &&
        surfaceDeploy.includes("asset_binding_name: $asset_binding_name") &&
        surfaceContract.includes("pre_secret_inventory_receipt_sha256") &&
        surfaceContract.includes("post_secret_inventory_receipt_sha256") &&
        surfaceContract.includes("worker_authority_receipt_sha256") &&
        surfaceContract.includes('record.asset_binding_name !== "ASSETS"') &&
        surfaceWorkerAuthority.includes(
          "SURFACE_WORKER_SECRET_INVENTORY_EXACT_EMPTY",
        ) &&
        surfaceWorkerAuthority.includes("SURFACE_WORKER_AUTHORITY_EXACT") &&
        surfaceWorkerAuthority.includes(
          "Provider surface Worker bindings must be exactly ASSETS:assets",
        ) &&
        surfaceWorkerAuthority.includes(
          'providerWorkerMissing && phase !== "preflight"',
        ) &&
        (surfaceWorkerConfigs.match(/"binding": "ASSETS"/g)?.length ?? 0) ===
          4 &&
        (surfaceWorkerConfigs.match(/"name": "omdala-surface-/g)?.length ?? 0) ===
          4 &&
        (surfaceWorkerConfigs.match(/"main": "\.\/static-worker\.mjs"/g)
          ?.length ?? 0) === 4 &&
        (surfaceWorkerConfigs.match(/"run_worker_first": true/g)?.length ?? 0) ===
          4 &&
        !surfaceWorkerConfigs.includes('"keep_vars"') &&
        surfaceStaticWorker.includes("return env.ASSETS.fetch(request)") &&
        !/fetch\s*\(\s*["'`]/.test(surfaceStaticWorker),
    },
    {
      id: "PRODUCTION_PAGES_DEPLOYMENT_IDENTITY_AND_ROLLBACK",
      pass:
        surfaceDeploy.includes("surface-pages-deployments/pre") &&
        surfaceDeploy.includes("/deployments/${previous}/rollback") &&
        surfaceDeploy.includes(
          "--pages-deployment web=surface-pages-deployments/web.json",
        ) &&
        surfaceDeploy.includes("Upload raw surface provider evidence") &&
        surfaceContract.includes("validatePagesDeployment") &&
        surfaceContract.includes("pages_deployments: pages"),
    },
    {
      id: "TRUSTED_RELEASE_CONTROL_PLANE",
      pass:
        apiDeploy.includes(
          "Require the workflow control plane from current main",
        ) &&
        surfaceDeploy.includes(
          "Require the workflow control plane from current main",
        ) &&
        staging.includes(
          "Require the workflow control plane from current main",
        ) &&
        apiDeploy.includes("$RUNNER_TEMP/omdala-release-review-policy.mjs") &&
        surfaceDeploy.includes(
          "$RUNNER_TEMP/omdala-release-review-policy.mjs",
        ) &&
        staging.includes("$RUNNER_TEMP/omdala-release-review-policy.mjs"),
    },
    {
      id: "CLOUDFLARE_ACCOUNT_AUTHORITY_BOUND",
      pass:
        apiAccountStep.includes(
          "--wrangler-config services/api/wrangler.toml",
        ) &&
        surfaceAccountStep.includes(
          "--wrangler-config services/api/wrangler.toml",
        ) &&
        stagingAccountStep.includes(
          "--wrangler-config services/api/wrangler.toml",
        ) &&
        apiDeploy.includes("cloudflare_account_id: $cloudflare_account_id") &&
        surfaceDeploy.includes(
          '--cloudflare-account-id "$CLOUDFLARE_ACCOUNT_ID"',
        ) &&
        staging.includes(".cloudflare_account_id == $cloudflare_account_id") &&
        apiReceiptStep.includes(
          "CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}",
        ) &&
        surfaceReceiptStep.includes(
          "CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}",
        ),
    },
    {
      id: "API_HYPERDRIVE_ENVIRONMENT_BINDING",
      pass:
        (apiDeploy.match(
          /OMDALA_HYPERDRIVE_ID: \$\{\{ vars\.OMDALA_HYPERDRIVE_ID \}\}/g,
        )?.length ?? 0) >= 2 &&
        apiDeploy.includes("node scripts/render-api-wrangler-config.mjs") &&
        apiDeploy.includes(
          "API_WRANGLER_CONFIG: services/api/wrangler.release.toml",
        ) &&
        (deployApiJob.match(/--config \"\$API_WRANGLER_CONFIG\"/g)?.length ??
          0) >= 6 &&
        !deployApiJob.includes("--config services/api/wrangler.toml") &&
        deployApiJob.includes(
          "node scripts/verify-api-version-hyperdrive.mjs",
        ) &&
        deployApiJob.includes("--receipt api-hyperdrive-provider.json") &&
        apiReceiptStep.includes("hyperdrive_id: $hyperdrive_id") &&
        apiReceiptStep.includes(
          "hyperdrive_binding_verified: $hyperdrive_binding_verified",
        ) &&
        apiConfigPolicy.includes("const HYPERDRIVE_ID = /^[0-9a-f]{32}$/") &&
        apiConfigRenderer.includes(
          'environment === "staging" ? "env.staging.hyperdrive" : "hyperdrive"',
        ) &&
        apiConfigRenderer.includes("dirname(input) !== dirname(output)") &&
        apiVersionVerifier.includes(
          "Provider version schema does not expose resources.bindings",
        ) &&
        apiVersionVerifier.includes('binding.name !== "HYPERDRIVE"') &&
        apiVersionVerifier.includes("binding.id !== expectedHyperdriveId") &&
        staging.includes('(.api_hyperdrive_id | test("^[0-9a-f]{32}$"))') &&
        staging.includes('.api_hyperdrive_binding == "HYPERDRIVE"') &&
        staging.includes(".api_hyperdrive_binding_verified == true") &&
        staging.includes(
          '(.api_wrangler_config_sha256 | test("^[0-9a-f]{64}$"))',
        ) &&
        apiDeploy.includes('(.api_hyperdrive_id | test("^[0-9a-f]{32}$"))') &&
        apiDeploy.includes('.api_hyperdrive_binding == "HYPERDRIVE"') &&
        apiDeploy.includes(".api_hyperdrive_binding_verified == true") &&
        apiDeploy.includes(
          '(.api_wrangler_config_sha256 | test("^[0-9a-f]{64}$"))',
        ) &&
        productionReceipt.includes(
          'validateHyperdriveEvidence(stagingApiReceipt, "Staging API receipt")',
        ) &&
        productionReceipt.includes(
          'validateHyperdriveEvidence(receipt, "Production API receipt")',
        ),
    },
    {
      id: "DATA_PLANE_ENVIRONMENT_ISOLATION",
      pass:
        (apiDeploy.match(/node scripts\/hyperdrive-target-guard\.mjs/g)?.length ??
          0) === 3 &&
        apiDeploy.includes("api-readonly-hyperdrive-receipt.json") &&
        apiDeploy.includes("api-hyperdrive-target-before-receipt.json") &&
        apiDeploy.includes("api-hyperdrive-target-after-receipt.json") &&
        apiDeploy.includes("Hyperdrive origin changed during the release transaction") &&
        apiDeploy.includes(".hyperdrive_target_verified == true") &&
        apiDeploy.includes(".hyperdrive_isolated_from_production == true") &&
        staging.includes(".hyperdrive_origin_database == \"omdala_staging\"") &&
        staging.includes(".hyperdrive_origin_user == \"omdala_staging\"") &&
        postgresPreMigration.includes(
          "--production-authority config/production-data-authority.json",
        ) &&
        postgresPreMigration.includes('--environment "$RELEASE_ENVIRONMENT"') &&
        postgresTargetGuard.includes("STAGING_SOURCE_EQUALS_PRODUCTION") &&
        postgresTargetGuard.includes("SOURCE_ENVIRONMENT_AUTHORITY_MISMATCH") &&
        hyperdriveTargetGuard.includes("STAGING_HYPERDRIVE_NOT_ISOLATED") &&
        hyperdriveTargetGuard.includes(
          "HYPERDRIVE_ENVIRONMENT_AUTHORITY_MISMATCH",
        ) &&
        dataAuthority.includes('"postgres_database": "omdala_staging"') &&
        dataAuthority.includes('"postgres_user": "omdala_staging"') &&
        dataAuthority.includes('"postgres_database": "omdala_prod"') &&
        dataAuthority.includes('"postgres_user": "omdala_api"') &&
        productionReceipt.includes(
          "Staging and production Hyperdrive authorities are not distinct",
        ),
    },
    {
      id: "DISPATCH_RUN_IDENTITY_SEPARATES_CONTROL_PLANE_FROM_CANDIDATE",
      pass:
        staging.includes('.head_branch == "main"') &&
        staging.includes(".path == $path") &&
        staging.includes("api_control_plane_sha") &&
        staging.includes("surface_control_plane_sha") &&
        staging.includes("control_plane_sha: $control_plane_sha") &&
        !staging.includes(".head_sha == $sha"),
    },
    {
      id: "PRODUCTION_PROMOTION_BINDS_REVIEWED_TREE",
      pass:
        apiDeploy.includes(
          "omdala-staging-acceptance-${{ steps.independent_review.outputs.reviewed_sha }}",
        ) &&
        surfaceDeploy.includes(
          "omdala-staging-acceptance-${{ steps.independent_review.outputs.reviewed_sha }}",
        ) &&
        apiDeploy.includes(".candidate_tree_sha == $production_tree_sha") &&
        surfaceDeploy.includes(".candidate_tree_sha == $production_tree_sha") &&
        apiDeploy.includes("reviewed_tree_sha: $reviewed_tree_sha") &&
        surfaceContract.includes(
          "reviewed_tree_sha: normalizedReviewedTreeSha",
        ),
    },
    {
      id: "PRODUCTION_FINAL_RECEIPT_CHAIN",
      pass:
        production.includes("name: OMDALA Production Go-Live E2E") &&
        production.includes("environment: production") &&
        production.includes('test "$GITHUB_REF" = "refs/heads/main"') &&
        production.includes('test "$MAIN_SHA" = "$current_main"') &&
        (production.match(/node scripts\/production-acceptance-receipt\.mjs/g)
          ?.length ?? 0) === 2 &&
        (production.match(/--phase chain/g)?.length ?? 0) === 1 &&
        (production.match(/--phase final/g)?.length ?? 0) === 1 &&
        productionFinalReceiptStep.includes("--phase final") &&
        productionFinalReceiptStep.includes("--report production-e2e-results.json") &&
        productionFinalReceiptStep.includes('--workflow-run-id "$GITHUB_RUN_ID"') &&
        productionFinalReceiptStep.includes(
          '--workflow-run-attempt "$GITHUB_RUN_ATTEMPT"',
        ) &&
        productionFinalReceiptStep.includes("--output production-acceptance.json") &&
        productionReceiptUploadStep.includes(
          "omdala-production-acceptance-${{ inputs.merged_main_sha }}",
        ) &&
        productionReceiptUploadStep.includes("production-acceptance.json") &&
        productionReceiptUploadStep.includes("production-release-chain.json") &&
        productionReceiptUploadStep.includes("production-e2e-results.json") &&
        productionReceiptUploadStep.includes(
          "release-chain/staging/transaction/staging-transaction.json",
        ) &&
        productionReceipt.includes(
          "export function evaluateProductionReleaseChain(input)",
        ) &&
        productionReceipt.includes(
          "export function createProductionAcceptanceReceipt(input)",
        ) &&
        productionReceipt.includes(
          "const chain = evaluateProductionReleaseChain(input);",
        ) &&
        productionReceipt.includes(
          "const e2e = evaluateProductionPlaywrightReport(input.playwrightReport);",
        ) &&
        productionReceipt.includes(
          'invariant(e2e.accepted, "Production Playwright report is incomplete or contains failures.")',
        ) &&
        productionReceipt.includes('verdict: "PRODUCTION_ACCEPTED"'),
    },
    {
      id: "PRODUCTION_STAGING_API_SURFACE_EVIDENCE_CHAIN",
      pass:
        production.includes(
          "omdala-staging-transaction-${{ inputs.staging_candidate_sha }}-${{ inputs.staging_transaction_id }}",
        ) &&
        production.includes(
          "omdala-staging-acceptance-${{ inputs.staging_candidate_sha }}-${{ inputs.staging_transaction_id }}",
        ) &&
        production.includes("staging_transaction_run_id:") &&
        production.includes("staging_transaction_id:") &&
        (production.match(
          /run-id: \$\{\{ inputs\.staging_transaction_run_id \}\}/g,
        )?.length ?? 0) === 2 &&
        production.includes(
          'test "$STAGING_TRANSACTION_ID" = "staging-${STAGING_TRANSACTION_RUN_ID}-1"',
        ) &&
        !production.includes("staging_acceptance_run_id:") &&
        production.includes(
          "omdala-api-release-${{ inputs.merged_main_sha }}-production",
        ) &&
        production.includes(
          "omdala-pre-migration-backup-${{ inputs.merged_main_sha }}-production",
        ) &&
        production.includes(
          "omdala-surface-release-${{ inputs.merged_main_sha }}-production",
        ) &&
        [
          '--staging-transaction-id "$STAGING_TRANSACTION_ID"',
          '--staging-transaction-run-id "$STAGING_TRANSACTION_RUN_ID"',
          "--staging-run release-chain/runs/staging-transaction.json",
          "--api-run release-chain/runs/api.json",
          "--surface-run release-chain/runs/surfaces.json",
          "--staging-transaction-receipt release-chain/staging/transaction/staging-transaction.json",
          "--staging-transaction-acceptance-receipt release-chain/staging/transaction/staging-acceptance.json",
          "--staging-transaction-api-receipt release-chain/staging/transaction/api-release.json",
          "--staging-transaction-surface-receipt release-chain/staging/transaction/surface-release.json",
          "--staging-receipt release-chain/staging/acceptance/staging-acceptance.json",
          "--staging-api-receipt release-chain/staging/acceptance/release-chain/api/api-release.json",
          "--staging-backup-receipt release-chain/staging/acceptance/release-chain/backup/pre-migration-receipt.json",
          "--staging-surface-receipt release-chain/staging/acceptance/release-chain/surfaces/surface-release.json",
          "--staging-e2e-report release-chain/staging/acceptance/staging-e2e-results.json",
          "--api-receipt release-chain/api/api-release.json",
          "--backup-receipt release-chain/backup/pre-migration-receipt.json",
          '--encrypted-backup "${{ steps.backup_artifact.outputs.path }}"',
          "--surface-receipt release-chain/surfaces/surface-release.json",
        ].every((argument) => production.includes(argument)) &&
        productionReceipt.includes('name: "OMDALA Staging Transaction"') &&
        productionReceipt.includes(
          'path: ".github/workflows/staging-transaction.yml"',
        ) &&
        !productionReceipt.includes('name: "OMDALA Staging Go-Live E2E"') &&
        productionReceipt.includes(
          "function validateStagingTransactionReceipt(",
        ) &&
        productionReceipt.includes("function validateStagingReceipt(") &&
        productionReceipt.includes("function validateApiReceipt(") &&
        productionReceipt.includes("function validateSurfaceReceipt(") &&
        productionReceipt.includes(
          "stagingE2EReportSha256: sha256(stagingE2EReportBytes)",
        ) &&
        productionReceipt.includes("staging_acceptance: {") &&
        productionReceipt.includes("api: {") &&
        productionReceipt.includes("surfaces: {") &&
        productionReceipt.includes("receiptHashes: {") &&
        productionReceipt.includes(
          "stagingTransaction: stagingTransactionReceipt.sha256",
        ) &&
        productionReceipt.includes(
          "receipt.api_release_run_id === Number(stagingRun.id)",
        ) &&
        productionReceipt.includes(
          "receipt.surface_release_run_id === Number(stagingRun.id)",
        ) &&
        productionReceipt.includes(
          "apiReceipt.database_backup_receipt_sha256 === input.receiptHashes.backup",
        ),
    },
    {
      id: "PRODUCTION_EXACT_FOUR_SURFACES",
      pass:
        normalizedProductionReceipt.includes(
          'const REQUIRED_SURFACES = Object.freeze(["web", "app", "auth", "brand"]);',
        ) &&
        productionReceipt.includes(
          "JSON.stringify(receipt.surface_names) === JSON.stringify(REQUIRED_SURFACES)",
        ) &&
        productionReceipt.includes(
          'Object.keys(receipt.surfaces ?? {}).sort().join(",")',
        ) &&
        productionReceipt.includes(
          'Object.keys(receipt.pages_deployments ?? {}).sort().join(",")',
        ) &&
        normalizedProductionE2E.includes(
          'for (const [surface, baseUrl] of [ ["web", production.webUrl], ["app", production.appUrl], ["auth", production.authUrl], ["brand", production.brandUrl], ] as const) {',
        ) &&
        normalizedProductionE2EConfig.includes(
          'const CANONICAL_PRODUCTION_ORIGINS = Object.freeze({ web: "https://omdala.com", app: "https://app.omdala.com", auth: "https://auth.omdala.com", api: "https://api.omdala.com", brand: "https://brand.omdala.com", });',
        ),
    },
    {
      id: "PRODUCTION_MAGIC_LINK_TOKEN_PROTECTED",
      pass:
        productionMagicTokenSecretReferences === 2 &&
        production.includes(
          "E2E_PRODUCTION_SMOKE_MAGIC_LINK_TOKEN: ${{ secrets.OMDALA_PRODUCTION_SMOKE_MAGIC_LINK_TOKEN }}",
        ) &&
        productionTokenRedactionStep.includes(
          "MAGIC_LINK_TOKEN: ${{ secrets.OMDALA_PRODUCTION_SMOKE_MAGIC_LINK_TOKEN }}",
        ) &&
        productionTokenRedactionStep.includes(
          "if (!token || report.includes(token)) process.exit(1);",
        ) &&
        productionE2EConfig.includes("const magicLinkToken = required(") &&
        productionE2EConfig.includes(
          '"E2E_PRODUCTION_SMOKE_MAGIC_LINK_TOKEN"',
        ) &&
        productionE2EConfig.includes("magicLinkToken.length < 32") &&
        productionE2EConfig.includes("magicLinkToken,") &&
        productionE2E.includes(
          "`${production.apiUrl}/v1/auth/session/exchange`",
        ) &&
        (productionE2E.match(/token: production\.magicLinkToken/g)?.length ?? 0) ===
          2 &&
        productionReceipt.includes("authenticated_session_verified: true") &&
        productionReceipt.includes("secure_host_only_cookies_verified: true") &&
        productionReceipt.includes("logout_verified: true"),
    },
    {
      id: "PRODUCTION_SMOKE_MODEL_FREE",
      pass:
        productionModelGuardStep.includes(
          "node scripts/production-no-spend-contract.mjs production-no-spend-source.json",
        ) &&
        noSpendContract.includes("HEALTH_ROUTE_CONFIGURATION_ONLY") &&
        noSpendContract.includes("HEALTH_TEST_PROVES_ZERO_PROVIDER_EGRESS") &&
        noSpendContract.includes("DIRECT_UPSTREAM_EXECUTION_DISABLED") &&
        noSpendContract.includes("BROWSER_BLOCKS_MODEL_ENDPOINT") &&
        noSpendContract.includes("WEB_AI_AUTHENTICATED_OMDALA_API_ONLY") &&
        noSpendContract.includes("WEB_AI_API_ORIGIN_ENVIRONMENT_BOUND") &&
        noSpendContract.includes("WEB_AI_NO_BROWSER_PROVIDER_CREDENTIAL") &&
        noSpendContract.includes("WEB_AI_SINGLE_EXECUTION_PATH") &&
        noSpendContract.includes("WEB_AI_RESPONSE_FAILS_CLOSED") &&
        noSpendContract.includes("API_AIAGENT_CANONICAL_AUTHORITY") &&
        noSpendContract.includes("API_AIAGENT_PROXY_IS_SESSION_PROTECTED") &&
        noSpendContract.includes("API_AIAGENT_SECRET_AND_READBACK_RECEIPT") &&
        noSpendContract.includes("DIRECT_PROVIDER_IMPLEMENTATIONS_ABSENT") &&
        noSpendContract.includes("BROWSER_CSP_BLOCKS_PROVIDER_EGRESS") &&
        noSpendContract.includes("WORKER_AIAGENT_AUTHORITY_ONLY") &&
        apiIndex.includes('"direct_ai_disabled"') &&
        mailE2e.includes("https://staging-api.aiagent.iai.one") &&
        mailE2e.includes('error: { code: "direct_ai_disabled" }') &&
        apiIndex.includes("modelCallExecuted: false") &&
        aiHealthTest.includes("expect(fetchSpy).not.toHaveBeenCalled()") &&
        productionE2E.includes('await route.abort("blockedbyclient")') &&
        productionE2E.includes("modelOrSpendRequestsObserved).toBe(0)") &&
        JSON.stringify(productionApiPaths) ===
          JSON.stringify(requiredProductionApiPaths) &&
        productionReceipt.includes("validateNoSpendEvidence(input, chain.mainSha)") &&
        productionReceipt.includes("model_or_spend_requests_observed"),
    },
    {
      id: "PROTECTED_API_SECRET_DELIVERY",
      pass:
        apiSecretBundleStep.includes(
          "OMDALA_MAGIC_LINK_SECRET: ${{ secrets.OMDALA_MAGIC_LINK_SECRET }}",
        ) &&
        apiSecretBundleStep.includes(
          "OMDALA_MAIL_API_KEY: ${{ secrets.OMDALA_MAIL_API_KEY }}",
        ) &&
        apiSecretBundleStep.includes(
          "OMDALA_E2E_TEST_SECRET: ${{ inputs.environment == 'staging' && secrets.OMDALA_STAGING_E2E_TEST_SECRET || '' }}",
        ) &&
        apiSecretBundleStep.includes(
          "OMDALA_GOOGLE_CLIENT_SECRET: ${{ secrets.OMDALA_GOOGLE_CLIENT_SECRET }}",
        ) &&
        apiSecretBundleStep.includes(
          "OMDALA_GOOGLE_OAUTH_STATE_SECRET: ${{ secrets.OMDALA_GOOGLE_OAUTH_STATE_SECRET }}",
        ) &&
        apiSecretBundleStep.includes(
          "OMDALA_MAIL_STAGING_SINK_ADDRESS",
        ) &&
        apiSecretBundleStep.includes("writeFileSync(output") &&
        apiSecretBundleStep.includes("mode: 0o600") &&
        apiDeployStep.includes(
          '--secrets-file "$RUNNER_TEMP/omdala-api-secrets.json"',
        ) &&
        apiDeploy.includes('rm -f "$RUNNER_TEMP/omdala-api-secrets.json"') &&
        !apiDeploy.includes("wrangler secret put"),
    },
    {
      id: "NO_CONTINUE_ON_ERROR_IN_RELEASE_CHAIN",
      pass: !/continue-on-error\s*:\s*true/.test(releaseSources),
    },
  ];
  return {
    accepted: checks.every((check) => check.pass),
    checks,
    passed: checks.filter((check) => check.pass).length,
    total: checks.length,
  };
}

function readReleaseSources() {
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
    apiConfigPolicy: readFileSync(
      "scripts/staging-api-wrangler-policy.mjs",
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

function main() {
  const result = evaluateReleaseControlSources(readReleaseSources());
  const receipt = {
    schemaVersion: 1,
    verdict: result.accepted
      ? "RELEASE_CONTROLS_ACCEPTED"
      : "RELEASE_CONTROLS_BLOCKED",
    checkedAt: new Date().toISOString(),
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
