# AI_OM_IOS_APP_STRUCTURE.md

Version: 2.0  
Status: Locked iOS app structure for Om AI  
Canonical product name: Om AI  
Legacy filename namespace: `AI_OM_*` retained for continuity  
Date: April 9, 2026

---

# 0. Boundary Normalization - April 9, 2026

This file is normalized to the current Om AI boundary.

- `Om AI` is not `OmCode`
- `Om AI` is not `Omniverse`
- iOS is now optimized for Om AI Live as a premium native call surface
- historical device, room, scene, proof, or gateway-first framing is now `legacy-transition` or `bridge-only`

---

# 1. Purpose

This file defines the iOS app structure for Om AI so the iOS team can ship a consistent, native-first Om AI product without drifting back to old reality-control scope.

The iOS app is the premium Om AI surface for:

- real-time AI human calling
- voice-first and optional avatar sessions
- lessons and roleplay
- recap and memory review
- subscription and usage visibility
- family-safe entry points
- Siri and App Intents entry where appropriate

---

# 2. Product Role of iOS

iOS is the strongest native Om AI call surface because it can deliver:

- high-quality audio routing
- system-grade call affordances
- native permissions and interruption handling
- a polished premium calling experience

iOS does not own final truth for:

- sessions
- metering
- subscriptions
- moderation
- provider routing

Those remain backend responsibilities.

---

# 3. Main Navigation

Recommended primary navigation:

1. Home
2. Calls
3. Personas
4. Lessons
5. Activity
6. Memory
7. Family
8. Settings

Notes:

- `Calls` is the most important native runtime surface
- `Home` is the daily-return orchestration surface
- `Family` is conditional by plan and workspace
- old room/device/scene navigation must not return as first-class Om AI tabs

---

# 4. Main Modules

## 4.1 App Shell

Responsibilities:

- navigation
- workspace selection
- auth/session state
- root environment configuration

## 4.2 Home Module

Responsibilities:

- daily recommendations
- continue lesson or continue conversation
- free-minute visibility
- usage and upgrade prompt entry points

## 4.3 Live Call Module

Responsibilities:

- call lobby
- active call screen
- mute, speaker, route, reconnect, and end-call states
- avatar versus voice-only presentation
- transition into recap

## 4.4 Persona Library Module

Responsibilities:

- browse personas
- role, language, audience, and plan filters
- favorites
- custom persona creation entry points where allowed

## 4.5 Lesson Module

Responsibilities:

- lesson pathways
- lesson detail
- drill and roleplay entry points
- lesson completion and next-step suggestions

## 4.6 Activity and Recap Module

Responsibilities:

- session history
- recap list
- progress summary
- usage snapshots

## 4.7 Memory Module

Responsibilities:

- profile preferences
- learning preferences
- persona-specific memory controls
- privacy/export/delete entry points where supported

## 4.8 Family Module

Responsibilities:

- child profile management
- safe mode controls
- allowed persona groups
- time limits and reports

## 4.9 Settings and Subscription Module

Responsibilities:

- account settings
- language settings
- audio settings
- subscription visibility
- diagnostics and support

## 4.10 App Intents Module

Responsibilities:

- launch approved Om AI actions from Siri and system surfaces
- expose safe shortcuts such as start lesson, continue practice, or open recap

## 4.11 Legacy Bridge Module

Responsibilities:

- hold explicit future bridge notes only
- isolate any cross-product or legacy-transition integration

It must not define primary iOS navigation or primary iOS product identity.

---

# 5. Call Flow

Primary session flow:

User opens Om AI  
-> selects persona or lesson  
-> starts call  
-> app creates backend session  
-> app receives realtime bootstrap  
-> audio session opens  
-> realtime connection starts  
-> conversation runs  
-> usage warnings appear when needed  
-> session ends  
-> recap and next recommendation appear

Fallback rules:

- voice-only remains mandatory
- avatar is optional and degradable
- reconnect must preserve user confidence and session clarity

---

# 6. Data Dependencies

iOS consumes:

- Om AI live APIs for personas, sessions, realtime, memory, usage, plans, moderation, and recap
- shared account/profile/preferences and billing visibility where approved

iOS must never enforce final product truth locally for:

- free-minute quotas
- plan entitlements
- moderation status
- provider routing decisions

---

# 7. Framework Guidance

Recommended frameworks and integrations:

- SwiftUI
- AVFAudio or AVFoundation audio stack
- Speech framework where appropriate
- CallKit where product and policy allow
- App Intents
- WebRTC client integration

Historical references to:

- HomeKit
- Matter
- Accessory setup
- room or scene control

are no longer primary Om AI iOS scope.

---

# 8. Tablet Guidance

iPad layouts should improve:

- split-pane persona browsing
- lesson + transcript review
- recap reading and memory editing
- family/admin surfaces where allowed

Tablet support must still feel like Om AI Live, not a room-control dashboard.

---

# 9. Legacy Transition Rule

If older iOS docs mention:

- Apple Home or Matter access
- direct device control
- scene control
- proof viewing as core product identity
- gateway linking as primary path

those references are now non-canonical for Om AI.

They may survive only as:

- bridge-only notes
- approved future cross-product integration references
- legacy-transition annotations

---

# 10. Final Lock

iOS for Om AI is approved as:

- premium native live-call surface
- lesson and recap surface
- subscription-aware daily-use app
- family-safe Om AI client

It is not approved as a device-control-first iOS product.
