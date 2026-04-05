# Phase O2 Plan 2026

Version: 1.0
Status: DRAFT

Scope: Device MVP, Scene Orchestration, and shared-core integration for Omniverse

Goals

- Implement device onboarding and device state APIs
- Implement basic scene control APIs and gateway runtime interactions
- Tighten shared-core integration for workspace/billing/analytics
- Extend authCtx usage to cover additional Omniverse entry points

Deliverables

- API: /v2/omniverse/devices/_, /v2/omniverse/scenes/_, /v2/omniverse/gateways/\*
- Flow: login-room-state extended to cover device on/off via scene state
- DB/schema: minor additions for devices states and scenes as needed
- Tests: unit/integration tests for new endpoints and flows
- Docs: boundary and plan for O2 with backlog

Backlog (high-level)

- [ ] Design device onboarding schema and persistence
- [ ] Implement device state read/write endpoints
- [ ] Implement scene execution endpoints and state graph updates
- [ ] Gate runtime: basic gateway execution for device commands
- [ ] Shared-core alignment: ensure workspace-scoped data workflows
- [ ] Observability hooks for device/scene actions
- [ ] Security review for new endpoints and auth context propagation

Planning & Estimation

- 2 weeks for O2 MVP core, 1 extra week for polish/QA
- Define acceptance criteria per endpoint

Dependencies

- Shared-core workspace APIs availability
- DB adapters ready for new domain models

End of Phase

Backlog Details (expanded)

- Task 1: API spec for O2 device onboarding, device state, and scene activation
  - Acceptance: endpoints defined; payloads and responses documented
  - Owner: Backend Architect
  - Est: 4h
- Task 2: Implement device onboarding skeleton endpoint
  - Endpoint: POST /v2/omniverse/devices/onboard
  - Acceptance: returns created device entry; validates room exists
- Task 3: Implement get device state skeleton
  - Endpoint: GET /v2/omniverse/devices/:deviceId/state
- Task 4: Implement update device state skeleton
  - Endpoint: PUT /v2/omniverse/devices/:deviceId/state
- Task 5: Implement scene activation skeleton
  - Endpoint: POST /v2/omniverse/rooms/:roomId/scene/activate
- Task 6: Implement list devices in a room skeleton
  - Endpoint: GET /v2/omniverse/rooms/:roomId/devices
- Task 7: Unit tests for O2 skeletons
  - Coverage: onboarding, get/update state, scene activate
- Task 8: E2E test scaffolds for O2 flows
- Task 9: Boundary doc section for Phase O2
- Task 10: Update PHASE_O2_PLAN_2026.md with acceptance criteria and milestones
- Task 11: CI wiring for Phase O2 (branch, PR, and tests)
