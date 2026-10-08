import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const SURFACE_WORKERS = Object.freeze({
  web: "omdala-surface-web-staging",
  app: "omdala-surface-app-staging",
  auth: "omdala-surface-auth-staging",
  brand: "omdala-surface-brand-staging",
});
const SECRET_PHASES = new Set(["preflight", "postdeploy"]);
const VERSION_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const SHA256 = /^[a-f0-9]{64}$/;
const RELEASE_ID = /^[A-Za-z0-9._-]{8,160}$/;

function expectedWorkerName(surface) {
  const workerName = SURFACE_WORKERS[surface];
  if (!workerName) {
    throw new Error("Surface must be exactly web, app, auth, or brand");
  }
  return workerName;
}

function normalizeSecretNames(inventory) {
  if (!Array.isArray(inventory)) {
    throw new Error("Surface Worker secret inventory must be an array");
  }
  const names = inventory.map((item) => {
    const name = typeof item === "string" ? item : item?.name;
    if (typeof name !== "string" || !/^[A-Z][A-Z0-9_]*$/.test(name)) {
      throw new Error("Surface Worker secret inventory contains an invalid name");
    }
    if (
      typeof item === "object" &&
      item !== null &&
      item.type !== undefined &&
      item.type !== "secret_text"
    ) {
      throw new Error(`Surface Worker secret ${name} has an invalid type`);
    }
    return name;
  });
  if (new Set(names).size !== names.length) {
    throw new Error("Surface Worker secret inventory contains duplicate names");
  }
  return names.sort();
}

export function verifySurfaceSecretInventory({
  inventory,
  surface,
  phase,
  providerWorkerMissing = false,
}) {
  const workerName = expectedWorkerName(surface);
  if (!SECRET_PHASES.has(phase)) {
    throw new Error("Secret inventory phase must be preflight or postdeploy");
  }
  if (providerWorkerMissing && phase !== "preflight") {
    throw new Error("A missing Worker is allowed only during preflight");
  }
  const names = normalizeSecretNames(inventory);
  if (names.length !== 0) {
    throw new Error(
      `Surface Worker secret inventory must be exactly empty; found: ${names.join(", ")}`,
    );
  }
  return {
    verdict: "SURFACE_WORKER_SECRET_INVENTORY_EXACT_EMPTY",
    surface,
    worker_name: workerName,
    phase,
    provider_worker_missing_before_deploy: providerWorkerMissing,
    expected_secret_names: [],
    actual_secret_names: [],
  };
}

export function verifySurfaceVersionAuthority({
  version,
  surface,
  versionId,
  releaseId,
}) {
  const workerName = expectedWorkerName(surface);
  if (!VERSION_ID.test(versionId ?? "")) {
    throw new Error("Expected surface Worker version ID is invalid");
  }
  if (!RELEASE_ID.test(releaseId ?? "")) {
    throw new Error("Expected surface release ID is invalid");
  }
  if (version?.id !== versionId) {
    throw new Error("Provider surface Worker version ID does not match deployment");
  }
  if (version?.annotations?.["workers/message"] !== releaseId) {
    throw new Error("Provider surface Worker version annotation does not match release ID");
  }
  if (!SHA256.test(version?.resources?.script?.etag ?? "")) {
    throw new Error("Provider surface Worker script etag is invalid");
  }
  const bindings = version?.resources?.bindings;
  if (!Array.isArray(bindings)) {
    throw new Error("Provider surface Worker version does not expose resources.bindings");
  }
  if (
    bindings.length !== 1 ||
    bindings[0]?.name !== "ASSETS" ||
    bindings[0]?.type !== "assets"
  ) {
    throw new Error("Provider surface Worker bindings must be exactly ASSETS:assets");
  }
  return {
    verdict: "SURFACE_WORKER_AUTHORITY_EXACT",
    surface,
    worker_name: workerName,
    version_id: versionId,
    release_id: releaseId,
    version_etag: version.resources.script.etag,
    binding_names: ["ASSETS"],
    bindings: [{ name: "ASSETS", type: "assets" }],
  };
}

function main() {
  const { values } = parseArgs({
    options: {
      surface: { type: "string" },
      "secret-json": { type: "string" },
      phase: { type: "string" },
      "provider-worker-missing": { type: "boolean", default: false },
      "version-json": { type: "string" },
      "version-id": { type: "string" },
      "release-id": { type: "string" },
      receipt: { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });
  if (!values.surface || !values.receipt) {
    throw new Error("--surface and --receipt are required");
  }
  const hasSecretEvidence = Boolean(values["secret-json"]);
  const hasVersionEvidence = Boolean(values["version-json"]);
  if (hasSecretEvidence === hasVersionEvidence) {
    throw new Error("Exactly one of --secret-json or --version-json is required");
  }

  const evidencePath = values[hasSecretEvidence ? "secret-json" : "version-json"];
  const raw = readFileSync(evidencePath);
  const evidence = JSON.parse(raw.toString("utf8"));
  const result = hasSecretEvidence
    ? verifySurfaceSecretInventory({
        inventory: evidence,
        surface: values.surface,
        phase: values.phase,
        providerWorkerMissing: values["provider-worker-missing"],
      })
    : verifySurfaceVersionAuthority({
        version: evidence,
        surface: values.surface,
        versionId: values["version-id"],
        releaseId: values["release-id"],
      });
  const receipt = {
    schema_version: 1,
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
