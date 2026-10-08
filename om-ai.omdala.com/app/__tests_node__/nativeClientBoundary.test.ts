import assert from 'node:assert/strict';
import test from 'node:test';
import { getJson, NATIVE_SESSION_BRIDGE_ERROR, postJson } from '../src/api/client';

test('native API client refuses GET and POST before network access', async () => {
  const previousFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('network access must stay disabled');
  };

  try {
    const getResult = await getJson('/v2/reality/scenes');
    const postResult = await postJson('/v2/reality/scenes/scene_1/run', {});

    assert.equal(getResult.error, NATIVE_SESSION_BRIDGE_ERROR);
    assert.equal(postResult.error, NATIVE_SESSION_BRIDGE_ERROR);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
