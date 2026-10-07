import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOmdalaApiUrl,
  resolveOmdalaApiOrigin,
} from '../../shared/api-origin-policy';

test('OMDALA API policy accepts only canonical or loopback origins', () => {
  assert.equal(resolveOmdalaApiOrigin('https://api.omdala.com'), 'https://api.omdala.com');
  assert.equal(
    resolveOmdalaApiOrigin('https://api-staging.omdala.com/'),
    'https://api-staging.omdala.com',
  );
  assert.equal(resolveOmdalaApiOrigin('http://127.0.0.1:3010'), 'http://127.0.0.1:3010');
  assert.equal(resolveOmdalaApiOrigin(undefined, { allowSameOrigin: true }), '');
});

test('OMDALA API policy rejects provider, authority, and lookalike origins', () => {
  for (const origin of [
    'https://api.aiagent.iai.one',
    'https://api.openai.com',
    'https://staging-api.omdala.com',
    'https://api.omdala.com.evil.example',
    'https://omdala.com@evil.example',
    'https://api.omdala.com/v1/ai/chat',
    'http://api.omdala.com',
  ]) {
    assert.throws(() => resolveOmdalaApiOrigin(origin), /OMDALA_API_ORIGIN/);
  }
});

test('OMDALA API URL construction cannot change destination', () => {
  assert.equal(
    buildOmdalaApiUrl('/v1/ai/chat', 'https://api.omdala.com'),
    'https://api.omdala.com/v1/ai/chat',
  );
  assert.equal(buildOmdalaApiUrl('/ready', ''), '/ready');

  for (const path of [
    'https://api.openai.com/v1/chat',
    '//api.openai.com/v1/chat',
    '/\\api.openai.com/v1/chat',
    '/v1/ai/chat\r\nX-Injected: value',
  ]) {
    assert.throws(
      () => buildOmdalaApiUrl(path, 'https://api.omdala.com'),
      /OMDALA_API_PATH_INVALID|OMDALA_API_DESTINATION_CHANGED/,
    );
  }
});
