import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { validateProfileMemory, validateSessionRecapMemory } from './memory/schema.js';

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`./memory/fixtures/${name}`, import.meta.url), 'utf8'));
}
const codes = (result: { issues: Array<{ code: string }> }) => result.issues.map((issue) => issue.code);

test('spec example fixtures validate', () => {
  assert.deepEqual(validateProfileMemory(fixture('profile.valid.json')), { valid: true, issues: [] });
  assert.deepEqual(validateSessionRecapMemory(fixture('recap.valid.json')), { valid: true, issues: [] });
  assert.equal(validateProfileMemory(fixture('profile.child.valid.json')).valid, true);
});

test('clinical diagnosis fields and unbounded emotional keys are rejected', () => {
  const result = validateProfileMemory(fixture('profile.invalid.clinical.json'));
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes('forbidden_field'));
  assert.ok(codes(result).includes('unbounded_emotional_key'));
});

test('child profiles cannot use org scope, long retention, or custom persona memory', () => {
  const result = validateProfileMemory(fixture('profile.invalid.child-org.json'));
  assert.equal(result.valid, false);
  for (const code of ['child_scope_not_allowed', 'child_retention_too_long', 'child_custom_persona_memory_not_allowed']) {
    assert.ok(codes(result).includes(code), code);
  }
});

test('recap memory rejects raw transcripts, unknown retention, bad topics, and missing attribution', () => {
  const result = validateSessionRecapMemory(fixture('recap.invalid.transcript.json'));
  assert.equal(result.valid, false);
  for (const code of ['forbidden_field', 'invalid_retention_class', 'invalid_value', 'attribution_required']) {
    assert.ok(codes(result).includes(code), code);
  }
});

test('personal reflective memory cannot enter org or shared workspace scopes', () => {
  for (const scope of ['org_managed', 'per_workspace_shared_limited']) {
    const base = fixture('profile.valid.json') as Record<string, unknown>;
    const result = validateProfileMemory({ ...base, memory_scope: scope });
    assert.ok(codes(result).includes('personal_memory_must_not_enter_shared_scope'), scope);
  }
});

test('session_only scope requires ephemeral or short retention', () => {
  const base = fixture('recap.valid.json') as Record<string, unknown>;
  const bad = validateSessionRecapMemory({ ...base, memory_scope: 'session_only', retention_class: 'long_term' });
  assert.ok(codes(bad).includes('session_only_requires_short_retention'));
  const good = validateSessionRecapMemory({ ...base, memory_scope: 'session_only', retention_class: 'ephemeral' });
  assert.equal(good.valid, true);
});

test('non-objects, unknown scopes, bad levels, and unattributed writes fail', () => {
  for (const value of [null, 'x', 7, [], undefined]) {
    assert.equal(validateProfileMemory(value).valid, false);
    assert.equal(validateSessionRecapMemory(value).valid, false);
  }
  const base = fixture('profile.valid.json') as Record<string, unknown>;
  assert.ok(codes(validateProfileMemory({ ...base, memory_scope: 'global' })).includes('invalid_scope'));
  assert.ok(
    codes(validateProfileMemory({ ...base, learning_state: { estimated_level: 'Z9' } })).includes('invalid_level'),
  );
  const { written_by: _omit, ...unattributed } = base;
  assert.ok(codes(validateProfileMemory(unattributed)).includes('attribution_required'));
  assert.ok(
    codes(validateProfileMemory({ ...base, written_by: { actor_type: 'robot', actor_id: 'x' } })).includes('attribution_required'),
  );
});

test('memory schema is not wired into any route or store', () => {
  for (const file of ['routes/live.ts', 'routes/memory.ts', 'live/store.ts', 'app.ts']) {
    const source = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /memory\/schema/, file);
  }
});
