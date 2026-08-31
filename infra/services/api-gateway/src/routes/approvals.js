// Approval Request Routes
import { pg } from '../lib/db.js';

export default async function approvalRoutes(app) {
  // List approvals for tenant
  app.get('/', async (request, reply) => {
    const { tenant } = request;
    const { status = 'pending', limit = 20, offset = 0 } = request.query;

    const result = await pg.query(
      `SELECT * FROM omdala.approval_requests
       WHERE tenant_id = $1 AND status = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [tenant.id, status, parseInt(limit), parseInt(offset)]
    );

    return reply.send(result.rows);
  });

  // Create approval request
  app.post('/', async (request, reply) => {
    const { tenant, user } = request;
    const { request_type, title, description, task_id, approvers } = request.body;

    // Verify this is a destructive action requiring approval
    const destructiveActions = [
      'delete_database', 'delete_table', 'restore_production',
      'rotate_secret', 'deploy_production', 'change_dns',
      'gdpr_delete', 'open_firewall', 'scale_vps'
    ];

    if (!destructiveActions.includes(request_type)) {
      return reply.code(400).send({ error: 'Invalid approval request type' });
    }

    const result = await pg.query(
      `INSERT INTO omdala.approval_requests (tenant_id, request_type, title, description, task_id, requested_by, approvers)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tenant.id, request_type, title, description, task_id, user.id, approvers]
    );

    // Log evidence
    await pg.query(
      `INSERT INTO omdala.evidence_logs (tenant_id, entity_type, entity_id, action, actor_id, actor_type, payload)
       VALUES ($1, 'approval_request', $2, 'created', $3, 'user', $4)`,
      [tenant.id, result.rows[0].id, user.id, JSON.stringify({ request_type, title })]
    );

    return reply.code(201).send(result.rows[0]);
  });

  // Approve request
  app.post('/:id/approve', async (request, reply) => {
    const { tenant, user } = request;
    const { id } = request.params;

    // Check if user is an approver
    const approval = await pg.query(
      'SELECT * FROM omdala.approval_requests WHERE id = $1 AND tenant_id = $2',
      [id, tenant.id]
    );

    if (approval.rows.length === 0) {
      return reply.code(404).send({ error: 'Approval request not found' });
    }

    const req = approval.rows[0];
    if (!req.approvers.includes(user.id)) {
      return reply.code(403).send({ error: 'You are not authorized to approve this request' });
    }

    // Update approved_by array
    const approvedBy = [...(req.approved_by || []), user.id];
    const allApproved = req.approvers.every(a => approvedBy.includes(a));

    const result = await pg.query(
      `UPDATE omdala.approval_requests
       SET approved_by = $1,
           status = $2,
           executed_at = CASE WHEN $2 = 'approved' THEN now() ELSE null END
       WHERE id = $3
       RETURNING *`,
      [approvedBy, allApproved ? 'approved' : 'pending', id]
    );

    // Log evidence
    await pg.query(
      `INSERT INTO omdala.evidence_logs (tenant_id, entity_type, entity_id, action, actor_id, actor_type, payload)
       VALUES ($1, 'approval_request', $2, 'approved', $3, 'user', $4)`,
      [tenant.id, id, user.id, JSON.stringify({ approvedBy, allApproved })]
    );

    return reply.send(result.rows[0]);
  });

  // Reject request
  app.post('/:id/reject', async (request, reply) => {
    const { tenant, user } = request;
    const { id } = request.params;
    const { reason } = request.body;

    const result = await pg.query(
      `UPDATE omdala.approval_requests
       SET status = 'rejected', rejected_by = $1, rejection_reason = $2
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [user.id, reason, id, tenant.id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Approval request not found' });
    }

    return reply.send(result.rows[0]);
  });
}
