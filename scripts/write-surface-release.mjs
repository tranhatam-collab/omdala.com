import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [outputDirectory, surface, environment, releaseSha, releaseId] = process.argv.slice(2);
const allowedSurfaces = new Set(["web", "app", "brand"]);
const allowedEnvironments = new Set(["staging", "production"]);

if (!outputDirectory || !allowedSurfaces.has(surface)) {
  throw new Error("Usage: write-surface-release.mjs <output> <web|app|brand> <staging|production> <sha> <release-id>");
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
writeFileSync(
  destination,
  `${JSON.stringify(
    {
      schema_version: 1,
      surface,
      environment,
      release_sha: releaseSha.toLowerCase(),
      release_id: releaseId,
      built_at: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
  "utf8",
);
console.log(destination);
