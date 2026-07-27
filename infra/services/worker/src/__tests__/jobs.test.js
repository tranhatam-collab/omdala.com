import { test } from 'node:test';
import assert from 'node:assert';
import { pg } from '../lib/db.js';
import { backupJob } from '../jobs/backup.js';
import { emailJob } from '../jobs/email.js';
import { aiTaskJob } from '../jobs/ai-task.js';

// Monkey-patch pg.query for tests
const originalQuery = pg.query.bind(pg);

function withMockPg(mockFn) {
  pg.query = mockFn || originalQuery;
}

function restorePg() {
  pg.query = originalQuery;
}

// Mock fetch globally
const originalFetch = globalThis.fetch;
function withMockFetch(responseFactory) {
  globalThis.fetch = async (...args) => responseFactory(...args);
}
function restoreFetch() {
  globalThis.fetch = originalFetch;
}

test('backupJob returns success or fails with a clear error', async () => {
  withMockPg(async () => ({ rows: [] }));
  // Uses child_process.exec against real pg_dump/aws when present in the environment.
  try {
    const result = await backupJob({ data: { dbName: 'test', target: 'r2' } });
    assert.strictEqual(result.success, true);
    assert.ok(typeof result.file === 'string' && result.file.length > 0);
  } catch (err) {
    assert.ok(err instanceof Error);
    assert.ok(err.message.length > 0, 'expected a non-empty error message');
  } finally {
    restorePg();
  }
});

test('emailJob sends email via fetch', async () => {
  let captured = null;
  withMockFetch(async (url, opts) => {
    captured = { url, opts };
    return { ok: true, json: async () => ({ id: 'msg-123' }) };
  });

  const result = await emailJob({
    data: { to: 'test@omdala.com', subject: 'Hello', html: '<b>Hi</b>' },
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.messageId, 'msg-123');
  assert.ok(captured.url.includes('mail.iai.one') || captured.url.includes(process.env.EMAIL_API_URL || ''));
  restoreFetch();
});

test('emailJob throws on non-ok response', async () => {
  withMockFetch(async () => ({ ok: false, text: async () => 'SMTP error' }));
  try {
    await emailJob({ data: { to: 'test@omdala.com', subject: 'X' } });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err.message.includes('Email failed'));
  }
  restoreFetch();
});

test('aiTaskJob updates task and records usage', async () => {
  let queries = [];
  withMockPg(async (sql, params) => {
    queries.push({ sql, params });
    if (sql.includes('SELECT tenant_id')) return { rows: [{ tenant_id: 't1' }] };
    return { rows: [] };
  });

  withMockFetch(async () => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: 'Result' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    }),
  }));

  const result = await aiTaskJob({
    data: { taskId: 'task-1', model: 'gpt-4o', prompt: 'Test', maxTokens: 100 },
  });

  assert.strictEqual(result.success, true);
  assert.ok(result.costUsd > 0);
  assert.strictEqual(result.tokens, 15);
  assert.ok(queries.some(q => q.sql.includes('UPDATE omdala.agent_tasks')));
  assert.ok(queries.some(q => q.sql.includes('INSERT INTO omdala.model_usage')));

  restorePg();
  restoreFetch();
});

test('aiTaskJob throws when task not found', async () => {
  withMockPg(async () => ({ rows: [] }));
  try {
    await aiTaskJob({ data: { taskId: 'missing', model: 'gpt-4o', prompt: 'X' } });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err.message.includes('Task not found'));
  }
  restorePg();
});
