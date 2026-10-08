# OMDALA Autonomous Dev 15M Plan

Status: Active
Date: 2026-05-07
Scope: Omdala.com only
Execution mode: Continuous heartbeat every 45 minutes
Stop rule: Stop only when the full tracked plan is complete or when 3 consecutive runs produce no meaningful new progress

## Mission

Run Omdala.com development continuously in safe, reviewable increments until the remaining repo-health, governance, and reconciliation work is complete.

This plan does not apply to:

- Omdalat.com
- unrelated external domains
- backend, payment, legal, auth, or database changes outside explicit Omdala.com scope

## Current True State

- Omdala.com is the only active scope in this automation lane.
- Current checkpoint branch is `OMCODE/chore/wip-checkpoint-2026-05-04`.
- Team 3 release-gate truth is `GO`.
- Public bilingual audit truth is `20/20`, `0` blocking.
- The main active blocker is Git hygiene and publish stability, not page-quality regression.
- The local helper plan is not the primary source of truth for this automation lane.
- Remaining active work is centered on Git hygiene recovery, working-tree reconciliation, and keeping governance docs aligned with current truth.
- The narrow Git-isolation recommendation packet is complete; further progress on that blocker now requires explicit founder approval or a shift to another non-destructive Omdala.com task.

## Startup Order

Each run should begin from this sequence:

1. `docs/PROJECT_CONTEXT_ENGINE.md`
2. `docs/OMDALA_AUTONOMOUS_DEV_15M_PLAN_2026-05-07.md`
3. `docs/OMDALA_STOP_THE_BLEEDING_EXECUTION_BOARD_2026-05-04.md`
4. `docs/PROJECT_EXECUTION_BOARD.md`

## Autonomous Run Loop

Every 45 minutes:

1. Read the current plan and true-state docs.
2. Identify the highest-value safe task still open inside Omdala.com scope.
3. Execute it immediately if it is reversible and evidence-backed.
4. Verify with the lightest reliable check.
5. Update the true state, blockers, and next action.
6. Do not claim completion without evidence.

## Current Priorities

### Priority 1

Git hygiene and repo stability

- Keep the Git recommendation packet current, but treat execution as approval-gated now that the packet is complete.
- Do not run destructive cleanup automatically, even with backup coverage in place.
- Prefer read-only triage and tightly scoped reversible actions.

### Priority 2

Governance and coordination truth

- Keep `PROJECT_CONTEXT_ENGINE.md`, `PROJECT_EXECUTION_BOARD.md`, and the stop-the-bleeding board aligned.
- Keep team-facing progress boards locked to Omdala.com-only current-lane scope.

### Priority 3

Surface reconciliation

- Reconcile remaining docs/admin/report changes only when ownership is clear and evidence exists.
- Do not reopen already-green release gates unless a new verified blocker appears.

### Priority 4

Founder-facing Git recommendation

- Use `docs/OMDALA_GIT_ISOLATION_RECOMMENDATION_2026-05-08.md` as the narrow recommendation for any future isolation of the two broken non-canonical side-lane remote refs.
- Keep canonical Omdala.com lanes untouched unless a new verified blocker appears on those lanes.

## Allowed Actions

- Editing Omdala.com docs and governance files
- Running read-only repo-health checks
- Creating reversible backups or quarantines for Git internals after verification
- Updating release/admin evidence

## Forbidden Actions

- Touching Omdalat.com
- Touching unrelated external domain projects
- Blind bulk deletion of source files
- Production deployment without explicit release evidence
- Rewriting technical tokens for text hygiene
- Claiming release-ready or complete without verification

## Completion Criteria

This automation may stop only when all are true:

- No active Omdala.com execution item remains actionable
- The current source-of-truth docs are present and aligned
- Git hygiene no longer blocks normal safe development work, or is explicitly parked behind founder approval with no further safe incremental work pending
- Remaining surface work is either complete or clearly documented as a blocker
- The latest report states a clean true state with no false completion claims
