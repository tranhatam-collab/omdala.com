# Om AI Android MVP Plan

Version: 1.0
Status: Locked for DEV handoff
Priority: High

## 1. Goal

Ship the first Android-native Om AI app that proves daily-use value for live AI human calling and companion access.

## 2. MVP Positioning

Android MVP should prioritize:

- live AI human calling
- language learning and recap
- lesson and persona access
- usage visibility and subscription upgrade
- reality companion views where backend and gateway support already exist

## 3. MVP Promise

The Android app must let a real user:

- sign in
- browse personas
- start a voice-first live session
- receive low-latency responses
- see free time remaining
- receive recap after session end
- upgrade when free quota is nearly exhausted
- review recent history and memory settings

## 4. MVP Modules

### 4.1 App Shell

- Compose navigation
- auth bootstrap
- deep links

### 4.2 Calls

- persona quick call
- active call UI
- timer and route controls
- reconnect state

### 4.3 Personas

- browse and filter AI humans
- favorites
- persona detail

### 4.4 Lessons

- lesson path list
- recap cards
- next recommendation

### 4.5 Activity

- recent sessions
- recaps
- session outcomes

### 4.6 Memory

- preferences
- correction mode
- persona memory reset

### 4.7 Settings and Plans

- quota display
- plan state
- upgrade entry point

### 4.8 Reality Companion

- rooms list
- scenes list
- proof-backed history

## 5. Android Platform Requirements

- Kotlin
- Jetpack Compose
- ViewModel
- Navigation Compose
- Retrofit or typed HTTP client equivalent
- Android audio focus handling
- Telecom / Core-Telecom-compatible call lifecycle strategy where appropriate

## 6. MVP Acceptance Criteria

1. User can sign in and restore session.
2. User can browse at least 3 MVP personas.
3. User can start a voice-only live call.
4. User can stay in a stable active session with timer and route controls.
5. User receives server-generated recap after call end.
6. User sees server-authoritative daily free quota.
7. User can continue in voice-only mode when avatar is disabled or unavailable.
8. User can reach upgrade flow before or after quota exhaustion.
