import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { REQUIRED_SURFACES } from "./surface-release-contract.mjs";

const PRODUCTION_API_ORIGIN = "https://api.omdala.com";
const STAGING_API_ORIGIN = "https://api-staging.omdala.com";

export function applyStagingSurfaceHeaders(outputDirectory, surface) {
  const headersPath = resolve(outputDirectory, "_headers");
  let headers = existsSync(headersPath)
    ? readFileSync(headersPath, "utf8")
    : "/*\n";

  // Staging must never inherit an indexable path-specific override.
  headers = headers.replace(/^[ \t]*X-Robots-Tag:.*(?:\r?\n|$)/gim, "");

  if (surface === "web" || surface === "app" || surface === "auth") {
    if (
      !headers.includes(PRODUCTION_API_ORIGIN) &&
      !headers.includes(STAGING_API_ORIGIN)
    ) {
      throw new Error(`${surface} headers do not contain the expected API CSP origin.`);
    }
    headers = headers.split(PRODUCTION_API_ORIGIN).join(STAGING_API_ORIGIN);
  }

  const globalRule = /^\/\*[ \t]*$/m;
  if (globalRule.test(headers)) {
    headers = headers.replace(
      globalRule,
      (line) => `${line}\n  X-Robots-Tag: noindex, nofollow`,
    );
  } else {
    headers = `/*\n  X-Robots-Tag: noindex, nofollow\n\n${headers.trimStart()}`;
  }
  writeFileSync(headersPath, `${headers.trimEnd()}\n`, "utf8");
}

function listAssetFiles(root, directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return listAssetFiles(root, path);
    if (!entry.isFile()) return [];
    const name = relative(root, path).split(sep).join("/");
    if (name === "release.json" || name === "asset-manifest.sha256") return [];
    if (/[\r\n]/.test(name)) throw new Error("Surface asset path contains a newline.");
    return [{ name, path }];
  });
}

export function writeAssetManifest(outputDirectory) {
  const root = resolve(outputDirectory);
  const files = listAssetFiles(root).sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  );
  if (files.length === 0) throw new Error("Surface artifact contains no assets.");
  const manifest = files.map(({ name, path }) => {
    const sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
    return `${sha256}  ${name}`;
  }).join("\n") + "\n";
  writeFileSync(resolve(root, "asset-manifest.sha256"), manifest, "utf8");
  return {
    sha256: createHash("sha256").update(manifest).digest("hex"),
    fileCount: files.length,
  };
}

const [outputDirectory, surface, environment, releaseSha, releaseId] = process.argv.slice(2);
const allowedSurfaces = new Set(REQUIRED_SURFACES);
const allowedEnvironments = new Set(["staging", "production"]);

if (!outputDirectory || !allowedSurfaces.has(surface)) {
  throw new Error("Usage: write-surface-release.mjs <output> <web|app|auth|brand> <staging|production> <sha> <release-id>");
}
if (!allowedEnvironments.has(environment)) {
  throw new Error("Surface release environment must be staging or production.");
}
if (!/^[a-f0-9]{40}$/i.test(releaseSha ?? "")) {
  throw new Error("Surface release SHA must be a full 40-character Git SHA.");
}
if (!/^[A-Za-z0-9._-]{8,160}$/.test(releaseId ?? "")) {
  throw new Error("Surface release ID contains unsupported characters or has an invalid length.");
}

const destination = resolve(outputDirectory, "release.json");
mkdirSync(resolve(outputDirectory), { recursive: true });
if (environment === "staging") {
  applyStagingSurfaceHeaders(outputDirectory, surface);
}
const assetManifest = writeAssetManifest(outputDirectory);
writeFileSync(
  destination,
  `${JSON.stringify(
    {
      schema_version: 1,
      surface,
      environment,
      release_sha: releaseSha.toLowerCase(),
      release_id: releaseId,
      asset_manifest_sha256: assetManifest.sha256,
      asset_file_count: assetManifest.fileCount,
      built_at: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
  "utf8",
);
console.log(destination);
