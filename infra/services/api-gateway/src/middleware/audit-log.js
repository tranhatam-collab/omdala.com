// Audit Log Middleware
// Uses Fastify onResponse hook for reliable post-request logging.
// Do NOT use reply.raw.on('finish') — it misses responses that Fastify handles internally.

import { pg } from '../lib/db.js';

/**
 * Register this function as a Fastify onResponse hook:
 *   app.addHook('onResponse', auditLogHook);
 */
export async function auditLogHook(request, reply) {
  try {
    await pg.query(
      `INSERT INTO omdala.audit_logs (tenant_id, table_name, record_id, action, changed_by, ip_address, user_agent, changed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
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
}
