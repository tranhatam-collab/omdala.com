# AI_OM_PROVIDER_ROUTER_ARCHITECTURE_2026.md

Version: 1.0  
Status: Locked core architecture  
Parent system: AI Om Live  
Master brand: OMDALA  
Date: April 4, 2026

---

# 1. Purpose

Define the provider router that lets AI Om choose the right AI runtime, avatar runtime, and fallback path by plan, cost, safety, workspace policy, and latency.

The router exists so the product does not hard-lock to one provider, one model family, or one cost structure.

---

# 2. Router Goals

The router must support:
- default provider per workspace
- fallback provider chains
- cost-aware routing
- low-latency routing
- premium routing
- persona-specific provider policies
- child-safe provider restrictions
- business and enterprise provider approval
- customer-supplied API keys where allowed
- avatar on/off routing
- graceful degradation to voice-only

---

# 3. Routing Layers

## 3.1 Conversation Provider Layer

Handles live speech/text inference.

Examples:
- OpenAI Realtime
- future approved provider
- customer-supplied provider through BYO API path

## 3.2 Avatar Provider Layer

Handles visual human layer.

Examples:
- Tavus
- HeyGen
- future adapter
- still portrait fallback
- disabled avatar path

## 3.3 Speech Utility Layer

Handles non-realtime support where needed.

Examples:
- transcription fallback
- recap synthesis
- pronunciation scoring helper

---

# 4. Decision Inputs

The router must evaluate:
- `workspace_type`
- `plan_id`
- `profile_type`
- `persona_id`
- `session_type`
- `language_mode`
- `avatar_requested`
- `supports_voice_only`
- `safe_for_children`
- `org_policy`
- `provider_health`
- `provider_cost_class`
- `latency_region`
- `customer_api_key_presence`
- `quota_state`
- `moderation_risk_state`

---

# 5. Decision Outputs

The router returns:
- selected conversation provider
- selected model family or route profile
- selected avatar provider or no-avatar decision
- fallback chain
- cost class
- safety profile binding
- client bootstrap shape
- degradation policy

Example output:

```json
{
  "conversation_provider": "openai_realtime",
  "conversation_profile": "realtime_standard",
  "avatar_provider": "tavus",
  "avatar_mode": "realtime_avatar",
  "fallback_chain": [
    "openai_realtime_voice_only",
    "standard_tts_voice_only"
  ],
  "cost_class": "pro_realtime_avatar",
  "degradation_policy": "preserve_call_with_voice_only"
}
```

---

# 6. Routing Policies

## 6.1 Free Plan Policy

Default:
- cheapest approved realtime path
- avatar optional and cost-gated
- voice-only fallback first
- aggressive provider cost protection

## 6.2 Personal Pro Policy

Default:
- higher quality realtime profile
- premium voices allowed
- avatar allowed based on quota and provider health
- richer recap and memory retention

## 6.3 Family Policy

Default:
- child-safe providers only for child profiles
- child-safe persona allowlist
- stronger moderation thresholds
- avatar may be disabled by guardian policy

## 6.4 School Policy

Default:
- education-safe providers
- lesson-mode optimized routing
- organization reporting enabled
- budget controls per class or institution

## 6.5 Business / Enterprise Policy

Default:
- approved provider list only
- logs and audit hooks enabled
- org knowledge binding compatibility required
- BYO API allowed only by policy

---

# 7. Fallback Strategy

Fallback order should prefer continuity over perfection.

Recommended degradation chain:
1. same provider with reduced profile
2. same conversation provider without avatar
3. alternate approved realtime provider
4. voice-only assisted path
5. fail gracefully before unsafe or uncontrolled path

Hard rule:
- do not hard fail the session if avatar fails but voice path is still healthy

---

# 8. Safety Gates

The router must deny or rewrite routes when:
- the profile is a child and provider is not child-safe approved
- the persona safety profile requires stricter moderation than provider path supports
- org policy forbids the provider
- customer API key route bypasses required logs in a regulated workspace
- cost ceiling is exceeded and no approved lower-cost path remains

---

# 9. BYO API Rules

BYO provider paths are allowed only when:
- plan supports it
- workspace policy allows it
- health check passes
- audit expectations are met
- moderation and data handling requirements are satisfied

If not, router falls back to system-managed provider stack.

---

# 10. Cost Classes

Suggested routing classes:
- `free_voice_low_cost`
- `free_voice_plus`
- `pro_realtime_standard`
- `pro_realtime_avatar`
- `edu_structured_realtime`
- `enterprise_controlled_realtime`

The cost class is a policy abstraction. It must not leak internal vendor details to clients unless required.

---

# 11. Health Model

Each provider route should expose:
- availability
- median latency
- error rate
- auth validity
- region fit
- current cost multiplier
- incident flag

The router should cache health snapshots but allow rapid invalidation.

---

# 12. Router Data Model

```json
{
  "route_id": "route_live_free_voice_001",
  "workspace_policy": "family_safe_default",
  "conversation_provider": "openai_realtime",
  "conversation_profile": "mini_voice_first",
  "avatar_provider": null,
  "supports_customer_key": false,
  "allowed_workspace_types": ["personal", "family"],
  "safe_for_children": true,
  "cost_class": "free_voice_low_cost",
  "fallback_chain": ["openai_realtime_voice_only"]
}
```

---

# 13. DEV Rules

1. Never hardcode one provider into session bootstrap.
2. Provider names must remain adapters, not business logic containers.
3. Metering and billing must key off route decisions from backend.
4. Router output must be persisted on the session for later reconciliation.
5. Avatar failure must not destroy usable voice sessions.
6. Future CIOS bridge should consume policy and audit outputs, not bypass router decisions.
