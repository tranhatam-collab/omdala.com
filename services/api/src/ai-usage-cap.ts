// PREP_UNDER_ASSUMPTION(AI cost cap, fail closed when unset)
//
// Pure helpers for the per-tenant daily AI cost cap on POST /v1/ai/chat.

/** The most one chat call may cost: the provider budget ceiling the client already enforces. */
export const AI_CALL_COST_CEILING_USD = 0.25;

const CAP_OPTIONAL_ENVIRONMENTS = ["local", "development", "test"];
const MAX_CAP_USD = 1_000_000;

export type DailyCap =
  | { configured: true; capUsd: number }
  | { configured: false };

/** A positive, finite amount of USD, or "not configured" (unset, empty, invalid). */
export function parseDailyCap(value: string | undefined): DailyCap {
  const trimmed = value?.trim() ?? "";
  if (!/^\d{1,7}(\.\d{1,6})?$/.test(trimmed)) return { configured: false };
  const capUsd = Number(trimmed);
  if (!Number.isFinite(capUsd) || capUsd <= 0 || capUsd > MAX_CAP_USD) return { configured: false };
  return { configured: true, capUsd };
}

/**
 * Fail closed: only the local environments may run chat without a cap. Staging,
 * production and anything unrecognised (including an unset ENVIRONMENT) refuse chat
 * until a cap is configured.
 */
export function capIsRequired(environment: string | undefined): boolean {
  return !CAP_OPTIONAL_ENVIRONMENTS.includes(environment?.toLowerCase() ?? "");
}

/** What one request reserves: the per-call ceiling, never more than the whole cap. */
export function reservationFor(capUsd: number): number {
  return Math.min(AI_CALL_COST_CEILING_USD, capUsd);
}

export function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function secondsUntilNextUtcMidnight(now: number): number {
  const date = new Date(now);
  const next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now) / 1000));
}
