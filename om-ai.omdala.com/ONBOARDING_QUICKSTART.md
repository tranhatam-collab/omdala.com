# Onboarding Quickstart

This guide gets a new engineer productive on Om AI in about 1 hour.

## 1) Prerequisites

- Node.js 20+
- npm 10+
- Docker (optional but recommended)
- Xcode (for iOS structure work)

## 2) First-Time Setup

```bash
make install
cp .env.example .env
cp backend/.env.example backend/.env
cp web/.env.example web/.env
cp gateway/.env.example gateway/.env
```

## 3) Validate Baseline

```bash
make ci
```

## 4) Run Local Stack

```bash
make dev
```

Expected:

- backend available on `http://localhost:3001`
- Swagger docs at `http://localhost:3001/docs`
- OpenAPI JSON at `http://localhost:3001/openapi.json`
- web dev app at `http://localhost:5173`

## 5) Run Smoke Flow

In a separate terminal while backend is running:

```bash
npm run smoke
```

## 6) Seed Demo Data (Optional)

```bash
npm --prefix backend run bootstrap
```

## 7) Read In This Order

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
11. `AI_OM_PROVIDER_ROUTER_ARCHITECTURE_2026.md`
12. `AI_OM_PERSONA_SCHEMA_V1.md`
13. `AI_OM_MEMORY_MODEL_V1.md`
14. `AI_OM_USAGE_METERING_AND_FREE_30_MIN_RULES.md`
15. `AI_OM_PRICING_AND_PLAN_LOGIC_2026.md`
16. `AI_OM_ANDROID_APP_STRUCTURE.md`
17. `AI_OM_ANDROID_MODULE_SPEC.md`
18. `AI_OM_ANDROID_MVP_PLAN.md`
19. `AI_OM_LIVE_ANDROID_REALTIME_CALL_SPEC_2026.md`
20. `README_INDEX.md`
21. `COMMIT_PLAYBOOK.md`
