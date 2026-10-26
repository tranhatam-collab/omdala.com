import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const infraDir = fileURLToPath(new URL("..", import.meta.url));

export function detectKnownStagingDatabaseBootstrapHazards(compose, initSql) {
  const errors = [];
  if (/\bomdala_prod\b/i.test(initSql)) {
    errors.push("STAGING_DB_INIT_PRODUCTION_DATABASE");
  }
  if (/\$\{POSTGRES_[A-Z0-9_]*PASSWORD\}/.test(initSql)) {
    errors.push("STAGING_DB_INIT_LITERAL_SECRET_PLACEHOLDER");
  }
  if (
    /^\s+image:\s+postgres:[^\s#]+/m.test(compose) &&
    /CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+vector\b/i.test(initSql)
  ) {
    errors.push("STAGING_DB_IMAGE_PGVECTOR_UNPROVEN");
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const compose = readFileSync(resolve(infraDir, "docker-compose.yml"), "utf8");
  const initDir = resolve(infraDir, "postgres/init-scripts");
  const initSql = readdirSync(initDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => readFileSync(resolve(initDir, name), "utf8"))
    .join("\n");
  const errors = detectKnownStagingDatabaseBootstrapHazards(compose, initSql);
  if (errors.length) {
    for (const error of errors) console.error(`Staging DB bootstrap blocked: ${error}`);
    process.exit(1);
  }
  console.log("Known staging DB bootstrap source hazards absent");
}
