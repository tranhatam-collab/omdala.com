# OMDALA CONTINUOUS DEV PLAN 2026

Version 3.0, 2026-10-28 (Asia/Ho_Chi_Minh): adds executors and path ownership for
every team, the coordination protocol, the E2E-to-release sequence, gap closures,
the Founder decision queue and the first work-order wave (sections 7-12).
Version 2.0 consolidated the inventory earlier the same day; sections 1-6 keep it.
Execution state: [DEV_LEDGER.md](./DEV_LEDGER.md).
**AUTOMATION: ACTIVE (activation packet 8.1 approved by the owner 2026-10-28). Staging E2E: OPEN. Production: HOLD.**

## 1. One entrypoint and provenance

This is the canonical planning entrypoint on the candidate branch
`OMCODE/infra-e2e-auto-20261026`. It consolidates:

- The [version 1 plan](https://github.com/tranhatam-collab/omdala.com/blob/c3108c944bafd4e53415a8e49e8df508a7db0597/docs/06-strategy/OMDALA_CONTINUOUS_DEV_PLAN_2026.md)
  and [original ledger](https://github.com/tranhatam-collab/omdala.com/blob/c3108c944bafd4e53415a8e49e8df508a7db0597/docs/06-strategy/DEV_LEDGER.md),
  read from `claude/omdala-brand-system-L4Gzx`, not from main. Original plan
  blob: `58ba6632caeb0041783079600f5da959e592d349`.
- Local ecosystem audit/runbook dated 2026-10-28 and Infra-to-E2E plan dated
  2026-10-26, including their latest session-31 correction. Those documents
  remain historical receipts, not competing execution plans.
- The verbatim [96-work-order inventory](./OMDALA_ECOSYSTEM_REMAINING_WORK_2026-10-28.csv)
  and [103-ID execution crosswalk](./OMDALA_ECOSYSTEM_LEGACY_EXECUTION_CROSSWALK_2026-10-28.csv).

This consolidation is source documentation, not a merge of either branch into
main, an approval of proposed ADRs, or permission to restart a scheduler.
Consumers on other branches must adopt this version explicitly; publishing it
does not rewrite their files or prove that their schedulers are disabled.

Precedence: signed current decisions and exact-environment receipts > verified
source/remote evidence > this plan and explicit user scope > historical reports.
Conflicting requirements stay open until the responsible owner resolves them.

## 2. Scope and accounting

The user expanded planning to the whole ecosystem: core surfaces and Desktop,
provider/AIAGENT, OM-AI, Omone, mobile, memory/storage, and eight consumers.
This supersedes version 1's *planning exclusion* of Omone/Computer and full
OM-AI/mobile; it does not authorize implementation or production release.
Omniverse's signed PARKED decision remains in force unless explicitly superseded.
Other previously deferred Beta features require owner-approved disposition.

| Inventory | Count | Interpretation |
|---|---:|---|
| Work orders | 96 | 72 control/product/release + 24 consumer obligations |
| Execution classes | 43 / 35 / 18 | AUTO_PREP / APPROVAL / INDEPENDENT |
| Legacy rows | 103 | 100 requirements + 3 rollups, not 103 additional tasks |
| Infra contracts | 20 | INFRA-00..19; acceptance obligations, not extra work orders |
| FINAL gates | 18 | Historical packet must be rebased to current identities |
| Consumer stages | 24 | Eight consumers, each source/contract -> integration -> acceptance |

The CSV holds package dependencies, acceptance criteria, source mappings and
execution status. The ledger holds decisions, run receipts and evidence levels.
Keep these roles separate: do not create a second independently counted backlog.
No package has been accepted merely because its source preparation or tests pass.
This is an inventory of known obligations, not an implementation audit of every
repository. CTL-01/08 and per-product audits must close that gap; new work changes
the denominator only with a recorded reason and version.

| Lane | Packages | Remaining acceptance |
|---|---:|---|
| Control | 8 | Source authority, finite scope, owners, ADRs, approvals/protections, inventory, legacy reconcile |
| Core | 18 | Host/private DB/bootstrap/restore, CF/state, Auth/TLS, five surfaces, mail, jobs/data, billing sandbox, UI, E2E/DR/Ops/Desktop |
| Provider | 8 | Clean pins, branch/workflow authority, scoped keys/quota/ledger, signed invocation, own rollback/Ops |
| OM-AI | 10 | Verified-session bridge, live/persona/realtime, metering, recap/memory, safety, account/web, own E2E/Ops |
| Omone | 8 | Canonical baseline, security/Neon CI, isolated resources, farm RLS/Auth/audit, trace journey, DR/Ops, roadmap disposition |
| Mobile | 6 | Source recovery, locked native builds, lifecycle/device negatives, signed beta, store/privacy/billing |
| Memory | 8 | FDR/region/DPA, Vault/schema contracts, Computer current-head proof, isolated runtime, cutover/rollback |
| Release | 6 | API incident, Brand exposure, consolidated packet, separate production GO, canary, final signoff |
| Consumers | 24 | maytinhai.org, tranhatam.com, aiaccountingloop.com, computer.iai.one, aiagent.iai.one, omdala.com, iaiacademy.iai.one, muonnoi.org |

## 3. Preserve version 1 work without importing branch assumptions

These are requirement-level subpackages, **not additional acceptance credit** on
top of the 96 packages. Exact original criteria and the 28 R-01..R-28 review
obligations remain in the immutable sources in section 1. Their old findings are
REPORTED_UNVERIFIED on this candidate until reproduced; do not copy fixes or
claims from the other branch. No review finding is silently closed.

| Original ID | Retained requirement / threshold | Parent work orders |
|---|---|---|
| P0-01 | Unique correct canonical/title for ten web pages; honor noindex; inspect built output | CORE-12/18 |
| P0-02 | Redirect validation, verified DB TLS, deny-by-default admin; real unit tests | CORE-06/10/18 |
| P0-03 | Disposition all 28 review findings as FIXED/OPEN/MOOT_ON_CANONICAL/HUMAN_GATE with reproductions | CTL-07/08, CORE-18 |
| P0-04 | SQL relative includes/error propagation, HTTP failure handling, cleanup/check ordering; shellcheck | CORE-03/04/10 |
| P0-05 | Honest Save draft UX, non-permissive E2E, tests call real code, docs match implemented API | CORE-10/12/18 |
| P0-06 | Single robots source, actual supported locales, correct alternates, query-preserving language switcher | CORE-12 |
| P0-07 | Blocking API tests in source CI, without modifying deploy workflows | CORE-18 |
| P0-08 | Self-host Inter 400-700 and Sora 600-700; loaded on four apps; zero Google Fonts requests | CORE-12 |
| P0-09 | Brand gate covers rgba, short hex, named colors with explicit neutral allowlist | CORE-12/18 |
| P0-10 | Reproducible port map for every original branch change group; do not blindly import | CTL-01/08, CORE-18 |
| P0-11 | Classify all markdown at pinned SHA; reverse-reference safe-to-move check; frozen evidence remains frozen | CTL-07/08 |
| P0-12 | Read-only Dependabot PR #14/#15 triage, current diff/checks/risk; human merge | CORE-18 |
| P1-01 | Pin approved integration base/branch and establish baseline health before editing | CTL-01/04 |
| P1-02 | Resolve token ownership across brand-core/ui; one source and passing brand gate | CORE-12/18 |
| P1-03 | Shared language components retain server [lang]/cookie behavior and E2E | CORE-12 |
| P1-04 | Consolidate brand checks into one blocking source CI gate | CORE-18 |
| P1-05 | Docs index/moves only where safe; governance passes and frozen manifest hashes preserved | CTL-07/08 |
| P1-06 | Reconcile agent/source policies without weakening authority | CTL-01/08 |
| P1-07 | Review packet with evidence, risks and merge order; PR only with separate permission | CTL-04, REL-03 |
| P2-01 | All surface release identities and semantic 404 behavior | CORE-07/13 |
| P2-02 | Docs ten required routes and eighteen compatibility redirects, EN/VI, SEO tests | CORE-12/18 |
| P2-03 | Route-difference inventory first; implementation requires D-004 | CTL-08, CORE-12 |
| P2-04 | Per-surface canonical/hreflang/robots/sitemap/noindex CI coverage | CORE-12/18 |
| P2-05 | Axe reports zero serious/critical issues on principal pages | CORE-12 |
| P2-06 | Responsive devices and API/AI failure states with traces | CORE-12/15 |
| P2-07 | Lighthouse mobile >=90 on built output; runtime TTFB separate | CORE-12/17 |
| P2-08 | Durable billing/queue/provider idempotency design and tests, approved data authority first | CORE-10/11, AI-06 |

Version 1's phase-3 human gates map to sections 4/6 below. Its post-Beta backlog
(additional locales, payment UI, native mobile, third parties, white-label,
country hierarchy, Zero Overdue, full OM-AI, Desktop distribution) must be
explicitly scoped or deferred through CTL-08/product owners, never silently
deleted or promoted to an approved release requirement.

## 4. Dependency phases and human gates

| Phase | Exit evidence | External prerequisite |
|---|---|---|
| W0 | Sources, finite requirements, owner/interface, architecture/budget, PR route | Named owners and signed decisions |
| W1 | Host/private access, protection, backup/restore foundation | Scoped accounts, trusted host identity |
| W2 | Approved data/Auth/TLS/CF/provider source and product tests | ADR/resource authority before bindings or deploy |
| W3 | Protected main-only exact-SHA five-surface transaction | Independent approval, current CI, restore, scoped authorization |
| W4 | Real Auth/data/AI/mail pilot; independent Team 4 and own product E2E | Test identities, sink, cumulative AI cap <=USD0.25 if authorized |
| W5 | Failure/recovery, DR/rollback and Ops acceptance | Approved sandbox/restore targets, reviewers/on-call |
| W6 | Eight consumer handoffs, native distribution, roadmap/evidence reconciliation | Per-repo scope/owner approvals |
| W7 | Separate immutable production promotion/canary/observation/signoff | Explicit Founder GO per project/candidate/environment |

Actual scheduling follows CSV prerequisites, not table order. AUTO_PREP is not
automatic permission and not necessarily ready now. A blocked owner gate does not
prevent independent authorized source preparation. Never reset a cumulative spend
cap per run. Mock/local/internal E2E is not STAGING_ACCEPTED.

| Original human gate | Canonical obligation |
|---|---|
| H1 integration base/branch/PR authority | CTL-01/04; D-001/002 remain open beyond this explicitly authorized patch |
| H2 independent exact-SHA review | CTL-04/05, CORE-15 |
| H3 canonical account/data authority | CTL-03/06, CORE-02/03/05, MEM-01 |
| H4 isolated staging/topology/budget | CTL-02/03, CORE-01..05 |
| H5 protected environments/rulesets | CTL-05 |
| H6 CF resources and bindings | CORE-05 |
| H7 five-hostname DNS/TLS | CORE-07/13 |
| H8 trusted SSH host key | CORE-01 |
| H9 OAuth/mail | CORE-08/09 |
| H10 clean provider pin/acceptance | AI-01..08 |
| H11 transaction and independent staging acceptance | CORE-13..15 |
| H12 rollback/restore | CORE-04/16 |
| H13 production GO | REL-04..06 |

INFRA-00..19 mapping is carried in the CSV. FINAL gates map as follows:
01 source/packet -> CTL-01/REL-03; 02 provider -> AI lane;
03 review -> CTL-04/05; 04 controls -> CTL-05/06;
05 resources -> CORE-05/13; 06 data/restore -> CORE-02..05/13;
07 identities/DNS/TLS -> CORE-07/13; 08 Auth -> CORE-08;
09 mail -> CORE-09; 10 transaction -> CORE-13..15;
11 independent E2E -> CORE-15; 12 recovery -> CORE-16;
13 SSH/state -> CORE-01/05; 14 OM-AI bridge -> OMAI-02/08;
15 native -> MOB lane; 16 incident -> REL-01;
17 production controls -> REL-04; 18 production promotion/signoff -> REL-05/06.
No current full-contract acceptance is inferred from historical FINAL reports.

## 5. Execution protocol (inactive while PAUSED)

Version 2 authorized only manual consolidation, commit/push and exact-SHA CI
verification on the candidate branch. Version 3 names the activation packet in
section 8.1; scheduled execution starts only after the owner approves that packet
and the ledger records the approval. Do not import the old branch-hardcoded
`scripts/dev-cycle.sh`; unrestricted OMCODE writes are never granted.

Before any later activation, obtain an explicit owner decision naming scheduler,
branch, allowed paths, cadence, permission mode, stop authority and finite scope.
Do not create a second scheduler or auto-approve waiting sessions. Default
permissions stay unchanged. No 24/7 or completion-trigger guarantee is made.

1. Read the plan, ledger, CSV and actual scheduler state. PAUSED or missing ledger
   stops scheduled execution; an explicit manual task does not turn it ACTIVE.
2. Verify repository/HEAD/tree, remote drift, dirty paths, dependencies and scopes.
   Never clean/reset another checkout. Claim one lane with expected SHA, allowed
   paths, outputs and tests; no overlapping writers.
3. Execute one bounded eligible task, verify its actual acceptance shape and
   record failures honestly. Further eligible tasks may run sequentially after
   releasing each claim, not through recursive routines or infinite shell loops.
4. Validate with existing targeted tests/builds; expand only when warranted.
   Restore locked dependencies only after a manifest change or missing-tool
   failure. Check secrets/generated artifacts before a normal commit/push.
5. Bind receipts to SHA and environment. API-read terminal CI for that exact SHA;
   never reuse a green earlier SHA. Do not equate dispatch with completion.
6. Release the claim; persist next action or blocker. No eligible work means idle,
   not a fabricated success or source churn. Version 3 narrows this: a team may
   sit idle only after the coordinator has applied the decomposition, prep-ahead
   and gap rules of section 8.4 and recorded why nothing qualifies.

### Trigger/completion watchdog required before restart

Record scheduler ID, trigger time, actual session ID, observed state, completion
time, terminal result and evidence SHA. A trigger without terminal completion,
including `inputNeeded`, is **WAITING/BLOCKED**, never progress. Do not launch an
overlapping retry; tell the owner which approval is pending without approving it.
Two failed cycles pause execution; any unresolved prior session blocks another
writer on that lane.

Stopping is a two-part operation: set ledger PAUSED **and** request scheduler
disable, then read back `enabled:false` and no next run. Ledger-only pause does
not prove host scheduling stopped. If disable needs approval or is denied, keep
the ledger PAUSED, mark STOP_PENDING/unverified scheduler state, notify the owner,
and launch no more work. A separate watchdog cannot bypass the same permissions.
These are restart requirements, not a claim that a watchdog daemon is installed.

## 6. Evidence, current blockers and completion

Evidence vocabulary: VERIFIED_WORKTREE_ONLY (local dirty bytes);
VERIFIED_HEAD_ONLY (committed/pushed identity with matching local receipt);
VERIFIED_CURRENT (terminal CI readback at exact SHA, only for the checked scope);
REPORTED_UNVERIFIED (received but not independently checked);
NOT_CHECKED, BLOCKED, CONTRADICTED. Record command/toolchain/environment and
receipt location as well as result. A different agent may correctly classify a
local result as REPORTED_UNVERIFIED until it can inspect matching evidence.

Current blockers include unresolved consumer source mappings (maytinhai,
tranhatam, separate AIAGENT consumer, academy), dirty independent checkouts,
named owners/scope/ADRs, independent approval route/protections, provider acceptance
workflow/resources/keys, real Auth/DNS/TLS/mail, private DB/restore and Team 4.
API 522, Brand exposure and cloud inventory are historical reports, not live
probes in this consolidation. No runtime, provider, DNS or database mutation is
authorized here.

Done means all approved finite-scope requirements have exact-identity evidence,
named acceptance and independent review where required; each product and all eight
consumers have their own E2E/DR/Ops/handoff. Deferral requires an owner decision with
ID/reason/phase. Production requires separate protected controls, explicit GO,
immutable promotion, observation and final signoff. Until then: **HOLD**.

## 7. Teams, executors and path ownership

Every package in the CSV has exactly one executing team below. A role named in the
CSV `owner_role` column remains the accountable owner; the team is who does the
work. Before version 3 no lane had a named executor except the local VS Code agent.

| Team | Executor | Writes only to branch | Owns paths (single writer) | Packages |
|---|---|---|---|---|
| T0 Coordinator | Claude cloud session `session_011NjrMT2mFGRNNyxofbXcPX` | `claude/omdala-coordination` | `docs/06-strategy/**` | CTL-01a, CTL-06, CTL-07, CTL-08 prep; C0x-01 drafts; REL-03; dispatch, decision queue |
| T1 Infra and Release | Local VS Code agent, run by the owner | `OMCODE/infra-e2e-auto-20261026` | `infra/**` except `infra/{db,migrations,d1}`, `.github/workflows/**`, `scripts/**`, `services/api/wrangler.toml`, `apps/omcode-desktop/**`, `docs/audit/**` except `docs/audit/team4/**` | CORE-01/02/04/05/07/13/16/17, REL-01/02, Desktop part of CORE-18, E2E-3/5 |
| T2 Core API, Data, Auth, Billing | New Claude cloud session | `claude/omdala-t2-core` | `services/**` except `services/ai/**` and `wrangler.toml`; `packages/{core,types,billing}/**`; `infra/{db,migrations,d1}/**` | CORE-03/06/08 prep/10/11, MEM-05, P2-08, E2E-2/4 API |
| T3 Web, Product UI, Docs, Mail templates | New Claude cloud session | `claude/omdala-t3-web` | `apps/{web,app,admin,docs,auth,brand-marketplace}/**`, `packages/{ui,seo,brand-core}/**`, `content/**` | CORE-09 templates, CORE-12, web part of CORE-18, P0-01/05/06/08/09, P2-01..07, E2E-1 |
| TAI Om AI, Provider contract, Mobile source | New Claude cloud session | `claude/omdala-tai-omai` | `om-ai.omdala.com/**`, `services/ai/**` | AI-01 consumer side, AI-06, OMAI-01..07/10, MEM-04, MOB-01..03 in-repo source |
| T4 Independent QA and Security | New Claude cloud session; never writes product code | `claude/omdala-t4-qa` | `docs/audit/team4/**` only | E2E-0 matrix, P0-03 reproduction, exact-SHA verification of every other team, CORE-15/16 and all INDEPENDENT items as verifier |
| External lanes | Not assigned yet: need repo access and owner confirmation | per repo | per repo | ONE-01..08 (`tranhatam-collab/omone`), AI-02..05 provider repo, MEM-03/06 Computer, MOB-04..06 devices/stores, C0x-02 consumer repos |
| Founder and named owners | The owner | — | — | Every APPROVAL item and final GO; decision queue in section 11 |

Lane coverage: control → T0 (approvals Founder/repo admin); core → T1/T2/T3, T4
verifies; provider → TAI and provider repo owner, T4 verifies; om-ai → TAI, T1 Ops,
T4 verifies; omone → external lane, T4 verifies; mobile → TAI source, devices/stores
human; memory → Founder/Counsel decisions, T2/TAI fixtures and schemas, Computer owner;
release → T1/T0/Founder; each consumer → T0 drafts, external owner integrates, T4 verifies.

Shared files: `pnpm-lock.yaml`, root `package.json`, `tsconfig.base.json` and
`pnpm-workspace.yaml` change only under a lockfile lease that T0 grants to one team
at a time. Any work order that needs another team's paths is split or reassigned.

## 8. Coordination protocol

### 8.1 Activation packet (approved 2026-10-28; recorded in ledger section 5)

Owner choices: four cloud teams on `claude-sonnet-5-5` with the coordinator on
`claude-opus-5-5`; draft PRs allowed (D-002); prep-ahead allowed with labels;
T1 stays with the local VS Code agent.

| Item | Proposal |
|---|---|
| Scheduler | One routine, "OMDALA coordinator", firing hourly into the T0 session. Teams have no triggers of their own; T0 wakes them with messages only when it has an order |
| Branches | Section 7 only. Never `main`, `feat/*`, `OMCODE/*` (T1 alone writes its branch), never PR #10's head |
| Allowed paths | Section 7 |
| Cadence | T0 hourly; each team holds at most one order at a time; at most four cloud teams running concurrently |
| Permission mode | Inherit the T0 session's mode. Nothing auto-approves a pending prompt. A team that waits on a prompt is WAITING/BLOCKED (section 5 watchdog) |
| Stop authority | The owner ("dừng", or `AUTOMATION: PAUSED` in the ledger). T0 then disables the routine and reads back `enabled:false`; circuit breaker after two failed cycles of the same team |
| Finite scope | AUTO_PREP work, prep-ahead under 8.4, E2E-0..E2E-6. Never deploy, DNS, secrets, remote databases, provider keys, merges, approvals, GitHub settings or paid calls. Draft PRs only if D-002 allows |

### 8.2 Coordinator tick (hourly)

1. Preflight: ledger flag, `git fetch`, read plan, ledger and CSV.
2. Observe every team: session status, branch head, terminal CI for that exact SHA,
   PR state. Record WORKING, DONE, WAITING (prompt pending) or FAILED with times.
3. Verify: every new team SHA goes to T4 for independent verification before T0
   raises its evidence level. CI green alone is VERIFIED_CURRENT for CI scope only.
4. Re-plan with 8.4 and give each idle team exactly one self-contained order:
   work-order ID, parent package, base SHA, paths, acceptance, tests, stop rules,
   report format.
5. Founder queue: refresh section 11. Unattended ticks never call AskUserQuestion
   (it would block like `inputNeeded`); they notify once per new decision.
6. Write the run record and commit only when state changed. A tick that finds
   nothing new ends without commit or message: no "no change" reports.

### 8.3 Team cycle (one order)

1. Fetch; rebase the team branch onto the current T1 head when clean, else report
   the conflict and stop.
2. Do only the order, only inside owned paths.
3. Run the verification set of the candidate line (`pnpm typecheck`, `pnpm lint`,
   relevant `pnpm test:*`, `pnpm test:release-governance`, `pnpm brand:lint`, the
   affected `pnpm e2e:*`, `pnpm build:all` when UI changes), plus the order's own checks.
4. Scan the staged diff for secrets; commit with attribution; push the team branch.
5. Report in at most eight lines: order, SHA, commands and results, evidence level,
   next blocker. T0 reads CI itself; the team never claims green CI it did not read.

### 8.4 Dispatch rules: no idle, no repetition, no rigidity

- Rank eligible orders by unblock value on the critical path (section 4), then risk,
  then cost. Work that unblocks many packages goes first.
- Decompose blocked packages: when a package is blocked by one part, split off the
  part that can proceed (example: CTL-01a remote pins from cloud vs CTL-01b local
  checkout reconciliation on the owner's machine).
- Prep ahead: AUTO_PREP work whose only blocker is an APPROVAL item may proceed
  under the recommended option of a PROPOSED ADR, labelled
  `PREP_UNDER_ASSUMPTION(<decision>, <option>)`, kept reversible, never counted as
  acceptance, and re-checked when the decision is signed.
- Gap fill: a team with nothing eligible in its lane gets E2E or test gaps from the
  E2E-0 matrix inside its own paths, then decision-packet preparation.
- No repetition: an order that already produced a result is not reissued unless
  its inputs changed (new SHA, new decision, failed verification). Re-running an
  unchanged green suite is not work.
- Idle is allowed only after all of the above, with the reason recorded.
- Adapt: T0 changes order content, team assignment and concurrency every tick.
  Changing the routine's own schedule needs owner approval of the update.

### 8.5 Budget and safety controls

At most four concurrent cloud teams; one order per team; about 60 minutes per
order; T0 lowers concurrency when the five-hour usage window reports pressure.
Two failed cycles of one team pause that team; two failed T0 ticks pause
everything. Stopping follows the two-part rule in section 5.

## 9. E2E-to-release sequence

Coverage at 7abd962 (Playwright specs): App 3 local + 1 staging go-live (4
scenarios) + 1 production go-live; Brand Exchange 3; Web 1; Om AI web 1;
**Auth 0, Admin 0, Docs 0**. Unit/integration test files: API 19, Desktop 9,
Om AI app 8, backend 4, gateway 1, billing 3, core 1, scripts 38, infra 20.

| Stage | Work | Team | Exit evidence | Parent IDs |
|---|---|---|---|---|
| E2E-0 | Matrix: every surface × journey (browse EN/VI, magic link, expiry, revoke, replay, wrong tenant, dashboard CRUD, billing sandbox, mail sink, AI call under cap, failure states, DR) × environment (local-mock, local-integrated, staging, production) with existing test IDs and gaps | T4 | Every cell covered/gap/N-A with file references | CORE-12/15/18 |
| E2E-1 | Close local journey gaps for every surface, first Auth, Admin, Docs | T3, TAI | New specs green locally and in CI at exact SHA | CORE-12, OMAI-07 |
| E2E-2 | API and data integration locally: real PostgreSQL in the container, D1 local emulation, tenant-isolation and auth-lifecycle negatives | T2 | Suites green; schema bootstrap from empty volume | CORE-03/08/10 |
| E2E-3 | Staging suite readiness: four scenarios parameterized by exact SHA, fail-closed preflight, receipt writer, dry-run against a local stand-in | T1, T4 reviews | Dry-run receipt; preflight rejects missing origin/identity | CORE-13/15 |
| E2E-4 | Failure and recovery: API down, AI down, quota exhausted, mail sink failure, expired session, network loss | T2, T3, TAI | Specs green; user-visible states verified | CORE-12, AI-06, OMAI-06 |
| E2E-5 | DR rehearsal on a local scratch database: backup, decrypt, restore, byte-compare, rollback capsule dry-run | T1, T2 | Local rehearsal receipt; scripts fail loudly | CORE-04/16 |
| E2E-6 | Release packet generator: exact-SHA CI runs, E2E JSON, SBOM/provenance, manifest check | T0, T1 | Packet regenerated from SHA alone | REL-03 |
| — | Human gates: CTL-02..05, CORE-01/02/04/05/07 resources, DNS/TLS, AI-02..05, MEM-01/02 | Owners | Signed decisions, read-back receipts | Section 4 |
| E2E-7 | Protected staging transaction at the approved SHA | Authorized operator | CORE-13 receipts | CORE-13 |
| E2E-8 | Independent authenticated staging acceptance | T4 + human reviewer | `STAGING_ACCEPTED` | CORE-15, OMAI-08, ONE-05 |
| E2E-9 | Staging DR drills and Ops acceptance | T1, T4, Ops | Drill receipts | CORE-16/17, ONE-06, OMAI-09 |
| E2E-10 | Production promotion, canary, observation, signoff | Founder GO, operators | REL-04..06 receipts | REL-04..06 |

Every product (Om AI, Omone, mobile, memory) and each of the eight consumers runs
its own E2E-0..E2E-9 within its lane; the table above is the core track.

## 10. Gap closures in version 3

These close gaps in version 2 without changing the 96-package denominator: they
are executors, rules and sub-work of existing packages.

| Gap | Closure |
|---|---|
| No lane had an executor except T1 | Section 7 |
| CTL-01 blocked and gates about twenty packages | Split CTL-01a (remote pins from cloud, T0 now) / CTL-01b (local checkouts, owner's machine) |
| 35 AUTO_PREP packages wait only on approvals | Prep-ahead rule 8.4 |
| Idle on gates, repeated no-change cycles | Rules 8.4 and tick step 6 |
| Auth, Admin, Docs have zero E2E specs | E2E-1 first targets |
| No ordered E2E path to release | Section 9 |
| Team 4 existed only as a role | T4 cloud session; it cannot replace the human independent approval required by CTL-04/05 |
| Repos outside omdala.com have no executor | External lanes: T0 pins remote SHAs, drafts onboarding contracts, and asks the owner before attaching a repo |
| Eight VS Code sessions waiting for input | Owner closes or answers them; T0 never resumes them |
| Founder decisions scattered | Section 11 |
| `ci.yml` runs on push only for `main`, `feat/pricing-promo-engine`, `OMCODE/**` and on PRs only into `main`, so team branches and stacked draft PRs get no hosted CI | WO-T1-01 adds `claude/omdala-**` push and `OMCODE/**` PR triggers; until then team results stay VERIFIED_HEAD_ONLY and T4 re-runs them independently |

## 11. Founder decision queue (ordered by what they unblock)

| # | Decision | Recommended option | Unblocks |
|---|---|---|---|
| 1 | Activation packet 8.1 and D-002 (draft PRs) | Approve; draft PRs stacked on PR #13, no merge | All automated work |
| 2 | CTL-03 data authority (ADR-TEAM2-WAVE0) | PostgreSQL via Hyperdrive for the main API, separate D1 for Omniverse when un-parked | CORE-03/06/07/10, OMAI-02/04, MEM-01; turns prep-ahead into accepted work |
| 3 | CTL-02 named owners, reviewers, pilot scope, budget | Name one owner per lane, Team 4 human reviewer, DigitalOcean pilot budget cap | CORE-01, CORE-11, AI-04, ONE-03, MOB-06 |
| 4 | CTL-04 review route | PR #13 into its base, then PR #10 to `main` after independent exact-SHA review | CTL-05 and everything in W3+ |
| 5 | Staging ADR A0 (DigitalOcean/Cloudflare/Vercel) | Approve DigitalOcean SGP1 pilot with Cloudflare private connectivity, no Vercel surface yet | CORE-01/02 |
| 6 | AI-02 provider default branch and dispatch authority | Name the provider repo default branch as the only dispatch source | AI-03..05 |
| 7 | MEM-01/MEM-02 memory scope, region, counsel | Defer memory runtime from the first pilot unless counsel signs | MEM lane |
| 8 | D-004 app route taxonomy | Node model canonical; places/hosts/experts/communities/events/proofs as node types | P2-03 implementation |
| 9 | Consumer source mapping (maytinhai, tranhatam, AIAGENT consumer, academy) | Confirm the repos T0 proposes from the account's repository list | C0x-01 |

## 12. First work-order wave

| Order | Team | Parent | Work | Acceptance |
|---|---|---|---|---|
| WO-T0-01 | T0 | CTL-01a | Remote pins for omdala.com branches and every candidate repo visible to the account | Table: repo, default branch, head SHA, open PRs, read date |
| WO-T0-02 | T0 | CTL-06 | Names-only inventory of accounts, resources, hostnames and secret names from source | No secret value; every name traced to a file |
| WO-T0-03 | T0 | Section 11 | Decision packets for queue items 2–5 with consequences of each option | One page each |
| WO-T4-01 | T4 | CORE-12/15/18 | E2E-0 matrix at 7abd962 | Every cell classified with file references |
| WO-T4-02 | T4 | P0-03 | Reproduce R-01..R-28 on the candidate | Each CONFIRMED / NOT_REPRODUCED / MOOT with command |
| WO-T3-01 | T3 | CORE-12, E2E-1 | Playwright E2E for Auth (login, magic-link landing, expiry, error states), run through the App's Playwright like `e2e:web`; lease: root `package.json` scripts only, no dependency change | Specs green locally; T1 wires the CI job |
| WO-T3-02 | T3 | CORE-12, E2E-1 | Playwright E2E for Docs and Admin (routes, noindex, EN/VI, 404) | Same |
| WO-T2-01 | T2 | CORE-03, E2E-2 | Schema bootstrap from an empty PostgreSQL volume, migrations forward/rollback | `PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL)`; tests green |
| WO-T2-02 | T2 | CORE-08 prep, E2E-2 | Auth lifecycle negatives against the local worker: expiry, revoke, replay, wrong tenant | Integration tests green |
| WO-TAI-01 | TAI | OMAI-01 | Map Om AI spec to implemented code; nothing counted from spec checkmarks | Mapping with file references and gaps |
| WO-TAI-02 | TAI | OMAI-06 | Moderation, child, family and organization safety tests in the Om AI backend | Tests green; gaps listed |
| WO-T2-03 | T2 | AI-06 | Provider quota, signature and failure contract tests for `services/api/src/aiagent-client.ts` | Tests green |
| WO-T1-01 | T1 | CORE-18 | Relayed to VS Code: in `.github/workflows/ci.yml` add `claude/omdala-**` to push branches and `OMCODE/**` to pull_request branches; no other workflow change | CI runs on a `claude/omdala-*` push and on a draft PR into PR #13's branch |
| WO-T1-02 | T1 | E2E-3, REL-01, CORE-07 | Relayed to VS Code: staging suite dry-run, read-only API 522 evidence packet, surface marker contracts | Per section 9 |
