# AI_OM_LIVE_API_CONTRACT_V1.md

Version: 1.0  
Status: Locked API contract v1  
Parent system: AI Om Live  
Master brand: OMDALA  
Base path: `/v2/live`  
Date: April 4, 2026

> **Change note, 2026-10-30 (WO-TAI-11).** Before release the code is the source of truth. This document now describes the implemented `/v2/live` behavior: the envelope is `{ data, error, meta? }` (no `ok`, no `request_id`), errors are `{ code, reason? }`, session statuses are `blocked | active | ended | failed`, and realtime connect, token and bootstrap are fail-closed (503 `ai_authority_unavailable`) until the OMDALA AI authority publishes a realtime contract. Endpoints that are not implemented are marked **Not implemented** and are planned, not available. The endpoint-by-endpoint comparison is `docs/OMAI_API_CONTRACT_MATRIX_2026-10-30.md`; the contract tests are `backend/src/live.contract.test.ts`. Recap is returned by `POST /sessions/:session_id/end` as `summary` (currently a static placeholder); a dedicated recap endpoint is planned at `GET /sessions/:session_id/recap`.

---

# 1. Muc tieu

File nay khoa contract API cho toan bo nhanh AI Om Live de:
- iOS app
- Android app
- web/PWA
- admin/family/school/business dashboards
- provider router
- metering service
- curriculum engine
- memory service
- moderation service
- subscription service

co the build song song ma khong lech schema.

Nguyen tac:
- API-first
- typed response
- server-side quota and billing
- provider-agnostic
- family / school / business aware
- future CIOS bridge ready

---

# 2. API Base

Base URL:  
`https://api.omdala.com/v2/live`

Auth:
- identity is a server-bound principal supplied by the canonical OMDALA session bridge; headers, body and query are never read as identity (direct access returns 503 `omdala_identity_authority_unavailable` until the bridge exists)
- org/workspace awareness and child-account limits are planned (see the matrix); today the live store is keyed by user only

Response format:

```json
{
  "data": {},
  "error": null,
  "meta": {}
}
```

Error format:

```json
{
  "data": null,
  "error": {
    "code": "persona_not_found",
    "reason": "optional human-readable text"
  },
  "meta": {}
}
```

---

# 3. Core Resources

Primary resources:
- `users`
- `profiles`
- `personas`
- `sessions`
- `realtime`
- `usage`
- `plans`
- `subscriptions`
- `curriculum`
- `lessons`
- `memory`
- `moderation`
- `providers`
- `workspaces`
- `family`
- `school`
- `business`
- `analytics`
- `integrations`

---

# 4. Auth + Session

## 4.1 POST /auth/session

**Not implemented.** Owned by the canonical OMDALA session bridge (api.omdala.com), not by this service.

Create app session.

Request:

```json
{
  "email": "user@example.com",
  "password": "secret",
  "device": {
    "platform": "ios",
    "device_id": "device_001",
    "app_version": "1.0.0"
  }
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "access_token": "jwt_access",
    "refresh_token": "jwt_refresh",
    "user": {
      "user_id": "user_001",
      "display_name": "Tran Ha Tam",
      "default_workspace_id": "ws_personal_001",
      "default_profile_id": "profile_adult_001"
    }
  },
  "meta": {},
  "error": null
}
```

## 4.2 GET /me

**Not implemented.** Owned by the canonical OMDALA session bridge (api.omdala.com), not by this service.

Return current authenticated user and workspace context.

## 4.3 POST /auth/refresh

**Not implemented.** Owned by the canonical OMDALA session bridge (api.omdala.com), not by this service.

Refresh access token.

---

# 5. Workspace APIs

## 5.1 GET /workspaces

**Not implemented.** Planned; not available in the current backend.

Returns all workspaces the user can access.

Workspace types:
- `personal`
- `family`
- `school`
- `business`
- `enterprise`

Response item:

```json
{
  "workspace_id": "ws_family_001",
  "workspace_type": "family",
  "display_name": "Tam Family",
  "role": "owner",
  "plan_id": "plan_family"
}
```

## 5.2 POST /workspaces/switch

**Not implemented.** Planned; not available in the current backend.

Switch active workspace.

Request:

```json
{
  "workspace_id": "ws_business_001"
}
```

---

# 6. Persona APIs

## 6.1 GET /personas

Query params:
- `category`
- `language`
- `audience`
- `workspace_type`
- `premium_only`
- `creator_type`
- `safe_for_children`
- `supports_avatar`
- `supports_voice_only`

Example:  
`GET /personas?category=teacher&language=en&safe_for_children=true`

Response:

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "persona_id": "persona_teacher_en_001",
        "display_name": "Emily",
        "role_type": "teacher",
        "category": "english_teacher",
        "primary_languages": ["en", "vi"],
        "supports_avatar": true,
        "supports_voice_only": true,
        "premium_required": false,
        "safe_for_children": true
      }
    ]
  },
  "meta": {
    "total": 1
  },
  "error": null
}
```

## 6.2 GET /personas/:persona_id

Returns full persona definition with:
- `summary`
- `capabilities`
- `supported_modes`
- `curriculum_bindings`
- `safety_profile`
- `pricing_eligibility`
- `supported_providers`

## 6.3 POST /personas/:persona_id/favorite

Favorite persona.

## 6.4 POST /personas/custom

**Not implemented.** Planned; not available in the current backend.

Create custom persona.

Request:

```json
{
  "name": "My English Coach",
  "builder_mode": "simple",
  "role_type": "language_partner",
  "languages": ["en", "vi"],
  "style": {
    "tone": "friendly",
    "strictness": "medium",
    "humor_level": "light"
  },
  "avatar_config": {
    "mode": "preset",
    "preset_id": "avatar_friendly_01"
  }
}
```

Response rules:
- free plan may be blocked or limited
- child profiles require parent/admin allowlist
- org personas may require admin approval

---

# 7. Session APIs

## 7.1 POST /sessions/create

Create a live session record. The session starts as `blocked` because realtime execution is not available yet.

Request (fields not listed are ignored; `user_id`, `plan_context` and any identity in the body are ignored):

```json
{
  "persona_id": "teacher_english_01",
  "session_type": "language_call",
  "avatar_enabled": false,
  "goal": "practice_daily_conversation",
  "language_mode": {
    "native_language": "vi",
    "target_language": "en",
    "correction_language": "vi"
  }
}
```

Optional header `x-idempotency-key` (8 to 128 characters) replays the same session.

Response:

```json
{
  "data": {
    "session_id": "live_session_001",
    "status": "blocked",
    "idempotent_replayed": false,
    "execution_ready": false,
    "ai_authority": { "authority": "omdala_api_aiagent", "status": "blocked" },
    "avatar": { "enabled": false, "provider": null, "mode": "blocked" },
    "usage": { "free_seconds_remaining_today": 1800 }
  },
  "error": null
}
```

Errors: 400 `validation_error` (persona_id and session_type are required strings, `goal` must be a string of at most 10000 characters), 404 `persona_not_found`, 403 `plan_upgrade_required` (avatar requested on a plan without avatar), 403 `persona_not_child_safe` (child profile with a persona that is not child-safe), 422 `content_requires_escalation` (goal text flagged by the keyword screen). Not implemented (planned): `workspace_id`, `profile_id`, `transport_preferences`, `provider_decision`, `usage_snapshot`.

## 7.2 POST /sessions/:session_id/connect

Currently always fails closed for the session owner: 503 `ai_authority_unavailable` with `meta.ai_authority`. Unknown or foreign sessions return 404 `session_not_found`. The planned `connect_ready` state is not implemented.

## 7.3 GET /sessions/:session_id

Return `{ session }` for the caller's own session (404 `session_not_found` otherwise). The session holds `session_id`, `user_id`, `persona_id`, `session_type`, `status`, `created_at`, `plan_context`, `billable_seconds`, `free_seconds_applied`, `premium_seconds_applied` and `ai_authority`. Moderation and provider state are not implemented.

## 7.4 GET /sessions

List the caller's own sessions, newest first, as `{ items }` with `meta.total`. Implemented filter: `status`. Not implemented (planned): `profile_id`, `persona_id`, `workspace_id`, `session_type`, `started_after`, `started_before`.

## 7.5 POST /sessions/:session_id/end

End the session and finalize metering. Optional body `billable_seconds` (non-negative number); only a session that was `active` bills, and none can be `active` until realtime exists. Optional header `x-idempotency-key`.

Response:

```json
{
  "data": {
    "session_id": "live_session_001",
    "idempotent_replayed": false,
    "billable_seconds": 0,
    "free_seconds_remaining_today": 1800,
    "summary": {
      "main_topics": ["introductions", "daily routine", "follow-up questions"],
      "language_feedback": {
        "strengths": ["good fluency", "clear sentence structure"],
        "corrections": ["past tense consistency", "article usage"]
      },
      "next_recommendation": "lesson_daily_routine_a2_02"
    }
  },
  "error": null
}
```

`summary` is a static placeholder, not generated from the session. Errors: 400 `validation_error`, 404 `session_not_found`.

---

# 8. Realtime APIs

## 8.1 POST /realtime/token

Body `{ "session_id": "..." }`. Currently never issues a credential: the session owner gets 503 `ai_authority_unavailable`; a missing or non-string `session_id` gets 400 `validation_error`; an unknown or foreign session gets 404 `session_not_found`. The planned token shape (`transport`, `ephemeral_token`, `expires_in_seconds`) is defined by the OMDALA AI authority contract, not here.

## 8.2 POST /realtime/session/bootstrap

Same behavior and errors as `/realtime/token` today. Planned response keys: `transport`, `ephemeral_token`, `client_events_schema_version`, `server_events_schema_version`, `audio_config`, `avatar_config`, `usage_snapshot`.

Architecture note:
- use GA Realtime interface for all new builds
- use WebRTC as primary path for browser/mobile clients
- do not build new clients on legacy Realtime beta interface

---

# 9. Usage APIs

## 9.1 GET /usage/today

Response (day key follows the profile timezone):

```json
{
  "data": {
    "usage": {
      "user_id": "user_001",
      "date_key": "2026-10-30",
      "free_seconds_limit": 1800,
      "free_seconds_used": 960,
      "premium_seconds_used": 0,
      "free_seconds_remaining": 840,
      "plan_id": "free",
      "updated_at": "2026-10-30T10:00:00.000Z"
    }
  },
  "error": null
}
```

## 9.2 GET /usage/cycle

**Not implemented.** Returns billing-cycle totals.

## 9.3 GET /usage/history

**Not implemented.** Returns aggregated usage history by day/week/month.

---

# 10. Plans and Subscriptions

## 10.1 GET /plans

Returns `{ plans }`, each with `plan_id` (`free`, `personal_pro`, `education_plus`, `business`, `enterprise_custom`), `display_name`, `daily_free_seconds`, `supports_avatar`, `supports_custom_personas`.

## 10.2 GET /subscriptions/current

**Not implemented.** Return current subscription and entitlements (the plan is visible in `usage.plan_id`).

## 10.3 POST /plans/upgrade

Closed to account holders until a billing authority decides entitlements: every caller gets 403 `PLAN_CHANGE_REQUIRES_BILLING`. A verified admin can change a plan only in test runs (`{ "plan_id": "..." }`, 400 `validation_error` without it). Plan changes in production will come from the billing authority, not from this endpoint.

---

# 11. Curriculum and Lesson APIs

## 11.1 GET /curriculum/paths

**Not implemented.** Planned; not available in the current backend.

List curriculum paths for current profile, persona, language, and level.

## 11.2 GET /lessons/:lesson_id

**Not implemented.** Planned; not available in the current backend.

Return lesson metadata, objectives, tasks, vocabulary, and eligibility.

## 11.3 POST /lessons/:lesson_id/start

**Not implemented.** Planned; not available in the current backend.

Start lesson-bound live session.

## 11.4 POST /lessons/:lesson_id/complete

**Not implemented.** Planned; not available in the current backend.

Mark lesson complete with recap payload.

---

# 12. Memory APIs

## 12.1 GET /memory/profile

Return editable profile memory including:
- goals
- language preferences
- correction preferences
- support preferences
- age-safe settings where applicable

## 12.2 PATCH /memory/profile

Update profile memory.

## 12.3 GET /memory/personas/:persona_id

**Not implemented.** Planned; not available in the current backend.

Return persona-specific memory summary.

## 12.4 DELETE /memory/personas/:persona_id

**Not implemented.** Planned; not available in the current backend.

Reset persona-specific memory.

## 12.5 Recap

**Not implemented as a separate endpoint.** The recap is the `summary` in the end-session response (7.5). The planned dedicated path is `GET /sessions/:session_id/recap`; `GET /memory/sessions/:session_id/summary` is withdrawn.

---

# 13. Moderation APIs

## 13.1 POST /moderation/check

Run a keyword screen on text. It is not a safety classifier (see `docs/OMAI_MODERATION_SCOPE.md`).

Request: `{ "text": "..." }` (string, at most 10000 characters; otherwise 400 `validation_error`).

Response:

```json
{
  "data": {
    "safe": false,
    "requires_escalation": true,
    "safety_profile": "wellness_safe_default",
    "reason": "high_risk_self_harm_signal",
    "method": "keyword_screen"
  },
  "error": null
}
```

Not implemented: `session_id`, `input_type`, transcript-segment screening.

## 13.2 POST /moderation/escalate

**Not implemented.** Trigger escalation pathway for high-risk safety case.

Response may include:
- `escalation_mode`
- `persona_override`
- `safe_reply_template_id`
- `requires_human_support_guidance`

---

# 14. Provider APIs

## 14.1 GET /providers

**Not implemented.** Planned; not available in the current backend.

Return allowed providers for current workspace and plan.

## 14.2 GET /avatar/providers

Return avatar provider availability and capability matrix.

## 14.3 POST /avatar/session/start

**Not implemented.** Planned; not available in the current backend.

Start avatar provider session if enabled.

## 14.4 POST /avatar/session/end

**Not implemented.** Planned; not available in the current backend.

Finalize avatar provider session and cost record.

---

# 15. Family APIs

## 15.1 GET /family/profiles

**Not implemented.** Planned; not available in the current backend.

Return child and guardian profiles in family workspace.

## 15.2 PATCH /family/profiles/:profile_id/controls

**Not implemented.** Planned; not available in the current backend.

Update child-safe policy.

Supported controls:
- allowed persona groups
- minute caps
- time windows
- language restrictions
- custom persona creation allowed
- transcript visibility

---

# 16. School APIs

## 16.1 GET /school/classes

**Not implemented.** Planned; not available in the current backend.

List classes and assigned learners.

## 16.2 POST /school/assignments

**Not implemented.** Planned; not available in the current backend.

Assign persona path or lesson pack.

## 16.3 GET /school/reports/:profile_id

**Not implemented.** Planned; not available in the current backend.

Return learner progress, speaking activity, and lesson completion.

---

# 17. Business APIs

## 17.1 GET /business/agents

**Not implemented.** Planned; not available in the current backend.

List organization-approved business personas.

## 17.2 POST /business/knowledge-bindings

**Not implemented.** Planned; not available in the current backend.

Bind approved knowledge packs or internal KB to org persona.

## 17.3 GET /business/reports/usage

**Not implemented.** Planned; not available in the current backend.

Organization usage, quota, and provider spend overview.

---

# 18. Analytics APIs

## 18.1 POST /analytics/events

**Not implemented.** Planned; not available in the current backend.

Write product analytics event.

Core event names:
- `session_created`
- `session_connected`
- `session_ended`
- `free_limit_warning_shown`
- `free_limit_reached`
- `upgrade_prompt_shown`
- `avatar_fallback_triggered`
- `moderation_escalation_triggered`
- `lesson_completed`

---

# 19. State Rules

Session state machine (implemented values):
- `blocked` (created; realtime unavailable)
- `active` (reserved; nothing sets it until realtime exists)
- `ended`
- `failed` (reserved)

Planned, not implemented: `created`, `connect_ready`, `connecting`, `interrupted`, `reconnecting`, `wrapping_up`.

Hard rules:
- quota is enforced server-side only
- client must never be source of truth for billable seconds
- provider routing decision lives on backend
- child-safe restrictions are resolved before session bootstrap
- moderation may override persona behavior at any time
- every ended session must produce metering finalization

---

# 20. Implementation Notes For DEV

1. Backend should expose typed schemas for every request and response.
2. iOS, Android, and web clients should consume the same envelope shape.
3. Realtime bootstrap must stay provider-agnostic even when OpenAI is the default provider.
4. Family, school, and business fields must be optional but first-class in the schema.
5. CIOS bridge should map at workspace, policy, analytics, and org identity layers later without breaking this v1 contract.
