# Om AI Monorepo

Om AI is the human-interaction product inside the OMDALA ecosystem.

Canonical product role:

- real-time AI human calling
- learning and language practice
- coaching, guided reflection, and communication training
- business interaction and frontdesk scenarios

Critical boundary lock:

- `Om AI` is **not** `OmCode`
- `Om AI` is **not** `Omniverse`
- physical space / room / device / scene / automation ownership belongs to `Omniverse`, not to `Om AI`

Legacy note:

- this workspace still contains historical `AI_OM_*` files
- some historical docs still mention `Reality`, devices, scenes, or control layers
- if any old file conflicts with current product direction, follow the canonical docs in root `omdala.com/docs/`

This repository contains:

- `backend/` Fastify API for Om AI contracts, memory, metering, provider orchestration, and docs
- `web/` Vite React surface and admin shell for Om AI
- `gateway/` local runtime and adapter layer where needed
- `ios/` native module structure scaffold for live call UX
- root-level architecture/spec/release/governance docs

## Quick Start

```bash
make install
make ci
make dev
```

## Useful Commands

- run all checks: `npm run ci`
- run smoke flow: `npm run smoke`
- run backend e2e: `npm --prefix backend run e2e`
- generate release notes file: `npm run release:notes -- v2026.04.04-rc.1`

## Entry Docs

Read these first in this order:

1. `../docs/PROJECT_CONTEXT_ENGINE.md`
2. `../docs/TWO_TEAM_PARALLEL_DEV_MASTER_PLAN_2026-04-09.md`
3. `../docs/TEAM_1_PROGRESS_2026.md`
4. `../docs/OM_AI_MASTER_DEV_PLAN_2026.md`

Legacy workspace docs below remain useful, but do not override the root canonical docs:

- `FINAL_HANDOFF_SUMMARY.md`
- `AI_OM_FOUNDER_READY_FINAL_HANDOFF_PACK_2026.md`
- `AI_OM_MASTER_SPEC_2026.md`
- `AI_OM_SHARED_PLATFORM_DEPENDENCY_STATUS_2026.md`
- `AI_OM_TEAM_BOUNDARY_AND_DEPENDENCY_MATRIX_2026.md`
- `AI_OM_SHARED_RESOURCE_REUSE_PLAN_2026.md`
- `AI_OM_PHASED_INTEGRATION_BACKLOG_2026.md`
- `AI_OM_CONTROL_PASS_STATUS_2026.md`
- `AI_OM_DEV_MASTER_EXECUTION_PLAN_2026.md`
- `AI_OM_FULL_DEV_EXECUTION_PLAN_IOS_ANDROID_2026.md`
- `AI_OM_REPO_FULL_STRUCTURE_2026.md`
- `AI_OM_ECOSYSTEM_RESOURCE_AUDIT_2026.md`
- `AI_OM_OMDALA_AND_IAI_ONE_INTEGRATION_RECOMMENDATION_2026.md`
- `OM_AI_LIVE_HUMAN_CALL_AND_EDUCATION_EXTENSION_2026.md`
- `AI_OM_LIVE_HUMAN_CALL_AND_EDUCATION_EXTENSION_2026.md`
- `AI_OM_LIVE_API_CONTRACT_V1.md`
- `AI_OM_ANDROID_APP_STRUCTURE.md`
- `AI_OM_ANDROID_MODULE_SPEC.md`
- `AI_OM_ANDROID_MVP_PLAN.md`
- `AI_OM_LIVE_ANDROID_REALTIME_CALL_SPEC_2026.md`
- `README_INDEX.md`

Bridge-only archival references are intentionally demoted into `README_INDEX.md` and `AI_OM_HANDOFF_INDEX.md` so current build paths stay clear.

## Current Team Om AI Focus

The active Om AI documentation package now includes:

- dependency status and team boundary lock
- shared resource reuse plan
- phased integration backlog
- control-pass snapshot and normalization status
- founder-ready final handoff pack
- legacy cleanup normalization across Android, iOS, test, security, observability, and repo structure docs

These files are maintained by Team Om AI to keep DEV aligned while shared platform work continues in parallel.

## API Docs

When backend is running:

- OpenAPI JSON: `http://localhost:3001/openapi.json`
- Swagger UI: `http://localhost:3001/docs`

## Note On Naming

Legacy filenames still use the historical `AI_OM_*` namespace in parts of the repo. The canonical product name in content and new docs is `Om AI`.
