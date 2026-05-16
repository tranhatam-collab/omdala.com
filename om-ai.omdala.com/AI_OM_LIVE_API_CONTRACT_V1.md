# AI_OM_LIVE_API_CONTRACT_V1.md

Version: 1.0  
Status: Locked API contract v1  
Parent system: AI Om Live  
Master brand: OMDALA  
Base path: `/v2/live`  
Date: April 4, 2026

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
- Bearer access token
- org/workspace aware
- child accounts limited by parent/admin policy
- optional device session token for realtime bootstrap

Response format:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "request_id": "req_123",
    "timestamp": "2026-04-04T10:15:08Z"
  },
  "error": null
}
```

Error format:

```json
{
  "ok": false,
  "data": null,
  "meta": {
    "request_id": "req_123",
    "timestamp": "2026-04-04T10:15:08Z"
  },
  "error": {
    "code": "PLAN_LIMIT_REACHED",
    "message": "Daily free limit reached",
    "details": {}
  }
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

Return current authenticated user and workspace context.

## 4.3 POST /auth/refresh

Refresh access token.

---

# 5. Workspace APIs

## 5.1 GET /workspaces

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

Create a live session before realtime transport starts.

Request:

```json
{
  "persona_id": "teacher_english_01",
  "session_type": "language_call",
  "workspace_id": "ws_personal_001",
  "profile_id": "profile_adult_001",
  "language_mode": {
    "native_language": "vi",
    "target_language": "en",
    "correction_language": "vi"
  },
  "transport_preferences": {
    "voice_only": false,
    "avatar_enabled": true,
    "preferred_provider": "auto"
  },
  "goal": "practice_daily_conversation"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "session_id": "live_session_001",
    "status": "created",
    "usage_snapshot": {
      "free_seconds_remaining_today": 1800,
      "plan_seconds_remaining_cycle": 1800
    },
    "provider_decision": {
      "provider_family": "openai_realtime",
      "avatar_provider": "tavus",
      "fallback_mode": "voice_only"
    }
  },
  "meta": {},
  "error": null
}
```

## 7.2 POST /sessions/:session_id/connect

Move session into connectable state.

Response:

```json
{
  "ok": true,
  "data": {
    "session_id": "live_session_001",
    "status": "connect_ready"
  },
  "meta": {},
  "error": null
}
```

## 7.3 GET /sessions/:session_id

Return session state, persona, metering snapshot, moderation state, and provider state.

## 7.4 GET /sessions

List previous sessions with filters:
- `profile_id`
- `persona_id`
- `workspace_id`
- `session_type`
- `status`
- `started_after`
- `started_before`

## 7.5 POST /sessions/:session_id/end

End session and finalize metering.

Response:

```json
{
  "ok": true,
  "data": {
    "session_id": "live_session_001",
    "status": "ended",
    "billable_seconds": 1320,
    "free_seconds_remaining_today": 480,
    "summary": {
      "main_topics": [
        "introductions",
        "daily routine",
        "asking follow-up questions"
      ],
      "language_feedback": {
        "strengths": ["good fluency", "clear sentence structure"],
        "corrections": ["past tense consistency", "article usage"]
      },
      "next_recommendation": "lesson_daily_routine_a2_02"
    }
  },
  "meta": {},
  "error": null
}
```

---

# 8. Realtime APIs

## 8.1 POST /realtime/token

Issue short-lived bootstrap credentials.

Request:

```json
{
  "session_id": "live_session_001",
  "client_platform": "ios",
  "transport": "webrtc"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "session_id": "live_session_001",
    "transport": "webrtc",
    "ephemeral_token": "rt_ephemeral_001",
    "expires_in_seconds": 60,
    "provider": "openai_realtime"
  },
  "meta": {},
  "error": null
}
```

## 8.2 POST /realtime/session/bootstrap

Return all client bootstrap material in one call.

Response keys:
- `transport`
- `ephemeral_token`
- `client_events_schema_version`
- `server_events_schema_version`
- `audio_config`
- `avatar_config`
- `usage_snapshot`

Architecture note:
- use GA Realtime interface for all new builds
- use WebRTC as primary path for browser/mobile clients
- do not build new clients on legacy Realtime beta interface

---

# 9. Usage APIs

## 9.1 GET /usage/today

Response:

```json
{
  "ok": true,
  "data": {
    "date": "2026-04-04",
    "timezone": "Asia/Ho_Chi_Minh",
    "free_seconds_limit": 1800,
    "free_seconds_used": 960,
    "free_seconds_remaining": 840,
    "warning_thresholds": {
      "warn_5_min": true,
      "warn_1_min": true
    }
  },
  "meta": {},
  "error": null
}
```

## 9.2 GET /usage/cycle

Returns billing-cycle totals.

## 9.3 GET /usage/history

Returns aggregated usage history by day/week/month.

---

# 10. Plans and Subscriptions

## 10.1 GET /plans

List available plans for current workspace type.

## 10.2 GET /subscriptions/current

Return current subscription and entitlements.

## 10.3 POST /plans/upgrade

Request upgrade intent.

Request:

```json
{
  "target_plan_id": "plan_personal_pro",
  "billing_period": "monthly"
}
```

---

# 11. Curriculum and Lesson APIs

## 11.1 GET /curriculum/paths

List curriculum paths for current profile, persona, language, and level.

## 11.2 GET /lessons/:lesson_id

Return lesson metadata, objectives, tasks, vocabulary, and eligibility.

## 11.3 POST /lessons/:lesson_id/start

Start lesson-bound live session.

## 11.4 POST /lessons/:lesson_id/complete

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

Return persona-specific memory summary.

## 12.4 DELETE /memory/personas/:persona_id

Reset persona-specific memory.

## 12.5 GET /memory/sessions/:session_id/summary

Return recap and retained memory artifacts.

---

# 13. Moderation APIs

## 13.1 POST /moderation/check

Run pre-session or in-session moderation check.

Request:

```json
{
  "session_id": "live_session_001",
  "input_type": "transcript_segment",
  "content": "I want to hurt myself"
}
```

## 13.2 POST /moderation/escalate

Trigger escalation pathway for high-risk safety case.

Response may include:
- `escalation_mode`
- `persona_override`
- `safe_reply_template_id`
- `requires_human_support_guidance`

---

# 14. Provider APIs

## 14.1 GET /providers

Return allowed providers for current workspace and plan.

## 14.2 GET /avatar/providers

Return avatar provider availability and capability matrix.

## 14.3 POST /avatar/session/start

Start avatar provider session if enabled.

## 14.4 POST /avatar/session/end

Finalize avatar provider session and cost record.

---

# 15. Family APIs

## 15.1 GET /family/profiles

Return child and guardian profiles in family workspace.

## 15.2 PATCH /family/profiles/:profile_id/controls

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

List classes and assigned learners.

## 16.2 POST /school/assignments

Assign persona path or lesson pack.

## 16.3 GET /school/reports/:profile_id

Return learner progress, speaking activity, and lesson completion.

---

# 17. Business APIs

## 17.1 GET /business/agents

List organization-approved business personas.

## 17.2 POST /business/knowledge-bindings

Bind approved knowledge packs or internal KB to org persona.

## 17.3 GET /business/reports/usage

Organization usage, quota, and provider spend overview.

---

# 18. Analytics APIs

## 18.1 POST /analytics/events

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

Session state machine:
- `created`
- `connect_ready`
- `connecting`
- `active`
- `interrupted`
- `reconnecting`
- `wrapping_up`
- `ended`
- `failed`

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
