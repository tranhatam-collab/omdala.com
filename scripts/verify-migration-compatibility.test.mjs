import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  evaluateMigrationCompatibility,
  evaluateMigrationWorkflowContract,
  inspectExpandOnlySql,
  sanitizeSqlForPolicy,
} from "./verify-migration-compatibility.mjs";

const manifestBytes = readFileSync(
  "infra/postgres/migrations/compatibility.json",
);
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const actualFiles = new Map(
  manifest.migrations.map(({ file }) => [
    file,
    readFileSync(`infra/postgres/migrations/${file}`),
  ]),
);

function evaluate(overrides = {}) {
  return evaluateMigrationCompatibility({
    manifest,
    manifestBytes,
    migrationFiles: actualFiles,
    appliedVersions: [],
    environment: "staging",
    ...overrides,
  });
}

function cloneManifest() {
  return structuredClone(manifest);
}

describe("migration compatibility policy", () => {
  it("allows an isolated staging database to bootstrap all manifested migrations", () => {
    const result = evaluate();
    assert.equal(result.accepted, true, JSON.stringify(result));
    assert.equal(result.stagingBootstrapAllowed, true);
    assert.deepEqual(
      result.pendingMigrations.map(({ version }) => version),
      [
        "0001_omdala_api_runtime",
        "0002_auth_session_state",
        "0003_protected_runtime_state",
      ],
    );
  });

  it("requires the bootstrap migration to be applied before production", () => {
    const result = evaluate({ environment: "production" });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "PRODUCTION_BOOTSTRAP_BASELINE_MISSING");
  });

  it("allows production to apply only pending expand-only migrations", () => {
    const result = evaluate({
      environment: "production",
      appliedVersions: ["0001_omdala_api_runtime"],
    });
    assert.equal(result.accepted, true, JSON.stringify(result));
    assert.equal(result.productionBaselineVerified, true);
    assert.deepEqual(
      result.pendingMigrations.map(({ mode }) => mode),
      ["expand-only", "expand-only"],
    );
    assert.equal(result.databaseSchemaRevertedByCodeRollback, false);
  });

  it("locks the first three migrations to their reviewed compatibility modes", () => {
    const changedManifest = cloneManifest();
    changedManifest.migrations[1].mode = "bootstrap-only";
    const result = evaluate({
      manifest: changedManifest,
      manifestBytes: Buffer.from(JSON.stringify(changedManifest)),
    });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "REQUIRED_MIGRATION_POLICY_MISMATCH");
  });

  it("rejects a migration whose bytes no longer match the manifest", () => {
    const files = new Map(actualFiles);
    files.set(
      "0002_auth_session_state.sql",
      Buffer.concat([
        files.get("0002_auth_session_state.sql"),
        Buffer.from("\n-- unreviewed mutation\n"),
      ]),
    );
    const result = evaluate({ migrationFiles: files });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "MIGRATION_SHA256_MISMATCH");
  });

  it("rejects a SQL file omitted from the manifest", () => {
    const files = new Map(actualFiles);
    files.set("0004_unmanifested.sql", Buffer.from("BEGIN; COMMIT;\n"));
    const result = evaluate({ migrationFiles: files });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "MIGRATION_FILE_SET_MISMATCH");
  });

  it("rejects destructive SQL even when its manifest hash is updated", () => {
    const destructive = Buffer.from(
      actualFiles
        .get("0002_auth_session_state.sql")
        .toString("utf8")
        .replace(
          "INSERT INTO omdala.schema_migrations",
          "DROP TABLE omdala.auth_sessions;\n\nINSERT INTO omdala.schema_migrations",
        ),
    );
    const files = new Map(actualFiles);
    files.set("0002_auth_session_state.sql", destructive);
    const changedManifest = cloneManifest();
    changedManifest.migrations[1].sha256 = createHash("sha256")
      .update(destructive)
      .digest("hex");
    const changedManifestBytes = Buffer.from(JSON.stringify(changedManifest));
    const result = evaluate({
      manifest: changedManifest,
      manifestBytes: changedManifestBytes,
      migrationFiles: files,
    });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "EXPAND_ONLY_DESTRUCTIVE_SQL");
  });

  it("does not accept a commented-out migration ledger write", () => {
    const original = actualFiles.get("0002_auth_session_state.sql").toString("utf8");
    const changed = Buffer.from(
      original.replace(
        /INSERT INTO omdala\.schema_migrations[\s\S]*?ON CONFLICT \(version\) DO NOTHING;/,
        `-- INSERT INTO omdala.schema_migrations (version)
-- VALUES ('0002_auth_session_state')
-- ON CONFLICT (version) DO NOTHING;`,
      ),
    );
    const files = new Map(actualFiles);
    files.set("0002_auth_session_state.sql", changed);
    const changedManifest = cloneManifest();
    changedManifest.migrations[1].sha256 = createHash("sha256")
      .update(changed)
      .digest("hex");
    const result = evaluate({
      manifest: changedManifest,
      manifestBytes: Buffer.from(JSON.stringify(changedManifest)),
      migrationFiles: files,
    });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "MIGRATION_LEDGER_WRITE_MISMATCH");
  });

  it("rejects unclassified procedural SQL in an expand-only migration", () => {
    const result = inspectExpandOnlySql(
      "BEGIN; DO $$ BEGIN EXECUTE 'DROP TABLE ignored'; END $$; COMMIT;",
    );
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "EXPAND_ONLY_UNCLASSIFIED_SQL");
  });

  it("requires one explicit transaction and a final idempotent ledger write", () => {
    const noTransaction = inspectExpandOnlySql(`
      CREATE TABLE IF NOT EXISTS omdala.unsafe_boundary (id TEXT PRIMARY KEY);
      INSERT INTO omdala.schema_migrations (version)
      VALUES ('0004_unsafe_boundary')
      ON CONFLICT (version) DO NOTHING;
    `);
    assert.equal(noTransaction.reason, "EXPAND_ONLY_TRANSACTION_BOUNDARY");

    const workAfterLedger = inspectExpandOnlySql(`
      BEGIN;
      INSERT INTO omdala.schema_migrations (version)
      VALUES ('0004_wrong_order')
      ON CONFLICT (version) DO NOTHING;
      CREATE TABLE IF NOT EXISTS omdala.wrong_order (id TEXT PRIMARY KEY);
      COMMIT;
    `);
    assert.equal(workAfterLedger.reason, "EXPAND_ONLY_LEDGER_ORDER");
  });

  it("does not treat destructive words in comments or values as SQL verbs", () => {
    const result = inspectExpandOnlySql(`
      BEGIN;
      -- DROP TABLE omdala.safe;
      CREATE TABLE IF NOT EXISTS omdala.safe_note (
        id TEXT PRIMARY KEY,
        note TEXT DEFAULT 'DROP TABLE is only data'
      );
      INSERT INTO omdala.schema_migrations (version)
      VALUES ('0004_safe_note')
      ON CONFLICT (version) DO NOTHING;
      COMMIT;
    `);
    assert.equal(result.accepted, true, JSON.stringify(result));
  });

  it("fails closed on unterminated quoted input", () => {
    assert.throws(
      () => sanitizeSqlForPolicy("CREATE TABLE x (value text DEFAULT 'open);"),
      /Unterminated SQL string literal/,
    );
  });

  it("rejects unknown or non-contiguous applied migration ledgers", () => {
    const unknown = evaluate({ appliedVersions: ["9999_unknown"] });
    assert.equal(unknown.reason, "UNMANIFESTED_APPLIED_MIGRATION");

    const gap = evaluate({
      appliedVersions: [
        "0001_omdala_api_runtime",
        "0003_protected_runtime_state",
      ],
    });
    assert.equal(gap.reason, "NON_CONTIGUOUS_APPLIED_LEDGER");
  });

  it("requires the post-apply ledger to contain every manifested migration", () => {
    const blocked = evaluate({
      appliedVersions: ["0001_omdala_api_runtime"],
      requireAllApplied: true,
    });
    assert.equal(blocked.reason, "MIGRATIONS_REMAIN_PENDING");

    const accepted = evaluate({
      appliedVersions: manifest.migrations.map(({ version }) => version),
      requireAllApplied: true,
    });
    assert.equal(accepted.accepted, true, JSON.stringify(accepted));
    assert.equal(accepted.allManifestMigrationsApplied, true);
  });
});

describe("migration workflow contract", () => {
  it("binds the source policy before apply and verifies the ledger after apply", () => {
    const source = readFileSync(".github/workflows/deploy.yml", "utf8");
    const result = evaluateMigrationWorkflowContract(source);
    assert.equal(result.accepted, true, JSON.stringify(result.checks));
  });

  it("rejects removal of the pre-apply compatibility gate", () => {
    const source = readFileSync(".github/workflows/deploy.yml", "utf8").replace(
      "Verify migration compatibility and code rollback boundary",
      "Compatibility gate omitted",
    );
    const result = evaluateMigrationWorkflowContract(source);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(({ id }) => id === "COMPATIBILITY_PRECEDES_APPLY")?.pass,
      false,
    );
  });

  it("rejects restoring the apply-all-files loop", () => {
    const source = `${readFileSync(".github/workflows/deploy.yml", "utf8")}
for migration in infra/postgres/migrations/*.sql; do true; done`;
    const result = evaluateMigrationWorkflowContract(source);
    assert.equal(result.accepted, false);
    assert.equal(
      result.checks.find(({ id }) => id === "ONLY_VERIFIED_PENDING_FILES_APPLIED")
        ?.pass,
      false,
    );
  });
});
