# OMDALA Remaining Teams Execution Plan

Date: 2026-05-09
Scope: Omdala.com only
Status: Active
Cadence: automation every 45 minutes

## Verdict

`REMAINING_TEAM_WORK_PACKETS_ACTIVE`

## Current True State

- Release gate remains `GO`
- Public bilingual audit remains `20/20`, `0` blocking
- Git-isolation packet is complete and approval-gated
- Brand v2.0 demo lane is still open because evidence closure is incomplete
- The highest-value remaining work is now split between:
  - Team 1: approval-gated Git decision support and repo-truth maintenance
  - Team 2: docs/admin/report reconciliation inside Omdala.com scope
  - Team 3: release truth, blocker truth, founder review evidence packaging

## Team 1 Work Packet

Owner:
- Git hygiene / repo-health lane

Current allowed work:
- keep `docs/OMDALA_GIT_ISOLATION_RECOMMENDATION_2026-05-08.md` current
- keep startup-truth docs aligned if Git status changes
- run read-only repo-health checks when a new hypothesis appears
- do not execute the Git isolation step without explicit founder approval

Definition of done for Team 1:
- either founder approves the narrow two-ref Git isolation step and it is executed/verified
- or the Git blocker is explicitly parked and no further safe incremental work remains

## Team 2 Work Packet

Owner:
- docs/admin/report reconciliation

Current allowed work:
- tighten founder-facing docs where evidence is missing or ambiguous
- remove stale coordination wording if it conflicts with current truth
- improve Omdala.com-only scoping in team/admin documentation
- support the brand v2 review lane with documentation cleanup only

Do not do:
- historical Omniverse cleanup
- backend, auth, payment, legal, or database work outside explicit Omdala.com scope

Definition of done for Team 2:
- no active Omdala.com coordination doc is stale, ambiguous, or contradicts current truth

## Team 3 Work Packet

Owner:
- release truth and founder review evidence

Current allowed work:
- maintain `GO` release truth unless a new verified blocker appears
- maintain the brand founder review packet:
  - `docs/OMDALA_V2_FOUNDER_REVIEW_CHECKLIST_2026-05-09.md`
- package the three remaining brand evidence gaps:
  - remote push confirmation
  - preview/render evidence
  - explicit pre-existing build-error separation note

Definition of done for Team 3:
- founder can review the brand v2 lane from one clean packet with explicit evidence attached

## Cross-Team Order

1. Keep Git work parked behind approval unless a new safe read-only insight appears.
2. Push Team 2 and Team 3 toward brand v2 evidence closure, because that is the main non-destructive remaining surface.
3. Only reopen Git execution if explicit approval arrives.

## 45-Minute Automation Rule

Every run should:

1. Read:
   - `docs/PROJECT_CONTEXT_ENGINE.md`
   - `docs/OMDALA_AUTONOMOUS_DEV_15M_PLAN_2026-05-07.md`
   - `docs/OMDALA_STOP_THE_BLEEDING_EXECUTION_BOARD_2026-05-04.md`
   - `docs/PROJECT_EXECUTION_BOARD.md`
   - this file
2. Prefer non-destructive work on the remaining team packets.
3. Only touch the Git isolation lane if:
   - a new read-only verification step is available, or
   - explicit founder approval arrives.
4. Update the active board with any meaningful state change.

## Hard Stop

Do not:

- touch Omdalat.com
- execute Git isolation without explicit founder approval
- claim completion while brand v2 evidence gaps remain open
