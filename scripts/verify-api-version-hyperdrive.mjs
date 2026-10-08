import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { normalizeHyperdriveId } from "./render-api-wrangler-config.mjs";

const VERSION_ID = /^[0-9a-f-]{32,36}$/;

export function verifyApiVersionHyperdrive({
  version,
  versionId,
  releaseId,
  hyperdriveId,
}) {
  const expectedHyperdriveId = normalizeHyperdriveId(hyperdriveId);
  if (!VERSION_ID.test(versionId ?? "")) throw new Error("Expected Worker version ID is invalid");
  if (!releaseId) throw new Error("Expected release ID is required");
  if (version?.id !== versionId) throw new Error("Provider version ID does not match the deployment");
  if (version?.annotations?.["workers/message"] !== releaseId) {
    throw new Error("Provider version annotation does not match the release ID");
  }
  if (!Array.isArray(version?.resources?.bindings)) {
    throw new Error("Provider version schema does not expose resources.bindings");
  }

  const hyperdriveBindings = version.resources.bindings.filter(
    (binding) => binding?.type === "hyperdrive",
  );
  if (hyperdriveBindings.length !== 1) {
    throw new Error("Provider version must contain exactly one Hyperdrive binding");
  }
  const [binding] = hyperdriveBindings;
  if (binding.name !== "HYPERDRIVE" || binding.id !== expectedHyperdriveId) {
    throw new Error("Provider Hyperdrive binding name or ID does not match the protected release config");
  }

  return {
    schema_version: 1,
    verdict: "API_HYPERDRIVE_BINDING_VERIFIED",
    provider_schema: "resources.bindings",
    version_id: versionId,
    release_id: releaseId,
    binding: "HYPERDRIVE",
    hyperdrive_id: expectedHyperdriveId,
    binding_verified: true,
  };
}

function main() {
  const { values } = parseArgs({
    options: {
      "version-json": { type: "string" },
      "version-id": { type: "string" },
      "release-id": { type: "string" },
      "hyperdrive-id": { type: "string" },
      receipt: { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });
  for (const key of ["version-json", "version-id", "release-id", "hyperdrive-id", "receipt"]) {
    if (!values[key]) throw new Error(`--${key} is required`);
  }
  const raw = readFileSync(values["version-json"], "utf8");
  const result = verifyApiVersionHyperdrive({
    version: JSON.parse(raw),
    versionId: values["version-id"],
    releaseId: values["release-id"],
    hyperdriveId: values["hyperdrive-id"],
  });
  const receipt = {
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
