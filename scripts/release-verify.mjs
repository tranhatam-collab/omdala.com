import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
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
    id: "DEPENDENCY_SECURITY",
    command: "pnpm",
    args: ["security:audit"],
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
    id: "API_WRANGLER_PRODUCTION_DRY_RUN",
    command: "pnpm",
    args: [
      "--filter",
      "@omdala/api",
      "exec",
      "wrangler",
      "deploy",
      "--dry-run",
      "--strict",
      "--keep-vars",
      "--env",
      "",
      "--var",
      "ENVIRONMENT:production",
      "--var",
      `RELEASE_SHA:${releaseSha}`,
      "--var",
      `DEPLOYMENT_ID:${deploymentId}-production`,
    ],
    env: { WRANGLER_LOG_PATH: "/tmp/omdala-release-verify-wrangler.log" },
  },
  {
    id: "API_WRANGLER_STAGING_DRY_RUN",
    command: "pnpm",
    args: [
      "--filter",
      "@omdala/api",
      "exec",
      "wrangler",
      "deploy",
      "--dry-run",
      "--strict",
      "--keep-vars",
      "--env",
      "staging",
      "--var",
      "ENVIRONMENT:staging",
      "--var",
      `RELEASE_SHA:${releaseSha}`,
      "--var",
      `DEPLOYMENT_ID:${deploymentId}-staging`,
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
const nodeMajor = Number(process.versions.node.split(".")[0]);
const pnpmVersion = runText("pnpm", ["--version"]);
results.push({
  id: "TOOLCHAIN",
  state:
    nodeMajor === 22 && pnpmVersion?.startsWith("9.15.") ? "PASS" : "FAIL",
  node: process.versions.node,
  pnpm: pnpmVersion,
});

for (const step of steps) {
  const started = Date.now();
  console.log(`\n===== ${step.id} =====`);
  const result = spawnSync(step.command, step.args, {
    cwd: resolve(repoRoot, step.cwd || "."),
    env: { ...process.env, ...step.env },
    stdio: "inherit",
    timeout: step.timeout || commonTimeout,
  });
  const passed = result.status === 0;
  const timedOut = result.error?.code === "ETIMEDOUT";
  results.push({
    id: step.id,
    state: passed ? "PASS" : timedOut ? "TIMEOUT" : "FAIL",
    exit_code: result.status,
    signal: result.signal,
    duration_ms: Date.now() - started,
    command: [step.command, ...step.args].join(" "),
    cwd: step.cwd || ".",
    env_keys: Object.keys(step.env || {}),
  });
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
    worktree_clean: runText("git", ["status", "--porcelain"]) === "",
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
