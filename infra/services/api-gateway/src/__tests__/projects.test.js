import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../test-helper.js';

const mockProjects = [
  { id: 'p1', slug: 'alpha', name: 'Alpha', description: 'First', status: 'active', created_at: '2026-01-01' },
];

test('GET /projects returns list', async () => {
  const app = await buildApp({ mockPgQuery: async () => ({ rows: mockProjects }) });
  const res = await app.inject({ method: 'GET', url: '/projects' });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(JSON.parse(res.body).length, 1);
  await app.close();
});

test('GET /projects/:id returns 404 when not found', async () => {
  const app = await buildApp({ mockPgQuery: async () => ({ rows: [] }) });
  const res = await app.inject({ method: 'GET', url: '/projects/p99' });
  assert.strictEqual(res.statusCode, 404);
  await app.close();
});

test('POST /projects creates project', async () => {
  const created = { id: 'p2', slug: 'beta', name: 'Beta', description: 'Second', status: 'active', created_at: '2026-01-02' };
  const app = await buildApp({ mockPgQuery: async () => ({ rows: [created] }) });
  const res = await app.inject({
    method: 'POST',
    url: '/projects',
    payload: { slug: 'beta', name: 'Beta', description: 'Second' },
  });
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(JSON.parse(res.body).slug, 'beta');
  await app.close();
});
