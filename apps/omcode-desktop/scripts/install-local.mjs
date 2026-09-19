import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createStore } from "../server/store.mjs";
import { verifyCandidateBundle } from "./bundle-verifier.mjs";
import { createSourceManifest, manifestDigest } from "./integrity.mjs";
import { assertReleaseReceipt } from "./release-receipt.mjs";
import { ensureLauncherPath } from "./shell-config.mjs";

const moduleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const home = process.env.HOME;
const workspace = path.join(home, "Developer/OMCODE");
const source = path.join(workspace, "source");
const target = path.join(source, "apps/omcode-desktop");
const app = path.join(home, "Applications/OMCODE.app");
const data = path.join(home, "Library/Application Support/OMCODE");
const launcher = path.join(home, ".local/bin/omcode");
const shellConfig = path.join(home, ".zshrc");
const stagedApp = path.resolve(
  process.env.OMCODE_RELEASE_APP || path.join(moduleRoot, "release/OMCODE.app"),
);
const stagedData = process.env.OMCODE_STAGED_DATA
  ? path.resolve(process.env.OMCODE_STAGED_DATA)
  : null;
const releaseReceiptPath = path.resolve(
  process.env.OMCODE_RELEASE_RECEIPT ||
    path.join(moduleRoot, "evidence/release-verification.json"),
);
const original = await fs.readFile(shellConfig);
const proposed = Buffer.from(ensureLauncherPath(original.toString()));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const candidate = await verifyCandidateBundle(stagedApp, moduleRoot);
const releaseReceipt = JSON.parse(
  await fs.readFile(releaseReceiptPath, "utf8"),
);
assertReleaseReceipt(releaseReceipt, candidate);
if (digest(await fs.readFile(shellConfig)) !== digest(original))
  throw new Error("Shell config changed since staging. Installation stopped.");
for (const target of [workspace, app, data, launcher]) {
  try {
    await fs.lstat(target);
    throw new Error("Destination exists; refusing overwrite: " + target);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const originalMode = (await fs.stat(shellConfig)).mode & 0o777;
await fs.access(path.join(stagedApp, "Contents/MacOS/OMCODE"));
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(data, "repair-backups", stamp);
await fs.mkdir(backup, { recursive: true, mode: 0o700 });
await fs.copyFile(shellConfig, path.join(backup, ".zshrc.before-omcode"));
await fs.chmod(path.join(backup, ".zshrc.before-omcode"), 0o600);
await fs.mkdir(path.dirname(target), { recursive: true });
await fs.cp(moduleRoot, target, {
  recursive: true,
  force: false,
  errorOnExist: true,
  filter: (file) =>
    !["node_modules", "dist", "release", "evidence"].includes(
      path.relative(moduleRoot, file).split(path.sep)[0],
    ),
});
await fs.mkdir(path.dirname(app), { recursive: true });
await fs.cp(stagedApp, app, {
  recursive: true,
  force: false,
  errorOnExist: true,
});
await fs.copyFile(
  `${stagedApp}.manifest.json`,
  `${app}.manifest.json`,
  fsConstants.COPYFILE_EXCL,
);
const next = createStore(data);
let skillCount = 0;
try {
  if (stagedData) {
    const previous = createStore(stagedData);
    try {
      next.set("providers", previous.get("providers", []));
      next.set("mcp", previous.get("mcp", []));
      const skills = [];
      for (const skill of previous.get("skills", [])) {
        const destination = path.join(data, "skills", skill.id);
        await fs.cp(skill.path, destination, {
          recursive: true,
          force: false,
          errorOnExist: true,
        });
        skills.push({ ...skill, path: destination });
      }
      next.set("skills", skills);
      skillCount = skills.length;
    } finally {
      previous.close();
    }
  }
  next.set("preferences", { theme: "light" });
  next.set("projects", [
    { root: path.join(source, "apps/omcode-desktop"), name: "OMCODE Desktop" },
  ]);
} finally {
  next.close();
}
await fs.mkdir(path.dirname(launcher), { recursive: true });
await fs.copyFile(path.join(moduleRoot, "scripts/omcode"), launcher);
await fs.chmod(launcher, 0o755);
if (digest(await fs.readFile(shellConfig)) !== digest(original))
  throw new Error(
    "Shell config changed during installation; app installed but alias left unchanged.",
  );
const temporary = shellConfig + ".omcode-" + stamp + ".tmp";
await fs.writeFile(temporary, proposed, { flag: "wx", mode: originalMode });
await fs.rename(temporary, shellConfig);
const installed = await verifyCandidateBundle(app, target);
const sourceFiles = await createSourceManifest(target);
const releaseReceiptSnapshot = path.join(workspace, "release-receipt.json");
await fs.writeFile(
  releaseReceiptSnapshot,
  JSON.stringify(releaseReceipt, null, 2) + "\n",
);
const receipt = {
  schemaVersion: 2,
  time: new Date().toISOString(),
  app,
  source,
  target,
  data,
  launcher,
  shellConfig,
  shellBackup: path.join(backup, ".zshrc.before-omcode"),
  version: installed.version,
  sourceHead: process.env.OMCODE_SOURCE_HEAD || null,
  sourceBranch: process.env.OMCODE_SOURCE_BRANCH || null,
  sourceDigest: manifestDigest(sourceFiles),
  sourceFiles,
  bundleManifestDigest: installed.bundleManifestDigest,
  payloadFiles: installed.payloadFiles,
  nativeBinarySha256: digest(
    await fs.readFile(path.join(app, "Contents/MacOS/OMCODE")),
  ),
  nodeSha256: digest(
    await fs.readFile(path.join(app, "Contents/Resources/runtime/node")),
  ),
  keychainHelperSha256: digest(
    await fs.readFile(
      path.join(app, "Contents/Resources/runtime/OMCODEKeychain"),
    ),
  ),
  shellBeforeSha256: digest(original),
  shellAfterSha256: digest(proposed),
  skillCount,
  dataMigratedFrom: stagedData,
  releaseReceipt: releaseReceiptSnapshot,
  releaseVerifiedAt: releaseReceipt.time,
  deletedUserFiles: 0,
  replacedOriginalApplicationBundles: 0,
};
await fs.writeFile(
  path.join(workspace, "installation-receipt.json"),
  JSON.stringify(receipt, null, 2),
);
console.log(
  JSON.stringify(
    { ...receipt, sourceFiles: receipt.sourceFiles.length },
    null,
    2,
  ),
);
