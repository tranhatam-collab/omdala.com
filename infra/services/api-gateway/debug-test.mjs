import { buildApp } from './src/test-helper.js';

const mockApproval = {
  id: 'a1', tenant_id: 'tenant-001', request_type: 'deploy_production',
  title: 'Deploy v0.2.0', status: 'pending', requested_by: 'user-001',
  approvers: ['user-001'], approved_by: [], created_at: '2026-01-01',
};

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

console.log('status:', res.statusCode);
console.log('body:', res.body);
await app.close();
