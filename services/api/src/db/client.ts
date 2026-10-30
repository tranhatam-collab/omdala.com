import { Client, type QueryResultRow } from "pg";
import type { ApiBindings } from "../contracts";
import { toDbQueryError } from "./errors";

export interface DbClientConfig {
  databaseUrl?: string;
}

export function isDatabaseConfigured(env: ApiBindings): boolean {
  return Boolean(env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL);
}

export function resolveDbClientConfig(env: ApiBindings): DbClientConfig {
  const config: DbClientConfig = {};
  const connectionString = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;

  if (connectionString) {
    config.databaseUrl = connectionString;
  }

  return config;
}

const INSECURE_TLS_ENVIRONMENTS = ["local", "development", "test"];

/**
 * Certificates are verified by default. Verification can be skipped only with
 * an explicit OMDALA_DB_TLS_INSECURE=1 in a local or test environment; any
 * other environment (including production and staging) refuses the flag.
 */
export function resolveDbSsl(env: ApiBindings): { rejectUnauthorized: boolean } {
  if (env.OMDALA_DB_TLS_INSECURE !== "1") return { rejectUnauthorized: true };
  if (!INSECURE_TLS_ENVIRONMENTS.includes(env.ENVIRONMENT?.toLowerCase() ?? "")) {
    throw new Error("DB_TLS_INSECURE_REFUSED");
  }
  return { rejectUnauthorized: false };
}

export function assertDatabaseConfigured(env: ApiBindings): void {
  if (!isDatabaseConfigured(env)) {
    throw new Error("DATABASE_URL is not configured");
  }
}

export async function queryRows<T extends QueryResultRow = QueryResultRow>(
  env: ApiBindings,
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  assertDatabaseConfigured(env);
  const connectionString =
    env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL!;
  const ssl = resolveDbSsl(env);
  const client = new Client({
    connectionString,
    ssl,
    connectionTimeoutMillis: 10_000,
    query_timeout: 10_000,
    statement_timeout: 10_000,
  });

  try {
    await client.connect();
    const result = await client.query<T>(text, params);
    return result.rows;
  } catch (error) {
    throw toDbQueryError(error, "queryRows");
  } finally {
    await client.end().catch(() => {});
  }
}
