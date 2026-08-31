# D1 migrations — OMDALA Brand Factory

Migrations live in `migrations/`. **Do not apply to remote staging until Founder authorizes** (G5 gate).

## Databases (staging)

| Database | UUID | Migration files |
|----------|------|-----------------|
| `omdala-global-staging` | `643b4782-e486-4acf-883a-5a5b90161565` | `migrations-global/0001_brand_factory_global.sql` |
| `omdala-auth-staging` | `277e770f-536f-4814-98fb-3df7c63d65f2` | `migrations-auth/0002_auth_schema.sql` |
| `omdala-audit-staging` | `1f2e0b16-7267-441b-9a48-34fe20a0026b` | `migrations-audit/0003_audit_schema.sql` |
| `omdala-vn-staging` | `55cf44a7-2685-4b4c-8a39-dfac43d349fb` | country partition (future) |

## Local validation

```bash
pnpm run test:d1
```

## Remote apply (Founder-approved only)

```bash
cd infra/d1
npx wrangler d1 migrations apply omdala-global-staging --remote
npx wrangler d1 migrations apply omdala-auth-staging --remote
npx wrangler d1 migrations apply omdala-audit-staging --remote
```

## Tenant isolation

Every tenant-scoped table includes `tenant_id` + index. Application code must use `withTenantFilter()` from `@omdala/core` (see `tenant-isolation.test.ts`).
