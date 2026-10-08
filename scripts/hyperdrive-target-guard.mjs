import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const HYPERDRIVE_ID = /^[a-f0-9]{32}$/;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizedTarget(value) {
  return {
    id: String(value?.id ?? "").trim(),
    name: String(value?.name ?? "").trim(),
    host: String(value?.origin?.host ?? "").trim().toLowerCase(),
    port: String(value?.origin?.port ?? ""),
    database: String(value?.origin?.database ?? "").trim(),
    user: String(value?.origin?.user ?? "").trim(),
    scheme: String(value?.origin?.scheme ?? "").trim().toLowerCase(),
  };
}

function normalizedPolicy(value) {
  return {
    id: String(value?.hyperdrive_id ?? "").trim(),
    name: String(value?.hyperdrive_name ?? "").trim(),
    host: String(value?.postgres_host ?? "").trim().toLowerCase(),
    port: String(value?.postgres_port ?? ""),
    database: String(value?.postgres_database ?? "").trim(),
    user: String(value?.postgres_user ?? "").trim(),
  };
}

function sameDatabase(left, right) {
  return (
    left.host === right.host &&
    left.port === right.port &&
    left.database === right.database &&
    left.user === right.user
  );
}

export function evaluateHyperdriveTarget({
  environment,
  expectedId,
  expectedHost,
  expectedDatabase,
  expectedAccountId,
  providerConfig,
  productionAuthority,
  authoritySha256,
}) {
  const selected = normalizedTarget(providerConfig);
  const releaseEnvironment = String(environment ?? "").trim();
  const production = normalizedPolicy(productionAuthority?.environments?.production);
  const environmentPolicy = normalizedPolicy(
    productionAuthority?.environments?.[releaseEnvironment],
  );
  const authorityAccountId = String(
    productionAuthority?.cloudflare_account_id ?? "",
  ).trim();
  const expected = {
    id: String(expectedId ?? "").trim(),
    host: String(expectedHost ?? "").trim().toLowerCase(),
    database: String(expectedDatabase ?? "").trim(),
  };

  if (releaseEnvironment !== "staging" && releaseEnvironment !== "production") {
    return { accepted: false, reason: "INVALID_RELEASE_ENVIRONMENT" };
  }
  if (
    productionAuthority?.schema_version !== 1 ||
    !HYPERDRIVE_ID.test(authorityAccountId) ||
    authorityAccountId !== String(expectedAccountId ?? "").trim() ||
    !HYPERDRIVE_ID.test(production.id) ||
    !production.name ||
    !production.host ||
    !/^\d+$/.test(production.port) ||
    !production.database ||
    !production.user ||
    !environmentPolicy.name ||
    !environmentPolicy.host ||
    !/^\d+$/.test(environmentPolicy.port) ||
    !environmentPolicy.database ||
    !environmentPolicy.user
  ) {
    return { accepted: false, reason: "INVALID_PRODUCTION_AUTHORITY" };
  }
  if (
    !HYPERDRIVE_ID.test(selected.id) ||
    !selected.name ||
    !selected.host ||
    !/^\d+$/.test(selected.port) ||
    !selected.database ||
    !selected.user ||
    selected.scheme !== "postgresql"
  ) {
    return { accepted: false, reason: "INVALID_PROVIDER_CONFIG", selected };
  }
  if (
    selected.id !== expected.id ||
    selected.host !== expected.host ||
    selected.database !== expected.database
  ) {
    return {
      accepted: false,
      reason: "PROTECTED_EXPECTATION_MISMATCH",
      environment: releaseEnvironment,
      selected,
      expected,
    };
  }

  const selectedIsProduction =
    selected.id === production.id &&
    selected.name === production.name &&
    sameDatabase(selected, production);
  if (releaseEnvironment === "production" && !selectedIsProduction) {
    return {
      accepted: false,
      reason: "PRODUCTION_HYPERDRIVE_AUTHORITY_MISMATCH",
      environment: releaseEnvironment,
      selected,
      production,
    };
  }
  const selectedMatchesEnvironmentPolicy =
    selected.name === environmentPolicy.name &&
    sameDatabase(selected, environmentPolicy);
  if (!selectedMatchesEnvironmentPolicy) {
    return {
      accepted: false,
      reason: "HYPERDRIVE_ENVIRONMENT_AUTHORITY_MISMATCH",
      environment: releaseEnvironment,
      selected,
      environmentPolicy,
    };
  }
  if (
    releaseEnvironment === "staging" &&
    (selected.id === production.id ||
      sameDatabase(selected, production))
  ) {
    return {
      accepted: false,
      reason: "STAGING_HYPERDRIVE_NOT_ISOLATED",
      environment: releaseEnvironment,
      selected,
      production,
    };
  }

  return {
    accepted: true,
    reason: "HYPERDRIVE_TARGET_VERIFIED",
    environment: releaseEnvironment,
    selected,
    productionHyperdriveId: production.id,
    productionTargetMatch: sameDatabase(selected, production),
    isolatedFromProduction: releaseEnvironment === "staging" ? true : null,
    authoritySha256,
    originFingerprintSha256: sha256(
      `${selected.scheme}\n${selected.host}\n${selected.port}\n${selected.database}\n${selected.user}\n`,
    ),
  };
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const providerPath = option("--provider-json");
  const authorityPath = option("--production-authority");
  const receiptPath = option("--receipt");
  if (!providerPath || !authorityPath || !receiptPath) {
    throw new Error("--provider-json, --production-authority, and --receipt are required");
  }
  const providerConfig = JSON.parse(readFileSync(providerPath, "utf8"));
  const authorityBytes = readFileSync(authorityPath);
  const productionAuthority = JSON.parse(authorityBytes.toString("utf8"));
  const result = evaluateHyperdriveTarget({
    environment: option("--environment") ?? process.env.RELEASE_ENVIRONMENT,
    expectedId: option("--hyperdrive-id") ?? process.env.OMDALA_HYPERDRIVE_ID,
    expectedHost:
      option("--expected-host") ?? process.env.OMDALA_DATABASE_EXPECTED_HOST,
    expectedDatabase:
      option("--expected-database") ?? process.env.OMDALA_DATABASE_EXPECTED_NAME,
    expectedAccountId:
      option("--account-id") ?? process.env.CLOUDFLARE_ACCOUNT_ID,
    providerConfig,
    productionAuthority,
    authoritySha256: sha256(authorityBytes),
  });
  const receipt = {
    schema_version: 1,
    verdict: result.accepted
      ? "HYPERDRIVE_TARGET_ACCEPTED"
      : "HYPERDRIVE_TARGET_BLOCKED",
    checked_at: new Date().toISOString(),
    ...result,
  };
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
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
