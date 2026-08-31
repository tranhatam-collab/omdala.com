# Om AI Backend Endpoint Spec

Version: 3.0
Status: Locked for DEV handoff
Canonical product name: Om AI
Date: April 9, 2026

## Boundary normalization — April 9, 2026

This file is now normalized to the current Om AI product boundary.

Current execution rule:

- Om AI current product core is live interaction, learning, communication, memory, recap, provider routing, moderation, and metering
- shared platform dependencies are consumed for account and billing baseline data
- older `/v2/reality/*` groups are `legacy-transition` or `bridge-only`
- Team Om AI must not treat reality, device, scene, proof, or gateway endpoint groups as current MVP ownership

Use these files first if there is any conflict:

1. `AI_OM_SHARED_PLATFORM_DEPENDENCY_STATUS_2026.md`
2. `AI_OM_TEAM_BOUNDARY_AND_DEPENDENCY_MATRIX_2026.md`
3. `AI_OM_MASTER_SPEC_2026.md`
4. `AI_OM_PHASED_INTEGRATION_BACKLOG_2026.md`

## 1. Purpose

Define the backend endpoint groups that Om AI should actively build and the groups that are now historical bridge context only.

## 2. Active Endpoint Groups

### Shared Platform Baseline Dependencies

- `GET /v1/account/profile`
- `PUT /v1/account/profile`
- `GET /v1/account/preferences`
- `PUT /v1/account/preferences`
- `GET /v1/billing/subscriptions`
- `GET /v1/billing/usage`

### Live Personas

- `GET /v2/live/personas`
- `GET /v2/live/personas/:id`
- `POST /v2/live/personas/:id/favorite`
- `POST /v2/live/personas/custom`

### Live Sessions

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

### Moderation and Provider Coordination

- `POST /v2/live/moderation/check`
- `POST /v2/live/moderation/escalate`
- `GET /v2/live/avatar/providers`
- `POST /v2/live/avatar/session/start`
- `POST /v2/live/avatar/session/end`
- `GET /v2/live/provider/routes`

## 3. Legacy Transition Endpoint Groups

The following groups are no longer current Om AI MVP ownership:

- `/v2/reality/auth/*`
- `/v2/reality/homes`
- `/v2/reality/businesses`
- `/v2/reality/spaces/*`
- `/v2/reality/devices/*`
- `/v2/reality/scenes/*`
- `/v2/reality/transitions/*`
- `/v2/reality/proofs/*`
- `/v2/reality/approvals/*`
- `/v2/reality/gateways/*`

These may remain only as bridge or archival context.

## 4. Backend Ownership Rule

Om AI backend owns:

- personas
- sessions
- realtime bootstrap
- memory behavior
- recap behavior
- curriculum behavior
- metering behavior
- provider routing
- moderation behavior

Shared platform may own baseline:

- account/profile
- account/preferences
- billing/subscriptions
- billing/usage

## 5. Final Lock

The active backend endpoint surface for Om AI is now the live product surface plus approved shared platform dependencies.
