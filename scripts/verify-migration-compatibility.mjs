import { createHash } from "node:crypto";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SHA256 = /^[0-9a-f]{64}$/;
const VERSION = /^\d{4}_[a-z0-9_]+$/;
const MODES = new Set(["bootstrap-only", "expand-only"]);
const ROLLBACK_SCOPE =
  "code_and_worker_only_database_schema_is_not_reverted";
const REQUIRED_MIGRATIONS = Object.freeze([
  ["0001_omdala_api_runtime", "bootstrap-only"],
  ["0002_auth_session_state", "expand-only"],
  ["0003_protected_runtime_state", "expand-only"],
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fail(reason, detail) {
  return { accepted: false, reason, detail };
}

/**
 * Remove comments and quoted values while retaining statement structure. This
 * scanner understands nested block comments and PostgreSQL dollar quoting, so
 * destructive words hidden in comments or data are not treated as SQL verbs.
 */
export function sanitizeSqlForPolicy(sql) {
  let output = "";
  let index = 0;
  let state = "normal";
  let blockDepth = 0;
  let dollarTag = "";

  const blank = (character) => (character === "\n" ? "\n" : " ");
  while (index < sql.length) {
    const current = sql[index];
    const next = sql[index + 1];

    if (state === "line-comment") {
      output += blank(current);
      index += 1;
      if (current === "\n") state = "normal";
      continue;
    }
    if (state === "block-comment") {
      if (current === "/" && next === "*") {
        output += "  ";
        index += 2;
        blockDepth += 1;
      } else if (current === "*" && next === "/") {
        output += "  ";
        index += 2;
        blockDepth -= 1;
        if (blockDepth === 0) state = "normal";
      } else {
        output += blank(current);
        index += 1;
      }
      continue;
    }
    if (state === "single-quote") {
      output += blank(current);
      index += 1;
      if (current === "'" && sql[index] === "'") {
        output += " ";
        index += 1;
      } else if (current === "'") {
        state = "normal";
      }
      continue;
    }
    if (state === "double-quote") {
      output += blank(current);
      index += 1;
      if (current === '"' && sql[index] === '"') {
        output += " ";
        index += 1;
      } else if (current === '"') {
        state = "normal";
      }
      continue;
    }
    if (state === "dollar-quote") {
      if (sql.startsWith(dollarTag, index)) {
        output += " ".repeat(dollarTag.length);
        index += dollarTag.length;
        state = "normal";
      } else {
        output += blank(current);
        index += 1;
      }
      continue;
    }

    if (current === "-" && next === "-") {
      output += "  ";
      index += 2;
      state = "line-comment";
      continue;
    }
    if (current === "/" && next === "*") {
      output += "  ";
      index += 2;
      state = "block-comment";
      blockDepth = 1;
      continue;
    }
    if (current === "'") {
      output += " ";
      index += 1;
      state = "single-quote";
      continue;
    }
    if (current === '"') {
      output += " ";
      index += 1;
      state = "double-quote";
      continue;
    }
    if (current === "$") {
      const match = sql.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (match) {
        dollarTag = match[0];
        output += " ".repeat(dollarTag.length);
        index += dollarTag.length;
        state = "dollar-quote";
        continue;
      }
    }

    output += current;
    index += 1;
  }

  if (state === "block-comment") throw new Error("Unterminated SQL block comment");
  if (state === "single-quote") throw new Error("Unterminated SQL string literal");
  if (state === "double-quote") throw new Error("Unterminated quoted identifier");
  if (state === "dollar-quote") throw new Error("Unterminated dollar-quoted block");
  return output;
}

function statementTokens(statement) {
  return (
    statement.toUpperCase().match(/[A-Z_][A-Z0-9_$]*|[().,]/g) ?? []
  );
}

function startsWith(tokens, expected) {
  return expected.every((token, index) => tokens[index] === token);
}

export function inspectExpandOnlySql(sql) {
  let sanitized;
  try {
    sanitized = sanitizeSqlForPolicy(sql);
  } catch (error) {
    return fail("SQL_PARSE_FAILED", error instanceof Error ? error.message : String(error));
  }

  const statements = sanitized
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  if (statements.length === 0) return fail("EMPTY_MIGRATION", "No SQL statements");
  const tokenized = statements.map(statementTokens);
  if (
    tokenized[0]?.length !== 1 ||
    tokenized[0]?.[0] !== "BEGIN" ||
    tokenized.at(-1)?.length !== 1 ||
    tokenized.at(-1)?.[0] !== "COMMIT" ||
    tokenized.filter((tokens) => tokens.length === 1 && tokens[0] === "BEGIN")
      .length !== 1 ||
    tokenized.filter((tokens) => tokens.length === 1 && tokens[0] === "COMMIT")
      .length !== 1
  ) {
    return fail(
      "EXPAND_ONLY_TRANSACTION_BOUNDARY",
      "migration must have exactly one outer BEGIN and one final COMMIT",
    );
  }

  let ledgerInsertIndex = -1;
  for (const [statementIndex, statement] of statements.entries()) {
    const tokens = tokenized[statementIndex];
    const normalized = tokens.join(" ");
    const destructive = [
      /\bDROP\b/,
      /\bTRUNCATE\b/,
      /\bDELETE\s+FROM\b/,
      /\bUPDATE\b/,
      /\bMERGE\b/,
      /\bCREATE\s+OR\s+REPLACE\b/,
      /\bALTER\s+COLUMN\b/,
      /\bDROP\s+COLUMN\b/,
      /\bRENAME\b/,
      /\bADD\s+CONSTRAINT\b/,
      /\bVALIDATE\s+CONSTRAINT\b/,
      /\bREVOKE\b/,
      /\bCALL\b/,
      /\bEXECUTE\b/,
      /\bCOPY\b/,
      /\bLOCK\b/,
    ].find((pattern) => pattern.test(normalized));
    if (destructive) {
      return fail("EXPAND_ONLY_DESTRUCTIVE_SQL", normalized);
    }

    const transaction =
      (tokens.length === 1 && startsWith(tokens, ["BEGIN"])) ||
      (tokens.length === 1 && startsWith(tokens, ["COMMIT"]));
    const createSchema = startsWith(tokens, [
      "CREATE",
      "SCHEMA",
      "IF",
      "NOT",
      "EXISTS",
    ]);
    const createTable = startsWith(tokens, [
      "CREATE",
      "TABLE",
      "IF",
      "NOT",
      "EXISTS",
    ]);
    const createIndex =
      startsWith(tokens, ["CREATE", "INDEX", "IF", "NOT", "EXISTS"]) ||
      startsWith(tokens, [
        "CREATE",
        "UNIQUE",
        "INDEX",
        "IF",
        "NOT",
        "EXISTS",
      ]);
    const addNullableColumn =
      startsWith(tokens, ["ALTER", "TABLE"]) &&
      normalized.includes(" ADD COLUMN IF NOT EXISTS ") &&
      !/\b(NOT\s+NULL|DEFAULT|PRIMARY|UNIQUE|REFERENCES|CHECK)\b/.test(
        normalized,
      );
    const ledgerInsert =
      startsWith(tokens, ["INSERT", "INTO", "OMDALA", ".", "SCHEMA_MIGRATIONS"]) &&
      normalized.includes(" ON CONFLICT ( VERSION ) DO NOTHING");
    if (ledgerInsert) {
      if (ledgerInsertIndex >= 0) {
        return fail("EXPAND_ONLY_LEDGER_ORDER", "multiple ledger writes");
      }
      ledgerInsertIndex = statementIndex;
    }

    if (
      !transaction &&
      !createSchema &&
      !createTable &&
      !createIndex &&
      !addNullableColumn &&
      !ledgerInsert
    ) {
      return fail("EXPAND_ONLY_UNCLASSIFIED_SQL", normalized);
    }
  }

  if (ledgerInsertIndex !== statements.length - 2) {
    return fail(
      "EXPAND_ONLY_LEDGER_ORDER",
      "the single schema_migrations write must immediately precede COMMIT",
    );
  }

  return { accepted: true, reason: "EXPAND_ONLY_SQL_ACCEPTED" };
}

function migrationLedgerVersion(sql) {
  let withoutComments = "";
  let index = 0;
  let state = "normal";
  let blockDepth = 0;
  while (index < sql.length) {
    const current = sql[index];
    const next = sql[index + 1];
    if (state === "line-comment") {
      withoutComments += current === "\n" ? "\n" : " ";
      index += 1;
      if (current === "\n") state = "normal";
      continue;
    }
    if (state === "block-comment") {
      if (current === "/" && next === "*") {
        withoutComments += "  ";
        index += 2;
        blockDepth += 1;
      } else if (current === "*" && next === "/") {
        withoutComments += "  ";
        index += 2;
        blockDepth -= 1;
        if (blockDepth === 0) state = "normal";
      } else {
        withoutComments += current === "\n" ? "\n" : " ";
        index += 1;
      }
      continue;
    }
    if (state === "single-quote") {
      withoutComments += current;
      index += 1;
      if (current === "'" && sql[index] === "'") {
        withoutComments += sql[index];
        index += 1;
      } else if (current === "'") {
        state = "normal";
      }
      continue;
    }
    if (state === "double-quote") {
      withoutComments += current;
      index += 1;
      if (current === '"' && sql[index] === '"') {
        withoutComments += sql[index];
        index += 1;
      } else if (current === '"') {
        state = "normal";
      }
      continue;
    }
    if (current === "-" && next === "-") {
      withoutComments += "  ";
      index += 2;
      state = "line-comment";
    } else if (current === "/" && next === "*") {
      withoutComments += "  ";
      index += 2;
      state = "block-comment";
      blockDepth = 1;
    } else {
      withoutComments += current;
      index += 1;
      if (current === "'") state = "single-quote";
      else if (current === '"') state = "double-quote";
    }
  }
  const matches = [
    ...withoutComments.matchAll(
      /INSERT\s+INTO\s+omdala\.schema_migrations\s*\(\s*version\s*\)\s*VALUES\s*\(\s*'([^']+)'\s*\)\s*ON\s+CONFLICT\s*\(\s*version\s*\)\s*DO\s+NOTHING\s*;/gi,
    ),
  ];
  return matches.length === 1 ? matches[0][1] : null;
}

export function evaluateMigrationWorkflowContract(source) {
  const gateName = "Verify migration compatibility and code rollback boundary";
  const applyName = "Apply migrations in lexical order from compatibility receipt";
  const gateIndex = source.indexOf(gateName);
  const applyIndex = source.indexOf(applyName);
  const verifierCalls =
    source.match(/node scripts\/verify-migration-compatibility\.mjs/g)?.length ?? 0;
  const checks = [
    { id: "COMPATIBILITY_PRECEDES_APPLY", pass: gateIndex >= 0 && applyIndex > gateIndex },
    { id: "PRE_AND_POST_LEDGER_VERIFIED", pass: verifierCalls === 2 && source.includes("--require-all-applied") },
    { id: "ONLY_VERIFIED_PENDING_FILES_APPLIED", pass: source.includes(".pendingMigrations[].file") && !source.includes("for migration in infra/postgres/migrations/*.sql") },
    { id: "COMPATIBILITY_RECEIPT_EXPORTED", pass: source.includes("migration_compatibility_receipt_sha256") && source.includes("migration_manifest_sha256") && source.includes("migration_ledger_receipt_sha256") },
    { id: "ROLLBACK_SCOPE_EXPLICIT", pass: source.includes("code_and_worker_only_database_schema_is_not_reverted") && source.includes("database_schema_reverted_by_code_rollback: false") },
  ];
  return {
    accepted: checks.every((check) => check.pass),
    checks,
  };
}

export function evaluateMigrationCompatibility({
  manifest,
  manifestBytes,
  migrationFiles,
  appliedVersions,
  environment,
  requireAllApplied = false,
}) {
  if (!manifest || manifest.schema_version !== 1) {
    return fail("INVALID_MANIFEST_SCHEMA", "schema_version must equal 1");
  }
  if (manifest.policy_id !== "omdala-code-rollback-compatible-v1") {
    return fail("INVALID_POLICY_ID", String(manifest.policy_id ?? ""));
  }
  if (manifest.migration_directory !== "infra/postgres/migrations") {
    return fail("INVALID_MIGRATION_DIRECTORY", String(manifest.migration_directory ?? ""));
  }
  if (manifest.rollback_scope !== ROLLBACK_SCOPE) {
    return fail("INVALID_ROLLBACK_SCOPE", String(manifest.rollback_scope ?? ""));
  }
  if (!Array.isArray(manifest.migrations) || manifest.migrations.length === 0) {
    return fail("EMPTY_MIGRATION_MANIFEST", "migrations must be a non-empty array");
  }
  if (!Array.isArray(manifest.production_baseline_required)) {
    return fail("INVALID_PRODUCTION_BASELINE", "production_baseline_required must be an array");
  }
  if (environment !== "staging" && environment !== "production") {
    return fail("INVALID_RELEASE_ENVIRONMENT", String(environment ?? ""));
  }
  if (!Array.isArray(appliedVersions)) {
    return fail("INVALID_APPLIED_LEDGER", "applied migration ledger must be an array");
  }

  const entries = manifest.migrations;
  for (const [index, [version, mode]] of REQUIRED_MIGRATIONS.entries()) {
    if (entries[index]?.version !== version || entries[index]?.mode !== mode) {
      return fail(
        "REQUIRED_MIGRATION_POLICY_MISMATCH",
        `${version} must be ${mode}`,
      );
    }
  }
  const manifestFiles = entries.map((entry) => entry.file);
  const actualFiles = [...migrationFiles.keys()].sort();
  if (JSON.stringify([...manifestFiles].sort()) !== JSON.stringify(actualFiles)) {
    return fail(
      "MIGRATION_FILE_SET_MISMATCH",
      `manifest=${[...manifestFiles].sort().join(",")} actual=${actualFiles.join(",")}`,
    );
  }
  if (
    new Set(manifestFiles).size !== entries.length ||
    new Set(entries.map((entry) => entry.version)).size !== entries.length
  ) {
    return fail("DUPLICATE_MIGRATION_ENTRY", "file and version values must be unique");
  }

  for (const [index, entry] of entries.entries()) {
    if (!VERSION.test(entry.version ?? "")) {
      return fail("INVALID_MIGRATION_VERSION", String(entry.version ?? ""));
    }
    if (entry.file !== `${entry.version}.sql` || basename(entry.file) !== entry.file) {
      return fail("INVALID_MIGRATION_FILENAME", String(entry.file ?? ""));
    }
    if (!SHA256.test(entry.sha256 ?? "")) {
      return fail("INVALID_MIGRATION_SHA256", String(entry.sha256 ?? ""));
    }
    if (!MODES.has(entry.mode)) {
      return fail("INVALID_MIGRATION_MODE", String(entry.mode ?? ""));
    }
    if (index > 0 && entries[index - 1].file.localeCompare(entry.file) >= 0) {
      return fail("MIGRATIONS_NOT_LEXICALLY_ORDERED", entry.file);
    }
    const sqlBytes = migrationFiles.get(entry.file);
    const sql = Buffer.isBuffer(sqlBytes)
      ? sqlBytes.toString("utf8")
      : String(sqlBytes ?? "");
    if (sha256(sqlBytes) !== entry.sha256) {
      return fail("MIGRATION_SHA256_MISMATCH", entry.file);
    }
    if (migrationLedgerVersion(sql) !== entry.version) {
      return fail("MIGRATION_LEDGER_WRITE_MISMATCH", entry.file);
    }
    if (entry.mode === "expand-only") {
      const inspection = inspectExpandOnlySql(sql);
      if (!inspection.accepted) {
        return fail(inspection.reason, `${entry.file}: ${inspection.detail ?? ""}`);
      }
    }
  }

  const expectedBaseline = ["0001_omdala_api_runtime"];
  if (
    JSON.stringify(manifest.production_baseline_required) !==
    JSON.stringify(expectedBaseline)
  ) {
    return fail("INVALID_PRODUCTION_BASELINE", "0001 must be the exact production baseline");
  }
  const entryByVersion = new Map(entries.map((entry) => [entry.version, entry]));
  const applied = [...new Set(appliedVersions)];
  if (
    applied.length !== appliedVersions.length ||
    applied.some((version) => typeof version !== "string" || !VERSION.test(version))
  ) {
    return fail("INVALID_APPLIED_LEDGER", "versions must be unique canonical strings");
  }
  const unknownApplied = applied.filter((version) => !entryByVersion.has(version));
  if (unknownApplied.length > 0) {
    return fail("UNMANIFESTED_APPLIED_MIGRATION", unknownApplied.join(","));
  }
  const appliedSet = new Set(applied);
  let pendingSeen = false;
  for (const entry of entries) {
    if (!appliedSet.has(entry.version)) pendingSeen = true;
    else if (pendingSeen) return fail("NON_CONTIGUOUS_APPLIED_LEDGER", entry.version);
  }

  const pending = entries.filter((entry) => !appliedSet.has(entry.version));
  const baselineVerified = manifest.production_baseline_required.every((version) =>
    appliedSet.has(version),
  );
  if (environment === "production" && !baselineVerified) {
    return fail("PRODUCTION_BOOTSTRAP_BASELINE_MISSING", expectedBaseline[0]);
  }
  if (
    environment === "production" &&
    pending.some((entry) => entry.mode !== "expand-only")
  ) {
    return fail(
      "PRODUCTION_PENDING_MIGRATION_NOT_EXPAND_ONLY",
      pending.map((entry) => `${entry.version}:${entry.mode}`).join(","),
    );
  }
  if (requireAllApplied && pending.length > 0) {
    return fail("MIGRATIONS_REMAIN_PENDING", pending.map((entry) => entry.version).join(","));
  }

  return {
    accepted: true,
    reason: "MIGRATION_COMPATIBILITY_ACCEPTED",
    environment,
    policyId: manifest.policy_id,
    manifestSha256: sha256(manifestBytes),
    rollbackScope: ROLLBACK_SCOPE,
    databaseSchemaRevertedByCodeRollback: false,
    productionBaselineVerified: environment === "production" ? baselineVerified : null,
    stagingBootstrapAllowed: environment === "staging",
    allManifestMigrationsApplied: pending.length === 0,
    appliedMigrations: entries
      .filter((entry) => appliedSet.has(entry.version))
      .map(({ version, file, sha256: digest, mode }) => ({
        version,
        file,
        sha256: digest,
        mode,
      })),
    pendingMigrations: pending.map(({ version, file, sha256: digest, mode }) => ({
      version,
      file,
      sha256: digest,
      mode,
    })),
  };
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const manifestPath = resolve(
    option("--manifest") ?? "infra/postgres/migrations/compatibility.json",
  );
  const migrationsDirectory = resolve(
    option("--migrations-dir") ?? "infra/postgres/migrations",
  );
  const appliedPath = option("--applied-json");
  const environment = option("--environment") ?? process.env.RELEASE_ENVIRONMENT;
  const candidateSha = option("--candidate-sha");
  if (!appliedPath) throw new Error("--applied-json is required");
  if (candidateSha && !/^[0-9a-f]{40}$/.test(candidateSha)) {
    throw new Error("--candidate-sha must be an exact 40-character lowercase SHA");
  }

  const manifestBytes = readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const migrationFiles = new Map(
    readdirSync(migrationsDirectory)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => [file, readFileSync(resolve(migrationsDirectory, file))]),
  );
  const appliedVersions = JSON.parse(readFileSync(appliedPath, "utf8"));
  const result = evaluateMigrationCompatibility({
    manifest,
    manifestBytes,
    migrationFiles,
    appliedVersions,
    environment,
    requireAllApplied: process.argv.includes("--require-all-applied"),
  });
  const receipt = {
    schema_version: 1,
    verdict: result.accepted
      ? "MIGRATION_COMPATIBILITY_ACCEPTED"
      : "MIGRATION_COMPATIBILITY_BLOCKED",
    candidate_sha: candidateSha ?? null,
    checked_at: new Date().toISOString(),
    ...result,
  };
  const receiptPath = option("--receipt");
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  if (result.accepted && process.env.GITHUB_OUTPUT && receiptPath) {
    const receiptDigest = sha256(readFileSync(receiptPath));
    writeFileSync(
      process.env.GITHUB_OUTPUT,
      `receipt_sha256=${receiptDigest}\nmanifest_sha256=${result.manifestSha256}\n`,
      { flag: "a" },
    );
  }
  if (!result.accepted) process.exitCode = 2;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
