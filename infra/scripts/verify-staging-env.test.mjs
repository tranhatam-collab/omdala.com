import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseEnvFile, validateStagingEnv } from "./verify-staging-env.mjs";

const env = `INFRA_DOMAIN=staging.infra.omdala.com
POSTGRES_DB=omdala_staging
POSTGRES_APP_USER=omdala_app
POSTGRES_BACKUP_USER=omdala_backup
POSTGRES_PASSWORD=staging-db-secret
POSTGRES_APP_PASSWORD=staging-app-secret
POSTGRES_READONLY_PASSWORD=staging-readonly-secret
POSTGRES_MIGRATION_PASSWORD=staging-migration-secret
POSTGRES_BACKUP_PASSWORD=staging-backup-secret
POSTGRES_MCP_PASSWORD=staging-mcp-secret
KEYCLOAK_ADMIN_PASSWORD=staging-auth-secret
VALKEY_PASSWORD=staging-cache-secret
R2_ACCESS_KEY_ID=staging-r2-key
R2_SECRET_ACCESS_KEY=staging-r2-secret
R2_ENDPOINT=https://staging.example.invalid
R2_BUCKET_BACKUPS=omdala-staging-backups
WALG_S3_PREFIX=s3://omdala-staging-backups/postgres
API_JWT_PUBLIC_KEY_URL=https://auth.staging.infra.omdala.com/realms/OMDALA/protocol/openid-connect/certs
EMAIL_API_URL=https://staging-mail.example.invalid/api/send
EMAIL_API_KEY=staging-mail-secret
EMAIL_FROM=staging@example.invalid
EMAIL_STAGING_SINK_ADDRESS=sink@example.invalid
AIAGENT_ENVIRONMENT=staging
AIAGENT_API_KEY=staging-ai-secret
AIAGENT_EXPECTED_PROVIDER_SHA=staging-provider-sha
AIAGENT_EXPECTED_PROVIDER_VERSION_ID=staging-provider-version
AIAGENT_EXPECTED_PROVIDER_BUNDLE_SHA256=staging-provider-bundle
AIAGENT_EXPECTED_LEDGER_SHA=staging-ledger-sha
AIAGENT_EXPECTED_LEDGER_VERSION_ID=staging-ledger-version
AIAGENT_EXPECTED_LEDGER_BUNDLE_SHA256=staging-ledger-bundle
AIAGENT_EXPECTED_LEDGER_MIGRATION_SHA256=staging-ledger-migration
AIAGENT_RECEIPT_PUBLIC_KEYS=staging-keyring
ALERT_WEBHOOK_URL=https://staging-alert.example.invalid/webhook
`;
const compose = "${POSTGRES_DB} ${R2_BUCKET_BACKUPS} ${R2_SECRET_ACCESS_KEY}";

test("accepts isolated staging targets with no shell override", () => {
  assert.deepEqual(validateStagingEnv(env, {}, compose), []);
});

test("rejects production targets and mismatched backup destinations", () => {
  const unsafe = env.replace("POSTGRES_DB=omdala_staging", "POSTGRES_DB=omdala_prod")
    .replace("R2_BUCKET_BACKUPS=omdala-staging-backups", "R2_BUCKET_BACKUPS=omdala-prod-backups");
  const errors = validateStagingEnv(unsafe, {}, compose);
  assert.ok(errors.some((error) => error.startsWith("POSTGRES_DB")));
  assert.ok(errors.some((error) => error.startsWith("R2_BUCKET_BACKUPS")));
});

test("rejects template secrets, duplicates, and shell variable precedence without printing values", () => {
  const unsafe = env.replace("POSTGRES_PASSWORD=staging-db-secret", "POSTGRES_PASSWORD=staging_password_change_me")
    .concat("POSTGRES_DB=omdala_prod\n");
  const errors = validateStagingEnv(unsafe, { R2_SECRET_ACCESS_KEY: "production-secret" }, compose);
  assert.ok(errors.some((error) => error.startsWith("POSTGRES_PASSWORD")));
  assert.ok(errors.some((error) => error === "duplicate POSTGRES_DB"));
  assert.ok(errors.some((error) => error.startsWith("shell override for R2_SECRET_ACCESS_KEY")));
  assert.ok(!errors.join(" ").includes("production-secret"));
});

test("rejects a staging launch with development Compose profiles", () => {
  assert.deepEqual(
    validateStagingEnv(env, { COMPOSE_PROFILES: "dev" }, compose),
    ["COMPOSE_PROFILES must be empty for staging"],
  );
});

test("rejects omitted Compose variables but permits inactive MinIO and optional B2", () => {
  const composeWithOptional = `${compose} \${EMAIL_API_KEY} \${API_PORT} \${MINIO_ROOT_PASSWORD} \${B2_BUCKET:-}`;
  const errors = validateStagingEnv(env, {}, composeWithOptional);
  assert.ok(errors.includes("API_PORT must be configured outside the template"));
  assert.ok(!errors.some((error) => error.includes("MINIO_ROOT_PASSWORD")));
  assert.ok(!errors.some((error) => error.includes("B2_BUCKET")));
});

test("rejects production AI environment, missing mail key, and non-HTTPS sink", () => {
  const unsafe = env.replace("AIAGENT_ENVIRONMENT=staging", "AIAGENT_ENVIRONMENT=production")
    .replace("EMAIL_API_KEY=staging-mail-secret", "EMAIL_API_KEY=<pending>")
    .replace("EMAIL_API_URL=https://staging-mail.example.invalid/api/send", "EMAIL_API_URL=http://mail.example.invalid/api/send");
  const errors = validateStagingEnv(unsafe, {}, compose);
  assert.ok(errors.some((error) => error.startsWith("AIAGENT_ENVIRONMENT")));
  assert.ok(errors.some((error) => error.startsWith("EMAIL_API_KEY")));
  assert.ok(errors.some((error) => error === "EMAIL_API_URL must use HTTPS"));
  assert.ok(!errors.join(" ").includes("staging-mail-secret"));
});

test("rejects a multiple-recipient staging sink", () => {
  const unsafe = env.replace(
    "EMAIL_STAGING_SINK_ADDRESS=sink@example.invalid",
    "EMAIL_STAGING_SINK_ADDRESS=sink@example.invalid,other@example.invalid",
  );
  const errors = validateStagingEnv(unsafe, {}, compose);
  assert.ok(errors.includes("EMAIL_STAGING_SINK_ADDRESS must be a single email address"));
});

test("staging template inventories every active Compose interpolation variable", () => {
  const actualCompose = readFileSync(new URL("../docker-compose.yml", import.meta.url), "utf8")
    + readFileSync(new URL("../docker-compose.staging.yml", import.meta.url), "utf8");
  const template = readFileSync(new URL("../.env.staging.example", import.meta.url), "utf8");
  const { values, errors } = parseEnvFile(template);
  const optional = new Set([
    "B2_APPLICATION_KEY_ID", "B2_APPLICATION_KEY", "B2_BUCKET",
    "MINIO_ROOT_USER", "MINIO_ROOT_PASSWORD",
  ]);
  const composeVariables = new Set(
    [...actualCompose.matchAll(/\$\{([A-Z][A-Z0-9_]*)/g)].map((match) => match[1]),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(
    [...composeVariables].filter((key) => !optional.has(key) && !values.has(key)),
    [],
  );
  const preflightErrors = validateStagingEnv(template, {}, actualCompose);
  assert.ok(preflightErrors.some((error) => error.startsWith("EMAIL_API_KEY")));
  assert.ok(preflightErrors.some((error) => error.startsWith("AIAGENT_API_KEY")));
});
