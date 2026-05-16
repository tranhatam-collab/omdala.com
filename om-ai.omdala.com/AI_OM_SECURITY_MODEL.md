# AI_OM_SECURITY_MODEL.md

Version: 2.0  
Status: Locked Om AI security model  
Canonical product name: Om AI  
Legacy filename namespace: `AI_OM_*` retained for continuity  
Date: April 9, 2026

---

# 0. Boundary Normalization - April 9, 2026

This file is normalized to the current Om AI boundary.

- `Om AI` is not `OmCode`
- `Om AI` is not `Omniverse`
- the security model is centered on live interaction, account safety, memory, billing visibility, and provider isolation
- older gateway, device, proof, and physical execution references are now `legacy-transition` or `bridge-only`

---

# 1. Purpose

This file defines the security model for Om AI as an AI human interaction product.

Primary security goals:

- protect user identity and session integrity
- protect memory and recap data
- protect billing and usage visibility
- isolate provider access and API keys
- preserve moderation and family-safe boundaries

---

# 2. Core Security Domains

The canonical Om AI security domains are:

- auth and session integrity
- account and profile protection
- preferences and family controls
- live session authorization
- provider credential isolation
- memory privacy
- recap privacy
- moderation and escalation controls
- subscription and usage visibility integrity

---

# 3. Session Security

Om AI must enforce:

- authenticated session creation
- workspace-aware authorization
- persona eligibility checks by plan and policy
- short-lived realtime bootstrap where supported
- session ownership verification on reconnect and end-session paths

Clients must not be trusted as final authority for:

- quota
- plan entitlements
- moderation decisions
- provider routing

---

# 4. Data Protection

Sensitive Om AI data includes:

- profile data
- preference data
- family-safe settings
- session transcripts where retained
- recap content
- persona memory
- learning progress
- billing visibility data

Protections required:

- encryption in transit
- protected storage at rest where supported by platform
- minimum necessary retention
- audited delete and reset flows where policy allows

---

# 5. Provider Isolation

Provider access must be isolated through backend controls.

Rules:

- client apps do not hardcode long-lived provider secrets
- BYO API, if allowed, must be isolated per user or org
- provider routing decisions must remain server-side
- avatar providers must not bypass Om AI moderation and policy layers

---

# 6. Family and Policy Security

Om AI must enforce:

- parent and admin restrictions
- child-safe persona eligibility
- plan-aware family controls
- server-side policy checks before session creation

It is not enough to hide restricted UI. The backend must enforce the same rule set.

---

# 7. Shared Dependency Security

Because Om AI now partially depends on shared platform surfaces, it must treat the following as shared security domains:

- account/profile baseline
- preferences baseline
- billing/subscription baseline
- billing/usage baseline

Om AI still owns:

- product-level authorization for personas, sessions, family policy, and live call behavior

Shared contracts must be consumed carefully and never assumed to fully define Om AI security semantics.

---

# 8. Audit and Monitoring

Security-relevant events must be observable for:

- auth failures
- session authorization failures
- restricted persona access attempts
- provider credential misuse
- usage or billing mismatch anomalies
- moderation escalation triggers
- memory export or delete actions

---

# 9. Legacy Transition Rule

Historical security references such as:

- gateway-signed execution requests
- device-bound execution policies
- proof per physical action
- connector-level environment control

are not primary Om AI security requirements anymore.

They may remain only as:

- bridge-only references
- future cross-product coordination notes
- legacy-transition annotations

---

# 10. Final Lock

The canonical Om AI security model is:

- account and session centered
- live-session aware
- provider isolated
- family and moderation aware
- shared-platform aware
- bridge-only for old reality execution concerns
