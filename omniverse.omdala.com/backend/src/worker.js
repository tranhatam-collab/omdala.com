/**
 * Cloudflare Worker entry point for AI Omniverse API
 *
 * Env vars consumed (set via `wrangler secret put`):
 *   SHARED_CORE_BASE_URL  — base URL of shared-core auth/account service
 *   DATABASE_URL          — Postgres connection string (optional; falls back to D1 binding or memory)
 *
 * D1 binding (optional, wrangler.toml [[d1_databases]] → binding = "DB"):
 *   env.DB is forwarded to createOmniverseRuntime as the d1 binding.
 */

import { createOmniverseRuntime } from "./index.js";

let runtime = null;

async function getRuntime(env) {
  if (runtime) return runtime;
  runtime = await createOmniverseRuntime({
    env,
    d1: env.DB ?? null,
    sharedCoreBaseUrl: env.SHARED_CORE_BASE_URL,
    allowInMemoryFallback: !env.DATABASE_URL && !env.DB,
  });
  return runtime;
}

export default {
  async fetch(request, env, ctx) {
    const rt = await getRuntime(env);
    return rt.api.handle(request);
  },
};
