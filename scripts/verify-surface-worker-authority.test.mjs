import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  verifySurfaceSecretInventory,
  verifySurfaceVersionAuthority,
} from "./verify-surface-worker-authority.mjs";

const releaseId = "pages-100-1-aaaaaaaaaaaa";
const versionId = "11111111-1111-4111-8111-111111111111";

function version(bindings = [{ name: "ASSETS", type: "assets" }]) {
  return {
    id: versionId,
    annotations: { "workers/message": releaseId },
    resources: {
      script: { etag: "a".repeat(64) },
      bindings,
    },
  };
}

describe("staging static surface Worker authority", () => {
  it("accepts an exactly empty secret inventory before and after deploy", () => {
    assert.equal(
      verifySurfaceSecretInventory({
        inventory: [],
        surface: "web",
        phase: "preflight",
        providerWorkerMissing: true,
      }).verdict,
      "SURFACE_WORKER_SECRET_INVENTORY_EXACT_EMPTY",
    );
    assert.deepEqual(
      verifySurfaceSecretInventory({
        inventory: [],
        surface: "auth",
        phase: "postdeploy",
      }).actual_secret_names,
      [],
    );
  });

  it("allows a missing Worker only in preflight", () => {
    assert.throws(
      () =>
        verifySurfaceSecretInventory({
          inventory: [],
          surface: "app",
          phase: "postdeploy",
          providerWorkerMissing: true,
        }),
      /only during preflight/,
    );
  });

  it("rejects every remote secret, duplicate, malformed, or typed inventory entry", () => {
    const inventories = [
      ["STALE_SECRET"],
      [{ name: "STALE_SECRET", type: "secret_text" }],
      ["DUPLICATE", "DUPLICATE"],
      [{ name: "lowercase" }],
      [{ name: "SECRET", type: "plain_text" }],
      {},
    ];
    for (const inventory of inventories) {
      assert.throws(() =>
        verifySurfaceSecretInventory({
          inventory,
          surface: "brand",
          phase: "preflight",
        }),
      );
    }
  });

  it("accepts only the exact ASSETS binding and release identity", () => {
    const result = verifySurfaceVersionAuthority({
      version: version(),
      surface: "web",
      versionId,
      releaseId,
    });
    assert.equal(result.verdict, "SURFACE_WORKER_AUTHORITY_EXACT");
    assert.deepEqual(result.bindings, [{ name: "ASSETS", type: "assets" }]);
    assert.equal(result.worker_name, "omdala-surface-web-staging");
  });

  it("rejects a missing, renamed, mistyped, duplicate, secret, or extra binding", () => {
    const bindingSets = [
      [],
      [{ name: "STATIC", type: "assets" }],
      [{ name: "ASSETS", type: "service" }],
      [
        { name: "ASSETS", type: "assets" },
        { name: "ASSETS", type: "assets" },
      ],
      [
        { name: "ASSETS", type: "assets" },
        { name: "STALE_SECRET", type: "secret_text" },
      ],
      [
        { name: "ASSETS", type: "assets" },
        { name: "STALE_VAR", type: "plain_text", text: "unsafe" },
      ],
    ];
    for (const bindings of bindingSets) {
      assert.throws(() =>
        verifySurfaceVersionAuthority({
          version: version(bindings),
          surface: "web",
          versionId,
          releaseId,
        }),
      );
    }
  });

  it("rejects a stale message, version ID, or provider etag", () => {
    const candidates = [
      { ...version(), id: "22222222-2222-4222-8222-222222222222" },
      { ...version(), annotations: { "workers/message": "stale-release" } },
      {
        ...version(),
        resources: {
          ...version().resources,
          script: { etag: "not-a-sha256" },
        },
      },
    ];
    for (const candidate of candidates) {
      assert.throws(() =>
        verifySurfaceVersionAuthority({
          version: candidate,
          surface: "app",
          versionId,
          releaseId,
        }),
      );
    }
  });

  it("pins the ASSETS binding in all four staging surface configs", () => {
    for (const surface of ["web", "app", "auth", "brand"]) {
      const config = JSON.parse(
        readFileSync(`infra/staging/surfaces/${surface}.wrangler.jsonc`, "utf8"),
      );
      assert.equal(config.name, `omdala-surface-${surface}-staging`);
      assert.equal(config.main, "./static-worker.mjs");
      assert.equal(config.assets.binding, "ASSETS");
      assert.equal(config.assets.run_worker_first, true);
      assert.equal(config.vars, undefined);
    }
    const worker = readFileSync(
      "infra/staging/surfaces/static-worker.mjs",
      "utf8",
    );
    assert.match(worker, /return env\.ASSETS\.fetch\(request\)/);
    assert.doesNotMatch(worker, /fetch\s*\(\s*["'`]/);
  });
});
