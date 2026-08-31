# OMDALA Web UDEP Locked Baseline

Date: April 19, 2026
Protocol authority: `MASTER_DEV_EXECUTION_PROTOCOL_2026.md`
Surface: `apps/web` -> `https://omdala.com`
Owner team: Team 1
Status: LOCKED_BASELINE

## 1. Stage mapping

This document applies UDEP to the public web surface in order:

1. Understand
2. Clarify
3. Lock
4. Plan

Build, Verify, Release, and Operate are tracked in the companion evidence document.

## 2. Understand

### Problem statement

`omdala.com` must act as the independent public surface for OMDALA. It needs to explain the platform clearly, route users into the correct system surfaces, and maintain trust, SEO integrity, and multilingual consistency from the first HTML response.

### Target users

- founders and operators evaluating the platform
- experts, hosts, and communities entering the system from the public site
- technical readers who need docs or trust context before entering product flows

### Business outcome

- public positioning is clear and independent
- CTA routing is correct
- SEO and language output remain canonical
- release verification for the web surface is repeatable

### Constraints

- OMDALA-only scope
- no mixed-brand wording
- no external-domain assumptions outside `*.omdala.com`
- static-export and locale-routing behavior must stay production-safe

## 3. Clarify

### Scope in

- homepage and public web information architecture
- `what-is-omdala`, `how-it-works`, `trust`, `vision`, `faq`, `contact`
- locale-aware routing for supported languages
- metadata, canonical, OG, sitemap, robots, and schema behavior
- CTA handoff from public web to docs/app/auth/admin

### Scope out

- app/auth/admin product implementation
- API runtime changes
- non-OMDALA domain work
- Om AI and AI Omniverse product-specific marketing surfaces

### Naming rules

- `OMDALA` is the only brand authority on `omdala.com`
- public wording must describe verified coordination, trust, and execution
- route labels must align with Team 2 route authority when they cross into product surfaces

### Web acceptance criteria

1. Homepage and public pages use OMDALA-only copy.
2. CTA targets are valid and current.
3. Locale pages return correct language from initial HTML.
4. Metadata and canonical rules match the current host strategy.
5. Public pages build and typecheck cleanly.
6. Web verification evidence is attached before release sign-off.

## 4. Lock

## LOCKED_BASELINE

### Locked surface boundaries

- code surface: `apps/web/*`
- SEO helpers consumed by web: `packages/seo/*`
- shared web-facing copy and locale helpers in `apps/web/app/lib/*`

### Locked route set

- `/`
- `/what-is-omdala`
- `/how-it-works`
- `/for-experts`
- `/for-hosts`
- `/for-communities`
- `/trust`
- `/vision`
- `/faq`
- `/contact`
- localized route equivalents under `/{lang}/...`

### Locked dependencies

- Team 2 route authority for app/auth/admin links
- Team 3 runtime/release contract for canonical host and release gate behavior

### Change control rule

Any change to route set, CTA targets, canonical host behavior, or metadata policy requires:

1. updated acceptance criteria
2. updated evidence requirement
3. updated tracking entry in Team 1 / 3 release flow

## 5. Plan

### Milestone W1 - Public authority

- freeze homepage positioning
- freeze naming and CTA map
- freeze route ownership references

### Milestone W2 - SEO and locale integrity

- verify metadata, canonical, OG, schema
- verify locale routing and HTML-first language output
- verify sitemap and robots behavior

### Milestone W3 - Release gate

- rerun web typecheck and web e2e release checks
- attach release evidence
- publish web release-ready or blocked status

## 6. Risk register

| ID | Risk | Level | Owner | Mitigation |
| --- | --- | --- | --- | --- |
| `WEB-R1` | CTA drift if Team 2 route map changes after public lock | `R2` | Team 1 | keep Team 2 route authority as dependency input |
| `WEB-R2` | Canonical or locale regression on static export | `R3` | Team 1 | rerun release e2e and HTML verification before release |
| `WEB-R3` | Mixed-brand wording reappears in public copy | `R3` | Team 1 | keep copy changes gated by locked baseline and tracker |

## 7. Definition of done for web tasks

A web task is done only when:

1. accepted scope is delivered
2. typecheck/build issues are clear
3. relevant page or SEO behavior is verified
4. docs/reporting are updated
5. evidence is linked in the web evidence pack
