# Om AI API Contract v1

Version: 3.0
Status: Locked for DEV handoff
Canonical product name: Om AI
Legacy file namespace: `AI_OM_*` retained temporarily
Brand: OMDALA
Base APIs: `api.omdala.com/v2/live`, shared platform baseline APIs
Date: April 9, 2026

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
- `POST /v2/live/personas/custom`

### Sessions

- `POST /v2/live/sessions/create`
- `POST /v2/live/sessions/:id/connect`
- `POST /v2/live/sessions/:id/end`
- `GET /v2/live/sessions/:id`
- `GET /v2/live/sessions`

### Realtime

- `POST /v2/live/realtime/token`
- `POST /v2/live/realtime/session/bootstrap`

### Memory and Recap

- `GET /v2/live/memory/profile`
- `PATCH /v2/live/memory/profile`
- `GET /v2/live/memory/personas/:id`
- `DELETE /v2/live/memory/personas/:id`
- `GET /v2/live/sessions/:id/recap`

### Curriculum and Lessons

- `GET /v2/live/curriculum/paths`
- `GET /v2/live/lessons/:id`
- `POST /v2/live/lessons/:id/start`
- `POST /v2/live/lessons/:id/complete`

### Usage and Plans

- `GET /v2/live/usage/today`
- `GET /v2/live/usage/cycle`
- `GET /v2/live/plans`
- `POST /v2/live/plans/upgrade`

### Moderation and Avatar / Provider

- `POST /v2/live/moderation/check`
- `POST /v2/live/moderation/escalate`
- `GET /v2/live/avatar/providers`
- `POST /v2/live/avatar/session/start`
- `POST /v2/live/avatar/session/end`
- `GET /v2/live/provider/routes`

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
