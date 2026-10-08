# AI_OM_ANDROID_MODULE_SPEC.md

Version: 2.0  
Status: Locked Android module spec for Om AI  
Canonical product name: Om AI  
Legacy filename namespace: `AI_OM_*` retained for continuity  
Date: April 9, 2026

---

# 0. Boundary Normalization - April 9, 2026

This file is normalized to the current Om AI product boundary.

- `Om AI` is not `OmCode`
- `Om AI` is not `Omniverse`
- Android module planning must optimize for live calling, lessons, memory, safety, and subscription
- any old module that centered rooms, scenes, devices, proofs, or gateway control is now `legacy-transition` or `bridge-only`

---

# 1. Purpose

This file locks the Android module map so implementation can proceed without scope drift.

Goals:

- keep feature ownership clear
- separate feature UI from shared runtime cores
- keep live session architecture modular
- isolate any future bridge logic from Om AI core product logic

---

# 2. Architecture Style

Recommended stack:

- Kotlin
- Jetpack Compose
- ViewModel
- repository pattern
- typed network client
- WebRTC integration
- audio engine abstraction

Principles:

- feature-first modules for product surfaces
- core modules for shared infrastructure
- bridge modules for non-core future integrations only

---

# 3. Feature Modules

## 3.1 `feature-home`

Responsibilities:

- daily summary
- recommended personas
- free minutes status
- continue lesson or continue call
- upgrade prompt entry points

## 3.2 `feature-calls`

Responsibilities:

- call lobby
- active session UI
- mute, speaker, route, and reconnect state
- avatar versus voice-only presentation
- end-of-session recap handoff

## 3.3 `feature-personas`

Responsibilities:

- persona browsing
- role and language filters
- favorites
- custom persona entry points when plan and policy allow

## 3.4 `feature-lessons`

Responsibilities:

- lesson pathways
- lesson detail
- speaking drills
- roleplay entry points
- completion state

## 3.5 `feature-activity`

Responsibilities:

- recap list
- session history
- improvement trends
- usage snapshots

## 3.6 `feature-memory`

Responsibilities:

- profile preferences
- learning preferences
- persona memory controls
- privacy and delete flows where supported

## 3.7 `feature-family`

Responsibilities:

- family profile list
- child-safe controls
- limits and permissions
- parent review summaries

## 3.8 `feature-settings`

Responsibilities:

- account
- app configuration
- language and correction preferences
- notifications
- support and diagnostics

## 3.9 `feature-subscription`

Responsibilities:

- plan display
- upgrade flow entry
- entitlement visibility
- billing usage presentation

---

# 4. Core Modules

## 4.1 `core-ui`

- shared composables
- base screen scaffolds
- loading and error states

## 4.2 `core-design`

- tokens
- typography
- icon and spacing system

## 4.3 `core-model`

- shared DTOs
- domain models
- UI mapping models

## 4.4 `core-network`

- HTTP client
- auth headers
- response envelope parsing
- retry strategy

## 4.5 `core-auth`

- session bootstrap
- token refresh
- active workspace context

## 4.6 `core-realtime`

- realtime bootstrap handling
- WebRTC signaling integration
- connection state model
- interruption and reconnect support

## 4.7 `core-audio`

- microphone state
- audio focus
- speaker and bluetooth route controls
- interruption handling

## 4.8 `core-avatar`

- avatar provider session abstraction
- avatar availability and fallback state
- still-image and voice-only downgrade logic

## 4.9 `core-analytics`

- event emission
- call lifecycle instrumentation
- recap exposure events

## 4.10 `core-persistence`

- local cache
- preferences cache
- offline-safe view state cache

## 4.11 `core-bridge`

- reserved for approved bridge integrations
- legacy-transition compatibility helpers
- must not become a backdoor for old device-control scope

---

# 5. Dependency Rules

Allowed:

- feature modules may depend on core modules
- features may depend on shared model layer
- features may share only through core modules

Not allowed:

- feature-to-feature cyclic dependencies
- lesson logic embedded in call engine without shared contracts
- family policies hardcoded into generic settings
- bridge logic imported into core live call flow by default

---

# 6. Ownership Rules

Android team owns:

- feature modules
- mobile UI state
- local audio and realtime integration
- Android-specific fallback behavior

Backend owns:

- final truth for sessions
- usage metering
- subscriptions
- moderation
- provider routing

Shared platform may own:

- account/profile baseline
- preferences baseline
- billing baseline surfaces where approved

Om AI still owns:

- product interpretation of those shared dependencies

---

# 7. Legacy Transition Rule

If an older module proposal includes:

- `feature-rooms`
- scene shortcuts
- proof-backed action history
- gateway linking as a primary flow

that proposal is no longer canonical for Om AI Android.

Such concepts may only appear under:

- `core-bridge`
- explicit legacy-transition notes
- approved cross-product integration modules

---

# 8. Final Lock

The canonical Android module tree for Om AI is now:

- live-product-first
- lesson and memory aware
- family-safe
- subscription aware
- provider and avatar fallback ready

Everything outside that boundary is secondary.
