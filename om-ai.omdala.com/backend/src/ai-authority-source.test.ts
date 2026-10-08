import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const OM_AI_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE_ROOTS = ['backend/src', 'gateway/src', 'web/src', 'app/src', 'ios', 'shared'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.swift', '.kt', '.java']);
const POLICY_ROOTS = ['scripts', '.github'];
const POLICY_EXTENSIONS = new Set(['.sh', '.yml', '.yaml']);
const POLICY_CONFIG_FILES = [
  '.env.example',
  'backend/.env.example',
  'gateway/.env.example',
  'web/.env.example',
  'app/app.json',
  'wrangler.toml',
  'docker-compose.yml',
];

const forbiddenProviderTerms = [
  ['open', 'ai'].join(''),
  ['anthro', 'pic'].join(''),
  ['gem', 'ini'].join(''),
  ['ta', 'vus'].join(''),
  ['hey', 'gen'].join(''),
  ['deep', 'seek'].join(''),
  ['cere', 'bras'].join(''),
  ['open', 'router'].join(''),
  ['gr', 'oq'].join(''),
  ['mis', 'tral'].join(''),
  ['co', 'here'].join(''),
  ['hugging', 'face'].join(''),
  ['bed', 'rock'].join(''),
  ['vertex', 'ai'].join(''),
  ['perplex', 'ity'].join(''),
];

const forbiddenCredentialNames = [
  ['AIAGENT', 'API', 'KEY'].join('_'),
  ['OPENAI', 'API', 'KEY'].join('_'),
  ['ANTHROPIC', 'API', 'KEY'].join('_'),
  ['GEMINI', 'API', 'KEY'].join('_'),
  ['TAVUS', 'API', 'KEY'].join('_'),
  ['HEYGEN', 'API', 'KEY'].join('_'),
  ['GROQ', 'API', 'KEY'].join('_'),
  ['MISTRAL', 'API', 'KEY'].join('_'),
  ['COHERE', 'API', 'KEY'].join('_'),
];

const forbiddenAuthorityOrigin = ['api', 'aiagent', 'iai', 'one'].join('.');
const allowedRemoteHosts = new Set(['api.omdala.com', 'api-staging.omdala.com']);
const allowedLoopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

async function filesUnder(root: string, extensions: ReadonlySet<string>): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage') continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesUnder(path, extensions)));
      continue;
    }
    if (!extensions.has(extname(entry.name))) continue;
    if (entry.name.includes('.test.') || path.includes('/__tests__/')) continue;
    files.push(path);
  }
  return files;
}

test('OM-AI production source contains no direct AI provider, credential, endpoint, or egress', async () => {
  const runtimeFiles = (
    await Promise.all(SOURCE_ROOTS.map((root) => filesUnder(join(OM_AI_ROOT, root), SOURCE_EXTENSIONS)))
  ).flat();
  const policyFiles = [
    ...runtimeFiles,
    ...(
      await Promise.all(POLICY_ROOTS.map((root) => filesUnder(join(OM_AI_ROOT, root), POLICY_EXTENSIONS)))
    ).flat(),
    ...POLICY_CONFIG_FILES.map((file) => join(OM_AI_ROOT, file)),
  ];
  assert.ok(runtimeFiles.length > 0);

  for (const file of policyFiles) {
    const content = await readFile(file, 'utf8');
    const lower = content.toLowerCase();
    const label = relative(OM_AI_ROOT, file);

    for (const provider of forbiddenProviderTerms) {
      assert.equal(lower.includes(provider), false, label + ' names direct AI provider ' + provider);
    }
    for (const credential of forbiddenCredentialNames) {
      assert.equal(content.includes(credential), false, label + ' reads direct AI credential ' + credential);
    }
    assert.equal(
      lower.includes(forbiddenAuthorityOrigin),
      false,
      label + ' bypasses the OMDALA API and targets AIAGENT directly',
    );

  }

  for (const file of runtimeFiles) {
    const content = await readFile(file, 'utf8');
    const label = relative(OM_AI_ROOT, file);
    for (const match of content.matchAll(/(?:https?|wss?):\/\/[^\s'"\x60)>]+/gu)) {
      const url = new URL(match[0]);
      const allowedRemote = url.protocol === 'https:' && allowedRemoteHosts.has(url.hostname);
      const allowedLoopback =
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        allowedLoopbackHosts.has(url.hostname);
      const allowed = allowedRemote || allowedLoopback;
      assert.equal(allowed, true, label + ' contains unapproved runtime origin ' + url.origin);
    }
  }
});
