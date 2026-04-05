# Project Status Snapshot

Date: 2026-04-04
Status: Release-candidate scaffold complete

## Completed

- Master spec and supporting architecture docs
- Backend Fastify routes for devices, transitions, approvals, memory, proofs
- Response envelope standard (`data`, `error`, `meta`)
- Web Vite shell with planner/device/approval hooks
- Gateway plugin registry + dispatcher + sample plugins
- iOS feature/core folder scaffolding
- OpenAPI + Swagger UI
- CI workflow, Dockerfiles, compose, smoke script, e2e and tests
- Governance docs (PR template, issue templates, CODEOWNERS)
- Release docs and scripts

## Current Constraints

- Persistence uses JSON adapter for bootstrap stage
- iOS is scaffolding only (no Xcode project wiring yet)
- Auth is dev-stub compatible and needs production token validation path

## Recommended Next Build Moves

1. Replace JSON persistence with SQLite/Postgres adapter implementation.
2. Add production auth middleware and token verification.
3. Wire iOS modules into a real Xcode target.
4. Expand web from shell to full room/scene/activity workflows.
5. Add connector implementations beyond sample gateway plugins.
