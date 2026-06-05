// Tenant Router Middleware
// Extracts tenant from X-Tenant-ID header or JWT, validates access.

import { Pool } from 'pg';

const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

export async function tenantRouterMiddleware(request, reply) {
  const tenantSlug = request.headers['x-tenant-id'];

  if (!tenantSlug) {
    return reply.code(400).send({ error: 'Missing X-Tenant-ID header' });
  }

  // Validate tenant exists and is active
  const result = await pg.query(
    'SELECT id, slug, plan, status FROM omdala.tenants WHERE slug = $1 AND deleted_at IS NULL',
    [tenantSlug]
  );

  if (result.rows.length === 0) {
    return reply.code(404).send({ error: 'Tenant not found' });
  }

  const tenant = result.rows[0];

  if (tenant.status !== 'active') {
    return reply.code(403).send({ error: `Tenant is ${tenant.status}` });
  }

  // Check if user belongs to tenant (if authenticated)
  if (request.user) {
    const userTenant = await pg.query(
      'SELECT 1 FROM omdala.users WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [request.user.id, tenant.id]
    );

    if (userTenant.rows.length === 0 && !request.user.roles.includes('superadmin')) {
      return reply.code(403).send({ error: 'User does not belong to tenant' });
    }
  }

  request.tenant = {
    id: tenant.id,
    slug: tenant.slug,
    plan: tenant.plan,
  };
}
