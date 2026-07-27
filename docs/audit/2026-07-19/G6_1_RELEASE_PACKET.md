# G6.1 — Release Packet for Founder Approval

## Date: 2026-07-19
## Status: PRESENTED — awaiting Founder decision (G6.2)

---

## 1. Release SHA
- **Canonical commit:** `00690da6ddb851965d6a45c0e82e19ef841d7f6f`
- **Branch:** `feat/pricing-promo-engine`
- **Repository:** `git@github.com:tranhatam-collab/omdala.com.git`
- **Clean worktree:** `/Users/tranhatam/Documents/Devnewproject/omdala-audit-clean`

## 2. Build Evidence (G2)
| Check | Result |
|-------|--------|
| TypeScript (4 packages) | ALL PASS |
| Next.js build apps/web | PASS |
| Next.js build apps/app | PASS |
| Next.js build apps/docs | PASS |
| Next.js build apps/admin | PASS |
| Next.js build apps/auth | PASS |
| CI workflow | REPAIRED (npm ci → pnpm) |

## 3. Architecture Decisions (G1/G3)
| ADR | Decision |
|-----|----------|
| ADR-001 | Global platform with tenant hierarchy |
| ADR-002 | Global → Country → Province → City → LocalNode → Brand |
| ADR-003 | Cloudflare D1 only (no PostgreSQL) |
| ADR-004 | Cloudflare account: Tranhatam@gmail.com |
| ADR-005 | Auth.js (NextAuth) only |
| ADR-006 | OMCODE separate repo |

## 4. Security Baseline (G3)
- Threat model documented
- Least-privilege matrix defined (5 roles)
- Secret inventory completed (7 secrets identified)
- Tenant isolation via application-level filtering
- Backup strategy: D1 export to R2, daily

## 5. Product Architecture (G4)
- 20-entity domain model defined
- Vietnam pilot spec (HCMC, 10-20 brands)
- 10-country localization contract
- Compliance ownership for 10 countries
- Brand Factory: 1 renderer + theme tokens
- AI automation: 6 agents, human approval for publish

## 6. Staging Infrastructure (G5)
| Resource | Status |
|----------|--------|
| D1: omdala-global-staging | CREATED |
| D1: omdala-vn-staging | CREATED |
| D1: omdala-auth-staging | CREATED |
| D1: omdala-audit-staging | CREATED |
| Pages: omdala-web | CREATED |
| Pages: omdala-admin | CREATED |
| Pages: omdala-app | CREATED |
| Pages: omdala-auth | CREATED |
| DNS: omdala.com zone | CONFIGURED |

## 7. Known Risks
| Risk | Severity | Mitigation |
|------|----------|------------|
| 290 iCloud dataless files not hydrated | P2 | Re-snapshot after hydration |
| CLOUDFLARE_API_TOKEN not available | P0 | Founder provides scoped token |
| AUTH-001: auth.omdala.com was 404 | P1 | Pages project created, deploy fixes |
| Old omdalat-* Pages projects exist | P2 | Archive after migration |
| No D1 migrations created yet | P1 | Create from G4 domain model |
| Secret rotation not executed | P0 | Rotate before production deploy |
| pnpm-lock.yaml out of date | P2 | Run pnpm install to update |

## 8. Migration/Rollback Plan
### Migration:
1. Deploy build artifacts to Pages projects
2. Run D1 migrations (to be created from G4 domain model)
3. Configure Worker bindings (D1, KV, R2)
4. Verify each surface

### Rollback:
1. Pages: redeploy previous deployment via Cloudflare dashboard
2. D1: reverse migration or restore from R2 backup
3. Workers: redeploy previous version
4. DNS: CNAME can be repointed if needed

## 9. Staging Receipts
- G0 EXIT: Source identity established
- G1 EXIT: Governance lock complete
- G2 EXIT: Build/CI verified (5/5 builds PASS)
- G3 EXIT: Architecture/security baseline defined
- G4 EXIT: Product architecture defined
- G5: Infrastructure provisioned (4 D1, 4 Pages)

## 10. Backup/Restore Receipt
- **Backup:** Not yet executed (pending D1 migrations)
- **Restore drill:** Scheduled after first production data exists
- **Strategy:** `wrangler d1 export` → R2 → `wrangler d1 import`

---

## FOUNDER DECISION REQUIRED (G6.2)

**Question:** Do you approve production deployment of this release?

**Conditions:**
1. CLOUDFLARE_API_TOKEN must be provided for wrangler deployment
2. D1 migrations must be created and applied
3. Secret rotation must be completed
4. Staging verification (G5.2-G5.4) must pass

**Approval options:**
- APPROVE — proceed with deployment
- APPROVE WITH CONDITIONS — proceed after listed conditions met
- HOLD — do not deploy, address concerns first
- REJECT — do not deploy, restart from specific gate
