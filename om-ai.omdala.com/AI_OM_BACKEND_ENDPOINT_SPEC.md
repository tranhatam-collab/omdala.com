# Om AI Backend Endpoint Spec

Version: 2.0
Status: Locked for DEV handoff
Canonical product name: Om AI

## 1. Purpose

Define the backend endpoint groups required for both Om AI product lines:

- `Om AI Reality`
- `Om AI Live`

## 2. Endpoint Groups

### Identity

- `POST /v2/reality/auth/session`
- `GET /v2/reality/me`

### Reality Spaces and Devices

- `GET /v2/reality/homes`
- `GET /v2/reality/businesses`
- `GET /v2/reality/spaces/:id`
- `GET /v2/reality/devices`
- `GET /v2/reality/devices/:id`
- `POST /v2/reality/devices/import`
- `POST /v2/reality/devices/:id/execute`

### Reality Scenes and Planner

- `GET /v2/reality/scenes`
- `POST /v2/reality/scenes`
- `POST /v2/reality/scenes/:id/run`
- `POST /v2/reality/transitions/plan`
- `POST /v2/reality/transitions/preview`
- `POST /v2/reality/transitions/execute`

### Approvals and Proofs

- `POST /v2/reality/approvals/request`
- `POST /v2/reality/approvals/:id/confirm`
- `POST /v2/reality/approvals/:id/reject`
- `GET /v2/reality/runs/:id`
- `GET /v2/reality/proofs/:id`

### Reality Memory and Policies

- `GET /v2/reality/memory/profile`
- `POST /v2/reality/memory/aliases`
- `POST /v2/reality/memory/preferences`
- `GET /v2/reality/policies`
- `POST /v2/reality/policies`
- `PATCH /v2/reality/policies/:id`

### Gateways

- `POST /v2/reality/gateways/register`
- `POST /v2/reality/gateways/:id/heartbeat`
- `POST /v2/reality/gateways/:id/report-state`

### Live Personas

- `GET /v2/live/personas`
- `GET /v2/live/personas/:id`
- `POST /v2/live/personas`
- `PATCH /v2/live/personas/:id`

### Live Sessions

- `POST /v2/live/sessions/create`
- `GET /v2/live/sessions/:id`
- `POST /v2/live/sessions/:id/events`
- `POST /v2/live/sessions/:id/end`

### Live Learning and Memory

- `GET /v2/live/lesson-plans`
- `GET /v2/live/lesson-plans/:id`
- `POST /v2/live/lesson-plans`
- `GET /v2/live/memory/profile`
- `GET /v2/live/memory/sessions/:id`
- `POST /v2/live/memory/recaps`

### Live Usage and Billing

- `GET /v2/live/usage/today`
- `GET /v2/live/subscriptions`
- `POST /v2/live/subscriptions/checkout`
- `POST /v2/live/subscriptions/webhook`

### Live Moderation and Providers

- `GET /v2/live/avatar/providers`
- `POST /v2/live/avatar/providers/resolve`
- `POST /v2/live/moderation/check`
- `POST /v2/live/moderation/escalate`

## 3. API Rules

- all responses must be typed
- all execution endpoints must return run ids or session ids
- all denied actions must return reasons
- all sensitive actions must support approval or moderation references
- live usage must be enforced on backend
- live providers must be replaceable without client contract breakage
