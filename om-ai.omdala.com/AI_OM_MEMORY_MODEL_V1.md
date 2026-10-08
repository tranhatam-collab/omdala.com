# AI_OM_MEMORY_MODEL_V1.md

Version: 1.0  
Status: Locked memory model  
Parent system: AI Om Live  
Master brand: OMDALA  
Date: April 4, 2026

---

# 1. Purpose

Define what AI Om remembers, what it does not remember, how memory is scoped, and how users, parents, schools, and organizations control it.

Memory is a product layer, not a raw transcript dump.

---

# 2. Memory Principles

- memory must be purposeful
- memory must be scoped
- memory must be editable where meaningful
- memory must respect child-safe and org-safe policies
- memory must support recap, continuity, and personalization
- raw transcripts are not the only memory artifact

---

# 3. Memory Layers

## 3.1 Identity Memory

Stores:
- display name
- timezone
- age band where needed
- workspace role
- preferred languages
- correction preference
- support preference

## 3.2 Learning Memory

Stores:
- level
- completed lessons
- weak vocabulary areas
- grammar weakness patterns
- pronunciation difficulty areas
- lesson streaks
- preferred learning style

## 3.3 Session Memory

Stores:
- recent main topics
- unresolved questions
- last recommendations
- recap snippets
- next action suggestions

## 3.4 Persona Affinity Memory

Stores:
- preferred personas
- disliked styles
- preferred correction intensity
- voice/avatar preference

## 3.5 Emotional Preference Memory

Stores only bounded support preferences such as:
- gentle tone preference
- reflection boundary preference
- pace preference
- companionship style preference

Hard rule:
- this is not clinical diagnosis memory

## 3.6 Subscription and Quota Memory

Stores:
- plan state
- recent upgrade prompts shown
- usage pattern summary
- entitlement flags

---

# 4. Memory Scope Classes

Allowed scopes:
- `per_user_cross_persona`
- `per_user_per_persona`
- `per_profile_per_persona`
- `per_workspace_shared_limited`
- `org_managed`
- `session_only`

Examples:
- child learner progress should usually be `per_profile_per_persona`
- org receptionist configuration may be `org_managed`
- a sensitive reflection session may prefer `session_only`

---

# 5. Memory Retention Classes

Retention classes:
- `ephemeral`
- `short_term`
- `standard`
- `long_term`
- `org_policy_managed`

Retention class decides how long summaries, recaps, and preference artifacts stay available.

---

# 6. Memory Artifacts

The system may store:
- structured preference objects
- recap summaries
- progress state
- topic tags
- correction trend summaries
- provider-neutral analytics summaries

Avoid storing:
- unnecessary raw personal detail
- unrestricted emotional inference histories
- hidden memory the user cannot understand

---

# 7. User Controls

Users must be able to:
- view key memory
- edit key memory
- reset persona memory
- delete session history
- export meaningful summaries where policy allows

Parents or admins may additionally control:
- transcript visibility
- memory retention for child profiles
- persona-specific memory enablement
- org knowledge carryover

---

# 8. Family and Child Rules

For child profiles:
- memory defaults must be conservative
- parent/admin policies can override retention
- custom persona memory may be disabled
- unsafe or non-approved support memory should never persist

---

# 9. Organization Rules

For business and enterprise:
- org-managed personas may use shared operational memory
- personal reflective memory must not leak into org contexts
- org admins may define retention windows and export permissions
- audit hooks must exist when required by org policy

---

# 10. Memory Object Examples

Profile memory:

```json
{
  "profile_id": "profile_student_001",
  "memory_scope": "per_profile_per_persona",
  "language_preferences": {
    "native_language": "vi",
    "target_language": "en",
    "correction_language": "vi"
  },
  "learning_state": {
    "estimated_level": "A2",
    "weak_areas": ["articles", "past_tense"],
    "preferred_correction_style": "end_of_turn"
  }
}
```

Session recap memory:

```json
{
  "session_id": "live_session_001",
  "retention_class": "standard",
  "topics": ["daily routine", "food ordering"],
  "recommendation": "lesson_restaurant_a2_02",
  "correction_trends": ["article usage", "verb tense consistency"]
}
```

---

# 11. DEV Rules

1. Memory writes must be typed and attributable.
2. Raw transcript storage and structured memory storage must be separable.
3. Clients need a clear editable profile-memory surface.
4. Persona memory reset must not break billing or analytics integrity.
5. Family, school, and business scopes must never silently merge.
