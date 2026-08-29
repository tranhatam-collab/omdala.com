import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const inventoryPath = resolve(
  repoRoot,
  "infra/config/infra-readonly-probe.targets.json",
);
const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
const wranglerBin = resolve(
  repoRoot,
  "services/api/node_modules/.bin/wrangler",
);
const args = new Set(process.argv.slice(2));
const remote = args.has("--remote");
const remoteConfirmed = args.has("--confirm-read-only-remote");
const outputArgIndex = process.argv.indexOf("--output");
const outputPath =
  outputArgIndex >= 0 ? process.argv[outputArgIndex + 1] : undefined;

if (remote && !remoteConfirmed) {
  throw new Error(
    "Remote probes require --confirm-read-only-remote. They list secret names, query D1 metadata, and fetch health endpoints without mutating them.",
  );
}

function read(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function git(...gitArgs) {
  try {
    return execFileSync("git", gitArgs, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

function commandVersion(command, commandArgs) {
  try {
    return execFileSync(command, commandArgs, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

function check(id, state, detail, owner = "TEAM_1_INFRA") {
  return { id, state, owner, detail };
}

function wranglerJson(commandArgs) {
  const result = spawnSync(wranglerBin, commandArgs, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH || "/tmp/omdala-wrangler-readonly.log",
    },
  });

  if (result.status !== 0) {
    const diagnostic = `${result.stdout}\n${result.stderr}`;
    const reason = /not authenticated|wrangler login|CLOUDFLARE_API_TOKEN/i.test(
      diagnostic,
    )
      ? "authentication_required"
      : /Could not read file|ENOENT/i.test(diagnostic)
        ? "config_path_error"
        : "wrangler_command_failed";
    return { ok: false, exit_code: result.status ?? 1, reason };
  }

  try {
    return { ok: true, json: JSON.parse(result.stdout) };
  } catch {
    return { ok: false, exit_code: 0, parse_error: true };
  }
}

function findFirstCount(value) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findFirstCount(entry);
      if (found !== null) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    if (typeof value.n === "number") return value.n;
    if (typeof value.n === "string" && /^\d+$/.test(value.n)) {
      return Number(value.n);
    }
    for (const entry of Object.values(value)) {
      const found = findFirstCount(entry);
      if (found !== null) return found;
    }
  }
  return null;
}

async function healthReceipt(url, { requireIdentity = true } = {}) {
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      redirect: "manual",
      signal: AbortSignal.timeout(25_000),
    });
    const contentType = response.headers.get("content-type") || "";
    let body = {};
    if (contentType.toLowerCase().includes("application/json")) {
      body = await response.json();
    }
    const releaseSha = body.release_sha ?? body.data?.release_sha ?? null;
    const deploymentId =
      body.deployment_id ?? body.data?.deployment_id ?? null;
    const applicationOk = body.ok ?? body.data?.ok ?? null;
    const applicationStatus = body.status ?? body.data?.status ?? null;
    const jsonResponse = contentType.toLowerCase().includes("application/json");
    const applicationReady =
      applicationOk === true || ["ok", "ready"].includes(applicationStatus);
    const identityReady = !requireIdentity || Boolean(releaseSha && deploymentId);

    let state = "VERIFIED_CURRENT";
    let reason;
    if (!response.ok || !jsonResponse || !applicationReady) {
      state = "CONTRADICTED";
      reason = "runtime_not_ready";
    } else if (!identityReady) {
      state = "BLOCKED";
      reason = "release_identity_missing";
    }

    return {
      state,
      reason,
      http_status: response.status,
      content_type: contentType,
      release_sha: releaseSha,
      deployment_id: deploymentId,
      application_ok: applicationOk,
      application_status: applicationStatus,
    };
  } catch (error) {
    return {
      state: "BLOCKED",
      reason: error instanceof Error ? error.name : "request_failed",
    };
  }
}

const head = git("rev-parse", "HEAD");
const branch = git("branch", "--show-current");
const upstream = git(
  "rev-parse",
  "--abbrev-ref",
  "--symbolic-full-name",
  "@{upstream}",
);
const status = git("status", "--porcelain");
const sourceArtifactState =
  head && status === "" ? "VERIFIED_HEAD_ONLY" : "VERIFIED_WORKTREE_ONLY";
const nodeMajor = Number(process.versions.node.split(".")[0]);
const pnpmVersion = commandVersion("pnpm", ["--version"]);
const npmVersion = commandVersion("npm", ["--version"]);
const ancestor = spawnSync(
  "git",
  ["merge-base", "--is-ancestor", "HEAD", "origin/main"],
  { cwd: repoRoot, stdio: "ignore" },
).status;
const apiContracts = read("services/api/src/contracts.ts");
const apiSource = read("services/api/src/index.ts");
const apiWrangler = read("services/api/wrangler.toml");
const deployWorkflow = read(".github/workflows/deploy.yml");
const pagesWrangler = read("om-ai.omdala.com/wrangler.toml");

const sourceChecks = [
  check(
    "SOURCE_VALID_HEAD",
    head ? "VERIFIED_CURRENT" : "BLOCKED",
    head ? `HEAD=${head}` : "No valid Git HEAD",
  ),
  check(
    "SOURCE_CLEAN_WORKTREE",
    status === "" ? "VERIFIED_CURRENT" : "CONTRADICTED",
    status === "" ? "Worktree clean" : "Worktree contains local changes",
  ),
  check(
    "SOURCE_REMOTE_UPSTREAM",
    upstream ? "VERIFIED_CURRENT" : "BLOCKED",
    upstream ? `upstream=${upstream}` : "Branch has no remote upstream",
  ),
  check(
    "SOURCE_SHA_ON_MAIN",
    ancestor === 0 ? "VERIFIED_CURRENT" : "BLOCKED",
    ancestor === 0
      ? "HEAD is an ancestor of origin/main"
      : "HEAD is not an ancestor of origin/main",
  ),
  check(
    "TOOLCHAIN_NODE_22",
    nodeMajor === 22 ? "VERIFIED_CURRENT" : "CONTRADICTED",
    `Node ${process.versions.node}; package requires >=22 <23`,
  ),
  check(
    "TOOLCHAIN_PNPM_9_15",
    pnpmVersion?.startsWith("9.15.")
      ? "VERIFIED_CURRENT"
      : "CONTRADICTED",
    `pnpm ${pnpmVersion ?? "unavailable"}; package pins 9.15.0`,
  ),
  check(
    "TOOLCHAIN_NPM_10_9_8",
    npmVersion === "10.9.8" ? "VERIFIED_CURRENT" : "CONTRADICTED",
    `npm ${npmVersion ?? "unavailable"}; nested audits pin 10.9.8`,
  ),
  check(
    "API_IDENTITY_CONTRACT",
    apiContracts.includes("RELEASE_SHA") &&
      apiContracts.includes("DEPLOYMENT_ID") &&
      apiSource.includes('app.get("/health/deep"')
      ? sourceArtifactState
      : "BLOCKED",
    "API binding types and deep-health route",
  ),
  check(
    "CI_IDENTITY_INJECTION",
    deployWorkflow.includes('--var "RELEASE_SHA:') &&
      deployWorkflow.includes('--var "DEPLOYMENT_ID:')
      ? sourceArtifactState
      : "BLOCKED",
    "Release workflow injects exact identity",
  ),
  check(
    "CI_PRODUCTION_MAIN_GUARD",
    deployWorkflow.includes("merge-base --is-ancestor")
      ? sourceArtifactState
      : "BLOCKED",
    "Production-only ancestry gate",
  ),
  check(
    "API_HYPERDRIVE_PRODUCTION",
    /^\[\[hyperdrive\]\]/m.test(apiWrangler)
      ? sourceArtifactState
      : "BLOCKED",
    "Production API requires a Hyperdrive binding; no ID is inferred",
  ),
  check(
    "API_HYPERDRIVE_STAGING",
    /^\[\[env\.staging\.hyperdrive\]\]/m.test(apiWrangler)
      ? sourceArtifactState
      : "BLOCKED",
    "Staging API requires its own non-inherited Hyperdrive binding",
  ),
  check(
    "API_ROUTE_PRODUCTION",
    /pattern\s*=\s*["']api\.omdala\.com\/\*["']/.test(apiWrangler)
      ? sourceArtifactState
      : "BLOCKED",
    "Production custom-domain route must be explicit after account ownership is decided",
  ),
  check(
    "API_ROUTE_STAGING",
    /pattern\s*=\s*["']api-staging\.omdala\.com\/\*["']/.test(
      apiWrangler,
    )
      ? sourceArtifactState
      : "BLOCKED",
    "Staging custom-domain route is not inferred from production",
  ),
  check(
    "PAGES_IDENTITY_SOURCE",
    pagesWrangler.includes("pages_build_output_dir")
      ? sourceArtifactState
      : "NOT_CHECKED",
    "om-ai is Pages; use CF_PAGES_COMMIT_SHA instead of Worker var injection",
    "TEAM_3_WEB",
  ),
];

const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  mode: remote ? "source-and-read-only-remote" : "source-only",
  repository: {
    root: repoRoot,
    branch,
    upstream,
    head,
    remote: git("remote", "get-url", "origin"),
  },
  toolchain: {
    node: process.versions.node,
    pnpm: pnpmVersion,
    npm: npmVersion,
  },
  source_checks: sourceChecks,
  runtime_inventory: inventory.local_targets,
  d1_staging_inventory: inventory.d1_staging,
  external_handoffs: inventory.external_handoffs.map((target) => ({
    ...target,
    state: "REPORTED_UNVERIFIED",
  })),
};

if (remote) {
  report.remote_checks = { workers: [], d1: [], health: [] };

  for (const target of inventory.local_targets.filter(
    (entry) => entry.kind === "cloudflare-worker",
  )) {
    const wranglerArgs = [
      "secret",
      "list",
      "--config",
      target.config,
      "--format",
      "json",
    ];
    if (target.environment === "staging") {
      wranglerArgs.push("--env", "staging");
    }
    const secretResult = wranglerJson(wranglerArgs);
    if (!secretResult.ok) {
      report.remote_checks.workers.push({
        id: target.id,
        state: "BLOCKED",
        reason: secretResult.reason,
        exit_code: secretResult.exit_code,
      });
      continue;
    }
    const names = Array.isArray(secretResult.json)
      ? secretResult.json
          .map((entry) => entry?.name)
          .filter((name) => typeof name === "string")
      : [];
    const malformedNames = names.filter((name) => name !== name.trim());
    report.remote_checks.workers.push({
      id: target.id,
      state: malformedNames.length === 0 ? "VERIFIED_CURRENT" : "CONTRADICTED",
      secret_names: names,
      malformed_secret_names: malformedNames,
    });
  }

  for (const database of inventory.d1_staging) {
    const result = wranglerJson([
      "d1",
      "execute",
      database.binding,
      "--config",
      "infra/d1/wrangler.toml",
      "--env",
      "staging",
      "--remote",
      "--command",
      "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf%';",
      "--json",
    ]);
    const tableCount = result.ok ? findFirstCount(result.json) : null;
    report.remote_checks.d1.push({
      id: database.database_name,
      state:
        result.ok && typeof tableCount === "number"
          ? "VERIFIED_CURRENT"
          : "BLOCKED",
      table_count: tableCount,
      reason: result.ok ? undefined : result.reason,
    });
  }

  for (const target of inventory.local_targets) {
    const url = target.health_url_env
      ? process.env[target.health_url_env]
      : undefined;
    if (url) {
      report.remote_checks.health.push({
        id: target.id,
        ...(await healthReceipt(url)),
      });
    }
  }

  for (const target of inventory.external_handoffs) {
    report.remote_checks.health.push({
      id: target.id,
      ...(await healthReceipt(target.public_health_url)),
      provenance: "reported target; independently probed by this script",
    });
  }
}

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) {
  writeFileSync(resolve(repoRoot, outputPath), serialized, "utf8");
} else {
  process.stdout.write(serialized);
}

const blockingSourceChecks = sourceChecks.filter((entry) =>
  ["BLOCKED", "CONTRADICTED"].includes(entry.state),
);
process.exitCode = blockingSourceChecks.length > 0 ? 2 : 0;
