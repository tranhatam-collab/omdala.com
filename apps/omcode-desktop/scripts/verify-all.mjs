import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { verifyCandidateBundle } from "./bundle-verifier.mjs";

const moduleRoot = path.resolve(import.meta.dirname, "..");
const evidenceDirectory = path.join(moduleRoot, "evidence");
const receiptPath = path.resolve(
  process.env.OMCODE_RELEASE_RECEIPT ||
    path.join(evidenceDirectory, "release-verification.json"),
);
const candidateApp = path.resolve(
  process.env.OMCODE_E2E_APP || path.join(moduleRoot, "release/OMCODE.app"),
);
const stages = {};
await fs.mkdir(evidenceDirectory, { recursive: true });

try {
  runStage("tests", "npm", ["test"]);
  runStage("build", "npm", ["run", "build"]);
  runStage("package", "npm", ["run", "package:mac"]);
  runStage("bundle", "npm", ["run", "verify:bundle"]);
  runStage("browser", process.execPath, ["scripts/e2e.mjs"]);
  runStage("native", process.execPath, ["scripts/native-e2e.mjs"]);
  runStage("install", process.execPath, ["scripts/install-e2e.mjs"]);

  const candidate = await verifyCandidateBundle(candidateApp, moduleRoot);
  const browser = JSON.parse(
    await fs.readFile(path.join(evidenceDirectory, "e2e-results.json"), "utf8"),
  );
  const native = JSON.parse(
    await fs.readFile(path.join(evidenceDirectory, "native-e2e.json"), "utf8"),
  );
  const install = JSON.parse(
    await fs.readFile(path.join(evidenceDirectory, "install-e2e.json"), "utf8"),
  );
  if (
    browser.ok !== true ||
    browser.passed !== 20 ||
    browser.sourceDigest !== candidate.sourceDigest ||
    browser.results?.some((result) => result.ok !== true)
  )
    throw new Error(
      "Browser E2E receipt does not cover 20 checks for this source.",
    );
  if (
    native.ok !== true ||
    native.sourceDigest !== candidate.sourceDigest ||
    native.bundleManifestDigest !== candidate.bundleManifestDigest
  )
    throw new Error("Native E2E receipt belongs to a different candidate.");
  if (
    install.ok !== true ||
    install.sourceDigest !== candidate.sourceDigest ||
    install.bundleManifestDigest !== candidate.bundleManifestDigest
  )
    throw new Error("Install E2E receipt belongs to a different candidate.");

  const receipt = {
    schemaVersion: 1,
    time: new Date().toISOString(),
    ok: true,
    app: candidate.app,
    version: candidate.version,
    sourceDigest: candidate.sourceDigest,
    bundleManifestDigest: candidate.bundleManifestDigest,
    payloadFiles: candidate.payloadFiles,
    stages,
    browser: {
      passed: browser.passed,
      engines: [...new Set(browser.results.map((result) => result.engine))],
    },
    native: {
      checks: native.checks,
      approvedWrite: native.approvedWrite,
      generatedFileExecuted: native.generatedFileExecuted,
      errors: native.errors,
    },
    install: {
      checks: install.checks,
      dataPreserved: install.checks.includes("database-byte-identical"),
    },
    liveProvider: {
      status: "not-run",
      reason:
        "Run npm run test:live separately because it consumes provider quota.",
    },
  };
  await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify(receipt, null, 2));
} catch (error) {
  const failure = {
    schemaVersion: 1,
    time: new Date().toISOString(),
    ok: false,
    error: error.message,
    stages,
  };
  await fs.writeFile(
    path.join(evidenceDirectory, "release-verification-failure.json"),
    JSON.stringify(failure, null, 2) + "\n",
  );
  throw error;
}

function runStage(name, command, args) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: moduleRoot,
    env: { ...process.env, OMCODE_E2E_APP: candidateApp },
    stdio: "inherit",
  });
  stages[name] = {
    ok: result.status === 0,
    durationMs: Date.now() - started,
    command: [command, ...args],
  };
  if (result.status !== 0)
    throw new Error(
      `Release stage failed: ${name} (${result.status ?? result.signal})`,
    );
}
