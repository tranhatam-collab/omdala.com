# Web to App Execution Plan

This plan locks the final web completion scope first, then transitions to the app phase with minimal rework.

## Progress snapshot (2026-04-04)

- Web gates finalized with request tracing UI and smoke/lighthouse scripts.
- Shared contract locked at `shared/api-contracts.ts` with version `1.0.0`.
- App MVP flows implemented:
  - magic-link request + callback token handling
  - timeline + run detail
  - scene list + run
  - settings + logout
- App CI workflow and smoke scripts are in place.

## 0) Current baseline (already done)

- Production domains are aligned:
  - web: `https://app.omdala.com`
  - api: `https://api.omdala.com`
- Direct Cloudflare deploy is operational from local CLI.
- Production verify scripts are in place:
  - `npm run verify:prod`
  - `npm run deploy:prod:full`

## 1) Complete web to production quality

### 1.1 Product surface hardening

- Finalize auth UX for magic-link:
  - request success state
  - invalid/expired link state
  - resend flow with cooldown
- Add global error boundaries and retry controls for API failures.
- Add loading skeletons for planner, timeline, and scene sections.
- Add empty states for no-runs, no-scenes, no-devices.

### 1.2 Consistent UX system

- Extract reusable UI primitives:
  - Button, Input, Card, Badge, Alert, Section
- Normalize spacing/type scale and responsive breakpoints.
- Add accessibility checks:
  - keyboard focus order
  - visible focus styles
  - contrast baseline for key controls

### 1.3 Data and API contract stability

- Freeze web-consumed API response shapes for:
  - `/v2/reality/*`
  - `/v1/auth/*`
- Add one typed API layer for all endpoints used by web.
- Add basic request tracing exposure in UI (request id from `meta`).

### 1.4 Web quality gates

- Add Playwright smoke tests for:
  - home load
  - magic-link request form submit
  - activity timeline fetch
- Add Lighthouse baseline capture (performance/accessibility/SEO).
- Add release checklist item: verify on `app.omdala.com` + `api.omdala.com`.

## 2) Prepare shared foundation for app phase

### 2.1 Shared domain model package

- Create shared types package for:
  - auth payloads
  - run/proof/timeline models
  - common envelope types
- Implementation path: `shared/api-contracts.ts` (exported to web already); app will import the same file.

### 2.2 Shared API client contract

- Define one transport contract:
  - auth headers
  - envelope parsing
  - error mapping
- Keep web implementation as reference; app client mirrors behavior.

### 2.3 Session and security readiness

- Specify token/session policy for app:
  - refresh behavior
  - secure storage rules
  - logout and revoke semantics
- Add backend docs for mobile-safe CORS/auth assumptions.

## 3) App phase kickoff (after web lock)

### 3.1 App MVP scope

- Sign-in/magic-link flow
- Activity timeline list + run details
- Scene execution actions
- Basic profile/session screen

### 3.2 App architecture

- Feature modules:
  - Auth
  - Timeline
  - Scenes
  - Settings
- Core modules:
  - Networking
  - Session
  - Models
  - Error handling

### 3.3 App delivery gates

- Build + unit tests passing
- API integration against `https://api.omdala.com`
- E2E smoke (login -> timeline -> scene run)
- Internal TestFlight/beta rollout checklist

## 4) Suggested execution order (next 10 work blocks)

1. Finish web auth UX edge states.
2. Add UI primitives and unify styles.
3. Freeze typed API layer + envelope parsing.
4. Add request id exposure in UI diagnostics.
5. Add Playwright smoke tests.
6. Add Lighthouse and accessibility pass.
7. Cut web release candidate and snapshot.
8. Create shared types package.
9. Scaffold app modules with shared client contract.
10. Implement app auth + timeline MVP.

## 5) Exit criteria to move from web -> app

- `npm run deploy:prod:full` green
- `npm run verify:prod` green
- Web smoke tests green
- No P1/P2 issues open for auth/timeline/scene flows
- API contract section locked for app consumers
