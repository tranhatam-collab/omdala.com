# Om AI Android App Structure

Version: 1.0
Status: Locked for DEV handoff
Platform: Android
Stack: Kotlin + Jetpack Compose + Android Jetpack
Canonical product name: Om AI

## 1. Purpose

Define the Android app structure for Om AI with the correct platform emphasis:

- `Om AI Live` is the primary premium experience on Android.
- `Om AI Reality` is a companion and orchestration surface on Android, not a full Apple-home-equivalent control layer.

## 2. Platform Positioning

Android should be treated as:

- first-class for live AI human calling
- first-class for learning, recap, memory, and subscriptions
- strong for browserless mobile access and push-driven re-entry
- selective for direct device-control features depending on connector and gateway coverage

## 3. Recommended App Architecture

Use standard Android app architecture with:

- UI layer in Jetpack Compose
- state holders with `ViewModel`
- repositories for session, persona, lesson, usage, and reality data
- navigation graph per top-level product area
- unidirectional data flow across screens

Android's official architecture guidance recommends separating UI state holders from the data layer, and Compose is designed to work cleanly with unidirectional data flow and ViewModels.

## 4. Main Navigation

1. Home
2. Calls
3. Personas
4. Lessons
5. Activity
6. Memory
7. Rooms
8. Settings

## 5. Core Modules

### 5.1 App Shell Module

Responsibilities:

- app entry
- auth bootstrap
- deep links
- top-level navigation
- plan and session banners

### 5.2 Home Module

Responsibilities:

- quick resume cards
- persona shortcuts
- usage summary
- recent recaps
- connector and room summary

### 5.3 Calls Module

Responsibilities:

- outgoing call launch
- active call screen
- reconnect states
- in-call timer
- mute, speaker, route controls
- wrap-up and end-call handling

### 5.4 Persona Module

Responsibilities:

- browse personas
- filter by role and language
- favorite personas
- view persona detail, plan eligibility, and safety labels

### 5.5 Lesson Module

Responsibilities:

- curriculum paths
- lesson details
- guided lesson state
- recap rendering
- next recommendation

### 5.6 Transcript Module

Responsibilities:

- live transcript drawer
- correction overlays
- recap text rendering
- transcript review and copy actions

### 5.7 Audio and Call Routing Module

Responsibilities:

- microphone capture lifecycle
- speakerphone toggle
- Bluetooth route awareness
- audio focus coordination
- interruption and headset handling

### 5.8 Avatar Session Module

Responsibilities:

- attach avatar stream when enabled
- render voice-only fallback
- render still-image fallback
- expose provider state to call UI

### 5.9 Realtime Session Module

Responsibilities:

- create session
- connect session
- request bootstrap token
- observe session state and quota warnings
- end session cleanly

### 5.10 Memory Module

Responsibilities:

- learner profile
- persona memory controls
- preference editing
- recap history access

### 5.11 Reality Companion Module

Responsibilities:

- show rooms and scenes from backend
- trigger safe backend actions where supported
- show proof and activity history
- avoid claiming full native-home control parity with iOS

### 5.12 Settings and Subscription Module

Responsibilities:

- plan state
- upgrade entry points
- notification settings
- privacy and deletion controls
- diagnostics and support

## 6. Android-Specific Capabilities

### 6.1 Calling Integration

For Android call-style UX, use Android Telecom / Core-Telecom self-managed calling patterns where appropriate for call lifecycle integration.

### 6.2 Audio Management

Use Android audio focus and route management to coordinate microphone, speaker, Bluetooth, and interruptions.

### 6.3 Camera and Visual Layer

Use `CameraX` for local camera flows if needed for future bidirectional video or preview-driven call states.

### 6.4 Background and Ongoing Session State

Use foreground-service-safe patterns only where policy and OS rules allow for active call experiences involving microphone or camera.

## 7. Non-Functional Requirements

- fast call entry
- stable reconnect behavior
- visible quota state
- graceful avatar fallback
- battery-aware session handling
- safe behavior under background restrictions
