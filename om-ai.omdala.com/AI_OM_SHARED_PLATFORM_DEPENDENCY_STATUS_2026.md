# AI_OM_SHARED_PLATFORM_DEPENDENCY_STATUS_2026.md

Version: 1.0  
Status: ACTIVE DEPENDENCY LOCK  
Canonical product name: Om AI  
Legacy filename namespace: `AI_OM_*` retained for continuity  
Date: April 9, 2026  
Owner: Om AI Team + Shared Platform coordination

---

# 1. PURPOSE

This file locks the current dependency status between:

- `om-ai.omdala.com`
- `omdala.com` shared platform
- future bridges such as `cios.iai.one` and `flow.iai.one`

It exists to stop ownership drift while Om AI keeps shipping.

---

# 2. CORE RULE

Shared platform supports Om AI.  
Shared platform does not own Om AI live product logic.

Canonical boundary:

- `omdala.com` = shared platform foundation
- `Om AI` = AI human interaction product
- `OmCode` = separate product, separate ownership, separate roadmap
- `Omniverse` = separate product, separate ownership, separate roadmap

If any older file implies that Om AI should be absorbed into shared platform, treat that as outdated.

---

# 3. CURRENT DEPENDENCY STATUS

## 3.1 PARTIAL_SHARED

The following domains are now classified as `PARTIAL_SHARED`:

- `account/profile`
- `account/preferences`
- `billing/subscriptions`
- `billing/usage`

Meaning:

- shared platform may define baseline contracts and storage shape
- Om AI may consume these contracts
- Om AI still owns product-facing interpretation and app behavior

Shared does not get automatic ownership of Om AI product semantics.

---

# 4. WHAT SHARED PLATFORM OWNS

Shared platform at `omdala.com` owns:

- account identity baseline
- profile baseline fields
- preferences baseline fields
- subscription storage baseline
- usage storage baseline
- auth/session infrastructure
- generic billing rails
- generic API envelope
- shared platform monitoring hooks

Shared platform does not own Om AI user experience or live product truth.

---

# 5. WHAT OM AI STILL OWNS

Om AI keeps full ownership of:

- persona system
- live sessions
- realtime bootstrap
- provider router
- usage metering truth for Om AI product behaviors
- memory product logic
- curriculum product logic
- recap product logic
- family/school/business mode semantics
- feature gating logic for Om AI plans

This rule is non-negotiable for MVP velocity.

---

# 6. WHAT IS EXPLICITLY NOT SHARED

The following must not be migrated into shared platform at this stage:

- persona policy and persona runtime rules
- call session orchestration
- recap generation semantics
- lesson progression semantics
- live call free-minute enforcement semantics
- Om AI plan-specific product gating
- provider failover behavior
- Om AI conversation memory behavior

These remain inside Om AI until a future approved extraction.

---

# 7. CURRENT PLATFORM MAP

## Primary shared platform

- `omdala.com`

Role:

- parent ecosystem
- shared auth
- shared account foundation
- shared billing foundation
- shared cross-product platform contracts

## Future bridge only

- `cios.iai.one`
- `flow.iai.one`

Current rule:

- not primary ownership surfaces for Om AI
- not source-of-truth for Om AI MVP execution
- only future bridge phases

---

# 8. TEAM EXECUTION RULES

## Om AI team may

- consume shared account/profile contract
- consume shared account/preferences contract
- consume shared billing/subscription contract
- consume shared billing/usage contract
- extend Om AI app behavior on top of those contracts

## Om AI team may not

- hand over Om AI live ownership to shared platform
- move persona or session logic into shared platform
- merge hot product logic just to "centralize"
- let shared contract decisions erase Om AI product-specific needs

---

# 9. RISK IF THIS FILE IS IGNORED

If the team ignores this dependency lock:

- Om AI will lose product clarity
- shared platform scope will bloat
- live product logic will become harder to ship
- ownership conflicts will increase
- velocity will drop across both teams

---

# 10. CURRENT STATUS SUMMARY

Current approved dependency status:

- shared account/profile = `PARTIAL_SHARED`
- shared preferences = `PARTIAL_SHARED`
- shared billing/subscription = `PARTIAL_SHARED`
- shared billing/usage = `PARTIAL_SHARED`
- Om AI live product core = `OM_AI_OWNED`
- CIOS bridge = `LATER_PHASE`
- Flow bridge = `LATER_PHASE`

---

# 11. FINAL DIRECTIVE

Use shared platform for stable foundations.

Do not push Om AI product truth into shared platform.

Om AI remains an independent product inside the ecosystem, not a thin client of shared platform.

---

# END OF FILE
