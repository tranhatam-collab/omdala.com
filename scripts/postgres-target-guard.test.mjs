import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  describePostgresTarget,
  evaluatePostgresTargets,
} from "./postgres-target-guard.mjs";

const acceptedInput = {
  sourceUrl: "postgresql://omdala_staging:secret@mail.iai.one:5432/omdala_staging?sslmode=require",
  restoreUrl: "postgresql://restore:secret@127.0.0.1:55432/omdala_restore",
  expectedSourceHost: "mail.iai.one",
  expectedSourceDatabase: "omdala_staging",
  environment: "staging",
  productionAuthority: {
    schema_version: 1,
    cloudflare_account_id: "f".repeat(32),
    environments: {
      production: {
        postgres_host: "mail.iai.one",
        postgres_port: 5432,
        postgres_database: "omdala_prod",
        postgres_user: "omdala_api",
      },
      staging: {
        postgres_host: "mail.iai.one",
        postgres_port: 5432,
        postgres_database: "omdala_staging",
        postgres_user: "omdala_staging",
      },
    },
  },
};

describe("PostgreSQL pre-migration target guard", () => {
  it("accepts an expected source and a distinct restore target", () => {
    const result = evaluatePostgresTargets(acceptedInput);
    assert.equal(result.accepted, true);
    assert.equal(result.reason, "SOURCE_AND_RESTORE_TARGETS_VERIFIED");
  });

  it("never includes database credentials in the target description", () => {
    const result = describePostgresTarget(acceptedInput.sourceUrl);
    assert.deepEqual(result, {
      user: "omdala_staging",
      host: "mail.iai.one",
      port: "5432",
      database: "omdala_staging",
      sslMode: "require",
    });
    assert.equal(JSON.stringify(result).includes("secret"), false);
    assert.equal(JSON.stringify(result).includes("secret"), false);
  });

  it("rejects a source host that does not match the protected identity", () => {
    const result = evaluatePostgresTargets({
      ...acceptedInput,
      expectedSourceHost: "other.example.com",
    });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "SOURCE_HOST_MISMATCH");
  });

  it("rejects a source database that does not match the protected identity", () => {
    const result = evaluatePostgresTargets({
      ...acceptedInput,
      expectedSourceDatabase: "other_database",
    });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "SOURCE_DATABASE_MISMATCH");
  });

  it("rejects a restore operation aimed at the source database", () => {
    const result = evaluatePostgresTargets({
      ...acceptedInput,
      restoreUrl: acceptedInput.sourceUrl,
    });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "RESTORE_TARGET_EQUALS_SOURCE");
  });

  it("rejects the immutable production target in staging even when protected vars repeat it", () => {
    const result = evaluatePostgresTargets({
      ...acceptedInput,
      sourceUrl: "postgresql://omdala_api:secret@mail.iai.one:5432/omdala_prod",
      expectedSourceHost: "mail.iai.one",
      expectedSourceDatabase: "omdala_prod",
    });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "STAGING_SOURCE_EQUALS_PRODUCTION");
  });

  it("requires the immutable production target for a production migration", () => {
    const rejected = evaluatePostgresTargets({
      ...acceptedInput,
      environment: "production",
    });
    assert.equal(rejected.accepted, false);
    assert.equal(rejected.reason, "PRODUCTION_SOURCE_AUTHORITY_MISMATCH");

    const accepted = evaluatePostgresTargets({
      ...acceptedInput,
      environment: "production",
      sourceUrl: "postgresql://omdala_api:secret@mail.iai.one:5432/omdala_prod",
      expectedSourceHost: "mail.iai.one",
      expectedSourceDatabase: "omdala_prod",
    });
    assert.equal(accepted.accepted, true);
    assert.equal(accepted.productionTargetMatch, true);
  });

  it("rejects a staging URL with the right database but the production user", () => {
    const result = evaluatePostgresTargets({
      ...acceptedInput,
      sourceUrl: "postgresql://omdala_api:secret@mail.iai.one:5432/omdala_staging",
    });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "SOURCE_ENVIRONMENT_AUTHORITY_MISMATCH");
  });

  it("rejects non-PostgreSQL URLs", () => {
    assert.throws(
      () => describePostgresTarget("https://db.example.com/omdala"),
      /postgres/i,
    );
  });
});
