import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function normalizeDatabasePath(pathname) {
  const value = decodeURIComponent(pathname.replace(/^\/+/, ""));
  if (!value || value.includes("/")) {
    throw new Error("PostgreSQL URL must identify exactly one database");
  }
  return value;
}

export function describePostgresTarget(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid PostgreSQL URL");
  }
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol)) {
    throw new Error("Database URL must use postgres:// or postgresql://");
  }
  if (!parsed.hostname) throw new Error("PostgreSQL URL requires a hostname");

  return {
    host: parsed.hostname.toLowerCase(),
    port: parsed.port || "5432",
    database: normalizeDatabasePath(parsed.pathname),
    sslMode: parsed.searchParams.get("sslmode") ?? "unspecified",
  };
}

export function evaluatePostgresTargets({
  sourceUrl,
  restoreUrl,
  expectedSourceHost,
  expectedSourceDatabase,
}) {
  const source = describePostgresTarget(sourceUrl);
  const restore = describePostgresTarget(restoreUrl);
  const expectedHost = String(expectedSourceHost ?? "").trim().toLowerCase();
  const expectedDatabase = String(expectedSourceDatabase ?? "").trim();

  if (!expectedHost || source.host !== expectedHost) {
    return {
      accepted: false,
      reason: "SOURCE_HOST_MISMATCH",
      source,
      restore,
      expectedSourceHost: expectedHost,
      expectedSourceDatabase: expectedDatabase,
    };
  }
  if (!expectedDatabase || source.database !== expectedDatabase) {
    return {
      accepted: false,
      reason: "SOURCE_DATABASE_MISMATCH",
      source,
      restore,
      expectedSourceHost: expectedHost,
      expectedSourceDatabase: expectedDatabase,
    };
  }

  const sameTarget =
    source.host === restore.host &&
    source.port === restore.port &&
    source.database === restore.database;
  if (sameTarget) {
    return {
      accepted: false,
      reason: "RESTORE_TARGET_EQUALS_SOURCE",
      source,
      restore,
      expectedSourceHost: expectedHost,
      expectedSourceDatabase: expectedDatabase,
    };
  }

  return {
    accepted: true,
    reason: "SOURCE_AND_RESTORE_TARGETS_VERIFIED",
    source,
    restore,
    expectedSourceHost: expectedHost,
    expectedSourceDatabase: expectedDatabase,
  };
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const result = evaluatePostgresTargets({
    sourceUrl: option("--source-url") ?? process.env.SOURCE_DATABASE_URL,
    restoreUrl: option("--restore-url") ?? process.env.RESTORE_DATABASE_URL,
    expectedSourceHost:
      option("--expected-source-host") ?? process.env.EXPECTED_SOURCE_DATABASE_HOST,
    expectedSourceDatabase:
      option("--expected-source-database") ??
      process.env.EXPECTED_SOURCE_DATABASE_NAME,
  });
  const receipt = {
    schemaVersion: 1,
    verdict: result.accepted ? "DATABASE_TARGETS_ACCEPTED" : "DATABASE_TARGETS_BLOCKED",
    checkedAt: new Date().toISOString(),
    ...result,
  };
  const receiptPath = option("--receipt");
  if (receiptPath) {
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
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
