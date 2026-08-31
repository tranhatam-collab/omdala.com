# G6.3-G6.4 — Deployment and Rollback Anchor Plan

## Date: 2026-07-19
## Status: PLAN — execution pending condition fulfillment

## G6.3 — Serial Deployment Plan

### Deployment order (serial, with smoke checks after each):
1. **omdala-web** (Pages)
   - Deploy: `wrangler pages deploy apps/web/out --project-name omdala-web`
   - Smoke: `curl -sI https://omdala.com | head -5`
   - Semantic: verify homepage renders, bilingual toggle works

2. **omdala-auth** (Pages)
   - Deploy: `wrangler pages deploy apps/auth/out --project-name omdala-auth`
   - Smoke: `curl -sI https://auth.omdala.com | head -5`
   - Semantic: verify login page renders (AUTH-001 fix)

3. **omdala-app** (Pages)
   - Deploy: `wrangler pages deploy apps/app/out --project-name omdala-app`
   - Smoke: `curl -sI https://app.omdala.com | head -5`
   - Semantic: verify dashboard renders

4. **omdala-admin** (Pages)
   - Deploy: `wrangler pages deploy apps/admin/out --project-name omdala-admin`
   - Smoke: `curl -sI https://admin.omdala.com | head -5`
   - Semantic: verify admin panel renders

5. **omdala-docs** (Pages)
   - Deploy: `wrangler pages deploy apps/docs/out --project-name omdala-docs`
   - Smoke: `curl -sI https://docs.omdala.com | head -5`
   - Semantic: verify docs render

6. **omdala-api** (Worker)
   - Deploy: `wrangler deploy`
   - Smoke: `curl -s https://api.omdala.com/health`
   - Semantic: verify API responds with health status

### Post-deployment checks:
- All surfaces return HTTP 200
- No semantic 404s (content matches route)
- Bilingual content renders (VI/EN)
- Auth flow works (login → session → logout)
- D1 queries return data
- Audit logs recording

## G6.4 — Release and Rollback Anchor

### Release Anchor
| Field | Value |
|-------|-------|
| Release SHA | 00690da6ddb851965d6a45c0e82e19ef841d7f6f |
| Branch | feat/pricing-promo-engine |
| Approval date | 2026-07-19 |
| Approval type | APPROVED WITH CONDITIONS |
| Approved by | Founder (tranhatam) |
| Cloudflare account | f3f9e76222dcb488d5e303e29e8ba192 |

### Rollback Anchor
| Field | Value |
|-------|-------|
| Previous state | Unknown (no verifiable prior deployment) |
| Rollback method | Redeploy previous Pages deployment via Cloudflare dashboard |
| D1 rollback | Reverse migration or restore from R2 backup |
| Worker rollback | `wrangler deployments rollback` |
| Rollback trigger | Any P0/P1 in smoke checks |
| RTO | 1 hour |
| RPO | 24 hours |

### D1 Staging Databases (provisioned)
| Database | UUID |
|----------|------|
| omdala-global-staging | 643b4782-e486-4acf-883a-5a5b90161565 |
| omdala-vn-staging | 55cf44a7-2685-4b4c-8a39-dfac43d349fb |
| omdala-auth-staging | 277e770f-536f-4814-98fb-3df7c63d65f2 |
| omdala-audit-staging | 1f2e0b16-7267-441b-9a48-34fe20a0026b |

### Pages Projects (provisioned)
| Project | Subdomain |
|---------|-----------|
| omdala-web | omdala-web-5iv.pages.dev |
| omdala-admin | omdala-admin-90l.pages.dev |
| omdala-app | omdala-app-1wr.pages.dev |
| omdala-auth | omdala-auth-4nn.pages.dev |
| omdala-docs | (exists) |
