import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import {
  createSourceManifest,
  manifestDigest,
  verifyPayloadManifest,
  verifyReleaseManifest,
} from "./integrity.mjs";

export async function verifyCandidateBundle(
  candidateApp,
  sourceRoot,
  { platformChecks = true } = {},
) {
  const app = path.resolve(candidateApp);
  const source = path.resolve(sourceRoot);
  const contents = path.join(app, "Contents");
  const resources = path.join(contents, "Resources");
  const manifest = JSON.parse(
    await fs.readFile(path.join(resources, "bundle-manifest.json"), "utf8"),
  );
  const payload = await verifyPayloadManifest(resources, manifest);
  if (!payload.ok)
    throw new Error(`Bundle payload mismatch: ${JSON.stringify(payload)}`);
  const releaseManifest = JSON.parse(
    await fs.readFile(`${app}.manifest.json`, "utf8"),
  );
  const releasePayload = await verifyReleaseManifest(app, releaseManifest);
  if (!releasePayload.ok)
    throw new Error(
      `Bundle payload mismatch: ${JSON.stringify(releasePayload)}`,
    );

  const sourceDigest = manifestDigest(await createSourceManifest(source));
  if (sourceDigest !== manifest.sourceDigest)
    throw new Error(
      `Bundle source digest mismatch: expected ${manifest.sourceDigest}, got ${sourceDigest}`,
    );
  if (
    releaseManifest.sourceDigest !== sourceDigest ||
    releaseManifest.version !== manifest.version
  )
    throw new Error("Release manifest does not match embedded provenance.");

  const metadata = JSON.parse(
    await fs.readFile(path.join(source, "package.json"), "utf8"),
  );
  if (manifest.version !== metadata.version)
    throw new Error(
      `Bundle version mismatch: expected ${metadata.version}, got ${manifest.version}`,
    );

  const nativeBinary = path.join(app, "Contents/MacOS/OMCODE");
  const runtimeNode = path.join(resources, "runtime/node");
  const keychainHelper = path.join(resources, "runtime/OMCODEKeychain");
  await Promise.all([
    fs.access(nativeBinary),
    fs.access(runtimeNode),
    fs.access(keychainHelper),
  ]);

  let nodeVersion = "not-executed";
  let codesign = "not-checked";
  let architecture = "not-checked";
  let buildNumber = "not-checked";
  if (platformChecks) {
    run("/usr/bin/codesign", [
      "--verify",
      "--deep",
      "--strict",
      "--verbose=2",
      app,
    ]);
    nodeVersion = run(runtimeNode, ["--version"], true).stdout.trim();
    const plist = path.join(contents, "Info.plist");
    const plistVersion = run(
      "/usr/bin/plutil",
      ["-extract", "CFBundleShortVersionString", "raw", "-o", "-", plist],
      true,
    ).stdout.trim();
    buildNumber = run(
      "/usr/bin/plutil",
      ["-extract", "CFBundleVersion", "raw", "-o", "-", plist],
      true,
    ).stdout.trim();
    if (
      plistVersion !== metadata.version ||
      buildNumber !== String(metadata.buildNumber)
    )
      throw new Error(
        `Info.plist metadata mismatch: ${plistVersion} (${buildNumber}).`,
      );
    for (const executable of [nativeBinary, runtimeNode, keychainHelper]) {
      const available = run("/usr/bin/lipo", ["-archs", executable], true)
        .stdout.trim()
        .split(/\s+/);
      if (!available.includes(process.arch))
        throw new Error(
          `${executable} does not contain required architecture ${process.arch}.`,
        );
    }
    architecture = process.arch;
    codesign = "valid";
  }

  return {
    ok: true,
    app,
    version: manifest.version,
    sourceDigest,
    bundleManifestDigest: manifestDigest(releaseManifest),
    embeddedManifestDigest: manifestDigest(manifest),
    payloadFiles: releasePayload.checked,
    resourceFiles: payload.checked,
    runtimeNode: nodeVersion,
    architecture,
    buildNumber,
    codesign,
  };
}

function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.status !== 0)
    throw new Error(
      `${command} failed (${result.status ?? result.signal}): ${result.stderr || ""}`,
    );
  return result;
}
