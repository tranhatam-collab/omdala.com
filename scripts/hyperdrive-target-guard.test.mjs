import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateHyperdriveTarget } from "./hyperdrive-target-guard.mjs";

const productionAuthority = {
  schema_version: 1,
  cloudflare_account_id: "f".repeat(32),
  environments: {
    production: {
      hyperdrive_id: "a".repeat(32),
      hyperdrive_name: "omdala-postgres-production",
      postgres_host: "db.example.com",
      postgres_port: 5432,
      postgres_database: "omdala_prod",
      postgres_user: "omdala_api",
    },
    staging: {
      hyperdrive_name: "omdala-postgres-staging",
      postgres_host: "db.example.com",
      postgres_port: 5432,
      postgres_database: "omdala_staging",
      postgres_user: "omdala_staging",
    },
  },
};

function provider(overrides = {}) {
  return {
    id: "b".repeat(32),
    name: "omdala-postgres-staging",
    origin: {
      host: "db.example.com",
      port: 5432,
      database: "omdala_staging",
      scheme: "postgresql",
      user: "omdala_staging",
    },
    ...overrides,
  };
}

function evaluate(overrides = {}) {
  const providerConfig = overrides.providerConfig ?? provider();
  return evaluateHyperdriveTarget({
    environment: "staging",
    expectedId: providerConfig.id,
    expectedHost: providerConfig.origin.host,
    expectedDatabase: providerConfig.origin.database,
    expectedAccountId: productionAuthority.cloudflare_account_id,
    providerConfig,
    productionAuthority,
    authoritySha256: "c".repeat(64),
    ...overrides,
  });
}

describe("Hyperdrive target guard", () => {
  it("accepts a named staging config on a distinct database", () => {
    const result = evaluate();
    assert.equal(result.accepted, true);
    assert.equal(result.isolatedFromProduction, true);
    assert.match(result.originFingerprintSha256, /^[a-f0-9]{64}$/);
  });

  it("rejects production ID or database aliases in staging", () => {
    const sameId = provider({ id: productionAuthority.environments.production.hyperdrive_id });
    assert.equal(evaluate({ providerConfig: sameId, expectedId: sameId.id }).accepted, false);

    const sameDatabase = provider({
      origin: {
        host: productionAuthority.environments.production.postgres_host,
        port: productionAuthority.environments.production.postgres_port,
        database: productionAuthority.environments.production.postgres_database,
        scheme: "postgresql",
        user: productionAuthority.environments.production.postgres_user,
      },
    });
    assert.equal(
      evaluate({
        providerConfig: sameDatabase,
        expectedHost: sameDatabase.origin.host,
        expectedDatabase: sameDatabase.origin.database,
      }).accepted,
      false,
    );
  });

  it("rejects a staging config whose provider readback differs from protected vars", () => {
    const result = evaluate({ expectedDatabase: "different" });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "PROTECTED_EXPECTATION_MISMATCH");
  });

  it("rejects provider readback with the wrong canonical name or user", () => {
    assert.equal(evaluate({ providerConfig: provider({ name: "renamed-staging" }) }).accepted, false);
    const wrongUser = provider({
      origin: { ...provider().origin, user: "omdala_api" },
    });
    assert.equal(evaluate({ providerConfig: wrongUser }).accepted, false);
  });

  it("rejects missing provider readback", () => {
    const result = evaluate({ providerConfig: null });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "INVALID_PROVIDER_CONFIG");
  });

  it("accepts production only at the immutable production authority", () => {
    const productionProvider = {
      id: productionAuthority.environments.production.hyperdrive_id,
      name: productionAuthority.environments.production.hyperdrive_name,
      origin: {
        host: productionAuthority.environments.production.postgres_host,
        port: productionAuthority.environments.production.postgres_port,
        database: productionAuthority.environments.production.postgres_database,
        scheme: "postgresql",
        user: productionAuthority.environments.production.postgres_user,
      },
    };
    const result = evaluate({
      environment: "production",
      providerConfig: productionProvider,
      expectedId: productionProvider.id,
      expectedHost: productionProvider.origin.host,
      expectedDatabase: productionProvider.origin.database,
    });
    assert.equal(result.accepted, true);
    assert.equal(result.isolatedFromProduction, null);
  });
});
