# TEAM APP EXECUTION STANDARD

Product: Om AI
Status: active
Canonical workspace: `omdala.com/om-ai.omdala.com`

## Mission

Team App owns the Om AI iOS + Android experience for live voice interaction, personas, lessons, recap, and memory.
The current repo already has a real mobile baseline; the next step is completion and release hardening.

## Owning teams

- Team B mobile squad
- Team Platform for auth, billing, analytics, and provider routing

## In scope

- live voice session
- persona browsing
- lesson viewer
- recap and memory view
- family controls
- transcript history
- subscription visibility

## Out of scope for v1

- large admin dashboards
- school/business control consoles that already fit web better
- non-essential avatar experiments

## Recommended stack

- continue the existing Expo / React Native app
- add native modules only where realtime audio/video needs them
- reuse backend and gateway contracts

## Execution order

1. Freeze `/v2/live` and session lifecycle contracts.
2. Finish voice session shell and reconnect behavior.
3. Add recap, memory, transcript, and family controls.
4. Add push, billing visibility, and error recovery.
5. Run performance pass and store release prep.

## Dependencies

- backend must freeze live-call, moderation, recap, and metering schemas
- platform must provide auth and analytics stability

## Done when

- iOS and Android can complete a live session reliably
- persona, lesson, recap, memory, and transcript flows work
- push works for session-related events
- store beta builds are ready for pilot users

## Hard rules

- mobile cannot wait on undefined live-call schemas
- do not fork product meaning between mobile and web
- keep voice-first quality above decorative UI work

## Web + app unified delivery rules

This repo must follow `/Users/tranhatam/Documents/Devnewproject/LOCAL_OPERATIONS/WEB_APP_MOBILE_UNIFIED_DELIVERY_STANDARD_2026-04-14.md`.

- web remains the canonical public URL and SEO layer
- the app must reach `minimum usable mobile` first, then move to broader parity for stable live-call flows
- every live, recap, moderation, and metering flow must map web route, app route, deep link, and canonical URL
- if web copy, session states, or persona rules change, app must update in the same sprint window
- if backend schemas drift, release stays blocked until the contract is re-frozen
