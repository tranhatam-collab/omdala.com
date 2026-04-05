# Om AI Android Module Spec

Version: 1.0
Status: Locked for DEV handoff
Platform: Android
Stack: Kotlin + Jetpack Compose + ViewModel + repository pattern

## 1. Purpose

Define implementation modules and boundaries for the Om AI Android app.

## 2. Recommended Gradle Module Layout

- `android-app`
- `feature-home`
- `feature-calls`
- `feature-personas`
- `feature-lessons`
- `feature-activity`
- `feature-memory`
- `feature-rooms`
- `feature-settings`
- `core-ui`
- `core-design`
- `core-network`
- `core-model`
- `core-auth`
- `core-realtime`
- `core-audio`
- `core-avatar`
- `core-analytics`
- `core-persistence`

## 3. Feature Boundaries

### 3.1 `feature-calls`

Owns:

- call launcher
- active call screen
- call state rendering
- wrap-up flow

Must not own:

- provider-specific avatar business logic
- billing source of truth
- moderation decision engine

### 3.2 `feature-personas`

Owns:

- persona lists
- filtering
- persona details
- favorites UI

### 3.3 `feature-lessons`

Owns:

- lesson path UI
- guided lesson flow
- recap and score display

### 3.4 `feature-memory`

Owns:

- user memory settings
- persona memory reset UI
- session history entry points

### 3.5 `feature-rooms`

Owns:

- room list
- scene shortcuts
- proof-backed action history

## 4. Core Boundaries

### 4.1 `core-realtime`

Owns:

- session create/connect/end APIs
- realtime bootstrap token handling
- transport state mapping

### 4.2 `core-audio`

Owns:

- audio focus
- microphone lifecycle
- speaker and Bluetooth route state
- interruption events

### 4.3 `core-avatar`

Owns:

- provider adapter abstractions
- stream state mapping
- avatar fallback state

### 4.4 `core-network`

Owns:

- API clients
- auth interceptors
- typed envelopes
- retry policy

### 4.5 `core-persistence`

Owns:

- local cache for recent personas
- recap snapshots
- lightweight session draft state

## 5. Module Rules

- feature modules depend on core modules, not on each other directly unless explicitly shared through contracts
- all billing and quota enforcement comes from backend responses
- live moderation is server-directed even when client renders safety UI
- avatar providers remain hidden behind adapter interfaces
