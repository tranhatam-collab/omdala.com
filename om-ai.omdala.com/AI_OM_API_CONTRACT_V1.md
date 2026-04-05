# Om AI API Contract v1

Version: 2.0
Status: Locked for DEV handoff
Canonical product name: Om AI
Legacy file namespace: `AI_OM_*` retained temporarily
Brand: OMDALA
Base APIs: `api.omdala.com/v2/reality`, `api.omdala.com/v2/live`

## 1. Purpose

Define the canonical API contract for Om AI across both product lines:

- `Om AI Reality`: planning, execution, proof, memory, approvals, devices, scenes, spaces, and gateways.
- `Om AI Live`: personas, realtime sessions, lesson plans, memory, moderation, usage metering, subscriptions, and avatar providers.

## 2. API Principles

- policy-first
- proof-first
- typed contracts only
- explicit approval flows
- deterministic error states
- backend-owned metering and moderation
- provider abstraction over direct vendor lock-in

## 3. Core Domains

- identity
- homes
- businesses
- spaces
- devices
- scenes
- routines
- planner
- executions
- approvals
- proofs
- memory
- connectors
- gateways
- personas
- live sessions
- avatar providers
- lesson plans
- subscriptions
- moderation
- analytics events

## 4. Base Paths

### Reality

- `/v2/reality`
- `/v2/reality/auth`
- `/v2/reality/devices`
- `/v2/reality/scenes`
- `/v2/reality/transitions`
- `/v2/reality/proofs`
- `/v2/reality/approvals`
- `/v2/reality/memory`
- `/v2/reality/gateways`

### Live

- `/v2/live`
- `/v2/live/personas`
- `/v2/live/sessions`
- `/v2/live/memory`
- `/v2/live/lesson-plans`
- `/v2/live/usage`
- `/v2/live/subscriptions`
- `/v2/live/avatar/providers`
- `/v2/live/moderation`

## 5. Reality Endpoints

### Identity

- `POST /v2/reality/auth/session`
- `GET /v2/reality/me`
- `GET /v2/reality/me/permissions`

### Spaces

- `GET /v2/reality/homes`
- `GET /v2/reality/businesses`
- `GET /v2/reality/spaces/:id`
- `POST /v2/reality/spaces`
- `PATCH /v2/reality/spaces/:id`

### Devices

- `GET /v2/reality/devices`
- `GET /v2/reality/devices/:id`
- `POST /v2/reality/devices/import`
- `PATCH /v2/reality/devices/:id`
- `POST /v2/reality/devices/:id/execute`

### Scenes

- `GET /v2/reality/scenes`
- `POST /v2/reality/scenes`
- `POST /v2/reality/scenes/:id/run`

### Planner

- `POST /v2/reality/transitions/plan`
- `POST /v2/reality/transitions/preview`
- `POST /v2/reality/transitions/execute`

### Approvals

- `POST /v2/reality/approvals/request`
- `POST /v2/reality/approvals/:id/confirm`
- `POST /v2/reality/approvals/:id/reject`

### Proofs

- `GET /v2/reality/runs`
- `GET /v2/reality/runs/:id`
- `GET /v2/reality/proofs/:id`

### Memory

- `GET /v2/reality/memory/profile`
- `POST /v2/reality/memory/aliases`
- `POST /v2/reality/memory/preferences`
- `POST /v2/reality/memory/feedback`

### Gateways

- `POST /v2/reality/gateways/register`
- `POST /v2/reality/gateways/:id/heartbeat`
- `POST /v2/reality/gateways/:id/report-state`

## 6. Live Endpoints

### Personas

- `GET /v2/live/personas`
- `GET /v2/live/personas/:id`
- `POST /v2/live/personas`
- `PATCH /v2/live/personas/:id`

### Sessions

- `POST /v2/live/sessions/create`
- `GET /v2/live/sessions/:id`
- `POST /v2/live/sessions/:id/events`
- `POST /v2/live/sessions/:id/end`

### Lesson Plans

- `GET /v2/live/lesson-plans`
- `GET /v2/live/lesson-plans/:id`
- `POST /v2/live/lesson-plans`

### Live Memory

- `GET /v2/live/memory/profile`
- `GET /v2/live/memory/sessions/:id`
- `POST /v2/live/memory/recaps`

### Usage and Subscriptions

- `GET /v2/live/usage/today`
- `GET /v2/live/subscriptions`
- `POST /v2/live/subscriptions/checkout`
- `POST /v2/live/subscriptions/webhook`

### Avatar Providers

- `GET /v2/live/avatar/providers`
- `POST /v2/live/avatar/providers/resolve`

### Moderation

- `POST /v2/live/moderation/check`
- `POST /v2/live/moderation/escalate`

## 7. Sample Reality Planner Request

```json
{
  "input_mode": "voice",
  "raw_input": "Om, cho phòng con ngủ",
  "space_context_id": "space_bedroom_child_01",
  "user_context_id": "user_01",
  "device_snapshot_version": "2026-04-04T10:15:01Z",
  "safety_mode": "normal",
  "allow_autonomy": true
}
```

## 8. Sample Live Session Create Request

```json
{
  "persona_id": "om_teacher_english_01",
  "session_mode": "voice_avatar",
  "transport": "webrtc",
  "goal": "Practice speaking for 10 minutes",
  "curriculum_id": "eng_speaking_a2_daily_01",
  "user_context_id": "user_01"
}
```

## 9. Sample Live Session Create Response

```json
{
  "data": {
    "session_id": "live_sess_01",
    "status": "ready",
    "transport": "webrtc",
    "realtime": {
      "provider": "openai",
      "session_client_secret": "ephemeral_secret",
      "model": "gpt-realtime"
    },
    "avatar": {
      "provider": "tavus",
      "mode": "realtime_stream"
    },
    "usage": {
      "minutes_remaining_today": 18,
      "warning_threshold_minutes": 5
    }
  },
  "error": null,
  "meta": {
    "source": "live_sessions"
  }
}
```

## 10. Error Model

- `unauthorized`
- `forbidden`
- `unsupported_device`
- `policy_denied`
- `approval_required`
- `offline_gateway`
- `verification_failed`
- `partial_success`
- `timeout`
- `plan_limit_reached`
- `provider_unavailable`
- `moderation_blocked`
- `avatar_fallback_required`

## 11. Contract Rules

- all responses must use typed envelopes
- all execution endpoints must return run ids or session ids
- all denied actions must return reasons and next-step hints
- all sensitive actions must support approval references or moderation references
- live-minute usage must be computed and enforced on backend
- provider-specific response fields must be wrapped under provider namespaced objects
