#!/usr/bin/env node

/**
 * Omniverse O1 — Database migration runner
 *
 * Usage:
 *   node backend/src/db/migrate.js                      # auto-detect from env
 *   node backend/src/db/migrate.js --adapter postgres    # force postgres
 *   node backend/src/db/migrate.js --adapter d1          # force d1 (via wrangler)
 *   node backend/src/db/migrate.js --seed                # apply schema + seed data
 *   node backend/src/db/migrate.js --seed-only           # seed data only (schema already applied)
 *   node backend/src/db/migrate.js --dry-run             # print SQL without executing
 *
 * Environment:
 *   DATABASE_URL        — Postgres connection string
 *   D1_DATABASE_ID      — Cloudflare D1 database ID (for wrangler d1 execute)
 *   D1_DATABASE_NAME    — Cloudflare D1 database name (alternative)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMA_DIR = path.join(__dirname, "schema");

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    adapter: null, // "postgres" | "d1" | null (auto-detect)
    seed: false,
    seedOnly: false,
    dryRun: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--adapter" && argv[i + 1]) {
      args.adapter = argv[++i];
    } else if (arg === "--seed") {
      args.seed = true;
    } else if (arg === "--seed-only") {
      args.seedOnly = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    }
  }

  return args;
}

// ---------------------------------------------------------------------------
// SQL loaders
// ---------------------------------------------------------------------------

function loadSql(filename) {
  const filePath = path.join(SCHEMA_DIR, filename);
  return fs.readFileSync(filePath, "utf-8");
}

function buildSqlSequence({ adapter, seed, seedOnly }) {
  const parts = [];

  if (!seedOnly) {
    const schemaFile = adapter === "d1" ? "d1.sql" : "postgres.sql";
    parts.push({ label: `schema (${schemaFile})`, sql: loadSql(schemaFile) });
  }

  // Seed file for D1 uses its own seed syntax; Postgres uses seed.sql
  if (seed || seedOnly) {
    const seedFile = adapter === "d1" ? "d1_seed.sql" : "seed.sql";
    parts.push({ label: `seed data (${seedFile})`, sql: loadSql(seedFile) });
  }

  return parts;
}

// ---------------------------------------------------------------------------
// Postgres executor
// ---------------------------------------------------------------------------

async function executePostgres(sqlParts, { dryRun }) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for postgres migration");
  }

  if (dryRun) {
    for (const part of sqlParts) {
      log(`[dry-run] ${part.label}:`);
      log(part.sql);
      log("");
    }
    return;
  }

  const pg = await import("pg");
  const client = new pg.default.Client({ connectionString });
  await client.connect();

  try {
    for (const part of sqlParts) {
      log(`Applying ${part.label}...`);
      await client.query(part.sql);
      log(`  done.`);
    }
  } finally {
    await client.end();
  }
}

// ---------------------------------------------------------------------------
// D1 executor (via wrangler CLI)
// ---------------------------------------------------------------------------

function executeD1(sqlParts, { dryRun }) {
  const dbId = process.env.D1_DATABASE_ID || process.env.D1_DATABASE_NAME;
  if (!dbId) {
    throw new Error(
      "D1_DATABASE_ID or D1_DATABASE_NAME is required for d1 migration",
    );
  }

  for (const part of sqlParts) {
    if (dryRun) {
      log(`[dry-run] ${part.label}:`);
      log(part.sql);
      log("");
      continue;
    }

    log(`Applying ${part.label} to D1 (${dbId})...`);

    const tmpFile = path.join(SCHEMA_DIR, `_tmp_migrate_${Date.now()}.sql`);
    try {
      fs.writeFileSync(tmpFile, part.sql, "utf-8");
      execSync(`npx wrangler d1 execute ${dbId} --file="${tmpFile}"`, {
        stdio: "inherit",
      });
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }

    log(`  done.`);
  }
}

// ---------------------------------------------------------------------------
// Adapter detection
// ---------------------------------------------------------------------------

function detectAdapter(explicit) {
  if (explicit) {
    return explicit;
  }

  if (process.env.DATABASE_URL) {
    return "postgres";
  }

  if (process.env.D1_DATABASE_ID || process.env.D1_DATABASE_NAME) {
    return "d1";
  }

  throw new Error(
    "Cannot auto-detect adapter. Set DATABASE_URL or D1_DATABASE_ID, or pass --adapter.",
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

async function main() {
  const args = parseArgs(process.argv);
  const adapter = detectAdapter(args.adapter);
  const sqlParts = buildSqlSequence({
    adapter,
    seed: args.seed,
    seedOnly: args.seedOnly,
  });

  if (sqlParts.length === 0) {
    log("Nothing to apply.");
    return;
  }

  log(`Omniverse O1 migration — adapter: ${adapter}`);

  if (adapter === "postgres") {
    await executePostgres(sqlParts, { dryRun: args.dryRun });
  } else if (adapter === "d1") {
    executeD1(sqlParts, { dryRun: args.dryRun });
  } else {
    throw new Error(`Unknown adapter: ${adapter}`);
  }

  log("Migration complete.");
}

main().catch((error) => {
  process.stderr.write(`Migration failed: ${error.message}\n`);
  process.exitCode = 1;
});
