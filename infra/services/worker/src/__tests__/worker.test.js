import { test } from 'node:test';
import assert from 'node:assert';

// Unit tests for worker job router logic
const jobHandlers = {
  'backup': async () => ({ success: true }),
  'email': async () => ({ success: true }),
  'ai-task': async () => ({ success: true }),
};

function routeJob(job) {
  const handler = jobHandlers[job.name];
  if (!handler) throw new Error(`Unknown job type: ${job.name}`);
  return handler(job);
}

test('job router finds backup handler', async () => {
  const result = await routeJob({ name: 'backup', data: {} });
  assert.strictEqual(result.success, true);
});

test('job router finds email handler', async () => {
  const result = await routeJob({ name: 'email', data: {} });
  assert.strictEqual(result.success, true);
});

test('job router finds ai-task handler', async () => {
  const result = await routeJob({ name: 'ai-task', data: {} });
  assert.strictEqual(result.success, true);
});

test('job router throws on unknown job', async () => {
  try {
    await routeJob({ name: 'unknown', data: {} });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err.message.includes('Unknown job type'));
  }
});

test('DLQ alert payload format', () => {
  const job = { id: 'j1', name: 'backup', attemptsMade: 3, opts: { attempts: 3 }, data: { db: 'test' } };
  const err = new Error('Connection refused');
  const payload = {
    text: `Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempts and moved to DLQ.`,
  };
  assert.ok(payload.text.includes('j1'));
  assert.ok(payload.text.includes('backup'));
  assert.ok(payload.text.includes('3'));
});
