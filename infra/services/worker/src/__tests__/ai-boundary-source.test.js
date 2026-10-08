import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const productionFiles = [
  new URL('../jobs/ai-task.js', import.meta.url),
  new URL('../jobs/code-review.js', import.meta.url),
  new URL('../lib/aiagent.js', import.meta.url),
  new URL('../lib/health.js', import.meta.url),
  new URL('../index.js', import.meta.url),
];

test('production worker source has one AI authority and no direct-provider route', async () => {
  const source = (await Promise.all(productionFiles.map((file) => readFile(file, 'utf8')))).join('\n');
  const banned = [
    `api.${'open'}${'ai'}.com`,
    `api.${'anthro'}${'pic'}.com`,
    `api.${'gro'}${'q'}.com`,
    `${'generative'}${'language'}.googleapis.com`,
    `${'deep'}${'seek'}.com`,
    `localhost:${'114'}${'34'}`,
    `${'AI'}_${'API'}_${'URL'}`,
    `/${'chat'}/${'completions'}`,
  ];
  for (const marker of banned) {
    assert.equal(source.includes(marker), false, `forbidden provider marker: ${marker}`);
  }
  assert.match(source, /https:\/\/staging-api\.aiagent\.iai\.one/);
  assert.match(source, /https:\/\/api\.aiagent\.iai\.one/);
  assert.match(source, /\/v1\/ai\/chat/);
  assert.match(source, /\/v1\/ai\/verify/);
  assert.match(source, /\/v1\/runs\//);
  assert.match(source, /Ed25519/);
  assert.match(source, /AIAGENT_CONTRACT_VERSION = '1\.0\.0'/);
  assert.match(source, /AIAGENT_TENANT_ID = 'omdala-com'/);
  assert.match(source, /WITH updated AS/);
  assert.match(source, /health\.status === 'ok' \? 200 : 503/);
});

test('health implementation has no network invocation', async () => {
  const source = await readFile(new URL('../lib/health.js', import.meta.url), 'utf8');
  assert.equal(source.includes(`${'fet'}${'ch'}(`), false);
  assert.match(source, /configuration-only-no-model-call/);
});
