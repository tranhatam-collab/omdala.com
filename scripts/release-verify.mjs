import { spawnSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const startedAt = new Date();
const releaseSha = runText("git", ["rev-parse", "HEAD"]) || "unknown";
const deploymentId = `verify-${releaseSha.slice(0, 12)}`;
const receiptPath =
  process.env.RELEASE_VERIFY_RECEIPT ||
  `/tmp/omdala-release-verify-${startedAt.toISOString().replaceAll(":", "-")}.json`;

function runText(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    timeout: 10_000,
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

const commonTimeout = 10 * 60 * 1000;
const steps = [
  {
    id: "DEPENDENCIES_FROZEN",
    command: "pnpm",
    args: ["install", "--frozen-lockfile"],
  },
  {
    id: "SOURCE_AND_INFRA_GATE",
    command: "node",
    args: ["scripts/infra-readonly-probe.mjs"],
  },
  {
    id: "RELEASE_GOVERNANCE",
    command: "npm",
    args: ["run", "test:release-governance"],
  },
  {
    id: "OM_AI_ROOT_DEPENDENCIES",
    command: "npm",
    args: ["ci", "--ignore-scripts", "--audit=false"],
    cwd: "om-ai.omdala.com",
  },
  {
    id: "OM_AI_BACKEND_DEPENDENCIES",
    command: "npm",
    args: ["ci", "--ignore-scripts", "--audit=false"],
    cwd: "om-ai.omdala.com/backend",
  },
  {
    id: "OM_AI_GATEWAY_DEPENDENCIES",
    command: "npm",
    args: ["ci", "--ignore-scripts", "--audit=false"],
    cwd: "om-ai.omdala.com/gateway",
  },
  {
    id: "OM_AI_WEB_DEPENDENCIES",
    command: "npm",
    args: ["ci", "--ignore-scripts", "--audit=false"],
    cwd: "om-ai.omdala.com/web",
  },
  {
    id: "OM_AI_MOBILE_DEPENDENCIES",
    command: "npm",
    args: ["ci", "--ignore-scripts", "--audit=false"],
    cwd: "om-ai.omdala.com/app",
  },
  {
    id: "INFRA_GATEWAY_DEPENDENCIES",
    command: "npm",
    args: ["ci", "--ignore-scripts", "--audit=false"],
    cwd: "infra/services/api-gateway",
  },
  {
    id: "INFRA_WORKER_DEPENDENCIES",
    command: "npm",
    args: ["ci", "--ignore-scripts", "--audit=false"],
    cwd: "infra/services/worker",
  },
  {
    id: "DEPENDENCY_SECURITY",
    command: "pnpm",
    args: ["security:audit"],
    requiresExternalAuditAuthorization: true,
  },
  {
    id: "OM_AI_ROOT_SECURITY",
    command: "npm",
    args: ["audit", "--audit-level=high", "--json"],
    cwd: "om-ai.omdala.com",
    captureJson: true,
    requiresExternalAuditAuthorization: true,
  },
  {
    id: "OM_AI_BACKEND_SECURITY",
    command: "npm",
    args: ["audit", "--audit-level=high", "--json"],
    cwd: "om-ai.omdala.com/backend",
    captureJson: true,
    requiresExternalAuditAuthorization: true,
  },
  {
    id: "OM_AI_GATEWAY_SECURITY",
    command: "npm",
    args: ["audit", "--audit-level=high", "--json"],
    cwd: "om-ai.omdala.com/gateway",
    captureJson: true,
    requiresExternalAuditAuthorization: true,
  },
  {
    id: "OM_AI_WEB_SECURITY",
    command: "npm",
    args: ["audit", "--audit-level=high", "--json"],
    cwd: "om-ai.omdala.com/web",
    captureJson: true,
    requiresExternalAuditAuthorization: true,
  },
  {
    id: "OM_AI_MOBILE_SECURITY",
    command: "npm",
    args: ["audit", "--audit-level=high", "--json"],
    cwd: "om-ai.omdala.com/app",
    captureJson: true,
    requiresExternalAuditAuthorization: true,
  },
  {
    id: "INFRA_GATEWAY_SECURITY",
    command: "npm",
    args: ["audit", "--audit-level=high", "--json"],
    cwd: "infra/services/api-gateway",
    captureJson: true,
    requiresExternalAuditAuthorization: true,
  },
  {
    id: "INFRA_WORKER_SECURITY",
    command: "npm",
    args: ["audit", "--audit-level=high", "--json"],
    cwd: "infra/services/worker",
    captureJson: true,
    requiresExternalAuditAuthorization: true,
  },
  {
    id: "LINT",
    command: "pnpm",
    args: ["lint"],
  },
  {
    id: "SHARED_TYPECHECK",
    command: "pnpm",
    args: ["typecheck"],
  },
  {
    id: "API_TESTS",
    command: "pnpm",
    args: ["--filter", "@omdala/api", "test"],
  },
  {
    id: "API_TYPECHECK",
    command: "pnpm",
    args: ["--filter", "@omdala/api", "run", "check"],
  },
  {
    id: "APP_TESTS",
    command: "pnpm",
    args: ["--filter", "@omdala/app", "test"],
  },
  {
    id: "CORE_TESTS",
    command: "pnpm",
    args: ["--filter", "@omdala/core", "test"],
  },
  {
    id: "BRAND_CORE_TESTS",
    command: "pnpm",
    args: ["test:brand-core"],
  },
  {
    id: "BRAND_MARKETPLACE_TESTS",
    command: "pnpm",
    args: ["--filter", "@omdala/brand-marketplace", "test"],
  },
  {
    id: "BILLING_TESTS",
    command: "pnpm",
    args: ["--filter", "@omdala/billing", "test"],
  },
  {
    id: "OM_AI_BACKEND_TESTS",
    command: "npm",
    args: ["test"],
    cwd: "om-ai.omdala.com/backend",
  },
  {
    id: "OM_AI_GATEWAY_TESTS",
    command: "npm",
    args: ["test"],
    cwd: "om-ai.omdala.com/gateway",
  },
  {
    id: "OM_AI_WEB_TYPECHECK",
    command: "npm",
    args: ["run", "typecheck"],
    cwd: "om-ai.omdala.com/web",
  },
  {
    id: "OM_AI_MOBILE_CONTRACT_TESTS",
    command: "npm",
    args: ["test"],
    cwd: "om-ai.omdala.com/app",
  },
  {
    id: "INFRA_GATEWAY_TESTS",
    command: "npm",
    args: ["test"],
    cwd: "infra/services/api-gateway",
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      PORT: "9999",
    },
  },
  {
    id: "INFRA_WORKER_TESTS",
    command: "npm",
    args: ["test"],
    cwd: "infra/services/worker",
    env: { DATABASE_URL: "postgresql://test:test@localhost:5432/test" },
  },
  {
    id: "PRODUCT_BUILDS",
    command: "pnpm",
    args: ["build:all"],
    timeout: 20 * 60 * 1000,
  },
  {
    id: "BRAND_EXCHANGE_BUILD",
    command: "pnpm",
    args: ["--filter", "@omdala/brand-marketplace", "run", "build"],
    timeout: 15 * 60 * 1000,
  },
  {
    id: "BRAND_EXCHANGE_LINT",
    command: "pnpm",
    args: ["--filter", "@omdala/brand-marketplace", "run", "lint"],
  },
  {
    id: "BRAND_EXCHANGE_TYPECHECK",
    command: "pnpm",
    args: ["--filter", "@omdala/brand-marketplace", "run", "typecheck"],
  },
  {
    id: "OM_AI_BACKEND_BUILD",
    command: "npm",
    args: ["run", "build"],
    cwd: "om-ai.omdala.com/backend",
  },
  {
    id: "OM_AI_GATEWAY_BUILD",
    command: "npm",
    args: ["run", "build"],
    cwd: "om-ai.omdala.com/gateway",
  },
  {
    id: "OM_AI_WEB_BUILD",
    command: "npm",
    args: ["run", "build"],
    cwd: "om-ai.omdala.com/web",
  },
  {
    id: "API_WRANGLER_PRODUCTION_RENDER",
    command: "node",
    args: [
      "scripts/render-api-wrangler-config.mjs",
      "--environment",
      "production",
      "--input",
      "services/api/wrangler.toml",
      "--output",
      "services/api/wrangler.release.toml",
    ],
    env: {
      OMDALA_HYPERDRIVE_ID: "11111111111111111111111111111111",
      OMDALA_GOOGLE_CLIENT_ID:
        "123-release-verify.apps.googleusercontent.com",
      RELEASE_SHA: releaseSha,
    },
  },
  {
    id: "API_WRANGLER_PRODUCTION_DRY_RUN",
    command: "services/api/node_modules/.bin/wrangler",
    args: [
      "deploy",
      "--config",
      "services/api/wrangler.release.toml",
      "--dry-run",
      "--strict",
    ],
    env: { WRANGLER_LOG_PATH: "/tmp/omdala-release-verify-wrangler.log" },
  },
  {
    id: "API_WRANGLER_STAGING_RENDER",
    command: "node",
    args: [
      "scripts/render-api-wrangler-config.mjs",
      "--environment",
      "staging",
      "--input",
      "services/api/wrangler.toml",
      "--output",
      "services/api/wrangler.release.toml",
    ],
    env: {
      OMDALA_HYPERDRIVE_ID: "22222222222222222222222222222222",
      OMDALA_GOOGLE_CLIENT_ID:
        "123-release-verify.apps.googleusercontent.com",
      RELEASE_SHA: releaseSha,
    },
  },
  {
    id: "API_WRANGLER_STAGING_DRY_RUN",
    command: "services/api/node_modules/.bin/wrangler",
    args: [
      "deploy",
      "--config",
      "services/api/wrangler.release.toml",
      "--dry-run",
      "--strict",
      "--env",
      "staging",
    ],
    env: { WRANGLER_LOG_PATH: "/tmp/omdala-release-verify-wrangler.log" },
  },
  {
    id: "APP_E2E",
    command: "pnpm",
    args: ["e2e:app"],
    timeout: 15 * 60 * 1000,
  },
  {
    id: "WEB_E2E",
    command: "pnpm",
    args: ["e2e:web"],
    timeout: 15 * 60 * 1000,
  },
  {
    id: "BRAND_EXCHANGE_E2E",
    command: "pnpm",
    args: ["e2e:brand-exchange"],
    timeout: 15 * 60 * 1000,
  },
  {
    id: "STAGING_E2E_DISCOVERY",
    command: "pnpm",
    args: [
      "--filter",
      "@omdala/app",
      "exec",
      "playwright",
      "test",
      "--config",
      "playwright.staging.config.ts",
      "--list",
    ],
    cwd: "apps/app",
    env: {
      E2E_STAGING_APP_URL: "https://app-staging.omdala.com",
      E2E_STAGING_API_URL: "https://api-staging.omdala.com",
      E2E_STAGING_AUTH_URL: "https://auth-staging.omdala.com",
      E2E_STAGING_BRAND_URL: "https://brand-staging.omdala.com",
      E2E_STAGING_WEB_URL: "https://staging.omdala.com",
      E2E_STAGING_MAIL_SINK_ADDRESS: "release-verify-sink@example.invalid",
      E2E_TEST_SECRET: "discovery-only-secret-not-used-0000",
      E2E_RELEASE_SHA: releaseSha,
      E2E_API_DEPLOYMENT_ID: `${deploymentId}-staging`,
      E2E_SURFACE_RELEASE_ID: `${deploymentId}-surfaces`,
    },
  },
];

if (process.env.RELEASE_VERIFY_REMOTE === "true") {
  steps.push({
    id: "READ_ONLY_REMOTE_INFRA",
    command: "node",
    args: [
      "scripts/infra-readonly-probe.mjs",
      "--remote",
      "--confirm-read-only-remote",
    ],
  });
}

const results = [];
const pnpmVersion = runText("pnpm", ["--version"]);
const npmVersion = runText("npm", ["--version"]);
const worktreeStatus = runText("git", ["status", "--porcelain"]);
const worktreeClean = worktreeStatus === "";
results.push({
  id: "TOOLCHAIN",
  state:
    process.versions.node === "22.22.3" &&
    pnpmVersion === "9.15.0" &&
    npmVersion === "10.9.8"
      ? "PASS"
      : "FAIL",
  node: process.versions.node,
  pnpm: pnpmVersion,
  npm: npmVersion,
});
results.push({
  id: "SOURCE_IDENTITY",
  state:
    worktreeClean && /^[0-9a-f]{40}$/.test(releaseSha) ? "PASS" : "FAIL",
  release_sha: releaseSha,
  worktree_clean: worktreeClean,
});

for (
  const step of results.every((result) => result.state === "PASS") ? steps : []
) {
  if (
    step.requiresExternalAuditAuthorization &&
    process.env.RELEASE_VERIFY_ALLOW_NETWORK_AUDIT !== "true"
  ) {
    console.log(`\n===== ${step.id} =====`);
    console.log(
      "BLOCKED_BY_EXPLICIT_NETWORK_APPROVAL: dependency-tree metadata was not sent to the registry.",
    );
    results.push({
      id: step.id,
      state: "BLOCKED",
      reason: "BLOCKED_BY_EXPLICIT_NETWORK_APPROVAL",
      duration_ms: 0,
      command: [step.command, ...step.args].join(" "),
      cwd: step.cwd || ".",
      env_keys: Object.keys(step.env || {}),
    });
    continue;
  }

  const started = Date.now();
  console.log(`\n===== ${step.id} =====`);
  const result = spawnSync(step.command, step.args, {
    cwd: resolve(repoRoot, step.cwd || "."),
    env: { ...process.env, ...step.env },
    stdio: step.captureJson ? ["ignore", "pipe", "inherit"] : "inherit",
    encoding: step.captureJson ? "utf8" : undefined,
    timeout: step.timeout || commonTimeout,
  });
  const passed = result.status === 0;
  const timedOut = result.error?.code === "ETIMEDOUT";
  let auditReport;
  let auditParseError;
  if (step.captureJson) {
    try {
      auditReport = JSON.parse(result.stdout || "{}");
    } catch {
      auditParseError = true;
    }
  }
  results.push({
    id: step.id,
    state: passed ? "PASS" : timedOut ? "TIMEOUT" : "FAIL",
    exit_code: result.status,
    signal: result.signal,
    duration_ms: Date.now() - started,
    command: [step.command, ...step.args].join(" "),
    cwd: step.cwd || ".",
    env_keys: Object.keys(step.env || {}),
    audit_report: auditReport,
    audit_parse_error: auditParseError,
  });
}

try {
  unlinkSync(resolve(repoRoot, "services/api/wrangler.release.toml"));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const failed = results.filter((result) => result.state !== "PASS");
const receipt = {
  schema_version: 1,
  evidence_type: "LOCAL_RELEASE_VERIFY",
  started_at: startedAt.toISOString(),
  completed_at: new Date().toISOString(),
  repository: {
    remote: runText("git", ["remote", "get-url", "origin"]),
    branch: runText("git", ["branch", "--show-current"]),
    release_sha: releaseSha,
    worktree_clean: worktreeClean,
  },
  verdict: failed.length === 0 ? "PASS" : "NO_GO",
  passed: results.length - failed.length,
  failed: failed.length,
  results,
};

writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
console.log(`\nReceipt: ${receiptPath}`);
console.log(
  `Release verification: ${receipt.verdict} (${receipt.passed}/${results.length} passed)`,
);
process.exitCode = failed.length === 0 ? 0 : 1;
