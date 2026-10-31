import { realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

function requiredPath(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`Missing required staging acceptance variable: ${name}`);
  if (!isAbsolute(value) || resolve(value) !== value) {
    throw new Error(`${name} must be an absolute canonical path`);
  }
  return value;
}

export function assertOutsideCandidate(path: string, candidateRoot: string, name: string): void {
  const candidateRelative = relative(candidateRoot, path);
  // Compare whole path segments: a directory named "..name" inside the checkout is
  // inside it, while "..", "../x" and absolute results (another drive) are outside.
  const isOutside =
    candidateRelative === ".." ||
    candidateRelative.startsWith(`..${sep}`) ||
    isAbsolute(candidateRelative);
  if (!isOutside) {
    throw new Error(`${name} must be outside the candidate checkout`);
  }
}

export function resolveStagingPlaywrightOutputPolicy(
  environment: NodeJS.ProcessEnv,
  configModuleUrl: string,
): { outputDirectory: string; jsonReport: string } {
  const candidateRoot = realpathSync(resolve(dirname(fileURLToPath(configModuleUrl)), "../.."));
  const suppliedOutput = requiredPath(environment, "E2E_STAGING_OUTPUT_DIR");
  const outputDirectory = realpathSync(suppliedOutput);
  assertOutsideCandidate(outputDirectory, candidateRoot, "E2E_STAGING_OUTPUT_DIR");

  const jsonReport = requiredPath(environment, "E2E_STAGING_JSON_REPORT");
  const reportParent = realpathSync(dirname(jsonReport));
  assertOutsideCandidate(reportParent, candidateRoot, "E2E_STAGING_JSON_REPORT");
  return { outputDirectory, jsonReport };
}
