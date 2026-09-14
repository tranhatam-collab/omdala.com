import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createPayloadManifest,
  createReleaseManifest,
  createSourceManifest,
  manifestDigest,
  verifyPayloadManifest,
  verifyReleaseManifest,
} from "../scripts/integrity.mjs";
import { ensureLauncherPath } from "../scripts/shell-config.mjs";
import { playwrightCandidates } from "../scripts/playwright-runtime.mjs";
import { verifyCandidateBundle } from "../scripts/bundle-verifier.mjs";
import { runtimeCopyMode } from "../scripts/runtime-architecture.mjs";
import {
  assertReleaseReceipt,
  REQUIRED_RELEASE_STAGES,
} from "../scripts/release-receipt.mjs";

test("payload manifest is deterministic and detects a changed bundled file", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "omcode-manifest-"));
  await fs.mkdir(path.join(root, "app/dist"), { recursive: true });
  await fs.mkdir(path.join(root, "app/server"), { recursive: true });
  await fs.mkdir(path.join(root, "runtime"), { recursive: true });
  await fs.writeFile(
    path.join(root, "app/dist/index.html"),
    "<h1>OMCODE</h1>\n",
  );
  await fs.writeFile(path.join(root, "app/server/index.mjs"), "export {};\n");
  await fs.writeFile(path.join(root, "runtime/node"), "node-binary\n");

  const first = await createPayloadManifest(root, {
    sourceDigest: "source-digest",
    version: "0.2.0",
  });
  const second = await createPayloadManifest(root, {
    sourceDigest: "source-digest",
    version: "0.2.0",
  });

  assert.deepEqual(first, second);
  assert.deepEqual(
    first.files.map((entry) => entry.path),
    ["app/dist/index.html", "app/server/index.mjs", "runtime/node"],
  );
  assert.deepEqual(await verifyPayloadManifest(root, first), {
    ok: true,
    checked: 3,
    missing: [],
    changed: [],
    unexpected: [],
  });

  await fs.writeFile(path.join(root, "app/dist/index.html"), "tampered\n");
  const result = await verifyPayloadManifest(root, first);
  assert.equal(result.ok, false);
  assert.deepEqual(result.changed, ["app/dist/index.html"]);
});

test("release manifest covers signed bundle files excluded from the embedded manifest", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "omcode-release-"));
  await fs.mkdir(path.join(root, "MacOS"));
  await fs.mkdir(path.join(root, "Resources"));
  await fs.mkdir(path.join(root, "_CodeSignature"));
  await fs.writeFile(path.join(root, "MacOS/OMCODE"), "signed-native\n");
  await fs.writeFile(path.join(root, "Resources/bundle-manifest.json"), "{}\n");
  await fs.writeFile(path.join(root, "_CodeSignature/CodeResources"), "seal\n");

  const manifest = await createReleaseManifest(root, {
    sourceDigest: "source",
    version: "0.2.1",
  });
  assert.deepEqual(
    manifest.files.map((entry) => entry.path),
    [
      "_CodeSignature/CodeResources",
      "MacOS/OMCODE",
      "Resources/bundle-manifest.json",
    ],
  );
  assert.equal((await verifyReleaseManifest(root, manifest)).ok, true);
  await fs.writeFile(path.join(root, "MacOS/OMCODE"), "resigned-tamper\n");
  assert.deepEqual((await verifyReleaseManifest(root, manifest)).changed, [
    "MacOS/OMCODE",
  ]);
});

test("source manifest excludes generated evidence and dependency trees", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "omcode-source-"));
  for (const directory of [
    "server",
    "dist",
    "release",
    "evidence",
    "node_modules",
  ])
    await fs.mkdir(path.join(root, directory), { recursive: true });
  await fs.writeFile(path.join(root, "server/index.mjs"), "export {};\n");
  await fs.writeFile(path.join(root, "dist/index.html"), "generated\n");
  await fs.writeFile(path.join(root, "release/app"), "generated\n");
  await fs.writeFile(path.join(root, "evidence/result.json"), "{}\n");
  await fs.writeFile(path.join(root, "node_modules/module"), "dependency\n");

  const manifest = await createSourceManifest(root);
  assert.deepEqual(
    manifest.map((entry) => entry.path),
    ["server/index.mjs"],
  );
});

test("launcher PATH update is idempotent and removes only legacy OMCODE aliases", () => {
  const original = [
    "export EDITOR=vim",
    "alias omcode='cd /Users/example/Documents/omdala.com && bash scripts/omcode-launch.sh'",
    "alias keep-me='printf keep'",
    "",
  ].join("\n");

  const once = ensureLauncherPath(original);
  const twice = ensureLauncherPath(once);

  assert.equal(once, twice);
  assert.match(once, /# OMCODE local launcher/);
  assert.match(once, /export PATH="\$HOME\/.local\/bin:\$PATH"/);
  assert.doesNotMatch(once, /alias omcode=/);
  assert.match(once, /alias keep-me=/);
  assert.match(once, /export EDITOR=vim/);
});

test("Playwright resolution is portable and honors an explicit runtime first", () => {
  assert.deepEqual(
    playwrightCandidates(
      { OMCODE_PLAYWRIGHT_PATH: "/opt/omcode/playwright" },
      "/Users/tester",
    ),
    [
      "/opt/omcode/playwright",
      "playwright",
      "/Users/tester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
    ],
  );
});

test("candidate verification binds the bundle to the exact source and detects tampering", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "omcode-candidate-"));
  const source = path.join(root, "source");
  const app = path.join(root, "OMCODE.app");
  const resources = path.join(app, "Contents/Resources");
  await fs.mkdir(path.join(source, "server"), { recursive: true });
  await fs.mkdir(path.join(resources, "app/server"), { recursive: true });
  await fs.mkdir(path.join(resources, "runtime"), { recursive: true });
  await fs.mkdir(path.join(app, "Contents/MacOS"), { recursive: true });
  await fs.writeFile(
    path.join(source, "package.json"),
    JSON.stringify({ version: "0.2.1" }),
  );
  await fs.writeFile(path.join(source, "server/index.mjs"), "export {}\n");
  await fs.writeFile(
    path.join(resources, "app/server/index.mjs"),
    "export {}\n",
  );
  await fs.writeFile(path.join(resources, "runtime/node"), "node\n");
  await fs.writeFile(
    path.join(resources, "runtime/OMCODEKeychain"),
    "helper\n",
  );
  await fs.writeFile(path.join(app, "Contents/MacOS/OMCODE"), "native\n");

  const sourceDigest = manifestDigest(await createSourceManifest(source));
  const manifest = await createPayloadManifest(resources, {
    sourceDigest,
    version: "0.2.1",
  });
  await fs.writeFile(
    path.join(resources, "bundle-manifest.json"),
    JSON.stringify(manifest),
  );
  const releaseManifest = await createReleaseManifest(app, {
    sourceDigest,
    version: "0.2.1",
  });
  await fs.writeFile(`${app}.manifest.json`, JSON.stringify(releaseManifest));

  const verified = await verifyCandidateBundle(app, source, {
    platformChecks: false,
  });
  assert.equal(verified.ok, true);
  assert.equal(verified.sourceDigest, sourceDigest);
  assert.equal(verified.version, "0.2.1");

  await fs.writeFile(
    path.join(resources, "app/server/index.mjs"),
    "tampered\n",
  );
  await assert.rejects(
    verifyCandidateBundle(app, source, { platformChecks: false }),
    /Bundle payload mismatch/,
  );

  await fs.writeFile(
    path.join(resources, "app/server/index.mjs"),
    "export {}\n",
  );
  await fs.writeFile(path.join(app, "Contents/MacOS/OMCODE"), "tampered\n");
  await assert.rejects(
    verifyCandidateBundle(app, source, { platformChecks: false }),
    /Bundle payload mismatch/,
  );
});

test("CLI launcher is home-relative and contains no developer-specific path", async () => {
  const launcher = await fs.readFile(
    new URL("../scripts/omcode", import.meta.url),
    "utf8",
  );
  assert.match(launcher, /\$HOME\/Applications\/OMCODE\.app/);
  assert.doesNotMatch(launcher, /\/Users\//);
});

test("release receipt must cover every deterministic gate for the exact candidate", () => {
  const candidate = {
    version: "0.2.1",
    sourceDigest: "source-a",
    bundleManifestDigest: "bundle-a",
  };
  const receipt = {
    ok: true,
    ...candidate,
    stages: Object.fromEntries(
      REQUIRED_RELEASE_STAGES.map((name) => [name, { ok: true }]),
    ),
  };

  assert.equal(assertReleaseReceipt(receipt, candidate), true);
  assert.throws(
    () =>
      assertReleaseReceipt(
        { ...receipt, bundleManifestDigest: "bundle-old" },
        candidate,
      ),
    /different candidate/,
  );
  assert.throws(
    () =>
      assertReleaseReceipt(
        { ...receipt, stages: { ...receipt.stages, native: { ok: false } } },
        candidate,
      ),
    /native/,
  );
});

test("package metadata has an incrementing macOS bundle build number", async () => {
  const metadata = JSON.parse(
    await fs.readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(metadata.version, "0.2.1");
  assert.equal(Number.isSafeInteger(metadata.buildNumber), true);
  assert.ok(metadata.buildNumber > 2);
});

test("Node packaging accepts only the current architecture and thins universal binaries", () => {
  assert.equal(runtimeCopyMode(["arm64"], "arm64"), "copy");
  assert.equal(runtimeCopyMode(["x86_64", "arm64"], "arm64"), "thin");
  assert.throws(
    () => runtimeCopyMode(["x86_64"], "arm64"),
    /does not contain arm64/,
  );
});
