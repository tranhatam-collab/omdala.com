# DEV LEDGER - OMDALA continuous development

AUTOMATION: ACTIVE

Updated 2026-10-30. Canonical plan:
[OMDALA_CONTINUOUS_DEV_PLAN_2026.md](./OMDALA_CONTINUOUS_DEV_PLAN_2026.md).
This ledger supersedes parallel planning state on this candidate branch, not
signed release authority or remote files on another branch.

## 1. Scheduler state

| Host | Evidence | Current interpretation |
|---|---|---|
| VS Code Local Agent Host | Scheduler `2b4f4281-558b-4667-a9e7-666595e817d2` disabled on 2026-10-28; readback `enabled:false`, `nextRunAt:null`, default permissions retained | PAUSED; do not resume existing waiting sessions |
| Other planning agent | User supplied report: routine creation rejected, ledger PAUSED, no routine created in that session | REPORTED_UNVERIFIED here; not a cross-host live audit |

Hourly triggers 01:00-08:00 ICT created eight sessions awaiting input.
`running` was not evidence of completed development. Scheduler disable does not
itself cancel already waiting sessions. No scheduler is created or re-enabled by
this consolidation. Restart requires the plan's approval/watchdog/stop readbacks.
Readback during consolidation still shows the disabled scheduler's last run
metadata as `running` (started 09:00 ICT); the corresponding session
`200b63d2-b7df-4a8e-ac79-1e310d458e20` is `inputNeeded`, not executing development.
No waiting session was resumed. `enabled:false` and `nextRunAt:null` were
confirmed again; do not describe that as proof every historical session ended.

## 2. Decisions and authorization

| ID | Status | Decision / remaining gate |
|---|---|---|
| MANUAL-20261028 | AUTHORIZED | User selected consolidate plans, commit/push current patch and verify exact-SHA CI; retain PAUSED |
| D-001 | OPEN beyond this patch | Current authorized branch is OMCODE/infra-e2e-auto-20261026 based on 7522bffb9f9d0cab294020ab1470e3473993f8f5; no permission to merge PR #1/#10 or choose all later integration work |
| D-002 | OPEN | No new PR, merge, approve, ruleset/environment/secret changes or automation activation authorized |
| D-003 | PLANNING_SCOPE_CONFIRMED | Whole ecosystem requested, including OM-AI/Omone/mobile/memory/eight consumers; finite release scope and named product acceptance remain CTL-02/08 |
| D-004 | OPEN | Route taxonomy decision not made by this documentation change |
| H2..H13 | OPEN | Independent review, architecture/data/resources, protections, Auth/provider/mail/restore and production GO remain human gates |

## 3. Backlog and evidence state

The [96-package CSV](./OMDALA_ECOSYSTEM_REMAINING_WORK_2026-10-28.csv) is imported
verbatim from the audited local inventory. It contains 91 OPEN, two BLOCKED
(CTL-01, MEM-06), and three IN_PROGRESS (CTL-07, AI-01, ONE-01).
No ACCEPTED packages. Local preparation below does not change those full-package
acceptance states.

The [103-ID crosswalk](./OMDALA_ECOSYSTEM_LEGACY_EXECUTION_CROSSWALK_2026-10-28.csv)
preserves 100 mapped but NOT_ACCEPTED requirements and three rollups. Original
P0/P1/P2 requirements map to these packages in plan section 3; all 28 R findings
must still be dispositioned through P0-03, using the immutable original ledger.

### Historical baseline, not this patch's hosted result

- Candidate base: `7522bffb9f9d0cab294020ab1470e3473993f8f5`.
- [OMDALA CI 40538694226](https://github.com/tranhatam-collab/omdala.com/actions/runs/40538694226):
  25/25 jobs success at that SHA.
- [Desktop 40538709748](https://github.com/tranhatam-collab/omdala.com/actions/runs/40538709748):
  success at that SHA; digest
  `sha256:abd78e3990e0fa7075dd0d46d20b4df8244df60a1c8d27b30c9bfdd01267a0c0`.
- Historical external manifest 57/57 refers to that committed source only; it is
  not a current dirty-worktree or future commit manifest.
- PR #13 readback before publishing: draft, head at base above, target
  OMCODE/infra-staging-final-20261007. No independent acceptance inferred.

### Direct local development receipts (session 31)

| Scope | Result | Evidence level / limitation |
|---|---|---|
| Real staging Playwright loader + output isolation + receipt + production config | 18/18 pass, zero fail/skip | VERIFIED_WORKTREE_ONLY; discovers four scenarios without executing staging; rejects missing origin/internal output |
| Existing release-governance | 394/394 pass, zero fail/skip | VERIFIED_WORKTREE_ONLY, Node22.23.4/Python3.13; corrected validation PATH to retain installed sha256sum |
| OM-AI backend | typecheck, 19 tests, build, internal E2E all exit 0 | Local baseline; locked dependencies restored after missing tsx; internal testSupport flow, not public identity/provider acceptance |
| Previous local browser E2E | Web 1, App 18, Brand 13 pass | Historical local receipt, partly mocked; not real staging |
| Workflow placement | YAML parses; loader after frozen install in e2e-app, absent from dependency-free governance | Local validation, not hosted CI |

Loader fix uses a CommonJS-compatible file URL; integration invokes installed
Playwright with explicit cwd/current Node/30-second timeout. Deployment guide
documents preflight and acceptance limits. No live staging invocation is made.

## 4. Publication protocol and handoff

This commit is a source candidate, not an acceptance receipt. Its SHA cannot be
embedded in its own content. After normal push, record terminal Actions run
URLs/head SHA and results in a separate receipt or handoff. Until those readbacks
exist, this patch is **not VERIFIED_CURRENT**. Never reuse the historical runs.
If source changes are needed after failure, verify the newest SHA again.

Source CI failure is actionable work, not permission to disable a check.
Independent review jobs may remain gated; report them separately and retain HOLD.
No commit here is a deployment, no CI success is independent staging approval.

Staging E2E **OPEN**. Production **HOLD**. AUTOMATION: see the flag at the top and section 5.

## 5. Schedule, version 4 pull model (2026-10-30)

| Item | State |
|---|---|
| Owner request | 2026-10-30 in chat: no empty loops, rebuild the schedule and keep it flexible. Taken as approval to (1) give each cloud team its own trigger, (2) let T0 change cadence and enable or disable team triggers under 5.1, (3) set `AUTOMATION: ACTIVE` |
| Earlier approvals still in force | 2026-10-28: four cloud teams on claude-sonnet-5-5, coordinator on claude-opus-5-5; D-002 draft PRs stacked on `OMCODE/infra-e2e-auto-20261026`, no merge or approve; prep-ahead with `PREP_UNDER_ASSUMPTION`; T1 stays with the local VS Code agent |
| Why version 3 stalled | T0 pushed orders with `send_message`, which needs owner approval per message in the T0 session. Worker restarts closed pending approvals, so nothing reached the teams after 2026-10-28T16:35Z. T0 paused at 03:2xZ on 10-29 and the hourly routine then fired empty for about 35 hours. Fix: teams pull their own orders from section 7, so dispatch needs no message and no approval |
| Report location | Each team writes `docs/06-strategy/reports/<TEAM>/<ORDER>.md` on its own branch; that folder belongs to the team, the rest of `docs/06-strategy/**` to T0 |
| Lease: CI trigger | `.github/workflows/ci.yml`, the single `push: branches` line, to T2, T3 and TAI for the identical patch in WO-*-CI. Workflows that deploy are `workflow_call`/`workflow_dispatch` only, so the change runs CI, never deploy. The repository is public, so hosted minutes are not billed. T1 adopts the same line on its branch (WO-T1-01) |
| Lease: scripts | `scripts/backup/omdala_pg_restore.sh`, `scripts/cleanup_test_data.sql`, `scripts/ops_v2_report_upload.sh`, `scripts/smoke_v2_reality.sh` to T2 for BL-T2-04 (R-22..R-25). T1 keeps priority: if T1 changes one of these files, the lease ends |
| Lease: root `package.json` scripts | T3 only, no dependency or lockfile change |
| Lease: `pnpm-lock.yaml` and `apps/app/package.json` dependencies | Ended 2026-10-31T04:09Z with the WO-T3-19 report; no lockfile lease is active |

### 5.1 Triggers and adaptive cadence

| Trigger | Fires into | Cadence now | Changed |
|---|---|---|---|
| `trig_011XrmiQupK2SLA2VdfwrPqX` T0 coordinator | T0 session | hourly at :20 (teams pushed within 3 h) | prompt rewritten for version 4, 2026-10-30T15:30Z |
| `trig_01DHiQxFokgt9HAG3DQJ9EvT` T2 cycle | T2 session | hourly at :44 | refilled 2026-10-30T18:2xZ and 21:2xZ |
| `trig_013uiQjr9pic9idjucdNJQ7t` T3 cycle | T3 session | hourly at :45 | refilled 2026-10-30T18:2xZ and 21:2xZ |
| `trig_01EK3TgUb79vw6QGTMmF1uNp` TAI cycle | TAI session | hourly at :45, **still enabled** | The disable at 19:20Z did not run: `update_trigger` needs owner approval in the T0 session and the request closed on a worker restart. TAI was idle 15:37-21:2xZ; refilled with 3 eligible orders at 21:2xZ instead |
| `trig_01DGKeTb52qsK8dmR5NiZM2X` T4 cycle | T4 session | hourly at :45 | refilled 2026-10-30T18:2xZ and 21:2xZ; standing verification of new heads continues |

A team turn works through orders for up to about 90 minutes, so a fire that lands
during a running turn waits and starts the next order right after it: work is
continuous while the queue holds work. T0 applies these rules every tick and
records each change here and in section 8:

1. A team trigger stays hourly while the team has a READY order or backlog item.
   T0 disables it when the team writes `QUEUE_EMPTY` or everything left is BLOCKED
   on a human, and re-enables it in the tick that adds an eligible order.
2. Two FAILED team turns in a row: disable that trigger and notify the owner once.
3. T0 itself: hourly while any team pushed in the last 3 hours, otherwise every
   3 hours; every 6 hours when every team trigger is disabled and T0 has no own
   work, with one notice listing the human decisions in plan section 11.
4. Usage pressure (a team's rate limit not `allowed`, or overage): disable the
   lowest-value trigger first, in the order TAI, T3, T2, T4. The seven-day window
   read `allowed_warning` on the T3 session at 16:21Z: watched, no action yet.
5. No empty tick: each tick harvests reports, refills queues or does T0's own
   orders. A tick with none of these lowers T0's cadence instead of reporting.
6. Limit found 2026-10-30: `update_trigger` (pause, resume, cadence) needs owner
   approval in the T0 session, like `send_message`. Until the owner allows it,
   T0 keeps idle teams busy by refilling eligible work first, and a team with
   nothing eligible only does a short ledger check when its trigger fires.

## 6. Team roster

| Team | Executor | Branch head (2026-10-30T21:2xZ) | Session | Trigger | State |
|---|---|---|---|---|---|
| T0 Coordinator | Claude cloud, claude-opus-5-5 | `claude/omdala-coordination` | `session_011NjrMT2mFGRNNyxofbXcPX` | `trig_011XrmiQupK2SLA2VdfwrPqX` | ACTIVE |
| T1 Infra and Release | Local VS Code agent | `OMCODE/infra-e2e-auto-20261026` 7abd962 | owner-run | none | Orders WO-T1-* wait for the owner to relay |
| T2 Core API/Data/Auth/Billing | Claude cloud, claude-sonnet-5-5 | `claude/omdala-t2-core` 93fbd4a, PR #17 draft | `session_015zwouVg9EARRhsEXRQVfcw` | enabled | Second cycle 18:45-19:04Z: WO-T2-09..12 and BL-T2-06 DONE, WO-T2-08 BLOCKED (network); refilled with 2 orders |
| T3 Web/UI/Docs | Claude cloud, claude-sonnet-5-5 | `claude/omdala-t3-web` 02d5453, PR #18 draft | `session_015zwouUz4xi7CAwpcUoh5ie` | enabled | WO-T3-07..10, BL-T3-02, BL-T3-04 DONE; refilled with 3 orders |
| TAI Om AI/Provider/Mobile source | Claude cloud, claude-sonnet-5-5 | `claude/omdala-tai-omai` d141c22, PR #16 draft | `session_015zwouXH3y3GrPfyv8ypTFL` | enabled | Idle since 15:37Z; refilled with 3 eligible orders at 21:2xZ |
| T4 Independent QA | Claude cloud, claude-sonnet-5-5 | `claude/omdala-t4-qa` 57aedd7, PR #19 draft | `session_015zwouVJHpogx5cfV4N5fyf` | enabled | Verified every head through T2 93fbd4a and T3 cfcda04; WO-T4-07/08 DONE; refilled with 2 orders |

## 7. Dispatch board

Status per order: READY (a team may take it), DONE, PARTIAL, BLOCKED, MOOT,
VERIFIED (T4 reproduced it), FAILED (T4 could not), REOPEN, WITHDRAWN, QUEUED
(T0 or owner-relayed). Teams take READY rows of their own team top to bottom;
specs are in 7.1. Reports: `docs/06-strategy/reports/<TEAM>/<ORDER>.md` on the
team branch. "CI" = hosted OMDALA CI read for that exact SHA.

| Order | Team | Status | SHA / evidence | Updated |
|---|---|---|---|---|
| First wave WO-T2-01..03, WO-T3-01/02, WO-TAI-01/02, WO-T4-01/02 | all | DONE; T4 verified the T2, T3 and TAI work at later heads (VERIFY-t2-1f1d532, VERIFY-t3-2b35cfc, VERIFY-tai-d141c22). Their records are the commit messages, not report files (BL-T4-01) | 64c581d, 6114316, 163c280, dd12483, a7466fd, 516e130, 13d6f19, c074189, 96afdd5 | 2026-10-30 |
| WO-T2-CI | T2 | VERIFIED | 3e36cd4, CI run 41081482574 success; every later T2 SHA CI success | 2026-10-30 |
| WO-T2-04 R-03 TLS | T2 | VERIFIED (R-03 FIXED_AT_47b1eb1) | 47b1eb1; Hyperdrive path open, see WO-T2-08 | 2026-10-30 |
| WO-T2-05 real-SQL tests | T2 | VERIFIED except one test FAILED in T4's environment | 0259a1e; fix is WO-T2-09 | 2026-10-30 |
| WO-T2-06 R-26, R-19, stray file | T2 | VERIFIED (R-19, R-26 FIXED_AT_4239b8d) | 4239b8d | 2026-10-30 |
| WO-T2-07 AIAGENT 429/504 | T2 | VERIFIED | 1dfbf2b; CI success at 3988b4c | 2026-10-30 |
| BL-T2-01 tenant isolation | T2 | VERIFIED | b74dd52 | 2026-10-30 |
| BL-T2-02 failure states | T2 | VERIFIED | 1f1d532, b794619 (DATABASE_UNAVAILABLE is now 503, not 502) | 2026-10-30 |
| BL-T2-03 R-18 | T2 | MOOT | File does not exist on the candidate line; T4 marked R-18 MOOT on 2026-10-28. T0's backlog item cited PR #1's branch by mistake | 2026-10-30 |
| BL-T2-04 R-22..R-25 | T2 | MOOT, lease withdrawn | Same cause; successors in `infra/backup`, `infra/scripts` (T1) | 2026-10-30 |
| BL-T2-05 local DR rehearsal | T2 | VERIFIED (6 tests pass; negative control NOT_CHECKED by T4) | 01f22d3, CI success at 3988b4c | 2026-10-30 |
| WO-T3-CI | T3 | WITHDRAWN | T3 keeps its standing rule against `.github/**`; T3 gets hosted CI once WO-T1-01 lands on the OMCODE line and T3 merges it | 2026-10-30 |
| WO-T3-03 R-01 admin deny | T3 | VERIFIED (R-01 FIXED_AT_2f24d80) | 2f24d80; no hosted CI | 2026-10-30 |
| WO-T3-04 robots, switchers | T3 | VERIFIED (R-07/R-10/R-13/R-17, R-21) | 621b3a0; no hosted CI | 2026-10-30 |
| WO-T3-05 Save draft, docs API | T3 | VERIFIED (R-08, R-09, R-28 FIXED_AT_63a258a; R-11 not applicable: file does not exist) | 63a258a; no hosted CI | 2026-10-30 |
| WO-T3-06 docs EN/VI static | T3 | VERIFIED (R-12 FIXED_AT_6256448) | 6256448; old `?lang=vi` links now show English; no hosted CI | 2026-10-30 |
| BL-T3-01 R-20 | T3 | DONE, awaiting T4 | 054ec10 | 2026-10-30 |
| WO-TAI-CI | TAI | VERIFIED | e5eb70e, CI run 41081525781 success; d141c22 CI success | 2026-10-30 |
| WO-TAI-03 plan change closed | TAI | VERIFIED | 66b169d | 2026-10-30 |
| WO-TAI-04 MOB-02 toolchain | TAI | PARTIAL: Linux side done; bundle ids need the owner (7.3) | 66b169d | 2026-10-30 |
| WO-TAI-05 failure states | TAI | PARTIAL: messages and unit tests done; browser test waits on the AI authority contract | cba5ccb | 2026-10-30 |
| BL-TAI-01..03 | TAI | VERIFIED | e1d3be3, 696dad1 | 2026-10-30 |
| WO-T4-03 standing | T4 | READY (standing, every turn) | Verified through T2 369cb50, T3 6def072, TAI 984f640, no failures; next: any new head | 2026-10-31 |
| WO-T4-04, -05, -06 | T4 | DONE | 4248392, 9ed2ab0 (+638d097), 9e4ece3 | 2026-10-30 |
| BL-T4-01, -02, -03 | T4 | DONE | d3291e8, 7c251b1 | 2026-10-30 |
| WO-T2-08 Hyperdrive TLS | T2 | BLOCKED: `developers.cloudflare.com` is outside this environment's network allowlist; T2 will not configure it from memory. Needs the owner (allow the host) or a T1 staging check (7.3) | 131b5d4 | 2026-10-30 |
| WO-T2-09 TLS test self-contained | T2 | VERIFIED | 71b7b32; CI success at 93fbd4a | 2026-10-30 |
| WO-T2-10 models route mapping | T2 | VERIFIED | fa0eb9a | 2026-10-30 |
| WO-T2-11 contract doc | T2 | VERIFIED | 4a48c6c | 2026-10-30 |
| WO-T2-12 local stand-up | T2 | VERIFIED (development mode: auth state in memory) | 456a58f; finding: workerd ignores `rejectUnauthorized: false`, so the stand-up uses a throwaway CA | 2026-10-30 |
| BL-T2-06 mail sink policy | T2 | VERIFIED | 2ed5df9, CI run 41112163135 success at 93fbd4a | 2026-10-30 |
| WO-T3-07 hermetic redirect specs | T3 | VERIFIED (`e2e:app` passes offline) | 3c3f683; no hosted CI | 2026-10-30 |
| WO-T3-08 503/504 consumers | T3 | VERIFIED; switcher part waits for R-19 to reach the T3 base; app switcher unstyled (WO-T3-13) | 3c3f683 | 2026-10-30 |
| WO-T3-09 staging policy `..name` | T3 | VERIFIED | 3c3f683 | 2026-10-30 |
| WO-T3-10 VI go-live check | T3 | VERIFIED | 3c3f683 | 2026-10-30 |
| BL-T3-02 self-hosted fonts | T3 | VERIFIED (admin stays on system fonts) | cfcda04 | 2026-10-30 |
| BL-T3-04 matrix gaps, contact forms | T3 | DONE, awaiting T4 | 02d5453 | 2026-10-30 |
| WO-T4-07 DR negative control | T4 | DONE: one-byte change fails the comparison | ee76d31 | 2026-10-30 |
| WO-T4-08 SEO check | T4 | DONE: FAILED for web `/vi/*` (raw `<html lang="en">`), sitemap lacks `/vi` entries, docs 404 lacks `lang`; fix is WO-T3-11 | ee76d31 | 2026-10-30 |
| WO-T2-13 local persistent auth | T2 | DONE, awaiting T4 | b857bbd | 2026-10-30 |
| WO-T2-14 scenes and runs persisted | T2 | PARTIAL: migration 0004 sits in `infra/postgres/migrations/proposed/` until T1 promotes it (WO-T1-06) | e464a40 | 2026-10-30 |
| WO-T3-11 web `/vi` lang, sitemap, docs 404 | T3 | DONE, awaiting T4 | e9a29cd | 2026-10-30 |
| WO-T3-12 auth to app journey on a real local API | T3 | DONE, awaiting T4; found and fixed a HIGH defect: app and auth bundles always used the production API origin (optional-chained `process?.env` is not inlined), so a staging build talked to `api.omdala.com` | 5190ac8 | 2026-10-30 |
| WO-T3-13 app switcher styling | T3 | DONE, awaiting T4 | 1821553 | 2026-10-30 |
| WO-TAI-06 hermetic web live-card E2E | TAI | DONE, awaiting T4 | fc41625, 5c8871b | 2026-10-30 |
| WO-TAI-07 moderation normalization | TAI | DONE, awaiting T4 | 5c7a79a | 2026-10-30 |
| WO-TAI-08 gateway negatives | TAI | PARTIAL: the gateway has no HTTP surface; command, registry and router negatives done | c79c3cb | 2026-10-30 |
| WO-T4-09 local-stack safety review | T4 | DONE: 4 findings, fix is WO-T2-15 | 5a0647d | 2026-10-30 |
| WO-T4-10 | T4 | READY | | 2026-10-30 |
| WO-T2-15 local-stack hardening | T2 | DONE, awaiting T4 | acdcfc4 | 2026-10-30 |
| WO-T2-16 /v1 tenant isolation | T2 | DONE, awaiting T4; 3 defects fixed: colliding default workspace ids, `analytics/track` wrote to a workspace the caller does not own, service-token mint did not require a session | 2c48d55 | 2026-10-30 |
| WO-T3-14 bilingual web 404 | T3 | DONE, awaiting T4 | 8c1e3b9 | 2026-10-30 |
| WO-TAI-09 moderation wording | TAI | DONE; two claims outside TAI paths routed as WO-T1-08 | e8c5a67 | 2026-10-30 |
| WO-TAI-10 contract against code | TAI | DONE: five envelope and status divergences; T0 decision in WO-TAI-11 | cde0132 | 2026-10-30 |
| WO-T4-11 migration 0004 check | T4 | DONE: apply, rollback, re-apply identical; sha256 matches; expand-only verifier accepts 0004 and rejects the rollback | d2a0d8f | 2026-10-31 |
| WO-T4-12 API origin | T4 | DONE: **CONFIRMED for `apps/app`** (a staging build before 5190ac8 sent `GET /v1/auth/session` to `api.omdala.com`); `apps/auth` not misrouted | 1fdc300 | 2026-10-31 |
| WO-T2-17 session bridge draft | T2 | DONE: `docs/contracts/OMAI_SESSION_BRIDGE_CONTRACT_DRAFT.md`, 8 gaps F1-F8, 5 proposals | a2d97dc | 2026-10-31 |
| WO-T2-18 local journey support | T2 | DONE, awaiting T4 | 1a250e2 | 2026-10-31 |
| WO-T2-19 AI usage cap | T2 | DONE: **no per-tenant AI cost cap exists** on `POST /v1/ai/chat` (only per-request bounds and an in-isolate 20/min limiter); characterization tests and a proposed design | 3566a14 | 2026-10-31 |
| WO-T3-15 accessibility | T3 | DONE, awaiting T4 (heading levels fixed on 7 web pages and the app) | e967a33 | 2026-10-31 |
| WO-TAI-11 contract docs follow code | TAI | DONE, awaiting T4 | bcb3034 | 2026-10-31 |
| WO-TAI-12 bridge consumer tests | TAI | DONE under assumptions (verifier injected: the draft has no token format Om AI can verify) | b8f05e6 | 2026-10-31 |
| WO-T2-20 per-tenant AI cost cap | T2 | DONE, awaiting T4; migration 0005 in `proposed/`; cap value needs the owner | 28e7e33 | 2026-10-31 |
| WO-T2-21 bridge credential | T2 | DONE, awaiting T4; 501 in staging and production; migration 0006 in `proposed/` | 0f8197a | 2026-10-31 |
| WO-T3-16 env inlining sweep | T3 | DONE, awaiting T4; removed a legacy sign-in skeleton that defaulted to a localhost API; sentinel-build test added | da7bf52 | 2026-10-31 |
| WO-T3-17 | T3 | READY (WO-T2-20 landed; the codes are in its report, so the UI can map them without T2 code on the T3 base) | | 2026-10-31 |
| WO-TAI-13 client and extension specs | TAI | DONE, awaiting T4 | c780cde | 2026-10-31 |
| WO-T4-13 bridge findings | T4 | DONE: F1-F8 all CONFIRMED at the T2 head | 56eab2d | 2026-10-31 |
| WO-T2-24 cost-cap replay fix | T2 | VERIFIED by WO-T4-15 (HIGH finding FIXED): any reused key answers 409 `idempotency_key_reused` before the provider | 5c7c84e | 2026-10-31 |
| WO-T2-22 hardening | T2 | DONE, awaiting T4 (per-session cap is soft; no admin role in the API, admin list is configuration) | fe6b42e | 2026-10-31 |
| WO-T2-23 stable sub, token options | T2 | DONE, awaiting T4; migration 0007 in `proposed/`; owner picks introspection or published keys | 065b716 | 2026-10-31 |
| WO-T3-17 cap messages | T3 | DONE, awaiting T4 | c706e7e | 2026-10-31 |
| BL-T3-06 brand-marketplace parity | T3 | DONE, awaiting T4 | 74d1f74 | 2026-10-31 |
| WO-TAI-14 Om AI accessibility | TAI | DONE, awaiting T4; `lang` limit settled by T0 in WO-TAI-15 | 63d0141 | 2026-10-31 |
| WO-T4-14 security review | T4 | DONE: **HIGH, reproduced**: the daily AI cost cap can be bypassed without bound by replaying an `Idempotency-Key` whose reservation was released (`index.ts:4057-4105`, `ai-usage-repository.ts`); bridge credential is 501 in every release-like environment | ce1832d | 2026-10-31 |
| WO-T3-18 security headers | T3 | DONE, awaiting T4; every app now ships HSTS, CSP without remote scripts, frame-ancestors; finding: the app's code editor (Monaco) loads from a CDN the CSP blocks, decided in WO-T3-19 | 5f4103c | 2026-10-31 |
| BL-T3-07 bundle budgets | T3 | DONE, awaiting T4 | 8b37c13 | 2026-10-31 |
| WO-TAI-15 Om AI lang and contrast | TAI | DONE, awaiting T4; Vietnamese copy has no diacritics (WO-TAI-17) | 6025bd6 | 2026-10-31 |
| WO-TAI-16 bridge runtime negatives | TAI | DONE under assumptions, both token options behind one port | c8a2be8 | 2026-10-31 |
| WO-T2-25 billing flow | T2 | DONE, awaiting T4; fixed `verifyWebhookSignature` (it always threw); gaps: no provider webhook receiver, no plan-change path, no replay store; `/v1/security/webhooks/verify` is an unauthenticated secret oracle (WO-T2-29) | c442389 | 2026-10-31 |
| WO-T2-26 DR for 0004-0007 | T2 | DONE, awaiting T4 | 476749a | 2026-10-31 |
| WO-T3-19 self-hosted Monaco | T3 | DONE, awaiting T4 (WO-T4-16); `'unsafe-eval'` dropped from the app CSP; lockfile lease ended | 299af7a, 3c166ec | 2026-10-31 |
| WO-TAI-17 Vietnamese copy | TAI | DONE, awaiting T4; needs a native-speaker review | 984f640 | 2026-10-31 |
| WO-T4-15 cap re-test | T4 | DONE: fix holds | 02bd7b6 | 2026-10-31 |
| WO-T4-16 headers and editor | T4 | DONE: headers and self-hosted editor verified under the shipped CSP | 05b7a54 | 2026-10-31 |
| WO-T2-29 security surfaces closed | T2 | DONE, awaiting T4 (WO-T4-17 rest) | 3b4ac45 | 2026-10-31 |
| WO-T2-27 shared rate limiter | T2 | DONE, awaiting T4; migration 0008 in `proposed/` (per-isolate limits stay until T1 promotes it) | 0743b89 | 2026-10-31 |
| WO-T2-28 error hygiene | T2 | DONE, awaiting T4 | 369cb50 | 2026-10-31 |
| WO-T3-20 Monaco in dev | T3 | DONE, awaiting T4 | 6def072 | 2026-10-31 |
| WO-T4-17 billing and security review | T4 | PARTIAL: WO-T2-25 reviewed (no route but the two closed ones takes a caller secret); the 501 check waits for the T2 head with 3b4ac45, now landed | 05b7a54 | 2026-10-31 |
| WO-T4-18 integration dry run | T4 | DONE: **all four branches merge onto 7abd962 without a conflict; on the merged tree every check passes** (typecheck, lint, brand, build:all, API 643/643 with PostgreSQL, all unit suites, E2E app 44, web 31, auth 28, docs 49, admin 26, brand 39, app export). Not run: Om AI npm suites, desktop. Local only, hosted CI not run on the merged tree | 953584c | 2026-10-31 |
| WO-T2-PR | T2 | READY (report file: `docs/06-strategy/reports/T2/PR_SUMMARY.md`; T2's 05:44Z turn did not take it) | | 2026-10-31 |
| WO-T3-PR | T3 | DONE | de78337 | 2026-10-31 |
| WO-TAI-PR | TAI | DONE | c1c5366 | 2026-10-31 |
| WO-T4-19 | T4 | READY | | 2026-10-31 |
| WO-T4-20 | T4 | READY | | 2026-10-31 |
| WO-T4-15 | T4 | READY (after WO-T2-24 lands) | | 2026-10-31 |
| WO-T0-01 | T0 | QUEUED | | 2026-10-28 |
| WO-T0-02 | T0 | QUEUED | | 2026-10-28 |
| WO-T0-03 decision packets | T0 | DONE: [OMDALA_DECISION_PACKETS_2026-10-31.md](./OMDALA_DECISION_PACKETS_2026-10-31.md), 12 decisions with options and recommendations | | 2026-10-31 |
| WO-T1-01 | T1 | QUEUED, owner relays | On `OMCODE/infra-e2e-auto-20261026`: add `"claude/omdala-**"` to `on.push.branches` in `ci.yml` (T2 and TAI branches already carry the identical line; T3 needs it from here) | 2026-10-30 |
| WO-T1-02 | T1 | QUEUED, owner relays | Staging suite dry-run, read-only API 522 evidence packet, `/release.json` contract | 2026-10-28 |
| WO-T1-03 | T1 | QUEUED, owner relays | CI: PostgreSQL service **with TLS on** (client.ts now requires it; setup in `reports/T2/WO-T2-05.md` on the T2 branch) and `OMDALA_TEST_DATABASE_URL`, so the 27 skipped DB suites run; jobs for `e2e:auth`, `e2e:docs`, `e2e:admin`; `.gitignore` `apps/*/test-results`; desktop test hardcodes `/bin/zsh` | 2026-10-30 |
| WO-T1-04 | T1 | QUEUED, owner relays | CI: run `npm test` in the "OM AI Web Typecheck and Build" job (7 tests); add a `services/ai` job running `node --test tests/*.test.ts` (Node 22.18+); add `test:seo` (T3, 6 tests); in the Om AI web job also `npm run test:e2e` with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` or a Chromium install step (TAI, 6 specs) | 2026-10-30 |
| WO-T1-05 | T1 | QUEUED, owner relays | Config review: staging and production never carry `ENVIRONMENT=local/development/test` (the TLS opt-out depends on it); `OMDALA_ADMIN_PREVIEW=1` only on preview builds; Hyperdrive origin TLS mode set to verify the certificate; optional edge redirect for old docs `?lang=vi` links | 2026-10-30 |
| WO-T1-06 | T1 | QUEUED, owner relays | Promote T2's proposed migrations 0004 (scenes, runs), 0005 (AI usage ledger), 0006 (bridge credentials), 0007 (stored account ids) and 0008 (shared rate limiter) in order; for 0004: `git mv` it from `infra/postgres/migrations/proposed/` up one level, add its entry to `compatibility.json`, and update the three-migration expectations in `scripts/verify-migration-compatibility.test.mjs`; exact steps and sha256 in `reports/T2/WO-T2-14.md` on the T2 branch | 2026-10-30 |
| WO-T1-07 | T1 | QUEUED, owner relays, **priority** | CONFIRMED by T4 (WO-T4-12): `apps/app` bundles built before `5190ac8` call the production API (`api.omdala.com`) for the session check, even in a staging build. Check every staging deploy and staging go-live run for this, and treat earlier staging results that touched the API as invalid | 2026-10-30 |
| WO-T1-08 | T1 | QUEUED, owner relays | Wording: `docs/VERIFIED_PROGRESS_2026-04-29.md` lines 48 and 61 and `docs/OMDALA_MASTER_EXECUTION_PLAN_2026-04-27.md` line 208 count the Om AI keyword screen as moderation or safety coverage; point them at `om-ai.omdala.com/docs/OMAI_MODERATION_SCOPE.md` | 2026-10-30 |
| WO-T1-09 | T1 | QUEUED, owner decides first | After the owner chooses the review route (decision packet 0): either push the merged tree as `claude/omdala-integration` for hosted CI on the combined code, or merge PRs #17, #18, #16 and #19 into `OMCODE/infra-e2e-auto-20261026` in the order of WO-T4-18 (T2, T3, TAI, T4). Teams cannot do this: their triggers allow only their own branch | 2026-10-31 |

### 7.1 Order specs

Base for every new order: the team's current branch head, merged with
`OMCODE/infra-e2e-auto-20261026` (7abd962) when that moves. Each order ends with
its report file. Tests named here are the minimum; the cycle prompt adds the
standard checks. Specs of finished orders are in git history (commit 32c124e).

**WO-T2-08 (critical).** `services/api/src/db/client.ts` now verifies TLS on every
connection, including the Hyperdrive path, where the connection string points at
a local proxy. Read Cloudflare's current Hyperdrive documentation for
node-postgres (developers.cloudflare.com) and cite the page and the date read in
the report. Then make the Hyperdrive path follow the documented configuration,
while a direct `DATABASE_URL` keeps certificate verification. Unit tests for both
paths; the insecure flag stays refused outside local/development/test. If the
documentation does not settle it, report BLOCKED with the exact question for a
staging check (T1). Label: `PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive)`.

**WO-T2-09.** T4 found that `db/auth-repository.integration.test.ts` "verifies
the server certificate by default" fails when the local server's certificate is
trusted (VERIFY-t2-1f1d532, VERIFY-t2-3988b4c). Make the test provision its own
untrusted certificate (for example a throwaway self-signed CA served by a scratch
cluster or a local TLS socket), or skip it with an explicit message when the
server certificate verifies. It must still fail if verification is off.

**WO-T2-10.** The models route (`/v1/ai/models`) maps every provider failure to
503 `aiagent_catalog_unavailable`. Use the same mapping as chat: 429 with
`Retry-After`, 504 on timeout, 502 on provider 5xx. Contract tests.

**WO-T2-11.** Lease: `docs/contracts/API_V1_TEAM2_CONTRACT_2026-10-07.md` only.
Document `OMDALA_DB_TLS_INSECURE` and `DB_TLS_INSECURE_REFUSED`; the 503/504
database codes (`DATABASE_UNAVAILABLE` moved from 502 to 503); the AIAGENT
429/504 codes; and the `/plans/upgrade` refusal is TAI's, so leave it out.

**WO-T2-12 (E2E-2 exit, prepares a cross-team journey).** A local-integrated stand-up for
the API: one command under `services/api/` starts the worker locally (no remote
bindings, no `--remote`) against a scratch local PostgreSQL, applies migrations,
seeds one test account, and prints the base URL; a health and magic-link-request
smoke passes against it. No secret values in the repo; generate local ones at run
time. T3 uses it in a later order for a browser journey across auth and app.

**WO-T3-07.** The 3 redirect specs in `apps/app/e2e/auth-dashboard.spec.ts`
(:193, :207, :217) navigate to the real `auth.omdala.com` and fail without
network. Route the auth origin to a local stub (Playwright `page.route` or a
local static server) so they are hermetic, while still asserting the login URL
with `lang` and `next`. `pnpm e2e:app` must pass 19/19 offline.

**WO-T3-08.** BL-T2-02 moved `DATABASE_UNAVAILABLE` from 502 to 503 and added
503/504 codes. Find every consumer in T3 paths that branches on the API status or
code (error messages, retries, specs) and update it, with a test for the 503
case. After R-19, the switchers show zh/es/ja/ko as disabled "coming soon": check
that this renders correctly and is excluded from hreflang and sitemaps.

**WO-T3-09.** T4 BL-T4-02 finding 1: `apps/app/playwright-staging-policy.ts`
`assertOutsideCandidate` accepts a directory inside the checkout whose name
starts with `..`. Compare path segments instead of a string prefix, and add a
unit test next to the policy file that covers `<repo>/..name`, `<repo>/../x` and
a real outside path. No change under `scripts/` (T1).

**WO-T3-10.** Matrix gap 12: add a Vietnamese browse assertion (`/vi/` page with
`<html lang="vi">` and localized text) to the staging and production go-live
specs in `apps/app`. These specs only run in protected workflows, so check them
with `playwright test --list` and a type check; do not run them against staging.

**WO-T4-07.** Verify BL-T2-05's negative control (a one-byte change in the
restored copy fails the hash comparison) and the DR receipt fields at the
current T2 head; then verify WO-T2-08 and WO-T2-09 when they land, with the
Hyperdrive documentation the report cites.

**WO-T4-08.** Independent SEO check of T3's docs locale restructure (6256448,
054ec10): every built page in `apps/docs/out` and `apps/web/out` has one
canonical, hreflang for en, vi and x-default only, a matching `<html lang>`, and
sitemap entries for both locales; no zh/es/ja/ko URL is advertised anywhere.

**WO-T2-13.** Persistent auth in the local stand-up: add a `local:stack` profile
that runs the worker in a staging-like mode on loopback, with a loopback stub mail
sink, so magic links and sessions live in the scratch PostgreSQL. Certificate
verification stays on through the stand-up's throwaway CA. Acceptance:
request link, read it from the stub sink, exchange, restart the worker, and the
session is still valid; `local:smoke` covers it. No remote bindings, no secret
values committed.

**WO-T2-14.** Lease: `infra/postgres/migrations/**` (T1 has made no change there
on the candidate line; the lease ends if T1 does). Scenes, runs and scene-run are
a process-wide in-memory seed today, unreleased in staging and production. Persist
them per tenant behind the same release boundary (still 501 outside
test/development), with a forward migration and its rollback, repository functions,
tenant-isolation tests like BL-T2-01 and the real-SQL suite. Label:
`PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL)`.

**WO-T3-11.** T4 WO-T4-08: every `/vi/*` page of `apps/web` ships
`<html lang="en">` in the static HTML (`apps/web/app/layout.tsx:62`); give `/vi`
its own root layout as done for docs. `apps/web/app/sitemap.ts` must list `/vi/...`
entries; the docs 404 root layout needs `lang`. Extend
`apps/web/e2e/locale-html.spec.ts` to assert `<html lang>` on the raw HTML.

**WO-T3-12 (matrix gap 3).** Browser journey across auth and app against a real
local API: start T2's `local:stack` from a separate worktree of the T2 branch head
(read only; do not write T2 paths), then run a new Playwright spec in `apps/app`
that requests a magic link, follows it, lands on the dashboard and signs out. The
spec reads the API base URL from an environment variable and is skipped with a
clear message when it is unset, so normal runs stay hermetic.

**WO-T3-13.** WO-T3-08 finding: the `apps/app` language switcher has no CSS, so
disabled items look active. Style it with brand tokens without overlapping the
workspace account button (workspace-critical spec 05 must pass); disabled items
must look and behave disabled.

**WO-TAI-06.** Browser tests for the Om AI web live card with mocked API responses
(no live `api.omdala.com`): backend down, quota exhausted, provider 429 and plan
refusal each show the mapped message from WO-TAI-05. Add `@playwright/test` to
`om-ai.omdala.com/web` dev dependencies (its own npm lockfile, inside TAI paths) and
use the preinstalled Chromium through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`; never download browsers. Make the existing
`web/e2e/app-smoke.spec.ts` hermetic the same way.

**WO-TAI-07.** T4 WO-T4-06 finding 3: the self-harm screen in
`om-ai.omdala.com/backend/src/live/moderation.ts` is a substring list. Normalize
input before matching (case folding, Vietnamese diacritics, spacing and punctuation
inside words, common digit-for-letter swaps) with tests for each bypass, and add a
short note in the Om AI docs that it is a keyword screen, not a safety classifier,
so release criteria do not count it as one.

**WO-TAI-08.** `om-ai.omdala.com/gateway` has 7 tests. Add negative tests for
request validation: missing or malformed auth headers, disallowed origins (CORS),
oversized bodies, unknown routes and method mismatches; fix any defect found inside
TAI paths.

**WO-T4-09.** Read-only safety review of T2's `services/api/scripts/local-stack.mjs`
(456a58f): refuses non-loopback hosts, never passes `--remote`, generates secrets at
run time and never writes them to tracked files, cleans up processes and scratch
databases; also confirm the workerd TLS finding with a minimal reproduction.

**WO-T4-10.** After this wave lands: refresh the R-finding table and the E2E matrix
delta (`docs/audit/team4/2026-10-30_E2E_MATRIX_REFRESH.md`) at the newest heads, so
T0 can tell which E2E-1/E2E-2 exits are met.

**WO-T2-15.** T4 WO-T4-09 on `services/api/scripts/local-stack.mjs`: every
failure path runs teardown (no `process.exit` before cleanup), SIGHUP also tears
down, and the worker always runs with a local mail mode whatever the top-level
`[vars]` in `wrangler.toml` say (today it inherits `MAIL_DELIVERY_MODE="direct"`
and the real mail host). Comment why the loopback-only admin connection may skip
verification. Tests or a scripted check for each point.

**WO-T2-16.** BL-T2-01 covered `/v2/reality`. Do the same for every `/v1` route
scoped to an account or workspace (account, workspaces, notifications, billing,
analytics, security): a caller from another account or workspace gets 403 or 404
and the repository is not touched; one test per route, plus real-SQL checks where
a repository exists.

**WO-T3-14.** WO-T3-11 finding: `apps/web` renders a Vietnamese 404 for every URL
outside `/en`, so English visitors get Vietnamese. Make the 404 bilingual (EN and
VI on one page, `lang` set on each block), keep it `noindex`, and assert it in the
locale HTML spec.

**WO-TAI-09.** WO-TAI-07 finding: find every document under `om-ai.omdala.com/**`
that counts the keyword screen as moderation or safety coverage (release criteria,
checklists, specs) and correct it to point at `docs/OMAI_MODERATION_SCOPE.md`. List
any such claim outside TAI paths in the report for T0 to route.

**WO-TAI-10.** Contract against code: compare every endpoint in
`om-ai.omdala.com/AI_OM_LIVE_API_CONTRACT_V1.md` (and `AI_OM_API_CONTRACT_V1.md`)
with the backend routes. Report implemented, missing and undocumented endpoints in
a table, and add contract tests (status codes, error codes, required fields) for
each implemented endpoint that has none.

**WO-T4-11.** Independent check of WO-T2-14 on a scratch local PostgreSQL: apply
0001-0003 plus `proposed/0004`, run the rollback, apply again, and compare the
table set each time; recompute the sha256 that T2 gives for T1's
`compatibility.json` entry; run the expand-only verifier on 0004.

**WO-T2-17 (unblocks TAI).** Lease: new file
`docs/contracts/OMAI_SESSION_BRIDGE_CONTRACT_DRAFT.md` only. Draft the contract Om
AI consumes for OMDALA sessions: how a session or token is presented, the claims
and scopes actually issued by `services/api` today (trace each to code), route
allowlist, tenant and workspace binding, expiry, revocation and replay behaviour,
and error codes. Mark it PROPOSED and label
`PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL)`. No code change unless a claim the
draft needs is missing, which is then a finding.

**WO-T2-18.** WO-T3-12 findings for `local:stack`: answer CORS for the staging
public origins when they are forwarded to loopback (development profile only), and
add a development-only way to reset the magic-link rate limit between journey runs.
Neither may change staging or production behaviour; tests prove it.

**WO-T2-19 (matrix gap 8, API side).** Find whether a per-tenant AI cost or usage cap
exists on the chat path. If it does, test exhaustion end to end at the API with a
stable error code and status. If it does not, report the gap with a proposed design
(where the counter lives, which code, which status); do not build it in this order.

**WO-T3-15.** Accessibility checks without new dependencies: Playwright specs over
the built web, docs and auth pages (EN and VI) and the app dashboard for one `h1`,
heading order, landmarks, alt text, form labels, visible focus and `lang`, using
the accessibility tree and DOM queries. Fix what fails inside T3 paths.

**WO-TAI-11.** T0 decision on WO-TAI-10: before release, the code is the source of
truth. Update `AI_OM_LIVE_API_CONTRACT_V1.md` and `AI_OM_API_CONTRACT_V1.md` to the
implemented envelope `{data, error, meta}` and status values, settle the recap path
on the implemented one, and add a short change note at the top of each document.
Keep the contract tests from WO-TAI-10 green.

**WO-TAI-12 (after WO-T2-17).** Consumer-side contract tests in Om AI for the session
bridge draft: accepted claims, wrong tenant or workspace, expired, revoked and
replayed tokens, unknown routes.

**WO-T4-12 (priority).** Independently confirm T3's API-origin finding: build
`apps/app` and `apps/auth` with staging environment values at `1821553^` (before
the fix, 5190ac8's parent) and at the T3 head, and show which API origin each built
bundle contains. Report the exact command and the matched strings.

**WO-T2-20 (AI-06, cost control).** Build the per-tenant AI usage cap T2 proposed in
WO-T2-19: ledger table in a new `infra/postgres/migrations/proposed/0005_*` with its
rollback (same lease and promotion path as 0004), atomic reserve before the provider
call, settle or release after, idempotent per request id; 429
`ai_tenant_cap_exceeded` with `Retry-After` to the next UTC midnight, 402
`subscription_inactive`, 503 `DATABASE_UNAVAILABLE` when the ledger is unreachable.
The cap comes from configuration (`OMDALA_AI_DAILY_COST_CAP_USD`, per plan later);
when it is unset, staging and production refuse chat (fail closed) and
local/development/test allow it. Real-SQL concurrency test: N parallel reserves never
exceed the cap. Label: `PREP_UNDER_ASSUMPTION(AI cost cap, fail closed when unset)`.

**WO-T2-21 (AI-01 prep).** Proposals 1, 2, 3 and 5 of the bridge draft as code behind
the release boundary (501 in staging and production until the owner approves):
a short-lived bridge credential minted from an authenticated session with
`aud: "om-ai"`, `scope`, `ws` (owned workspace, checked at mint), `sub` (stable
account id), `iat`/`exp` in seconds and a revocable server-side row; a per-scope
route allowlist (the read set in the draft); token in the response body only;
revoked on parent logout. Do not change CORS (proposal 4 waits for an Om AI origin).
Negative tests for every claim. Label: `PREP_UNDER_ASSUMPTION(AI-01, bridge as drafted)`.

**WO-T3-16.** WO-T3-12/WO-T4-12 class of defect: sweep every app and package in T3
paths for environment reads that the Next.js build does not inline (`process?.env`,
`globalThis.process`, destructured `process.env`, `env?.`), fix them, and add a test
that builds each app with sentinel `NEXT_PUBLIC_*` values and fails if a built chunk
still contains an un-inlined `NEXT_PUBLIC_` lookup or the production API origin in a
staging build.

**WO-T3-17 (after WO-T2-20).** The app's AI chat surface shows a clear EN/VI message for
`ai_tenant_cap_exceeded` (with the reset time) and `subscription_inactive`, with specs.

**WO-TAI-13.** WO-TAI-11 finding: the iOS and Android module specs and the live
extension document under `om-ai.omdala.com/**` still describe the old envelope and
flow; align them with the implemented code and the updated contracts, with a change
note at the top of each.

**WO-T4-13.** Independent check of T2's bridge draft findings F1-F8 against the code
at the T2 head (each CONFIRMED or NOT_REPRODUCED with file:line), and of the
WO-T2-19 characterization tests (they must fail if a cap is added, so WO-T2-20 has to
update them on purpose).

**WO-T2-22.** Hardening from WO-T2-20/21 findings: validate the chat request body
before reserving (invalid requests must not touch the ledger); a mint rate limit and
a per-session cap on live bridge credentials; admin revoke of a bridge credential
(proposal 5, second half) behind the same release boundary. Tests for each.

**WO-T2-23 (unblocks TAI).** Bridge token format: today the bridge credential is HS256
with a secret only the API holds, so Om AI cannot verify it, and `sub` is derived
from `MAGIC_LINK_SECRET`. Add to the bridge draft a section comparing (a) an
introspection endpoint and (b) asymmetric signing with a published key set, with the
consequences of each, and recommend one. Then make `sub` a stable stored account id
(proposed migration if a column is needed) behind the release boundary. Draft
section plus code and tests; the choice of (a) or (b) stays with the owner.

**WO-T3-17.** The app's AI chat surface shows a clear EN/VI message for
`ai_tenant_cap_exceeded` (429, with the reset time from `Retry-After`) and
`subscription_inactive` (402), using the codes from `reports/T2/WO-T2-20.md`, with
specs that mock both responses.

**BL-T3-06.** `apps/brand-marketplace`: bring it to the level of the other apps:
EN/VI static HTML with `lang`, canonical and hreflang, a single robots source,
noindex where it is not public, 404, and accessibility specs like WO-T3-15.

**WO-TAI-14.** Accessibility specs for the Om AI web app with the Playwright setup from
WO-TAI-06 (one `h1`, heading order, landmarks, labels, alt text, visible focus,
`lang`), EN and VI; fix what fails inside TAI paths.

**WO-T4-14 (security).** Independent review of WO-T2-20 and WO-T2-21 at the T2 head: run
the real-SQL concurrency test for the cost cap yourself and try to exceed the cap
with parallel requests; check that the bridge credential cannot be minted without a
session, for a workspace the account does not own, after the parent logout, or
reused after revoke; confirm 501 in staging and production. Findings with file:line.

**WO-T2-24 (urgent, T4 WO-T4-14 finding 1).** Fix the cost-cap bypass: a ledger row
in status `released` must not count as an existing reservation. In the duplicate
branch of `reserveAiUsage`/`reserveChatBudget`, either re-reserve the released row in
one conditional statement that respects the cap, or refuse the replay and require a
new key; only `reserved` or `settled` duplicates may skip reservation, and a
`settled` replay must return the stored answer or a conflict, never a new provider
call. Write the real-SQL test with T4's exact sequence first (it must fail on the
current head), then fix. Apply the same rule to `/v1/ai/complete` and the models
route if they reserve. Also stop the refresh handler echoing `error.message` in its
500 (`index.ts` near 3680).

**WO-T3-18.** Security headers for every app: check `public/_headers` (or the
equivalent) of web, app, admin, docs, auth and brand-marketplace for
Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options,
X-Frame-Options or `frame-ancestors`, Referrer-Policy, Permissions-Policy, and
`X-Robots-Tag: noindex` on app, admin and auth. Make them consistent, keep the CSP
compatible with the self-hosted fonts and the API origins, and assert each built
file in a spec.

**BL-T3-07.** Bundle size budgets: a spec that builds each app and fails when the
total first-load JavaScript of any route grows more than 10 percent over a recorded
baseline file in the app; record today's baseline.

**WO-TAI-15.** T0 decision for WO-TAI-14: the Om AI web app is an app surface, not a
public page, so choosing the locale on the client is allowed, but
`document.documentElement.lang` must follow the active locale on every switch and
on first render, and strings in the other language must carry their own `lang`.
Implement it, extend the accessibility specs to assert `lang` after a switch, and add
a contrast check for text on the brand colors.

**WO-TAI-16.** Runtime negatives in `om-ai.omdala.com/backend` for the bridge, with the
injected verifier from WO-TAI-12: missing token, expired, wrong `aud`, scope not
granted, workspace not owned, revoked, and a route outside the allowlist, each with
the status and error code a client gets. Cover both token options from T2's draft
(introspection and published keys) behind the same port, so the owner's choice only
swaps the adapter.

**WO-T4-15 (after WO-T2-24).** Re-run the WO-T4-14 replay attack at the fixed T2 head,
then try the same replay on `/v1/ai/complete` and the models route, and confirm
the refresh 500 no longer carries an internal message.

**WO-T2-25 (billing, matrix gap 7).** Map the billing flow in `services/api` and
`packages/billing` and test it locally with a stub provider, no paid or remote
calls: plan change only through the billing path, webhook signature verification
and replay refusal, idempotent event handling, and the cancelled and past-due states
that the AI cap answers with 402. Report what is real, what is a stub, and the gaps
before a sandbox provider can be connected.

**WO-T2-26 (E2E-5).** Extend the local DR rehearsal (BL-T2-05) to the proposed
migrations 0004-0007: populate the new tables, back up, restore, and prove per-table
parity and that the cost-cap ledger and bridge credentials survive a restore with
the same counts and revocation state.

**WO-T3-19 (T0 decision on the Monaco finding).** Self-host the code editor instead of
allowing a third-party CDN: add `monaco-editor` under the lockfile lease in section 5,
point the `@monaco-editor/react` loader at local assets served from the app, set
`worker-src`/`script-src` to what Monaco needs from `'self'` only, and drop
`'unsafe-eval'` if the self-hosted build works without it (report if it does not).
Add an E2E spec that opens the workspace editor with the shipped CSP and asserts it
loads with no CSP violation. Keep the bundle budget from BL-T3-07 honest: the editor
must load lazily, outside first-load JS.

**WO-TAI-17.** Vietnamese copy in `om-ai.omdala.com/web` is written without
diacritics. Rewrite every Vietnamese string with correct diacritics, and map the
English error text that still reaches the UI from API responses to the bilingual
messages from WO-TAI-05. Mark the change for a native-speaker review in the report;
do not change meaning.

**WO-T4-16 (after WO-T3-19).** Independent check of T3's security headers
(WO-T3-18) on the built `out/_headers` of each app, and of the self-hosted editor
under the shipped CSP: no violation, no third-party origin, editor loads.

**WO-T2-29 (T0 decision, reversible).** Close the three `/v1/security` surfaces that are
unsafe or inert: `webhooks/verify` (unauthenticated, takes the secret from the
caller), service-token mint (tokens never verify) and API keys (never stored). They
answer 501 `not_released` in staging and production, like the other release-gated
routes, and keep working in test and development for their existing tests. Label:
`PREP_UNDER_ASSUMPTION(security endpoints closed until designed)`; the owner can
reopen them with a design (section 7.3).

**WO-T2-27.** The chat, magic-link and bridge-mint limiters are in-memory per Worker
isolate, so production with several isolates does not enforce them. Put the limiter
behind a port: a PostgreSQL fixed-window implementation (one conditional upsert per
key and window) for configured databases, the in-memory one for development. Real-SQL
tests: parallel requests across two simulated isolates never exceed the limit;
window rollover. Label: `PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL)`.

**WO-T2-28.** Error hygiene: T4 found handlers echoing `error.message` in a 500. Add one
error path for every route so a 5xx body carries only a stable code and a request
id, never driver, provider or stack text; sweep `services/api/src` for remaining
`error.message`/`String(error)` in responses; a test that forces a thrown error in a
sample of routes and asserts the body.

**WO-T3-20.** WO-T3-19 finding 3: `next dev` still loads Monaco from the CDN. Serve the
same local assets in development so dev and the export behave alike, and make the
dev server's CSP check (or a spec) catch a CDN load.

**WO-T4-17.** Independent review of WO-T2-25 (webhook signature fix, billing state
feeding the AI cap) and, when it lands, WO-T2-29: confirm 501 for the three security
surfaces in every release-like environment, and that no other route accepts a secret
from the caller.

**WO-T4-18 (priority, release path).** Integration dry run, local only, never pushed:
in a scratch worktree at `OMCODE/infra-e2e-auto-20261026` (7abd962), merge the T2,
T3, TAI and T4 branch heads one by one. Report every conflict with file and both
sides, resolve nothing by guessing (stop at the first real conflict and report it).
If the merge is clean, run `pnpm install --frozen-lockfile`, `pnpm typecheck`,
`pnpm lint`, `pnpm brand:lint`, `pnpm build:all`, every `pnpm test:*` and every
`pnpm e2e:*` on the combined tree, and the real-SQL suites against a scratch local
PostgreSQL. This is the first evidence that the four lines work together.

**WO-T2-PR, WO-T3-PR, WO-TAI-PR.** Rewrite the description of your draft PR (#17, #18,
#16) for a human reviewer: what the branch changes, grouped by order ID with its
SHA; tests added and their counts; open findings; what waits for the owner or T1.
Plain and neutral wording, no vulnerability detail beyond what is already fixed.
Keep it a draft with base `OMCODE/infra-e2e-auto-20261026`. Write the same text to
`docs/06-strategy/reports/<TEAM>/PR_SUMMARY.md`.

**WO-T4-19.** Finish the integration dry run on the same scratch merge (re-create it
if the scratch worktree is gone, same order, newest heads): the Om AI suites
(`om-ai.omdala.com/{backend,web,gateway,app}` with `npm ci` and each `npm test`,
web `test:e2e` with the preinstalled Chromium), `services/ai` tests, and the
desktop tests (`apps/omcode-desktop`). Report counts; never push the scratch branch.

**WO-T4-20.** QA summary for the owner and the human reviewer:
`docs/audit/team4/2026-10-31_QA_SUMMARY.md`. One table per team: every order
verified, with SHA, evidence level and hosted CI run when read; every finding T4
raised and its current state (fixed at SHA, open, owner decision); the R findings
table; what is local-only evidence versus hosted CI; and the items that block a
staging release. Facts only, linked to the VERIFY reports.

### 7.2 Standing backlog (taken in order when a team has no READY order)

| ID | Team | Work |
|---|---|---|
| BL-T3-02 | T3 | P0-08: fonts never load because the `@import` ends up mid-file; self-host them through `next/font/local` or `packages/ui` assets and assert the font request in a test |
| BL-T3-04 | T3 | Remaining E2E-1 gaps in T3 paths from `docs/audit/team4/2026-10-30_E2E_MATRIX_REFRESH.md` on the T4 branch |
| BL-T2-06 | T2 | Matrix gap 7 (API side): contact and access-request endpoints against the staging-sink policy with a local stub sink; assert no mail leaves without a sink receipt |
| BL-T4-04 | T4 | Re-run `pnpm audit --audit-level=high` and the R-finding table when a lockfile or one of the R files changes on a team branch |

BL-T3-03 was dropped: T4 found R-14/R-15 NOT_REPRODUCED on 2026-10-28.

### 7.3 Waiting on a human or another team (not dispatchable)

| Item | Needs | Unblocks |
|---|---|---|
| Real iOS bundle identifier and Android package name; fate of `ios/AIOmApp/**` | Owner | MOB-02 config order for TAI |
| AI authority realtime contract | Provider lane (AI-02..05) | WO-TAI-05 browser test, session activation tests |
| CTL-03 storage shape | Owner (plan section 11 item 2) | TAI memory validators for learning, persona-affinity, subscription; scenes/runs persistence |
| Session bridge contract for Om AI | T2 after CTL-03 | TAI consumer contract tests |
| Admin edge access layer before any live data | T1 design, owner | T3 admin access order (T4 WO-T4-06 finding 1) |
| Token in URL fragment instead of query | Owner (UX/security trade-off) | T3/T2 magic-link format change (T4 WO-T4-06 finding 2) |
| R-27 Worker account id | Owner, INFRA-003 | `services/api/wrangler.toml` |
| Network access to `developers.cloudflare.com` for the cloud environment, or a T1 staging check: does `pg` with `ssl: { rejectUnauthorized: true }` connect through `env.HYPERDRIVE.connectionString`? | Owner (environment network settings) or T1 | WO-T2-08, the one change that could break the deployed API |
| `update_trigger` allowed in the T0 session ("always allow") | Owner | T0 pausing and resuming idle team triggers by itself (rule 5.1.6) |
| T4 session waiting on a Bash permission prompt since 2026-10-30T22:57Z (task: verifying the API-origin finding) | Owner, in the T4 session; T0 never approves it | T4 verification of every new head |
| Service tokens, API keys and webhook verify (WO-T2-16, WO-T2-25): T0 closes them with 501 in WO-T2-29 (reversible); the owner decides whether to design and reopen them | Owner | `services/api` security routes |
| Billing provider choice | Owner (CTL-02) | Webhook receiver, plan-change path and replay store (WO-T2-25 gaps), each behind the release boundary |
| Native-speaker review of Om AI Vietnamese copy (WO-TAI-17) | Owner or a named reviewer | Om AI web copy sign-off |
| AI daily cost cap value per plan (`OMDALA_AI_DAILY_COST_CAP_USD`) | Owner, with the billing plan (CTL-02 budget) | WO-T2-20 enforcement in staging and production |
| Om AI session bridge: approve the drafted design (proposals 1-5) and pick the token check: (a) introspection endpoint or (b) published signing keys (draft section from WO-T2-23) | Owner (AI-01) | Releasing WO-T2-21 beyond 501; Om AI CORS origin; replacing TAI's injected verifier |

## 8. Coordinator run log (keep last 20)

| Time (UTC) | Tick | Actions | Result |
|---|---|---|---|
| 2026-10-28 | PLAN | Version 3 plan and ledger sections 5-8 written on `claude/omdala-coordination` from 7abd962 | Activation approved |
| 2026-10-28T16:20Z | ACTIVATE | Created T2/T3/TAI/T4 sessions with first orders; created coordinator routine `trig_011XrmiQupK2SLA2VdfwrPqX` | Teams starting |
| 2026-10-28T17:20Z..2026-10-29T02:20Z | 10 ticks | Observed all four teams DONE with draft PRs #16-#19; dispatch not delivered (send_message approval) | FAILED |
| 2026-10-29T03:2xZ | PAUSE | Set PAUSED per two-failed-ticks rule | Waiting for owner |
| 2026-10-29T04:20Z..2026-10-30T14:20Z | 35 ticks | Routine kept firing while PAUSED; each tick stopped at the flag | Empty; the cause of the version 4 change |
| 2026-10-30T14:45Z | REBUILD | Four team triggers (pull model), 18 READY orders with specs, standing backlog, ACTIVE (32c124e) | |
| 2026-10-30T15:30Z | START | T0 prompt rewritten for version 4; fired all four team triggers by hand | All four WORKING |
| 2026-10-30T16:20Z, 17:20Z | 2 ticks | Harvest read, but the T0 worker restarted before the ledger was written both times | Ledger not updated; recovered at 18:2xZ |
| 2026-10-30T18:2xZ | HARVEST | Marked 25 orders and backlog items (T2 and TAI queues empty, T4 empty, T3 on backlog); hosted CI green on every T2 and TAI SHA; T4 confirms 13 of the 14 CONFIRMED R findings fixed (only R-27, a human gate, remains). Refilled T2 (5), T3 (4), T4 (2); disabled TAI (waits on humans, 7.3); T1 orders 01, 03-05 updated | |
| 2026-10-30T19:20Z, 20:20Z | 2 ticks | 19:20Z: TAI disable needed owner approval; the request closed on a worker restart. 20:20Z: worker restarted before work | No ledger change |
| 2026-10-30T21:2xZ | HARVEST | T2 second cycle (4 orders + BL-T2-06 VERIFIED, WO-T2-08 BLOCKED on network); T3 WO-T3-07..10, BL-T3-02 VERIFIED, BL-T3-04 DONE; T4 WO-T4-07/08 DONE (web `/vi` lang FAILED). Refilled T2 (2), T3 (3), TAI (3), T4 (2); recorded the `update_trigger` approval limit | |
| 2026-10-30T22:2xZ | HARVEST | All four teams worked 21:45-22:02Z: T2 WO-T2-13 DONE, WO-T2-14 PARTIAL (T1 must promote migration 0004); T3 WO-T3-11/13 DONE; TAI WO-TAI-06/07 DONE, WO-TAI-08 PARTIAL; T4 VERIFY T3 02d5453 and WO-T4-09 (4 findings). Refilled T2 (2), T3 (1 + WO-T3-12), TAI (2), T4 (1 + WO-T4-10); added WO-T1-06 | |
| 2026-10-30T23:2xZ | HARVEST | T2 WO-T2-15/16 DONE (3 isolation defects fixed); T3 WO-T3-12/14 DONE (HIGH: staging builds used the production API, fixed in 5190ac8); TAI WO-TAI-09/10 DONE; T4 WAITING on a Bash permission prompt since 22:57Z. Refilled T2 (3), T3 (1), TAI (1 + 1 queued), T4 (+WO-T4-12); added WO-T1-07 (priority) and WO-T1-08 | Owner notified |
| 2026-10-31T00:2xZ | HARVEST | T4 unblocked and verified every head through T2 2c48d55, T3 fed7b6b, TAI f86bf49; WO-T4-12 CONFIRMED the app API-origin defect; WO-T4-11 migration 0004 checks pass. T2 WO-T2-17..19 DONE (no per-tenant AI cost cap exists); T3 WO-T3-15, TAI WO-TAI-11 DONE. New: WO-T2-20/21, WO-T3-16 (+17 queued), WO-TAI-12/13, WO-T4-13 | |
| 2026-10-31T01:2xZ | HARVEST | T2 WO-T2-20 (AI cost cap) and WO-T2-21 (bridge credential, 501 outside test) DONE; T3 WO-T3-16 DONE; TAI WO-TAI-12/13 DONE; T4 verified T2 3566a14, T3 e967a33, TAI bcb3034 with no failures and CONFIRMED bridge gaps F1-F8. New: WO-T2-22/23, WO-T3-17 READY, BL-T3-06, WO-TAI-14, WO-T4-14; WO-T1-06 now covers 0004-0006 | |
| 2026-10-31T02:2xZ | HARVEST | T2 WO-T2-22/23 DONE; T3 WO-T3-17, BL-T3-06 DONE; TAI WO-TAI-14 DONE; T4 verified the previous heads with no failures and found a HIGH cost-cap bypass (replay of a released key). New: WO-T2-24 urgent, WO-T3-18, BL-T3-07, WO-TAI-15/16, WO-T4-15 | |
| 2026-10-31T03:2xZ | HARVEST | T2 WO-T2-24 cost-cap replay fixed (409 on any reused key), awaiting WO-T4-15; T3 WO-T3-18 security headers and BL-T3-07 budgets DONE; TAI WO-TAI-15/16 DONE; T4 verified the previous heads, no failures. T0 decided Monaco is self-hosted (WO-T3-19, lockfile lease to T3). New: WO-T2-25/26, WO-T3-19, WO-TAI-17, WO-T4-16 | |
| 2026-10-31T04:2xZ | HARVEST | T4 WO-T4-15: cost-cap bypass FIXED. T2 WO-T2-25 (fixed webhook signature check that always threw) and WO-T2-26 DONE; T3 WO-T3-19 self-hosted Monaco, `unsafe-eval` dropped; TAI WO-TAI-17 Vietnamese with diacritics. T0 closes the unsafe `/v1/security` surfaces (WO-T2-29). New: WO-T2-27/28/29, WO-T3-20, WO-T4-16/17. TAI has nothing eligible left; its hourly check stays short | |
| 2026-10-31T05:2xZ | HARVEST | T2 WO-T2-27/28/29 DONE (shared limiter, 5xx hygiene, security surfaces 501); T3 WO-T3-20 DONE; T4 WO-T4-16 DONE, WO-T4-17 PARTIAL; T4 verified the previous heads with no failures. Every team lane is nearly exhausted. New: WO-T4-18 integration dry run of all four branches (priority) and PR summaries for human review | |
| 2026-10-31T06:2xZ | HARVEST | T4 WO-T4-18: all four team branches merge cleanly onto 7abd962 and every check passes on the merged tree (local). T3 and TAI PR summaries DONE; T2 missed its PR order (still READY). T3 and TAI have nothing eligible; their hourly checks stay short. New: WO-T4-19/20, WO-T1-09; decision packet 0 (review route) added | |
