# TEAM HANDOFF REQUIREMENTS - OMDALA DOCS + APP

Version: 1.0

Status: Handoff Ready

Owner: OMDALAT public web -> OMDALA docs/app integration

## 1. Objective

This handoff defines the requirements for the team responsible for:

- `docs.omdala.com`
- `app.omdala.com`
- `auth.omdala.com`

The public city-node site `omdalat.com` is already being built separately and must integrate into the OMDALA global system without domain drift, routing confusion, or SEO fragmentation.

## 2. Final Domain Architecture

The architecture is locked and must not be changed.

- Public city node: `https://omdalat.com`
- Global docs layer: `https://docs.omdala.com`
- Global app runtime: `https://app.omdala.com`
- Global auth layer: `https://auth.omdala.com`

Do not use:

- `https://app.omdalat.com`
- `https://docs.omdalat.com`

## 3. System Roles

### 3.1 OMDALAT

`omdalat.com` is the public city node.

Its job is to:

- explain the node
- attract the right users
- explain programs and local value
- act as the top-of-funnel entry point

### 3.2 OMDALA Docs

`docs.omdala.com` is the global documentation layer.

Its job is to:

- explain the system
- explain usage flows
- explain trust and proof
- explain policies
- explain operator workflows

### 3.3 OMDALA App

`app.omdala.com` is the global runtime layer.

Its job is to:

- handle dashboard and user actions
- run authenticated flows
- surface data and proofs
- support moderation, settings, and operational actions

## 4. Mandatory Routing Rule

All routing must follow this pattern:

- `omdalat.com` -> may link to `docs.omdala.com` or `app.omdala.com`
- `docs.omdala.com` -> may link to `app.omdala.com`
- `app.omdala.com` -> must not link back to `omdalat.com`

Wrong:

- `app -> omdalat`
- `docs -> omdalat`

Correct:

- `omdalat -> docs -> app`

## 5. Redirect Requirements

The old app host must redirect permanently:

- `app.omdalat.com/* -> app.omdala.com/:splat` with `301`

This redirect must be live at infrastructure level.

## 6. Auth And Session Strategy

The authentication layer must use:

- Auth host: `auth.omdala.com`
- Cookie domain: `.omdala.com`

Login flow must be:

- `app.omdala.com -> auth.omdala.com -> app.omdala.com`

Do not use `omdalat.com` for authentication.

## 7. Future Domain Rule

All future system-level subdomains must live under:

- `*.omdala.com`

Do not create new system services under:

- `*.omdalat.com`

Allowed examples:

- `finance.omdala.com`
- `trust.omdala.com`
- `graph.omdala.com`

Disallowed example:

- `finance.omdalat.com`

Exception:

- `omdalat.com` remains the public city-node website

## 8. Docs Requirements

The docs team must deliver a production-ready docs surface at `docs.omdala.com`.

### 8.1 Required Primary Routes

- `/`
- `/getting-started`
- `/what-is-omdala`
- `/what-is-omdalat`
- `/how-it-works`
- `/programs`
- `/roles`
- `/trust-and-proof`
- `/policies`
- `/operator-guide`

### 8.2 Required Navigation

- Overview
- Getting Started
- What is OMDALA
- What is OMDALAT
- How it works
- Programs
- Roles
- Trust & Proof
- Policies
- Operator Guide

### 8.3 Required Content Areas

The docs must explain at minimum:

1. System overview
2. What OMDALA is
3. What OMDALAT is
4. City node concept
5. How join -> match -> action -> proof works
6. Programs: live & work, remote work, creative economy, build
7. Roles: user, creator, host, operator
8. Trust system: proof, verification, trust layer
9. Policies: community, work, place, creator
10. Operator guide: onboarding, users, places, programs

### 8.4 Required Compatibility Redirects

The docs layer must support the routes currently linked by the public OMDALAT site, either as real pages or redirects:

- `/omdalat/overview`
- `/omdalat/how-it-works`
- `/omdalat/programs`
- `/omdalat/programs/creator-live-and-work`
- `/omdalat/requests-and-matching`
- `/omdalat/trust-and-proof`
- `/omdalat/join-and-onboarding`
- `/help/contact-support`
- `/omdalat/entities/places`
- `/omdalat/entities/hosts`
- `/omdalat/entities/experts`
- `/omdalat/entities/communities`
- `/omdalat/entities/proofs`
- `/omdalat/creative-economy`
- `/omdalat/operator-guide`
- `/omdalat/roles-and-permissions`
- `/omdalat/policies`
- `/omdalat/api`

### 8.5 Docs Linking Rule

Docs may link to:

- `app.omdala.com`

Docs must not link back to:

- `omdalat.com`

## 9. App Requirements

The app team must deliver a production-ready runtime at `app.omdala.com`.

### 9.1 Required Primary Routes

- `/dashboard`
- `/places`
- `/hosts`
- `/experts`
- `/communities`
- `/events`
- `/proofs`
- `/profile`
- `/settings`

### 9.2 App Behavior Requirements

The app must:

- use `https://app.omdala.com` as the canonical runtime base
- support authenticated and session-aware flows
- expose proof-related and trust-sensitive actions
- provide a persistent entry to `https://docs.omdala.com`
- avoid any user-facing navigation back to `omdalat.com`

### 9.3 App Metadata Requirements

- app metadata base must use `https://app.omdala.com`
- app host must be `noindex`
- app routes must not appear in public sitemap feeds

### 9.4 App Health / Runtime Identity

Where applicable, runtime identity should reflect the global layer, for example:

- `omdala-app`

Not:

- `omdalat-app` as a production-facing identity

## 10. SEO And Indexing Rules

### 10.1 OMDALAT Public Site

- canonical: `omdalat.com`

### 10.2 Docs

- canonical: `docs.omdala.com`
- indexable
- stable route structure

### 10.3 App

- noindex
- not in public sitemaps
- not exposed as a public SEO surface

## 11. Integration Requirements For OMDALAT Team

The OMDALA team must provide the OMDALAT public-web team with:

1. final production URLs
2. final route map
3. final redirect map
4. canonical and noindex policy
5. auth/session spec
6. handoff note for web integration

They must also commit to route stability. Any slug or route changes must be communicated before release.

## 12. QA Checklist

The following must pass before integration is considered complete:

- no remaining production links to `app.omdalat.com`
- `docs.omdala.com` opens correctly
- `app.omdala.com` opens correctly
- old app host redirects correctly
- `omdalat.com` links into docs correctly
- docs link into app correctly
- app does not link back to `omdalat.com`
- docs do not link back to `omdalat.com`
- docs canonical tags are correct
- app is blocked from indexing

## 13. Delivery Format Expected From OMDALA Team

Please return the following in a single handoff packet:

1. Production domains
2. Route inventory
3. Redirect inventory
4. Canonical/noindex policy
5. Auth and cookie strategy
6. QA evidence
7. Go-live owner and rollback contact

## 14. Final Note

This architecture is locked.

- OMDALA = global system
- OMDALAT = city node
- docs + app = global layer

Do not collapse these roles into a single domain family. If that separation is broken, the system will fragment at the branding, SEO, trust, and scaling levels.
