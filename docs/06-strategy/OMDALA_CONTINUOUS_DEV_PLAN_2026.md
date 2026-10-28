# OMDALA CONTINUOUS DEV PLAN 2026

Version 2.0, consolidated 2026-10-28 (Asia/Ho_Chi_Minh).
Execution state: [DEV_LEDGER.md](./DEV_LEDGER.md).
**AUTOMATION: PAUSED. Staging E2E: OPEN. Production: HOLD.**

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

The user's current authorization is manual consolidation, commit/push of this
patch and exact-SHA CI verification on the candidate branch. It does not activate
version 1's brand-branch routine or grant unrestricted OMCODE writes.
Do not import the old branch-hardcoded `scripts/dev-cycle.sh`.

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
   not a fabricated success or source churn.

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
