# Om AI iOS App Structure

Version: 2.0
Status: Locked for DEV handoff
Platform: iOS
Stack: SwiftUI + native Apple frameworks
Canonical product name: Om AI

## 1. Purpose

Define the module structure for the native iOS app that serves as both:

- the trusted execution cockpit for Om AI Reality,
- the real-time call surface for Om AI Live.

## 2. App Responsibilities

- direct device control
- voice interaction
- live AI human calling
- text interaction fallback
- approvals
- Apple Home / Matter access
- accessory onboarding
- local discovery
- scene control
- proof viewing
- memory editing
- lesson recap viewing
- alerts and notifications
- Siri / App Intents exposure
- subscription and usage display

## 3. Main Navigation

1. Home
2. Calls
3. Personas
4. Lessons
5. Rooms
6. Scenes
7. Activity
8. Memory
9. Settings

## 4. Core Modules

### 4.1 App Shell

Responsibilities:

- root navigation
- authentication state
- household, business, or learning context selection
- deep link routing

### 4.2 Home Control Module

Responsibilities:

- native Apple Home integration
- favorite scenes
- quick actions
- active alerts
- approvals summary

### 4.3 Live Call Module

Responsibilities:

- start voice or voice+avatar session
- show active call surface
- mute, speaker, Bluetooth controls
- reconnect and degraded-mode handling
- live session timer and quota warnings

### 4.4 Persona Library Module

Responsibilities:

- persona discovery
- persona detail page
- role selection
- teacher, coach, listener, and lecturer filtering

### 4.5 Lesson and Curriculum Module

Responsibilities:

- lesson plan display
- session goals
- recap and homework cards
- progress checkpoints

### 4.6 Voice Module

Responsibilities:

- speech-to-text
- tap or push-to-talk UX
- transcript display
- spoken responses
- voice fallback for both reality and live products

### 4.7 Avatar Session Module

Responsibilities:

- attach live avatar provider stream
- render degraded state gracefully
- handle avatar unavailable fallback

### 4.8 Matter Setup Module

Responsibilities:

- Matter onboarding
- device discovery
- accessory setup state
- commissioning flow UI

### 4.9 Accessory Setup Module

Responsibilities:

- AccessorySetupKit-driven setup
- Bluetooth or Wi-Fi accessory onboarding
- privacy-preserving setup UI

### 4.10 App Intents Module

Responsibilities:

- expose safe device commands to Siri
- expose quick call actions to Shortcuts
- expose system actions to Apple surfaces

### 4.11 Planner Client

Responsibilities:

- call OMDALA planner APIs
- submit reality intent payloads
- receive plans
- surface policy and approval states

### 4.12 Live Session Client

Responsibilities:

- create live session
- attach transport credentials
- monitor usage and moderation state
- end session and fetch recap

### 4.13 Proof Client

Responsibilities:

- fetch execution proof
- show before and after state
- render confidence and verification status

### 4.14 Memory Client

Responsibilities:

- alias editing
- routine editing
- persona preference editing
- lesson memory inspection
- recap history access

### 4.15 Approval Module

Responsibilities:

- confirm or reject sensitive actions
- require biometric or explicit confirmation when needed

### 4.16 Reality Map Module

Responsibilities:

- room-level state visualization
- device state visualization
- pending transitions
- approval markers

## 5. Screen Structure

### Home Screen

- current home, business, or learning context
- quick scenes
- quick call personas
- devices needing attention
- pending approvals
- recent proof-backed actions
- recent session recaps

### Calls Screen

- call favorites
- start new call
- live status
- minutes remaining today
- upgrade prompts when eligible

### Personas Screen

- teacher personas
- language partners
- listener and wellness personas
- coaches and lecturers
- persona cards with promise and safety labels

### Lessons Screen

- active learning paths
- completed sessions
- recap cards
- pronunciation or confidence trend widgets

### Rooms Screen

- room list or map
- room states
- occupancy markers
- room-level scenes
- device clusters

### Scenes Screen

- favorite scenes
- time-based scenes
- recent scenes
- suggested scenes
- business workflows

### Activity Screen

- execution runs
- proofs
- warnings
- failures
- approvals
- audits
- live session history

### Memory Screen

- aliases
- learned routines
- learner profile
- preferred personas
- goals and progress
- behavior patterns and exceptions

### Settings Screen

- device setup
- home linking
- gateway linking
- permissions
- privacy
- subscriptions
- memory export and delete
- integrations

## 6. Permissions and Entitlements

- HomeKit capability
- microphone usage
- speech recognition usage
- local network usage
- Bonjour service declarations if used
- Bluetooth access where applicable
- push notifications
- keychain storage for tokens
- audio session management for call experiences

## 7. Non-Functional Requirements

- low-latency voice response
- graceful fallback when avatar is unavailable
- graceful fallback when speech is unavailable
- stable offline UI states
- safe failure states
- clear error explanations
- visible quota state before and during call
