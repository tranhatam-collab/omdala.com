# Om AI Monorepo

Om AI is the execution and interaction layer of OMDALA Reality OS.

The product is now locked as two systems in one:

- `Om AI Reality`: policy-first orchestration for real spaces, devices, scenes, approvals, and proof-backed execution
- `Om AI Live`: real-time AI human calling for teaching, language practice, coaching, listening, and wellness companionship

This repository contains:

- `backend/` Fastify API for reality + live contracts, planning, policy, proof, approvals, memory, metering, and docs
- `web/` Vite React orchestration surface and admin shell
- `gateway/` local runtime with plugin registry and dispatcher
- `ios/` native module structure scaffold for reality control and live call UX
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

1. `FINAL_HANDOFF_SUMMARY.md`
2. `AI_OM_MASTER_SPEC_2026.md`
3. `AI_OM_DEV_MASTER_EXECUTION_PLAN_2026.md`
4. `AI_OM_FULL_DEV_EXECUTION_PLAN_IOS_ANDROID_2026.md`
5. `AI_OM_REPO_FULL_STRUCTURE_2026.md`
6. `AI_OM_ECOSYSTEM_RESOURCE_AUDIT_2026.md`
7. `AI_OM_OMDALA_AND_IAI_ONE_INTEGRATION_RECOMMENDATION_2026.md`
8. `OM_AI_LIVE_HUMAN_CALL_AND_EDUCATION_EXTENSION_2026.md`
9. `AI_OM_LIVE_HUMAN_CALL_AND_EDUCATION_EXTENSION_2026.md`
10. `AI_OM_LIVE_API_CONTRACT_V1.md`
11. `AI_OM_ANDROID_APP_STRUCTURE.md`
12. `AI_OM_ANDROID_MODULE_SPEC.md`
13. `AI_OM_ANDROID_MVP_PLAN.md`
14. `AI_OM_LIVE_ANDROID_REALTIME_CALL_SPEC_2026.md`
15. `README_INDEX.md`

## API Docs

When backend is running:

- OpenAPI JSON: `http://localhost:3001/openapi.json`
- Swagger UI: `http://localhost:3001/docs`

## Note On Naming

Legacy filenames still use the historical `AI_OM_*` namespace in parts of the repo. The canonical product name in content and new docs is `Om AI`.
