import { createHash } from "node:crypto";
import { lstatSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { verifyRenderedApiWranglerConfig } from "./staging-api-wrangler-policy.mjs";

const SURFACES = Object.freeze({
  web: { host: "staging.omdala.com", directory: "../../../apps/web/out" },
  app: { host: "app-staging.omdala.com", directory: "../../../apps/app/out" },
  auth: { host: "auth-staging.omdala.com", directory: "../../../apps/auth/out" },
  brand: { host: "brand-staging.omdala.com", directory: "../../../apps/brand-marketplace/out" },
});
const TOP_LEVEL_KEYS = [
  "$schema",
  "assets",
  "compatibility_date",
  "main",
  "name",
  "preview_urls",
  "routes",
  "workers_dev",
].sort();
const ASSET_KEYS = [
  "binding",
  "directory",
  "html_handling",
  "not_found_handling",
  "run_worker_first",
].sort();
const SURFACE_SCHEMA = "../../../services/api/node_modules/wrangler/config-schema.json";
const SURFACE_COMPATIBILITY_DATE = "2026-10-07";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  if (actual.join(",") !== expected.join(",")) {
    throw new Error(`${label} keys are not exact: ${actual.join(",")}`);
  }
}

export function verifyApiExecutionSafety(source, expectations = {}) {
  const result = verifyRenderedApiWranglerConfig({
    source,
    environment: "staging",
    accountId: expectations.accountId,
    hyperdriveId: expectations.hyperdriveId,
    releaseSha: expectations.releaseSha,
    googleClientId: expectations.googleClientId,
  });
  return {
    custom_build_hooks: false,
    canonical_toml: true,
    staging_worker: "omdala-api-staging",
    route: "api-staging.omdala.com",
    cloudflare_account_id: result.accountId,
    release_sha: result.releaseSha,
    hyperdrive_id: result.hyperdriveId,
    google_client_id_sha256: digest(result.googleClientId),
  };
}

export function verifySurfaceExecutionSafety({ source, surface }) {
  const expected = SURFACES[surface];
  if (!expected) throw new Error("Unknown staging surface");
  let config;
  try {
    config = JSON.parse(source);
  } catch {
    throw new Error(`${surface} Wrangler config must be strict canonical JSON`);
  }
  exactKeys(config, TOP_LEVEL_KEYS, `${surface} top-level config`);
  exactKeys(config.assets, ASSET_KEYS, `${surface} asset config`);
  if (
    config.$schema !== SURFACE_SCHEMA ||
    config.name !== `omdala-surface-${surface}-staging` ||
    config.main !== "./static-worker.mjs" ||
    config.compatibility_date !== SURFACE_COMPATIBILITY_DATE ||
    config.workers_dev !== false ||
    config.preview_urls !== false ||
    config.assets.directory !== expected.directory ||
    config.assets.binding !== "ASSETS" ||
    config.assets.run_worker_first !== true ||
    config.assets.html_handling !== "auto-trailing-slash" ||
    config.assets.not_found_handling !== "404-page" ||
    !Array.isArray(config.routes) ||
    config.routes.length !== 1 ||
    Object.keys(config.routes[0] ?? {}).sort().join(",") !== "custom_domain,pattern" ||
    config.routes[0].pattern !== expected.host ||
    config.routes[0].custom_domain !== true
  ) {
    throw new Error(`${surface} Wrangler config is not the exact trusted static surface shape`);
  }
  const canonical = `{
  "$schema": "${SURFACE_SCHEMA}",
  "name": "omdala-surface-${surface}-staging",
  "main": "./static-worker.mjs",
  "compatibility_date": "${SURFACE_COMPATIBILITY_DATE}",
  "workers_dev": false,
  "preview_urls": false,
  "assets": {
    "directory": "${expected.directory}",
    "binding": "ASSETS",
    "run_worker_first": true,
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"
  },
  "routes": [
    { "pattern": "${expected.host}", "custom_domain": true }
  ]
}
`;
  if (source !== canonical) {
    throw new Error(`${surface} Wrangler config is not exact canonical JSON bytes`);
  }
  return {
    surface,
    worker: config.name,
    route: expected.host,
    asset_directory: expected.directory,
    custom_build_hooks: false,
  };
}

export function verifyStagingWranglerConfigs({
  apiPath,
  surfaceDirectory,
  accountId,
  hyperdriveId,
  releaseSha,
  googleClientId,
}) {
  if (lstatSync(apiPath).isSymbolicLink()) throw new Error("API config must not be a symlink");
  const apiBytes = readFileSync(apiPath);
  const api = verifyApiExecutionSafety(apiBytes.toString("utf8"), {
    accountId,
    hyperdriveId,
    releaseSha,
    googleClientId,
  });
  const surfaces = Object.keys(SURFACES).map((surface) => {
    const path = join(surfaceDirectory, `${surface}.wrangler.jsonc`);
    if (lstatSync(path).isSymbolicLink()) throw new Error(`${surface} config must not be a symlink`);
    const bytes = readFileSync(path);
    return {
      ...verifySurfaceExecutionSafety({ source: bytes.toString("utf8"), surface }),
      config_sha256: digest(bytes),
    };
  });
  return {
    schema_version: 1,
    verdict: "STAGING_WRANGLER_EXECUTION_SAFETY_EXACT",
    api: { ...api, config_sha256: digest(apiBytes) },
    surfaces,
  };
}

function main() {
  const { values } = parseArgs({
    options: {
      "api-config": { type: "string" },
      "surface-directory": { type: "string" },
      "account-id": { type: "string" },
      "hyperdrive-id": { type: "string" },
      "release-sha": { type: "string" },
      "google-client-id": { type: "string" },
      receipt: { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });
  if (!values["api-config"] || !values["surface-directory"] || !values.receipt) {
    throw new Error("--api-config, --surface-directory, and --receipt are required");
  }
  const receipt = verifyStagingWranglerConfigs({
    apiPath: values["api-config"],
    surfaceDirectory: values["surface-directory"],
    accountId: values["account-id"],
    hyperdriveId: values["hyperdrive-id"],
    releaseSha: values["release-sha"],
    googleClientId: values["google-client-id"],
  });
  writeFileSync(values.receipt, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
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
