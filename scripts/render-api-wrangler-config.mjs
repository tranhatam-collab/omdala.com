import { createHash, randomUUID } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import {
  canonicalRenderedApiWranglerConfig,
  normalizeCloudflareAccountId,
  normalizeGoogleClientId,
  normalizeHyperdriveId,
  normalizeReleaseSha,
  verifyBaseApiWranglerConfig,
  verifyRenderedApiWranglerConfig,
} from "./staging-api-wrangler-policy.mjs";

const RELEASE_ENVIRONMENTS = new Set(["production", "staging"]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export { normalizeHyperdriveId };

export function renderApiWranglerConfig({
  source,
  environment,
  accountId,
  hyperdriveId,
  releaseSha,
  googleClientId,
}) {
  if (!RELEASE_ENVIRONMENTS.has(environment)) {
    throw new Error("Release environment must be exactly production or staging");
  }
  const authority = normalizeCloudflareAccountId(accountId);
  const id = normalizeHyperdriveId(hyperdriveId);
  const sha = normalizeReleaseSha(releaseSha);
  const clientId = normalizeGoogleClientId(googleClientId);
  verifyBaseApiWranglerConfig({ source, accountId: authority });
  const rendered = canonicalRenderedApiWranglerConfig({
    accountId: authority,
    environment,
    hyperdriveId: id,
    releaseSha: sha,
    googleClientId: clientId,
  });
  verifyRenderedApiWranglerConfig({
    source: rendered,
    accountId: authority,
    environment,
    hyperdriveId: id,
    releaseSha: sha,
    googleClientId: clientId,
  });
  const table = environment === "staging" ? "env.staging.hyperdrive" : "hyperdrive";
  return {
    rendered,
    receipt: {
      schema_version: 2,
      verdict: "API_WRANGLER_CONFIG_RENDERED_EXACT_SEMANTIC_POLICY",
      environment,
      cloudflare_account_id: authority,
      binding: "HYPERDRIVE",
      hyperdrive_id: id,
      release_sha: sha,
      google_client_id_sha256: sha256(clientId),
      binding_scope: table,
      source_sha256: sha256(source),
      rendered_sha256: sha256(rendered),
      canonical_toml: true,
    },
  };
}

export function writeApiWranglerConfig({
  inputPath,
  outputPath,
  receiptPath,
  environment,
  accountId,
  hyperdriveId,
  releaseSha,
  googleClientId,
}) {
  const input = resolve(inputPath);
  const output = resolve(outputPath);
  if (input === output) throw new Error("Rendered config must not overwrite the base config");
  if (dirname(input) !== dirname(output)) {
    throw new Error("Rendered config must be written beside the base config so main stays relative");
  }
  if (!output.endsWith(".toml")) throw new Error("Rendered config output must be a .toml file");
  if (lstatSync(input).isSymbolicLink()) throw new Error("Base config must not be a symlink");
  try {
    if (lstatSync(output).isSymbolicLink()) {
      throw new Error("Rendered config output must not be a symlink");
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const source = readFileSync(input, "utf8");
  const result = renderApiWranglerConfig({
    source,
    environment,
    accountId,
    hyperdriveId,
    releaseSha,
    googleClientId,
  });
  const temporary = `${output}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, result.rendered, { encoding: "utf8", mode: 0o600, flag: "wx" });
    renameSync(temporary, output);
  } catch (error) {
    try {
      unlinkSync(temporary);
    } catch {}
    throw error;
  }

  if (receiptPath) {
    writeFileSync(
      resolve(receiptPath),
      `${JSON.stringify({ ...result.receipt, input, output }, null, 2)}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
  }
  return result.receipt;
}

function main() {
  const { values } = parseArgs({
    options: {
      input: { type: "string", default: "services/api/wrangler.toml" },
      output: { type: "string", default: "services/api/wrangler.release.toml" },
      receipt: { type: "string" },
      environment: { type: "string" },
      "account-id": { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });
  const environment = values.environment ?? process.env.RELEASE_ENVIRONMENT;
  const receipt = writeApiWranglerConfig({
    inputPath: values.input,
    outputPath: values.output,
    receiptPath: values.receipt,
    environment,
    accountId: values["account-id"] ?? process.env.CLOUDFLARE_ACCOUNT_ID,
    hyperdriveId: process.env.OMDALA_HYPERDRIVE_ID,
    releaseSha: process.env.RELEASE_SHA,
    googleClientId: process.env.OMDALA_GOOGLE_CLIENT_ID,
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
