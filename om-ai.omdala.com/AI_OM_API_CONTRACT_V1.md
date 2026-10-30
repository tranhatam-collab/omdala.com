# Om AI API Contract v1

Version: 3.0
Status: Locked for DEV handoff
Canonical product name: Om AI
Legacy file namespace: `AI_OM_*` retained temporarily
Brand: OMDALA
Base APIs: `api.omdala.com/v2/live`, shared platform baseline APIs
Date: April 9, 2026

> **Change note, 2026-10-30 (WO-TAI-11).** Before release the code is the source of truth. This file now matches the implemented `/v2/live` surface: the envelope is `{ data, error, meta? }`, session statuses are `blocked | active | ended | failed`, realtime connect/token/bootstrap are fail-closed (503 `ai_authority_unavailable`), and `POST /v2/live/plans/upgrade` is closed (403 `PLAN_CHANGE_REQUIRES_BILLING`). The recap is returned by `POST /v2/live/sessions/:id/end` as `summary`; the dedicated recap path is settled as `GET /v2/live/sessions/:id/recap` and is not implemented. Endpoints marked "(not implemented)" below are planned. Details: `AI_OM_LIVE_API_CONTRACT_V1.md`, `docs/OMAI_API_CONTRACT_MATRIX_2026-10-30.md`.

## Boundary normalization — April 9, 2026

This file is now normalized to the current Om AI product boundary.

Current canonical rule:

- `Om AI Live` is the current Om AI product core
- shared platform may provide `account/profile`, `account/preferences`, `billing/subscriptions`, and `billing/usage`
- any older `/v2/reality/*` references are `legacy-transition` or `bridge-only`
- Team Om AI must not use this file to re-expand device, scene, proof, or gateway ownership

Priority references:

1. `AI_OM_SHARED_PLATFORM_DEPENDENCY_STATUS_2026.md`
2. `AI_OM_TEAM_BOUNDARY_AND_DEPENDENCY_MATRIX_2026.md`
3. `AI_OM_SHARED_RESOURCE_REUSE_PLAN_2026.md`
4. `AI_OM_PHASED_INTEGRATION_BACKLOG_2026.md`

## 1. Purpose

Define the canonical Om AI API surface for:

- live personas
- live sessions
- realtime bootstrap
- memory and recap
- lesson and curriculum behaviors
- usage metering
- plan visibility and subscription prompts
- moderation and avatar/provider coordination

## 2. API Principles

- live-product-first
- typed contracts only
- backend-owned metering and moderation
- provider abstraction over vendor lock-in
- explicit error states
- graceful fallback behavior
- shared platform alignment without product ownership drift

## 3. Core Domains

Canonical Om AI domains:

- personas
- live sessions
- realtime bootstrap
- memory
- recap
- lesson and curriculum
- usage metering
- plans and subscription visibility
- moderation
- avatar providers
- provider routing
- analytics events

Shared dependency domains:

- account/profile
- account/preferences
- billing/subscriptions
- billing/usage

## 4. Base Paths

### Om AI Live

- `/v2/live/personas`
- `/v2/live/sessions`
- `/v2/live/realtime`
- `/v2/live/memory`
- `/v2/live/lessons`
- `/v2/live/curriculum`
- `/v2/live/usage`
- `/v2/live/plans`
- `/v2/live/moderation`
- `/v2/live/avatar`
- `/v2/live/provider`

### Shared Platform Dependencies

- `/v1/account/profile`
- `/v1/account/preferences`
- `/v1/billing/subscriptions`
- `/v1/billing/usage`

## 5. Om AI Live Endpoints

### Personas

- `GET /v2/live/personas`
- `GET /v2/live/personas/:id`
- `POST /v2/live/personas/:id/favorite`
- `POST /v2/live/personas/custom` (not implemented)

### Sessions

- `POST /v2/live/sessions/create`
- `POST /v2/live/sessions/:id/connect` (fail-closed 503 today)
- `POST /v2/live/sessions/:id/end`
- `GET /v2/live/sessions/:id`
- `GET /v2/live/sessions`

### Realtime

- `POST /v2/live/realtime/token` (fail-closed 503 today)
- `POST /v2/live/realtime/session/bootstrap` (fail-closed 503 today)

### Memory and Recap

- `GET /v2/live/memory/profile`
- `PATCH /v2/live/memory/profile`
- `GET /v2/live/memory/personas/:id` (not implemented)
- `DELETE /v2/live/memory/personas/:id` (not implemented)
- `GET /v2/live/sessions/:id/recap` (not implemented; settled recap path)

### Curriculum and Lessons

- `GET /v2/live/curriculum/paths` (not implemented)
- `GET /v2/live/lessons/:id` (not implemented)
- `POST /v2/live/lessons/:id/start` (not implemented)
- `POST /v2/live/lessons/:id/complete` (not implemented)

### Usage and Plans

- `GET /v2/live/usage/today`
- `GET /v2/live/usage/cycle` (not implemented)
- `GET /v2/live/plans`
- `POST /v2/live/plans/upgrade` (closed: 403 `PLAN_CHANGE_REQUIRES_BILLING`)

### Moderation and Avatar / Provider

- `POST /v2/live/moderation/check`
- `POST /v2/live/moderation/escalate` (not implemented)
- `GET /v2/live/avatar/providers` (returns an empty list)
- `POST /v2/live/avatar/session/start` (not implemented)
- `POST /v2/live/avatar/session/end` (not implemented)
- `GET /v2/live/provider/routes` (not implemented)

## 6. Shared Dependency Rules

Shared platform may own the baseline storage and contracts for:

- profile
- preferences
- subscriptions
- usage visibility

Om AI still owns the product interpretation of:

- persona eligibility
- family restrictions
- free-minute behavior
- live-session availability
- recap and curriculum behavior

## 7. Legacy Transition Rule

Any old references to:

- `/v2/reality/*`
- devices
- scenes
- proofs
- gateways
- physical execution

are no longer primary Om AI API scope.

They may survive only as:

- historical notes
- bridge-only references
- future cross-product coordination items

## 8. Final Lock

The canonical Om AI API contract is now:

- `/v2/live/*` first
- shared account and billing dependencies second
- legacy reality scope non-primary
