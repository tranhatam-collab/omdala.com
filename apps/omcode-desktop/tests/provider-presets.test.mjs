import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiagentConnectionForm } from '../src/provider-presets.mjs';
import { saveProvider } from '../server/providers.mjs';

for (const [environment, id, baseUrl] of [
  ['production', 'aiagent', 'https://api.aiagent.iai.one'],
  ['staging', 'aiagent-staging', 'https://staging-api.aiagent.iai.one'],
]) {
  test(`AIAGENT ${environment} form matches its dedicated credential account`, () => {
    const form = aiagentConnectionForm([], environment);
    assert.equal(form.id, id); assert.equal(form.baseUrl, baseUrl); assert.equal(form.kind, 'iai-one');
    assert.equal(form.tenantId, ''); assert.equal(form.workspaceId, ''); assert.equal(form.apiKey, '');
  });
  test(`AIAGENT ${environment} form preserves only its own non-secret connection metadata`, () => {
    const other = { id: id === 'aiagent' ? 'aiagent-staging' : 'aiagent', baseUrl: 'https://wrong.invalid', tenantId: 'wrong' };
    const current = { id, baseUrl, tenantId: 'tenant', workspaceId: 'workspace', model: 'fixture-model', apiKey: 'do-not-copy' };
    const form = aiagentConnectionForm([other, current], environment);
    assert.equal(form.tenantId, 'tenant'); assert.equal(form.workspaceId, 'workspace'); assert.equal(form.model, 'fixture-model');
    assert.equal(form.apiKey, ''); assert.equal(JSON.stringify(form).includes('do-not-copy'), false);
    assert.equal(aiagentConnectionForm([{ ...current, baseUrl: 'https://wrong.invalid' }], environment).tenantId, '');
  });
  test(`AIAGENT ${environment} backend rejects destination/scope confusion before persistence or Keychain`, async () => {
    const data = new Map();
    let writes = 0;
    const store = { get: (key, fallback) => data.get(key) ?? fallback, set: (key, value) => { writes++; data.set(key, value); } };
    const valid = { id, baseUrl, kind: 'iai-one', tenantId: 'aiagent', workspaceId: 'omcode-test' };
    for (const change of [{ baseUrl: 'https://not-aiagent.invalid' },
      { baseUrl: id === 'aiagent' ? 'https://staging-api.aiagent.iai.one' : 'https://api.aiagent.iai.one' },
      { kind: 'openai' }, { tenantId: '' }, { workspaceId: '' }, { workspaceId: '../other' }]) {
      await assert.rejects(saveProvider(store, { ...valid, ...change, apiKey: 'must-not-reach-keychain' }), /AIAGENT/);
      assert.equal(writes, 0);
    }
    const saved = await saveProvider(store, valid);
    assert.equal(saved.id, id); assert.equal(saved.baseUrl, baseUrl);
    assert.equal(writes, 1);
  });
}
test('unknown environment cannot silently fall back to production', () => {
  assert.throws(() => aiagentConnectionForm([], 'preview'), /Unknown AIAGENT environment/);
});
