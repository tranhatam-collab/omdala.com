import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  SURFACE_ARTIFACTS,
  verifyProductionSurfaceArtifacts,
  verifyStagingSurfaceArtifacts,
} from "./verify-surface-artifacts.mjs";

const sha = "a".repeat(40);
const releaseId = "artifact-verification-aaaaaaaaaaaa";
const writer = fileURLToPath(new URL("./write-surface-release.mjs", import.meta.url));

function policyFor(surface, environment) {
  const privateSurface = surface === "app" || surface === "auth";
  const noindex = environment === "staging" || privateSurface;
  const expectedApi = environment === "staging"
    ? "https://api-staging.omdala.com"
    : "https://api.omdala.com";
  return { noindex, expectedApi };
}

function writeSurfaceFixture(root, surface, specification, environment) {
  const directory = join(root, specification.directory);
  const route = join(directory, specification.route);
  const { noindex, expectedApi } = policyFor(surface, environment);
  mkdirSync(dirname(route), { recursive: true });
  writeFileSync(
    route,
    `<html><head><meta name="robots" content="${noindex ? "noindex, nofollow" : "index, follow"}"></head></html>`,
  );
  writeFileSync(
    join(directory, "robots.txt"),
    `User-Agent: *\n${noindex ? "Disallow" : "Allow"}: /\n`,
  );
  const csp = specification.csp
    ? `  Content-Security-Policy: connect-src 'self' ${expectedApi}\n`
    : "";
  const robotsHeader = noindex ? "  X-Robots-Tag: noindex, nofollow\n" : "";
  writeFileSync(join(directory, "_headers"), `/*\n${robotsHeader}${csp}`);
  writeFileSync(join(directory, "asset.txt"), `${surface}-${environment}\n`);
  execFileSync(
    process.execPath,
    [writer, directory, surface, environment, sha, releaseId],
    { stdio: "pipe" },
  );
}

function makeFixture(environment = "staging") {
  const root = mkdtempSync(join(tmpdir(), "omdala-surface-artifacts-"));
  for (const [surface, specification] of Object.entries(SURFACE_ARTIFACTS)) {
    writeSurfaceFixture(root, surface, specification, environment);
  }
  return root;
}

function updateReleaseManifestDigest(directory, manifest) {
  const path = join(directory, "release.json");
  const release = JSON.parse(readFileSync(path, "utf8"));
  release.asset_manifest_sha256 = createHash("sha256").update(manifest).digest("hex");
  writeFileSync(path, `${JSON.stringify(release, null, 2)}\n`);
}

describe("staging surface artifacts", () => {
  it("accepts exact noindex artifacts, environment CSPs, and asset manifests", () => {
    const root = makeFixture();
    try {
      const evidence = verifyStagingSurfaceArtifacts(root);
      assert.deepEqual(Object.keys(evidence), ["web", "app", "auth", "brand"]);
      assert.match(evidence.web.asset_manifest_sha256, /^[a-f0-9]{64}$/);
      assert.ok(evidence.web.asset_file_count > 0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects contradictory indexable Web HTML even when its manifest is refreshed", () => {
    const root = makeFixture();
    try {
      const directory = join(root, SURFACE_ARTIFACTS.web.directory);
      writeFileSync(
        join(directory, SURFACE_ARTIFACTS.web.route),
        '<html><head><meta name="robots" content="index, follow"></head></html>',
      );
      execFileSync(process.execPath, [writer, directory, "web", "staging", sha, releaseId]);
      assert.throws(
        () => verifyStagingSurfaceArtifacts(root),
        /web staging HTML is missing robots noindex,nofollow metadata/i,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a staging CSP that permits the production API", () => {
    const root = makeFixture();
    try {
      const directory = join(root, SURFACE_ARTIFACTS.auth.directory);
      writeFileSync(
        join(directory, "_headers"),
        "/*\n  X-Robots-Tag: noindex, nofollow\n  Content-Security-Policy: connect-src 'self' https://api.omdala.com\n",
      );
      assert.throws(
        () => verifyStagingSurfaceArtifacts(root),
        /missing https:\/\/api-staging\.omdala\.com|wrong API origin/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("asset manifest integrity", () => {
  it("rejects an asset modified after the manifest was written", () => {
    const root = makeFixture();
    try {
      writeFileSync(join(root, SURFACE_ARTIFACTS.web.directory, "asset.txt"), "tampered\n");
      assert.throws(
        () => verifyStagingSurfaceArtifacts(root),
        /web asset digest does not match asset\.txt/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a manifest that does not cover the exact artifact", () => {
    const root = makeFixture();
    try {
      unlinkSync(join(root, SURFACE_ARTIFACTS.web.directory, "asset.txt"));
      assert.throws(
        () => verifyStagingSurfaceArtifacts(root),
        /not sorted or does not cover the exact artifact/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects an unsorted manifest even if release.json carries its new digest", () => {
    const root = makeFixture();
    try {
      const directory = join(root, SURFACE_ARTIFACTS.web.directory);
      const path = join(directory, "asset-manifest.sha256");
      const lines = readFileSync(path, "utf8").trimEnd().split("\n").reverse();
      const manifest = `${lines.join("\n")}\n`;
      writeFileSync(path, manifest);
      updateReleaseManifestDigest(directory, manifest);
      assert.throws(
        () => verifyStagingSurfaceArtifacts(root),
        /not sorted or does not cover the exact artifact/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a release manifest with the wrong asset count", () => {
    const root = makeFixture();
    try {
      const directory = join(root, SURFACE_ARTIFACTS.web.directory);
      const path = join(directory, "release.json");
      const release = JSON.parse(readFileSync(path, "utf8"));
      release.asset_file_count += 1;
      writeFileSync(path, `${JSON.stringify(release, null, 2)}\n`);
      assert.throws(
        () => verifyStagingSurfaceArtifacts(root),
        /wrong asset file count/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a release manifest with the wrong manifest digest", () => {
    const root = makeFixture();
    try {
      const directory = join(root, SURFACE_ARTIFACTS.web.directory);
      const path = join(directory, "release.json");
      const release = JSON.parse(readFileSync(path, "utf8"));
      release.asset_manifest_sha256 = "0".repeat(64);
      writeFileSync(path, `${JSON.stringify(release, null, 2)}\n`);
      assert.throws(
        () => verifyStagingSurfaceArtifacts(root),
        /wrong asset manifest SHA-256/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("production surface artifacts", () => {
  it("accepts public Web and Brand plus private App and Auth policies", () => {
    const root = makeFixture("production");
    try {
      const evidence = verifyProductionSurfaceArtifacts(root);
      assert.equal(evidence.web.noindex, false);
      assert.equal(evidence.brand.noindex, false);
      assert.equal(evidence.app.noindex, true);
      assert.equal(evidence.auth.noindex, true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects an indexable production App", () => {
    const root = makeFixture("production");
    try {
      const directory = join(root, SURFACE_ARTIFACTS.app.directory);
      writeFileSync(
        join(directory, SURFACE_ARTIFACTS.app.route),
        '<html><head><meta name="robots" content="index, follow"></head></html>',
      );
      execFileSync(process.execPath, [writer, directory, "app", "production", sha, releaseId]);
      assert.throws(
        () => verifyProductionSurfaceArtifacts(root),
        /app production HTML is missing robots noindex,nofollow metadata/i,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a noindex production Brand surface", () => {
    const root = makeFixture("production");
    try {
      const directory = join(root, SURFACE_ARTIFACTS.brand.directory);
      writeFileSync(
        join(directory, SURFACE_ARTIFACTS.brand.route),
        '<html><head><meta name="robots" content="noindex, nofollow"></head></html>',
      );
      writeFileSync(join(directory, "robots.txt"), "User-Agent: *\nDisallow: /\n");
      execFileSync(process.execPath, [writer, directory, "brand", "production", sha, releaseId]);
      assert.throws(
        () => verifyProductionSurfaceArtifacts(root),
        /brand production HTML is not explicitly index,follow/i,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a production Web CSP that still targets staging", () => {
    const root = makeFixture("production");
    try {
      const directory = join(root, SURFACE_ARTIFACTS.web.directory);
      writeFileSync(
        join(directory, "_headers"),
        "/*\n  Content-Security-Policy: connect-src 'self' https://api-staging.omdala.com\n",
      );
      execFileSync(process.execPath, [writer, directory, "web", "production", sha, releaseId]);
      assert.throws(
        () => verifyProductionSurfaceArtifacts(root),
        /missing https:\/\/api\.omdala\.com|wrong API origin/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
