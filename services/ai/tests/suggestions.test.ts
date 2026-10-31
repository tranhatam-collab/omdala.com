import assert from 'node:assert/strict';
import test from 'node:test';
import { getAiActionSuggestions } from '../src/index.ts';

// The package only imports types, so these tests run with the Node type stripper and need no install.
const node = (proofCount: number) => ({ name: 'Node A', proofCount }) as never;
const resources = [{ title: 'Resource One' }] as never;

test('returns the three planner, operator, and analyst suggestions in a stable contract shape', () => {
  const result = getAiActionSuggestions(node(5), resources);
  assert.equal(result.length, 3);
  assert.deepEqual(result.map((s) => s.mode).sort(), ['analyst', 'operator', 'planner']);
  for (const s of result) {
    assert.ok(s.id && s.title && s.summary && s.rationale);
    assert.match(s.nextAction, /^\//);
    assert.ok(['high', 'medium', 'low'].includes(s.priority));
    assert.ok((s.confidence ?? 0) > 0 && (s.confidence ?? 0) <= 1);
  }
  assert.equal(new Set(result.map((s) => s.id)).size, 3);
});

test('sorts by priority, then by confidence', () => {
  const rank = { high: 3, medium: 2, low: 1 } as const;
  for (const proofs of [0, 2, 3, 10]) {
    const result = getAiActionSuggestions(node(proofs), resources);
    for (let i = 1; i < result.length; i += 1) {
      const prev = result[i - 1]!;
      const cur = result[i]!;
      const priorityDiff = rank[prev.priority] - rank[cur.priority];
      assert.ok(priorityDiff > 0 || (priorityDiff === 0 && (prev.confidence ?? 0) >= (cur.confidence ?? 0)));
    }
  }
});

test('operator proof suggestion is high priority only while the node has fewer than 3 proofs', () => {
  const low = getAiActionSuggestions(node(2), resources).find((s) => s.id === 'ai-operator-proof');
  const enough = getAiActionSuggestions(node(3), resources).find((s) => s.id === 'ai-operator-proof');
  assert.equal(low?.priority, 'high');
  assert.equal(low?.confidence, 0.88);
  assert.equal(enough?.priority, 'medium');
  assert.equal(enough?.confidence, 0.74);
});

test('planner summary names the first resource, or falls back when there are none', () => {
  const withResource = getAiActionSuggestions(node(1), resources).find((s) => s.id === 'ai-plan-activation');
  const without = getAiActionSuggestions(node(1), []).find((s) => s.id === 'ai-plan-activation');
  assert.match(withResource?.summary ?? '', /Resource One/);
  assert.match(withResource?.summary ?? '', /Node A/);
  assert.doesNotMatch(without?.summary ?? '', /Resource One/);
  assert.match(without?.summary ?? '', /Node A/);
});

test('suggestions are local and deterministic: no network or provider reference in the source', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /fetch\(|https?:\/\/|process\.env|api[_-]?key/i);
  const a = JSON.stringify(getAiActionSuggestions(node(1), resources));
  const b = JSON.stringify(getAiActionSuggestions(node(1), resources));
  assert.equal(a, b);
});
