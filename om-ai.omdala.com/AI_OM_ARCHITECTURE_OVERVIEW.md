# Om AI Architecture Overview

Version: 3.0
Status: Locked for DEV handoff
Canonical product name: Om AI
Date: April 9, 2026

## Boundary normalization — April 9, 2026

This file is now normalized to the current Om AI product boundary.

Current canonical rule:

- `Om AI` = AI human interaction, learning, communication, family-safe, and business interaction product
- `Om AI` is **not** `OmCode`
- `Om AI` is **not** `Omniverse`
- any device, room, scene, gateway, or physical-control content below must be read as bridge-only or historical context

If this file conflicts with current product direction, follow:

1. `AI_OM_SHARED_PLATFORM_DEPENDENCY_STATUS_2026.md`
2. `AI_OM_TEAM_BOUNDARY_AND_DEPENDENCY_MATRIX_2026.md`
3. `AI_OM_SHARED_RESOURCE_REUSE_PLAN_2026.md`
4. `AI_OM_PHASED_INTEGRATION_BACKLOG_2026.md`

## 1. System Layers

1. native iOS Om AI live surface
2. native Android Om AI live surface
3. `ai.omdala.com` review, memory, lesson, and admin surface
4. `api.omdala.com` Om AI live APIs plus approved shared platform dependencies
5. shared platform account and billing baseline
6. optional bridge-only integration layer when explicitly approved

## 2. Runtime Boundary

- iOS and Android own trusted interaction and live call UX
- web owns orchestration, review, admin, memory, and subscription surfaces
- backend owns sessions, memory, recap, moderation, metering, curriculum, and provider routing
- shared platform owns baseline account and billing contracts where approved
- gateway remains bridge-only and not Om AI core ownership
- avatar providers remain replaceable adapters, not core product owners

## 3. Data Flows

### Om AI Live Core

persona select -> plan and policy check -> session create -> realtime conversation -> recap -> memory update -> usage metering -> subscription prompts

### Shared Dependency Flow

authenticated user -> shared profile and preference baseline -> Om AI product interpretation -> live session and lesson surfaces

### Bridge-Only Context

older device or gateway flows remain non-primary and must not dictate Om AI roadmap

## 4. Non-Negotiables

- no live session without backend-owned metering
- no family-safe surface without server-side enforcement
- no regulated-care claims in wellness personas
- no hard dependency on a single avatar or AI provider
- no shared-platform alignment that transfers Om AI product ownership away from Team Om AI

## 5. Final Lock

The canonical Om AI architecture is now live-product-first, shared-platform-aware, and bridge-only for older reality scope.
