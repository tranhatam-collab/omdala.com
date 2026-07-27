/**
 * Tenant isolation tests.
 *
 * D1 (SQLite) has NO Row-Level Security. Tenant isolation is enforced
 * at the application layer via guard.ts. These tests verify that:
 *
 * 1. Tenant-scoped queries without tenant_id filter are rejected
 * 2. Superadmin can bypass tenant filter (with audit)
 * 3. Cross-tenant access by non-superadmin is rejected
 * 4. withTenantFilter injects tenant_id correctly
 */
import { describe, it, expect } from 'vitest';
import {
  assertTenantFilter,
  withTenantFilter,
  validateTenantAccess,
  TenantIsolationError,
  TENANT_SCOPED_TABLES,
  type TenantContext,
} from './guard';

const ownerCtx: TenantContext = {
  tenantId: 'tenant-vn',
  role: 'owner',
  userId: 'user-1',
};

const superadminCtx: TenantContext = {
  tenantId: 'tenant-global',
  role: 'superadmin',
  userId: 'admin-1',
};

describe('assertTenantFilter', () => {
  it('rejects tenant-scoped query without tenant_id', () => {
    expect(() =>
      assertTenantFilter('SELECT * FROM brand WHERE name = ?', ownerCtx),
    ).toThrow(TenantIsolationError);
  });

  it('allows tenant-scoped query with tenant_id', () => {
    expect(() =>
      assertTenantFilter('SELECT * FROM brand WHERE tenant_id = ? AND name = ?', ownerCtx),
    ).not.toThrow();
  });

  it('allows superadmin to bypass tenant filter', () => {
    expect(() =>
      assertTenantFilter('SELECT * FROM brand WHERE name = ?', superadminCtx),
    ).not.toThrow();
  });

  it('allows global table queries without tenant_id', () => {
    expect(() =>
      assertTenantFilter('SELECT * FROM country WHERE id = ?', ownerCtx),
    ).not.toThrow();
  });

  it('rejects INSERT into tenant-scoped table without tenant_id', () => {
    expect(() =>
      assertTenantFilter('INSERT INTO brand (name) VALUES (?)', ownerCtx),
    ).toThrow(TenantIsolationError);
  });

  it('allows INSERT into tenant-scoped table with tenant_id', () => {
    expect(() =>
      assertTenantFilter('INSERT INTO brand (tenant_id, name) VALUES (?, ?)', ownerCtx),
    ).not.toThrow();
  });

  it('rejects UPDATE on tenant-scoped table without tenant_id', () => {
    expect(() =>
      assertTenantFilter('UPDATE brand SET name = ? WHERE id = ?', ownerCtx),
    ).toThrow(TenantIsolationError);
  });

  it('rejects DELETE on tenant-scoped table without tenant_id', () => {
    expect(() =>
      assertTenantFilter('DELETE FROM brand WHERE id = ?', ownerCtx),
    ).toThrow(TenantIsolationError);
  });
});

describe('withTenantFilter', () => {
  it('injects tenant_id into query without WHERE', () => {
    const result = withTenantFilter('SELECT * FROM brand', ownerCtx);
    expect(result.sql).toContain('WHERE tenant_id = ?');
    expect(result.params).toEqual(['tenant-vn']);
  });

  it('injects tenant_id into query with existing WHERE', () => {
    const result = withTenantFilter(
      'SELECT * FROM brand WHERE name = ?',
      ownerCtx,
    );
    expect(result.sql).toContain('tenant_id = ? AND');
    expect(result.params).toEqual(['tenant-vn']);
  });
});

describe('validateTenantAccess', () => {
  it('allows access to own tenant', () => {
    expect(() =>
      validateTenantAccess(ownerCtx, 'tenant-vn'),
    ).not.toThrow();
  });

  it('rejects cross-tenant access for owner', () => {
    expect(() =>
      validateTenantAccess(ownerCtx, 'tenant-th'),
    ).toThrow(TenantIsolationError);
  });

  it('allows cross-tenant access for superadmin', () => {
    expect(() =>
      validateTenantAccess(superadminCtx, 'tenant-vn'),
    ).not.toThrow();
    expect(() =>
      validateTenantAccess(superadminCtx, 'tenant-th'),
    ).not.toThrow();
  });
});

describe('TENANT_SCOPED_TABLES', () => {
  it('includes all tenant-scoped tables', () => {
    expect(TENANT_SCOPED_TABLES).toContain('brand');
    expect(TENANT_SCOPED_TABLES).toContain('place');
    expect(TENANT_SCOPED_TABLES).toContain('product');
    expect(TENANT_SCOPED_TABLES).toContain('experience');
    expect(TENANT_SCOPED_TABLES).toContain('inquiry');
    expect(TENANT_SCOPED_TABLES).toContain('site');
    expect(TENANT_SCOPED_TABLES).toContain('agent_run');
    expect(TENANT_SCOPED_TABLES).toContain('evidence_log');
  });

  it('does not include global tables', () => {
    expect(TENANT_SCOPED_TABLES).not.toContain('country');
    expect(TENANT_SCOPED_TABLES).not.toContain('user');
    expect(TENANT_SCOPED_TABLES).not.toContain('session');
  });
});
