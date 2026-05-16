# Commit Grouping Plan

Use this grouping to create clean, reviewable commits.

## Commit Group 1: Product Specs and Master Plan

- all `AI_OM_*` spec docs
- `README_INDEX.md`
- `DEV_TASK_BREAKDOWN.md`

## Commit Group 2: Backend Foundation

- `backend/src/*`
- `backend/package.json`
- `backend/tsconfig.json`
- backend tests/e2e/bootstrap/persistence adapters

## Commit Group 3: Web Foundation

- `web/src/*`
- `web/package.json`
- `web/tsconfig.json`
- `web/vite.config.ts`

## Commit Group 4: Gateway Foundation

- `gateway/src/*`
- `gateway/package.json`
- `gateway/tsconfig.json`

## Commit Group 5: iOS Structure

- `ios/*`

## Commit Group 6: DevOps and Runtime

- `Dockerfile` files
- `docker-compose.yml`
- `Makefile`
- root `package.json` scripts
- `.env.example` files

## Commit Group 7: Governance and Release Operations

- `.github/*`
- `CHANGELOG.md`
- `RELEASE_CHECKLIST.md`
- `RELEASE_TAG_CHECKLIST.md`
- `RELEASE_NOTES_DRAFT.md`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `FINAL_HANDOFF_SUMMARY.md`
- `COMMIT_GROUPING_PLAN.md`
- `scripts/*`
