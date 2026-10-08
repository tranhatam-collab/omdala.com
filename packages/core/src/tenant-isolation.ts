/**
 * Application-level tenant isolation for D1 (no RLS).
 * Every mutating/select query on tenant-scoped tables must include tenant_id.
 */

const TENANT_SCOPED_TABLES = new Set([
  "countries",
  "administrative_regions",
  "local_nodes",
  "brands",
  "owners",
  "consents",
  "places",
  "products",
  "experiences",
  "image_assets",
  "compliance_profiles",
  "inquiries",
  "sites",
  "domain_bindings",
  "translations",
  "agent_runs",
  "approvals",
  "evidence_logs",
  "releases",
  "users",
  "audit_events",
]);

export type TenantScopeErrorCode =
  | "MISSING_TENANT_ID"
  | "CROSS_TENANT_ACCESS"
  | "UNSCOPED_TABLE";

export class TenantScopeError extends Error {
  readonly code: TenantScopeErrorCode;

  constructor(code: TenantScopeErrorCode, message: string) {
    super(message);
    this.name = "TenantScopeError";
    this.code = code;
  }
}

export function isTenantScopedTable(tableName: string): boolean {
  return TENANT_SCOPED_TABLES.has(tableName.toLowerCase());
}

export function assertTenantId(tenantId: string | null | undefined): asserts tenantId is string {
  if (!tenantId || tenantId.trim().length === 0) {
    throw new TenantScopeError("MISSING_TENANT_ID", "tenant_id is required for scoped queries");
  }
}

export function assertSameTenant(
  requestTenantId: string,
  resourceTenantId: string,
  resourceLabel = "resource",
): void {
  assertTenantId(requestTenantId);
  if (requestTenantId !== resourceTenantId) {
    throw new TenantScopeError(
      "CROSS_TENANT_ACCESS",
      `Cross-tenant access blocked for ${resourceLabel}`,
    );
  }
}

/**
 * Append tenant_id predicate to a SQL fragment that already has WHERE or starts fresh.
 */
export function withTenantFilter(
  sql: string,
  tenantId: string,
  tableAlias?: string,
): string {
  assertTenantId(tenantId);
  const column = tableAlias ? `${tableAlias}.tenant_id` : "tenant_id";
  const predicate = `${column} = ?`;
  const normalized = sql.trim();
  if (/\bwhere\b/i.test(normalized)) {
    return `${normalized} AND ${predicate}`;
  }
  return `${normalized} WHERE ${predicate}`;
}

export function listTenantScopedTables(): string[] {
  return [...TENANT_SCOPED_TABLES].sort();
}
