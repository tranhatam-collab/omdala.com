# Om AI PWA MVP Plan

Version: 3.0
Status: Locked for DEV handoff
Canonical product name: Om AI
Date: April 9, 2026

## Boundary normalization — April 9, 2026

This file is now normalized to the current Om AI product boundary.

Current rule:

- web MVP for Om AI is interaction review, memory, recap, persona catalog, subscription, family/org control, and usage visibility
- scenes, proofs, gateway views, and device graph exploration are `legacy-transition` or `bridge-only`
- do not treat those items as current Om AI web MVP ownership

## 1. Goal

Ship the orchestration, review, and admin surface for Om AI at `ai.omdala.com`.

## 2. MVP Promise

The web surface must support:

- persona catalog review
- session history and recap visibility
- memory editing
- lesson and curriculum review
- subscription context and usage visibility
- family or organization controls where allowed

## 3. MVP Modules

### 3.1 Auth Shell

- sign in
- session restore
- workspace switch where supported

### 3.2 Live Workspace

- persona catalog
- usage today card
- recent recaps
- lesson-plan list

### 3.3 Memory

- preferences
- learner goals
- persona-specific memory controls
- privacy actions where allowed

### 3.4 Policy and Safety

- family-safe visibility
- plan-aware restrictions view
- wellness boundary copy review
- admin-safe policy notes

### 3.5 Activity

- live session history
- recap list
- failures and retries where relevant
- usage events

### 3.6 Subscription

- current plan
- plan comparison
- upgrade prompts
- usage and entitlement visibility

### 3.7 Family and Organization

- child-safe settings
- member overview
- team or class overview where supported

## 4. PWA Rules

- PWA is a control and review layer first
- PWA is not the premium call-quality reference surface
- metering truth remains server-side
- shared account and billing dependencies are consumed, not duplicated

## 5. MVP Success Criteria

1. User can sign in.
2. User can browse personas and review recaps.
3. User can edit memory and preferences.
4. User can inspect usage and plan visibility.
5. User can manage family or admin-safe surfaces where allowed.
6. Web surface never becomes the only trusted call-runtime path.

## 6. Legacy Transition Rule

Any older references to:

- scene shortcuts
- proof inspection for physical runs
- gateway health panels
- device graph exploration
- room or device dashboards

are no longer canonical Om AI PWA MVP scope.

## 7. Final Lock

PWA MVP is now review-first, memory-first, recap-first, and admin-safe.
