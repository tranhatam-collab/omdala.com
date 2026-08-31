import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  describePostgresTarget,
  evaluatePostgresTargets,
} from "./postgres-target-guard.mjs";

const acceptedInput = {
  sourceUrl: "postgresql://release:secret@db.example.com:5432/omdala?sslmode=require",
  restoreUrl: "postgresql://restore:secret@127.0.0.1:55432/omdala_restore",
  expectedSourceHost: "db.example.com",
  expectedSourceDatabase: "omdala",
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
      host: "db.example.com",
      port: "5432",
      database: "omdala",
      sslMode: "require",
    });
    assert.equal(JSON.stringify(result).includes("secret"), false);
    assert.equal(JSON.stringify(result).includes("release"), false);
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

  it("rejects non-PostgreSQL URLs", () => {
    assert.throws(
      () => describePostgresTarget("https://db.example.com/omdala"),
      /postgres/i,
    );
  });
});
