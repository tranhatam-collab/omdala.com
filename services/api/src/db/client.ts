import { Client, type QueryResultRow } from "pg";
import type { ApiBindings } from "../contracts";
import { toDbQueryError } from "./errors";

export interface DbClientConfig {
  databaseUrl?: string;
}

export function resolveDbClientConfig(env: ApiBindings): DbClientConfig {
  const config: DbClientConfig = {};
  const connectionString = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;

  if (connectionString) {
    config.databaseUrl = connectionString;
  }

  return config;
}

export function assertDatabaseConfigured(env: ApiBindings): void {
  if (!env.HYPERDRIVE?.connectionString && !env.DATABASE_URL) {
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
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
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
