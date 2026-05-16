# AI_OM_PERSONA_SCHEMA_V1.md

Version: 1.0  
Status: Locked schema v1  
Parent system: AI Om Live  
Master brand: OMDALA  
Date: April 4, 2026

---

# 1. Purpose

Define the structured schema for all AI humans, teachers, companions, coaches, experts, and organization agents in AI Om.

A persona is not just a prompt. A persona is a governed product object with identity, capabilities, safety, memory scope, curriculum bindings, and provider compatibility.

---

# 2. Persona Categories

Core categories:
- `teacher`
- `language_partner`
- `lecturer`
- `listener`
- `coach`
- `companion`

Extended categories:
- `homework_helper`
- `story_teller`
- `receptionist`
- `customer_support_trainer`
- `sales_coach`
- `investment_explainer`
- `internal_trainer`
- `expert_agent`

---

# 3. Required Fields

Every persona must have:
- `persona_id`
- `display_name`
- `role_type`
- `category`
- `summary`
- `primary_languages`
- `supported_session_types`
- `safety_profile_id`
- `memory_scope`
- `provider_compatibility`
- `plan_availability`
- `supports_voice_only`
- `supports_avatar`
- `safe_for_children`
- `created_by_type`

---

# 4. Core Schema

```json
{
  "persona_id": "teacher_english_01",
  "display_name": "Emily",
  "role_type": "teacher",
  "category": "english_teacher",
  "summary": "Patient daily English teacher for beginners to intermediate learners.",
  "primary_languages": ["en", "vi"],
  "target_audiences": ["adult_learners", "students"],
  "supported_session_types": ["language_call", "lesson_call"],
  "teaching_style": "patient_structured_conversational",
  "correction_style": "gentle_inline",
  "tone_profile": "warm_professional",
  "avatar_profile_id": "avatar_professional_friendly_01",
  "voice_profile_id": "voice_warm_female_en_01",
  "safety_profile_id": "education_safe_default",
  "memory_scope": "per_user_long_term",
  "curriculum_bindings": ["english_a1_a2_core"],
  "provider_compatibility": {
    "conversation": ["openai_realtime"],
    "avatar": ["tavus", "heygen", "voice_only"]
  },
  "plan_availability": ["free", "personal_pro", "education_plus"],
  "supports_voice_only": true,
  "supports_avatar": true,
  "safe_for_children": true,
  "created_by_type": "system"
}
```

---

# 5. Behavior Fields

Behavior controls:
- `teaching_style`
- `correction_style`
- `strictness_level`
- `humor_level`
- `pace`
- `initiative_level`
- `reflection_depth`
- `response_length_preference`
- `conversation_energy`

These fields shape runtime instructions but remain stored as structured values, not free-form text only.

---

# 6. Safety Fields

Safety fields:
- `safety_profile_id`
- `safe_for_children`
- `regulated_topic_blocklist`
- `escalation_mode`
- `allows_custom_kb`
- `requires_parent_or_admin_approval`
- `impersonation_risk_level`

Hard rule:
- no persona can bypass platform safety profiles

---

# 7. Curriculum Fields

Curriculum-related fields:
- `curriculum_bindings`
- `default_level_range`
- `lesson_modes_supported`
- `assessment_modes_supported`
- `supports_homework_mode`
- `supports_progress_reports`

---

# 8. Memory Fields

Memory-related fields:
- `memory_scope`
- `memory_retention_class`
- `stores_emotional_preferences`
- `stores_learning_progress`
- `stores_org_context`
- `user_editable_memory_fields`

---

# 9. Creator Types

Allowed `created_by_type` values:
- `system`
- `user_simple_builder`
- `user_advanced_builder`
- `org_admin_builder`
- `enterprise_managed`

User-created personas must still validate against the same schema and policy checks as system personas.

---

# 10. Persona Builder Tiers

## 10.1 Simple Builder

Editable fields:
- display name
- role type from allowlist
- languages
- tone
- avatar preset
- voice preset
- safety mode within plan limits

## 10.2 Advanced Builder

Adds:
- correction style
- strictness
- humor level
- knowledge upload
- lesson style
- memory preferences within policy

## 10.3 Organization Builder

Adds:
- brand voice
- internal documents
- org-safe policy binding
- approval workflow status
- provider binding policy

---

# 11. Validation Rules

1. `persona_id` must be globally unique.
2. `role_type` and `category` must match approved taxonomy.
3. Child-safe personas cannot bind to unsafe safety profiles.
4. Org personas cannot use non-approved providers.
5. Custom personas cannot declare regulated authority they do not have.
6. Image and avatar fields must satisfy consent and licensing policy.

---

# 12. Runtime Packaging

At runtime, a persona package should combine:
- schema object
- policy object
- instruction template
- curriculum links
- provider compatibility
- moderation bindings

The app should never treat a raw prompt string as the complete persona object.
