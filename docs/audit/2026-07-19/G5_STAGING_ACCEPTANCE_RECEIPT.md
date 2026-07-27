# G5 — Staging Acceptance Receipt

## Date: 2026-07-19
## Status: PARTIAL — Infrastructure provisioned, deployment pending wrangler API token

## G5.1 — Staging Infrastructure Provisioned

### D1 Staging Databases Created
| Database | UUID | Purpose |
|----------|------|---------|
| omdala-global-staging | 643b4782-e486-4acf-883a-5a5b90161565 | Global metadata, tenants, countries |
| omdala-vn-staging | 55cf44a7-2685-4b4c-8a39-dfac43d349fb | Vietnam pilot data |
| omdala-auth-staging | 277e770f-536f-4814-98fb-3df7c63d65f2 | Auth.js users, sessions |
| omdala-audit-staging | 1f2e0b16-7267-441b-9a48-34fe20a0026b | Audit logs, evidence |

### Pages Projects Created
| Project | Subdomain | DNS CNAME | Status |
|---------|-----------|-----------|--------|
| omdala-web | omdala-web-5iv.pages.dev | omdala.com | CREATED |
| omdala-admin | omdala-admin-90l.pages.dev | admin.omdala.com | CREATED |
| omdala-app | omdala-app-1wr.pages.dev | app.omdala.com | CREATED |
| omdala-auth | omdala-auth-4nn.pages.dev | auth.omdala.com | CREATED |
| omdala-docs | (already exists) | docs.omdala.com | EXISTS |

### DNS Configuration (omdala.com zone)
| Record | Type | Target | Status |
|--------|------|--------|--------|
| omdala.com | CNAME | omdala-web.pages.dev | CONFIGURED |
| api.omdala.com | A | 192.0.2.1 (Worker) | CONFIGURED |
| admin.omdala.com | CNAME | omdala-admin.pages.dev | CONFIGURED |
| app.omdala.com | CNAME | omdala-app.pages.dev | CONFIGURED |
| auth.omdala.com | CNAME | omdala-auth.pages.dev | CONFIGURED |
| docs.omdala.com | CNAME | omdala-docs.pages.dev | CONFIGURED |
| api-staging.omdala.com | AAAA | 100:: (Worker) | CONFIGURED |

### AUTH-001 Root Cause Identified
auth.omdala.com was returning semantic 404 because the Pages project `omdala-auth` did not exist. Now created. Deployment of apps/auth build output will fix this.

### Existing Cloudflare Resources (OMDALA-related)
| Type | Name | Notes |
|------|------|-------|
| Worker | omdala-api | Production API |
| Worker | omdala-api-staging | Staging API |
| Worker | omdalat-brand-renderer | Brand renderer (old naming) |
| Worker | omdalat-platforms-api | Platform API (old naming) |
| D1 | omdalat-core | Old core DB (eab4c371...) |
| D1 | dreams-om-dalat-db | Old DB |
| D1 | omdala-omniverse | Omniverse DB |
| R2 | omdalat-assets | Asset bucket |
| Pages | omdalat-web | Old web Pages (omdalat.com) |
| Pages | omdalat-app-v2 | Old app Pages |

### Naming Inconsistency Found
- DNS points to `omdala-*.pages.dev` (without 't')
- Old Pages projects use `omdalat-*` (with 't')
- New Pages projects created with correct `omdala-*` naming
- Old `omdalat-*` projects should be archived after migration

---

## G5.2-G5.4 — PENDING (requires wrangler deployment)

### Blocked by:
- CLOUDFLARE_API_TOKEN not available for wrangler CLI
- Need to deploy build artifacts to Pages projects
- Need to run D1 migrations
- Need to configure Worker bindings (D1, KV, R2)

### Deployment checklist (to execute with wrangler):
1. `wrangler pages deploy apps/web/out --project-name omdala-web`
2. `wrangler pages deploy apps/admin/out --project-name omdala-admin`
3. `wrangler pages deploy apps/app/out --project-name omdala-app`
4. `wrangler pages deploy apps/auth/out --project-name omdala-auth`
5. `wrangler pages deploy apps/docs/out --project-name omdala-docs`
6. `wrangler d1 migrations apply omdala-global-staging`
7. `wrangler d1 migrations apply omdala-vn-staging`
8. `wrangler d1 migrations apply omdala-auth-staging`
9. `wrangler d1 migrations apply omdala-audit-staging`

### Verification checklist (post-deploy):
- [ ] omdala.com serves web app
- [ ] api.omdala.com returns health check
- [ ] auth.omdala.com serves login page (AUTH-001 fixed)
- [ ] app.omdala.com serves dashboard
- [ ] admin.omdala.com serves admin panel
- [ ] docs.omdala.com serves documentation
- [ ] Auth.js login/logout works
- [ ] Tenant isolation enforced
- [ ] D1 migrations applied
- [ ] Bilingual content (VI/EN) displays
- [ ] Mobile layouts render
- [ ] Audit logs recording

### Restore drill (G5.4):
- [ ] Export staging D1 to R2
- [ ] Import from R2 to new D1
- [ ] Verify data integrity

---

## G5 Verdict
**PARTIAL PASS** — Infrastructure provisioned (4 D1 databases, 4 Pages projects). DNS configured. AUTH-001 root cause identified. Actual deployment blocked pending CLOUDFLARE_API_TOKEN for wrangler CLI.

## Next Steps
1. Founder provides CLOUDFLARE_API_TOKEN (scoped to Pages, D1, Workers)
2. Deploy build artifacts to Pages projects
3. Create and run D1 migrations
4. Run verification checklist
5. Run restore drill
6. Proceed to G6 (Founder production approval)
