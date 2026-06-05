// User Routes
import { Pool } from 'pg';

const pg = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

export default async function userRoutes(app) {
  // List users for tenant
  app.get('/users', async (request, reply) => {
    const { tenant } = request;
    const { status = 'active', limit = 20, offset = 0 } = request.query;

    const result = await pg.query(
      `SELECT id, email, display_name, role, external_id, status, created_at
       FROM omdala.users
       WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [tenant.id, status, parseInt(limit), parseInt(offset)]
    );

    return reply.send(result.rows);
  });

  // Get single user
  app.get('/users/:id', async (request, reply) => {
    const { tenant } = request;
    const { id } = request.params;

    const result = await pg.query(
      `SELECT id, email, display_name, role, external_id, metadata, status, created_at
       FROM omdala.users
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [id, tenant.id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.send(result.rows[0]);
  });

  // Create user
  app.post('/users', async (request, reply) => {
    const { tenant, user: creator } = request;
    const { email, display_name, role, external_id, metadata } = request.body;

    const result = await pg.query(
      `INSERT INTO omdala.users (tenant_id, email, display_name, role, external_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, display_name, role, status, created_at`,
      [tenant.id, email, display_name, role, external_id, JSON.stringify(metadata || {})]
    );

    return reply.code(201).send(result.rows[0]);
  });
}
