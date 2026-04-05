# Om AI Live Android Realtime Call Spec 2026

Version: 1.0
Status: Locked for DEV handoff
Platform: Android
Primary product line: Om AI Live

## 1. Purpose

Define the Android-specific realtime call architecture for Om AI Live.

## 2. Android Product Priority

On Android, `Om AI Live` is the primary premium mobile experience. The Android team should optimize first for:

- fast call start
- stable audio sessions
- reconnect reliability
- low-latency realtime transport
- clear quota and wrap-up UX

## 3. Recommended Runtime Stack

- Kotlin app with Jetpack Compose UI
- backend session bootstrap via `/v2/live`
- OpenAI Realtime transport using WebRTC for active mobile calls
- Android audio focus + route controls
- optional avatar provider stream layered into the active call screen

## 4. Call Lifecycle

### 4.1 Pre-call

- persona selected
- plan eligibility checked
- usage today fetched
- call mode chosen: `voice_only | voice_avatar`

### 4.2 Session Bootstrap

- call `POST /sessions/create`
- call `POST /sessions/:id/connect`
- obtain realtime bootstrap token
- optionally start avatar session

### 4.3 Active Call

- microphone active
- audio focus held appropriately
- transcript drawer optional
- warning banners at low remaining time
- reconnect path visible to user

### 4.4 Wrap-up

- current sentence ends gracefully
- session closed with `/sessions/:id/end`
- recap displayed
- upgrade or next-lesson CTA shown

## 5. Android Call State Machine

- `idle`
- `creating`
- `connecting`
- `active`
- `interrupted`
- `reconnecting`
- `wrap_up`
- `ended`
- `failed`

## 6. Audio Rules

- the app must request and manage audio focus correctly
- mute state must remain local and explicit
- speakerphone toggle must be visible
- Bluetooth route changes must update UI state
- if audio focus is lost, session UI must reflect interruption or degraded mode

## 7. Background and Service Rules

- active call behavior must comply with Android foreground and microphone/camera restrictions
- long-running active call state must not rely on hidden background execution assumptions
- Android team must explicitly declare foreground-service types when microphone or camera usage requires it

## 8. Avatar Rules

- avatar is optional
- voice-only is never a degraded product failure, it is a supported mode
- if provider stream fails, session remains active in voice-only mode when possible
- provider errors must not crash call UI

## 9. Recommended UI Sections

### Active Call Header

- persona name
- role label
- call status
- timer

### Main Surface

- avatar or portrait
- transcript peek
- lesson progress chip if relevant

### Control Bar

- mute
- speaker
- Bluetooth route
- end call

### Secondary Controls

- correction mode
- language mode
- transcript drawer

## 10. Android-Specific Risks

- device fragmentation for Bluetooth and route behavior
- background restrictions for microphone/camera access
- OEM differences in telecom and audio behavior
- realtime stream recovery under mobile-network changes

## 11. DEV Priorities

1. Voice-only call shell first
2. Stable audio routing second
3. Reconnect and quota warnings third
4. Avatar provider integration fourth
