# AI_OMNIVERSE_BOUNDARY_GUARDRAILS_2026.md

Version: 1.0
Status: ENFORCED

---

# 1. Purpose

This file is the hard boundary checklist for feature intake and implementation in omniverse.omdala.com.

---

# 2. Allowed in this workspace

- rooms and spaces
- devices and onboarding
- scenes and action orchestration
- gateway runtime
- automation rules
- physical status and alerts
- proof logs and operational timelines

---

# 3. Not allowed in this workspace

- curriculum and lessons
- teacher/coach/receptionist personas
- language-learning flows
- school/family learning dashboards
- sales roleplay learning

If requested, redirect to om-ai.omdala.com.

---

# 4. Shared vs domain rule

Allowed shared dependencies (consume only):

- auth/account/billing/workspace/provider/notifications/analytics APIs

Not allowed here:

- implementing shared-core services inside this workspace

Domain-owned here:

- /v2/omniverse endpoints
- Omniverse data models for rooms/devices/scenes/gateway/automation/proof

---

# 5. Intake checklist (must pass before coding)

1. Is this feature Omniverse domain-specific?
2. Is this feature free from Om AI learning/persona scope?
3. Is implementation folder placement correct?
4. Are shared-core contracts referenced instead of reimplemented?
5. Are security, permissions, and observability requirements identified?

If any answer is NO, do not start implementation.

---

# 6. Release guardrail

No feature can be marked release-ready unless boundary compliance is documented in its task/PR notes.

---

# END OF FILE
