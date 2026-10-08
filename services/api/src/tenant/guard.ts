/**
 * Tenant isolation guard for D1 queries.
 *
 * D1 (SQLite) does NOT have Row-Level Security (RLS) like PostgreSQL.
 * Tenant isolation MUST be enforced at the application layer.
 *
 * Table names match infra/d1 migration SQL schemas.
 */

export interface TenantContext {
  tenantId: string;
  countryId?: string;
  role: 'superadmin' | 'country_admin' | 'owner' | 'user' | 'anonymous';
  userId?: string;
}

/** Tenant-scoped tables (require tenant_id filter). Names match D1 migrations. */
export const TENANT_SCOPED_TABLES = [
  'countries',
  'administrative_regions',
  'local_nodes',
  'brands',
  'owners',
  'consents',
  'places',
  'products',
  'experiences',
  'image_assets',
  'compliance_profiles',
  'inquiries',
  'sites',
  'domain_bindings',
  'translations',
  'agent_runs',
  'approvals',
  'releases',
  'evidence_logs',
  'users',
  'audit_events',
] as const;

/** Global / root tables (no tenant_id filter required). */
export const GLOBAL_TABLES = [
  'tenants',
] as const;

export function assertTenantFilter(sql: string, ctx: TenantContext): void {
  if (ctx.role === 'superadmin') {
    return;
  }

  const sqlLower = sql.toLowerCase();
  for (const table of TENANT_SCOPED_TABLES) {
    const tablePattern = new RegExp('\\b' + table + '\\b', 'i');
    if (tablePattern.test(sql)) {
      if (!sqlLower.includes('tenant_id')) {
        throw new TenantIsolationError(
          'Query references tenant-scoped table "' +
            table +
            '" but does not include tenant_id filter. ' +
            'This violates tenant isolation. SQL: ' +
            sql.substring(0, 200) +
            '...',
        );
      }
    }
  }
}

export function withTenantFilter(
  baseQuery: string,
  ctx: TenantContext,
): { sql: string; params: (string | number | null)[] } {
  const hasWhere = /\bwhere\b/i.test(baseQuery);
  const sql = hasWhere
    ? baseQuery.replace(/\bwhere\b/i, `WHERE tenant_id = ? AND`)
    : `${baseQuery} WHERE tenant_id = ?`;

  return { sql, params: [ctx.tenantId] };
}

export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

export function validateTenantAccess(
  ctx: TenantContext,
  requestedTenantId: string,
): void {
  if (ctx.role === 'superadmin') {
    return;
  }

  if (ctx.tenantId !== requestedTenantId) {
    throw new TenantIsolationError(
      'User ' +
        ctx.userId +
        ' (tenant ' +
        ctx.tenantId +
        ') attempted to access data belonging to tenant ' +
        requestedTenantId +
        '. Cross-tenant access denied.',
    );
  }
}
