# AI_OM_OMDALA_AND_IAI_ONE_INTEGRATION_RECOMMENDATION_2026.md

Version: 1.0  
Status: Official integration recommendation for DEV and Product handoff  
Scope: Om AI coordination with OMDALA and selected `*.iai.one` resources  
Date: April 4, 2026

---

# 1. Purpose

This document turns the ecosystem audit into a concrete recommendation set for Om AI.

It answers:
- what Om AI should integrate with
- what Om AI should not depend on too early
- in what order integration should happen
- how to coordinate without damaging code ownership or team boundaries

---

# 2. Core Recommendation

Om AI should be built and stabilized first as its own execution product inside `ai.omdala.com`.

After that, external coordination should happen in this order:

1. coordinate with `omdala.com`
2. bridge to `cios.iai.one` for business and enterprise
3. connect selected workflow capabilities from `flow.iai.one`
4. use `docs.iai.one` as docs pattern only

Om AI should not be blocked by or tightly coupled to the rest of `*.iai.one` before core execution is stable.

---

# 3. Why OMDALA Comes First

## 3.1 Same-brand alignment

`omdala.com` is the global OMDALA system layer and is already structured around:
- `app.omdala.com`
- `api.omdala.com`
- `docs.omdala.com`
- `admin.omdala.com`

## 3.2 Shared-package opportunity

The local OMDALA repo already has:
- shared `types`
- shared `ui`
- shared `core`
- SEO and app shells
- API and service boundaries

## 3.3 Recommendation

After Om AI core contracts settle, Om AI should coordinate with OMDALA at these layers:
- identity and auth model
- shared package extraction
- admin surface patterns
- docs surface patterns
- trust and notification surface patterns

Hard rule:
- Om AI should not be absorbed into the global repo before Om AI product boundaries are stable

---

# 4. Recommended OMDALA Coordination Model

## 4.1 Phase-safe coordination

Use this order:

Phase A:
- keep Om AI fully in `ai.omdala.com`
- build Om AI contracts, mobile surfaces, metering, memory, and provider router

Phase B:
- extract only clearly reusable shared types and UI patterns from `omdala.com`
- align auth and account models where useful

Phase C:
- evaluate whether Om AI should surface inside `app.omdala.com` navigation
- keep Om AI execution code separate unless there is a deliberate monorepo merge plan later

## 4.2 What to reuse from OMDALA first

Recommended first reuse list:
- type conventions
- API boundary discipline
- auth boundary concepts
- trust and notifications architecture direction
- docs and admin IA patterns

## 4.3 What not to reuse too early

Do not force early reuse of:
- unrelated marketplace or matching logic
- global public-site structure as product runtime
- monorepo assumptions that slow Om AI delivery

---

# 5. Recommended CIOS Coordination Model

## 5.1 Best-fit role for CIOS

CIOS is the strongest `*.iai.one` partner for:
- business mode
- enterprise mode
- org policy
- compliance
- CRM context
- audit and retention

## 5.2 Recommended integration shape

CIOS should be connected through adapters, not shared code entanglement.

Suggested bridge points:
- workspace identity sync
- role and org policy sync
- CRM context injection into Om AI business sessions
- audit and analytics event forwarding
- plan and entitlement mapping where appropriate

## 5.3 Recommended timing

CIOS integration should begin only after:
- Om AI session model is stable
- provider router is stable
- metering and subscription are stable
- business personas exist in usable form

---

# 6. Recommended Flow Coordination Model

## 6.1 Best-fit role for Flow

Flow is best used for:
- scheduled recap workflows
- reminder automation
- lesson follow-up
- enterprise workflow automation
- training program orchestration

## 6.2 Not recommended as early dependency

Flow should not own:
- the primary realtime call loop
- mobile call transport
- quota truth
- billing truth
- persona runtime truth

## 6.3 Recommended timing

Flow coordination should happen after Om AI MVP proves:
- successful voice sessions
- recap generation
- stable metering
- repeat usage patterns

---

# 7. Lower-Priority Ecosystem Coordination

## 7.1 docs.iai.one

Use as inspiration for:
- docs hub architecture
- content publishing patterns
- search/sidebar structure

Do not treat as Om AI runtime dependency.

## 7.2 app.iai.one

Possible niche use later for:
- template-driven publishing
- microsites
- operator publishing patterns

Not recommended for Om AI core product integration.

## 7.3 home.iai.one

Useful only as:
- ecosystem portal reference
- ecosystem IA reference

## 7.4 noos.iai.one

Use only as concept reference until public/runtime alignment becomes trustworthy.

## 7.5 CODE.OMDALA.COM

Useful for internal developer workflows, not as Om AI product runtime.

---

# 8. Integration Boundaries Om AI Should Keep

Om AI must keep these boundaries even when integration starts:
- Om AI session truth stays in Om AI backend
- Om AI quota and billing truth stays in Om AI backend
- Om AI persona and memory truth stays in Om AI backend
- provider-router decisions stay in Om AI backend
- business or enterprise overlays may enrich Om AI, but should not replace Om AI core ownership

---

# 9. Recommended Integration Roadmap

## Stage 1 - Om AI standalone completion

Finish inside `ai.omdala.com`:
- `/v2/live` backend
- iOS call MVP
- Android skeleton and MVP path
- web dashboard
- metering
- pricing and plan logic
- persona system
- memory model implementation

## Stage 2 - OMDALA alignment

Coordinate with `omdala.com` on:
- shared types
- shared UI tokens or components where safe
- auth and account model alignment
- admin and docs patterns

## Stage 3 - CIOS enterprise bridge

Add:
- workspace sync
- org policy sync
- CRM context injection
- audit forwarding
- business analytics bridge

## Stage 4 - Flow orchestration bridge

Add:
- recap automation
- scheduled follow-up
- campaign or learning workflows
- enterprise workflow orchestration

---

# 10. What DEV Should Do

DEV should:
- treat Om AI as the primary execution system
- read OMDALA and selected `iai.one` resources as reusable ecosystem assets
- integrate by contract and adapter
- avoid direct codebase blending across dirty or diverging repos
- keep business integration behind explicit feature phases

---

# 11. What DEV Should Not Do

DEV should not:
- merge Om AI into another repo early
- make Flow a hard dependency for MVP
- make CIOS a hard dependency for consumer product delivery
- assume public-web status equals local repo truth
- copy large code sections from sibling repos without explicit extraction plan

---

# 12. Product Recommendation Lock

The product-level recommendation is:

- Om AI builds first as an OMDALA product
- OMDALA global assets are the first reuse pool
- CIOS is the enterprise/business bridge
- Flow is the orchestration extension
- other `*.iai.one` resources remain secondary or reference-only until clearer need appears

This is the safest and most leverage-efficient coordination path.
