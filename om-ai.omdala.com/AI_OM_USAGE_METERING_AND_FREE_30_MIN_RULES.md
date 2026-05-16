# AI_OM_USAGE_METERING_AND_FREE_30_MIN_RULES.md

Version: 1.0  
Status: Locked metering rules  
Parent system: AI Om Live  
Master brand: OMDALA  
Date: April 4, 2026

---

# 1. Purpose

Define how AI Om measures usage, enforces the daily free allowance, and records billable activity across voice-only and avatar-enabled live sessions.

---

# 2. Core Rule

Every eligible free user receives:
- 30 minutes free per calendar day

This equals:
- `1800` free seconds per day

Metering must happen server-side.

---

# 3. Metering Principles

- client UI is advisory only
- server is source of truth
- billable time is tied to session lifecycle
- route profile and avatar mode must be recorded
- free, paid, bonus, and org-sponsored usage must be distinguishable

---

# 4. Minimum Metering Record

```json
{
  "session_id": "live_session_001",
  "user_id": "user_001",
  "workspace_id": "ws_personal_001",
  "profile_id": "profile_adult_001",
  "persona_id": "teacher_english_01",
  "session_type": "language_call",
  "route_id": "route_live_free_voice_001",
  "avatar_mode": "voice_only",
  "started_at": "2026-04-04T10:00:00Z",
  "ended_at": "2026-04-04T10:22:00Z",
  "billable_seconds": 1320,
  "free_seconds_applied": 1320,
  "paid_seconds_applied": 0,
  "bonus_seconds_applied": 0,
  "metering_status": "finalized"
}
```

---

# 5. Daily Reset Rule

Reset window should use:
- user primary timezone for personal/family plans
- workspace billing timezone for school/business/enterprise plans

Hard rule:
- timezone policy must be explicit and persisted on account/workspace

---

# 6. Warning Thresholds

The platform should provide warning events at:
- 5 minutes remaining
- 1 minute remaining

Limit behavior:
- do not cut mid-sentence where avoidable
- move into soft landing mode
- present upgrade or continue options where allowed

---

# 7. Metering States

Metering states:
- `created`
- `running`
- `warning_5_min`
- `warning_1_min`
- `wrapping_up`
- `finalized`
- `adjusted`
- `voided`

---

# 8. Free vs Paid Allocation

Allocation order should be:
1. daily free seconds
2. bonus seconds
3. included paid-plan pool
4. overage or block rule depending on plan

For free plan:
- end gracefully when free pool is exhausted
- do not continue unlimited usage by client-side loopholes

---

# 9. Bonus Minutes

Supported bonus types:
- referral bonus
- streak bonus
- school invite bonus
- campaign bonus
- support-issued goodwill bonus

Each bonus allocation should have:
- source type
- quantity
- expiry date where applicable
- workspace scope

---

# 10. Cost Classes

Metering must track cost-relevant class:
- `voice_only_low_cost`
- `voice_only_standard`
- `realtime_avatar_standard`
- `realtime_avatar_premium`
- `org_controlled_realtime`

This allows billing, reporting, and provider reconciliation without exposing raw vendor complexity to every client surface.

---

# 11. Anti-Abuse Rules

The service should detect and flag:
- parallel session abuse beyond plan rules
- repeated reconnect inflation
- token bootstrap loops without session completion
- suspicious BYO provider bypass attempts
- unauthorized child account overuse

---

# 12. Reporting Views

The backend should support:
- usage today
- usage current cycle
- historical daily usage
- per-persona usage
- per-profile usage
- per-workspace usage
- provider spend and fallback rate

---

# 13. DEV Rules

1. No free-minute enforcement on device only.
2. Realtime session start and end must both reconcile into metering.
3. Reconnect logic must not double-bill ordinary recovery windows.
4. Avatar upgrade cost and voice-only fallback must be reflected in metering route data.
5. Family, school, and business reports must all derive from the same canonical usage ledger.
