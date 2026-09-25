import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { verifyCandidateBundle } from "./bundle-verifier.mjs";
import { REQUIRED_RELEASE_STAGES } from "./release-receipt.mjs";

const moduleRoot = path.resolve(import.meta.dirname, "..");
const candidateApp = path.resolve(
  process.env.OMCODE_E2E_APP || path.join(moduleRoot, "release/OMCODE.app"),
);
const candidate = await verifyCandidateBundle(candidateApp, moduleRoot);
const scratch = await fs.realpath(
  await fs.mkdtemp(path.join(os.tmpdir(), "omcode-install-e2e-")),
);
const home = path.join(scratch, "home");
const releaseReceiptPath = path.join(scratch, "fixture-release-receipt.json");
await fs.mkdir(path.join(home, "Applications"), { recursive: true });
await fs.writeFile(
  path.join(home, ".zshrc"),
  "export EDITOR=vim\nalias keep-me='printf keep'\n",
);
await fs.writeFile(
  releaseReceiptPath,
  JSON.stringify(
    {
      schemaVersion: 2,
      runId: "fixture-release",
      status: "PASS",
      exitCode: 0,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      time: new Date().toISOString(),
      ok: true,
      version: candidate.version,
      sourceDigest: candidate.sourceDigest,
      bundleManifestDigest: candidate.bundleManifestDigest,
      stages: Object.fromEntries(
        REQUIRED_RELEASE_STAGES.map((name) => [
          name,
          { ok: true, runId: "fixture-release", exitCode: 0 },
        ]),
      ),
      fixtureOnly: true,
    },
    null,
    2,
  ),
);

const env = {
  ...process.env,
  HOME: home,
  OMCODE_RELEASE_APP: candidateApp,
  OMCODE_RELEASE_RECEIPT: releaseReceiptPath,
  OMCODE_SOURCE_BRANCH: "fixture/install-e2e",
  OMCODE_SOURCE_HEAD: "fixture",
};
run(process.execPath, ["scripts/install-local.mjs"], env);

const app = path.join(home, "Applications/OMCODE.app");
const source = path.join(home, "Developer/OMCODE/source/apps/omcode-desktop");
const data = path.join(home, "Library/Application Support/OMCODE");
const first = await verifyCandidateBundle(app, source);
assert.equal(first.bundleManifestDigest, candidate.bundleManifestDigest);
const sentinel = path.join(data, "user-data-sentinel.txt");
await fs.writeFile(sentinel, "preserve-user-data\n");
const database = path.join(data, "omcode.sqlite");
const databaseDigest = sha256(await fs.readFile(database));

run(process.execPath, ["scripts/update-local.mjs"], env);

const second = await verifyCandidateBundle(app, source);
assert.equal(second.bundleManifestDigest, candidate.bundleManifestDigest);
assert.equal(await fs.readFile(sentinel, "utf8"), "preserve-user-data\n");
assert.equal(sha256(await fs.readFile(database)), databaseDigest);
const shell = await fs.readFile(path.join(home, ".zshrc"), "utf8");
assert.equal((shell.match(/# OMCODE local launcher/g) || []).length, 1);
assert.match(shell, /alias keep-me=/);
const installation = JSON.parse(
  await fs.readFile(
    path.join(home, "Developer/OMCODE/installation-receipt.json"),
    "utf8",
  ),
);
assert.equal(installation.dataPreserved, true);
await fs.access(path.join(installation.updateBackup, "source-module-before"));
await fs.access(
  path.join(
    installation.updateBackup,
    `OMCODE-before-${candidate.version}.app`,
  ),
);

// A developer's modified checkout must survive the next update untouched.
const modifiedSource = path.join(source, "README.md");
await fs.appendFile(modifiedSource, "\nUSER_SOURCE_SENTINEL\n");
run(process.execPath, ["scripts/update-local.mjs"], env);
const changedInstall = JSON.parse(
  await fs.readFile(
    path.join(home, "Developer/OMCODE/installation-receipt.json"),
    "utf8",
  ),
);
assert.notEqual(changedInstall.target, source);
assert.match(await fs.readFile(modifiedSource, "utf8"), /USER_SOURCE_SENTINEL/);
assert.equal(changedInstall.preservedChangedSource.path, source);
await verifyCandidateBundle(app, changedInstall.target);
assert.equal(sha256(await fs.readFile(database)), databaseDigest);
const preservation = JSON.parse(
  await fs.readFile(changedInstall.dataPreservationReceipt, "utf8"),
);
assert.equal(preservation.preserved, true);
assert.ok(preservation.checkedFiles >= 2);

const receipt = {
  time: new Date().toISOString(),
  ok: true,
  version: candidate.version,
  sourceDigest: candidate.sourceDigest,
  bundleManifestDigest: candidate.bundleManifestDigest,
  checks: [
    "fresh-install-in-isolated-home",
    "candidate-sidecar-verification",
    "idempotent-update",
    "database-byte-identical",
    "modified-source-preserved-in-place",
    "measured-data-preservation-manifest",
    "user-data-sentinel-preserved",
    "shell-update-idempotent",
    "dated-app-and-source-backups",
  ],
  scratch,
};
await fs.writeFile(
  path.join(moduleRoot, "evidence/install-e2e.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(receipt, null, 2));

function run(command, args, childEnv) {
  const result = spawnSync(command, args, {
    cwd: moduleRoot,
    env: childEnv,
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(
      `${[command, ...args].join(" ")} failed (${result.status ?? result.signal}):\n${result.stdout}\n${result.stderr}`,
    );
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
