import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import {
  assertSameTenant,
  assertTenantId,
  isTenantScopedTable,
  listTenantScopedTables,
  TenantScopeError,
  withTenantFilter,
} from "./tenant-isolation";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const globalMigration = readFileSync(
  join(repoRoot, "infra/d1/migrations-global/0001_brand_factory_global.sql"),
  "utf8",
);

function extractCreateTables(sql: string): string[] {
  const matches = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/gi)];
  return matches.map((m) => m[1].toLowerCase());
}

describe("tenant isolation helpers", () => {
  it("rejects missing tenant_id", () => {
    expect(() => assertTenantId("")).toThrow(TenantScopeError);
    expect(() => assertTenantId(undefined)).toThrow(TenantScopeError);
  });

  it("blocks cross-tenant access", () => {
    expect(() => assertSameTenant("tenant-a", "tenant-b", "brand")).toThrow(
      TenantScopeError,
    );
    expect(() => assertSameTenant("tenant-a", "tenant-a")).not.toThrow();
  });

  it("adds tenant filter to SQL", () => {
    expect(withTenantFilter("SELECT * FROM brands", "t1")).toBe(
      "SELECT * FROM brands WHERE tenant_id = ?",
    );
    expect(withTenantFilter("SELECT * FROM brands WHERE status = ?", "t1")).toBe(
      "SELECT * FROM brands WHERE status = ? AND tenant_id = ?",
    );
    expect(withTenantFilter("SELECT * FROM brands b", "t1", "b")).toBe(
      "SELECT * FROM brands b WHERE b.tenant_id = ?",
    );
  });

  it("knows tenant-scoped tables", () => {
    expect(isTenantScopedTable("brands")).toBe(true);
    expect(isTenantScopedTable("tenants")).toBe(false);
    expect(listTenantScopedTables()).toContain("inquiries");
  });
});

describe("D1 migration tenant isolation (schema)", () => {
  const tables = extractCreateTables(globalMigration);

  it("defines all 20 Brand Factory entities", () => {
    const expected = [
      "tenants",
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
    ];
    for (const name of expected) {
      expect(tables).toContain(name);
    }
    expect(tables.length).toBe(20);
  });

  it("requires tenant_id on every scoped business table", () => {
    const rootOnly = new Set(["tenants"]);
    for (const table of tables) {
      if (rootOnly.has(table)) continue;
      const pattern = new RegExp(
        `CREATE TABLE IF NOT EXISTS ${table}[\\s\\S]*?tenant_id`,
        "i",
      );
      expect(globalMigration).toMatch(pattern);
    }
  });

  it("creates tenant_id indexes for scoped tables", () => {
    const indexStatements = [...globalMigration.matchAll(/CREATE INDEX[^;]+/gi)].map(
      (m) => m[0].toLowerCase(),
    );
    for (const table of listTenantScopedTables()) {
      if (!tables.includes(table)) continue;
      const hasTenantIndex = indexStatements.some(
        (stmt) => stmt.includes(table) && stmt.includes("tenant_id"),
      );
      expect(hasTenantIndex, `missing tenant_id index for ${table}`).toBe(true);
    }
  });
});
