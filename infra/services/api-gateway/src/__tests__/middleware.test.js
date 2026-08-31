import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../test-helper.js';

test('health routes skip auth', async () => {
  const app = await buildApp();
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.strictEqual(res.statusCode, 200);
  await app.close();
});

test('non-health routes attach tenant and user', async () => {
  const app = await buildApp({
    mockPgQuery: async () => ({ rows: [] }),
    tenant: { id: 'tenant-abc', slug: 'test', plan: 'enterprise' },
    user: { id: 'user-xyz', email: 'test@example.com', roles: ['superadmin'] },
  });
  const res = await app.inject({ method: 'GET', url: '/users', headers: { 'X-Tenant-ID': 'test' } });
  assert.strictEqual(res.statusCode, 200);
  await app.close();
});

test('audit log hook does not throw on error', async () => {
  const app = await buildApp({
    mockPgQuery: async () => { throw new Error('audit db down'); },
  });
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.strictEqual(res.statusCode, 200);
  await app.close();
});
