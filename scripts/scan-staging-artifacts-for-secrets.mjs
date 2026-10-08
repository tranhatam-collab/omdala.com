import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function strings(value, output = []) {
  if (typeof value === "string") output.push(value);
  else if (Array.isArray(value)) value.forEach((entry) => strings(entry, output));
  else if (value && typeof value === "object") Object.values(value).forEach((entry) => strings(entry, output));
  return output;
}

function decodedCandidates(value) {
  const candidates = [Buffer.from(value)];
  if (value.length >= 4 && value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    const decoded = Buffer.from(value, "base64");
    if (decoded.toString("base64") === value) candidates.push(decoded);
  }
  return candidates;
}

export function scanArtifactJson(paths, needles) {
  if (!Array.isArray(paths) || paths.length === 0) throw new Error("At least one artifact JSON path is required");
  const protectedValues = [...new Set(needles.map((value) => String(value ?? "")).filter(Boolean))];
  if (protectedValues.length < 2) throw new Error("Protected scan needles are incomplete");
  return paths.map((path) => {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Artifact path is not a regular file: ${path}`);
    const bytes = readFileSync(path);
    const value = JSON.parse(bytes.toString("utf8"));
    const candidates = [bytes, ...strings(value).flatMap(decodedCandidates)];
    if (protectedValues.some((needle) => candidates.some((candidate) => candidate.includes(Buffer.from(needle))))) {
      throw new Error(`Artifact contains protected literal material: ${path}`);
    }
    return { path: realpathSync(path), sha256: digest(bytes), bytes: bytes.length };
  });
}

function values(name) {
  const result = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) result.push(process.argv[index + 1]);
  }
  return result;
}

function option(name) {
  return values(name)[0];
}

function main() {
  const needlesPath = option("--needles");
  const receiptPath = option("--receipt");
  const paths = values("--path");
  if (!needlesPath || !receiptPath) throw new Error("--needles and --receipt are required");
  const needleDocument = JSON.parse(readFileSync(needlesPath, "utf8"));
  if (
    Object.keys(needleDocument).sort().join(",") !== "protected_values,schema_version" ||
    needleDocument.schema_version !== 1 ||
    !Array.isArray(needleDocument.protected_values) ||
    needleDocument.protected_values.length < 8 ||
    needleDocument.protected_values.some((value) => typeof value !== "string" || value.length === 0)
  ) {
    throw new Error("Protected scan needle keys are not exact");
  }
  const files = scanArtifactJson(paths, needleDocument.protected_values);
  const receipt = {
    schema_version: 1,
    verdict: "STAGING_ARTIFACT_SECRET_LITERAL_SCAN_CLEAN",
    files,
    protected_value_count: new Set(needleDocument.protected_values).size,
    contains_secret_values: false,
    scanned_at: new Date().toISOString(),
  };
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
