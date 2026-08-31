# Om AI Backend Service Map

Version: 3.0
Status: Locked for DEV handoff
Canonical product name: Om AI
Date: April 9, 2026

## Boundary normalization — April 9, 2026

This file is now normalized to the current Om AI product boundary.

Current rule:

- Om AI backend services must prioritize live sessions, personas, memory, recap, moderation, metering, and provider routing
- shared platform baseline services may be consumed for account and billing visibility
- old reality, proof, scene, and gateway service groups are `legacy-transition` or `bridge-only`

## 1. Core Om AI Services

- persona registry service
- live session orchestration service
- realtime token and session broker
- avatar provider adapter service
- provider routing service
- lesson and curriculum service
- recap generation service
- memory service
- usage metering service
- subscription and plan interpretation service
- moderation and escalation service
- analytics and event service

## 2. Shared Platform Dependencies

- account profile baseline
- account preferences baseline
- billing subscription baseline
- billing usage baseline

These dependencies are consumed by Om AI but do not replace Om AI service ownership.

## 3. Shared Behaviors

- deterministic request validation
- explicit error codes
- audit-ready logging
- idempotent session operations where possible
- backend-owned usage enforcement for free and paid plans
- provider abstraction so AI and avatar vendors can be swapped without client contract breakage

## 4. Legacy Transition Services

The following are no longer current Om AI core services:

- device service
- scene service
- proof service
- gateway registry service
- physical execution or planner services

If retained anywhere, they are bridge-only or archival context.

## 5. Final Lock

The Om AI backend service map is now live-core-first and shared-platform-aware.
