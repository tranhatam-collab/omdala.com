# Web to App Execution Plan

Version: 2.0
Status: Locked for current Om AI execution
Canonical product name: Om AI
Date: April 10, 2026

## Boundary normalization — April 10, 2026

This file is now normalized to the current Om AI product boundary.

Current rule:

- web-to-app execution for Om AI means taking the web review/admin surface and aligning it with the native Om AI Live mobile surfaces
- older `scene`, `run`, and `/v2/reality/*` assumptions are `legacy-transition` only
- Team Om AI must not use this file to revive old reality-first app scope

## 1. Purpose

Lock the transition path from Om AI web surfaces to Om AI mobile surfaces with minimal rework.

## 2. Current Baseline

Web currently serves as:

- persona browsing and review surface
- recap and memory review surface
- usage and subscription visibility surface
- family or organization control surface where allowed

Mobile currently serves as:

- native live-call surface
- lesson and practice surface
- realtime audio and optional avatar runtime surface

## 3. Web Hardening Priorities

- finalize persona and recap UX
- finalize usage and plan visibility
- stabilize memory editing and family-safe views
- keep web useful without trying to become the premium call runtime

## 4. Shared Foundation Priorities

- shared types for account, billing visibility, persona, session, recap, and lesson models
- shared API envelope handling
- shared terminology between web and mobile

## 5. Mobile Alignment Priorities

### iOS

- live call shell
- usage warnings
- recap handoff
- lesson continuation
- subscription visibility

### Android

- live call shell
- audio route and reconnect states
- recap handoff
- lesson continuation
- subscription visibility

## 6. Delivery Gates

- web reads current Om AI contracts only
- mobile reads current Om AI contracts only
- shared account and billing dependencies stay aligned with shared platform
- no old `scene/run/device` assumptions remain in current app planning

## 7. Final Lock

Web-to-app execution for Om AI is now live-product-first, recap-aware, and shared-platform-aware.
