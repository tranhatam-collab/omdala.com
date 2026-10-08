import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PRODUCTION_API_ORIGIN = "https://api.omdala.com";
const STAGING_API_ORIGIN = "https://api-staging.omdala.com";
const ASSET_MANIFEST_NAME = "asset-manifest.sha256";
const RELEASE_MANIFEST_NAME = "release.json";

export const SURFACE_ARTIFACTS = Object.freeze({
  web: {
    directory: "apps/web/out",
    route: "index.html",
    csp: true,
    productionIndexable: true,
  },
  app: {
    directory: "apps/app/out",
    route: "workspace/index.html",
    csp: true,
    productionIndexable: false,
  },
  auth: {
    directory: "apps/auth/out",
    route: "login/index.html",
    csp: true,
    productionIndexable: false,
  },
  brand: {
    directory: "apps/brand-marketplace/out",
    route: "en/index.html",
    csp: false,
    productionIndexable: true,
  },
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function listAssetFiles(root, directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return listAssetFiles(root, path);
    if (!entry.isFile()) {
      throw new Error("Surface artifact contains an unsupported filesystem entry.");
    }
    const name = relative(root, path).split(sep).join("/");
    if (name === RELEASE_MANIFEST_NAME || name === ASSET_MANIFEST_NAME) return [];
    if (/[\r\n]/.test(name)) {
      throw new Error("Surface asset path contains a newline.");
    }
    return [{ name, path }];
  });
}

function readReleaseManifest(directory, surface, environment) {
  let release;
  try {
    release = JSON.parse(readFileSync(resolve(directory, RELEASE_MANIFEST_NAME), "utf8"));
  } catch (error) {
    throw new Error(`${surface} ${RELEASE_MANIFEST_NAME} is missing or invalid: ${error.message}`);
  }
  if (
    release?.schema_version !== 1 ||
    release.surface !== surface ||
    release.environment !== environment
  ) {
    throw new Error(`${surface} release identity does not match the ${environment} artifact.`);
  }
  return release;
}

function parseAssetManifest(manifest, surface) {
  if (!manifest.endsWith("\n") || manifest.includes("\r")) {
    throw new Error(`${surface} asset manifest must use canonical LF lines with a final newline.`);
  }
  const lines = manifest.slice(0, -1).split("\n");
  if (lines.length === 0 || (lines.length === 1 && lines[0] === "")) {
    throw new Error(`${surface} asset manifest is empty.`);
  }
  return lines.map((line) => {
    const match = /^([a-f0-9]{64})  (.+)$/u.exec(line);
    if (!match) {
      throw new Error(`${surface} asset manifest contains a malformed line.`);
    }
    const [, digest, name] = match;
    if (
      name.startsWith("/") ||
      name.includes("\\") ||
      name.split("/").some((component) => component === "" || component === "." || component === "..") ||
      name === RELEASE_MANIFEST_NAME ||
      name === ASSET_MANIFEST_NAME
    ) {
      throw new Error(`${surface} asset manifest contains an unsafe path.`);
    }
    return { digest, name };
  });
}

export function verifyAssetManifest(directory, surface, environment) {
  const root = resolve(directory);
  const manifestBytes = readFileSync(resolve(root, ASSET_MANIFEST_NAME));
  const manifest = manifestBytes.toString("utf8");
  const entries = parseAssetManifest(manifest, surface);
  const expectedFiles = listAssetFiles(root).sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  );
  const expectedNames = expectedFiles.map(({ name }) => name);
  const suppliedNames = entries.map(({ name }) => name);
  if (JSON.stringify(suppliedNames) !== JSON.stringify(expectedNames)) {
    throw new Error(`${surface} asset manifest is not sorted or does not cover the exact artifact.`);
  }

  for (let index = 0; index < entries.length; index += 1) {
    const actualDigest = sha256(readFileSync(expectedFiles[index].path));
    if (actualDigest !== entries[index].digest) {
      throw new Error(`${surface} asset digest does not match ${entries[index].name}.`);
    }
  }

  const release = readReleaseManifest(root, surface, environment);
  const manifestDigest = sha256(manifestBytes);
  if (release.asset_manifest_sha256 !== manifestDigest) {
    throw new Error(`${surface} release manifest has the wrong asset manifest SHA-256.`);
  }
  if (release.asset_file_count !== entries.length) {
    throw new Error(`${surface} release manifest has the wrong asset file count.`);
  }
  return { sha256: manifestDigest, fileCount: entries.length };
}

function robotsMetaTags(html) {
  return html.match(/<meta\b[^>]*>/gi)?.filter((tag) =>
    /\bname=["']robots["']/i.test(tag),
  ) ?? [];
}

function requireNoindexMeta(html, surface, environment) {
  if (!robotsMetaTags(html).some((tag) =>
    /\bcontent=["'][^"']*noindex[^"']*nofollow[^"']*["']/i.test(tag),
  )) {
    throw new Error(`${surface} ${environment} HTML is missing robots noindex,nofollow metadata.`);
  }
}

function requireIndexableMeta(html, surface) {
  const tags = robotsMetaTags(html);
  if (
    tags.some((tag) => /\bcontent=["'][^"']*(?:noindex|nofollow)[^"']*["']/i.test(tag)) ||
    !tags.some((tag) => /\bcontent=["'][^"']*index[^"']*follow[^"']*["']/i.test(tag))
  ) {
    throw new Error(`${surface} production HTML is not explicitly index,follow.`);
  }
}

function globalHeaders(headers) {
  return /^\/\*[ \t]*\r?\n((?:[ \t]+.*(?:\r?\n|$))*)/m.exec(headers)?.[1] ?? "";
}

function requireNoindexHeader(headers, surface, environment) {
  if (!/^\s*X-Robots-Tag:\s*noindex,\s*nofollow\s*$/im.test(globalHeaders(headers))) {
    throw new Error(`${surface} ${environment} global headers are missing X-Robots-Tag noindex,nofollow.`);
  }
}

function rejectGlobalNoindexHeader(headers, surface) {
  if (/^\s*X-Robots-Tag:\s*[^\r\n]*noindex/im.test(globalHeaders(headers))) {
    throw new Error(`${surface} production global headers still contain a noindex directive.`);
  }
}

function verifyCsp(headers, surface, environment, required) {
  const expected = environment === "staging" ? STAGING_API_ORIGIN : PRODUCTION_API_ORIGIN;
  const forbidden = environment === "staging" ? PRODUCTION_API_ORIGIN : STAGING_API_ORIGIN;
  if (required && !headers.includes(expected)) {
    throw new Error(`${surface} ${environment} CSP is missing ${expected}.`);
  }
  if (headers.includes(forbidden)) {
    throw new Error(`${surface} ${environment} headers contain the wrong API origin ${forbidden}.`);
  }
}

function verifySurfacePolicy(directory, surface, specification, environment) {
  const html = readFileSync(resolve(directory, specification.route), "utf8");
  const robots = readFileSync(resolve(directory, "robots.txt"), "utf8");
  const needsHeaders = environment === "staging" || specification.csp || !specification.productionIndexable;
  const headers = needsHeaders ? readFileSync(resolve(directory, "_headers"), "utf8") : "";

  if (environment === "staging" || !specification.productionIndexable) {
    requireNoindexMeta(html, surface, environment);
    if (!/^Disallow:\s*\/$/im.test(robots)) {
      throw new Error(`${surface} ${environment} robots.txt does not disallow all crawlers.`);
    }
    requireNoindexHeader(headers, surface, environment);
  } else {
    requireIndexableMeta(html, surface);
    if (!/^Allow:\s*\/$/im.test(robots) || /^Disallow:\s*\/$/im.test(robots)) {
      throw new Error(`${surface} production robots.txt does not explicitly allow crawling.`);
    }
    if (headers) rejectGlobalNoindexHeader(headers, surface);
  }
  verifyCsp(headers, surface, environment, specification.csp);
}

export function verifySurfaceArtifacts(environment, rootDirectory = process.cwd()) {
  if (environment !== "staging" && environment !== "production") {
    throw new Error("Surface artifact environment must be staging or production.");
  }
  const evidence = {};
  for (const [surface, specification] of Object.entries(SURFACE_ARTIFACTS)) {
    const directory = resolve(rootDirectory, specification.directory);
    verifySurfacePolicy(directory, surface, specification, environment);
    const assets = verifyAssetManifest(directory, surface, environment);
    evidence[surface] = {
      html: specification.route,
      robots: "robots.txt",
      noindex: environment === "staging" || !specification.productionIndexable,
      asset_manifest_sha256: assets.sha256,
      asset_file_count: assets.fileCount,
    };
  }
  return evidence;
}

export function verifyStagingSurfaceArtifacts(rootDirectory = process.cwd()) {
  return verifySurfaceArtifacts("staging", rootDirectory);
}

export function verifyProductionSurfaceArtifacts(rootDirectory = process.cwd()) {
  return verifySurfaceArtifacts("production", rootDirectory);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const environment = process.argv[2];
  if (environment !== "staging" && environment !== "production") {
    throw new Error("Usage: verify-surface-artifacts.mjs <staging|production>");
  }
  const evidence = verifySurfaceArtifacts(environment);
  process.stdout.write(`${JSON.stringify({ environment, evidence })}\n`);
}
