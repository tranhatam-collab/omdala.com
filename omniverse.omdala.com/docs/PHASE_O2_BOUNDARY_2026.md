# Phase O2 Boundary

Scope: Omniverse device onboarding/state, and scene activation within per-room scope. No cross-domain data like lessons or curriculum.

Owned by: Omniverse backend team, with collaboration with Shared Core for workspace/auth context.

Boundaries

- Phase O2 endpoints touch devices and scenes only; do not reach into Om AI content.
- Use shared-core for workspace membership checks and auth context (via token).
- Data models: devices and scenes stored in Omniverse DB or in-memory adapters per phase.
- All cross-app data (lesson progress, curriculum) remains in Om AI domain.

End of Boundary
