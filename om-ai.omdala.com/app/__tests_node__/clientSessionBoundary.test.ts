import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  getJson as getWebJson,
  patchJson as patchWebJson,
  postJson as postWebJson,
  WEB_SESSION_BRIDGE_ERROR,
} from '../../web/src/api/client';

const appRoot = process.cwd();
const omAiRoot = path.resolve(appRoot, '..');

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return /\.(?:ts|tsx|swift)$/u.test(entry.name) && statSync(entryPath).isFile() ? [entryPath] : [];
  });
}

function readSources(files: string[]): string {
  return files.map((file) => readFileSync(file, 'utf8')).join('\n');
}

test('browser client fails closed before network until a canonical session bridge exists', async () => {
  const client = readFileSync(path.join(omAiRoot, 'web/src/api/client.ts'), 'utf8');
  const reality = readFileSync(path.join(omAiRoot, 'web/src/api/reality.ts'), 'utf8');
  const webSources = readSources(sourceFiles(path.join(omAiRoot, 'web/src')));

  assert.match(client, /canonical_session_bridge_unavailable/u);
  assert.doesNotMatch(webSources, /\bfetch\s*\(/u);
  assert.doesNotMatch(webSources, /x-user-id|x-role/iu);
  assert.doesNotMatch(webSources, /Authorization\s*:/u);
  assert.doesNotMatch(webSources, /(?:access|refresh)[_-]?token/iu);
  assert.doesNotMatch(webSources, /[?&](?:token|access_token|refresh_token)=/iu);
  assert.doesNotMatch(reality, /\brole\s*:|\brequested_by\s*:/u);

  const previousFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('network access must stay disabled');
  };
  try {
    const results = await Promise.all([
      getWebJson('/v2/reality/scenes'),
      postWebJson('/v2/reality/scenes/scene_1/run', {}),
      patchWebJson('/v2/live/memory/profile', {}),
    ]);
    assert.deepEqual(results.map((result) => result.error), [
      WEB_SESSION_BRIDGE_ERROR,
      WEB_SESSION_BRIDGE_ERROR,
      WEB_SESSION_BRIDGE_ERROR,
    ]);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('native clients contain no session material transport and stay fail closed', () => {
  const mobileSources = readFileSync(path.join(appRoot, 'App.tsx'), 'utf8')
    + readSources(sourceFiles(path.join(appRoot, 'src')));
  const iosClient = readFileSync(
    path.join(omAiRoot, 'ios/AIOmApp/Core/Network/APIClient.swift'),
    'utf8',
  );

  assert.doesNotMatch(mobileSources, /x-user-id|x-role/iu);
  assert.doesNotMatch(mobileSources, /Authorization\s*:/u);
  assert.doesNotMatch(mobileSources, /(?:access|refresh)[_-]?token/iu);
  assert.doesNotMatch(mobileSources, /[?&](?:token|access_token|refresh_token)=/iu);
  assert.doesNotMatch(mobileSources, /SecureStore|session_token/iu);
  assert.doesNotMatch(mobileSources, /\/v1\/auth\/refresh/u);
  assert.match(mobileSources, /canonical_session_bridge_unavailable/u);

  assert.match(iosClient, /canonicalSessionBridgeUnavailable/u);
  assert.doesNotMatch(iosClient, /URLSession\.shared\.data/u);
  assert.doesNotMatch(iosClient, /Authorization|x-user-id|x-role/iu);
});

test('legacy mobile session transport modules remain absent', () => {
  const forbidden = [
    'src/api/auth.ts',
    'src/api/authHeaders.ts',
    'src/hooks/useMagicLink.ts',
  ];

  for (const relativePath of forbidden) {
    assert.throws(() => statSync(path.join(appRoot, relativePath)));
  }

  const packageManifest = readFileSync(path.join(appRoot, 'package.json'), 'utf8');
  const expoManifest = readFileSync(path.join(appRoot, 'app.json'), 'utf8');
  assert.doesNotMatch(packageManifest, /expo-secure-store/u);
  assert.doesNotMatch(expoManifest, /expo-secure-store/u);
});
