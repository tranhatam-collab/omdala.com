// PREP_UNDER_ASSUMPTION(AI cost cap, fail closed when unset)
//
// Per-tenant daily AI cost ledger (migration 0005_ai_usage_ledger).
//
// Atomicity: queryRows runs one statement per connection, so a reservation is a
// single statement. The conditional UPDATE of the per-day counter row is the
// serialization point: under concurrency a second writer waits on that row lock and
// re-checks `committed + estimate <= cap` against the latest committed value, so
// parallel reservations can never exceed the cap. The ledger row is inserted by the
// same statement, so the counter and the ledger cannot drift apart.
import type { ApiBindings } from "../contracts";
import { queryRows } from "./client";
import { DbQueryError, toDbQueryError } from "./errors";

type SqlRow = Record<string, unknown>;

export type ReserveResult =
  | { outcome: "reserved" }
  | { outcome: "duplicate"; status: "reserved" | "settled" | "released" }
  | { outcome: "cap_exceeded"; committedUsd: number };

async function inDbContext<T>(operation: string, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toDbQueryError(error, operation);
  }
}

const usd = (value: number) => value.toFixed(6);

export async function reserveAiUsage(
  env: ApiBindings,
  input: { ownerEmail: string; requestId: string; usageDay: string; estimateUsd: number; capUsd: number },
): Promise<ReserveResult> {
  return inDbContext("reserveAiUsage", async () => {
    await queryRows(
      env,
      `INSERT INTO omdala.ai_usage_days (owner_email, usage_day)
       VALUES ($1, $2::date)
       ON CONFLICT (owner_email, usage_day) DO NOTHING`,
      [input.ownerEmail, input.usageDay],
    );

    let reserved: SqlRow[] = [];
    try {
      reserved = (await queryRows(
        env,
        `WITH bumped AS (
           UPDATE omdala.ai_usage_days d
           SET committed_usd = d.committed_usd + $4::numeric, updated_at = NOW()
           WHERE d.owner_email = $1 AND d.usage_day = $2::date
             AND d.committed_usd + $4::numeric <= $5::numeric
             AND NOT EXISTS (
               SELECT 1 FROM omdala.ai_usage_ledger l
               WHERE l.owner_email = $1 AND l.request_id = $3
             )
           RETURNING d.owner_email, d.usage_day
         )
         INSERT INTO omdala.ai_usage_ledger (owner_email, request_id, usage_day, reserved_usd, status)
         SELECT owner_email, $3, usage_day, $4::numeric, 'reserved' FROM bumped
         RETURNING request_id`,
        [input.ownerEmail, input.usageDay, input.requestId, usd(input.estimateUsd), usd(input.capUsd)],
      )) as SqlRow[];
    } catch (error) {
      // Two identical requests raced: the loser hits the primary key and its whole
      // statement (including the counter bump) is rolled back.
      const normalized = toDbQueryError(error);
      if (!(normalized instanceof DbQueryError) || normalized.sqlState !== "23505") throw error;
    }
    if (reserved[0]) return { outcome: "reserved" as const };

    const state = (await queryRows(
      env,
      `SELECT l.status AS status, d.committed_usd AS committed_usd
       FROM omdala.ai_usage_days d
       LEFT JOIN omdala.ai_usage_ledger l
         ON l.owner_email = d.owner_email AND l.request_id = $3
       WHERE d.owner_email = $1 AND d.usage_day = $2::date`,
      [input.ownerEmail, input.usageDay, input.requestId],
    )) as SqlRow[];
    const status = state[0]?.status;
    if (status === "reserved" || status === "settled" || status === "released") {
      return { outcome: "duplicate" as const, status };
    }
    return { outcome: "cap_exceeded" as const, committedUsd: Number(state[0]?.committed_usd ?? 0) };
  });
}

/**
 * Turn a reservation into the amount actually spent. Only a still-reserved row
 * changes, so a replay or a second call is a no-op. Returns whether it changed.
 */
export async function settleAiUsage(
  env: ApiBindings,
  input: { ownerEmail: string; requestId: string; spentUsd: number },
): Promise<boolean> {
  return inDbContext("settleAiUsage", async () => {
    const rows = (await queryRows(
      env,
      `WITH changed AS (
         UPDATE omdala.ai_usage_ledger
         SET status = 'settled', settled_usd = $3::numeric, updated_at = NOW()
         WHERE owner_email = $1 AND request_id = $2 AND status = 'reserved'
         RETURNING usage_day, reserved_usd
       )
       UPDATE omdala.ai_usage_days d
       SET committed_usd = GREATEST(0, d.committed_usd - c.reserved_usd + $3::numeric), updated_at = NOW()
       FROM changed c
       WHERE d.owner_email = $1 AND d.usage_day = c.usage_day
       RETURNING d.committed_usd`,
      [input.ownerEmail, input.requestId, usd(input.spentUsd)],
    )) as SqlRow[];
    return rows.length === 1;
  });
}

/** Give a reservation back (nothing was billed). Idempotent; returns whether it changed. */
export async function releaseAiUsage(
  env: ApiBindings,
  input: { ownerEmail: string; requestId: string },
): Promise<boolean> {
  return inDbContext("releaseAiUsage", async () => {
    const rows = (await queryRows(
      env,
      `WITH changed AS (
         UPDATE omdala.ai_usage_ledger
         SET status = 'released', settled_usd = 0, updated_at = NOW()
         WHERE owner_email = $1 AND request_id = $2 AND status = 'reserved'
         RETURNING usage_day, reserved_usd
       )
       UPDATE omdala.ai_usage_days d
       SET committed_usd = GREATEST(0, d.committed_usd - c.reserved_usd), updated_at = NOW()
       FROM changed c
       WHERE d.owner_email = $1 AND d.usage_day = c.usage_day
       RETURNING d.committed_usd`,
      [input.ownerEmail, input.requestId],
    )) as SqlRow[];
    return rows.length === 1;
  });
}
