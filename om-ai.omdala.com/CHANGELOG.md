# Changelog

## 2026-04-04 - App MVP Release Candidate

- completed web gates with request trace diagnostics and smoke/lighthouse scripts
- locked shared contract version at `shared/api-contracts.ts` (`1.0.0`) for web/app consistency
- implemented app session manager with secure storage, refresh skeleton, and logout path
- completed app MVP flows: magic-link callback handling, timeline + run detail, scenes run action, settings/logout
- added app MVP smoke script and CI workflow (`.github/workflows/app-ci.yml`)
- added strict app smoke mode (`npm run e2e:app:mvp:strict`) for launch readiness
- added app beta rollout checklist (`APP_BETA_ROLLOUT_CHECKLIST.md`)
- made strict CI smoke toggleable via repo variable `LAUNCH_STRICT`
- added continuous acceleration execution plan (`DEV_ACCELERATION_PLAN_CONTINUOUS.md`)
- added strict launch API runbook (`STRICT_LAUNCH_RUNBOOK_API.md`) and detailed strict smoke diagnostics
- added strict API handoff report generator and strict gate watch script

## 2026-04-04 - API Domain Unified and Production Handshake Verified

- unified production API base to `https://api.omdala.com` across web env examples, deploy workflow, and deploy docs
- confirmed Cloudflare route + worker live behavior with `api.omdala.com` endpoint verification script
- verified production handshake between `app.omdala.com` and `api.omdala.com` including CORS preflight and magic-link request flow
- added operational handoff doc `API_OMDALA_CLOUDFLARE_5MIN_CHECKLIST.md` and verification script `scripts/verify-api-omdala.sh`

## 2026-04-04 - Release Candidate Baseline

- locked master architecture and handoff specs
- added backend Fastify service with planner, approvals, memory, devices, proofs
- added web Vite shell with planner, device list, and approval/plan detail hooks
- added gateway runtime with plugin registry and dispatcher
- added iOS module structure with Features and Core folders
- added OpenAPI docs endpoint (`/openapi.json`) and Swagger UI (`/docs`)
- added response envelope standard (`data`, `error`, `meta`)
- added integration tests and e2e flow for backend
