# Om AI Live Dev Implementation Plan 2026

Version: 1.0
Status: Build plan
Priority: Highest

## 1. Objective

Ship the first production-capable Om AI Live foundation today at spec, API, and module-contract level so feature implementation can start without ambiguity.

## 2. Critical Path

1. lock brand and source-of-truth docs
2. create persona registry contract
3. implement backend live session endpoints
4. implement usage metering service
5. implement iOS voice-call shell
6. wire realtime adapter
7. add avatar adapter and graceful fallback
8. persist recap and memory

## 3. Workstreams

### Backend

- create `/v2/live/personas`
- create `/v2/live/sessions/create`
- create `/v2/live/sessions/:id/end`
- create `/v2/live/usage/today`
- create `/v2/live/moderation/check`
- add metering storage model
- add summary + recap pipeline contract

### iOS

- call list screen
- persona detail screen
- active call view
- realtime session manager
- call audio routing controls
- in-call usage warning banner
- end-call recap view

### Android

- call list screen
- persona detail screen
- active call screen with audio focus and route controls
- realtime session manager
- reconnect-safe voice-only flow
- end-call recap view

### Web/Admin

- persona catalog management
- lesson-plan management
- moderation review queue
- usage dashboard
- subscription plan console

### AI and Content

- seed first persona library
- seed first curriculum library
- define safety prompt templates
- define recap templates

## 4. MVP Stack Order

### MVP A

- voice only
- one teacher persona
- free-minute enforcement
- recap after every call

### MVP B

- multiple personas
- lesson plans
- long-term memory
- upgrade flow

### MVP C

- avatar providers
- business reporting
- organization plans

## 5. Done Definition

A task is not done unless:

- API contract exists
- error behavior is defined
- analytics event exists
- fallback path exists
- copy and policy text are aligned to Om AI brand
