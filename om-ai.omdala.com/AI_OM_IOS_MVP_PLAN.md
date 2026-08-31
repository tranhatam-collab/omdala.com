# Om AI iOS MVP Plan

Version: 3.0
Status: Locked for DEV handoff
Canonical product name: Om AI
Date: April 9, 2026

## Boundary normalization — April 9, 2026

This file is now normalized to the current Om AI product boundary.

Current rule:

- iOS MVP for Om AI is live AI human calling first
- personas, lessons, recap, memory, usage, and subscription visibility are current core
- home, room, scene, proof, gateway, and device-control assumptions are `legacy-transition` or `bridge-only`

## 1. Goal

Ship the first iPhone-native Om AI shell for live AI human calling, learning, recap, memory, and subscription-aware usage.

## 2. MVP Promise

The app must let a real user:

- sign in
- browse personas
- start a live teacher, partner, or listener call
- receive recap after the call
- view usage remaining
- continue a lesson or practice path
- see plan and upgrade context

## 3. MVP Modules

### 3.1 App Shell

- SwiftUI navigation
- authentication state
- workspace and profile context

### 3.2 Home

- continue practice card
- minutes remaining card
- recommended persona card
- recap shortcut

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

- lesson goals
- practice prompts
- next-step recommendations
- completion state

### 3.6 Activity and Recap

- session history
- recap viewer
- progress summary

### 3.7 Voice and Realtime

- audio route controls
- transcript support where needed
- realtime connect state
- fallback to voice-only when avatar is unavailable

### 3.8 Memory and Settings

- profile preferences
- learning preferences
- memory controls
- support diagnostics

### 3.9 Subscription and Usage

- plan visibility
- daily usage visibility
- upgrade prompt entry points

## 4. MVP Rules

- voice-only flow is mandatory
- avatar is optional
- metering truth is server-side
- shared account and billing dependencies are consumed, not redefined
- iOS must remain useful even if avatar is temporarily unavailable

## 5. MVP Success Criteria

1. User can sign in and reach home.
2. User can browse personas.
3. User can start and end a live call.
4. User can see usage remaining.
5. User receives recap after a session.
6. User can re-enter lessons or practice from recap.
7. Upgrade prompts appear in the right moments.

## 6. Legacy Transition Rule

Any older references to:

- rooms
- scenes
- device groups
- proof viewers for physical execution
- gateway linking
- HomeKit or Matter control as MVP pillars

are no longer canonical Om AI iOS MVP scope.

## 7. Final Lock

iOS MVP is now live-call-first, lesson-aware, recap-aware, and subscription-aware.
