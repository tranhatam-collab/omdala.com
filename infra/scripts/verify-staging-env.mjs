import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const infraDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const composeFiles = ["docker-compose.yml", "docker-compose.staging.yml"];

export function parseEnvFile(content) {
  const values = new Map();
  const errors = [];
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) {
      errors.push(`invalid env syntax at line ${index + 1}`);
      continue;
    }
    const [, key, rawValue] = match;
    if (values.has(key)) {
      errors.push(`duplicate ${key}`);
      continue;
    }
    const value = rawValue.trim();
    values.set(key, value.length >= 2 && value[0] === value.at(-1) && ["'", '"'].includes(value[0])
      ? value.slice(1, -1)
      : value);
  }
  return { values, errors };
}

export function validateStagingEnv(content, shellEnv = process.env, composeContent = "") {
  const { values, errors } = parseEnvFile(content);
  const exactTargets = new Map([
    ["INFRA_DOMAIN", "staging.infra.omdala.com"],
    ["POSTGRES_DB", "omdala_staging"],
    ["POSTGRES_APP_USER", "omdala_app"],
    ["POSTGRES_BACKUP_USER", "omdala_backup"],
    ["R2_BUCKET_BACKUPS", "omdala-staging-backups"],
    ["WALG_S3_PREFIX", "s3://omdala-staging-backups/postgres"],
    ["API_JWT_PUBLIC_KEY_URL", "https://auth.staging.infra.omdala.com/realms/OMDALA/protocol/openid-connect/certs"],
    ["AIAGENT_ENVIRONMENT", "staging"],
  ]);
  const requireExact = (key, expected) => {
    if (values.get(key) !== expected) errors.push(`${key} must identify the isolated staging target`);
  };
  const requireValue = (key) => {
    const value = values.get(key);
    if (!value || value === "staging_password_change_me" || value.includes("<") || value.includes(">")) {
      errors.push(`${key} must be configured outside the template`);
    }
  };

  for (const [key, expected] of exactTargets) requireExact(key, expected);

  const composeVariables = new Set([...composeContent.matchAll(/\$\{([A-Z][A-Z0-9_]*)/g)].map((match) => match[1]));
  const optionalComposeVariables = new Set([
    "B2_APPLICATION_KEY_ID", "B2_APPLICATION_KEY", "B2_BUCKET",
    "MINIO_ROOT_USER", "MINIO_ROOT_PASSWORD",
  ]);
  const requiredValues = new Set([
    "POSTGRES_PASSWORD", "POSTGRES_APP_PASSWORD", "POSTGRES_READONLY_PASSWORD",
    "POSTGRES_MIGRATION_PASSWORD", "POSTGRES_BACKUP_PASSWORD", "POSTGRES_MCP_PASSWORD",
    "KEYCLOAK_ADMIN_PASSWORD", "VALKEY_PASSWORD", "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT", "EMAIL_API_URL", "EMAIL_API_KEY",
    "EMAIL_FROM", "AIAGENT_API_KEY", "AIAGENT_EXPECTED_PROVIDER_SHA",
    "AIAGENT_EXPECTED_PROVIDER_VERSION_ID", "AIAGENT_EXPECTED_PROVIDER_BUNDLE_SHA256",
    "AIAGENT_EXPECTED_LEDGER_SHA", "AIAGENT_EXPECTED_LEDGER_VERSION_ID",
    "AIAGENT_EXPECTED_LEDGER_BUNDLE_SHA256", "AIAGENT_EXPECTED_LEDGER_MIGRATION_SHA256",
    "AIAGENT_RECEIPT_PUBLIC_KEYS", "ALERT_WEBHOOK_URL",
  ]);
  for (const key of composeVariables) {
    if (!optionalComposeVariables.has(key) && !exactTargets.has(key)) requiredValues.add(key);
  }
  for (const key of requiredValues) requireValue(key);

  for (const key of ["R2_ENDPOINT", "EMAIL_API_URL", "ALERT_WEBHOOK_URL"]) {
    const value = values.get(key);
    if (value && !value.includes("<") && !value.includes(">")) {
      try {
        if (new URL(value).protocol !== "https:") errors.push(`${key} must use HTTPS`);
      } catch {
        errors.push(`${key} must be a valid HTTPS URL`);
      }
    }
  }
  for (const key of ["EMAIL_FROM", "EMAIL_STAGING_SINK_ADDRESS"]) {
    const value = values.get(key);
    if (value && !value.includes("<") && !value.includes(">") &&
      !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(value)) {
      errors.push(`${key} must be a single email address`);
    }
  }

  if (shellEnv.COMPOSE_PROFILES?.trim()) {
    errors.push("COMPOSE_PROFILES must be empty for staging");
  }
  for (const key of composeVariables) {
    if (shellEnv[key] !== undefined && shellEnv[key] !== values.get(key)) {
      errors.push(`shell override for ${key} differs from staging env`);
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const envPath = resolve(process.argv[2] ?? ".env.staging");
  let content;
  try {
    content = readFileSync(envPath, "utf8");
  } catch {
    console.error("Staging preflight failed: env file is missing or unreadable");
    process.exit(1);
  }
  const composeContent = composeFiles.map((name) => readFileSync(resolve(infraDir, name), "utf8")).join("\n");
  const errors = validateStagingEnv(content, process.env, composeContent);
  if (errors.length) {
    for (const error of errors) console.error(`Staging preflight failed: ${error}`);
    process.exit(1);
  }
  console.log("Staging env identity preflight passed (values redacted)");
}
