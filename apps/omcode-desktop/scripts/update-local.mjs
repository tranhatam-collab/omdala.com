import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { verifyCandidateBundle } from "./bundle-verifier.mjs";
import {
  createSourceManifest,
  manifestDigest,
  verifyReleaseManifest,
} from "./integrity.mjs";
import { assertReleaseReceipt } from "./release-receipt.mjs";
import { dataManifest, compareData } from "./data-manifest.mjs";
import { ensureLauncherPath } from "./shell-config.mjs";
import {
  currentInstallationProvenance,
  previousInstallationHistory,
} from "./installation-provenance.mjs";

const moduleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const workspace = path.join(process.env.HOME, "Developer/OMCODE");
const receiptPath = path.join(workspace, "installation-receipt.json");
const previousBytes = await fs.readFile(receiptPath);
const previous = JSON.parse(previousBytes.toString());
let target =
  previous.target || path.join(previous.source, "apps/omcode-desktop");
const stagedApp = path.resolve(
  process.env.OMCODE_RELEASE_APP || path.join(moduleRoot, "release/OMCODE.app"),
);
const releaseReceiptPath = path.resolve(
  process.env.OMCODE_RELEASE_RECEIPT ||
    path.join(moduleRoot, "evidence/release-verification.json"),
);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const originalTarget = target;
const currentSourceDigest = manifestDigest(await createSourceManifest(target));
const preserveChangedSource = currentSourceDigest !== previous.sourceDigest;
const oldManifest = JSON.parse(
  await fs.readFile(previous.app + ".manifest.json", "utf8"),
);
if (
  manifestDigest(oldManifest) !== previous.bundleManifestDigest ||
  !(await verifyReleaseManifest(previous.app, oldManifest)).ok
)
  throw new Error(
    "Installed bundle differs from its recorded sidecar; refusing replacement.",
  );
const candidate = await verifyCandidateBundle(stagedApp, moduleRoot);
const releaseReceipt = JSON.parse(
  await fs.readFile(releaseReceiptPath, "utf8"),
);
assertReleaseReceipt(releaseReceipt, candidate);
const provenance = currentInstallationProvenance(releaseReceipt);
if (preserveChangedSource) {
  target = path.join(
    workspace,
    "releases",
    "source-" + candidate.version + "-" + candidate.sourceDigest.slice(0, 12),
  );
  try {
    await fs.lstat(target);
    throw new Error(
      "New source destination already exists; not overwriting it.",
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
await fs.mkdir(path.dirname(target), { recursive: true });
const running = spawnSync(
  "/usr/bin/pgrep",
  ["-f", path.join(previous.app, "Contents/")],
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
const dataPath =
  previous.data ||
  path.join(process.env.HOME, "Library/Application Support/OMCODE");
const dataBefore = await dataManifest(dataPath);
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(workspace, "repair-backups", stamp);
await fs.mkdir(backup, { recursive: true, mode: 0o700 });
const previousReceiptPath = path.join(
  backup,
  "installation-receipt-before.json",
);
if (digest(await fs.readFile(receiptPath)) !== digest(previousBytes))
  throw new Error(
    "Installation receipt changed during update; update stopped.",
  );
await fs.writeFile(previousReceiptPath, previousBytes, {
  flag: "wx",
  mode: 0o600,
});
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
  if (!preserveChangedSource) {
    await fs.rename(target, sourceBackup);
    oldSourceMoved = true;
  }
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
const dataAfter = await dataManifest(dataPath);
const preservation = compareData(dataBefore, dataAfter);
await fs.writeFile(
  path.join(backup, "data-preservation.json"),
  JSON.stringify(
    { before: dataBefore, after: dataAfter, ...preservation },
    null,
    2,
  ),
);
if (!preservation.preserved)
  throw new Error(
    "User data changed during update; inspect data-preservation.json. No data was deleted by this installer.",
  );
const receipt = {
  schemaVersion: 3,
  time: new Date().toISOString(),
  app: previous.app,
  source: target,
  target,
  data: dataPath,
  launcher,
  shellConfig,
  shellBackup: path.join(backup, ".zshrc.before-update"),
  shellBeforeSha256: digest(shellBefore),
  shellAfterSha256: digest(shellAfter),
  preservedChangedSource: preserveChangedSource
    ? { path: originalTarget, sourceDigest: currentSourceDigest }
    : null,
  version: installed.version,
  ...provenance,
  history: {
    previousInstallation: previousInstallationHistory(
      previousBytes,
      previousReceiptPath,
    ),
  },
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
  dataPreserved: preservation.preserved,
  dataPreservationReceipt: path.join(backup, "data-preservation.json"),
  deletedUserFiles: preservation.deleted.length,
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
    dataPreserved: preservation.preserved,
    dataPreservationReceipt: path.join(backup, "data-preservation.json"),
  }),
);
