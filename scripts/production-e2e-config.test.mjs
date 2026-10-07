import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CANONICAL_PRODUCTION_ORIGINS,
  validateProductionE2EEnvironment,
} from "./production-e2e-config.mjs";

const SHA = "a".repeat(40);
const VERSION_ID = "11111111-1111-4111-8111-111111111111";
const DEPLOYMENT_ID = "22222222-2222-4222-8222-222222222222";

function validEnvironment() {
  return {
    E2E_PRODUCTION_WEB_URL: CANONICAL_PRODUCTION_ORIGINS.web,
    E2E_PRODUCTION_APP_URL: CANONICAL_PRODUCTION_ORIGINS.app,
    E2E_PRODUCTION_AUTH_URL: CANONICAL_PRODUCTION_ORIGINS.auth,
    E2E_PRODUCTION_API_URL: CANONICAL_PRODUCTION_ORIGINS.api,
    E2E_PRODUCTION_BRAND_URL: CANONICAL_PRODUCTION_ORIGINS.brand,
    E2E_RELEASE_SHA: SHA,
    E2E_API_VERSION_ID: VERSION_ID,
    E2E_API_DEPLOYMENT_ID: DEPLOYMENT_ID,
    E2E_SURFACE_RELEASE_ID: "pages-12345678-1-aaaaaaaaaaaa",
    E2E_PRODUCTION_SMOKE_MAGIC_LINK_TOKEN: "t".repeat(64),
  };
}

describe("production E2E configuration", () => {
  it("accepts only the five canonical production origins and exact identities", () => {
    const result = validateProductionE2EEnvironment(validEnvironment());
    assert.equal(result.releaseSha, SHA);
    assert.equal(result.apiVersionId, VERSION_ID);
    assert.equal(result.apiDeploymentId, DEPLOYMENT_ID);
    assert.equal(result.apiUrl, "https://api.omdala.com");
  });

  for (const [name, replacement] of [
    ["E2E_PRODUCTION_WEB_URL", "https://staging.omdala.com"],
    ["E2E_PRODUCTION_APP_URL", "https://app.omdala.com.evil.example"],
    ["E2E_PRODUCTION_AUTH_URL", "https://user@auth.omdala.com"],
    ["E2E_PRODUCTION_API_URL", "https://api.omdala.com/path"],
    ["E2E_PRODUCTION_BRAND_URL", "http://brand.omdala.com"],
  ]) {
    it(`rejects a non-canonical ${name}`, () => {
      const environment = validEnvironment();
      environment[name] = replacement;
      assert.throws(() => validateProductionE2EEnvironment(environment));
    });
  }

  it("rejects mutable, malformed, or missing release identities", () => {
    const mutableSha = validEnvironment();
    mutableSha.E2E_RELEASE_SHA = "main";
    assert.throws(() => validateProductionE2EEnvironment(mutableSha));

    const missingVersion = validEnvironment();
    delete missingVersion.E2E_API_VERSION_ID;
    assert.throws(() => validateProductionE2EEnvironment(missingVersion));

    const malformedDeployment = validEnvironment();
    malformedDeployment.E2E_API_DEPLOYMENT_ID = "latest";
    assert.throws(() => validateProductionE2EEnvironment(malformedDeployment));
  });

  it("rejects a short or whitespace-bearing production smoke token", () => {
    const shortToken = validEnvironment();
    shortToken.E2E_PRODUCTION_SMOKE_MAGIC_LINK_TOKEN = "short";
    assert.throws(() => validateProductionE2EEnvironment(shortToken));

    const whitespaceToken = validEnvironment();
    whitespaceToken.E2E_PRODUCTION_SMOKE_MAGIC_LINK_TOKEN = `${"x".repeat(40)} token`;
    assert.throws(() => validateProductionE2EEnvironment(whitespaceToken));
  });
});
