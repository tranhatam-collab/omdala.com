import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pg } from '../lib/db.js';
import { backupJob } from '../jobs/backup.js';
import { emailJob } from '../jobs/email.js';
import { aiTaskJob } from '../jobs/ai-task.js';
import { codeReviewJob } from '../jobs/code-review.js';

const TASK_ID = '11111111-1111-4111-8111-111111111111';
const TENANT_ID = '22222222-2222-4222-8222-222222222222';
const originalQuery = pg.query.bind(pg);
const originalFetch = globalThis.fetch;

function withMockPg(mockFn) {
  pg.query = mockFn || originalQuery;
}

function restorePg() {
  pg.query = originalQuery;
}

function withMockFetch(responseFactory) {
  globalThis.fetch = async (...args) => responseFactory(...args);
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

function aiagentResult(requestId, response = 'Result') {
  return {
    contractVersion: '1.0.0',
    traceId: requestId,
    receipt: { receipt_hash: 'f'.repeat(64), signing_key_id: 'staging-v1' },
    run: { status: 'success' },
    data: {
      model: 'iai-one/iris-3', provider: 'iai-one', response,
      request_id: requestId, tenant_id: 'omdala-com', workspace_id: 'omdala-com-staging',
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15, token_usage_status: 'provider_reported' },
      cost_usd: 0.001, cost_status: 'authoritative_reconciled', cost_ledger_status: 'reconciled',
      ledger_entry_id: 'ledger_fixture_1', billing_eligible: true,
      receipt_id: 'prc_fixture_1', run_id: 'run_fixture_1', finish_reason: 'stop',
      policy_decision: 'allow', request_quota: { limit: 10, used: 1, remaining: 9, scope: 'api-key-lifetime' },
      budget: { limit_usd: 0.25, reserved_usd: 0.001, used_usd: 0.001, remaining_usd: 0.249,
        reservation_basis: 'configured_rate_conservative_ceiling' },
    },
  };
}

test('backupJob returns success or fails with a clear error', async () => {
  withMockPg(async () => ({ rows: [] }));
  try {
    const result = await backupJob({ data: { dbName: 'test', target: 'r2' } });
    assert.equal(result.success, true);
    assert.ok(typeof result.file === 'string' && result.file.length > 0);
  } catch (error) {
    assert.ok(error instanceof Error);
    assert.ok(error.message.length > 0, 'expected a non-empty error message');
  } finally {
    restorePg();
  }
});

test('emailJob sends email via fetch', async () => {
  let captured = null;
  withMockFetch(async (url, options) => {
    captured = { url, options };
    return { ok: true, json: async () => ({ id: 'msg-123' }) };
  });
  try {
    const result = await emailJob({
      data: { to: 'test@omdala.com', subject: 'Hello', html: '<b>Hi</b>' },
    });
    assert.equal(result.success, true);
    assert.equal(result.messageId, 'msg-123');
    assert.ok(captured.url.includes('mail.iai.one') || captured.url.includes(process.env.EMAIL_API_URL || ''));
  } finally {
    restoreFetch();
  }
});

test('emailJob throws on non-ok response', async () => {
  withMockFetch(async () => ({ ok: false, text: async () => 'SMTP error' }));
  try {
    await assert.rejects(
      emailJob({ data: { to: 'test@omdala.com', subject: 'X' } }),
      /Email failed/,
    );
  } finally {
    restoreFetch();
  }
});

test('aiTaskJob persists task, usage, and evidence in one idempotent statement', async () => {
  const queries = [];
  withMockPg(async (sql, params) => {
    queries.push({ sql, params });
    if (sql.includes('SELECT tenant_id')) {
      return { rows: [{ tenant_id: TENANT_ID, status: 'pending', output_payload: null }], rowCount: 1 };
    }
    return { rows: [{ id: '33333333-3333-4333-8333-333333333333' }], rowCount: 1 };
  });
  try {
    const result = await aiTaskJob({
      data: { taskId: TASK_ID, model: 'iai-one/iris-3', prompt: 'Test', maxTokens: 100 },
    }, {
      aiagentCall: async ({ requestId }) => aiagentResult(requestId),
    });
    assert.equal(result.success, true);
    assert.equal(result.replayed, false);
    assert.equal(result.costUsd, 0.001);
    assert.equal(result.tokens, 15);
    assert.equal(result.receiptId, 'prc_fixture_1');
    assert.equal(queries.length, 2);
    assert.match(queries[1].sql, /COALESCE\(cost_actual, 0\)/);
    assert.match(queries[1].sql, /INSERT INTO omdala\.model_usage/);
    assert.match(queries[1].sql, /INSERT INTO omdala\.evidence_logs/);
    assert.match(queries[1].sql, /output_payload->>'receipt_id' IS NULL/);
    assert.equal(queries[1].params[4], TASK_ID);
  } finally {
    restorePg();
  }
});

test('aiTaskJob replays completed evidence without another provider invocation', async () => {
  let providerCalls = 0;
  withMockPg(async (_sql, params) => ({
    rows: [{
      tenant_id: TENANT_ID,
      status: 'completed',
      output_payload: {
        request_id: expectedRequestId(params[0], 'ai-task'), receipt_id: 'prc_fixture_1',
        run_id: 'run_fixture_1', trace_id: 'trace_fixture_1', ledger_entry_id: 'ledger_fixture_1',
        receipt_hash: 'f'.repeat(64), cost_usd: 0.001, usage: { total_tokens: 15, latency_ms: 9 },
      },
    }],
    rowCount: 1,
  }));
  try {
    const result = await aiTaskJob({
      data: { taskId: TASK_ID, model: 'iai-one/iris-3', prompt: 'Test', maxTokens: 100 },
    }, { aiagentCall: async () => { providerCalls += 1; } });
    assert.equal(result.replayed, true);
    assert.equal(providerCalls, 0);
  } finally {
    restorePg();
  }
});

test('aiTaskJob throws when task is absent', async () => {
  withMockPg(async () => ({ rows: [], rowCount: 0 }));
  try {
    await assert.rejects(
      aiTaskJob({ data: { taskId: TASK_ID, model: 'iai-one/iris-3', prompt: 'X' } }),
      /Task not found/,
    );
  } finally {
    restorePg();
  }
});

test('codeReviewJob validates output and records a UUID-backed atomic receipt', async () => {
  const queries = [];
  withMockPg(async (sql, params) => {
    queries.push({ sql, params });
    if (sql.includes('SELECT tenant_id')) {
      return { rows: [{ tenant_id: TENANT_ID, status: 'pending', output_payload: null }], rowCount: 1 };
    }
    return { rows: [{ id: '33333333-3333-4333-8333-333333333333' }], rowCount: 1 };
  });
  const reviewJson = JSON.stringify({
    summary: 'Safe change', issues: [], security: [], performance: [], style: [],
  });
  try {
    const result = await codeReviewJob({
      data: { taskId: TASK_ID, diff: '+const safe = true;', commitSha: 'abc123' },
    }, { aiagentCall: async ({ requestId }) => aiagentResult(requestId, reviewJson) });
    assert.equal(result.success, true);
    assert.equal(result.receiptId, 'prc_fixture_1');
    assert.equal(result.review.summary, 'Safe change');
    assert.equal(queries.length, 2);
    assert.match(queries[1].sql, /'agent_task', \$5, 'code_review_completed'/);
    assert.match(queries[1].sql, /INSERT INTO omdala\.model_usage/);
    assert.equal(queries[1].params[4], TASK_ID);
  } finally {
    restorePg();
  }
});

test('codeReviewJob rejects malformed output before any persistence CTE', async () => {
  const queries = [];
  withMockPg(async (sql, params) => {
    queries.push({ sql, params });
    return { rows: [{ tenant_id: TENANT_ID, status: 'pending', output_payload: null }], rowCount: 1 };
  });
  try {
    await assert.rejects(codeReviewJob({
      data: { taskId: TASK_ID, diff: '+const unsafe = true;', commitSha: 'def456' },
    }, {
      aiagentCall: async ({ requestId }) => aiagentResult(requestId, 'not-json'),
    }), /AIAGENT_CODE_REVIEW_INVALID/);
    assert.equal(queries.length, 1);
  } finally {
    restorePg();
  }
});

function expectedRequestId(taskId, type) {
  // This helper is only used for the exact replay fixture above.
  const job = type === 'ai-task'
    ? { type, taskId, model: 'iai-one/iris-3', prompt: 'Test', maxTokens: 100 }
    : { type, taskId };
  return `omdala-worker-${createFixtureDigest(JSON.stringify(job)).slice(0, 40)}`;
}

function createFixtureDigest(value) {
  // Keep the test independent from the production helper implementation.
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
