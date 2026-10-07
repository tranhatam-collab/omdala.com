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

const HYPERDRIVE_ID = /^[0-9a-f]{32}$/;
const RELEASE_SHA = /^[0-9a-f]{40}$/;
const GOOGLE_CLIENT_ID = /^[0-9]+-[a-z0-9-]+\.apps\.googleusercontent\.com$/;
const RELEASE_ENVIRONMENTS = new Set(["production", "staging"]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compact(value) {
  return value.replace(/\s+/g, "");
}

function splitTomlSections(source) {
  const sections = new Map([["", []]]);
  let current = "";

  for (const line of source.split(/\r?\n/)) {
    const header = line.match(/^\s*\[([^\][\n]+)\]\s*(?:#.*)?$/);
    const arrayHeader = line.match(/^\s*\[\[([^\][\n]+)\]\]\s*(?:#.*)?$/);
    if (arrayHeader) {
      current = `[[${arrayHeader[1].trim()}]]`;
      if (!sections.has(current)) sections.set(current, []);
    } else if (header) {
      current = header[1].trim();
      if (!sections.has(current)) sections.set(current, []);
    }
    sections.get(current).push(line);
  }

  return sections;
}

function requireBaseConfig(source) {
  if (/^\s*\[\[?[^\]\n]*hyperdrive[^\]\n]*\]\]?\s*(?:#.*)?$/im.test(source)) {
    throw new Error(
      "Base Wrangler config must not contain a Hyperdrive table; protected release rendering owns the binding",
    );
  }

  const sections = splitTomlSections(source);
  const root = (sections.get("") ?? []).join("\n");
  const staging = (sections.get("env.staging") ?? []).join("\n");
  const productionVars = (sections.get("vars") ?? []).join("\n");
  const stagingVars = (sections.get("env.staging.vars") ?? []).join("\n");

  const requirements = [
    [root, /^name\s*=\s*"omdala-api"\s*$/m, "production Worker name"],
    [root, /^main\s*=\s*"src\/index\.ts"\s*$/m, "relative API entrypoint"],
    [root, /^account_id\s*=\s*"[0-9a-f]{32}"\s*$/m, "Cloudflare account ID"],
    [root, /^workers_dev\s*=\s*false\s*$/m, "production workers_dev=false"],
    [root, /^preview_urls\s*=\s*false\s*$/m, "production preview_urls=false"],
    [staging, /^name\s*=\s*"omdala-api-staging"\s*$/m, "staging Worker name"],
    [staging, /^workers_dev\s*=\s*false\s*$/m, "staging workers_dev=false"],
    [staging, /^preview_urls\s*=\s*false\s*$/m, "staging preview_urls=false"],
    [productionVars, /^AIAGENT_API_URL\s*=\s*"https:\/\/api\.aiagent\.iai\.one"\s*$/m, "canonical production AIAGENT origin"],
    [productionVars, /^AIAGENT_WORKSPACE_ID\s*=\s*"omdala-com-production"\s*$/m, "canonical production AIAGENT workspace"],
    [stagingVars, /^AIAGENT_API_URL\s*=\s*"https:\/\/staging-api\.aiagent\.iai\.one"\s*$/m, "canonical staging AIAGENT origin"],
    [stagingVars, /^AIAGENT_WORKSPACE_ID\s*=\s*"omdala-com-staging"\s*$/m, "canonical staging AIAGENT workspace"],
    [productionVars, /^GOOGLE_REDIRECT_URI\s*=\s*"https:\/\/api\.omdala\.com\/v1\/auth\/google\/callback"\s*$/m, "canonical production Google redirect"],
    [stagingVars, /^GOOGLE_REDIRECT_URI\s*=\s*"https:\/\/api-staging\.omdala\.com\/v1\/auth\/google\/callback"\s*$/m, "canonical staging Google redirect"],
  ];

  for (const [body, pattern, label] of requirements) {
    if (!pattern.test(body)) throw new Error(`Base Wrangler config is missing ${label}`);
  }
  if (/^\s*(?:AI_API_URL|AI_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY)\s*=/m.test(source)) {
    throw new Error("Base Wrangler config contains a forbidden direct-provider variable");
  }

  const productionRoutes = compact(root.match(/routes\s*=\s*\[[\s\S]*?\]/)?.[0] ?? "");
  const stagingRoutes = compact(
    staging.match(/routes\s*=\s*\[[\s\S]*?\]/)?.[0] ?? "",
  );
  if (
    productionRoutes !==
    'routes=[{pattern="api.omdala.com",custom_domain=true}]'
  ) {
    throw new Error("Production API route must remain the exact api.omdala.com custom domain");
  }
  if (
    stagingRoutes !==
    'routes=[{pattern="api-staging.omdala.com",custom_domain=true}]'
  ) {
    throw new Error(
      "Staging API route must remain the exact api-staging.omdala.com custom domain",
    );
  }
}

function normalizeReleaseInputs(releaseSha, googleClientId) {
  const sha = String(releaseSha ?? "").trim();
  const clientId = String(googleClientId ?? "").trim();
  if (!RELEASE_SHA.test(sha)) {
    throw new Error("RELEASE_SHA must be an exact 40-character lowercase commit SHA");
  }
  if (!GOOGLE_CLIENT_ID.test(clientId)) {
    throw new Error("OMDALA_GOOGLE_CLIENT_ID must be a canonical Google OAuth client ID");
  }
  return { sha, clientId };
}

function injectReleaseVars(source, environment, releaseSha, googleClientId) {
  const section = environment === "staging" ? "env.staging.vars" : "vars";
  const lines = source.trimEnd().split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `[${section}]`);
  if (start < 0) throw new Error(`Wrangler config is missing [${section}]`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^\s*\[/.test(lines[index] ?? "")) {
      end = index;
      break;
    }
  }
  const body = lines.slice(start + 1, end).join("\n");
  if (/^\s*(?:RELEASE_SHA|GOOGLE_CLIENT_ID)\s*=/m.test(body)) {
    throw new Error("Release-owned variables must not be present in the base config");
  }
  lines.splice(
    end,
    0,
    `RELEASE_SHA = "${releaseSha}"`,
    `GOOGLE_CLIENT_ID = "${googleClientId}"`,
  );
  return `${lines.join("\n")}\n`;
}

export function normalizeHyperdriveId(value) {
  const id = String(value ?? "").trim();
  if (!HYPERDRIVE_ID.test(id)) {
    throw new Error(
      "OMDALA_HYPERDRIVE_ID must be a canonical 32-character lowercase hexadecimal Cloudflare Hyperdrive ID",
    );
  }
  return id;
}

export function renderApiWranglerConfig({
  source,
  environment,
  hyperdriveId,
  releaseSha,
  googleClientId,
}) {
  if (!RELEASE_ENVIRONMENTS.has(environment)) {
    throw new Error("Release environment must be exactly production or staging");
  }
  requireBaseConfig(source);
  const id = normalizeHyperdriveId(hyperdriveId);
  const release = normalizeReleaseInputs(releaseSha, googleClientId);
  const table = environment === "staging" ? "env.staging.hyperdrive" : "hyperdrive";
  const withReleaseVars = injectReleaseVars(
    source,
    environment,
    release.sha,
    release.clientId,
  );
  const rendered = `${withReleaseVars.trimEnd()}\n\n[[${table}]]\nbinding = "HYPERDRIVE"\nid = "${id}"\n`;
  const productionBindings = rendered.match(/^\[\[hyperdrive\]\]$/gm) ?? [];
  const stagingBindings = rendered.match(/^\[\[env\.staging\.hyperdrive\]\]$/gm) ?? [];
  if (
    (environment === "production" &&
      (productionBindings.length !== 1 || stagingBindings.length !== 0)) ||
    (environment === "staging" &&
      (productionBindings.length !== 0 || stagingBindings.length !== 1))
  ) {
    throw new Error("Rendered config has a Hyperdrive binding outside the selected environment");
  }

  return {
    rendered,
    receipt: {
      schema_version: 1,
      verdict: "API_WRANGLER_CONFIG_RENDERED",
      environment,
      binding: "HYPERDRIVE",
      hyperdrive_id: id,
      release_sha: release.sha,
      google_client_id_sha256: sha256(release.clientId),
      binding_scope: table,
      source_sha256: sha256(source),
      rendered_sha256: sha256(rendered),
    },
  };
}

export function writeApiWranglerConfig({
  inputPath,
  outputPath,
  receiptPath,
  environment,
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
