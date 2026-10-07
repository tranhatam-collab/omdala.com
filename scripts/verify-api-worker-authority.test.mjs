import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  evaluateApiRemotePreflightWorkflow,
  expectedApiSecretNames,
  verifyApiRemotePreflight,
  verifyApiSecretInventory,
  verifyApiVersionAuthority,
} from "./verify-api-worker-authority.mjs";

const environment = "staging";
const releaseSha = "1".repeat(40);
const versionId = "11111111-1111-4111-8111-111111111111";
const releaseId = "gh-1-1-111111111111";
const hyperdriveId = "2".repeat(32);
const googleClientId = "1234567890-omdala.apps.googleusercontent.com";

const plain = {
  ENVIRONMENT: "staging",
  RELEASE_SHA: releaseSha,
  APP_BASE_URL: "https://app-staging.omdala.com",
  WEB_BASE_URL: "https://staging.omdala.com",
  AUTH_BASE_URL: "https://auth-staging.omdala.com",
  AIAGENT_API_URL: "https://staging-api.aiagent.iai.one",
  AIAGENT_WORKSPACE_ID: "omdala-com-staging",
  MAIL_API_URL: "https://mail.iai.one/_mail",
  MAIL_API_WORKSPACE_ID: "omdala.com-staging",
  MAIL_DELIVERY_MODE: "sink",
  GOOGLE_CLIENT_ID: googleClientId,
  GOOGLE_REDIRECT_URI: "https://api-staging.omdala.com/v1/auth/google/callback",
};

function version(extra = []) {
  return {
    id: versionId,
    annotations: { "workers/message": releaseId },
    resources: {
      bindings: [
        ...Object.entries(plain).map(([name, text]) => ({ name, type: "plain_text", text })),
        ...expectedApiSecretNames(environment).map((name) => ({ name, type: "secret_text" })),
        { name: "VERSION_METADATA", type: "version_metadata" },
        { name: "HYPERDRIVE", type: "hyperdrive", id: hyperdriveId },
        ...extra,
      ],
    },
  };
}

describe("API Worker authority", () => {
  it("accepts only the exact staging secret and version binding inventory", () => {
    assert.equal(
      verifyApiSecretInventory({
        inventory: expectedApiSecretNames(environment),
        environment,
      }).verdict,
      "API_SECRET_INVENTORY_EXACT",
    );
    assert.equal(
      verifyApiVersionAuthority({
        version: version(),
        versionId,
        releaseId,
        environment,
        releaseSha,
        googleClientId,
        hyperdriveId,
      }).verdict,
      "API_WORKER_AUTHORITY_EXACT",
    );
  });

  it("allows missing secrets before first deploy but rejects every unexpected name", () => {
    assert.equal(
      verifyApiSecretInventory({ inventory: [], environment, allowMissing: true })
        .missing_names.length,
      expectedApiSecretNames(environment).length,
    );
    assert.throws(
      () =>
        verifyApiSecretInventory({
          inventory: ["AI_API_KEY"],
          environment,
          allowMissing: true,
        }),
      /unexpected names: AI_API_KEY/,
    );
  });

  it("rejects stale vars, secrets, duplicate names, and unsupported bindings", () => {
    const mutations = [
      () => {
        const candidate = version();
        candidate.resources.bindings.find((item) => item.name === "MAIL_DELIVERY_MODE").text = "direct";
        return candidate;
      },
      () => version([{ name: "AI_API_KEY", type: "secret_text" }]),
      () => version([{ name: "ENVIRONMENT", type: "plain_text", text: "staging" }]),
      () => version([{ name: "UNEXPECTED", type: "kv_namespace", namespace_id: "x" }]),
    ];
    for (const mutate of mutations) {
      assert.throws(() =>
        verifyApiVersionAuthority({
          version: mutate(),
          versionId,
          releaseId,
          environment,
          releaseSha,
          googleClientId,
          hyperdriveId,
        }),
      );
    }
  });
});

const productionEnvironment = "production";
const productionReleaseSha = "3".repeat(40);
const productionVersionId = "33333333-3333-4333-8333-333333333333";
const productionDeploymentId = "44444444-4444-4444-8444-444444444444";
const productionReleaseId = "gh-123-1-333333333333";
const productionHyperdriveId = "4".repeat(32);

function productionVersion(extra = []) {
  const productionPlain = {
    ENVIRONMENT: productionEnvironment,
    RELEASE_SHA: productionReleaseSha,
    APP_BASE_URL: "https://app.omdala.com",
    WEB_BASE_URL: "https://omdala.com",
    AUTH_BASE_URL: "https://auth.omdala.com",
    AIAGENT_API_URL: "https://api.aiagent.iai.one",
    AIAGENT_WORKSPACE_ID: "omdala-com-production",
    MAIL_API_URL: "https://mail.iai.one/_mail",
    MAIL_API_WORKSPACE_ID: "omdala.com",
    MAIL_DELIVERY_MODE: "direct",
    GOOGLE_CLIENT_ID: googleClientId,
    GOOGLE_REDIRECT_URI: "https://api.omdala.com/v1/auth/google/callback",
  };
  return {
    id: productionVersionId,
    annotations: { "workers/message": productionReleaseId },
    resources: {
      bindings: [
        ...Object.entries(productionPlain).map(([name, text]) => ({
          name,
          type: "plain_text",
          text,
        })),
        ...expectedApiSecretNames(productionEnvironment).map((name) => ({
          name,
          type: "secret_text",
        })),
        { name: "VERSION_METADATA", type: "version_metadata" },
        {
          name: "HYPERDRIVE",
          type: "hyperdrive",
          id: productionHyperdriveId,
        },
        ...extra,
      ],
    },
  };
}

function deployment(overrides = {}) {
  return {
    id: productionDeploymentId,
    created_on: "2026-10-08T00:00:00.000Z",
    versions: [{ version_id: productionVersionId, percentage: 100 }],
    ...overrides,
  };
}

function remotePreflight(overrides = {}) {
  return verifyApiRemotePreflight({
    deployments: [deployment()],
    secretInventory: expectedApiSecretNames(productionEnvironment),
    version: productionVersion(),
    environment: productionEnvironment,
    googleClientId,
    hyperdriveId: productionHyperdriveId,
    ...overrides,
  });
}

describe("read-only API remote preflight", () => {
  it("accepts one exact existing production rollback baseline", () => {
    const result = remotePreflight();
    assert.equal(result.verdict, "API_REMOTE_PREFLIGHT_ACCEPTED");
    assert.equal(result.resource_exists, true);
    assert.equal(result.rollback_baseline_verified, true);
    assert.equal(result.secret_inventory_verified, true);
    assert.equal(result.hyperdrive_binding_verified, true);
    assert.equal(result.current_version_id, productionVersionId);
  });

  it("requires an existing Worker resource in production", () => {
    assert.throws(
      () =>
        remotePreflight({
          deployments: [],
          secretInventory: [],
          version: null,
        }),
      /existing Worker rollback baseline/,
    );
    assert.throws(
      () =>
        remotePreflight({
          deployments: [],
          secretInventory: [],
          version: null,
          allowMissingResource: true,
        }),
      /Only staging/,
    );
  });

  it("allows only staging to bootstrap a missing Worker", () => {
    const result = remotePreflight({
      deployments: [],
      secretInventory: [],
      version: null,
      environment: "staging",
      hyperdriveId,
      allowMissingResource: true,
    });
    assert.equal(
      result.verdict,
      "API_REMOTE_PREFLIGHT_MISSING_STAGING_RESOURCE_ALLOWED",
    );
    assert.equal(result.resource_exists, false);

    assert.throws(
      () =>
        remotePreflight({
          deployments: [],
          secretInventory: ["AIAGENT_API_KEY"],
          version: null,
          environment: "staging",
          hyperdriveId,
          allowMissingResource: true,
        }),
      /must not claim secrets/,
    );
  });

  it("rejects a split, partial, or mismatched rollback baseline", () => {
    assert.throws(
      () =>
        remotePreflight({
          deployments: [
            deployment({
              versions: [
                { version_id: productionVersionId, percentage: 90 },
                {
                  version_id: "55555555-5555-4555-8555-555555555555",
                  percentage: 10,
                },
              ],
            }),
          ],
        }),
      /one exact 100% rollback baseline/,
    );
    assert.throws(
      () =>
        remotePreflight({
          version: {
            ...productionVersion(),
            id: "55555555-5555-4555-8555-555555555555",
          },
        }),
      /does not match the rollback baseline/,
    );
  });

  it("rejects missing or unexpected remote secret names", () => {
    assert.throws(
      () =>
        remotePreflight({
          secretInventory: expectedApiSecretNames(productionEnvironment).slice(1),
        }),
      /missing required names/,
    );
    assert.throws(
      () =>
        remotePreflight({
          secretInventory: [
            ...expectedApiSecretNames(productionEnvironment),
            "LEGACY_PROVIDER_KEY",
          ],
        }),
      /unexpected names/,
    );
  });

  it("rejects rollback authority with the wrong Hyperdrive or mutable annotation", () => {
    const wrongHyperdrive = productionVersion();
    wrongHyperdrive.resources.bindings.find(
      (binding) => binding.name === "HYPERDRIVE",
    ).id = "5".repeat(32);
    assert.throws(
      () => remotePreflight({ version: wrongHyperdrive }),
      /Hyperdrive binding is not exact/,
    );

    const mutableAnnotation = productionVersion();
    mutableAnnotation.annotations["workers/message"] = "manual deploy";
    assert.throws(
      () => remotePreflight({ version: mutableAnnotation }),
      /immutable release ID/,
    );
  });
});

describe("read-only remote preflight workflow contract", () => {
  it("runs the remote gate before migration and repeats it before deploy", () => {
    const source = readFileSync(".github/workflows/deploy.yml", "utf8");
    const result = evaluateApiRemotePreflightWorkflow(source);
    assert.equal(result.accepted, true, JSON.stringify(result.checks));
  });

  it("rejects removal of the validate-job provider preflight", () => {
    const source = readFileSync(".github/workflows/deploy.yml", "utf8").replace(
      "Read-only API provider preflight before database migration",
      "Remote preflight omitted",
    );
    const result = evaluateApiRemotePreflightWorkflow(source);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(({ id }) => id === "READ_ONLY_PREFLIGHT_BEFORE_MIGRATION")
        ?.pass,
      false,
    );
  });

  it("rejects removal of the pre-deploy TOCTOU recheck", () => {
    const source = readFileSync(".github/workflows/deploy.yml", "utf8").replace(
      "--receipt api-remote-preflight-before-deploy.json",
      "--receipt recheck-omitted.json",
    );
    const result = evaluateApiRemotePreflightWorkflow(source);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(({ id }) => id === "DEPLOYMENT_RECHECK_PRESERVED")
        ?.pass,
      false,
    );
  });

  it("rejects allowing a missing production Worker", () => {
    const source = readFileSync(".github/workflows/deploy.yml", "utf8").replace(
      'if [[ "$RELEASE_ENVIRONMENT" == "staging" ]] && [[ "$worker_exists" == "false" ]]; then',
      'if [[ "$RELEASE_ENVIRONMENT" == "production" ]] && [[ "$worker_exists" == "false" ]]; then',
    );
    const result = evaluateApiRemotePreflightWorkflow(source);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(
        ({ id }) => id === "PRODUCTION_RESOURCE_REQUIRED_STAGING_MAY_BOOTSTRAP",
      )?.pass,
      false,
    );
  });
});
