// Audit Log Middleware
// Logs every request to PostgreSQL audit_logs table.

import { Pool } from 'pg';

const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

export async function auditLogMiddleware(request, reply) {
  const startTime = Date.now();

  // Wait for response to complete
  reply.raw.on('finish', async () => {
    const duration = Date.now() - startTime;

    try {
      await pg.query(
        `INSERT INTO omdala.audit_logs (tenant_id, table_name, record_id, action, changed_by, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          request.tenant?.id || null,
          request.routeOptions?.url || request.url,
          request.user?.id || null,
          request.method,
          request.user?.id || null,
          request.ip,
          request.headers['user-agent'] || null,
        ]
      );
    } catch (err) {
      // Don't fail request if audit log fails
      request.log.error({ err: err.message }, 'Audit log failed');
    }
  });
}
