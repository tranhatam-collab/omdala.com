import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { normalizeHyperdriveId } from "./render-api-wrangler-config.mjs";

const RELEASE_SHA = /^[0-9a-f]{40}$/;
const VERSION_ID = /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
const RELEASE_ID = /^gh-[1-9][0-9]*-[1-9][0-9]*-[0-9a-f]{12}$/;
const GOOGLE_CLIENT_ID = /^[0-9]+-[a-z0-9-]+\.apps\.googleusercontent\.com$/;

const BASE_SECRETS = [
  "AIAGENT_API_KEY",
  "API_KEY_SECRET",
  "CSRF_SECRET",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_OAUTH_STATE_SECRET",
  "MAGIC_LINK_SECRET",
  "MAIL_API_KEY",
  "SERVICE_TOKEN_SECRET",
  "WEBHOOK_SECRET",
];

export function expectedApiSecretNames(environment) {
  if (environment !== "production" && environment !== "staging") {
    throw new Error("Environment must be exactly production or staging");
  }
  return [
    ...BASE_SECRETS,
    ...(environment === "staging"
      ? ["E2E_TEST_SECRET", "MAIL_STAGING_SINK_ADDRESS"]
      : []),
  ].sort();
}

function exactStringSet(actual, expected, label, allowMissing = false) {
  const normalized = [...actual].sort();
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${label} contains duplicate names`);
  }
  const unexpected = normalized.filter((name) => !expected.includes(name));
  if (unexpected.length) {
    throw new Error(`${label} contains unexpected names: ${unexpected.join(", ")}`);
  }
  const missing = expected.filter((name) => !normalized.includes(name));
  if (!allowMissing && missing.length) {
    throw new Error(`${label} is missing required names: ${missing.join(", ")}`);
  }
  return { names: normalized, missing };
}

export function verifyApiSecretInventory({ inventory, environment, allowMissing = false }) {
  if (!Array.isArray(inventory)) throw new Error("Secret inventory must be an array");
  const names = inventory.map((item) => {
    const name = typeof item === "string" ? item : item?.name;
    if (typeof name !== "string" || !/^[A-Z][A-Z0-9_]*$/.test(name)) {
      throw new Error("Secret inventory contains an invalid name");
    }
    return name;
  });
  const expected = expectedApiSecretNames(environment);
  const checked = exactStringSet(names, expected, "Worker secret inventory", allowMissing);
  return {
    verdict: allowMissing
      ? "API_SECRET_INVENTORY_SAFE_BEFORE_DEPLOY"
      : "API_SECRET_INVENTORY_EXACT",
    environment,
    expected_names: expected,
    actual_names: checked.names,
    missing_names: checked.missing,
  };
}

function expectedPlainText(environment, releaseSha, googleClientId) {
  if (!RELEASE_SHA.test(releaseSha ?? "")) {
    throw new Error("Expected release SHA is invalid");
  }
  if (!GOOGLE_CLIENT_ID.test(googleClientId ?? "")) {
    throw new Error("Expected Google client ID is invalid");
  }
  const staging = environment === "staging";
  if (!staging && environment !== "production") {
    throw new Error("Environment must be exactly production or staging");
  }
  return {
    ENVIRONMENT: environment,
    RELEASE_SHA: releaseSha,
    APP_BASE_URL: staging
      ? "https://app-staging.omdala.com"
      : "https://app.omdala.com",
    WEB_BASE_URL: staging ? "https://staging.omdala.com" : "https://omdala.com",
    AUTH_BASE_URL: staging
      ? "https://auth-staging.omdala.com"
      : "https://auth.omdala.com",
    AIAGENT_API_URL: staging
      ? "https://staging-api.aiagent.iai.one"
      : "https://api.aiagent.iai.one",
    AIAGENT_WORKSPACE_ID: staging
      ? "omdala-com-staging"
      : "omdala-com-production",
    MAIL_API_URL: "https://mail.iai.one/_mail",
    MAIL_API_WORKSPACE_ID: staging ? "omdala.com-staging" : "omdala.com",
    MAIL_DELIVERY_MODE: staging ? "sink" : "direct",
    GOOGLE_CLIENT_ID: googleClientId,
    GOOGLE_REDIRECT_URI: staging
      ? "https://api-staging.omdala.com/v1/auth/google/callback"
      : "https://api.omdala.com/v1/auth/google/callback",
  };
}

export function verifyApiVersionAuthority({
  version,
  versionId,
  releaseId,
  environment,
  releaseSha,
  googleClientId,
  hyperdriveId,
}) {
  if (!VERSION_ID.test(versionId ?? "")) throw new Error("Expected Worker version ID is invalid");
  if (!releaseId) throw new Error("Expected release ID is required");
  if (version?.id !== versionId) throw new Error("Provider version ID does not match deployment");
  if (version?.annotations?.["workers/message"] !== releaseId) {
    throw new Error("Provider version annotation does not match release ID");
  }
  const bindings = version?.resources?.bindings;
  if (!Array.isArray(bindings)) {
    throw new Error("Provider version schema does not expose resources.bindings");
  }
  const supported = new Set(["plain_text", "secret_text", "hyperdrive", "version_metadata"]);
  const unsupported = bindings.filter((binding) => !supported.has(binding?.type));
  if (unsupported.length) throw new Error("Provider version contains unsupported bindings");

  const plain = bindings.filter((binding) => binding?.type === "plain_text");
  const expectedPlain = expectedPlainText(environment, releaseSha, googleClientId);
  exactStringSet(
    plain.map((binding) => binding?.name),
    Object.keys(expectedPlain).sort(),
    "Worker plain-text binding inventory",
  );
  for (const binding of plain) {
    if (binding.text !== expectedPlain[binding.name]) {
      throw new Error(`Worker plain-text binding ${binding.name} has unexpected value`);
    }
  }

  const secretResult = verifyApiSecretInventory({
    inventory: bindings
      .filter((binding) => binding?.type === "secret_text")
      .map((binding) => binding.name),
    environment,
  });
  const metadata = bindings.filter((binding) => binding?.type === "version_metadata");
  if (metadata.length !== 1 || metadata[0]?.name !== "VERSION_METADATA") {
    throw new Error("Provider version metadata binding is not exact");
  }
  const expectedHyperdriveId = normalizeHyperdriveId(hyperdriveId);
  const hyperdrive = bindings.filter((binding) => binding?.type === "hyperdrive");
  if (
    hyperdrive.length !== 1 ||
    hyperdrive[0]?.name !== "HYPERDRIVE" ||
    hyperdrive[0]?.id !== expectedHyperdriveId
  ) {
    throw new Error("Provider Hyperdrive binding is not exact");
  }
  return {
    verdict: "API_WORKER_AUTHORITY_EXACT",
    environment,
    version_id: versionId,
    release_id: releaseId,
    release_sha: releaseSha,
    hyperdrive_id: expectedHyperdriveId,
    plain_text_names: Object.keys(expectedPlain).sort(),
    secret_names: secretResult.actual_names,
    version_metadata_binding: "VERSION_METADATA",
  };
}

export function verifyApiRemotePreflight({
  deployments,
  secretInventory,
  version,
  environment,
  googleClientId,
  hyperdriveId,
  allowMissingResource = false,
}) {
  if (environment !== "production" && environment !== "staging") {
    throw new Error("Environment must be exactly production or staging");
  }
  if (allowMissingResource && environment !== "staging") {
    throw new Error("Only staging may allow a missing Worker resource");
  }
  if (!Array.isArray(deployments)) {
    throw new Error("Worker deployment inventory must be an array");
  }
  if (!Array.isArray(secretInventory)) {
    throw new Error("Secret inventory must be an array");
  }
  const expectedHyperdriveId = normalizeHyperdriveId(hyperdriveId);

  if (deployments.length === 0) {
    if (!allowMissingResource) {
      throw new Error("Production requires an existing Worker rollback baseline");
    }
    if (secretInventory.length !== 0 || version !== null) {
      throw new Error("A missing staging Worker must not claim secrets or a current version");
    }
    verifyApiSecretInventory({
      inventory: secretInventory,
      environment,
      allowMissing: true,
    });
    return {
      verdict: "API_REMOTE_PREFLIGHT_MISSING_STAGING_RESOURCE_ALLOWED",
      environment,
      resource_exists: false,
      rollback_baseline_verified: false,
      secret_inventory_verified: true,
      hyperdrive_binding_verified: false,
      hyperdrive_id: expectedHyperdriveId,
      current_deployment_id: null,
      current_version_id: null,
    };
  }

  const normalized = deployments.map((deployment) => {
    const timestamp = Date.parse(deployment?.created_on ?? "");
    if (
      !VERSION_ID.test(deployment?.id ?? "") ||
      !Number.isFinite(timestamp) ||
      !Array.isArray(deployment?.versions)
    ) {
      throw new Error("Worker deployment inventory contains a malformed deployment");
    }
    return { deployment, timestamp };
  });
  if (new Set(normalized.map(({ deployment }) => deployment.id)).size !== normalized.length) {
    throw new Error("Worker deployment inventory contains duplicate deployment IDs");
  }
  const latestTimestamp = Math.max(...normalized.map(({ timestamp }) => timestamp));
  const latestMatches = normalized.filter(({ timestamp }) => timestamp === latestTimestamp);
  if (latestMatches.length !== 1) {
    throw new Error("Worker deployment inventory has an ambiguous current deployment");
  }
  const current = latestMatches[0].deployment;
  if (
    current.versions.length !== 1 ||
    current.versions[0]?.percentage !== 100 ||
    !VERSION_ID.test(current.versions[0]?.version_id ?? "")
  ) {
    throw new Error("Current Worker deployment is not one exact 100% rollback baseline");
  }
  const versionId = current.versions[0].version_id;
  if (!version || version.id !== versionId) {
    throw new Error("Current Worker version readback does not match the rollback baseline");
  }

  const secrets = verifyApiSecretInventory({
    inventory: secretInventory,
    environment,
  });
  const bindings = version?.resources?.bindings;
  if (!Array.isArray(bindings)) {
    throw new Error("Provider version schema does not expose resources.bindings");
  }
  const releaseSha = bindings.find(
    (binding) => binding?.type === "plain_text" && binding?.name === "RELEASE_SHA",
  )?.text;
  const releaseId = version?.annotations?.["workers/message"];
  if (!RELEASE_ID.test(releaseId ?? "")) {
    throw new Error("Rollback baseline release annotation is not an immutable release ID");
  }
  const authority = verifyApiVersionAuthority({
    version,
    versionId,
    releaseId,
    environment,
    releaseSha,
    googleClientId,
    hyperdriveId: expectedHyperdriveId,
  });

  return {
    verdict: "API_REMOTE_PREFLIGHT_ACCEPTED",
    environment,
    resource_exists: true,
    rollback_baseline_verified: true,
    secret_inventory_verified: secrets.missing_names.length === 0,
    hyperdrive_binding_verified: true,
    hyperdrive_id: expectedHyperdriveId,
    current_deployment_id: current.id,
    current_version_id: versionId,
    current_release_id: releaseId,
    current_release_sha: releaseSha,
    worker_authority_verdict: authority.verdict,
  };
}

export function evaluateApiRemotePreflightWorkflow(source) {
  const validateStart = source.indexOf("\n  validate:");
  const migrateStart = source.indexOf("\n  migrate-database:");
  const deployStart = source.indexOf("\n  deploy-api:");
  const validate = source.slice(validateStart, migrateStart);
  const deploy = source.slice(deployStart);
  const checks = [
    {
      id: "READ_ONLY_PREFLIGHT_BEFORE_MIGRATION",
      pass:
        validateStart >= 0 &&
        migrateStart > validateStart &&
        validate.includes("Read-only API provider preflight before database migration") &&
        validate.includes("wrangler deployments list") &&
        validate.includes("wrangler versions view") &&
        validate.includes("wrangler secret list") &&
        validate.includes("wrangler hyperdrive get") &&
        validate.includes("hyperdrive-target-guard.mjs") &&
        validate.includes("verify-api-worker-authority.mjs"),
    },
    {
      id: "PRODUCTION_RESOURCE_REQUIRED_STAGING_MAY_BOOTSTRAP",
      pass:
        validate.includes(
          'if [[ "$RELEASE_ENVIRONMENT" == "staging" ]] && [[ "$worker_exists" == "false" ]]; then',
        ) &&
        validate.includes("preflight_args+=(--allow-missing-resource)"),
    },
    {
      id: "DEPLOYMENT_RECHECK_PRESERVED",
      pass:
        deploy.includes("Verify Hyperdrive provider target before deployment") &&
        deploy.includes("Snapshot exact API rollback state") &&
        deploy.includes("Reject unknown remote API secrets") &&
        deploy.includes("--receipt api-remote-preflight-before-deploy.json") &&
        (source.match(/wrangler hyperdrive get/g)?.length ?? 0) >= 3 &&
        (source.match(/wrangler deployments list/g)?.length ?? 0) >= 3 &&
        (source.match(/wrangler versions view/g)?.length ?? 0) >= 2 &&
        (source.match(/wrangler secret list/g)?.length ?? 0) >= 3,
    },
    {
      id: "MIGRATION_DEPENDS_ON_VALIDATE",
      pass: /migrate-database:[\s\S]*?needs:\s*validate/.test(source),
    },
  ];
  return { accepted: checks.every((check) => check.pass), checks };
}

function main() {
  const { values } = parseArgs({
    options: {
      "secret-json": { type: "string" },
      "allow-missing": { type: "boolean", default: false },
      "allow-missing-resource": { type: "boolean", default: false },
      "deployments-json": { type: "string" },
      "version-json": { type: "string" },
      "version-id": { type: "string" },
      "release-id": { type: "string" },
      environment: { type: "string" },
      "release-sha": { type: "string" },
      "google-client-id": { type: "string" },
      "hyperdrive-id": { type: "string" },
      receipt: { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });
  if (!values.environment || !values.receipt) {
    throw new Error("--environment and --receipt are required");
  }
  let raw;
  let result;
  if (values["deployments-json"]) {
    if (!values["secret-json"] || !values["version-json"]) {
      throw new Error(
        "--deployments-json requires --secret-json and --version-json",
      );
    }
    const deploymentRaw = readFileSync(values["deployments-json"], "utf8");
    const secretRaw = readFileSync(values["secret-json"], "utf8");
    const versionRaw = readFileSync(values["version-json"], "utf8");
    raw = `${deploymentRaw}\n${secretRaw}\n${versionRaw}`;
    result = verifyApiRemotePreflight({
      deployments: JSON.parse(deploymentRaw),
      secretInventory: JSON.parse(secretRaw),
      version: JSON.parse(versionRaw),
      environment: values.environment,
      googleClientId: values["google-client-id"],
      hyperdriveId: values["hyperdrive-id"],
      allowMissingResource: values["allow-missing-resource"],
    });
  } else if (values["secret-json"]) {
    raw = readFileSync(values["secret-json"], "utf8");
    result = verifyApiSecretInventory({
      inventory: JSON.parse(raw),
      environment: values.environment,
      allowMissing: values["allow-missing"],
    });
  } else if (values["version-json"]) {
    raw = readFileSync(values["version-json"], "utf8");
    result = verifyApiVersionAuthority({
      version: JSON.parse(raw),
      versionId: values["version-id"],
      releaseId: values["release-id"],
      environment: values.environment,
      releaseSha: values["release-sha"],
      googleClientId: values["google-client-id"],
      hyperdriveId: values["hyperdrive-id"],
    });
  } else {
    throw new Error("Exactly one of --secret-json or --version-json is required");
  }
  const receipt = {
    schema_version: 1,
    ...result,
    provider_evidence_sha256: createHash("sha256").update(raw).digest("hex"),
  };
  writeFileSync(values.receipt, `${JSON.stringify(receipt, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  process.stdout.write(`${JSON.stringify(receipt)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
