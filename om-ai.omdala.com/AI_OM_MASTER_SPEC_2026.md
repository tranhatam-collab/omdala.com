# Om AI Master Spec 2026

Version: 2.0  
Status: Locked for immediate DEV handoff  
Canonical product name: Om AI  
Legacy file namespace: `AI_OM_*` retained temporarily for repository continuity  
Master brand: OMDALA  
Primary surfaces: `ai.omdala.com`, `app.ai.omdala.com`, `api.omdala.com`, native iPhone app  
Document owner: Product / Architecture / AI Systems  
Date: April 4, 2026

## 1. Executive Summary

Om AI is no longer positioned as only a smart-home execution layer. The product is now locked as a dual-surface operating system inside OMDALA:

1. `Om AI Reality Agent`: controls spaces, devices, scenes, routines, approvals, and verified physical execution.
2. `Om AI Live`: lets the user call an AI human in real time on iPhone for learning, speaking, coaching, guided reflection, and wellness support.

The correct category is therefore:

**Om AI = Reality + Human Interaction OS**

This means one app can both change physical reality and host live voice or video interaction with specialized AI humans such as:

- English teacher
- language partner
- listener
- healing companion
- communication coach
- AI lecturer

The product must be built as controller-first, native-first, policy-first, proof-first, and memory-first. iOS remains the strategic anchor because Apple frameworks expose the highest-value device and call surfaces natively. The backend remains the system of record for planning, policy, proof, memory, metering, moderation, subscriptions, and provider orchestration.

## 2. Product Definition

### 2.1 Canonical Product Name

Om AI

### 2.2 Product Equation

Om AI = Personal Reality Agent + AI Human Call Platform

### 2.3 Core Positioning

Your Reality and Human Interaction OS

### 2.4 Core Taglines

- `Speak. Call. Change reality.`
- `Call an AI human. Learn, speak, heal, grow.`
- `From intent to verified reality.`

### 2.5 Product Role Inside OMDALA

Om AI is the applied execution and interaction layer of OMDALA. It turns spaces, devices, lessons, sessions, and memory into governed nodes inside one operating graph. OMDALA defines state, desired state, transition path, proof, governance, and trust. Om AI applies that logic to both physical environments and human-facing AI interaction.

## 3. Brand Lock

### 3.1 Brand Rules

- Always write the product name as `Om AI`.
- Do not introduce `AI Om` in new copy, product surfaces, tickets, or specs.
- Existing filenames may temporarily remain under `AI_OM_*` until a dedicated repo-wide rename.
- `OMDALA` remains the parent/master brand.

### 3.2 Product Family Names

- `Om AI Reality`
- `Om AI Live`
- `Om Gateway`
- `OMDALA Reality API`

### 3.3 Live Sub-Brands

- `Om AI Teacher`
- `Om AI Language Partner`
- `Om AI Listener`
- `Om AI Healing Companion`
- `Om AI Coach`
- `Om AI Lecturer`

## 4. Strategic Direction

### 4.1 What Changed

The old framing was too narrow: “execution agent for spaces and devices.”

The new framing is stronger and commercially broader:

- the user can control rooms, devices, and scenes,
- the user can also call a specialized AI human with voice, face, memory, and role constraints,
- both experiences share identity, policy, analytics, subscription, and memory infrastructure.

### 4.2 Why This Matters

This shifts Om AI from a utility product into a daily-use product with repeatable engagement loops:

- household and workspace control,
- daily learning,
- language practice,
- communication rehearsal,
- emotional support and guided reflection,
- premium session monetization.

## 5. Product Lines

### 5.1 Om AI Reality Agent

Scope:

- native device control
- room and scene execution
- Apple Home / Matter strategy
- gateway bridging
- approvals, policy, proof, and execution audit

### 5.2 Om AI Live

Scope:

- real-time voice or voice+avatar calls
- persona-specific instruction control
- curriculum, lesson plans, and progress memory
- usage metering and paywalling
- moderation, safety redirection, and escalation

## 6. Modes That Must Exist

### 6.1 Reality Control Mode

For homes, rooms, offices, hospitality, and operational spaces.

### 6.2 Education Mode

For tutoring, lecturing, homework guidance, and structured study sessions.

### 6.3 Language Practice Mode

For conversation practice, pronunciation, interview rehearsal, travel talk, roleplay, and fluency building.

### 6.4 Communication and Listening Mode

For public speaking, sales rehearsal, customer support simulations, emotional listening, and social confidence.

### 6.5 Healing and Wellness Mode

For guided breathing, journaling by dialogue, reflection, grounding, and supportive companionship.

Product rule:

- wellness support is allowed,
- regulated healthcare, diagnosis, therapy claims, or emergency substitution are not allowed.

## 7. Core Principles

### 7.1 Native-First

Critical execution and call experiences must be iPhone-native first.

### 7.2 Controller-First

Om AI starts as a controller and orchestrator. It does not depend on custom hardware in phase one.

### 7.3 Call-Grade UX

Live interaction must feel like a real call: clear state, mute, speaker, Bluetooth routing, reconnect, recap, and graceful ending.

### 7.4 Policy-First

No physical action or sensitive conversational response is delivered without policy checks.

### 7.5 Proof-First

Physical transitions require execution proof. Live sessions require session logs, moderation traces, recap artifacts, and metering records.

### 7.6 Memory-First

The first personalization layer is structured memory, not blind fine-tuning.

### 7.7 Provider-Abstraction

Realtime avatar and voice-video layers must be designed through adapters so Om AI owns orchestration, not a third party.

## 8. Om AI Live Architecture

Om AI Live is locked as a five-layer stack.

### 8.1 Layer 1: iOS Call Surface

Responsibilities:

- call UI and state machine
- outgoing and future incoming call flows
- mute / speaker / Bluetooth / headset routing
- call timer and warning banners
- interruption handling

### 8.2 Layer 2: Realtime Conversation Engine

Responsibilities:

- low-latency speech-to-speech sessions
- event transport via WebRTC on client-first paths
- server fallback via WebSocket where needed
- optional SIP bridging for telephony extensions

### 8.3 Layer 3: Avatar and Human Face Layer

Responsibilities:

- real-time video avatar session
- lip-sync and stream rendering
- fallback to voice-only
- fallback to audio + still portrait
- provider failover and provider capability selection

### 8.4 Layer 4: Persona, Curriculum, and Memory Layer

Responsibilities:

- role-specific instructions
- language and topic scope
- long-term learner profile
- session goals and lesson plans
- safety rails and escalation behavior

### 8.5 Layer 5: Billing and Session Metering Layer

Responsibilities:

- free minutes accounting
- plan limits
- soft landing when limits are reached
- referral, bonus, and campaign minutes
- invoice and subscription state

## 9. Provider Strategy

Om AI must not be hardcoded to one avatar vendor.

### 9.1 Provider Adapter Contract

Core fields:

- `provider = tavus | heygen | custom_video_avatar | future_provider`
- `avatar_mode = realtime_stream | generated_video | still_image_talking`
- `persona_binding = om_teacher_english_01 | om_listener_01 | om_lecturer_history_01`
- `face_style = realistic | elegant | friendly | professional | youthful | mature`
- `consent_mode = stock | synthetic | licensed_custom`

### 9.2 Fallback Hierarchy

1. full voice + avatar call
2. voice-only live call
3. async voice message fallback
4. text fallback only for degraded conditions

## 10. Persona System

Each AI human must be a bounded product entity, not a generic assistant skin.

Each persona requires:

- role
- promise to user
- language set
- allowed topics
- prohibited claims
- tone and expression style
- session goals
- memory schema
- curriculum binding if educational
- moderation profile
- max response style and latency target

## 11. Curriculum System

Education and language products must not rely on free-form conversation alone.

Required curriculum capabilities:

- level mapping
- lesson objectives
- checkpoints
- exercises
- pronunciation or speaking drills where relevant
- recap generation
- next-lesson recommendation
- teacher notes and parent/student reporting options for eligible plans

## 12. Safety and Governance

### 12.1 Non-Negotiables

- Om AI does not claim to replace licensed medical, therapy, legal, or emergency services.
- Wellness personas must redirect high-risk cases to safe-support flows.
- Persona prompts must explicitly refuse unsafe impersonation, coercion, abuse, self-harm encouragement, regulated diagnosis, or manipulative dependency framing.
- Synthetic or licensed faces must be traceable by consent state.

### 12.2 Sensitive Flow Handling

If a user enters crisis, self-harm, violent, exploitative, or regulated-diagnosis territory, Om AI Live must:

1. de-escalate,
2. stop roleplay that increases harm,
3. provide safe-language redirection,
4. surface local emergency/help guidance where applicable,
5. log moderation outcome for review.

## 13. Monetization and Metering

### 13.1 Free Daily Access

Free plan is locked as:

- 30 minutes per day
- 1 to 2 base personas
- standard voice and standard avatar quality
- short-term memory only
- limited calls per day
- no premium lesson-path exports

### 13.2 Metering Rules

- metering happens on backend, never on client only
- usage is stored by `user_id`, `persona_id`, `session_id`, `plan_id`, `minutes_used_today`, `billing_period_minutes_used`
- warn at 5 minutes remaining
- do not hard cut mid-sentence
- use soft landing upgrade prompt after the current turn safely completes

### 13.3 Paid Packages

- `Free`
- `Personal Pro`
- `Education Plus`
- `Business / Enterprise`

## 14. API Surface Expansion

Reality endpoints remain under `/v2/reality`.

New Om AI Live groups must exist under `/v2/live`:

- `/v2/live/personas`
- `/v2/live/sessions/create`
- `/v2/live/sessions/:id/events`
- `/v2/live/sessions/:id/end`
- `/v2/live/memory`
- `/v2/live/lesson-plans`
- `/v2/live/usage/today`
- `/v2/live/subscriptions`
- `/v2/live/avatar/providers`
- `/v2/live/moderation/check`

## 15. iOS Surface Direction

The iPhone app must evolve from a device cockpit into a dual-mode app.

Top-level navigation should support:

- Home
- Calls
- Personas
- Lessons
- Rooms
- Scenes
- Activity
- Memory
- Settings

## 16. Delivery Priorities For Today

### 16.1 Must Lock Before DEV Starts

- canonical brand language: `Om AI`
- master product equation
- Om AI Live extension spec
- API contract updates
- iOS module map updates
- metering logic definition
- safety boundaries for wellness and regulated topics

### 16.2 Must Build Immediately After Lock

- persona registry
- session creation and end flows
- usage metering service
- iOS call shell
- realtime session adapter
- avatar provider adapter
- recap and lesson memory pipeline

## 17. Source of Truth Docs

Primary docs for the new direction:

- `AI_OM_MASTER_SPEC_2026.md`
- `AI_OM_DEV_MASTER_EXECUTION_PLAN_2026.md`
- `AI_OM_FULL_DEV_EXECUTION_PLAN_IOS_ANDROID_2026.md`
- `AI_OM_REPO_FULL_STRUCTURE_2026.md`
- `AI_OM_ECOSYSTEM_RESOURCE_AUDIT_2026.md`
- `AI_OM_OMDALA_AND_IAI_ONE_INTEGRATION_RECOMMENDATION_2026.md`
- `OM_AI_LIVE_HUMAN_CALL_AND_EDUCATION_EXTENSION_2026.md`
- `AI_OM_LIVE_HUMAN_CALL_AND_EDUCATION_EXTENSION_2026.md`
- `AI_OM_LIVE_API_CONTRACT_V1.md`
- `AI_OM_PROVIDER_ROUTER_ARCHITECTURE_2026.md`
- `AI_OM_PERSONA_SCHEMA_V1.md`
- `AI_OM_MEMORY_MODEL_V1.md`
- `AI_OM_USAGE_METERING_AND_FREE_30_MIN_RULES.md`
- `AI_OM_PRICING_AND_PLAN_LOGIC_2026.md`
- `AI_OM_ANDROID_APP_STRUCTURE.md`
- `AI_OM_ANDROID_MODULE_SPEC.md`
- `AI_OM_ANDROID_MVP_PLAN.md`
- `AI_OM_LIVE_ANDROID_REALTIME_CALL_SPEC_2026.md`
- `AI_OM_API_CONTRACT_V1.md`
- `AI_OM_IOS_APP_STRUCTURE.md`
- `AI_OM_BACKEND_ENDPOINT_SPEC.md`
- `DEV_TASK_BREAKDOWN.md`

## 18. Final Lock

Om AI is approved to be built as:

- a reality agent for physical environments,
- an AI human calling platform for learning and guided interaction,
- a governed subscription product with memory, policy, proof, moderation, and provider abstraction.

This is the correct expansion path for immediate DEV execution.
