import { HttpError } from "../core/errors.js";
import { createInMemoryDbAdapter } from "./adapters/inMemoryDbAdapter.js";
import { createPostgresDbAdapter } from "./adapters/postgresDbAdapter.js";
import { createD1DbAdapter } from "./adapters/d1DbAdapter.js";

export async function createDbAdapter(options = {}) {
  if (options.adapter) {
    return options.adapter;
  }

  const env = options.env || process.env;

  if (options.d1) {
    return createD1DbAdapter({ d1: options.d1 });
  }

  if (env.DATABASE_URL) {
    return createPostgresDbAdapter({ connectionString: env.DATABASE_URL });
  }

  if (env.OMNIVERSE_DB_MODE === "memory" || options.allowInMemoryFallback) {
    return createInMemoryDbAdapter();
  }

  throw new HttpError(
    500,
    "DB_CONFIG_ERROR",
    "No database configured. Set DATABASE_URL, provide D1 binding, or set OMNIVERSE_DB_MODE=memory",
  );
}
