# AI_OM_PRICING_AND_PLAN_LOGIC_2026.md

Version: 1.0  
Status: Locked pricing and entitlement logic  
Parent systems: AI Om Core, AI Om Live  
Master brand: OMDALA  
Date: April 4, 2026

---

# 1. Purpose

Define plan structure, entitlement boundaries, and upgrade logic for AI Om across personal, family, school, business, and enterprise contexts.

The product should sell outcomes, continuity, and trusted access, not just raw minutes.

---

# 2. Plan Families

Plan families:
- `free`
- `personal_pro`
- `family`
- `education_plus`
- `business`
- `enterprise_custom`

---

# 3. Entitlement Dimensions

A plan may control:
- daily or cycle minute pools
- number of personas
- persona categories
- avatar availability
- memory horizon
- recap depth
- report access
- family profile count
- classroom or team seat count
- custom persona builder tier
- BYO provider access
- org policy controls

---

# 4. Free Plan

Purpose:
- drive acquisition
- create daily habit
- prove value quickly

Recommended entitlements:
- 30 minutes per day
- 1 to 2 core personas
- voice-first access
- text support
- basic lessons
- short memory horizon
- standard recap
- limited or fallback avatar path depending on cost policy

---

# 5. Personal Pro

Purpose:
- serious learners
- adults practicing language daily
- personal growth users

Recommended entitlements:
- larger minute pool
- more personas
- long-term memory
- premium correction modes
- richer language practice
- premium recap and reports
- avatar option
- improved routing priority

---

# 6. Family Plan

Purpose:
- parent + child shared environment
- controlled educational and safe entertainment use

Recommended entitlements:
- multiple family profiles
- parent dashboard
- child-safe mode
- per-child time controls
- child-safe persona controls
- learning reports
- family invite and bonus logic

---

# 7. Education Plus

Purpose:
- schools, tutors, centers, learning organizations

Recommended entitlements:
- multi-subject teaching personas
- structured lesson pathways
- assignment and reporting flows
- admin dashboard
- classroom or learner grouping
- progress reports
- institution policy controls

---

# 8. Business Plan

Purpose:
- SME teams
- sales enablement
- customer communication
- receptionist and training flows

Recommended entitlements:
- business persona library
- org admin and logs
- team quotas
- approved knowledge bindings
- training reports
- role-based access
- limited custom provider control
- CIOS bridge readiness

---

# 9. Enterprise Custom

Purpose:
- large organizations
- custom AI stack
- advanced governance

Recommended entitlements:
- custom providers
- customer-supplied API keys
- advanced org controls
- custom persona packs
- premium support
- advanced analytics
- deeper retention and audit options

---

# 10. Upgrade Logic

Upgrade prompts should be triggered by:
- free limit reached
- premium persona attempted
- long-term memory locked
- avatar premium mode attempted
- business or school feature attempted
- BYO provider attempted on unsupported plan

Hard rule:
- upgrade prompts should be contextual, not spammy

---

# 11. Downgrade Logic

Downgrade handling should preserve:
- core account access
- historical summaries where policy allows
- clear explanation of disabled features

Downgrade should not silently delete valuable user state without policy-approved process.

---

# 12. Workspace-Aware Billing Logic

Personal and family plans attach primarily to account/workspace.
School and business plans attach to workspace, seats, or quotas.
Enterprise plans may include custom commercial rules.

The entitlement engine must work at:
- user level
- profile level
- workspace level
- org level

---

# 13. Pricing Story

Do not market only:
- avatar minutes
- token counts
- technical specs

Prefer value stories:
- daily speaking practice
- trusted teaching
- guided growth
- parent-safe learning
- team training and customer readiness

---

# 14. Plan Object Example

```json
{
  "plan_id": "plan_personal_pro",
  "plan_family": "personal_pro",
  "workspace_types": ["personal"],
  "entitlements": {
    "daily_free_seconds": 0,
    "cycle_seconds": 216000,
    "max_persona_count": 50,
    "premium_personas": true,
    "avatar_enabled": true,
    "memory_retention_class": "long_term",
    "advanced_reports": true,
    "custom_provider_access": false
  }
}
```

---

# 15. DEV Rules

1. Plan logic must stay server-side.
2. Clients should render entitlements from backend, not hardcode them.
3. Family, school, and business plans must have distinct control surfaces.
4. Pricing architecture must remain compatible with provider-router cost classes.
5. Future CIOS bridge should consume workspace and org entitlements without forking this core logic.
