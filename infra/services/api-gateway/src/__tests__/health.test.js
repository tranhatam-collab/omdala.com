import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../test-helper.js';

test('GET /health returns 200 with ok status', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.strictEqual(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.strictEqual(body.status, 'ok');
  assert.ok(body.timestamp);
  await app.close();
});

test('GET /health/deep returns 200 when all services ok', async () => {
  const app = await buildApp({
    mockPgQuery: async () => ({ rows: [{ check: 1 }] }),
    mockRedisPing: async () => 'PONG',
  });
  const res = await app.inject({ method: 'GET', url: '/health/deep' });
  assert.strictEqual(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.strictEqual(body.status, 'ok');
  assert.strictEqual(body.services.postgresql.status, 'ok');
  assert.strictEqual(body.services.valkey.status, 'ok');
  await app.close();
});

test('GET /health/deep returns 503 when postgresql fails', async () => {
  const app = await buildApp({
    mockPgQuery: async () => { throw new Error('conn refused'); },
    mockRedisPing: async () => 'PONG',
  });
  const res = await app.inject({ method: 'GET', url: '/health/deep' });
  assert.strictEqual(res.statusCode, 503);
  const body = JSON.parse(res.body);
  assert.strictEqual(body.status, 'degraded');
  assert.strictEqual(body.services.postgresql.status, 'fail');
  await app.close();
});
