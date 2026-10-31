// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// Shared fixed-window request counters (migration 0008_rate_limit_windows).
//
// One statement per request: an upsert that counts the request only while the window is under
// its limit. Concurrent isolates serialize on the (key, window) row lock and the second writer
// re-checks the limit against the committed count, so the limit holds across isolates. The
// window boundary is taken from the database clock, so isolate clock skew does not matter.
import type { ApiBindings } from "../contracts";
import { queryRows } from "./client";
import { toDbQueryError } from "./errors";

/** Hash a limiter key (it contains emails and addresses) before it reaches the database. */
export async function hashRateLimitKey(key: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** true when this request is over the limit and must be refused. */
export async function hitRateLimit(
  env: ApiBindings,
  input: { key: string; limit: number; windowSeconds: number },
): Promise<boolean> {
  // the window length is part of the identity, so one key under two lengths never shares a row
  const keyHash = await hashRateLimitKey(`${input.windowSeconds}:${input.key}`);
  try {
    const rows = await queryRows(
      env,
      `INSERT INTO omdala.rate_limit_windows AS w (key_hash, window_start, hits)
       VALUES ($1, to_timestamp(floor(extract(epoch FROM clock_timestamp()) / $2::int) * $2::int), 1)
       ON CONFLICT (key_hash, window_start) DO UPDATE SET hits = w.hits + 1 WHERE w.hits < $3::int
       RETURNING hits`,
      [keyHash, input.windowSeconds, input.limit],
    );
    // no row returned: the window was already at its limit, the request is not counted
    return rows.length === 0;
  } catch (error) {
    throw toDbQueryError(error, "hitRateLimit");
  }
}

/** Old windows are useless; callers run this occasionally. */
export async function purgeRateLimitWindows(env: ApiBindings, olderThanSeconds: number): Promise<void> {
  try {
    await queryRows(
      env,
      `DELETE FROM omdala.rate_limit_windows WHERE window_start < NOW() - make_interval(secs => $1::int)`,
      [olderThanSeconds],
    );
  } catch (error) {
    throw toDbQueryError(error, "purgeRateLimitWindows");
  }
}
