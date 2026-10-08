import { spawnSync } from "node:child_process";

const ACCOUNT_ID = /^[0-9a-f]{32}$/;
const HYPERDRIVE_ID = /^[0-9a-f]{32}$/;
const RELEASE_SHA = /^[0-9a-f]{40}$/;
const GOOGLE_CLIENT_ID = /^[0-9]+-[a-z0-9-]+\.apps\.googleusercontent\.com$/;

const ROOT_VARS = Object.freeze({
  ENVIRONMENT: "production",
  APP_BASE_URL: "https://app.omdala.com",
  WEB_BASE_URL: "https://omdala.com",
  AUTH_BASE_URL: "https://auth.omdala.com",
  AIAGENT_API_URL: "https://api.aiagent.iai.one",
  AIAGENT_WORKSPACE_ID: "omdala-com-production",
  MAIL_API_URL: "https://mail.iai.one/_mail",
  MAIL_API_WORKSPACE_ID: "omdala.com",
  MAIL_DELIVERY_MODE: "direct",
  GOOGLE_REDIRECT_URI: "https://api.omdala.com/v1/auth/google/callback",
});

const STAGING_VARS = Object.freeze({
  ENVIRONMENT: "staging",
  APP_BASE_URL: "https://app-staging.omdala.com",
  WEB_BASE_URL: "https://staging.omdala.com",
  AUTH_BASE_URL: "https://auth-staging.omdala.com",
  AIAGENT_API_URL: "https://staging-api.aiagent.iai.one",
  AIAGENT_WORKSPACE_ID: "omdala-com-staging",
  MAIL_API_URL: "https://mail.iai.one/_mail",
  MAIL_API_WORKSPACE_ID: "omdala.com-staging",
  MAIL_DELIVERY_MODE: "sink",
  GOOGLE_REDIRECT_URI: "https://api-staging.omdala.com/v1/auth/google/callback",
});

function requireMatch(value, pattern, label) {
  const normalized = String(value ?? "").trim();
  if (!pattern.test(normalized)) throw new Error(`${label} is not canonical`);
  return normalized;
}

export function normalizeCloudflareAccountId(value) {
  return requireMatch(value, ACCOUNT_ID, "Cloudflare account ID");
}

export function normalizeHyperdriveId(value) {
  return requireMatch(value, HYPERDRIVE_ID, "Cloudflare Hyperdrive ID");
}

export function normalizeReleaseSha(value) {
  return requireMatch(value, RELEASE_SHA, "release SHA");
}

export function normalizeGoogleClientId(value) {
  return requireMatch(value, GOOGLE_CLIENT_ID, "Google OAuth client ID");
}

export function parseTrustedToml(source) {
  const result = spawnSync(
    "python3",
    ["-I", "-c", "import json,sys,tomllib; json.dump(tomllib.loads(sys.stdin.read()), sys.stdout)"],
    {
      input: String(source ?? ""),
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
      cwd: "/",
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin", PYTHONNOUSERSITE: "1" },
    },
  );
  if (result.status !== 0) {
    throw new Error(`API Wrangler TOML is invalid: ${result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertSemanticIdentity(actual, expected, label) {
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    throw new Error(`${label} does not match the exact trusted semantic policy`);
  }
}

function baseSemantic(accountId) {
  return {
    name: "omdala-api",
    main: "src/index.ts",
    compatibility_date: "2026-03-17",
    account_id: accountId,
    compatibility_flags: ["nodejs_compat"],
    workers_dev: false,
    preview_urls: false,
    routes: [{ pattern: "api.omdala.com", custom_domain: true }],
    version_metadata: { binding: "VERSION_METADATA" },
    vars: { ...ROOT_VARS },
    dev: { port: 8789 },
    env: {
      staging: {
        name: "omdala-api-staging",
        workers_dev: false,
        preview_urls: false,
        routes: [{ pattern: "api-staging.omdala.com", custom_domain: true }],
        version_metadata: { binding: "VERSION_METADATA" },
        vars: { ...STAGING_VARS },
      },
    },
  };
}

function renderSemantic({ accountId, environment, hyperdriveId, releaseSha, googleClientId }) {
  const value = baseSemantic(accountId);
  const releaseVars = environment === "production" ? value.vars : value.env.staging.vars;
  releaseVars.RELEASE_SHA = releaseSha;
  releaseVars.GOOGLE_CLIENT_ID = googleClientId;
  if (environment === "production") {
    value.hyperdrive = [{ binding: "HYPERDRIVE", id: hyperdriveId }];
  } else if (environment === "staging") {
    value.env.staging.hyperdrive = [{ binding: "HYPERDRIVE", id: hyperdriveId }];
  } else {
    throw new Error("Release environment must be exactly production or staging");
  }
  return value;
}

function renderVars(vars, releaseVars = false) {
  const lines = Object.entries(vars).map(([key, value]) => `${key} = ${JSON.stringify(value)}`);
  if (releaseVars) {
    lines.push(`RELEASE_SHA = ${JSON.stringify(releaseVars.releaseSha)}`);
    lines.push(`GOOGLE_CLIENT_ID = ${JSON.stringify(releaseVars.googleClientId)}`);
  }
  return lines;
}

export function canonicalBaseApiWranglerConfig(accountIdInput) {
  const accountId = normalizeCloudflareAccountId(accountIdInput);
  return [
    'name = "omdala-api"',
    'main = "src/index.ts"',
    'compatibility_date = "2026-03-17"',
    `account_id = "${accountId}"`,
    'compatibility_flags = ["nodejs_compat"]',
    "workers_dev = false",
    "preview_urls = false",
    "routes = [",
    '  { pattern = "api.omdala.com", custom_domain = true }',
    "]",
    "",
    "[version_metadata]",
    'binding = "VERSION_METADATA"',
    "",
    "[vars]",
    ...renderVars(ROOT_VARS),
    "",
    "[dev]",
    "port = 8789",
    "",
    "[env.staging]",
    'name = "omdala-api-staging"',
    "workers_dev = false",
    "preview_urls = false",
    "routes = [",
    '  { pattern = "api-staging.omdala.com", custom_domain = true }',
    "]",
    "",
    "[env.staging.version_metadata]",
    'binding = "VERSION_METADATA"',
    "",
    "[env.staging.vars]",
    ...renderVars(STAGING_VARS),
    "",
  ].join("\n");
}

export function canonicalRenderedApiWranglerConfig({
  accountId: accountIdInput,
  environment,
  hyperdriveId: hyperdriveIdInput,
  releaseSha: releaseShaInput,
  googleClientId: googleClientIdInput,
}) {
  const accountId = normalizeCloudflareAccountId(accountIdInput);
  const hyperdriveId = normalizeHyperdriveId(hyperdriveIdInput);
  const releaseSha = normalizeReleaseSha(releaseShaInput);
  const googleClientId = normalizeGoogleClientId(googleClientIdInput);
  const base = canonicalBaseApiWranglerConfig(accountId).trimEnd().split("\n");
  const selectedHeader = environment === "production" ? "[vars]" : "[env.staging.vars]";
  const start = base.indexOf(selectedHeader);
  if (start < 0) throw new Error("Trusted Wrangler template is missing release vars");
  let end = base.length;
  for (let index = start + 1; index < base.length; index += 1) {
    if (base[index].startsWith("[")) {
      end = index;
      break;
    }
  }
  base.splice(
    end,
    0,
    `RELEASE_SHA = "${releaseSha}"`,
    `GOOGLE_CLIENT_ID = "${googleClientId}"`,
  );
  const table = environment === "production" ? "hyperdrive" :
    environment === "staging" ? "env.staging.hyperdrive" : null;
  if (!table) throw new Error("Release environment must be exactly production or staging");
  return `${base.join("\n").trimEnd()}\n\n[[${table}]]\nbinding = "HYPERDRIVE"\nid = "${hyperdriveId}"\n`;
}

export function verifyBaseApiWranglerConfig({ source, accountId: accountIdInput }) {
  const accountId = normalizeCloudflareAccountId(accountIdInput);
  const parsed = parseTrustedToml(source);
  assertSemanticIdentity(parsed, baseSemantic(accountId), "Base API Wrangler config");
  const canonical = canonicalBaseApiWranglerConfig(accountId);
  if (source !== canonical) {
    throw new Error(
      "Base API Wrangler config must use the exact canonical TOML serialization; quoted, dotted, multiline, duplicate, and decoy syntax is forbidden",
    );
  }
  return { accountId, semantic: parsed, canonical };
}

function renderedInputsFromParsed(parsed, environment) {
  const selected = environment === "production" ? parsed : parsed?.env?.staging;
  const vars = selected?.vars;
  const binding = selected?.hyperdrive;
  return {
    accountId: parsed?.account_id,
    hyperdriveId: Array.isArray(binding) && binding.length === 1 ? binding[0]?.id : undefined,
    releaseSha: vars?.RELEASE_SHA,
    googleClientId: vars?.GOOGLE_CLIENT_ID,
  };
}

export function verifyRenderedApiWranglerConfig({
  source,
  environment,
  accountId,
  hyperdriveId,
  releaseSha,
  googleClientId,
}) {
  const parsed = parseTrustedToml(source);
  const observed = renderedInputsFromParsed(parsed, environment);
  const exact = {
    accountId: normalizeCloudflareAccountId(accountId ?? observed.accountId),
    hyperdriveId: normalizeHyperdriveId(hyperdriveId ?? observed.hyperdriveId),
    releaseSha: normalizeReleaseSha(releaseSha ?? observed.releaseSha),
    googleClientId: normalizeGoogleClientId(googleClientId ?? observed.googleClientId),
  };
  const expected = renderSemantic({ ...exact, environment });
  assertSemanticIdentity(parsed, expected, "Rendered API Wrangler config");
  const canonical = canonicalRenderedApiWranglerConfig({ ...exact, environment });
  if (source !== canonical) {
    throw new Error(
      "Rendered API Wrangler config must use the exact canonical TOML serialization; quoted, dotted, multiline, duplicate, and decoy syntax is forbidden",
    );
  }
  return { ...exact, environment, semantic: parsed, canonical };
}
