import { readFileSync, writeFileSync } from "node:fs";
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
    user: decodeURIComponent(parsed.username),
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
  environment,
  productionAuthority,
}) {
  const source = describePostgresTarget(sourceUrl);
  const restore = describePostgresTarget(restoreUrl);
  const expectedHost = String(expectedSourceHost ?? "").trim().toLowerCase();
  const expectedDatabase = String(expectedSourceDatabase ?? "").trim();
  const releaseEnvironment = String(environment ?? "").trim();
  if (releaseEnvironment !== "staging" && releaseEnvironment !== "production") {
    return {
      accepted: false,
      reason: "INVALID_RELEASE_ENVIRONMENT",
      source,
      restore,
      environment: releaseEnvironment,
    };
  }

  const normalizePolicy = (value) => ({
    user: String(value?.postgres_user ?? "").trim(),
    host: String(value?.postgres_host ?? "").trim().toLowerCase(),
    port: String(value?.postgres_port ?? ""),
    database: String(value?.postgres_database ?? "").trim(),
  });
  const production = normalizePolicy(productionAuthority?.environments?.production);
  const environmentPolicy = normalizePolicy(
    productionAuthority?.environments?.[releaseEnvironment],
  );
  if (
    productionAuthority?.schema_version !== 1 ||
    !/^[a-f0-9]{32}$/.test(productionAuthority?.cloudflare_account_id ?? "") ||
    !production.user ||
    !production.host ||
    !/^\d+$/.test(production.port) ||
    !production.database ||
    !environmentPolicy.user ||
    !environmentPolicy.host ||
    !/^\d+$/.test(environmentPolicy.port) ||
    !environmentPolicy.database
  ) {
    return {
      accepted: false,
      reason: "INVALID_PRODUCTION_AUTHORITY",
      source,
      restore,
      environment: releaseEnvironment,
    };
  }
  const sourceIsProduction =
    source.user === production.user &&
    source.host === production.host &&
    source.port === production.port &&
    source.database === production.database;
  if (releaseEnvironment === "staging" && sourceIsProduction) {
    return {
      accepted: false,
      reason: "STAGING_SOURCE_EQUALS_PRODUCTION",
      source,
      restore,
      environment: releaseEnvironment,
      production,
    };
  }
  if (releaseEnvironment === "production" && !sourceIsProduction) {
    return {
      accepted: false,
      reason: "PRODUCTION_SOURCE_AUTHORITY_MISMATCH",
      source,
      restore,
      environment: releaseEnvironment,
      production,
    };
  }
  const sourceMatchesEnvironmentPolicy =
    source.user === environmentPolicy.user &&
    source.host === environmentPolicy.host &&
    source.port === environmentPolicy.port &&
    source.database === environmentPolicy.database;
  if (!sourceMatchesEnvironmentPolicy) {
    return {
      accepted: false,
      reason: "SOURCE_ENVIRONMENT_AUTHORITY_MISMATCH",
      source,
      restore,
      environment: releaseEnvironment,
      environmentPolicy,
      production,
    };
  }

  if (!expectedHost || source.host !== expectedHost) {
    return {
      accepted: false,
      reason: "SOURCE_HOST_MISMATCH",
      source,
      restore,
      expectedSourceHost: expectedHost,
      expectedSourceDatabase: expectedDatabase,
      environment: releaseEnvironment,
      production,
      environmentPolicy,
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
      environment: releaseEnvironment,
      production,
      environmentPolicy,
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
      environment: releaseEnvironment,
      production,
      environmentPolicy,
    };
  }

  return {
    accepted: true,
    reason: "SOURCE_AND_RESTORE_TARGETS_VERIFIED",
    source,
    restore,
    expectedSourceHost: expectedHost,
    expectedSourceDatabase: expectedDatabase,
    environment: releaseEnvironment,
    production,
    environmentPolicy,
    productionTargetMatch: sourceIsProduction,
  };
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const authorityPath = option("--production-authority");
  if (!authorityPath) throw new Error("--production-authority is required");
  const productionAuthority = JSON.parse(readFileSync(authorityPath, "utf8"));
  const result = evaluatePostgresTargets({
    sourceUrl: option("--source-url") ?? process.env.SOURCE_DATABASE_URL,
    restoreUrl: option("--restore-url") ?? process.env.RESTORE_DATABASE_URL,
    expectedSourceHost:
      option("--expected-source-host") ?? process.env.EXPECTED_SOURCE_DATABASE_HOST,
    expectedSourceDatabase:
      option("--expected-source-database") ??
      process.env.EXPECTED_SOURCE_DATABASE_NAME,
    environment: option("--environment") ?? process.env.RELEASE_ENVIRONMENT,
    productionAuthority,
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
