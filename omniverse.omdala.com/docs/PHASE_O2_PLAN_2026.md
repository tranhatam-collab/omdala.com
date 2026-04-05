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
