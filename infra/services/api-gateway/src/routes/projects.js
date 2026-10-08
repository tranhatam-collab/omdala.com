// Project Routes
import { pg } from '../lib/db.js';

export default async function projectRoutes(app) {
  // List projects for tenant
  app.get('/', async (request, reply) => {
    const { tenant } = request;
    const { status = 'active', limit = 20, offset = 0 } = request.query;

    const result = await pg.query(
      `SELECT id, slug, name, description, status, created_at
       FROM omdala.projects
       WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [tenant.id, status, parseInt(limit), parseInt(offset)]
    );

    return reply.send(result.rows);
  });

  // Get single project
  app.get('/:id', async (request, reply) => {
    const { tenant } = request;
    const { id } = request.params;

    const result = await pg.query(
      `SELECT * FROM omdala.projects
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [id, tenant.id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    return reply.send(result.rows[0]);
  });

  // Create project
  app.post('/', async (request, reply) => {
    const { tenant } = request;
    const { slug, name, description, config } = request.body;

    const result = await pg.query(
      `INSERT INTO omdala.projects (tenant_id, slug, name, description, config)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tenant.id, slug, name, description, JSON.stringify(config || {})]
    );

    return reply.code(201).send(result.rows[0]);
  });
}
