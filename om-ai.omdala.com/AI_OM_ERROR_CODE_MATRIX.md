# Om AI Error Code Matrix

Version: 1.1
Status: Normalized for DEV handoff
Canonical product name: Om AI
Date: April 10, 2026
Owner: Team Om AI

## Boundary Normalization

This matrix now prioritizes live session, account, memory, moderation, and subscription flows.

Legacy device / gateway execution errors should be treated as bridge-only unless they are explicitly required by a shared integration path.

## 1. Purpose

Define the canonical error set for Om AI.

## 2. Error Codes

| Code | Meaning |
|---|---|
| `unauthorized` | Authentication failed |
| `forbidden` | Permission denied |
| `policy_denied` | Policy rejected action |
| `plan_limit_reached` | Plan or free-minute quota reached |
| `session_not_found` | Live session was not found |
| `session_connect_failed` | Live session could not connect |
| `provider_unavailable` | AI or avatar provider unavailable |
| `provider_fallback_applied` | Fallback provider or voice-only mode was applied |
| `memory_write_failed` | Memory update failed |
| `moderation_required` | Safety routing or escalation required |
| `subscription_required` | Requested feature requires a paid plan |
| `timeout` | Operation timed out |

Codes returned by the current `/v2/live` backend (added 2026-10-30, WO-TAI-11):

| Code | HTTP | Meaning |
|---|---|---|
| `validation_error` | 400 | Missing or malformed input |
| `persona_not_found` | 404 | Persona does not exist |
| `session_not_found` | 404 | Session does not exist or belongs to another user |
| `ai_authority_unavailable` | 503 | Realtime path is blocked until the OMDALA AI authority publishes its contract |
| `omdala_identity_authority_unavailable` | 503 | Direct access is disabled until the canonical session bridge exists |
| `plan_upgrade_required` | 403 | Feature (for example avatar) not in the current plan |
| `PLAN_CHANGE_REQUIRES_BILLING` | 403 | Plan changes are handled by the billing authority |
| `persona_not_child_safe` | 403 | Child profile cannot use this persona |
| `content_requires_escalation` | 422 | Text flagged by the keyword screen; needs a wellness-safe path |

## 3. Error Rules

- every error must be typed
- every denied action must include a reason
- plan and policy errors must be user-comprehensible
- fallback behavior must be observable when a provider path degrades
- moderation and escalation paths must never fail silently
