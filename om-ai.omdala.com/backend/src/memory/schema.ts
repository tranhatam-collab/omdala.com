// MEM-04: memory record shapes and validation from AI_OM_MEMORY_MODEL_V1.md.
// Pure functions only. Nothing here is registered on a route or reads storage.

export const MEMORY_SCOPES = [
  'per_user_cross_persona',
  'per_user_per_persona',
  'per_profile_per_persona',
  'per_workspace_shared_limited',
  'org_managed',
  'session_only',
] as const;

export const RETENTION_CLASSES = ['ephemeral', 'short_term', 'standard', 'long_term', 'org_policy_managed'] as const;
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export const CORRECTION_STYLES = ['none', 'gentle', 'inline', 'post_turn', 'end_of_session', 'end_of_turn'] as const;
export const EMOTIONAL_PREFERENCE_KEYS = [
  'gentle_tone',
  'reflection_boundary',
  'pace',
  'companionship_style',
] as const;

export type MemoryScope = (typeof MEMORY_SCOPES)[number];
export type RetentionClass = (typeof RETENTION_CLASSES)[number];

export type MemoryIssue = { path: string; code: string };
export type MemoryValidation = { valid: boolean; issues: MemoryIssue[] };

type Json = Record<string, unknown>;

const FORBIDDEN_FIELDS = ['raw_transcript', 'transcript', 'audio', 'diagnosis', 'clinical_notes'];
const ACTOR_TYPES = ['user', 'guardian', 'org_admin', 'system'];

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown, max = 200): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function isStringArray(value: unknown, maxItems = 50): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => isString(item));
}

function oneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

function checkCommon(record: Json, issues: MemoryIssue[]) {
  for (const field of FORBIDDEN_FIELDS) {
    if (field in record) issues.push({ path: field, code: 'forbidden_field' });
  }

  const author = record.written_by;
  if (!isObject(author) || !oneOf(ACTOR_TYPES, author.actor_type) || !isString(author.actor_id)) {
    issues.push({ path: 'written_by', code: 'attribution_required' });
  }

  if (record.memory_scope !== undefined && !oneOf(MEMORY_SCOPES, record.memory_scope)) {
    issues.push({ path: 'memory_scope', code: 'invalid_scope' });
  }
  if (record.retention_class !== undefined && !oneOf(RETENTION_CLASSES, record.retention_class)) {
    issues.push({ path: 'retention_class', code: 'invalid_retention_class' });
  }

  if (record.memory_scope === 'session_only' && !['ephemeral', 'short_term'].includes(String(record.retention_class))) {
    issues.push({ path: 'retention_class', code: 'session_only_requires_short_retention' });
  }
}

function checkAudienceRules(record: Json, issues: MemoryIssue[]) {
  if (record.audience !== 'child') return;
  if (record.memory_scope === 'org_managed' || record.memory_scope === 'per_workspace_shared_limited') {
    issues.push({ path: 'memory_scope', code: 'child_scope_not_allowed' });
  }
  if (record.retention_class === 'long_term') {
    issues.push({ path: 'retention_class', code: 'child_retention_too_long' });
  }
  if (record.custom_persona_memory === true) {
    issues.push({ path: 'custom_persona_memory', code: 'child_custom_persona_memory_not_allowed' });
  }
}

function checkEmotionalPreferences(record: Json, issues: MemoryIssue[]) {
  const prefs = record.emotional_preferences;
  if (prefs === undefined) return;
  if (record.memory_scope === 'org_managed' || record.memory_scope === 'per_workspace_shared_limited') {
    issues.push({ path: 'emotional_preferences', code: 'personal_memory_must_not_enter_shared_scope' });
  }
  if (!isObject(prefs)) {
    issues.push({ path: 'emotional_preferences', code: 'invalid_type' });
    return;
  }
  for (const [key, value] of Object.entries(prefs)) {
    if (!oneOf(EMOTIONAL_PREFERENCE_KEYS, key)) {
      issues.push({ path: `emotional_preferences.${key}`, code: 'unbounded_emotional_key' });
    } else if (typeof value !== 'string' && typeof value !== 'boolean') {
      issues.push({ path: `emotional_preferences.${key}`, code: 'invalid_type' });
    }
  }
}

/** Profile memory (spec section 10, first example). */
export function validateProfileMemory(input: unknown): MemoryValidation {
  const issues: MemoryIssue[] = [];
  if (!isObject(input)) return { valid: false, issues: [{ path: '', code: 'invalid_type' }] };

  if (!isString(input.profile_id, 120)) issues.push({ path: 'profile_id', code: 'required' });
  if (!oneOf(MEMORY_SCOPES, input.memory_scope)) issues.push({ path: 'memory_scope', code: 'invalid_scope' });

  const languages = input.language_preferences;
  if (!isObject(languages)) {
    issues.push({ path: 'language_preferences', code: 'required' });
  } else {
    for (const key of ['native_language', 'target_language', 'correction_language']) {
      if (languages[key] !== undefined && !isString(languages[key], 35)) {
        issues.push({ path: `language_preferences.${key}`, code: 'invalid_value' });
      }
    }
  }

  const learning = input.learning_state;
  if (!isObject(learning)) {
    issues.push({ path: 'learning_state', code: 'required' });
  } else {
    if (learning.estimated_level !== undefined && !oneOf(CEFR_LEVELS, learning.estimated_level)) {
      issues.push({ path: 'learning_state.estimated_level', code: 'invalid_level' });
    }
    if (learning.weak_areas !== undefined && !isStringArray(learning.weak_areas)) {
      issues.push({ path: 'learning_state.weak_areas', code: 'invalid_value' });
    }
    if (learning.preferred_correction_style !== undefined && !oneOf(CORRECTION_STYLES, learning.preferred_correction_style)) {
      issues.push({ path: 'learning_state.preferred_correction_style', code: 'invalid_value' });
    }
  }

  checkCommon(input, issues);
  checkAudienceRules(input, issues);
  checkEmotionalPreferences(input, issues);
  return { valid: issues.length === 0, issues };
}

/** Session recap memory (spec section 10, second example). */
export function validateSessionRecapMemory(input: unknown): MemoryValidation {
  const issues: MemoryIssue[] = [];
  if (!isObject(input)) return { valid: false, issues: [{ path: '', code: 'invalid_type' }] };

  if (!isString(input.session_id, 160)) issues.push({ path: 'session_id', code: 'required' });
  if (!oneOf(RETENTION_CLASSES, input.retention_class)) {
    issues.push({ path: 'retention_class', code: 'invalid_retention_class' });
  }
  if (!isStringArray(input.topics)) issues.push({ path: 'topics', code: 'invalid_value' });
  if (input.recommendation !== undefined && !isString(input.recommendation)) {
    issues.push({ path: 'recommendation', code: 'invalid_value' });
  }
  if (input.correction_trends !== undefined && !isStringArray(input.correction_trends)) {
    issues.push({ path: 'correction_trends', code: 'invalid_value' });
  }

  checkCommon(input, issues);
  checkAudienceRules(input, issues);
  return { valid: issues.length === 0, issues };
}
