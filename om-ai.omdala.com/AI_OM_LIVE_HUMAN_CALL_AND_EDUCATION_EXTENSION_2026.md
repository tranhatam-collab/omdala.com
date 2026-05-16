# AI_OM_LIVE_HUMAN_CALL_AND_EDUCATION_EXTENSION_2026.md

Version: 1.0  
Status: Extension spec locked for DEV handoff  
Parent product: AI Om  
Master brand: OMDALA  
Extension domain: `ai.omdala.com`  
Primary runtime surfaces: iOS native app, `ai.omdala.com` PWA, `api.omdala.com`  
Date: April 4, 2026

---

# 1. Executive Summary

AI Om Live is the human-interaction extension of AI Om.  
If AI Om Core is the reality-control layer for spaces, devices, and state transitions, AI Om Live is the real-time human conversation layer for education, communication practice, emotional support, guided reflection, and language learning.

This extension adds live AI humans to the OMDALA ecosystem. A user can open the app and call an AI teacher, AI lecturer, AI language partner, AI listener, AI communication coach, or AI healing companion through a voice-first and video-first interface that feels like a real call. The core technical basis is feasible because Apple provides native calling and speech frameworks, OpenAI provides a Realtime API for low-latency multimodal and speech interactions, and avatar platforms such as Tavus and HeyGen provide real-time or API-driven human-avatar layers. [Apple Developer - CallKit](https://developer.apple.com/documentation/callkit)

AI Om Live must not be built as a toy avatar chat. It must be built as a policy-bounded, role-specific, curriculum-aware, memory-backed, usage-metered live interaction system.

---

# 2. Product Definition

## 2.1 Product Name

AI Om Live

## 2.2 Positioning

Call an AI human for learning, speaking, reflection, and growth.

## 2.3 Core Taglines

Call an AI human.  
Learn, speak, heal, grow.  
Noi chuyen nhu that. Hoc tap va dong hanh moi ngay.

## 2.4 Product Role Inside AI Om

AI Om Live is the human communication layer of AI Om.

AI Om Core handles:
- physical reality control
- spaces
- devices
- state transitions
- proofs
- memory for environments

AI Om Live handles:
- real-time human-like conversation
- education
- language practice
- guided communication
- reflection and emotional support
- persona-based session memory
- call metering
- subscription monetization

## 2.5 Product Role Inside OMDALA

OMDALA already frames itself as an operating layer for real-world coordination, state transitions, proof, and trust. AI Om Live extends that architecture into human interaction by making conversation itself a structured operating surface with intent, memory, role, policy, and measurable outcomes. [OpenAI Realtime Docs](https://developers.openai.com/api/docs/guides/realtime/)

---

# 3. Core Product Thesis

The product thesis is simple:

A user should be able to open AI Om and choose a live AI human the same way they choose a real person to call.

That AI human may be:
- an English teacher
- a Japanese tutor
- a lecturer
- a communication coach
- a listener
- a reflection guide
- a wellness companion
- a speaking-practice partner
- a business roleplay trainer

The interaction must feel close to:
- a phone call
- a video call
- a 1 to 1 lesson
- a real guided conversation

This is technically realistic because CallKit supports native VoIP-style calling integration, Speech supports recognition from recorded or live audio, the OpenAI Realtime API supports low-latency speech-to-speech and multimodal interactions, and avatar platforms expose APIs for AI-driven real-time video conversation. [Apple Developer - CallKit](https://developer.apple.com/documentation/callkit)

---

# 4. Strategic Objectives

## 4.1 Primary Objective

Create a live AI human call platform inside AI Om for education, language practice, communication training, and wellness companionship.

## 4.2 Secondary Objectives

1. Make AI Om useful every day, even when the user is not controlling devices.
2. Turn AI Om into a daily habit product, not only a utility product.
3. Build a strong recurring subscription business around live minutes, premium personas, advanced memory, and specialized curricula.
4. Give OMDALA a human interaction layer that sits alongside its physical reality layer.
5. Create a scalable education and communication platform that can serve households, students, professionals, and organizations.

---

# 5. Product Principles

## 5.1 Voice-First

The product must feel native to spoken conversation. Text chat is supported, but the core experience is live speech.

## 5.2 Role-Specific, Not Generic

Every AI human must have a clear role, scope, voice style, objectives, and limits.

## 5.3 Curriculum-Aware

Education and language practice cannot rely on free-form conversation alone. They need lessons, levels, goals, review loops, and measurable progress.

## 5.4 Memory-Backed

The system must remember user level, preferences, prior sessions, common mistakes, emotional context boundaries, and lesson progress.

## 5.5 Policy-Bounded

The product must refuse unsafe roles, risky promises, and prohibited medical or regulated use patterns. Apple's Foundation Models framework has acceptable-use requirements, and developers are expected to respect them. [Apple Foundation Models Acceptable Use](https://developer.apple.com/apple-intelligence/acceptable-use-requirements-for-the-foundation-models-framework/)

## 5.6 Native-First for Call Experience

The best call experience must be built natively on iOS because Apple provides system-level calling integration and app action surfaces through CallKit and App Intents. [Apple Developer - CallKit](https://developer.apple.com/documentation/callkit)

## 5.7 Provider-Agnostic Avatar Layer

AI Om must not hard-lock itself to a single avatar vendor. The avatar layer must be adapter-based.

---

# 6. Supported Use Cases

## 6.1 Education

- 1 to 1 tutor calls
- AI lecturer calls
- homework explanation
- concept review
- exam preparation
- guided study sessions
- daily learning routines

## 6.2 Language Learning

- English speaking practice
- multilingual conversation practice
- pronunciation correction
- roleplay for real-life situations
- interview practice
- travel conversation practice
- business English and workplace language

## 6.3 Communication Practice

- public speaking rehearsal
- sales roleplay
- customer support roleplay
- relationship communication practice
- interview coaching
- presentation rehearsal
- difficult conversation simulation

## 6.4 Wellness and Reflection

- guided breathing
- journaling through conversation
- emotional check-in
- stress de-escalation
- gentle companionship
- reflective questioning
- daily grounding

This layer must be positioned as wellness support, guided reflection, and companionship. It must not be positioned as licensed clinical therapy or emergency mental-health care.

---

# 7. User Modes

## 7.1 Learner Mode

For students and self-learners.

## 7.2 Language Partner Mode

For daily speaking practice and multilingual fluency building.

## 7.3 Coach Mode

For communication, confidence, interviewing, sales, and presentation practice.

## 7.4 Listener Mode

For lighter emotional support, daily conversation, and reflection.

## 7.5 Lecturer Mode

For structured subject teaching with lesson plans and explanations.

## 7.6 Organization Mode

For schools, teams, learning centers, enterprise training, and structured workforce learning.

---

# 8. Surface Architecture

## 8.1 Native iOS App

Primary responsibilities:
- real-time call UI
- audio routing
- push-to-talk fallback
- video/avatar rendering
- call controls
- usage countdown
- in-call prompts
- native permissions
- subscription and session state
- Apple integration surfaces

CallKit exists to integrate calling services with the system and provide calling UI, while the app handles its own calling backend. App Intents integrates app actions with Siri and Apple Intelligence. [Apple Developer - CallKit](https://developer.apple.com/documentation/callkit)

## 8.2 `ai.omdala.com` PWA

Primary responsibilities:
- persona browser
- schedule and learning dashboard
- history
- session replays and summaries
- memory editing
- subscription management
- organization admin
- curriculum management
- support center

## 8.3 `api.omdala.com`

Primary responsibilities:
- sessions
- personas
- curriculum
- usage metering
- billing integration
- memory
- moderation
- analytics
- avatar provider orchestration
- realtime token issuance

---

# 9. System Architecture

## 9.1 Layer 1 - Call Experience Layer

Native iOS call UI, session state, mute, speaker, Bluetooth route, camera state, avatar display, usage timer, and call-end summaries.

Apple CallKit is the natural pattern for integrating a VoIP-like calling experience with the system. [Apple Developer - CallKit](https://developer.apple.com/documentation/callkit)

## 9.2 Layer 2 - Realtime Conversation Engine

This layer handles:
- speech input
- text input
- multimodal context
- response generation
- speech output
- interruption handling
- low-latency turn-taking

The OpenAI Realtime API is documented for low-latency multimodal applications, with support for speech-to-speech interactions and connections via WebRTC, WebSocket, and SIP. For browser and mobile clients, OpenAI recommends WebRTC. [OpenAI Realtime Docs](https://developers.openai.com/api/docs/guides/realtime/)

## 9.3 Layer 3 - Avatar Provider Adapter

This layer maps the conversation output into a visual AI human.

Supported provider strategy:
- Tavus adapter
- HeyGen adapter
- custom future provider adapter
- no-avatar voice-only mode
- still-image talking-head mode

Tavus documents its Conversational Video Interface as a real-time multimodal framework where an AI agent can see, hear, and respond naturally, and its API overview describes a Persona plus Replica pipeline. HeyGen documents API and SDK support for streaming avatars and LiveAvatar real-time interactions. [Tavus CVI Overview](https://docs.tavus.io/sections/conversational-video-interface/overview-cvi)

## 9.4 Layer 4 - Persona and Curriculum Engine

This layer defines:
- who the AI human is
- how they talk
- what they know
- what they are allowed to do
- what they teach
- how they adapt to the user
- how progress is measured

## 9.5 Layer 5 - Memory and Analytics Layer

This layer stores:
- learning progress
- vocabulary weaknesses
- pronunciation issues
- session outcomes
- preferred correction style
- emotional boundaries
- persona affinity
- usage history

## 9.6 Layer 6 - Metering and Subscription Layer

This layer enforces:
- 30 free minutes per day
- premium limits
- overage rules
- package access
- organization quotas
- provider cost controls

---

# 10. Realtime Architecture Decision

## 10.1 Recommended Runtime Path

For mobile production:
- iOS native client
- secure backend session bootstrap
- realtime ephemeral session issuance
- OpenAI Realtime for live conversation
- avatar provider stream attached when enabled
- backend metering, memory, moderation, and analytics

## 10.2 Connection Strategy

Preferred:
- WebRTC for mobile realtime session transport

Fallback:
- WebSocket where appropriate for server-side bridges or support tooling

OpenAI documentation notes WebRTC support and recommends WebRTC for browser and mobile clients, while WebSocket is recommended for server-to-server integrations. [OpenAI API Docs](https://developers.openai.com/api/docs/)

## 10.3 Audio Strategy

Input:
- device microphone
- Bluetooth headset mic
- wired accessory mic where supported

Output:
- phone speaker
- Bluetooth headphones
- Bluetooth speakers
- earpiece route
- AirPods and supported accessories

Speech recognition from live audio is supported by Apple's Speech framework. [Apple Developer - Speech](https://developer.apple.com/documentation/speech)

---

# 11. Persona System

## 11.1 Persona Definition

A persona is a live AI human profile with:
- display name
- role
- subject or mission
- target audience
- conversation style
- correction style
- teaching strategy
- emotional tone
- language set
- visual style
- allowed boundaries
- memory scope
- curriculum scope
- moderation profile

## 11.2 Core Persona Categories

### Teacher

Subject-focused educator.

### Language Partner

Natural speaking companion for multilingual practice.

### Lecturer

More formal long-form explanation style.

### Listener

Gentle conversational partner for reflection and emotional support.

### Coach

Performance and communication guidance.

### Companion

Daily life conversation and encouragement.

## 11.3 Persona Object

```json
{
  "persona_id": "teacher_english_01",
  "display_name": "Emily",
  "role": "english_teacher",
  "primary_languages": ["en", "vi"],
  "teaching_style": "patient_structured_conversational",
  "correction_style": "gentle_inline",
  "avatar_profile_id": "avatar_professional_friendly_01",
  "voice_profile_id": "voice_warm_female_en_01",
  "safety_profile_id": "education_safe_default",
  "memory_scope": "per_user_long_term",
  "curriculum_scope": "english_a1_to_c1"
}
```

---

# 12. Curriculum System

## 12.1 Why Curriculum Is Mandatory

Education quality collapses if the product relies only on free-form talk. AI Om Live must support structured pathways.

## 12.2 Curriculum Components

- level
- topic
- lesson
- sublesson
- goal
- vocabulary set
- grammar set
- comprehension task
- speaking task
- review loop
- checkpoint
- completion state

## 12.3 Curriculum Modes

### Free Conversation Mode

Open speaking with light correction.

### Guided Lesson Mode

Structured lesson with progress tracking.

### Drill Mode

Focused repetition on pronunciation, grammar, or vocabulary.

### Roleplay Mode

Simulated real-world situation.

### Exam Mode

Time-bound mock test or practice session.

## 12.4 Lesson Plan Object

```json
{
  "lesson_id": "eng_a2_restaurant_01",
  "language": "en",
  "level": "A2",
  "title": "Ordering Food at a Restaurant",
  "objectives": [
    "ask for a table",
    "order food politely",
    "ask for the bill"
  ],
  "key_vocabulary": [
    "reservation",
    "menu",
    "bill",
    "recommend"
  ],
  "speaking_tasks": [
    "roleplay_ordering",
    "clarify_a_mistake",
    "ask_for_recommendation"
  ],
  "review_mode": "end_of_session"
}
```

---

# 13. Language Learning Architecture

## 13.1 Supported Language Model

The system must support:
- native language of the user
- target learning language
- mixed bilingual support
- correction language preference
- feedback language preference

## 13.2 Core Language Features

- live speaking practice
- pronunciation correction
- grammar correction
- vocabulary suggestions
- translation on demand
- bilingual explanation
- roleplay simulation
- speaking fluency score
- session recap

OpenAI's audio and realtime documentation supports multilingual voice-agent usage through realtime audio workflows.

## 13.3 Correction Modes

- no interruption
- gentle interruption
- inline correction
- post-turn correction
- end-of-session correction only

---

# 14. Wellness and Healing Companion Rules

## 14.1 Allowed Scope

- stress relief conversation
- breathing guidance
- reflection prompts
- journaling support
- companionship
- gentle encouragement
- grounding exercises
- emotional labeling help

## 14.2 Disallowed Scope

- diagnosis
- crisis intervention as a substitute for emergency services
- pretending to be a licensed therapist
- medication recommendations
- emergency instructions beyond safe escalation guidance

## 14.3 Escalation Rules

If the user expresses:
- self-harm risk
- danger to others
- severe crisis indicators
- urgent medical distress

the system must:
- stop ordinary persona behavior
- switch to safety response mode
- advise urgent human support or emergency help
- follow escalation copy approved by policy/legal team

---

# 15. Avatar Provider Adapter

## 15.1 Purpose

Keep AI Om independent from any single avatar vendor.

## 15.2 Supported Modes

- realtime interactive avatar
- streaming avatar
- generated avatar video
- still portrait with lip-sync layer
- voice-only fallback

## 15.3 Provider Interface

```json
{
  "provider": "tavus",
  "mode": "realtime_avatar",
  "avatar_profile_id": "replica_01",
  "persona_binding": "teacher_english_01",
  "session_transport": "provider_stream",
  "supports_bidirectional_video": true,
  "supports_voice_only_fallback": true
}
```

## 15.4 Initial Provider Strategy

### Tavus

Use for premium real-time conversational video experiences. Tavus documents CVI as a real-time multimodal video interaction framework and its API overview describes an end-to-end pipeline for AI replicas with personas.

### HeyGen

Use as alternate realtime or generated avatar provider. HeyGen documentation and product pages describe streaming avatars and LiveAvatar for lifelike real-time AI presence.

### Voice-Only

Must remain available when avatar providers are unavailable, too expensive, or disabled by plan.

---

# 16. Call Experience Design

## 16.1 Call Types

- audio call
- video avatar call
- lesson call
- coaching call
- listener call
- organization training call

## 16.2 Main In-Call UI Elements

- avatar or call portrait
- persona name
- call timer
- mute
- speaker
- Bluetooth route
- end call
- transcript drawer
- lesson progress
- correction toggle
- language mode
- recap flag
- subscription time left

## 16.3 Call States

- initiating
- connecting
- active
- interrupted
- reconnecting
- low-time warning
- wrap-up
- ended
- failed

## 16.4 Wrap-Up Flow

At end of call:
- summarize what happened
- show minutes used
- show today's remaining free time if on Free
- show vocabulary or lesson recap
- offer next lesson or next call
- offer upgrade if relevant

---

# 17. Free Usage and Metering

## 17.1 Free Plan Rule

Every user receives:
- 30 minutes free per day

## 17.2 Daily Reset Rule

Usage resets once per calendar day according to the user's primary timezone or the billing account timezone policy.

## 17.3 Metering Rule

Metering must happen server-side, not client-side.

Track at minimum:
- `user_id`
- `plan_id`
- `session_id`
- `persona_id`
- `session_type`
- `start_time`
- `end_time`
- `billable_seconds`
- `free_seconds_used_today`
- `premium_seconds_used_this_cycle`

## 17.4 Free Plan Limits

Recommended initial limits:
- 30 min per day
- limited personas
- standard voice quality
- standard avatar quality or voice-only fallback
- short memory horizon
- no advanced reports
- limited premium lessons

## 17.5 Low-Time Experience

At 5 minutes remaining:
- visual warning
- subtle spoken warning if enabled

At 1 minute remaining:
- final warning
- soft landing prompt

At limit reached:
- complete current sentence
- end gracefully
- show upgrade options

---

# 18. Subscription and Pricing Structure

## 18.1 Plan Architecture

### Free

- 30 minutes daily
- 1 to 2 core personas
- basic lessons
- standard memory
- voice and limited video depending on cost policy

### Personal Pro

- larger minute pool
- more personas
- long-term memory
- richer language practice
- premium correction modes
- premium recap and reports

### Education Plus

- multi-subject teachers
- structured lesson pathways
- homework mode
- parent or learner reports
- study plans
- richer retention tools

### Business / Enterprise

- training personas
- organization dashboard
- team quotas
- roleplay modules
- admin analytics
- enterprise memory controls
- team and campus deployment options

## 18.2 Billing Principle

Do not sell avatar minutes as the only story. Sell outcomes:
- better learning
- daily speaking practice
- personalized guidance
- trusted support
- repeatable growth

---

# 19. Memory Model

## 19.1 Memory Layers

### Identity Memory

Name, timezone, goals, language preferences, and role.

### Learning Memory

Level, completed lessons, weak areas, and progress trends.

### Session Memory

Recent conversations, unresolved questions, and next steps.

### Persona Affinity Memory

Which personas the user likes and what style works best.

### Emotional Preference Memory

Preferred tone, sensitivity level, and reflection boundaries.

### Subscription Memory

Free vs paid state, quota usage, and preferred plan prompts.

## 19.2 Memory Controls

The user must be able to:
- view important memory
- edit important memory
- reset persona-specific memory
- delete session history
- export meaningful summaries where policy allows

---

# 20. Moderation and Safety

## 20.1 Moderation Layers

- input moderation
- persona instruction constraints
- output moderation
- escalation routing
- admin review tools

## 20.2 High-Risk Areas

- self-harm
- violent threats
- abusive exploitation
- illegal activity
- explicit impersonation of real persons without consent
- medical diagnosis
- regulated financial instructions
- minor safety issues
- sexual exploitation risks

## 20.3 Persona Safety Profiles

Every persona must map to a safety profile:
- `education_safe_default`
- `language_partner_default`
- `wellness_safe_default`
- `coach_safe_default`
- `enterprise_training_default`

## 20.4 Foundation Models Caution

If any Apple Foundation Models features are used on-device for augmentation, they must remain inside Apple's acceptable use requirements and not be treated as blanket authorization for regulated or unsafe experiences.

---

# 21. Analytics

## 21.1 Product Analytics

Track:
- daily active callers
- average session length
- free-to-paid conversion
- persona retention
- lesson completion rate
- language practice frequency
- first-call completion
- reconnect success
- avatar fallback rate
- provider failure rate

## 21.2 Education Analytics

Track:
- level progression
- vocabulary retention
- grammar correction patterns
- pronunciation difficulty areas
- roleplay completion
- lesson streaks

## 21.3 Wellness Analytics

Track only safe aggregate metrics:
- session frequency
- preferred support mode
- completion rate
- reflection prompt engagement

Avoid using wellness signals in creepy or exploitative ways.

---

# 22. API Design

## 22.1 Base Path

`/v2/live`

## 22.2 Core API Groups

### Personas

- `GET /personas`
- `GET /personas/:id`
- `POST /personas/:id/favorite`

### Sessions

- `POST /sessions/create`
- `POST /sessions/:id/connect`
- `POST /sessions/:id/end`
- `GET /sessions/:id`
- `GET /sessions`

### Realtime

- `POST /realtime/token`
- `POST /realtime/session/bootstrap`

### Memory

- `GET /memory/profile`
- `PATCH /memory/profile`
- `GET /memory/personas/:id`
- `DELETE /memory/personas/:id`

### Curriculum

- `GET /curriculum/paths`
- `GET /lessons/:id`
- `POST /lessons/:id/start`
- `POST /lessons/:id/complete`

### Usage

- `GET /usage/today`
- `GET /usage/cycle`
- `GET /plans`
- `POST /plans/upgrade`

### Moderation

- `POST /moderation/check`
- `POST /moderation/escalate`

### Avatar Providers

- `GET /avatar/providers`
- `POST /avatar/session/start`
- `POST /avatar/session/end`

---

# 23. Session Contracts

## 23.1 Create Session Request

```json
{
  "user_id": "user_01",
  "persona_id": "teacher_english_01",
  "session_type": "language_call",
  "language_mode": {
    "native_language": "vi",
    "target_language": "en",
    "correction_language": "vi"
  },
  "avatar_enabled": true,
  "goal": "practice_daily_conversation",
  "plan_context": "free"
}
```

## 23.2 Create Session Response

```json
{
  "session_id": "live_session_01",
  "status": "ready",
  "realtime_transport": "webrtc",
  "realtime_bootstrap_token": "server_generated_ephemeral_token",
  "avatar": {
    "enabled": true,
    "provider": "tavus",
    "mode": "realtime_avatar"
  },
  "usage": {
    "free_seconds_remaining_today": 1800
  }
}
```

## 23.3 End Session Response

```json
{
  "session_id": "live_session_01",
  "billable_seconds": 1320,
  "free_seconds_remaining_today": 480,
  "summary": {
    "main_topics": [
      "introductions",
      "daily routine",
      "asking follow-up questions"
    ],
    "language_feedback": {
      "strengths": [
        "good fluency",
        "clear sentence structure"
      ],
      "corrections": [
        "past tense consistency",
        "article usage"
      ]
    },
    "next_recommendation": "lesson_daily_routine_a2_02"
  }
}
```

---

# 24. iOS Native Module List

## 24.1 App Shell

Navigation, auth, session state.

## 24.2 Call UI Module

Live session screen, controls, connection states.

## 24.3 Audio Routing Module

Mic, speaker, Bluetooth, and interruption handling.

## 24.4 Transcript Module

Live transcript, correction overlays, and recap rendering.

## 24.5 Persona Browser Module

Browse and filter AI humans.

## 24.6 Subscription Module

Free limit, upgrade prompts, and plan status.

## 24.7 Lesson Module

Lesson flow, tasks, and review states.

## 24.8 Memory Module

Learning profile, session history, and preferences.

## 24.9 App Intents Module

Launch key actions via Siri, Shortcuts, and Apple Intelligence surfaces where appropriate. Apple documents App Intents as the mechanism to integrate app actions and content with Siri and Apple Intelligence.

## 24.10 Speech Module

Live audio recognition and speech handling. Apple documents Speech for recognizing spoken words in recorded or live audio.

## 24.11 Foundation Models Augmentation Module

Optional on-device assistance for supported devices, never the only critical path. Apple documents Foundation Models as access to Apple's on-device language model for intelligent tasks.

---

# 25. PWA Scope

The PWA is not the best primary surface for full premium call fidelity, but it is important for reach and account management.

## 25.1 PWA Must Support

- account and onboarding
- persona browsing
- scheduling
- session history
- transcript review
- memory editing
- lesson plan browsing
- subscription management
- organization admin
- browser-based fallback calls where supported

## 25.2 PWA Must Not Be Treated As

- the only premium live-call surface
- the source of truth for usage metering
- the deepest native audio routing experience

---

# 26. Organization Mode

## 26.1 Education Organizations

Support:
- student accounts
- course assignment
- teacher persona assignment
- progress tracking
- usage quotas
- classroom topic packs

## 26.2 Enterprise Organizations

Support:
- sales roleplay
- customer support roleplay
- interview training
- onboarding simulations
- language training
- communication coaching
- admin dashboards

---

# 27. Non-Functional Requirements

## 27.1 Low Latency

Conversation must feel immediate enough for turn-taking.

## 27.2 Reliable Reconnection

If the stream drops, the session should attempt graceful recovery.

## 27.3 Cost-Aware Routing

The backend must be able to route between:
- avatar on
- avatar off
- premium provider
- fallback provider
- voice-only mode

## 27.4 Privacy

Voice, session memory, and learning history must be governed clearly.

## 27.5 Explainability

After each session, the system should be able to say:
- what was practiced
- what improved
- what remains weak
- what to do next

---

# 28. Rollout Plan

## Phase 0 - 0 to 4 Weeks

Deliver:
- persona architecture
- live session API contracts
- iOS call shell
- basic voice-only realtime prototype
- usage metering core
- 30 min free/day enforcement
- one teacher persona
- one language partner persona

## Phase 1 - 1 to 3 Months

Deliver:
- iOS live call MVP
- voice-only production beta
- avatar provider adapter v1
- English learning path v1
- daily recap
- subscription paywall
- TestFlight pilot

## Phase 2 - 3 to 6 Months

Deliver:
- video avatar premium mode
- more personas
- communication coach
- listener mode
- learning dashboard
- multilingual pathways
- organization alpha

## Phase 3 - 6 to 12 Months

Deliver:
- education suite
- enterprise suite
- richer memory controls
- adaptive curriculum
- provider optimization
- wider language catalog
- full business monetization

---

# 29. MVP Lock

## 29.1 MVP Must Demonstrate

1. User can browse personas.
2. User can start a live call.
3. User can speak naturally and receive real-time responses.
4. User can use the app for English speaking practice.
5. User gets 30 free minutes per day.
6. The system measures usage server-side.
7. The system provides a recap after the call.
8. The system can upsell to a paid plan.
9. The system works in voice-only mode even if avatar is unavailable.
10. The experience feels useful enough for daily return.

## 29.2 MVP Persona Set

- English Teacher
- English Conversation Partner
- Gentle Listener

That is enough to prove the category before broader expansion.

---

# 30. Hard Rules for DEV

1. Do not build this as a generic avatar demo.
2. Do not hardcode one avatar provider into the whole architecture.
3. Do not meter free minutes on-device only.
4. Do not position wellness mode as medical therapy.
5. Do not launch education mode without structured recap and lesson logic.
6. Do not let persona prompts drift without safety profiles.
7. Do not rely on PWA alone for the premium calling experience.
8. Do not make avatar video mandatory for every plan.
9. Do not let memory become an unstructured chat dump only.
10. Do not sacrifice latency and call stability for visual effects.

---

# 31. Final Architecture Decision

AI Om Live is approved to be built as:

AI Om Core  
-> physical reality control

AI Om Live  
-> AI human call platform for learning, communication, and wellness support

Native iOS App  
-> premium real-time call cockpit

`ai.omdala.com`  
-> orchestration, management, recap, curriculum, memory, subscription, admin

OpenAI Realtime Layer  
-> low-latency conversation engine

Avatar Provider Adapter Layer  
-> Tavus / HeyGen / future providers / voice-only fallback

OMDALA Backend  
-> sessions, memory, moderation, metering, billing, analytics, curriculum

This design is feasible because the required categories of platform support exist today across Apple's calling, speech, and app-integration frameworks, OpenAI's realtime speech stack, and avatar-provider APIs.

---

# 32. Immediate Next Actions

1. Lock persona schema v1.
2. Lock `/v2/live` API contracts.
3. Build native iOS call shell.
4. Implement server-side usage metering with 30 min/day free rule.
5. Build voice-only realtime MVP first.
6. Add one avatar provider through adapter pattern.
7. Launch English Teacher beta.
8. Add recap, memory, and upgrade prompts.
9. Pilot with real users before widening persona library.
10. Expand into multilingual and organization modes after retention proof.
