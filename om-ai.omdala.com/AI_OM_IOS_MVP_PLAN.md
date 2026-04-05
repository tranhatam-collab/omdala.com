# Om AI iOS MVP Plan

Version: 2.0
Status: Locked for DEV handoff

## 1. Goal

Ship the first iPhone-native Om AI shell that supports both:

- trusted reality execution,
- live AI human calling.

## 2. MVP Promise

The app must let a real user sign in, connect a home context, control supported devices, run scenes, speak commands, approve sensitive actions, inspect proof, start a live teacher or companion call, and see usage remaining.

## 3. MVP Modules

### 3.1 App Shell

- SwiftUI navigation
- authentication state
- home, business, or learning context selection

### 3.2 Home Control

- quick actions
- scenes
- alerts
- pending approvals

### 3.3 Calls

- persona quick-call list
- active call shell
- timer, mute, speaker, and reconnect states
- quota warning banners

### 3.4 Personas

- teacher cards
- language partner cards
- listener and coach cards
- persona detail view

### 3.5 Lessons

- recap cards
- lesson goals
- next-step recommendations

### 3.6 Rooms

- room list
- room status
- device groups
- occupancy markers

### 3.7 Voice

- push-to-talk
- transcript display
- intent preview
- spoken response

### 3.8 Scenes

- run scene
- schedule scene
- scene list

### 3.9 Activity

- execution history
- proof viewer
- failures and warnings
- session history

### 3.10 Memory

- aliases
- routines
- persona preferences
- learning preferences

### 3.11 Settings

- permissions
- home linking
- gateway linking
- subscription state
- privacy controls

## 4. Native Requirements

- HomeKit
- MatterSupport
- AccessorySetupKit
- Core Bluetooth
- Speech
- AVFAudio
- App Intents
- Call-grade audio session handling
- Foundation Models when available

## 5. MVP Acceptance Criteria

1. Sign-in works.
2. Device control works for supported families.
3. Voice command reaches planner and execution.
4. Sensitive actions require approval.
5. Proof is visible after execution.
6. User can start a voice-only Om AI Live session from a persona card.
7. User can see free minutes remaining and receive warning prompts near limit.
8. App can recover from speech, network, or avatar degradation safely.
