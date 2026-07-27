/**
 * Tenant isolation guard for D1 queries.
 *
 * D1 (SQLite) does NOT have Row-Level Security (RLS) like PostgreSQL.
 * Tenant isolation MUST be enforced at the application layer.
 *
 * Every query that touches tenant-scoped tables MUST include a tenant_id filter.
 * This module provides helpers to enforce that invariant.
 */

export interface TenantContext {
  tenantId: string;
  countryId?: string;
  role: 'superadmin' | 'country_admin' | 'owner' | 'user' | 'anonymous';
  userId?: string;
}

/**
 * Tables that are tenant-scoped (require tenant_id filter).
 */
export const TENANT_SCOPED_TABLES = [
  'brand',
  'owner',
  'place',
  'product',
  'experience',
  'image_asset',
  'inquiry',
  'site',
  'domain_binding',
  'translation',
  'agent_run',
  'approval',
  'release',
  'evidence_log',
  'audit_event',
] as const;

/**
 * Tables that are NOT tenant-scoped (global reference data).
 */
export const GLOBAL_TABLES = [
  'tenant',
  'country',
  'administrative_region',
  'local_node',
  'compliance_profile',
  'user',
  'session',
  'oauth_account',
  'magic_link_token',
] as const;

/**
 * Asserts that a SQL query includes a tenant_id filter for tenant-scoped tables.
 * Throws if a tenant-scoped table is referenced without WHERE tenant_id = ?
 *
 * This is a development-time guard, not a production enforcement mechanism.
 * In production, all data access must go through the repository layer which
 * always injects tenant_id.
 */
export function assertTenantFilter(sql: string, ctx: TenantContext): void {
  if (ctx.role === 'superadmin') {
    // Superadmin can access cross-tenant data, but it must be audited
    return;
  }

  const sqlLower = sql.toLowerCase();
  for (const table of TENANT_SCOPED_TABLES) {
    // Check if table is referenced in FROM or JOIN
    const tablePattern = new RegExp(`\\b${table}\\b`, 'i');
    if (tablePattern.test(sql)) {
      // Must have tenant_id filter
      if (!sqlLower.includes('tenant_id')) {
        throw new TenantIsolationError(
          `Query references tenant-scoped table "${table}" but does not include tenant_id filter. ` +
            `This violates tenant isolation. SQL: ${sql.substring(0, 200)}...`,
        );
      }
    }
  }
}

/**
 * Wraps a D1 prepared statement with tenant_id injection.
 * Use this for all tenant-scoped queries.
 */
export function withTenantFilter(
  baseQuery: string,
  ctx: TenantContext,
): { sql: string; params: (string | number | null)[] } {
  // Do NOT call assertTenantFilter on the input — the whole point of this
  // function is to INJECT tenant_id into queries that don't have it yet.
  // The resulting query will have tenant_id by construction.

  // If query already has WHERE, add AND tenant_id = ?
  // If query has no WHERE, add WHERE tenant_id = ?
  const hasWhere = /\bwhere\b/i.test(baseQuery);
  const sql = hasWhere
    ? baseQuery.replace(/\bwhere\b/i, `WHERE tenant_id = ? AND`)
    : `${baseQuery} WHERE tenant_id = ?`;

  return { sql, params: [ctx.tenantId] };
}

/**
 * Error thrown when tenant isolation is violated.
 */
export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

/**
 * Validates that a user has access to a specific tenant's data.
 */
export function validateTenantAccess(
  ctx: TenantContext,
  requestedTenantId: string,
): void {
  if (ctx.role === 'superadmin') {
    return; // Superadmin has cross-tenant access
  }

  if (ctx.tenantId !== requestedTenantId) {
    throw new TenantIsolationError(
      `User ${ctx.userId} (tenant ${ctx.tenantId}) attempted to access ` +
        `data belonging to tenant ${requestedTenantId}. Cross-tenant access denied.`,
    );
  }
}
