# ADR: Omniverse Park Decision

## Status: ACCEPTED (Founder-approved)
## Date: 2026-07-31
## Decision Maker: Founder (tranhatam)

## Context

Omniverse (`omniverse.omdala.com`) was listed as a Team 4 sub-project in the
OMDALA ecosystem. During the Phase 0 audit, the following was discovered:

1. **No executable code**: The `omniverse.omdala.com/` directory contained only
   a single stale `web/next-env.d.ts` file — no application code, no routes,
   no components, no tests.
2. **No DNS**: `omniverse.omdala.com` does not resolve (NXDOMAIN).
3. **No Cloudflare Pages project**: No deployment target exists.
4. **Domain types preserved**: `packages/types/src/omniverse.ts` contains
   domain model TypeScript interfaces that are referenced by other packages.

## Decision

**Park the Omniverse sub-project.** Specifically:

1. Remove the stale `omniverse.omdala.com/` directory (already done — only
   `next-env.d.ts` was present, now removed).
2. Keep `packages/types/src/omniverse.ts` as a domain model reference for
   future use.
3. Remove Omniverse from the go-live scope for the 2026-07-28 release.
4. No DNS, no Pages project, no deployment will be created for Omniverse.
5. If Omniverse is revived in the future, it must go through the full
   FPOS Level 2 approval process with a new work item, owner, and
   acceptance criteria.

## Rationale

- Building an executable product without a PRD, owner, or acceptance criteria
  violates FPOS Level 2 requirements.
- The domain types are preserved for future reference.
- Parking avoids wasted effort on a project with no current business case.
- The Founder has reviewed and approved this decision.

## Consequences

- Omniverse is not part of the 2026-07-28 release.
- The domain `omniverse.omdala.com` remains unregistered/unconfigured.
- `packages/types/src/omniverse.ts` remains in the codebase as reference.
- Reviving Omniverse requires a new Founder-approved work item.

## Evidence

- Stale file removed: `omniverse.omdala.com/web/next-env.d.ts` (commit 1d838b8)
- Types preserved: `packages/types/src/omniverse.ts` (313 lines of interfaces)
- DNS check: `omniverse.omdala.com` → NXDOMAIN
- No Cloudflare Pages project exists for Omniverse
