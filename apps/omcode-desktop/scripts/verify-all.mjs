import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import fsSync from "node:fs";
import { createHash } from "node:crypto";

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
  runStage("dependencies", process.execPath, ["scripts/audit-deps.mjs"]);
  runStage("tests", "npm", ["test"]);
  runStage("build", "npm", ["run", "build"]);
  runStage("package", "npm", ["run", "package:mac"]);
  runStage("bundle", "npm", ["run", "verify:bundle"]);
  runStage("browser", "npm", ["run", "test:ui"]);
  runStage("native", "npm", ["run", "test:native"]);
  runStage("install", "npm", ["run", "test:install"]);

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
    browser.runId !== process.env.OMCODE_VERIFY_RUN_ID ||
    browser.passed !== 30 ||
    browser.sourceDigest !== candidate.sourceDigest ||
    browser.results?.some((result) => result.ok !== true)
  )
    throw new Error(
      "Browser E2E receipt does not cover 30 checks for this source.",
    );
  if (
    native.ok !== true ||
    native.runId !== process.env.OMCODE_VERIFY_RUN_ID ||
    native.sourceDigest !== candidate.sourceDigest ||
    native.bundleManifestDigest !== candidate.bundleManifestDigest
  )
    throw new Error("Native E2E receipt belongs to a different candidate.");
  if (
    install.ok !== true ||
    install.runId !== process.env.OMCODE_VERIFY_RUN_ID ||
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
  await fs.writeFile(receiptPath, JSON.stringify(failure, null, 2) + "\n");
  throw error;
}

function runStage(name, command, args) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: moduleRoot,
    env: { ...process.env, OMCODE_E2E_APP: candidateApp },
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  const log = (result.stdout || "") + (result.stderr || "");
  const logPath = path.join(
    evidenceDirectory,
    "runs",
    process.env.OMCODE_VERIFY_RUN_ID,
    name + ".log",
  );
  fsSync.mkdirSync(path.dirname(logPath), { recursive: true });
  fsSync.writeFileSync(logPath, log);
  stages[name] = {
    logPath,
    logSha256: createHash("sha256").update(log).digest("hex"),
    ok: result.status === 0,
    runId: process.env.OMCODE_VERIFY_RUN_ID,
    exitCode: result.status,
    signal: result.signal,
    durationMs: Date.now() - started,
    command: [command, ...args],
  };
  if (result.status !== 0)
    throw new Error(
      `Release stage failed: ${name} (${result.status ?? result.signal})`,
    );
}
