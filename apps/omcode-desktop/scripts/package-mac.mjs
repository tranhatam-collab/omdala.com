import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  createPayloadManifest,
  createReleaseManifest,
  createSourceManifest,
  manifestDigest,
} from "./integrity.mjs";
import { runtimeCopyMode } from "./runtime-architecture.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetOutput = path.resolve(
  process.env.OMCODE_BUILD_OUTPUT || path.join(root, "release/OMCODE.app"),
);
const stagingParent = path.join(path.dirname(targetOutput), ".omcode-staging");
await fs.mkdir(stagingParent, { recursive: true });
const stagingDirectory = await fs.mkdtemp(path.join(stagingParent, "package-"));
const output = path.join(stagingDirectory, path.basename(targetOutput));
const contents = path.join(output, "Contents");
const resources = path.join(contents, "Resources");
const helperSource = path.join(root, "native/Keychain.swift");
const helperDirectory = path.join(root, "native/keychain-helper");
const helper = path.join(helperDirectory, "OMCODEKeychain");
const helperStamp = path.join(helperDirectory, "source-sha256");
const runtimeNode = path.join(resources, "runtime/node");
const runtimeSource = process.env.OMCODE_NODE_RUNTIME || process.execPath;
const sourceFiles = await createSourceManifest(root);
const sourceDigest = manifestDigest(sourceFiles);
const helperDigest = createHash("sha256")
  .update(await fs.readFile(helperSource))
  .digest("hex");
await fs.mkdir(helperDirectory, { recursive: true });
let previousDigest = null;
try {
  previousDigest = (await fs.readFile(helperStamp, "utf8")).trim();
} catch {}
if (previousDigest && previousDigest !== helperDigest)
  throw new Error(
    "Keychain helper source changed. An explicit credential reauthorization/migration is required before rebuilding it.",
  );
if (!previousDigest) {
  run("/usr/bin/xcrun", [
    "swiftc",
    "-O",
    "-swift-version",
    "5",
    "-module-cache-path",
    path.join(root, "release/swift-module-cache"),
    helperSource,
    "-o",
    helper,
    "-framework",
    "Security",
  ]);
  run("/usr/bin/codesign", [
    "--force",
    "--sign",
    "-",
    "--identifier",
    "com.omdala.omcode.keychain",
    helper,
  ]);
  await fs.writeFile(helperStamp, helperDigest);
}
await fs.mkdir(path.join(contents, "MacOS"), { recursive: true });
await fs.mkdir(path.join(resources, "runtime"), { recursive: true });
for (const name of ["dist", "server"])
  await fs.cp(path.join(root, name), path.join(resources, "app", name), {
    recursive: true,
    dereference: true,
  });
await fs.copyFile(
  path.join(root, "package.json"),
  path.join(resources, "app/package.json"),
);
const copied = new Set();
async function copyDependency(name) {
  if (copied.has(name)) return;
  const source = path.join(root, "node_modules", name);
  let manifest;
  try {
    manifest = JSON.parse(
      await fs.readFile(path.join(source, "package.json"), "utf8"),
    );
  } catch {
    return;
  }
  copied.add(name);
  await fs.cp(source, path.join(resources, "app/node_modules", name), {
    recursive: true,
    dereference: true,
  });
  for (const dependency of Object.keys({
    ...manifest.dependencies,
    ...manifest.optionalDependencies,
    ...manifest.peerDependencies,
  }))
    await copyDependency(dependency);
}
for (const dependency of ["@modelcontextprotocol/sdk", "smol-toml", "yaml"])
  await copyDependency(dependency);
const architectures = spawnSync("/usr/bin/lipo", ["-archs", runtimeSource], {
  encoding: "utf8",
});
if (architectures.status !== 0)
  throw new Error(`Cannot inspect Node runtime: ${architectures.stderr}`);
const available = architectures.stdout.trim().split(/\s+/);
const copyMode = runtimeCopyMode(available, process.arch);
if (copyMode === "thin")
  run("/usr/bin/lipo", [
    runtimeSource,
    "-thin",
    process.arch,
    "-output",
    runtimeNode,
  ]);
else await fs.copyFile(runtimeSource, runtimeNode);
await fs.chmod(runtimeNode, 0o755);
await fs.copyFile(helper, path.join(resources, "runtime/OMCODEKeychain"));
await fs.chmod(path.join(resources, "runtime/OMCODEKeychain"), 0o755);
await fs.copyFile(
  path.join(root, "public/omcode-icon.png"),
  path.join(resources, "AppIcon.png"),
);
await fs.copyFile(
  path.join(root, "native/verification-driver.js"),
  path.join(resources, "verification-driver.js"),
);
const metadata = JSON.parse(
  await fs.readFile(path.join(root, "package.json"), "utf8"),
);
const info = {
  CFBundleName: "OMCODE",
  CFBundleDisplayName: "OMCODE",
  CFBundleExecutable: "OMCODE",
  CFBundleIdentifier: "com.omdala.omcode",
  CFBundlePackageType: "APPL",
  CFBundleShortVersionString: metadata.version,
  CFBundleVersion: String(metadata.buildNumber),
  CFBundleIconFile: "AppIcon.png",
  LSMinimumSystemVersion: "14.0",
  NSHighResolutionCapable: true,
  NSDocumentsFolderUsageDescription: "OMCODE mở và chỉnh sửa dự án bạn chọn.",
  NSDesktopFolderUsageDescription: "OMCODE mở và chỉnh sửa dự án bạn chọn.",
  NSAppTransportSecurity: { NSAllowsLocalNetworking: true },
};
const plist = path.join(contents, "Info.plist");
await fs.writeFile(plist, JSON.stringify(info));
function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: root });
  if (r.status !== 0) process.exit(r.status || 1);
}
run("/usr/bin/plutil", ["-convert", "xml1", plist]);
run("/usr/bin/xcrun", [
  "swiftc",
  "-O",
  "-swift-version",
  "5",
  "-module-cache-path",
  path.join(root, "release/swift-module-cache"),
  path.join(root, "native/OMCODE.swift"),
  "-o",
  path.join(contents, "MacOS/OMCODE"),
  "-framework",
  "AppKit",
  "-framework",
  "WebKit",
  "-framework",
  "Security",
]);
const payloadManifest = await createPayloadManifest(resources, {
  sourceDigest,
  version: metadata.version,
});
await fs.writeFile(
  path.join(resources, "bundle-manifest.json"),
  JSON.stringify(payloadManifest, null, 2) + "\n",
);
run("/usr/bin/codesign", ["--force", "--sign", "-", output]);
run(runtimeNode, ["--version"]);
const releaseManifest = await createReleaseManifest(output, {
  sourceDigest,
  version: metadata.version,
});
const stagedManifest = `${output}.manifest.json`;
await fs.writeFile(
  stagedManifest,
  JSON.stringify(releaseManifest, null, 2) + "\n",
);
let previousOutput = null;
let previousManifest = null;
try {
  await fs.access(targetOutput);
  const backupDirectory = path.join(path.dirname(targetOutput), "backups");
  await fs.mkdir(backupDirectory, { recursive: true });
  previousOutput = path.join(
    backupDirectory,
    `${path.basename(targetOutput, ".app")}-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.app`,
  );
  await fs.rename(targetOutput, previousOutput);
  try {
    await fs.rename(
      `${targetOutput}.manifest.json`,
      `${previousOutput}.manifest.json`,
    );
    previousManifest = `${previousOutput}.manifest.json`;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
try {
  await fs.rename(output, targetOutput);
  await fs.rename(stagedManifest, `${targetOutput}.manifest.json`);
} catch (error) {
  try {
    await fs.access(targetOutput);
    await fs.rename(
      targetOutput,
      path.join(stagingDirectory, "failed-OMCODE.app"),
    );
  } catch {}
  if (previousOutput) {
    await fs.rename(previousOutput, targetOutput);
    if (previousManifest)
      await fs.rename(previousManifest, `${targetOutput}.manifest.json`);
  }
  throw error;
}
await fs.rmdir(stagingDirectory);
console.log(
  JSON.stringify({
    app: targetOutput,
    previousApp: previousOutput,
    node: process.version,
    runtimeNode:
      copyMode === "thin"
        ? `${process.arch} from ${runtimeSource}`
        : runtimeSource,
    sourceDigest,
    bundleManifestDigest: manifestDigest(releaseManifest),
    embeddedManifestDigest: manifestDigest(payloadManifest),
    sourceHead:
      spawnSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
        timeout: 5000,
      }).stdout?.trim() || null,
  }),
);
