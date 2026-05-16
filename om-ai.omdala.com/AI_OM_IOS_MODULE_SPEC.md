# AI_OM_IOS_MODULE_SPEC.md

Version: 2.0  
Status: Locked iOS module spec for Om AI  
Canonical product name: Om AI  
Legacy filename namespace: `AI_OM_*` retained for continuity  
Date: April 9, 2026

---

# 0. Boundary Normalization - April 9, 2026

This file is normalized to the current Om AI product boundary.

- `Om AI` is not `OmCode`
- `Om AI` is not `Omniverse`
- module planning must focus on live call, lesson, memory, family safety, and subscription
- historical room, scene, proof, gateway, HomeKit, Matter, and accessory setup modules are now `legacy-transition` or `bridge-only`

---

# 1. Purpose

This file locks the iOS module map for Om AI so implementation can move without product ambiguity.

Goals:

- clear module ownership
- clean separation between UI features and infrastructure
- strong native call path
- isolated bridge surface for anything outside core Om AI scope

---

# 2. Main Feature Modules

## 2.1 App Shell Module

Responsibilities:

- app bootstrap
- navigation container
- auth and workspace state
- environment selection

## 2.2 Home Module

Responsibilities:

- daily recommendations
- continue practice
- free-minute visibility
- progress highlights

## 2.3 Personas Module

Responsibilities:

- persona library
- filters by role, language, audience, and plan
- favorites
- custom persona entry points where allowed

## 2.4 Live Call Module

Responsibilities:

- session lobby
- in-call UI
- mute, speaker, route, reconnect, and wrap-up states
- avatar or voice-only presentation

## 2.5 Voice Module

Responsibilities:

- microphone capture
- output route handling
- interruption handling
- speech support where needed

## 2.6 Activity and Recap Module

Responsibilities:

- session history
- recap list
- improvement summaries
- usage highlights

## 2.7 Lessons Module

Responsibilities:

- lesson pathways
- drills
- roleplay flows
- assigned work
- completion state

## 2.8 Memory Module

Responsibilities:

- profile preferences
- learning preferences
- persona memory controls
- privacy/export/delete entry points

## 2.9 Family Module

Responsibilities:

- family profile management
- child-safe controls
- time limits
- allowed persona groups
- parent summaries

## 2.10 Subscription Module

Responsibilities:

- plan visibility
- entitlement messaging
- upgrade prompts
- billing usage presentation

## 2.11 App Intents Module

Responsibilities:

- system-level Om AI action entry points
- approved Siri shortcuts
- quick start lesson or call actions

## 2.12 Legacy Bridge Module

Responsibilities:

- explicit future bridge integrations only
- historical compatibility notes

This module must never redefine the core iOS product structure.

---

# 3. Infrastructure Modules

## 3.1 Live Session Client

- create session
- fetch realtime bootstrap
- maintain session state
- handle reconnect and end-session flow

## 3.2 Realtime Client

- realtime connection lifecycle
- WebRTC integration
- interruption and fallback state

## 3.3 Audio Routing Client

- speaker selection
- bluetooth route handling
- headset and interruption handling

## 3.4 Avatar Session Client

- avatar provider session abstraction
- avatar availability state
- still-image or voice-only downgrade logic

## 3.5 Memory Client

- fetch memory state
- update memory preferences
- persona memory controls

## 3.6 Usage and Billing Client

- fetch usage status
- fetch plan visibility
- surface subscription state from approved dependencies

---

# 4. Dependency Rules

Allowed:

- feature modules depend on infrastructure modules
- shared UI components may be reused across feature modules
- live call module may depend on audio, realtime, avatar, usage, and memory clients

Not allowed:

- feature modules directly hardcode backend contract details in multiple places
- family restrictions embedded ad hoc into unrelated modules
- legacy bridge dependencies leaking into main call path

---

# 5. Framework Guidance

Recommended foundation:

- SwiftUI
- AVFAudio or AVFoundation
- Speech framework where appropriate
- CallKit where approved
- App Intents
- WebRTC integration

Historical references to:

- HomeKit
- MatterSupport
- AccessorySetupKit
- proof clients for physical actions
- gateway linking as primary app behavior

are no longer canonical Om AI module requirements.

---

# 6. Ownership Rules

iOS team owns:

- module composition
- native call experience
- local audio and route quality
- iOS-specific fallback UX

Backend owns:

- final truth for sessions, usage, subscriptions, moderation, memory persistence, and provider routing

Shared platform may own:

- baseline account/profile/preferences
- billing baseline contracts where approved

Om AI still owns:

- product-level interpretation of live, lesson, memory, family, and plan behavior

---

# 7. Legacy Transition Rule

If an older iOS module map includes:

- room list
- room state cards
- device clusters
- scene scheduling
- proof display as primary product value
- gateway linking as main setup path

that map is no longer canonical for Om AI.

Such references may survive only under:

- `Legacy Bridge`
- historical notes
- explicit cross-product coordination

---

# 8. Final Lock

The canonical iOS module tree for Om AI is:

- live-call-first
- lesson-aware
- recap and memory aware
- family-safe
- subscription aware
- provider fallback ready

Everything else is secondary.
