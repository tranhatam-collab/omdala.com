import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../test-helper.js';

const mockTask = {
  id: 't1', tenant_id: 'tenant-001', title: 'Research', description: 'AI safety',
  task_type: 'research', priority: 'high', status: 'pending', created_at: '2026-01-01',
};

test('GET /tasks returns list with filters', async () => {
  const app = await buildApp({ mockPgQuery: async () => ({ rows: [mockTask] }) });
  const res = await app.inject({ method: 'GET', url: '/tasks?status=pending' });
  assert.strictEqual(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.strictEqual(body.length, 1);
  assert.strictEqual(body[0].status, 'pending');
  await app.close();
});

test('GET /tasks/:id returns single task', async () => {
  const app = await buildApp({ mockPgQuery: async () => ({ rows: [mockTask] }) });
  const res = await app.inject({ method: 'GET', url: '/tasks/t1' });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(JSON.parse(res.body).id, 't1');
  await app.close();
});

test('POST /tasks creates task', async () => {
  const app = await buildApp({ mockPgQuery: async () => ({ rows: [mockTask] }) });
  const res = await app.inject({
    method: 'POST',
    url: '/tasks',
    payload: {
      title: 'Research',
      description: 'AI safety',
      task_type: 'research',
      priority: 'high',
      input_payload: {},
      assigned_agent: 'PlannerAgent',
    },
  });
  assert.strictEqual(res.statusCode, 201);
  await app.close();
});

test('PATCH /tasks/:id updates status', async () => {
  const updated = { ...mockTask, status: 'running' };
  const app = await buildApp({ mockPgQuery: async () => ({ rows: [updated] }) });
  const res = await app.inject({
    method: 'PATCH',
    url: '/tasks/t1',
    payload: { status: 'running' },
  });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(JSON.parse(res.body).status, 'running');
  await app.close();
});

test('DELETE /tasks/:id soft-deletes', async () => {
  const app = await buildApp({ mockPgQuery: async () => ({ rows: [] }) });
  const res = await app.inject({ method: 'DELETE', url: '/tasks/t1' });
  assert.strictEqual(res.statusCode, 204);
  await app.close();
});
