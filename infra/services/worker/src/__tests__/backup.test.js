import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  backupJob,
  WORKER_BACKUP_DISABLED,
} from '../jobs/backup.js';

const backupSource = readFileSync(
  new URL('../jobs/backup.js', import.meta.url),
  'utf8',
);

test('legacy queue backups fail closed before using job or environment input', async () => {
  for (const target of ['r2', 'b2', 'unknown']) {
    await assert.rejects(
      backupJob({
        data: {
          target,
          dbName: 'omdala_staging; touch /tmp/omdala-worker-backup-injection',
        },
      }),
      (error) =>
        error instanceof Error &&
        error.message === WORKER_BACKUP_DISABLED,
    );
  }
});

test('backup handler contains no process execution or storage CLI path', () => {
  assert.doesNotMatch(backupSource, /node:child_process|child_process/);
  assert.doesNotMatch(backupSource, /\bexec(?:File|Sync)?\s*\(/);
  assert.doesNotMatch(backupSource, /\bpg_dump\b/);
  assert.doesNotMatch(backupSource, /\baws\s+s3\b/);
  assert.doesNotMatch(backupSource, /\bb2\s+upload-file\b/);
  assert.doesNotMatch(backupSource, /\brm\s+-f\b/);
});
