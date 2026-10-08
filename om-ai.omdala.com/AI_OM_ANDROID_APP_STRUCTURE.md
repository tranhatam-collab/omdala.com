# AI_OM_ANDROID_APP_STRUCTURE.md

Version: 2.0  
Status: Locked Android product structure for Om AI  
Canonical product name: Om AI  
Legacy filename namespace: `AI_OM_*` retained for continuity  
Date: April 9, 2026

---

# 0. Boundary Normalization - April 9, 2026

This file is normalized to the current Om AI boundary.

- `Om AI` is not `OmCode`
- `Om AI` is not `Omniverse`
- device, room, scene, gateway, and physical-control concepts are not primary Android product scope
- if any historical Android note still references direct environment control, treat that as `legacy-transition` or `bridge-only`

Android is now a first-class Om AI client for:

- live AI calling
- lessons and language practice
- recap and memory
- family-safe usage
- subscriptions and account surfaces

---

# 1. Purpose

This file defines the target Android app structure for Om AI so the Android team can build against one stable product shape.

The Android app is primarily responsible for:

- persona discovery
- real-time voice sessions
- optional avatar sessions
- lesson and recap flows
- family controls and safe mode surfaces
- usage visibility and subscription prompts

---

# 2. Product Role of Android

Android is a primary Om AI runtime, not a secondary companion.

It must support:

- premium voice-first call flows
- strong fallback behavior when avatar or realtime providers degrade
- daily-return product loops through calls, lessons, activity, and memory
- tablet-capable layouts for larger screens

Android does not define Om AI product truth. Backend remains source of truth for:

- sessions
- usage metering
- billing
- memory
- moderation
- provider routing

---

# 3. Main Navigation

Recommended top-level navigation:

1. Home
2. Calls
3. Personas
4. Lessons
5. Activity
6. Memory
7. Family
8. Settings

Notes:

- `Home` is daily start surface
- `Calls` is session-first live entry
- `Family` appears only when allowed by workspace or plan
- old room/scene/device tabs must not be added back into the primary navigation

---

# 4. Screen Groups

## 4.1 Home

Shows:

- continue call or continue lesson
- recommended personas
- free minutes remaining
- daily streak or recent progress
- upgrade or parent-safe notices when relevant

## 4.2 Calls

Shows:

- quick call entry
- active call state
- reconnect and fallback state
- voice-only versus avatar mode
- session summary handoff

## 4.3 Personas

Shows:

- persona library
- filters by role, language, audience, plan
- favorites
- custom persona entry points where allowed

## 4.4 Lessons

Shows:

- lesson pathways
- assigned lessons
- speaking drills
- roleplay modules
- recap-driven next steps

## 4.5 Activity

Shows:

- session history
- recap list
- usage snapshots
- recent improvement signals

## 4.6 Memory

Shows:

- profile preferences
- learning preferences
- persona-specific memory controls
- privacy/export/delete entry points where allowed

## 4.7 Family

Shows:

- child profiles
- safe mode
- time limits
- allowed persona groups
- parent summary surfaces

## 4.8 Settings

Shows:

- account and profile
- audio and notification settings
- language preferences
- subscription and billing surfaces
- debug info for support

---

# 5. Android Module Boundaries

Recommended Android feature grouping:

- `app-shell`
- `feature-home`
- `feature-calls`
- `feature-personas`
- `feature-lessons`
- `feature-activity`
- `feature-memory`
- `feature-family`
- `feature-settings`
- `feature-subscription`

Recommended core grouping:

- `core-ui`
- `core-design`
- `core-model`
- `core-network`
- `core-auth`
- `core-realtime`
- `core-audio`
- `core-avatar`
- `core-analytics`
- `core-persistence`
- `core-bridge`

`core-bridge` exists only for approved future integrations and legacy-transition references. It must not redefine Om AI product scope.

---

# 6. Session Flow

Primary happy path:

User opens app  
-> selects persona or lesson  
-> starts call  
-> app creates backend session  
-> app receives realtime bootstrap  
-> audio session starts  
-> WebRTC connects  
-> conversation begins  
-> usage warnings appear if needed  
-> call ends  
-> recap and next recommendation appear

Fallback path:

- realtime audio remains primary
- avatar may drop to still image or audio-only
- session state must remain understandable even when provider quality degrades

---

# 7. Data Dependencies

Android consumes:

- `/v2/live/personas`
- `/v2/live/sessions`
- `/v2/live/realtime`
- `/v2/live/memory`
- `/v2/live/usage`
- `/v2/live/plans`
- shared account/profile/preferences and billing visibility where approved

Android must not invent separate local truth for:

- free-minute enforcement
- subscription status
- persona availability policy
- moderation outcome

---

# 8. Family and Safety

Android must support:

- plan-aware family entry points
- child-safe persona restrictions
- safe mode indicators
- limited editing surfaces for child profiles
- escalation-safe UI for sensitive content handling

Safety must be visible in product flow, not hidden in backend-only assumptions.

---

# 9. Tablet Guidance

Android tablet layouts should improve:

- split-pane persona browsing
- larger recap reading
- side-by-side lesson and transcript surfaces
- family admin visibility

Tablet support must remain Om AI live-product-first. It must not drift into old room-control dashboard assumptions.

---

# 10. Legacy Transition Rule

If older Android planning files mention:

- rooms
- scenes
- device clusters
- gateway discovery
- execution proof
- direct physical control

those references are no longer primary Om AI Android scope.

They may only survive as:

- historical context
- future bridge notes
- approved cross-product integration references

---

# 11. Final Lock

Android for Om AI is approved as:

- a native Om AI Live client
- a lesson and recap surface
- a family-safe consumer surface
- a subscription-aware daily-use product surface

It is not approved as a device-control-first Android app.
