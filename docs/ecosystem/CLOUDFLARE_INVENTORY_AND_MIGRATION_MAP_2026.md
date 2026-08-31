# Cloudflare Inventory & Migration Map 2026 (P0 — MANDATORY)

> **Status:** P0 — MUST COMPLETE BEFORE ANY INFRA BUILD  
> **Date:** 2026-06-05  
> **Scope:** All Cloudflare resources across 3 accounts  
> **Accounts:** f3f9... (primary), 9311... (secondary), 62d5... (tertiary)  
> **Owner:** Team A — Inventory  
> **Auditor:** Cascade AI

---

## Executive Summary

Before building `infra.omdala.com`, we must know what we have. This document inventories all Cloudflare resources and assigns each an action:

| Action | Meaning |
|--------|---------|
| **KEEP** | Active production, continue using |
| **MERGE** | Duplicate or overlapping, consolidate into one |
| **MIGRATE** | Moving to sovereign PostgreSQL, plan required |
| **ARCHIVE** | Stale but keep for compliance/history |
| **DELETE_LATER** | Ready for deletion, waiting for burn-in |
| **UNKNOWN** | Needs investigation |

**Rule:** No L1 build until every item below has an assigned action.

---

## 1. PAGES PROJECTS (58 projects)

| # | Project | Custom Domain | Last Modified | Action | Notes |
|---|---------|---------------|---------------|--------|-------|
| 1 | `muonnoi` | `muonnoi.org`, `www.muonnoi.org` | 4h ago | **KEEP** | Root platform |
| 2 | `plays-muonnoi` | `plays.muonnoi.org` | 4h ago | **KEEP** | Active games |
| 3 | `app-muonnoi-org` | `app.muonnoi.org` | 2w ago | **KEEP** | App portal |
| 4 | `cuocsong-muonnoi-org` | `cuocsong.muonnoi.org` | 3w ago | **KEEP** | Lifestyle |
| 5 | `hoctap-muonnoi-org` | `hoctap.muonnoi.org` | 4h ago | **KEEP** | Education |
| 6 | `dulich-muonnoi-org` | — | 4h ago | **MIGRATE** | Add `dulich.muonnoi.org` domain |
| 7 | `nguoiviet-muonnoi-org` | `nguoiviet.muonnoi.org` | 3w ago | **KEEP** | Vietnamese community |
| 8 | `docs-muonnoi-org` | `docs.muonnoi.org` | 3w ago | **KEEP** | Documentation |
| 9 | `muonnoi-node` | `node.muonnoi.org` | 3mo ago | **KEEP** | Node network |
| 10 | `muon-noi-landingpage` | — | 4h ago | **MERGE** | Typo duplicate of `muonnoi`? |
| 11 | `tranhatam-public` | `tranhatam.com`, `www.tranhatam.com` | 18h ago | **KEEP** | Main site |
| 12 | `tranhatam-dashboard` | `dashboard.tranhatam.com` | 18h ago | **KEEP** | Dashboard |
| 13 | `tranhatam-admin` | `admin.tranhatam.com` | 1mo ago | **KEEP** | Admin panel |
| 14 | `web-tranhatam-com` | `ai-gateway.tranhatam.com` | 2d ago | **KEEP** | AI gateway |
| 15 | `life-tranhatam-com` | `life.tranhatam.com` | 3mo ago | **KEEP** | Life data |
| 16 | `deepfake-tranhatam-com` | `deepfake.tranhatam.com` | 3mo ago | **KEEP** | Deepfake detection |
| 17 | `life-data-vault-tranhatam-com` | `life.data.tranhatam.com` | 3mo ago | **KEEP** | Data vault |
| 18 | `chungthuc-proof-capsule` | `proof.tranhatam.com` | 4w ago | **KEEP** | Proof system |
| 19 | `lifeweave-ai-landing` | `lifeweave-ai.tranhatam.com` | 3mo ago | **KEEP** | AI landing |
| 20 | `nhachung-landing` | `nhachung.org`, `www.nhachung.org` | 2w ago | **KEEP** | Nhachung main |
| 21 | `nhachung-org` | — | 4w ago | **MERGE** | Into `nhachung-landing` |
| 22 | `app-nhachung-org` | — | 3w ago | **MERGE** | Into `nhachung-landing` |
| 23 | `nhachung-www` | — | 3w ago | **MERGE** | Into `nhachung-landing` |
| 24 | `nhachung-org-mxh-testgpt` | — | 3mo ago | **DELETE_LATER** | Test project |
| 25 | `nhachung-org-mxh-testgrok` | — | 3mo ago | **DELETE_LATER** | Test project |
| 26 | `omdalat-web` | `omdalat.com` | 3w ago | **KEEP** | Omdala city |
| 27 | `web-lactiendalat-com` | `lactiendalat.com` | 2w ago | **KEEP** | Lactien Dalat |
| 28 | `omcode` | `omcode.omdala.com` | 4d ago | **KEEP** | Code platform |
| 29 | `tueban-web` | — | 2w ago | **KEEP** | Tueban |
| 30 | `aiaccountingloop-com` | — | 1d ago | **MIGRATE** | Move to sovereign |
| 31 | `nguyenlananh-com` | — | 2d ago | **KEEP** | Personal |
| 32 | `angeledutamfoundation` | `angeledutamfoundation.com` | 3w ago | **KEEP** | Foundation |
| 33 | `vetuonglai-invest` | — | 1d ago | **KEEP** | Investment |
| 34 | `vetuonglai-life` | — | 1d ago | **KEEP** | Life |
| 35 | `vetuonglai-hub` | — | 1d ago | **KEEP** | Hub |
| 36 | `phiasaumannhung-com` | — | 2mo ago | **UNKNOWN** | Needs review |
| 37 | `duongsaotoasang-web` | — | 2w ago | **KEEP** | Duong Sao Toa Sang |
| 38 | `duongsaotoasang-com-v2` | — | 2w ago | **MERGE** | Into `duongsaotoasang-web`? |
| 39 | `maytinhai-os` | — | 3d ago | **MIGRATE** | Map `app.maytinhai.org` |
| 40 | `maytinhai-marketing` | — | 2d ago | **MIGRATE** | Map `maytinhai.org` |
| 41 | `omdala-app` | — | 2w ago | **KEEP** | Omdala app |
| 42 | `omdala-web` | — | 2w ago | **KEEP** | Omdala web |
| 43 | `iai-flow-frontend` | — | 2w ago | **KEEP** | IAI Flow |
| 44 | `iai-dash` | `dash.iai.one` | 3w ago | **KEEP** | Dashboard |
| 45 | `label-iai-one` | `label.iai.one` | 2w ago | **KEEP** | Label system |
| 46 | `trust-iai-one` | `trust.iai.one` | 2w ago | **KEEP** | Trust system |
| 47 | `docs-iai-one` | `docs.iai.one` | 2w ago | **KEEP** | Documentation |
| 48 | `nft-iai-one` | `nft.iai.one` | 2mo ago | **KEEP** | NFT |
| 49 | `life-iai-one` | `life.iai.one` | 1mo ago | **KEEP** | Life |
| 50 | `noos-iai-one` | `noos.iai.one` | 1mo ago | **KEEP** | Noos |
| 51 | `aiagent-iai-one` | — | 1w ago | **MIGRATE** | To sovereign agent control plane |
| 52 | `computer-iai-one` | — | 1w ago | **MIGRATE** | To sovereign PostgreSQL |
| 53 | `muonnoi-org` | — | 3mo ago | **DELETE_LATER** | Abandoned |
| 54 | `ai-muonnoi-org-main-acct` | — | 1w ago | **UNKNOWN** | Test deploy? |
| 55 | `tranhatam-marketing` | — | 2d ago | **MERGE** | Into `tranhatam-public`? |
| 56 | `duong-sao-toa-sang-admin` | — | 3mo ago | **ARCHIVE** | Stale admin |
| 57 | `omdala-docs` | — | 2mo ago | **ARCHIVE** | Stale docs |
| 58 | `visamuonnoi-org` | — | 3mo ago | **UNKNOWN** | Needs review |
| 59 | `visamuonnoi-org-web` | — | 3mo ago | **UNKNOWN** | Needs review |

### Pages Action Summary
| Action | Count |
|--------|-------|
| KEEP | 38 |
| MERGE | 5 |
| MIGRATE | 5 |
| ARCHIVE | 2 |
| DELETE_LATER | 4 |
| UNKNOWN | 5 |

---

## 2. D1 DATABASES (20 databases)

| # | Database | UUID | Size | Tables | Action | Notes |
|---|----------|------|------|--------|--------|-------|
| 1 | `tranhatam-core` | `0165...` | 3.7 MB | 0* | **MIGRATE** | 3.8 MB, likely has tables |
| 2 | `iai-flow-db` | `3cea...` | 1.5 MB | 0* | **MIGRATE** | Check if duplicate with `iai-flow-core-prod` |
| 3 | `iai-flow-core-prod` | `912d...` | 396 KB | 0* | **MIGRATE** | |
| 4 | `iai-flow-core-preview` | `f489...` | 380 KB | 0* | **ARCHIVE** | Preview, check if still needed |
| 5 | `pay-iai-one-prod` | `e3cb...` | 549 KB | 0* | **MIGRATE** | Payment system |
| 6 | `pay-iai-one-staging` | `21a8...` | 224 KB | 0* | **ARCHIVE** | Staging |
| 7 | `pay-iai-one-sandbox` | `3395...` | 360 KB | 0* | **ARCHIVE** | Sandbox |
| 8 | `omdala-omniverse` | `4bff...` | 196 KB | 0* | **MIGRATE** | |
| 9 | `omdalat-core` | `eab4...` | 148 KB | 0* | **MIGRATE** | |
| 10 | `cf-d1-dsts-content-prod` | `de52...` | 236 KB | 0* | **MIGRATE** | |
| 11 | `life-code-db` | `6bbd...` | 244 KB | 0* | **MIGRATE** | |
| 12 | `nguyenlananh-payments-prod` | `2f3a...` | 140 KB | 0* | **MIGRATE** | |
| 13 | `lamviec-muonnoi-org-prod` | `d47f...` | 140 KB | 0* | **MIGRATE** | |
| 14 | `trust_iai_one_db` | `cbbd...` | 96 KB | 0* | **MIGRATE** | |
| 15 | `NHACHUNG_DB` | `3fb5...` | 48 KB | 0* | **MIGRATE** | |
| 16 | `aiagent-registry` | `b412...` | 72 KB | 0* | **MIGRATE** | |
| 17 | `muonnoi_db` | `2106...` | 65 KB | 0* | **MIGRATE** | |
| 18 | `maytinhai-public` | `ce42...` | 12 KB | 0* | **MIGRATE** | |
| 19 | `audit-binder-prod` | `3f27...` | 12 KB | 0* | **MIGRATE** | |
| 20 | `reconciliation-prod` | `a74c...` | 12 KB | 0* | **MIGRATE** | |

*Note: `num_tables: 0` from `wrangler d1 list` may be an API limitation. Verify with SQL query: `SELECT COUNT(*) FROM sqlite_master WHERE type='table';`

### D1 Migration Priority
| Priority | Database | Target | Strategy |
|----------|----------|--------|----------|
| P1 | `tranhatam-core` | Sovereign PostgreSQL | First — largest |
| P2 | `iai-flow-db`, `iai-flow-core-prod` | Sovereign PostgreSQL | Consolidate if duplicate |
| P3 | `pay-iai-one-prod` | Sovereign PostgreSQL | Payment data, high risk |
| P4 | `muonnoi_db`, `maytinhai-public` | Sovereign PostgreSQL | Core platforms |
| P5 | Others | Sovereign PostgreSQL | Batch migration |

---

## 3. R2 BUCKETS (18 buckets)

| # | Bucket | Created | Action | Notes |
|---|--------|---------|--------|-------|
| 1 | `tranhatam-assets` | 2026-03-25 | **KEEP** | Primary |
| 2 | `iai-flow-files` | 2026-03-13 | **KEEP** | Primary |
| 3 | `maytinhai-files` | 2026-05-31 | **KEEP** | Primary |
| 4 | `maytinhai-evidence` | 2026-05-31 | **KEEP** | Primary |
| 5 | `muonnoi-media` | 2026-03-01 | **KEEP** | Primary |
| 6 | `r2-muonnoi-uploads` | 2026-02-03 | **MERGE** | Into `muonnoi-media`? |
| 7 | `lamviecmuonnoi-assets` | 2026-05-17 | **KEEP** | |
| 8 | `lamviec-muonnoi-org-assets` | 2026-04-15 | **MERGE** | Into `lamviecmuonnoi-assets`? |
| 9 | `nhachung-assets` | 2026-02-01 | **KEEP** | |
| 10 | `tueban-media` | 2026-03-08 | **KEEP** | |
| 11 | `vetuonglai-edu-media` | 2026-02-03 | **KEEP** | |
| 12 | `iai-media` | 2026-03-23 | **KEEP** | |
| 13 | `iai-media-preview` | 2026-03-23 | **ARCHIVE** | Preview |
| 14 | `edu-docs` | 2026-02-03 | **KEEP** | |
| 15 | `edu-media` | 2026-02-03 | **KEEP** | |
| 16 | `cf-r2-dsts-media-prod` | 2026-03-07 | **KEEP** | |
| 17 | `aiagent-files` | 2026-05-22 | **KEEP** | |
| 18 | `audit-binders-prod` | 2026-06-03 | **KEEP** | New |

### R2 Action Summary
| Action | Count |
|--------|-------|
| KEEP | 15 |
| MERGE | 2 |
| ARCHIVE | 1 |

---

## 4. QUEUES (20 queues)

| # | Queue | Producers | Consumers | Action | Notes |
|---|-------|-----------|-----------|--------|-------|
| 1 | `tranhatam-automation` | 3 | 1 | **KEEP** | Active |
| 2 | `tueban-ledger-queue` | 1 | 1 | **KEEP** | Active |
| 3 | `accounting-event-jobs` | 0 | 1 | **KEEP** | Active |
| 4 | `audit-binder-jobs` | 0 | 1 | **KEEP** | Active |
| 5 | `binder-generator-jobs` | 0 | 1 | **KEEP** | Active |
| 6 | `entity-setup-jobs` | 0 | 1 | **KEEP** | Active |
| 7 | `filing-submission-jobs` | 0 | 1 | **KEEP** | Active |
| 8 | `import-batch-jobs` | 0 | 1 | **KEEP** | Active |
| 9 | `ocr-worker-jobs` | 0 | 1 | **KEEP** | Active |
| 10 | `parser-dispatch-jobs` | 0 | 1 | **KEEP** | Active |
| 11 | `reporting-jobs` | 0 | 1 | **KEEP** | Active |
| 12 | `lamviecmuonnoi-email` | 1 | 0 | **MERGE** | Into `lamviec-muonnoi-org-email` |
| 13 | `lamviecmuonnoi-nft-verify` | 1 | 0 | **MERGE** | Into `lamviec-muonnoi-org-nft-verify` |
| 14 | `lamviec-muonnoi-org-email` | 1 | 0 | **MERGE** | Into `lamviecmuonnoi-email` |
| 15 | `lamviec-muonnoi-org-nft-verify` | 1 | 0 | **MERGE** | Into `lamviecmuonnoi-nft-verify` |
| 16 | `lamviec-muonnoi-org-payment` | 1 | 0 | **MERGE** | Into `lamviecmuonnoi-payment` |
| 17 | `lamviecmuonnoi-payment` | 1 | 0 | **MERGE** | Into `lamviec-muonnoi-org-payment` |
| 18 | `lamviec-muonnoi-org-points` | 1 | 0 | **MERGE** | Into `lamviecmuonnoi-points` |
| 19 | `lamviecmuonnoi-points` | 1 | 0 | **MERGE** | Into `lamviec-muonnoi-org-points` |
| 20 | `lamviec-muonnoi-org-payment` | 1 | 0 | **MERGE** | Duplicate? |

### Queue Action Summary
| Action | Count |
|--------|-------|
| KEEP | 11 |
| MERGE | 8 |
| DELETE_LATER | 0 |

---

## 5. KV NAMESPACES (28 namespaces)

| # | Namespace | Action | Notes |
|---|-----------|--------|-------|
| 1 | `nft-iai-one-trust-prod` | **KEEP** | Prod |
| 2 | `nft-iai-one-trust-preview` | **ARCHIVE** | Preview |
| 3 | `iai-cache` | **KEEP** | |
| 4 | `iai-cache-preview` | **ARCHIVE** | Preview |
| 5 | `IAI_FLOW_CACHE` | **MERGE** | Casing duplicate of `iai-flow-cache` |
| 6 | `iai-flow-cache` | **KEEP** | Canonical |
| 7 | `iai-flow-cache-preview` | **ARCHIVE** | Preview |
| 8 | `IAI_FLOW_CACHE_preview` | **MERGE** | Casing duplicate of `iai-flow-cache-preview` |
| 9 | `iai-flow-rate-limits` | **KEEP** | |
| 10 | `iai-flow-rate-limits-preview` | **ARCHIVE** | Preview |
| 11 | `iai-flow-sessions` | **KEEP** | |
| 12 | `iai-flow-sessions-preview` | **ARCHIVE** | Preview |
| 13 | `iai-sessions` | **KEEP** | |
| 14 | `iai-sessions-preview` | **ARCHIVE** | Preview |
| 15 | `session-cache` | **KEEP** | MaytinhAI |
| 16 | `MUONNOI_KV` | **KEEP** | |
| 17 | `VMN_SESSIONS` | **KEEP** | |
| 18 | `NHACHUNG_CFG` | **KEEP** | |
| 19 | `INVEST_CFG` | **KEEP** | |
| 20 | `ORDERS_KV` | **KEEP** | |
| 21 | `AIAGENT_MEMORY` | **KEEP** | |
| 22 | `AIAGENT_MEMORY_preview` | **ARCHIVE** | Preview |
| 23 | `DB` | **UNKNOWN** | Vague name, needs investigation |
| 24 | `EDU_DB` | **KEEP** | |
| 25 | `EDU-DOCS` | **KEEP** | |
| 26 | `EDU-MEDIA` | **KEEP** | |
| 27 | `production-ADMIN_STATE` | **KEEP** | |

### KV Critical Finding
| Issue | Namespaces | Action |
|-------|------------|--------|
| Casing duplicates | `IAI_FLOW_CACHE` vs `iai-flow-cache` | **MERGE**: audit code bindings, delete 2 |
| Vague name | `DB` | **UNKNOWN**: investigate which project owns this |
| Preview bloat | 8 preview namespaces | **ARCHIVE**: check if still referenced |

---

## 6. HYPERDRIVE (1 config)

| # | Name | Host | Port | Database | Action | Notes |
|---|------|------|------|----------|--------|-------|
| 1 | `omdala-postgres-f3f9` | `mail.iai.one` | 5432 | `omdala_prod` | **AUDIT** | Verify connection, credentials, schema |

### Hyperdrive Action Required
- [ ] Verify connection string works from CF Worker
- [ ] Check if `mail.iai.one` hostname is correct (unusual for PostgreSQL)
- [ ] Audit existing schemas and tables
- [ ] Verify `omdala_api` user permissions
- [ ] Test failover / reconnection behavior
- [ ] Document in `infra/README.md`

---

## 7. WORKERS (not listed by wrangler, but inferred from wrangler.toml)

| # | Worker (wrangler `name`) | Domain | Action | Notes |
|---|---------------------------|--------|--------|-------|
| 1 | `ai-muonnoi-api` | `api.muonnoi.org` | **MIGRATE** | To sovereign + CF hybrid |
| 2 | `maytinhai-gen2-api` | — | **KEEP** | MaytinhAI API |
| 3 | `nhachung-api` | — | **MIGRATE** | To sovereign |
| 4 | `verify-runtime` | — | **UNKNOWN** | `database_id = REPLACE_AFTER_CREATE` |
| 5 | `iai-flow-api` | `api.flow.iai.one` | **MIGRATE** | To sovereign |
| 6 | `tranhatam-platforms-api` | `api.tranhatam.com` | **KEEP** | Keep CF, bridge to sovereign |
| 7 | `app-iai-one-worker` | — | **UNKNOWN** | `database_id = your-d1-id` placeholder |
| 8 | `nft-iai-one` | — | **KEEP** | R2 + KV |

---

## 8. MIGRATION MAP

### By System

| System | Pages | Workers | D1 | R2 | KV | Queues | Migration Order |
|--------|-------|---------|----|----|----|--------|-----------------|
| `aiagent.iai.one` | `aiagent-iai-one` | `ai-muonnoi-api` | `iai-flow-db` | `iai-flow-files` | `AIAGENT_MEMORY` | — | **1st** |
| `computer.iai.one` | `computer-iai-one` | — | — | — | — | — | **2nd** |
| `maytinhai.org` | `maytinhai-marketing`, `maytinhai-os` | `maytinhai-gen2-api` | `maytinhai-public` | `maytinhai-files`, `maytinhai-evidence` | `session-cache` | — | **3rd** |
| `tranhatam.com` | `tranhatam-public`, `tranhatam-dashboard` | `tranhatam-platforms-api` | `tranhatam-core` | `tranhatam-assets` | — | `tranhatam-automation` | **4th** |
| `aiaccountingloop.com` | `aiaccountingloop-com` | Multiple | `audit-binder-prod`, `reconciliation-prod` | `audit-binders-prod` | — | `accounting-event-jobs`, etc. | **5th** |

---

## 9. P0 COMPLETION CHECKLIST

Before any L1 build, confirm:

- [ ] All 58 Pages projects have assigned action
- [ ] All 20 D1 databases have assigned action
- [ ] All 18 R2 buckets have assigned action
- [ ] All 20 queues have assigned action
- [ ] All 27 KV namespaces have assigned action
- [ ] Hyperdrive `omdala-postgres-f3f9` audited and documented
- [ ] `CLOUDFLARE_INVENTORY_AND_MIGRATION_MAP_2026.md` committed to git
- [ ] Founder approved inventory and migration order
- [ ] First backup of all D1 databases completed
- [ ] `backup-index.json` exists with checksums

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-05  
**Next Gate:** Founder sign-off on inventory → L1 build authorized
