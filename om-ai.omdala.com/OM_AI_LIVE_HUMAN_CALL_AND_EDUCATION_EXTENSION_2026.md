# Om AI Live Human Call And Education Extension 2026

Version: 1.0  
Status: Locked extension for immediate DEV build  
Canonical product name: Om AI Live  
Parent system: Om AI / OMDALA  
Date: April 4, 2026

## 1. Purpose

Define the production-grade extension that turns Om AI into a real-time AI human calling platform on iPhone for education, language practice, coaching, guided reflection, and wellness companionship.

## 2. Verified Building Blocks

This extension is grounded on current platform capabilities:

- Apple `CallKit` for system call UI and VoIP coordination.
- Apple `Speech` for live speech recognition and transcript services.
- Apple `App Intents` for system-call shortcuts, quick actions, and Siri exposure.
- OpenAI Realtime API for low-latency speech-to-speech sessions over WebRTC, plus WebSocket or SIP where required.
- Tavus CVI for real-time conversational video interfaces with persona and replica concepts.
- HeyGen `LiveAvatar` as the current real-time avatar path, not the deprecated interactive-avatar direction.

## 3. Product Promise

`Call an AI human. Learn, speak, heal, grow.`

The product is not “avatar video generation.” It is a live interactive operating layer where each AI human has:

- a face or visual identity,
- a voice,
- a role,
- bounded knowledge,
- memory,
- session goals,
- safety rules,
- plan-based usage limits.

## 4. User-Facing Product Modules

- `Om AI Teacher`
- `Om AI Language Partner`
- `Om AI Listener`
- `Om AI Healing Companion`
- `Om AI Coach`
- `Om AI Lecturer`

## 5. Architecture

### 5.1 Layer 1: iOS Call Surface

Responsibilities:

- outgoing call initiation from persona card or quick action
- active call UI: mute, speaker, Bluetooth, reconnect, hang up
- call state transitions: dialing, connecting, connected, reconnecting, ending, ended
- session warning banners for time limit and safety notices
- recap card after call end

### 5.2 Layer 2: Realtime Conversation Engine

Responsibilities:

- start session with ephemeral or server-managed token flow
- stream microphone audio to realtime model
- receive model audio output with low latency
- exchange side-channel events for tool calls, moderation, captions, and session state
- support transport strategy:
  - `WebRTC` for mobile client session
  - `WebSocket` for server-side orchestration and controlled relays
  - `SIP` for future PSTN or phone-number scenarios

### 5.3 Layer 3: Avatar Provider Adapter

Responsibilities:

- create avatar session
- bind persona metadata to selected provider
- expose consistent session controls independent of provider
- normalize provider capabilities:
  - latency target
  - voice-video sync state
  - stream health
  - reconnect strategy
  - pricing profile

Provider-neutral interface:

```ts
export type AvatarProvider = 'tavus' | 'heygen' | 'custom_video_avatar' | 'future_provider';

export interface AvatarSessionRequest {
  provider: AvatarProvider;
  personaId: string;
  avatarMode: 'realtime_stream' | 'generated_video' | 'still_image_talking';
  faceStyle: 'realistic' | 'elegant' | 'friendly' | 'professional' | 'youthful' | 'mature';
  consentMode: 'stock' | 'synthetic' | 'licensed_custom';
  language: string;
  voiceId: string;
}
```

### 5.4 Layer 4: Persona + Curriculum + Memory

Responsibilities:

- attach system instructions and guardrails
- attach lesson plan or roleplay objective
- load user profile and progress state
- write recap, next-step, and user progress artifacts after call end

### 5.5 Layer 5: Billing + Metering

Responsibilities:

- enforce plan eligibility before session creation
- meter real connected time
- issue in-session warnings
- soft-stop when quota is exhausted
- persist usage for billing, analytics, and anti-abuse review

## 6. Persona Schema

```json
{
  "persona_id": "om_teacher_english_01",
  "display_name": "Mia",
  "product_line": "teacher",
  "tagline": "English speaking teacher for daily fluency.",
  "languages": {
    "teaching_language": ["en"],
    "user_native_language_support": ["vi"]
  },
  "tone": {
    "style": "warm_clear_confident",
    "formality": "balanced",
    "interruptibility": "medium"
  },
  "capabilities": {
    "live_voice": true,
    "live_avatar": true,
    "lesson_plan": true,
    "pronunciation_feedback": true,
    "roleplay": true
  },
  "knowledge_scope": [
    "daily_english",
    "pronunciation",
    "travel_conversation",
    "interview_practice"
  ],
  "safety_profile": "wellness_safe_non_regulated",
  "memory_policy": {
    "remember_name": true,
    "remember_level": true,
    "remember_recent_goals": true,
    "remember_sensitive_health_claims": false
  },
  "limits": {
    "max_session_minutes_free": 30,
    "max_session_minutes_pro": 120
  }
}
```

## 7. Curriculum Schema

```json
{
  "curriculum_id": "eng_speaking_a2_daily_01",
  "mode": "language_practice",
  "level": "A2",
  "goal": "Build daily speaking confidence over 6 weeks.",
  "lesson_units": [
    {
      "unit_id": "unit_01",
      "title": "Introductions and daily routines",
      "outcomes": [
        "introduce yourself clearly",
        "answer simple follow-up questions",
        "use present simple in short responses"
      ],
      "call_formats": ["guided_call", "roleplay_call", "pronunciation_drill"],
      "assessment": {
        "rubric": ["fluency", "pronunciation", "grammar_control", "confidence"],
        "pass_threshold": 0.7
      }
    }
  ]
}
```

## 8. Memory Model

Memory must be split by sensitivity and use case.

### 8.1 User Profile Memory

- name
- preferred language
- timezone
- plan
- learning goals
- persona preferences

### 8.2 Progress Memory

- current level
- completed lessons
- pronunciation issues
- frequent grammar errors
- confidence notes
- next recommended lesson

### 8.3 Session Memory

- transcript summary
- main topics
- corrections made
- user mood markers when allowed
- moderation events
- minutes used

### 8.4 Safety Memory

- repeated boundary triggers
- redirection templates used
- escalation recommendations

## 9. iOS Call Flow

1. User opens Om AI app.
2. User taps a persona card or quick call action.
3. App requests or validates plan eligibility and daily minutes.
4. CallKit-like surface enters `dialing` state.
5. Backend creates realtime session and returns session credentials plus provider instructions.
6. Audio channel opens.
7. Avatar layer attaches if available.
8. Call moves to `connected`.
9. In-call overlays show transcript, timer, mute, speaker, and note chips.
10. When 5 free minutes remain, user receives a non-blocking warning.
11. When quota is reached, Om AI waits for a sentence boundary, then performs a soft landing.
12. Session ends.
13. Recap screen shows summary, minutes used, strengths, mistakes, next lesson, and upgrade CTA if needed.

## 10. Usage Policy

### 10.1 Free Daily Access

- 30 minutes per day
- one or two basic personas
- standard response priority
- short-term memory
- limited lesson depth
- no advanced analytics export

### 10.2 Metering Rules

- count connected real-time minutes only
- round to 30-second blocks or 1-minute blocks at policy level
- warnings at 5 minutes and 1 minute remaining
- backend is the source of truth
- client displays, backend enforces

### 10.3 Soft-Landing Behavior

When usage is exhausted:

- do not terminate mid-sentence,
- deliver a courteous wrap-up,
- offer upgrade or tomorrow reminder,
- store a graceful session end reason.

## 11. Pricing Structure

### 11.1 Free

- 30 minutes/day
- 1 to 2 core personas
- basic lesson recaps
- standard avatar quality

### 11.2 Personal Pro

- 90 to 120 minutes/day or monthly minute bank
- more personas
- long-term memory
- pronunciation feedback
- structured lesson paths
- higher response priority

### 11.3 Education Plus

- multi-subject tutor mode
- homework mode
- parent or learner reports
- weekly study plans
- replay notes

### 11.4 Business / Enterprise

- sales roleplay
- support simulations
- internal training lecturers
- team analytics
- admin quota controls

## 12. API Contract v1 For Live

### 12.1 Create Session

`POST /v2/live/sessions/create`

```json
{
  "persona_id": "om_teacher_english_01",
  "session_mode": "voice_avatar",
  "transport": "webrtc",
  "user_id": "user_01",
  "curriculum_id": "eng_speaking_a2_daily_01",
  "goal": "practice self introduction for 10 minutes",
  "device_context": {
    "platform": "ios",
    "app_version": "2026.04.04"
  }
}
```

### 12.2 Session Response

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
      "mode": "realtime_stream",
      "stream_url": "wss://example.invalid/avatar"
    },
    "usage": {
      "minutes_remaining_today": 18,
      "warning_threshold_minutes": 5
    }
  },
  "error": null,
  "meta": {
    "product": "om_ai_live"
  }
}
```

### 12.3 End Session

`POST /v2/live/sessions/:id/end`

```json
{
  "reason": "user_ended",
  "client_duration_seconds": 742,
  "summary_requested": true
}
```

### 12.4 Usage Today

`GET /v2/live/usage/today`

```json
{
  "data": {
    "plan": "free",
    "minutes_used_today": 12,
    "minutes_limit_today": 30,
    "minutes_remaining_today": 18,
    "bonus_minutes": 0,
    "soft_limit_behavior": "finish_current_turn_then_prompt_upgrade"
  },
  "error": null,
  "meta": {}
}
```

## 13. Moderation and Safety Rules

### 13.1 Allowed

- learning support
- communication practice
- emotional support language
- breathing and reflection guidance
- encouragement without dependency framing

### 13.2 Disallowed

- diagnosis claims
- therapy replacement claims
- emergency substitution
- manipulative romance or coercive dependency design
- illegal or harmful instruction
- realistic impersonation without consent

### 13.3 Escalation Pattern

If risk is detected:

1. acknowledge carefully,
2. stop unsafe role framing,
3. redirect to safe support,
4. surface emergency/help guidance when severity requires,
5. log `moderation_status` and `escalation_type`.

## 14. Analytics Model

Track:

- session created
- session connected
- transport selected
- avatar provider selected
- avatar degraded to audio-only
- call ended
- recap delivered
- lesson completed
- upgrade viewed
- upgrade accepted
- moderation triggered
- minutes exhausted

Derived KPIs:

- daily active callers
- average connected minutes
- recap open rate
- lesson completion rate
- avatar failure rate
- free-to-paid conversion
- retention by persona family

## 15. Delivery Order

### Phase 0: Locked Today

- brand lock
- persona schema
- curriculum schema
- usage policy
- backend endpoint design
- iOS call state design
- safety and moderation rules

### Phase 1: Build First

- session creation API
- usage meter service
- iOS voice-only live call
- recap generation
- persona registry

### Phase 2: Build Next

- avatar provider adapter
- Tavus connector
- HeyGen LiveAvatar connector
- lesson plan persistence
- subscription paywall

### Phase 3: Optimize

- advanced pronunciation scoring
- business dashboards
- multi-user organization controls
- more languages and premium personas

## 16. Acceptance Criteria

This extension is ready for DEV build when:

- every persona has a bounded schema,
- live session APIs are defined,
- free-minute logic is enforceable on backend,
- iOS call states are specified,
- avatar strategy has provider abstraction,
- wellness safety rules are explicit,
- recap, memory, and analytics outputs are defined.
