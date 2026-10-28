import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  deployJob,
  WORKER_DEPLOY_DISABLED,
} from '../jobs/deploy.js';

const deploySource = readFileSync(
  new URL('../jobs/deploy.js', import.meta.url),
  'utf8',
);

test('legacy queue deploys fail closed for every former target', async () => {
  for (const target of [
    'vps-staging',
    'vps-production',
    'cloudflare-pages',
    'cloudflare-worker',
  ]) {
    await assert.rejects(
      deployJob({
        data: {
          target,
          branch: 'main; touch /tmp/omdala-worker-command-injection',
          environment: target === 'vps-production' ? 'production' : 'staging',
        },
      }),
      (error) =>
        error instanceof Error &&
        error.message === WORKER_DEPLOY_DISABLED,
    );
  }
});

test('deploy handler contains no process execution or provider CLI path', () => {
  assert.doesNotMatch(deploySource, /node:child_process|child_process/);
  assert.doesNotMatch(deploySource, /\bexec(?:File|Sync)?\s*\(/);
  assert.doesNotMatch(deploySource, /git\s+(?:fetch|checkout)/);
  assert.doesNotMatch(deploySource, /docker\s+compose/);
  assert.doesNotMatch(deploySource, /wrangler\s+(?:deploy|pages)/);
});
