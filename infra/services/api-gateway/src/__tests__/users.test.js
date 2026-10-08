import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../test-helper.js';

const mockUsers = [
  { id: 'u1', email: 'a@omdala.com', display_name: 'Alice', role: 'admin', external_id: 'e1', status: 'active', created_at: '2026-01-01' },
  { id: 'u2', email: 'b@omdala.com', display_name: 'Bob', role: 'user', external_id: 'e2', status: 'active', created_at: '2026-01-02' },
];

test('GET /users returns list', async () => {
  const app = await buildApp({ mockPgQuery: async () => ({ rows: mockUsers }) });
  const res = await app.inject({ method: 'GET', url: '/users' });
  assert.strictEqual(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.strictEqual(body.length, 2);
  assert.strictEqual(body[0].email, 'a@omdala.com');
  await app.close();
});

test('GET /users/:id returns single user', async () => {
  const app = await buildApp({ mockPgQuery: async () => ({ rows: [mockUsers[0]] }) });
  const res = await app.inject({ method: 'GET', url: '/users/u1' });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(JSON.parse(res.body).id, 'u1');
  await app.close();
});

test('GET /users/:id returns 404 when not found', async () => {
  const app = await buildApp({ mockPgQuery: async () => ({ rows: [] }) });
  const res = await app.inject({ method: 'GET', url: '/users/unknown' });
  assert.strictEqual(res.statusCode, 404);
  await app.close();
});

test('POST /users creates user', async () => {
  const newUser = { id: 'u3', email: 'c@omdala.com', display_name: 'Carol', role: 'user', status: 'active', created_at: '2026-01-03' };
  const app = await buildApp({ mockPgQuery: async () => ({ rows: [newUser] }) });
  const res = await app.inject({
    method: 'POST',
    url: '/users',
    payload: { email: 'c@omdala.com', display_name: 'Carol', role: 'user', external_id: 'e3' },
  });
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(JSON.parse(res.body).email, 'c@omdala.com');
  await app.close();
});
