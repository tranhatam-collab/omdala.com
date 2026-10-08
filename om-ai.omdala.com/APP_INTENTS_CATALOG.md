# Om AI App Intents Catalog

Version: 2.0
Status: Locked for DEV handoff
Canonical product name: Om AI
Date: April 9, 2026

## Boundary normalization — April 9, 2026

This file is now normalized to the current Om AI product boundary.

Current rule:

- App Intents for Om AI must prioritize live interaction, lesson continuation, recap, and safe account-level actions
- old scene, device, room, or proof-oriented intents are `legacy-transition` or `bridge-only`
- Team Om AI must not use App Intents to reintroduce device-control-first product scope

## 1. Purpose

Define the safe command set exposed through App Intents, Siri, Shortcuts, and related Apple system surfaces for Om AI.

## 2. Principles

- expose only safe, high-frequency Om AI actions
- keep intents typed and deterministic
- require policy or plan checks where needed
- do not expose regulated or risky claims through system-level shortcuts
- keep live-call and lesson shortcuts understandable

## 3. Canonical Intent Groups

### Live Call Intents

- `StartPersonaCallIntent`
- `ContinueLastCallIntent`
- `StartPracticeCallIntent`

### Lesson Intents

- `ContinueLessonIntent`
- `StartLessonIntent`
- `OpenRecapIntent`

### Memory and Progress Intents

- `ShowUsageIntent`
- `ShowRecapIntent`
- `ShowMemoryIntent`
- `ShowPlanIntent`

### Family-Safe Intents

- `OpenParentControlsIntent`
- `ShowChildProfileIntent`
- `ShowAllowedPersonasIntent`

### Utility Intents

- `OpenPersonaLibraryIntent`
- `OpenSettingsIntent`
- `RequestSupportIntent`

## 4. Required Intent Fields

- `intent_id`
- `display_name`
- `parameters`
- `required_privilege`
- `policy_class`
- `supported_surfaces`
- `plan_requirement` where applicable

## 5. Surface Mapping

- Siri
- Shortcuts
- Spotlight where applicable
- app action surfaces

## 6. Non-Goals

- unrestricted background execution
- regulated medical or financial action shortcuts
- provider-specific hidden control paths
- any direct device, room, scene, or gateway execution path

## 7. Legacy Transition Rule

Any older references to:

- `RunSceneIntent`
- `TurnOnDeviceIntent`
- `ActivateRoomModeIntent`
- `ShowProofIntent`

are no longer canonical Om AI App Intents scope.

## 8. Final Lock

The canonical Om AI App Intents catalog is now live-action-first, lesson-aware, recap-aware, and safety-bounded.
