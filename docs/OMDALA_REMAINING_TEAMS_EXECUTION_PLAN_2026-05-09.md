# OMDALA Remaining Teams Execution Plan

Date: 2026-05-19
Scope: Omdala.com only
Status: Active
Cadence: automation every 33 minutes

## Verdict

`REMAINING_TEAM_WORK_PACKETS_ACTIVE_WITH_P0_BUILD_BLOCKER`

## Current True State

- Release gate is `HOLD` until build integrity is restored
- Current blocker is no longer only Git hygiene; it is build/runtime integrity across Next surfaces
- Mandatory bilingual source files are missing in current repo snapshot:
  - `content/en.json`
  - `content/vi.json`
- Active work is split between:
  - Team 1: P0 build chain and dependency integrity recovery
  - Team 2: bilingual source + EN/VI route parity + SEO parity
  - Team 3: OAuth integration hardening + release evidence truth

## Team 1 Work Packet

Owner:
- Build integrity / repo-health lane

Current allowed work:
- recover deterministic Next build runtime across `apps/web`, `apps/app`, `apps/admin`, `apps/docs`, `apps/auth`
- normalize package manager/workspace consistency
- clean duplicate source/runtime conflicts (`page.js` + `page.tsx`, `layout.js` + `layout.tsx`, duplicate `* 2.*`)
- keep startup-truth docs aligned with measured command output

Definition of done for Team 1:
- all five Next surface builds pass from command line
- no dependency/runtime corruption remains (`next/dist/bin/next` exists and builds run)

## Team 2 Work Packet

Owner:
- bilingual content and SEO parity

Current allowed work:
- create and lock `content/en.json` + `content/vi.json`
- enforce key parity and no hard-coded public text drift
- complete `[lang]` route parity for all public pages
- remove Omdalat-related residual copy from Omdala public surfaces

Do not do:
- historical Omniverse cleanup
- backend, auth, payment, legal, or database work outside explicit Omdala.com scope

Definition of done for Team 2:
- bilingual source files exist and validate
- EN/VI route parity and metadata parity are verified with evidence

## Team 3 Work Packet

Owner:
- auth/api release evidence and truth

Current allowed work:
- finalize Google OAuth flow with env-driven config
- add callback/start test coverage and failure-mode coverage
- maintain release packet with true state (`HOLD` until P0/P1 gates pass)

Definition of done for Team 3:
- OAuth flow is tested and documented
- release packet includes real command evidence and route-level proofs

## Cross-Team Order

1. Team 1 P0 build integrity first.
2. Team 2 bilingual/SEO parity second.
3. Team 3 OAuth evidence third.
4. Re-open release `GO` only after full matrix pass.

## 33-Minute Automation Rule

Every run should:

1. Read:
   - `docs/PROJECT_CONTEXT_ENGINE.md`
   - `docs/OMDALA_AUTONOMOUS_DEV_15M_PLAN_2026-05-07.md`
   - `docs/OMDALA_STOP_THE_BLEEDING_EXECUTION_BOARD_2026-05-04.md`
   - `docs/PROJECT_EXECUTION_BOARD.md`
   - this file
2. Execute the highest-value open task in `docs/OMDALA_FULL_PROJECT_DEV_COMPLETION_BOARD_2026-05-19.md`.
3. Keep destructive Git isolation approval-gated.
4. Update the active board with any meaningful state change.

## Hard Stop

Do not:

- touch Omdalat.com
- execute Git isolation without explicit founder approval
- claim completion while any P0 build blocker is open
- run more than one autonomous loop for this project
