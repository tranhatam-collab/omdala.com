import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  REQUIRED_SURFACES,
  createAggregateSurfaceReceipt,
  validateSurfaceManifest,
  validatePagesDeployment,
  validateWorkerDeployment,
} from "./surface-release-contract.mjs";

const sha = "a".repeat(40);
const releaseId = "pages-run-1-aaaaaaaaaaaa";

function manifest(surface, overrides = {}) {
  return {
    schema_version: 1,
    surface,
    environment: "staging",
    release_sha: sha,
    release_id: releaseId,
    asset_manifest_sha256: "2".repeat(64),
    asset_file_count: 10,
    built_at: "2026-10-07T12:00:00.000Z",
    ...overrides,
  };
}

function aggregateInput() {
  return {
    manifests: Object.fromEntries(
      REQUIRED_SURFACES.map((surface) => [
        surface,
        { manifest: manifest(surface), sha256: "1".repeat(64) },
      ]),
    ),
    urls: {
      web: "https://staging.omdala.com",
      app: "https://app-staging.omdala.com",
      auth: "https://auth-staging.omdala.com",
      brand: "https://brand-staging.omdala.com",
    },
    workerDeployments: Object.fromEntries(
      REQUIRED_SURFACES.map((surface, index) => [
        surface,
        {
          schema_version: 1,
          surface,
          platform: "cloudflare-workers-static-assets",
          worker_name: `omdala-surface-${surface}-staging`,
          release_id: releaseId,
          deployment_id: `0000000${index + 1}-0000-4000-8000-000000000001`,
          version_id: `1000000${index + 1}-0000-4000-8000-000000000001`,
          previous_deployment_id: null,
          previous_version_id: null,
          version_etag: "a".repeat(64),
          secret_inventory_verified: true,
          pre_secret_inventory_verified: true,
          post_secret_inventory_verified: true,
          worker_authority_verified: true,
          asset_binding_verified: true,
          asset_binding_name: "ASSETS",
          pre_secret_inventory_receipt_sha256: "b".repeat(64),
          post_secret_inventory_receipt_sha256: "c".repeat(64),
          worker_authority_receipt_sha256: "d".repeat(64),
          captured_at: "2026-10-07T12:00:30.000Z",
        },
      ]),
    ),
    pagesDeployments: {},
    environment: "staging",
    candidateSha: sha,
    candidateTreeSha: "b".repeat(40),
    reviewedSha: sha,
    reviewedTreeSha: "b".repeat(40),
    controlPlaneSha: "c".repeat(40),
    stagingTransactionId: "staging-56-1",
    cloudflareAccountId: "d".repeat(32),
    releaseId,
    sourcePrNumber: 12,
    independentReviewer: "independent-reviewer",
    independentReviewId: 34,
    workflowRunId: 56,
    workflowRunAttempt: 1,
    reusableWorkflowRef:
      `owner/omdala.com/.github/workflows/deploy-surfaces.yml@${"c".repeat(40)}`,
    reusableWorkflowSha: "c".repeat(40),
    reusableWorkflowPath: ".github/workflows/deploy-surfaces.yml",
    repository: "owner/omdala.com",
    createdAt: "2026-10-07T12:01:00.000Z",
  };
}

describe("surface release contract", () => {
  it("accepts a matching Auth release manifest", () => {
    assert.equal(
      validateSurfaceManifest(manifest("auth"), {
        surface: "auth",
        environment: "staging",
        releaseSha: sha,
        releaseId,
      }).surface,
      "auth",
    );
  });

  it("writes an Auth release manifest through the production CLI", () => {
    const directory = mkdtempSync(join(tmpdir(), "omdala-auth-release-"));
    try {
      writeFileSync(
        join(directory, "_headers"),
        "/*\n  X-Frame-Options: DENY\n  Content-Security-Policy: connect-src 'self' https://api.omdala.com; frame-ancestors 'none'\n",
        "utf8",
      );
      execFileSync(
        process.execPath,
        [
          "scripts/write-surface-release.mjs",
          directory,
          "auth",
          "staging",
          sha,
          releaseId,
        ],
        { stdio: "pipe" },
      );
      const written = JSON.parse(
        readFileSync(join(directory, "release.json"), "utf8"),
      );
      assert.equal(written.surface, "auth");
      assert.equal(written.release_sha, sha);
      assert.match(written.asset_manifest_sha256, /^[a-f0-9]{64}$/);
      assert.ok(written.asset_file_count > 0);
      const headers = readFileSync(join(directory, "_headers"), "utf8");
      assert.match(headers, /X-Robots-Tag: noindex, nofollow/);
      assert.match(headers, /X-Frame-Options: DENY/);
      assert.match(headers, /frame-ancestors 'none'/);
      assert.match(headers, /https:\/\/api-staging\.omdala\.com/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("writes a staging-only noindex header and staging Web CSP", () => {
    const directory = mkdtempSync(join(tmpdir(), "omdala-web-release-"));
    try {
      writeFileSync(
        join(directory, "_headers"),
        "/*\n  Content-Security-Policy: connect-src 'self' https://api.omdala.com\n\n/\n  X-Robots-Tag: index, follow\n",
        "utf8",
      );
      execFileSync(
        process.execPath,
        [
          "scripts/write-surface-release.mjs",
          directory,
          "web",
          "staging",
          sha,
          releaseId,
        ],
        { stdio: "pipe" },
      );
      const headers = readFileSync(join(directory, "_headers"), "utf8");
      assert.match(headers, /X-Robots-Tag: noindex, nofollow/);
      assert.match(headers, /https:\/\/api-staging\.omdala\.com/);
      assert.doesNotMatch(headers, /https:\/\/api\.omdala\.com/);
      assert.doesNotMatch(headers, /X-Robots-Tag: index, follow/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("does not inject staging policy into a production artifact", () => {
    const directory = mkdtempSync(join(tmpdir(), "omdala-prod-release-"));
    try {
      writeFileSync(
        join(directory, "_headers"),
        "/*\n  Content-Security-Policy: connect-src 'self' https://api.omdala.com\n",
        "utf8",
      );
      execFileSync(
        process.execPath,
        [
          "scripts/write-surface-release.mjs",
          directory,
          "web",
          "production",
          sha,
          releaseId,
        ],
        { stdio: "pipe" },
      );
      const headers = readFileSync(join(directory, "_headers"), "utf8");
      assert.match(headers, /https:\/\/api\.omdala\.com/);
      assert.doesNotMatch(headers, /api-staging/);
      assert.doesNotMatch(headers, /X-Robots-Tag: noindex/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("aggregates exactly Web, App, Auth, and Brand", () => {
    const receipt = createAggregateSurfaceReceipt(aggregateInput());
    assert.deepEqual(receipt.surface_names, ["web", "app", "auth", "brand"]);
    assert.equal(receipt.surfaces.auth.release_sha, sha);
    assert.equal(receipt.candidate_tree_sha, "b".repeat(40));
    assert.equal(receipt.reviewed_sha, sha);
    assert.equal(receipt.control_plane_sha, "c".repeat(40));
    assert.equal(receipt.staging_transaction_id, "staging-56-1");
    assert.equal(receipt.cloudflare_account_id, "d".repeat(32));
    assert.equal(receipt.surfaces.auth.url, "https://auth-staging.omdala.com");
    assert.equal(
      receipt.worker_deployments.auth.worker_name,
      "omdala-surface-auth-staging",
    );
  });

  it("fails closed when Auth is missing", () => {
    const input = aggregateInput();
    delete input.manifests.auth;
    assert.throws(() => createAggregateSurfaceReceipt(input), /Exactly these surfaces/);
  });

  it("rejects a stale or mismatched Auth identity", () => {
    const input = aggregateInput();
    input.manifests.auth.manifest.release_sha = "b".repeat(40);
    assert.throws(() => createAggregateSurfaceReceipt(input), /auth release manifest/);
  });

  it("rejects staging or production when reviewed tree provenance differs", () => {
    const input = aggregateInput();
    input.reviewedTreeSha = "e".repeat(40);
    assert.throws(
      () => createAggregateSurfaceReceipt(input),
      /independently reviewed Git trees must match/,
    );
  });

  it("rejects staging when the reviewed commit differs from the deployed candidate", () => {
    const input = aggregateInput();
    input.reviewedSha = "e".repeat(40);
    assert.throws(
      () => createAggregateSurfaceReceipt(input),
      /Staging candidate SHA must equal/,
    );
  });

  it("rejects non-HTTPS surface origins", () => {
    const input = aggregateInput();
    input.urls.auth = "http://auth-staging.omdala.com";
    assert.throws(() => createAggregateSurfaceReceipt(input), /auth public origin/);
  });

  it("rejects lookalike, decorated, production, and cross-surface staging URLs", () => {
    for (const badUrl of [
      "https://staging.omdala.com.attacker.example",
      "https://staging.omdala.com:8443",
      "https://staging.omdala.com/path",
      "https://omdala.com",
      "https://app-staging.omdala.com",
    ]) {
      const input = aggregateInput();
      input.urls.web = badUrl;
      assert.throws(() => createAggregateSurfaceReceipt(input));
    }
  });

  it("binds production receipts to canonical production URLs", () => {
    const input = aggregateInput();
    input.environment = "production";
    input.candidateSha = "e".repeat(40);
    input.reviewedSha = sha;
    input.urls = {
      web: "https://omdala.com",
      app: "https://app.omdala.com",
      auth: "https://auth.omdala.com",
      brand: "https://brand.omdala.com",
    };
    input.workerDeployments = {};
    input.pagesDeployments = Object.fromEntries(
      REQUIRED_SURFACES.map((surface, index) => [
        surface,
        {
          schema_version: 1,
          surface,
          platform: "cloudflare-pages",
          environment: "production",
          project_name: `omdala-${surface}`,
          release_id: releaseId,
          source_sha: input.candidateSha,
          deployment_id: `2000000${index + 1}-0000-4000-8000-000000000001`,
          previous_deployment_id: null,
          deployment_url: `https://2000000${index + 1}.omdala-${surface}.pages.dev`,
          production_branch: surface === "auth" ? "production" : "main",
          deployment_status: "success",
          custom_domain: surface === "web" ? "omdala.com" : `${surface}.omdala.com`,
          canonical_after_deploy: true,
          captured_at: "2026-10-07T12:00:30.000Z",
        },
      ]),
    );
    for (const surface of REQUIRED_SURFACES) {
      input.manifests[surface].manifest.environment = "production";
      input.manifests[surface].manifest.release_sha = input.candidateSha;
    }
    const receipt = createAggregateSurfaceReceipt(input);
    assert.equal(receipt.surfaces.web.url, "https://omdala.com");
    assert.equal(receipt.surfaces.brand.url, "https://brand.omdala.com");
    assert.equal(receipt.pages_deployments.auth.project_name, "omdala-auth");
    assert.equal(receipt.candidate_sha, "e".repeat(40));
    assert.equal(receipt.reviewed_sha, sha);
    assert.equal(receipt.candidate_tree_sha, receipt.reviewed_tree_sha);
  });

  it("requires exact Cloudflare staging deployment and rollback identities", () => {
    const input = aggregateInput();
    delete input.workerDeployments.auth;
    assert.throws(
      () => createAggregateSurfaceReceipt(input),
      /requires Worker deployment receipts/,
    );

    const invalid = aggregateInput();
    invalid.workerDeployments.web.version_id = "latest";
    assert.throws(
      () => createAggregateSurfaceReceipt(invalid),
      /web Worker deployment receipt is invalid/,
    );
  });

  it("validates the Worker name for each staging surface", () => {
    const record = aggregateInput().workerDeployments.brand;
    assert.equal(
      validateWorkerDeployment(record, { surface: "brand", releaseId }).version_id,
      record.version_id,
    );
    assert.throws(() =>
      validateWorkerDeployment(
        { ...record, worker_name: "omdala-surface-web-staging" },
        { surface: "brand", releaseId },
      ),
    );
  });

  it("requires the exact empty-secret and ASSETS authority receipts", () => {
    const mutations = [
      ["secret_inventory_verified", false],
      ["pre_secret_inventory_verified", false],
      ["post_secret_inventory_verified", false],
      ["worker_authority_verified", false],
      ["asset_binding_verified", false],
      ["asset_binding_name", "STATIC"],
      ["pre_secret_inventory_receipt_sha256", "missing"],
      ["post_secret_inventory_receipt_sha256", "missing"],
      ["worker_authority_receipt_sha256", "missing"],
    ];
    for (const [field, value] of mutations) {
      const input = aggregateInput();
      input.workerDeployments.web[field] = value;
      assert.throws(
        () => createAggregateSurfaceReceipt(input),
        /web Worker deployment receipt is invalid/,
      );
    }
  });

  it("requires exact Pages deployment and rollback identities in production", () => {
    const input = aggregateInput();
    input.environment = "production";
    input.urls = {
      web: "https://omdala.com",
      app: "https://app.omdala.com",
      auth: "https://auth.omdala.com",
      brand: "https://brand.omdala.com",
    };
    input.workerDeployments = {};
    input.pagesDeployments = {};
    for (const surface of REQUIRED_SURFACES) {
      input.manifests[surface].manifest.environment = "production";
    }
    assert.throws(
      () => createAggregateSurfaceReceipt(input),
      /requires Pages deployment receipts/,
    );
  });

  it("validates production Pages provenance", () => {
    const record = {
      schema_version: 1,
      surface: "web",
      platform: "cloudflare-pages",
      environment: "production",
      project_name: "omdala-web",
      release_id: releaseId,
      source_sha: sha,
      deployment_id: "20000001-0000-4000-8000-000000000001",
      previous_deployment_id: "20000002-0000-4000-8000-000000000001",
      deployment_url: "https://20000001.omdala-web.pages.dev",
      production_branch: "main",
      deployment_status: "success",
      custom_domain: "omdala.com",
      canonical_after_deploy: true,
      captured_at: "2026-10-07T12:00:30.000Z",
    };
    assert.equal(
      validatePagesDeployment(record, { surface: "web", releaseId, releaseSha: sha })
        .deployment_id,
      record.deployment_id,
    );
    assert.throws(() =>
      validatePagesDeployment(
        { ...record, source_sha: "b".repeat(40) },
        { surface: "web", releaseId, releaseSha: sha },
      ),
    );
  });
});
