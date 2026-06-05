// Agent Task Routes
import { Pool } from 'pg';

const pg = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

export default async function taskRoutes(app) {
  // List tasks for tenant
  app.get('/tasks', async (request, reply) => {
    const { tenant } = request;
    const { status, limit = 20, offset = 0 } = request.query;

    let sql = 'SELECT * FROM omdala.agent_tasks WHERE tenant_id = $1';
    const params = [tenant.id];

    if (status) {
      sql += ' AND status = $2';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));

    const result = await pg.query(sql, params);
    return reply.send(result.rows);
  });

  // Get single task
  app.get('/tasks/:id', async (request, reply) => {
    const { tenant } = request;
    const { id } = request.params;

    const result = await pg.query(
      'SELECT * FROM omdala.agent_tasks WHERE id = $1 AND tenant_id = $2',
      [id, tenant.id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Task not found' });
    }

    return reply.send(result.rows[0]);
  });

  // Create task
  app.post('/tasks', async (request, reply) => {
    const { tenant, user } = request;
    const { title, description, task_type, priority, input_payload, assigned_agent } = request.body;

    const result = await pg.query(
      `INSERT INTO omdala.agent_tasks (tenant_id, title, description, task_type, priority, input_payload, created_by, assigned_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [tenant.id, title, description, task_type, priority, JSON.stringify(input_payload), user.id, assigned_agent]
    );

    return reply.code(201).send(result.rows[0]);
  });

  // Update task status
  app.patch('/tasks/:id', async (request, reply) => {
    const { tenant } = request;
    const { id } = request.params;
    const { status, output_payload, error_message } = request.body;

    const result = await pg.query(
      `UPDATE omdala.agent_tasks
       SET status = COALESCE($1, status),
           output_payload = COALESCE($2, output_payload),
           error_message = COALESCE($3, error_message),
           updated_at = now()
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      [status, output_payload ? JSON.stringify(output_payload) : null, error_message, id, tenant.id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Task not found' });
    }

    return reply.send(result.rows[0]);
  });

  // Delete task (soft delete)
  app.delete('/tasks/:id', async (request, reply) => {
    const { tenant, user } = request;
    const { id } = request.params;

    await pg.query(
      'UPDATE omdala.agent_tasks SET status = deleted, deleted_at = now(), deleted_by = $1 WHERE id = $2 AND tenant_id = $3',
      [user.id, id, tenant.id]
    );

    return reply.code(204).send();
  });
}
