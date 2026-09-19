import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { verifyCandidateBundle } from "./bundle-verifier.mjs";
import { createSourceManifest, manifestDigest } from "./integrity.mjs";
import { assertReleaseReceipt } from "./release-receipt.mjs";
import { ensureLauncherPath } from "./shell-config.mjs";

const moduleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const workspace = path.join(process.env.HOME, "Developer/OMCODE");
const receiptPath = path.join(workspace, "installation-receipt.json");
const previous = JSON.parse(await fs.readFile(receiptPath, "utf8"));
const target =
  previous.target || path.join(previous.source, "apps/omcode-desktop");
const stagedApp = path.resolve(
  process.env.OMCODE_RELEASE_APP || path.join(moduleRoot, "release/OMCODE.app"),
);
const releaseReceiptPath = path.resolve(
  process.env.OMCODE_RELEASE_RECEIPT ||
    path.join(moduleRoot, "evidence/release-verification.json"),
);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const entry of previous.sourceFiles) {
  if (digest(await fs.readFile(path.join(target, entry.path))) !== entry.sha256)
    throw new Error(
      "Installed source has changed; refusing overwrite: " + entry.path,
    );
}
const currentSourceDigest = manifestDigest(await createSourceManifest(target));
if (currentSourceDigest !== previous.sourceDigest)
  throw new Error("Installed source file set has changed; refusing overwrite.");
if (previous.bundleManifestDigest) {
  const currentBundle = await verifyCandidateBundle(previous.app, target);
  if (currentBundle.bundleManifestDigest !== previous.bundleManifestDigest)
    throw new Error("Installed bundle differs from its receipt.");
} else if (
  digest(
    await fs.readFile(path.join(previous.app, "Contents/MacOS/OMCODE")),
  ) !== previous.nativeBinarySha256
) {
  throw new Error("Installed application has changed; refusing overwrite.");
}
const candidate = await verifyCandidateBundle(stagedApp, moduleRoot);
const releaseReceipt = JSON.parse(
  await fs.readFile(releaseReceiptPath, "utf8"),
);
assertReleaseReceipt(releaseReceipt, candidate);
const running = spawnSync(
  "/usr/bin/pgrep",
  ["-f", path.join(previous.app, "Contents/MacOS/OMCODE")],
  { encoding: "utf8" },
);
if (running.status === 0)
  throw new Error(
    `OMCODE is running (PID ${running.stdout.trim()}). Quit it before updating.`,
  );
if (running.status !== 1)
  throw new Error(
    `Cannot determine whether OMCODE is running; update stopped: ${running.stderr.trim()}`,
  );
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(workspace, "repair-backups", stamp);
await fs.mkdir(backup, { recursive: true, mode: 0o700 });
await fs.copyFile(
  receiptPath,
  path.join(backup, "installation-receipt-before.json"),
);
const shellConfig =
  previous.shellConfig || path.join(process.env.HOME, ".zshrc");
const launcher =
  previous.launcher || path.join(process.env.HOME, ".local/bin/omcode");
const shellBefore = await fs.readFile(shellConfig);
const shellAfter = Buffer.from(ensureLauncherPath(shellBefore.toString()));
await fs.copyFile(shellConfig, path.join(backup, ".zshrc.before-update"));
await fs.chmod(path.join(backup, ".zshrc.before-update"), 0o600);
await fs.mkdir(path.dirname(launcher), { recursive: true });
await fs.copyFile(path.join(moduleRoot, "scripts/omcode"), launcher);
await fs.chmod(launcher, 0o755);
if (!shellBefore.equals(shellAfter)) {
  const shellMode = (await fs.stat(shellConfig)).mode & 0o777;
  if (digest(await fs.readFile(shellConfig)) !== digest(shellBefore))
    throw new Error("Shell config changed during update; update stopped.");
  const temporary = `${shellConfig}.omcode-${stamp}.tmp`;
  await fs.writeFile(temporary, shellAfter, { flag: "wx", mode: shellMode });
  await fs.rename(temporary, shellConfig);
}
const sourceStaging = `${target}.staging-${stamp}`;
const appStaging = `${previous.app}.staging-${stamp}`;
const sourceBackup = path.join(backup, "source-module-before");
const appBackup = path.join(backup, `OMCODE-before-${candidate.version}.app`);
await fs.cp(moduleRoot, sourceStaging, {
  recursive: true,
  force: false,
  errorOnExist: true,
  filter: (file) =>
    !["node_modules", "dist", "release", "evidence"].includes(
      path.relative(moduleRoot, file).split(path.sep)[0],
    ),
});
await fs.cp(stagedApp, appStaging, {
  recursive: true,
  force: false,
  errorOnExist: true,
});
await fs.copyFile(
  `${stagedApp}.manifest.json`,
  `${appStaging}.manifest.json`,
  fsConstants.COPYFILE_EXCL,
);
await verifyCandidateBundle(appStaging, sourceStaging);
let oldSourceMoved = false;
let newSourceMoved = false;
let oldAppMoved = false;
let newAppMoved = false;
let oldManifestMoved = false;
let newManifestMoved = false;
try {
  await fs.rename(target, sourceBackup);
  oldSourceMoved = true;
  await fs.rename(sourceStaging, target);
  newSourceMoved = true;
  await fs.rename(previous.app, appBackup);
  oldAppMoved = true;
  try {
    await fs.rename(
      `${previous.app}.manifest.json`,
      `${appBackup}.manifest.json`,
    );
    oldManifestMoved = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await fs.rename(appStaging, previous.app);
  newAppMoved = true;
  await fs.rename(
    `${appStaging}.manifest.json`,
    `${previous.app}.manifest.json`,
  );
  newManifestMoved = true;
  await verifyCandidateBundle(previous.app, target);
} catch (error) {
  if (newAppMoved) {
    await fs.rename(previous.app, path.join(backup, "failed-new-OMCODE.app"));
    newAppMoved = false;
  }
  if (newManifestMoved)
    await fs.rename(
      `${previous.app}.manifest.json`,
      path.join(backup, "failed-new-OMCODE.app.manifest.json"),
    );
  if (oldAppMoved) {
    await fs.rename(appBackup, previous.app);
    if (oldManifestMoved)
      await fs.rename(
        `${appBackup}.manifest.json`,
        `${previous.app}.manifest.json`,
      );
  }
  if (newSourceMoved) {
    await fs.rename(target, path.join(backup, "failed-new-source-module"));
    newSourceMoved = false;
  }
  if (oldSourceMoved) await fs.rename(sourceBackup, target);
  throw error;
}

const installed = await verifyCandidateBundle(previous.app, target);
const sourceFiles = await createSourceManifest(target);
const releaseReceiptSnapshot = path.join(workspace, "release-receipt.json");
await fs.writeFile(
  releaseReceiptSnapshot,
  JSON.stringify(releaseReceipt, null, 2) + "\n",
);
const receipt = {
  ...previous,
  schemaVersion: 2,
  time: new Date().toISOString(),
  target,
  version: installed.version,
  sourceHead: process.env.OMCODE_SOURCE_HEAD || previous.sourceHead || null,
  sourceBranch:
    process.env.OMCODE_SOURCE_BRANCH || previous.sourceBranch || null,
  sourceFiles,
  sourceDigest: manifestDigest(sourceFiles),
  bundleManifestDigest: installed.bundleManifestDigest,
  payloadFiles: installed.payloadFiles,
  nativeBinarySha256: digest(
    await fs.readFile(path.join(previous.app, "Contents/MacOS/OMCODE")),
  ),
  nodeSha256: digest(
    await fs.readFile(
      path.join(previous.app, "Contents/Resources/runtime/node"),
    ),
  ),
  keychainHelperSha256: digest(
    await fs.readFile(
      path.join(previous.app, "Contents/Resources/runtime/OMCODEKeychain"),
    ),
  ),
  keychainService: "com.omdala.omcode.providers.v1",
  legacyKeychainServiceRetained: true,
  releaseReceipt: releaseReceiptSnapshot,
  releaseVerifiedAt: releaseReceipt.time,
  updateBackup: backup,
  dataPreserved: true,
  deletedUserFiles: 0,
};
await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2) + "\n");
console.log(
  JSON.stringify({
    time: receipt.time,
    app: receipt.app,
    version: receipt.version,
    sourceDigest: receipt.sourceDigest,
    bundleManifestDigest: receipt.bundleManifestDigest,
    keychainHelperSha256: receipt.keychainHelperSha256,
    updateBackup: backup,
    dataPreserved: true,
  }),
);
