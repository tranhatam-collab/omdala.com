import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_EXCLUDES = new Set([".DS_Store", "bundle-manifest.json"]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function collectFiles(
  root,
  directory = root,
  result = [],
  topLevelExcludes = new Set(),
  includeSigningFiles = false,
) {
  for (const entry of (
    await fs.readdir(directory, { withFileTypes: true })
  ).sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (directory === root && topLevelExcludes.has(entry.name)) continue;
    if (
      !includeSigningFiles &&
      (DEFAULT_EXCLUDES.has(entry.name) ||
        relative === "_CodeSignature" ||
        relative.startsWith("_CodeSignature/"))
    )
      continue;
    if (entry.isDirectory())
      await collectFiles(
        root,
        absolute,
        result,
        topLevelExcludes,
        includeSigningFiles,
      );
    else if (entry.isFile()) {
      const bytes = await fs.readFile(absolute);
      result.push({
        path: relative,
        bytes: bytes.length,
        sha256: sha256(bytes),
      });
    } else if (entry.isSymbolicLink()) {
      const target = await fs.readlink(absolute);
      result.push({
        path: relative,
        bytes: Buffer.byteLength(target),
        sha256: sha256(`symlink:${target}`),
        type: "symlink",
      });
    }
  }
  return result;
}

export async function createPayloadManifest(
  root,
  { sourceDigest = "", version = "" } = {},
) {
  const files = await collectFiles(path.resolve(root));
  return { schemaVersion: 1, version, sourceDigest, files };
}

export async function createSourceManifest(root) {
  return collectFiles(
    path.resolve(root),
    undefined,
    [],
    new Set(["node_modules", "dist", "release", "evidence"]),
  );
}

export async function createReleaseManifest(
  root,
  { sourceDigest = "", version = "" } = {},
) {
  const files = await collectFiles(
    path.resolve(root),
    undefined,
    [],
    new Set(),
    true,
  );
  return { schemaVersion: 1, version, sourceDigest, files };
}

export async function verifyPayloadManifest(root, expected) {
  validateManifest(expected);
  const actual = await createPayloadManifest(root, {
    sourceDigest: expected.sourceDigest,
    version: expected.version,
  });
  return compareManifests(actual, expected);
}

export async function verifyReleaseManifest(root, expected) {
  validateManifest(expected);
  const actual = await createReleaseManifest(root, {
    sourceDigest: expected.sourceDigest,
    version: expected.version,
  });
  return compareManifests(actual, expected);
}

function validateManifest(expected) {
  if (
    expected?.schemaVersion !== 1 ||
    !Array.isArray(expected.files) ||
    expected.files.some(
      (entry) =>
        typeof entry.path !== "string" ||
        path.isAbsolute(entry.path) ||
        entry.path.split("/").includes(".."),
    )
  )
    throw new Error("Bundle manifest is invalid.");
}

function compareManifests(actual, expected) {
  const wanted = new Map(expected.files.map((entry) => [entry.path, entry]));
  const found = new Map(actual.files.map((entry) => [entry.path, entry]));
  const missing = [...wanted.keys()].filter((name) => !found.has(name)).sort();
  const unexpected = [...found.keys()]
    .filter((name) => !wanted.has(name))
    .sort();
  const changed = [...wanted.keys()]
    .filter((name) => {
      const current = found.get(name);
      const target = wanted.get(name);
      return (
        current &&
        (current.bytes !== target.bytes ||
          current.sha256 !== target.sha256 ||
          current.type !== target.type)
      );
    })
    .sort();
  return {
    ok: !missing.length && !changed.length && !unexpected.length,
    checked: actual.files.length,
    missing,
    changed,
    unexpected,
  };
}

export function manifestDigest(manifest) {
  return sha256(JSON.stringify(manifest));
}
