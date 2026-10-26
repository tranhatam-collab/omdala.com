import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { detectKnownStagingDatabaseBootstrapHazards } from "./verify-staging-db-bootstrap.mjs";

const infraDir = fileURLToPath(new URL("..", import.meta.url));
const compose = readFileSync(resolve(infraDir, "docker-compose.yml"), "utf8");
const initDir = resolve(infraDir, "postgres/init-scripts");
const initSql = readdirSync(initDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => readFileSync(resolve(initDir, name), "utf8"))
  .join("\n");

test("blocks the current staging bootstrap before Docker starts", () => {
  assert.deepEqual(detectKnownStagingDatabaseBootstrapHazards(compose, initSql), [
    "STAGING_DB_INIT_PRODUCTION_DATABASE",
    "STAGING_DB_INIT_LITERAL_SECRET_PLACEHOLDER",
    "STAGING_DB_IMAGE_PGVECTOR_UNPROVEN",
    "STAGING_DB_DEV_SEED_AUTOLOAD",
  ]);
});

test("blocks local demo seed even when other bootstrap hazards are removed", () => {
  assert.deepEqual(
    detectKnownStagingDatabaseBootstrapHazards(
      "  postgres:\n    image: pgvector/pgvector:pg17\n    volumes:\n      - ./postgres/init-scripts:/docker-entrypoint-initdb.d:ro",
      "-- OMDALA Seed Data for Local Development\nINSERT INTO tenants (slug) VALUES ('demo');",
    ),
    ["STAGING_DB_DEV_SEED_AUTOLOAD"],
  );
});

test("does not flag an unmounted local seed", () => {
  assert.deepEqual(
    detectKnownStagingDatabaseBootstrapHazards(
      "  postgres:\n    image: pgvector/pgvector:pg17",
      "-- OMDALA Seed Data for Local Development\nINSERT INTO tenants (slug) VALUES ('demo');",
    ),
    [],
  );
});

test("permits a source fixture without those known hazards", () => {
  assert.deepEqual(
    detectKnownStagingDatabaseBootstrapHazards(
      "  postgres:\n    image: pgvector/pgvector:pg17",
      "SELECT :'staging_db';",
    ),
    [],
  );
});
