# T4 QA summary for the owner and human reviewer (2026-10-31)

Facts only. Reports live in `docs/06-strategy/reports/T4/` (`VERIFY-<team>-<sha7>.md`, `WO-T4-NN.md`) on branch `claude/omdala-t4-qa`. Evidence words: VERIFIED_WORKTREE_ONLY, VERIFIED_HEAD_ONLY, VERIFIED_CURRENT (hosted run read), NOT_CHECKED.

## 1. Heads verified
| Team | Newest head | Newest code-bearing head | Evidence | Hosted CI |
|---|---|---|---|---|
| T2 `claude/omdala-t2-core` | `369cb50` | `369cb50` ([VERIFY](../../06-strategy/reports/T4/VERIFY-t2-369cb50.md)) | VERIFIED_WORKTREE_ONLY (merged-tree run) | NOT_CHECKED for 369cb50; earlier heads read in their reports |
| T3 `claude/omdala-t3-web` | `de78337` (docs only) | `6def072` ([VERIFY](../../06-strategy/reports/T4/VERIFY-t3-6def072.md)) | VERIFIED_WORKTREE_ONLY | none: branch has no hosted run (NOT_CHECKED) |
| TAI `claude/omdala-tai-omai` | `c1c5366` (docs only) | `984f640` ([VERIFY](../../06-strategy/reports/T4/VERIFY-tai-984f640.md)) | VERIFIED_HEAD_ONLY | NOT_CHECKED for 984f640 |
Every earlier head has its own VERIFY file in the same folder (12 T2, 15 T3, 9 TAI reports). No verified claim ended FAILED at its final head.

## 2. Integration (WO-T4-18, WO-T4-19), local only, scratch merge never pushed
T2, T3, TAI, T4 heads merge onto `7abd962` without conflict. typecheck, lint, brand:lint, build:all, API 643/643 with PostgreSQL (556 pass/87 skip without), app 41, core 15, release-governance, security-headers, inlined-env, bundle-budget, billing, security:audit: pass. E2E: app 44 (+1 skip), web 31, auth 28, docs 49, admin 26, brand 39, app-export: pass. Om AI: backend 107, gateway 19, web 17, app 15+4: pass. Desktop 111/113: the 2 failures are one test needing `/bin/zsh`, absent on Linux (see 5).

## 3. Findings T4 raised and current state
| Finding | Severity | State | Report |
|---|---|---|---|
| Daily AI cost cap bypass through replay of a released Idempotency-Key | HIGH | Fixed at T2 `5c7c84e`; re-verified (replays 409, 40 parallel new keys admit exactly 4 at cap 1.00) | WO-T4-14, WO-T4-15 |
| `/v1/security` webhooks/verify anonymous 200, api-keys 201, service-token 201 (secret fallback, verify can never succeed) | HIGH/MEDIUM | Closed with 501 by WO-T2-29 (`3b4ac45`, in 369cb50); **not yet re-probed by T4** | WO-T4-17 |
| apps/app build did not inline the API origin (staging build called production API) | MEDIUM | Fixed in T3 (5190ac8 onward), guard test `test:inlined-env`; apps/auth not misrouted | WO-T4-12 |
| SEO findings | LOW | Fixed at later T3 heads | WO-T4-08 |
| R-01..R-28 reproduction table | mixed | Refresh pending (WO-T4-10) | `docs/audit/team4/2026-10-28/R_FINDINGS_REPRODUCTION.md` |
| Desktop terminal route hardcodes `/bin/zsh`; test fails where zsh is absent | LOW | Open, owner T1 (already gap 10 in the matrix refresh) | WO-T4-19 |

## 4. Local-only versus hosted evidence
All counts above are local runs. Hosted CI was read for earlier T2 and TAI heads (see VERIFY files). T3 has no hosted run. Nothing was run against staging, production, remote databases or provider keys. Real-SQL suites ran against a scratch local PostgreSQL; hosted CI skips them (matrix refresh gap 1).

## 5. Items that block a staging release (as T4 sees them)
1. T3 branch has no hosted CI; merged tree has no hosted run.
2. WO-T2-29 closure of the three security surfaces is unverified by an independent probe in release-like environments (WO-T4-17 open).
3. Migrations 0004-0008 are proposed and unapplied; staging behaviour with the DB-backed rate limiter and AI usage ledger is untested outside the scratch database.
4. No staging/production E2E has run (E2E-3 dry run, WO-T1-02).
5. TAI Vietnamese strings need native-speaker review.
6. Desktop test environment dependency on zsh (non-blocking for web staging).
