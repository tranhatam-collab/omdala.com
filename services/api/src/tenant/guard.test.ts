import { describe, it, expect } from 'vitest';
import {
  assertTenantFilter,
  withTenantFilter,
  validateTenantAccess,
  TenantIsolationError,
  TENANT_SCOPED_TABLES,
  GLOBAL_TABLES,
} from './guard';

const ownerCtx = {
  tenantId: 'tenant-vn',
  role: 'owner' as const,
  userId: 'user-1',
};

const superadminCtx = {
  tenantId: 'tenant-global',
  role: 'superadmin' as const,
  userId: 'admin-1',
};

describe('assertTenantFilter', () => {
  it('rejects tenant-scoped query without tenant_id', () => {
    expect(() =>
      assertTenantFilter('SELECT * FROM brands WHERE name = ?', ownerCtx),
    ).toThrow(TenantIsolationError);
  });

  it('allows tenant-scoped query with tenant_id', () => {
    expect(() =>
      assertTenantFilter(
        'SELECT * FROM brands WHERE tenant_id = ? AND name = ?',
        ownerCtx,
      ),
    ).not.toThrow();
  });

  it('allows superadmin to bypass tenant filter', () => {
    expect(() =>
      assertTenantFilter('SELECT * FROM brands WHERE name = ?', superadminCtx),
    ).not.toThrow();
  });

  it('allows global table queries without tenant_id', () => {
    expect(() =>
      assertTenantFilter('SELECT * FROM tenants WHERE id = ?', ownerCtx),
    ).not.toThrow();
  });

  it('rejects INSERT into tenant-scoped table without tenant_id', () => {
    expect(() =>
      assertTenantFilter('INSERT INTO brands (name) VALUES (?)', ownerCtx),
    ).toThrow(TenantIsolationError);
  });

  it('allows INSERT into tenant-scoped table with tenant_id', () => {
    expect(() =>
      assertTenantFilter(
        'INSERT INTO brands (tenant_id, name) VALUES (?, ?)',
        ownerCtx,
      ),
    ).not.toThrow();
  });

  it('rejects UPDATE on tenant-scoped table without tenant_id', () => {
    expect(() =>
      assertTenantFilter('UPDATE brands SET name = ? WHERE id = ?', ownerCtx),
    ).toThrow(TenantIsolationError);
  });

  it('rejects DELETE on tenant-scoped table without tenant_id', () => {
    expect(() =>
      assertTenantFilter('DELETE FROM brands WHERE id = ?', ownerCtx),
    ).toThrow(TenantIsolationError);
  });
});

describe('withTenantFilter', () => {
  it('injects tenant_id into query without WHERE', () => {
    const result = withTenantFilter('SELECT * FROM brands', ownerCtx);
    expect(result.sql).toContain('WHERE tenant_id = ?');
    expect(result.params).toEqual(['tenant-vn']);
  });

  it('injects tenant_id into query with existing WHERE', () => {
    const result = withTenantFilter(
      'SELECT * FROM brands WHERE name = ?',
      ownerCtx,
    );
    expect(result.sql).toContain('tenant_id = ? AND');
    expect(result.params).toEqual(['tenant-vn']);
  });
});

describe('validateTenantAccess', () => {
  it('allows access to own tenant', () => {
    expect(() => validateTenantAccess(ownerCtx, 'tenant-vn')).not.toThrow();
  });

  it('rejects cross-tenant access for owner', () => {
    expect(() => validateTenantAccess(ownerCtx, 'tenant-th')).toThrow(
      TenantIsolationError,
    );
  });

  it('allows cross-tenant access for superadmin', () => {
    expect(() => validateTenantAccess(superadminCtx, 'tenant-vn')).not.toThrow();
    expect(() => validateTenantAccess(superadminCtx, 'tenant-th')).not.toThrow();
  });
});

describe('TENANT_SCOPED_TABLES', () => {
  it('includes core tenant-scoped tables from D1 migrations', () => {
    expect(TENANT_SCOPED_TABLES).toContain('brands');
    expect(TENANT_SCOPED_TABLES).toContain('places');
    expect(TENANT_SCOPED_TABLES).toContain('products');
    expect(TENANT_SCOPED_TABLES).toContain('inquiries');
    expect(TENANT_SCOPED_TABLES).toContain('agent_runs');
    expect(TENANT_SCOPED_TABLES).toContain('evidence_logs');
  });

  it('does not include global root tables', () => {
    expect(TENANT_SCOPED_TABLES).not.toContain('tenants');
    expect(GLOBAL_TABLES).toContain('tenants');
  });
});
