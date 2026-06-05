import { test } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../test-helper.js';

const mockApproval = {
  id: 'a1', tenant_id: 'tenant-001', request_type: 'deploy_production',
  title: 'Deploy v0.2.0', status: 'pending', requested_by: 'user-001',
  approvers: ['user-001'], approved_by: [], created_at: '2026-01-01',
};

test('GET /approvals returns pending list', async () => {
  const app = await buildApp({ mockPgQuery: async () => ({ rows: [mockApproval] }) });
  const res = await app.inject({ method: 'GET', url: '/approvals' });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(JSON.parse(res.body).length, 1);
  await app.close();
});

test('POST /approvals rejects invalid request_type', async () => {
  const app = await buildApp({ mockPgQuery: async () => ({ rows: [] }) });
  const res = await app.inject({
    method: 'POST',
    url: '/approvals',
    payload: { request_type: 'invalid', title: 'X', approvers: ['user-001'] },
  });
  assert.strictEqual(res.statusCode, 400);
  await app.close();
});

test('POST /approvals creates destructive action request', async () => {
  const app = await buildApp({
    mockPgQuery: async (sql) => {
      if (sql.includes('INSERT INTO omdala.approval_requests')) return { rows: [mockApproval] };
      if (sql.includes('evidence_logs')) return { rows: [] };
      return { rows: [] };
    },
  });
  const res = await app.inject({
    method: 'POST',
    url: '/approvals',
    payload: { request_type: 'deploy_production', title: 'Deploy', description: 'v0.2.0', approvers: ['user-001'] },
  });
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(JSON.parse(res.body).request_type, 'deploy_production');
  await app.close();
});

test('POST /approvals/:id/approve updates status', async () => {
  const approved = { ...mockApproval, approved_by: ['user-001'], status: 'approved' };
  const app = await buildApp({
    mockPgQuery: async (sql) => {
      if (sql.includes('SELECT * FROM omdala.approval_requests')) return { rows: [mockApproval] };
      if (sql.includes('UPDATE omdala.approval_requests')) return { rows: [approved] };
      if (sql.includes('evidence_logs')) return { rows: [] };
      return { rows: [] };
    },
  });
  const res = await app.inject({ method: 'POST', url: '/approvals/a1/approve' });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(JSON.parse(res.body).status, 'approved');
  await app.close();
});

test('POST /approvals/:id/reject updates status', async () => {
  const rejected = { ...mockApproval, status: 'rejected', rejected_by: 'user-001', rejection_reason: 'Risk too high' };
  const app = await buildApp({
    mockPgQuery: async (sql) => {
      if (sql.includes('UPDATE omdala.approval_requests')) return { rows: [rejected] };
      return { rows: [] };
    },
  });
  const res = await app.inject({
    method: 'POST',
    url: '/approvals/a1/reject',
    payload: { reason: 'Risk too high' },
  });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(JSON.parse(res.body).status, 'rejected');
  await app.close();
});
