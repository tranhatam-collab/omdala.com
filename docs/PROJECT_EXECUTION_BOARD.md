# OMDALA Project Execution Board

Version: 2.0
Status: Active — consolidated to single dev team
Last update: 2026-05-19
Owner: Team Admin (Supervisor / QA / Reporter)
Executor: OMDALA Dev Team (1 team)
Scope: Omdala.com only

## Current Program State

- Release gate: `HOLD` (build integrity unresolved)
- Public bilingual audit: historical packet exists, but current source lock is incomplete in repo (`content/en.json`, `content/vi.json` missing)
- Main blocker: build toolchain integrity + bilingual source gap
- Verified composite `.git` backup: present
- Secondary review lane: brand v2.0 demo branch

## Authoritative Work Order

All backlog has been consolidated into a single master plan for one dev team:

- `docs/OMDALA_SINGLE_TEAM_MASTER_PLAN_2026-05-19.md`

The earlier 3-team split is preserved as historical reference only:

- `docs/OMDALA_FULL_PROJECT_DEV_COMPLETION_BOARD_2026-05-19.md` (reference)
- `docs/OMDALA_REMAINING_TEAMS_EXECUTION_PLAN_2026-05-09.md` (reference)

## OMDALA Dev Team — current lane

Executing the master plan in strict order:

1. **P0** Build & toolchain integrity (package manager normalization, `next` binary recovery, duplicate file cleanup, `.gitignore` for build outputs).
2. **P1** Bilingual source + SEO surface (`content/en.json`/`vi.json`, 4 audit scripts, 9 `[lang]/*/page.tsx`, sitemap/switcher, Omdalat drift cleanup).
3. **P2** Auth/API hardening + release evidence (remove hard-coded OAuth URL, OAuth runbook, API tests, gate evidence packet).

Blocked by:

- unresolved dependency/runtime corruption (`next/dist/bin/next` missing) — first P0 task.

## Brand v2.0 Demo Lane

Branch:

- `brand/v2.0-signal-substrate`

Current verdict:

- worth founder review
- not yet ready to apply broadly

Verified:

- append-only CSS overlay on `apps/web`
- brand-lint passes
- branch is tracking `origin/brand/v2.0-signal-substrate`
- `apps/web` production build passes:
  - `docs/OMDALA_V2_BUILD_SEPARATION_NOTE_2026-05-09.md`

Still needed:

- render/preview evidence
- founder review packet:
  - `docs/OMDALA_V2_FOUNDER_REVIEW_CHECKLIST_2026-05-09.md`

## Next Action

1. Dev Team executes Phase P0 of `docs/OMDALA_SINGLE_TEAM_MASTER_PLAN_2026-05-19.md` (package manager normalization → restore `next` binaries → clean duplicates → `.gitignore`).
2. Then Phase P1 (bilingual source + 9 `[lang]/*/page.tsx` + audit scripts).
3. Then Phase P2 (OAuth hardening + release evidence packet).
4. Re-open `GO` only after the 10-line Final Verification Matrix passes end-to-end.
