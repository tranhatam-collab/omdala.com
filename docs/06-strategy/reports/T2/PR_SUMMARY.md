# PR #17 reviewer summary: T2 (Core API, data, auth, billing), `claude/omdala-t2-core`
Draft PR on base `OMCODE/infra-e2e-auto-20261026`. Only `services/**`, `infra/postgres/**` and `docs/**` change, plus the CI lease below. Every order has a report in `docs/06-strategy/reports/T2/<ORDER>.md`. Evidence is VERIFIED_WORKTREE_ONLY unless a hosted run is named. Counts are for `pnpm test:api` at the order's head (with a local PostgreSQL / without).

## What changed, by order
| Order | SHA | What | API tests |
|---|---|---|---|
| WO-T2-01/02/03 | 64c581d, 6114316, 163c280 | PostgreSQL bootstrap proof; session lifecycle negatives and redirect hardening; AIAGENT client contract tests | |
| WO-T2-CI | 3e36cd4 | CI runs on `claude/omdala-**` pushes (lease, one line) | hosted run read, success |
| WO-T2-04/05 | 47b1eb1, 0259a1e | PostgreSQL TLS verified by default; auth repository on real SQL | 288 / 275 |
| BL-T2-01/02 | b74dd52, 1f1d532, b794619 | Tenant-isolation negatives for every `/v2/reality` route; database failures are 503 `DATABASE_UNAVAILABLE`, auth routes no longer leak storage errors | |
| BL-T2-05/06 | 01f22d3, 2ed5df9 | Local DR rehearsal with per-table parity; staging mail-sink policy against a stub provider | CI success at 3988b4c, 93fbd4a |
| WO-T2-09..12 | e464a40, b857bbd, 456a58f, fa0eb9a | Reality scenes and runs (behind the release boundary); persistent-auth local stand-up with stub mail; one-command stand-up and smoke; AIAGENT 429/504/502 mapping | |
| WO-T2-14..19 | 2c48d55, a2d97dc, 1a250e2, 3566a14 | Tenant isolation for account and workspace routes; Om AI bridge contract draft; local journey support; characterization of the missing AI cap | |
| WO-T2-20 | 28e7e33 | Per-tenant daily AI cost cap: atomic reserve/settle/release ledger, 429 `ai_tenant_cap_exceeded`, 402 `subscription_inactive`, fails closed when unset (migration 0005 staged) | 524 / 466 |
| WO-T2-21 | 0f8197a | Om AI bridge credential behind the release boundary (501 outside test/development/local), revocable server-side row, per-scope route allowlist (migration 0006 staged) | 583 / 520 |
| WO-T2-22 | fe6b42e | Chat input validated before reserving; bridge mint rate and per-session limits; admin revoke | 590 / 526 |
| WO-T2-23 | 065b716 | Bridge verification options (draft section 10, owner decides); `sub` is a stored account id (migration 0007 staged) | 591 / 526 |
| WO-T2-24 | 5c7c84e | Fixed: replaying a released Idempotency-Key reached the provider uncapped; any reused key now 409; error text no longer echoed from refresh/magic-link/exchange | 598 / 528 |
| WO-T2-26 | 476749a | DR rehearsal covers migrations 0004-0007 (cap counters and revocation state survive restore) | 601 / 528 |
| WO-T2-25 | c442389 | Billing flow mapped with a stub provider; fixed `verifyWebhookSignature` (always threw) | 614 / 535 |
| WO-T2-29 | 3b4ac45 | `/v1/security` webhooks/verify, service-token and api-keys answer 501 `not_released` outside local environments | 621 / 542 |
| WO-T2-27 | 0743b89 | Rate limiter behind one port: shared PostgreSQL fixed window, per-isolate fallback (migration 0008 staged) | 637 / 550 |
| WO-T2-28 | 369cb50 | 5xx bodies carry a stable code and the request id only; `app.onError`; cause only in the log | 643 / 556 |
| WO-T2-30 | 60625bb | Hosted CI job `test-api` starts a throwaway TLS PostgreSQL so the DB-gated suites run (lease: that job only) | see WO-T2-30 report |

Reports exist for every order above; blocked or moot items are reported too (WO-T2-08, BL-T2-03, BL-T2-04).

## Other checks at the last local head
typecheck, eslint `--max-warnings=0`, `pnpm --filter @omdala/api run check` clean; `pnpm test:core` 15, `pnpm test:d1` 7, `pnpm test:release-governance` 394 pass / 0 fail, `pnpm --filter @omdala/billing test` 31 pass. Hosted CI on 369cb50 (WO-T2-28): 25 of 26 check runs success, CodeRabbit skipped.

## Open findings
- No provider webhook receiver, no plan-change path, no replay refusal or event idempotency in billing (WO-T2-25); `packages/billing` states do not map to the database statuses and have no `past_due`.
- Service tokens never verified and API keys were never stored; both are closed (WO-T2-29) until designed.
- A reused Idempotency-Key is refused (409); there is no stored-answer replay, so a client that lost a response pays again under a new key, within the cap.
- The shared rate limiter falls back to per-isolate limits until migration 0008 is applied.
- The bridge per-session credential cap is soft (count and insert are separate statements).
- `error.message` is gone from responses in `services/api/src/index.ts`; 4xx messages are authored text.

## What waits for the owner or T1
- T1 promotes migrations 0004 to 0008 (`infra/postgres/migrations/proposed/README.md`, WO-T1-06): move the file, add its `compatibility.json` entry, update two expectations in `scripts/verify-migration-compatibility.test.mjs`. Until then staging and production answer chat with 503 (cap required, ledger missing) and keep per-isolate rate limits.
- Owner: set `OMDALA_AI_DAILY_COST_CAP_USD` per environment; approve releasing the Om AI bridge (501 today); choose introspection or asymmetric signing for bridge verification (draft section 10); choose the billing provider; decide whether to reopen the three closed security routes with a design.
- WO-T2-08 (Cloudflare docs host) is blocked on network access.
- Merge, approval and the draft status are not touched by T2.
